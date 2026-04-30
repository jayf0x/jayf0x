#!/usr/bin/env python3
import json
import hashlib
import subprocess
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

MAX_WORKERS = 3
MODEL = "qwen3.5:9b"
REPO_LIMIT = 50

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site/src/assets/repositories.json"

TYPES = {
    "utility",
    "application",
    "framework",
    "library",
    "tooling",
    "research",
    "infrastructure",
    "ai",
    "cli",
    "plugin"
}

PROMPT = """
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
{content}
"""

def run(cmd):
    return subprocess.check_output(cmd, shell=True, text=True).strip()

def owner():
    return run("gh api user -q .login")

def repos(o):
    data = json.loads(run(
        f'gh repo list {o} --limit {REPO_LIMIT} --json name,visibility,description'
    ))
    return [
        (r["name"], r.get("description", ""))
        for r in data if r["visibility"] == "PUBLIC"
    ]

def readme(o, r):
    for b in ("main", "master"):
        try:
            u = f"https://raw.githubusercontent.com/{o}/{r}/{b}/README.md"
            res = requests.get(u, timeout=10)
            if res.status_code == 200:
                return res.text
        except:
            pass
    return None

def h(x):
    return hashlib.sha256(x.encode()).hexdigest()

def ollama(p):
    try:
        r = subprocess.run(
            ["ollama", "run", MODEL, "--think=false", p],
            capture_output=True, text=True, check=True
        )
        return r.stdout.strip()
    except:
        return None

def safe_json(x):
    try:
        return json.loads(x)
    except:
        return None

def normalize_type(t):
    if not t:
        return "utility"
    t = t.lower().strip()
    return t if t in TYPES else "utility"

def validate(j):
    if not isinstance(j, dict):
        return None

    return {
        "keywords": list(set(j.get("keywords", [])))[:20],
        "summary": j.get("summary", "").strip(),
        "stack": list(set(j.get("stack", [])))[:15],
        "type": normalize_type(j.get("type"))
    }

def fallback():
    return {
        "keywords": [],
        "summary": "",
        "stack": [],
        "type": "utility"
    }

def process(name, repo_desc, owner, cache):
    content = readme(owner, name)
    if not content:
        return None

    hh = h(content)

    # cache hit (but ensure schema compatibility)
    if name in cache and cache[name].get("hash") == hh:
        c = cache[name]
        # migrate missing fields
        c.setdefault("repo_description", repo_desc or "")
        c.setdefault("ollama_description", "")
        c.setdefault("keywords", [])
        c.setdefault("stack", [])
        c.setdefault("type", "utility")
        return c

    prompt = PROMPT.format(content=content[:8000])
    raw = ollama(prompt)

    parsed = safe_json(raw) if raw else None
    data = validate(parsed) if parsed else fallback()

    return {
        "repo": name,
        "hash": hh,
        "repo_description": repo_desc or "",
        "ollama_description": data["summary"],
        "keywords": data["keywords"],
        "stack": data["stack"],
        "type": data["type"]
    }

def main():
    o = owner()
    rs = repos(o)

    if OUT.exists():
        old = {x["repo"]: x for x in json.loads(OUT.read_text())}
    else:
        old = {}

    results = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futs = [
            ex.submit(process, name, desc, o, old)
            for name, desc in rs
        ]
        for f in as_completed(futs):
            x = f.result()
            if x:
                results[x["repo"]] = x

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(list(results.values()), indent=2))


if __name__ == "__main__":
    main()