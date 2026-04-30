#!/usr/bin/env python3
import json
import hashlib
import subprocess
import requests
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from string import Template
from ollama import chat


# ---------------- CONFIG ----------------

MAX_WORKERS = 1
MODEL = "qwen3.5:9b"
REPO_LIMIT = 50

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = ROOT / "site/src/assets/repositories.json"

VALID_TYPES = {
    "utility", "application", "framework", "library",
    "tooling", "research", "infrastructure",
    "ai", "cli", "plugin"
}

# ---------------- LOGGING ----------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

# ---------------- PROMPT ----------------

PROMPT = Template("""
Extract structured metadata from the README.

JSON Structure:
{
    "keywords": [],
    "summary": "",
    "stack": [],
    "type": ""
}

Rules:
- Output ONLY valid JSON
- keywords: 5-20 items
- summary: 1-3 sentences
- stack: technologies, languages, frameworks
- type must be ONE of:
  utility, application, framework, library, tooling, research, infrastructure, ai, cli, plugin
- If unsure, choose "utility"

README:
$content
""")

# ---------------- HELPERS ----------------

def run_cmd(cmd: str) -> str:
    try:
        return subprocess.check_output(cmd, shell=True, text=True).strip()
    except subprocess.CalledProcessError as e:
        log.error(f"Command failed: {cmd}\n{e}")
        raise


def get_github_owner():
    log.info("Fetching GitHub username...")
    return run_cmd("gh api user -q .login")


def fetch_repos(owner: str):
    log.info(f"Fetching repositories for {owner}...")
    raw = run_cmd(
        f'gh repo list {owner} --limit {REPO_LIMIT} --json name,visibility,description'
    )

    data = json.loads(raw)

    repos = [
        (r["name"], r.get("description", ""))
        for r in data if r["visibility"] == "PUBLIC"
    ]

    log.info(f"Found {len(repos)} public repositories")
    return repos


def fetch_readme(owner: str, repo: str):
    for branch in ("main", "master"):
        url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                log.debug(f"{repo}: README found on {branch}")
                return res.text
        except requests.RequestException as e:
            log.warning(f"{repo}: README fetch failed ({url}) -> {e}")

    log.warning(f"{repo}: No README found")
    return None


def sha256(text: str):
    return hashlib.sha256(text.encode()).hexdigest()


def query_llm(readme: str):
    try:
        response = chat(
            model=MODEL,
            messages=[{
                'role': 'user',
                'content': PROMPT.substitute(content=readme[:8000])
            }],
            format="json",
            think=False,
            options={"temperature": 0.1, "seed": 42},
        )
        return response.message.content
    except Exception as e:
        log.error(f"LLM query failed: {e}")
        return None


def safe_json_parse(text):
    try:
        return json.loads(text)
    except Exception:
        log.warning("Failed to parse JSON from LLM output")
        return None


def normalize_type(t):
    if not t:
        return "utility"
    t = t.lower().strip()
    return t if t in VALID_TYPES else "utility"


def validate_output(data):
    if not isinstance(data, dict):
        return None

    return {
        "keywords": list(set(data.get("keywords", [])))[:20],
        "summary": data.get("summary", "").strip(),
        "stack": list(set(data.get("stack", [])))[:15],
        "type": normalize_type(data.get("type"))
    }


def fallback():
    return {
        "keywords": [],
        "summary": "",
        "stack": [],
        "type": "utility"
    }


# ---------------- CACHE ----------------

def load_cache():
    if not OUTPUT_FILE.exists():
        log.info("No cache file found")
        return {}

    try:
        data = json.loads(OUTPUT_FILE.read_text())
        cache = {x["repo"]: x for x in data if "repo" in x}

        if not cache:
            log.info("Cache file exists but contains no valid entries")
            return {}

        log.info(f"Loaded cache with {len(cache)} entries")
        return cache

    except Exception as e:
        log.error(f"Failed to read cache: {e}")
        return {}


# ---------------- PROCESSING ----------------

def process_repo(name, repo_desc, owner, cache):
    log.info(f"Processing: {name}")

    readme = fetch_readme(owner, name)
    if not readme:
        return None

    content_hash = sha256(readme)

    # cache hit
    if name in cache and cache[name].get("hash") == content_hash:
        log.info(f"{name}: cache hit")
        cached = cache[name]

        cached.setdefault("repo_description", repo_desc or "")
        cached.setdefault("ollama_description", "")
        cached.setdefault("keywords", [])
        cached.setdefault("stack", [])
        cached.setdefault("type", "utility")

        return cached

    log.info(f"{name}: cache miss → querying LLM")

    raw = query_llm(readme)
    parsed = safe_json_parse(raw) if raw else None
    validated = validate_output(parsed) if parsed else fallback()

    return {
        "repo": name,
        "hash": content_hash,
        "repo_description": repo_desc or "",
        "ollama_description": validated["summary"],
        "keywords": validated["keywords"],
        "stack": validated["stack"],
        "type": validated["type"]
    }


# ---------------- MAIN ----------------

def main():
    owner = get_github_owner()
    cache = load_cache()

    # Only fetch repos if cache is empty
    if cache:
        log.info("Using cached repositories (skipping GitHub fetch)")
        repo_list = [(name, cache[name].get("repo_description", "")) for name in cache]
    else:
        repo_list = fetch_repos(owner)

    results = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [
            executor.submit(process_repo, name, desc, owner, cache)
            for name, desc in repo_list
        ]

        for future in as_completed(futures):
            try:
                result = future.result()
                if result:
                    results[result["repo"]] = result
            except Exception as e:
                log.error(f"Worker failed: {e}")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(list(results.values()), indent=2))

    log.info(f"Done. Wrote {len(results)} repositories.")


if __name__ == "__main__":
    main()