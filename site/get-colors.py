#!/usr/bin/env python3
"""
Extract and auto-replace color values with CSS variable references.

Usage:
  python3 get-colors.py           # dry-run: show what would be replaced
  python3 get-colors.py --apply   # apply replacements in-place
  python3 get-colors.py --report  # extraction/similarity report only
"""

import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).parent
SRC_ROOT = ROOT / "src"
CSS_VAR_SOURCE = ROOT / "src/styles/index.css"
EXTENSIONS = {".tsx", ".ts", ".css", ".js", ".html"}

# ── Regex ──────────────────────────────────────────────────────────────────
HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")
RGB_RE = re.compile(
    r"rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)"
)
CSS_VAR_DEF_RE = re.compile(r"(--[\w-]+)\s*:\s*([^;}\n]+)")

# ── Replacement thresholds ─────────────────────────────────────────────────
#  RGB L-infinity distance (per channel, 0-255): colours must share the same
#  base hue family.  Keep tight so e.g. #4ade80 (green-400) ≠ #34d399.
RGB_LINF_MAX = 10

#  Alpha distance (0-1 scale).  Use a tighter window for near-white / near-
#  black colours because human vision is more sensitive to opacity there.
ALPHA_MAX_CHROMATIC = 0.20   # non-white/non-black colours
ALPHA_MAX_ACHROMATIC = 0.12  # whites / blacks / near-greys


# ── Normalisation helpers ──────────────────────────────────────────────────
def hex_to_rgba8(h: str) -> tuple | None:
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    elif len(h) == 4:
        h = "".join(c * 2 for c in h)
    if len(h) == 6:
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
    if len(h) == 8:
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16))
    return None


def rgbmatch_to_rgba8(m: re.Match) -> tuple:
    r = round(float(m.group(1)))
    g = round(float(m.group(2)))
    b = round(float(m.group(3)))
    a = round(float(m.group(4)) * 255) if m.group(4) is not None else 255
    return (r, g, b, a)


def is_achromatic(rgba8: tuple) -> bool:
    """True for near-whites and near-blacks (low chroma)."""
    r, g, b, _ = rgba8
    hi, lo = max(r, g, b), min(r, g, b)
    return (hi - lo) < 20  # low saturation → grey family


def rgba8_to_hex8(rgba8: tuple) -> str:
    r, g, b, a = rgba8
    return f"#{r:02x}{g:02x}{b:02x}{a:02x}"


# ── Parse CSS vars from index.css ──────────────────────────────────────────
def parse_css_vars(css_file: Path) -> dict:
    """Return {varname: rgba8_tuple} for every colour-valued CSS variable."""
    text = css_file.read_text(encoding="utf-8")
    result = {}
    for m in CSS_VAR_DEF_RE.finditer(text):
        name, value = m.group(1), m.group(2).strip()
        hm = HEX_RE.match(value)
        if hm:
            t = hex_to_rgba8(hm.group(0))
            if t:
                result[name] = t
            continue
        rm = RGB_RE.match(value)
        if rm:
            result[name] = rgbmatch_to_rgba8(rm)
    return result


# ── Nearest-var lookup ─────────────────────────────────────────────────────
def find_nearest_var(rgba8: tuple, css_vars: dict) -> str | None:
    r, g, b, a = rgba8
    a_frac = a / 255.0
    achromatic = is_achromatic(rgba8)
    alpha_max = ALPHA_MAX_ACHROMATIC if achromatic else ALPHA_MAX_CHROMATIC

    candidates = []
    for name, (vr, vg, vb, va) in css_vars.items():
        # ① same RGB family (L-∞ per channel)
        if max(abs(r - vr), abs(g - vg), abs(b - vb)) > RGB_LINF_MAX:
            continue
        # ② close alpha
        a_dist = abs(a_frac - va / 255.0)
        if a_dist > alpha_max:
            continue
        # score: prefer exact RGB match, then closest alpha
        score = max(abs(r - vr), abs(g - vg), abs(b - vb)) * 1000 + a_dist * 255
        candidates.append((score, name))

    if not candidates:
        return None
    candidates.sort()
    return candidates[0][1]


# ── File processing ────────────────────────────────────────────────────────
def process_file(filepath: Path, css_vars: dict, dry_run: bool = True) -> list:
    # Never touch the CSS vars definition file itself
    if filepath.resolve() == CSS_VAR_SOURCE.resolve():
        return []

    text = filepath.read_text(encoding="utf-8", errors="ignore")
    replacements: dict[str, str] = {}  # original_text → replacement_text
    changes: list[dict] = []

    def try_match(m: re.Match, rgba8: tuple):
        orig = m.group(0)
        start, end = m.start(), m.end()

        # Skip values on the RHS of a CSS variable definition  (--foo: <here>)
        line_start = text.rfind("\n", 0, start) + 1
        line_snippet = text[line_start : end + 5]
        if CSS_VAR_DEF_RE.match(line_snippet.lstrip()):
            return

        var_name = find_nearest_var(rgba8, css_vars)
        if var_name is None:
            return

        # Detect Tailwind bracket context: utility-[<color>]
        pre = text[start - 1] if start > 0 else ""
        post = text[end] if end < len(text) else ""
        in_tw_bracket = pre == "[" and post == "]"

        if in_tw_bracket:
            key = f"[{orig}]"
            val = f"(--{var_name.lstrip('-')})"
        else:
            key = orig
            val = f"var({var_name})"

        if key not in replacements:
            replacements[key] = val
            changes.append(
                {
                    "file": filepath,
                    "original": key,
                    "replacement": val,
                    "src_rgba8": rgba8,
                    "var_name": var_name,
                    "var_rgba8": css_vars[var_name],
                }
            )

    for m in HEX_RE.finditer(text):
        t = hex_to_rgba8(m.group(0))
        if t:
            try_match(m, t)

    for m in RGB_RE.finditer(text):
        try_match(m, rgbmatch_to_rgba8(m))

    if not dry_run and replacements:
        new_text = text
        # Longest-key-first so e.g. [rgba(...)] isn't accidentally stomped
        for key in sorted(replacements, key=lambda x: -len(x)):
            new_text = new_text.replace(key, replacements[key])
        if new_text != text:
            filepath.write_text(new_text, encoding="utf-8")

    return changes


# ── Extraction report (original functionality) ─────────────────────────────
def extraction_report(css_vars: dict):
    files = [*[ROOT / f for f in ("tailwind.config.js", "index.html")],
             *sorted(SRC_ROOT.rglob("*.*"))]
    color_counts: dict[str, list] = defaultdict(list)

    for f in files:
        if f.suffix not in EXTENSIONS or not f.exists():
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        rel = str(f).replace(str(ROOT) + "/", "")
        for m in HEX_RE.finditer(text):
            t = hex_to_rgba8(m.group(0).lower())
            if t:
                color_counts[m.group(0).lower()].append((rel, text[:m.start()].count("\n") + 1))
        for m in RGB_RE.finditer(text):
            val = m.group(0).lower().replace(" ", "")
            color_counts[val].append((rel, text[:m.start()].count("\n") + 1))

    print("=" * 70)
    print("CSS VARIABLE DEFINITIONS")
    print("=" * 70)
    for name, rgba in sorted(css_vars.items()):
        print(f"  {name:<32} = {rgba8_to_hex8(rgba)}  {rgba}")

    print()
    print("=" * 70)
    print(f"ALL UNIQUE COLORS  ({len(color_counts)})")
    print("=" * 70)
    for val, locs in sorted(color_counts.items(),
                             key=lambda x: hex_to_rgba8(x[0]) or (hex_to_rgba8(
                                 rgba8_to_hex8(rgbmatch_to_rgba8(RGB_RE.match(x[0])))
                             ) if RGB_RE.match(x[0]) else (999,))):
        lstr = "; ".join(f"{f}:{l}" for f, l in locs[:3])
        if len(locs) > 3:
            lstr += f" (+{len(locs)-3} more)"
        print(f"  {val:<48} x{len(locs):<3}  @ {lstr}")

    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"  Unique colors: {len(color_counts)}")
    print(f"  CSS vars:      {len(css_vars)}")


# ── Main ───────────────────────────────────────────────────────────────────
def main():
    args = sys.argv[1:]
    dry_run = "--apply" not in args
    report_only = "--report" in args

    css_vars = parse_css_vars(CSS_VAR_SOURCE)

    if report_only:
        extraction_report(css_vars)
        return

    # Collect source files
    files = sorted(
        {f for ext in EXTENSIONS for f in SRC_ROOT.rglob(f"*{ext}")}
    )

    all_changes: list[dict] = []
    for f in files:
        changes = process_file(f, css_vars, dry_run=dry_run)
        if changes:
            rel = str(f).replace(str(ROOT) + "/", "")
            print(f"\n{rel}  ({len(changes)} replacements)")
            for c in changes:
                note = f"  {c['original']!r:52} → {c['replacement']}"
                src_h = rgba8_to_hex8(c["src_rgba8"])
                var_h = rgba8_to_hex8(c["var_rgba8"])
                print(f"{note}   [{src_h} → {var_h}]")
        all_changes.extend(changes)

    print(f"\n{'─'*60}")
    print(f"Total replacements: {len(all_changes)}")
    if dry_run:
        print("DRY RUN — run with --apply to apply changes")
    else:
        print("Applied!")


if __name__ == "__main__":
    main()
