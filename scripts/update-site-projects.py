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

PROMPT = """
Extract 5-20 keywords out of the following README content and output response as list of keywords and short summary.
This will be used as search results.

JSON Structure:
{
    "keywords": [],
    "summary": ""
}

Rules:
- Output ONLY valid JSON data.
- No markdown formatting in the response.
- make summary 1-3 sentences.

README:
{content}
"""

def run(cmd):
    return subprocess.check_output(cmd, shell=True, text=True).strip()

def owner():
    return run("gh api user -q .login")

def repos(o):
    data = json.loads(run(f'gh repo list {o} --limit {REPO_LIMIT} --json name,visibility'))
    return [r["name"] for r in data if r["visibility"] == "PUBLIC"]

def readme(o, r):
    for b in ("main", "master"):
        try:
            u = f"https://raw.githubusercontent.com/{o}/{r}/{b}/README.md"
            res = requests.get(u, timeout=10)
            if res.status_code == 200:
                return res.text
        except:
            pass

def h(x):
    return hashlib.sha256(x.encode()).hexdigest()

def ollama(p):
    try:
        r = subprocess.run(["ollama", "run", MODEL, "--think=false", p],
                           capture_output=True, text=True, check=True)
        return r.stdout.strip()
    except:
        return None

def process(r, o, cache):
    c = readme(o, r)
    if not c:
        return None
    hh = h(c)
    if r in cache and cache[r]["hash"] == hh:
        return cache[r]
    p = PROMPT.format(content=c[:8000])
    out = ollama(p)
    if not out:
        return None
    try:
        j = json.loads(out)
    except:
        return None
    return {
        "repo": r,
        "hash": hh,
        "keywords": j.get("keywords", []),
        "summary": j.get("summary", "")
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
        futs = [ex.submit(process, r, o, old) for r in rs]
        for f in as_completed(futs):
            x = f.result()
            if x:
                results[x["repo"]] = x

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(list(results.values()), indent=2))

if __name__ == "__main__":
    main()