#!/usr/bin/env python3
import json
import hashlib
import subprocess
import requests
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from string import Template

try:
    from ollama import chat as ollama_chat
    _OLLAMA_AVAILABLE = True
except ImportError:
    _OLLAMA_AVAILABLE = False


# ─── Config ──────────────────────────────────────────────────────────────────

MAX_WORKERS = 3
MODEL = "qwen3.5:9b"
REPO_LIMIT = 100

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = ROOT / "site/src/assets/repositories.ts"
CACHE_FILE = Path(__file__).resolve().parent / ".repo-cache.json"

GH_FIELDS = [
    "name", "visibility", "description", "pushedAt", "url",
    "isFork", "isEmpty", "isArchived", "isTemplate",
    "stargazerCount", "primaryLanguage", "repositoryTopics",
]

VALID_TYPES = {
    "utility", "application", "framework", "library",
    "tooling", "research", "infrastructure",
    "ai", "cli", "plugin"
}

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

# ─── Prompt ──────────────────────────────────────────────────────────────────

PROMPT = Template("""
Extract structured metadata from the README.

JSON Structure:
{
    "keywords": [],
    "summary": "",
    "stack": [],
    "types": []
}

Rules:
- Output ONLY valid JSON
- keywords: 5-20 items
- summary: 1-3 sentences. Keep it short. Do NOT mention the product name, app name, company name, or any proper nouns.
  Describe only what it does and its purpose in a neutral, generic way.
- stack: technologies, languages, frameworks
- types must be 1-3 of: $types
- If unsure, choose "utility"

README:
$content
""")

# ─── TypeScript output template ───────────────────────────────────────────────

TS_TYPE = """\
export type RepoEntry = {
  repo: string;
  url: string;
  description: string;
  ollama_description: string;
  keywords: string[];
  stack: string[];
  types: string[];
  pushedAt: string;
  stars: number;
  primaryLanguage: string | null;
};\
"""

# ─── Helpers ─────────────────────────────────────────────────────────────────

def run_cmd(cmd: str) -> str:
    try:
        return subprocess.check_output(cmd, shell=True, text=True).strip()
    except subprocess.CalledProcessError as e:
        log.error(f"Command failed: {cmd}\n{e}")
        raise


def get_github_owner() -> str:
    log.info("Fetching GitHub username...")
    return run_cmd("gh api user -q .login")


def should_include(r: dict, owner: str) -> bool:
    return (
        r.get("visibility") == "PUBLIC"
        and r.get("name", "").lower() != owner.lower()
        and not r.get("isFork", True)
        and not r.get("isEmpty", True)
        and not r.get("isArchived", True)
        and not r.get("isTemplate", False)
    )


def fetch_repos(owner: str) -> list[tuple]:
    log.info(f"Fetching repositories for {owner}...")
    raw = run_cmd(f'gh repo list {owner} --limit {REPO_LIMIT} --json {",".join(GH_FIELDS)}')
    data = json.loads(raw)

    # print(data)
    repos = []
    for r in data:
        if not should_include(r, owner):
            log.debug(f"Skipping {r.get('name')} (filtered out)")
            continue

        lang_obj = r.get("primaryLanguage") or {}

        # gh repo list --json returns repositoryTopics as a plain list of nodes
        topics_raw = r.get("repositoryTopics") or []
        if isinstance(topics_raw, dict):
            topics_raw = topics_raw.get("nodes", [])
        topics = [n["topic"]["name"] for n in topics_raw if "topic" in n]

        repos.append((
            r["name"],
            (r.get("description") or "").strip(),
            r.get("url") or f"https://github.com/{owner}/{r['name']}",
            r.get("pushedAt") or "",
            r.get("stargazerCount") or 0,
            lang_obj.get("name") if lang_obj else None,
            topics,
        ))

    log.info(f"Found {len(repos)} public repositories to process")
    return repos


def fetch_readme(owner: str, repo: str) -> str | None:
    for branch in ("main", "master"):
        url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                return res.text
        except requests.RequestException as e:
            log.warning(f"{repo}: README fetch failed ({url}) → {e}")
    log.warning(f"{repo}: No README found")
    return None


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def is_ollama_online() -> bool:
    if not _OLLAMA_AVAILABLE:
        log.info("ollama package not installed — skipping LLM enrichment")
        return False
    try:
        res = requests.get("http://localhost:11434", timeout=3)
        return res.status_code == 200
    except requests.RequestException:
        log.info("Ollama not reachable — skipping LLM enrichment")
        return False


def query_llm(readme: str) -> str | None:
    try:
        response = ollama_chat(
            model=MODEL,
            messages=[{
                "role": "user",
                "content": PROMPT.substitute(
                    content=readme[:8000],
                    types=", ".join(VALID_TYPES),
                ),
            }],
            format="json",
            think=False,
            options={"temperature": 0.1, "seed": 42},
        )
        return response.message.content
    except Exception as e:
        log.error(f"LLM query failed: {e}")
        return None


def safe_json_parse(text: str) -> dict | None:
    try:
        return json.loads(text)
    except Exception:
        log.warning("Failed to parse JSON from LLM output")
        return None


def normalize_types(types) -> list[str]:
    if not types:
        return []
    return [t.lower().strip() for t in types if t in VALID_TYPES]


def validate_llm_output(data: dict) -> dict:
    return {
        "ollama_description": (data.get("summary") or "").strip(),
        "keywords": list(set(data.get("keywords", [])))[:20],
        "stack": list(set(data.get("stack", [])))[:15],
        "types": normalize_types(data.get("types")),
    }


def fallback_llm() -> dict:
    return {"ollama_description": "", "keywords": [], "stack": [], "types": []}


# ─── Cache ───────────────────────────────────────────────────────────────────

def load_cache() -> dict:
    if not CACHE_FILE.exists():
        log.info("No cache file found — starting fresh")
        return {}
    try:
        data = json.loads(CACHE_FILE.read_text())
        cache = {x["repo"]: x for x in data if "repo" in x}
        log.info(f"Loaded cache with {len(cache)} entries")
        return cache
    except Exception as e:
        log.error(f"Failed to read cache: {e}")
        return {}


def save_cache(entries: list) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(entries, indent=2))
    log.info(f"Cache saved to {CACHE_FILE}")


# ─── Output ──────────────────────────────────────────────────────────────────

def write_ts_output(entries: list) -> None:
    clean = [{k: v for k, v in e.items() if k != "hash"} for e in entries]
    ts = (
        "// Auto-generated by scripts/update-site-projects.py — do not edit.\n\n"
        + TS_TYPE
        + "\n\nexport const repositories: RepoEntry[] = "
        + json.dumps(clean, indent=2, ensure_ascii=False)
        + ";\n"
    )
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(ts)
    log.info(f"Wrote {len(clean)} entries to {OUTPUT_FILE}")


def validate_typescript() -> bool:
    log.info("Validating TypeScript output...")
    result = subprocess.run(
        ["bunx", "tsc", "--noEmit"],
        cwd=ROOT / "site",
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        log.error(f"TypeScript validation failed:\n{result.stdout}{result.stderr}")
        return False
    log.info("TypeScript validation passed ✓")
    return True


# ─── Processing ──────────────────────────────────────────────────────────────

def process_repo(
    name: str,
    description: str,
    url: str,
    pushed_at: str,
    stars: int,
    primary_language: str | None,
    topics: list[str],
    owner: str,
    cache: dict,
    ollama_online: bool,
) -> dict | None:
    log.info(f"Processing: {name}")

    readme = fetch_readme(owner, name)
    if not readme:
        return None

    content_hash = sha256(readme)

    # Cache hit: reuse LLM result, refresh mutable GitHub fields
    if name in cache and cache[name].get("hash") == content_hash:
        log.info(f"{name}: cache hit")
        entry = {**cache[name]}
        entry.update({
            "description": description,
            "url": url,
            "pushedAt": pushed_at,
            "stars": stars,
            "primaryLanguage": primary_language,
        })
        existing_kw = set(entry.get("keywords", []))
        entry["keywords"] = list(existing_kw | set(topics))[:20]
        return entry

    has_description = len(description) > 10
    use_llm = ollama_online and not has_description

    if not use_llm:
        reason = "has description" if has_description else "ollama offline"
        log.info(f"{name}: skipping LLM ({reason})")
        llm = fallback_llm()
    else:
        log.info(f"{name}: cache miss → querying LLM")
        raw = query_llm(readme)
        parsed = safe_json_parse(raw) if raw else None
        llm = validate_llm_output(parsed) if parsed else fallback_llm()

    all_keywords = list(set(llm["keywords"] + topics))[:20]

    return {
        "repo": name,
        "url": url,
        "description": description,
        "ollama_description": llm["ollama_description"],
        "keywords": all_keywords,
        "stack": llm["stack"],
        "types": llm["types"],
        "pushedAt": pushed_at,
        "stars": stars,
        "primaryLanguage": primary_language,
        "hash": content_hash,
    }


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    owner = get_github_owner()
    cache = load_cache()
    repos = fetch_repos(owner)
    ollama_online = is_ollama_online()

    results: dict[str, dict] = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(
                process_repo,
                name, desc, url, pushed_at, stars, lang, topics,
                owner, cache, ollama_online,
            ): name
            for name, desc, url, pushed_at, stars, lang, topics in repos
        }

        for future in as_completed(futures):
            repo_name = futures[future]
            try:
                result = future.result()
                if result:
                    results[result["repo"]] = result
            except Exception as e:
                log.error(f"Worker failed for {repo_name}: {e}")

    entries = list(results.values())

    save_cache(entries)
    write_ts_output(entries)
    validate_typescript()

    log.info(f"Done. Wrote {len(entries)} repositories.")


if __name__ == "__main__":
    main()
