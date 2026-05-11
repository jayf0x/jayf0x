#!/usr/bin/env python3
"""
Color normalizer — replace inline color values with CSS variable references.

  python3 get-colors.py          dry-run: show planned replacements
  python3 get-colors.py --apply  replace colors that are near an existing CSS var
  python3 get-colors.py --add    add new CSS vars for ALL unmatched colors, then replace
  python3 get-colors.py --report show all colors found + var mapping
"""

import re, sys, math
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).parent
SRC_ROOT = ROOT / "src"
CSS_VAR_SOURCE = ROOT / "src/styles/index.css"
EXTENSIONS = {".tsx", ".ts", ".css", ".js", ".html"}

# Euclidean distance in RGBA space (each channel 0-255).
# Colors within NEAR_DIST of an existing CSS var get replaced with that var.
# ~30 = clearly same colour family;  ~40 = borderline (e.g. #4ade80 vs --green)
NEAR_DIST = 30
# Skip fully-transparent colours (gradient "fade to nothing" stops)
SKIP_ALPHA = 5

HEX_RE = re.compile(r"#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b")
RGB_RE = re.compile(r"rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)")


# ── Colour helpers ─────────────────────────────────────────────────────────

def hex_to_rgba8(raw: str):
    h = raw.lstrip("#")
    if len(h) == 3: h = h[0]*2 + h[1]*2 + h[2]*2
    elif len(h) == 4: h = h[0]*2 + h[1]*2 + h[2]*2 + h[3]*2
    if len(h) == 6: return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
    if len(h) == 8: return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16))
    return None


def rgb_match_to_rgba8(m) -> tuple:
    a = round(float(m.group(4)) * 255) if m.group(4) else 255
    return (round(float(m.group(1))), round(float(m.group(2))), round(float(m.group(3))), a)


def rgba8_to_hex8(t: tuple) -> str:
    r, g, b, a = t
    return f"#{r:02x}{g:02x}{b:02x}{a:02x}"


def rgba8_to_css(t: tuple) -> str:
    r, g, b, a = t
    if a == 255:
        return f"#{r:02x}{g:02x}{b:02x}"
    return f"rgba({r}, {g}, {b}, {round(a / 255, 2)})"


def rgba8_dist(a: tuple, b: tuple) -> float:
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


# ── Parse CSS vars ─────────────────────────────────────────────────────────

def parse_css_vars(path: Path) -> dict:
    """Return {varname: rgba8_tuple} for every colour-valued CSS variable."""
    text = path.read_text(encoding="utf-8")
    result = {}
    for m in re.finditer(r"(--[\w-]+)\s*:\s*([^;}\n]+)", text):
        name = m.group(1)
        value = m.group(2).strip()
        hm = HEX_RE.match(value)
        if hm:
            t = hex_to_rgba8(hm.group(0))
            if t:
                result[name] = t
            continue
        rm = RGB_RE.match(value)
        if rm:
            result[name] = rgb_match_to_rgba8(rm)
    return result


# ── Nearest-var lookup ─────────────────────────────────────────────────────

def find_nearest(rgba8: tuple, css_vars: dict, max_dist: float = NEAR_DIST):
    """Return (varname, dist) for the nearest CSS var, or (None, dist) if none within max_dist."""
    best_name, best_dist = None, float("inf")
    for name, vrgba in css_vars.items():
        d = rgba8_dist(rgba8, vrgba)
        if d < best_dist:
            best_dist = d
            best_name = name
    if best_dist <= max_dist:
        return best_name, best_dist
    return None, best_dist


# ── Auto-naming for new CSS vars ───────────────────────────────────────────

def auto_var_name(rgba8: tuple, css_vars: dict, used: set) -> str:
    r, g, b, a = rgba8
    pct = round(a / 255 * 100)

    # Find closest existing var by RGB distance only (ignore alpha)
    best_name, best_rgb_dist = None, float("inf")
    for name, (vr, vg, vb, _) in css_vars.items():
        d = max(abs(r - vr), abs(g - vg), abs(b - vb))
        if d < best_rgb_dist:
            best_rgb_dist = d
            best_name = name

    if best_rgb_dist <= 15 and best_name:
        # Same colour family — strip trailing xs/sm/md/lg/xl/dim/glow/text qualifier
        stem = re.sub(r"-(xs|sm|md|lg|xl|dim|glow|text)$", "", best_name)
        base = f"{stem}-a{pct}"
    elif max(r, g, b) - min(r, g, b) < 20:
        # Achromatic (white/grey/black)
        family = "overlay" if r > 128 else "shadow"
        base = f"--{family}-a{pct}"
    else:
        base = f"--c-{r:02x}{g:02x}{b:02x}" + (f"-a{pct}" if a != 255 else "")

    # Ensure uniqueness
    candidate = base
    i = 2
    while candidate in used:
        candidate = f"{base}-{i}"
        i += 1
    return candidate


# ── Process a single file ──────────────────────────────────────────────────

def process_file(filepath: Path, css_vars: dict, dry_run: bool = True):
    """
    Scan filepath for colour values and replace them with CSS var references.
    Returns (changes, unmatched_list).
      changes       — list of dicts describing each replacement
      unmatched     — list of dicts for colours with no near CSS var
    """
    if filepath.resolve() == CSS_VAR_SOURCE.resolve():
        return [], []

    text = filepath.read_text(encoding="utf-8", errors="ignore")
    replacements: dict[str, str] = {}
    changes: list[dict] = []
    unmatched: dict[str, dict] = {}  # hex8 → info

    def handle(m, rgba8: tuple):
        if rgba8[3] <= SKIP_ALPHA:
            return

        orig = m.group(0)
        start, end = m.start(), m.end()

        # Skip colours on the RHS of a CSS variable definition: --foo: <here>
        line_start = text.rfind("\n", 0, start) + 1
        if re.match(r"\s*--[\w-]+\s*:", text[line_start:start]):
            return

        var_name, dist = find_nearest(rgba8, css_vars)

        if var_name:
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
                changes.append({
                    "orig": key,
                    "repl": val,
                    "src": rgba8,
                    "var": var_name,
                    "var_c": css_vars[var_name],
                    "dist": dist,
                    "file": filepath,
                })
        else:
            hex8 = rgba8_to_hex8(rgba8)
            if hex8 not in unmatched:
                unmatched[hex8] = {"orig": orig, "rgba8": rgba8, "nearest_dist": dist, "hex8": hex8}

    for m in HEX_RE.finditer(text):
        t = hex_to_rgba8(m.group(0))
        if t:
            handle(m, t)
    for m in RGB_RE.finditer(text):
        handle(m, rgb_match_to_rgba8(m))

    if not dry_run and replacements:
        new_text = text
        for key in sorted(replacements, key=lambda x: -len(x)):
            new_text = new_text.replace(key, replacements[key])
        if new_text != text:
            filepath.write_text(new_text, encoding="utf-8")

    return changes, list(unmatched.values())


# ── Add new vars to CSS source ─────────────────────────────────────────────

def add_vars_to_css(path: Path, new_vars: dict):
    """Inject new CSS vars into :root and @theme inline blocks."""
    text = path.read_text(encoding="utf-8")

    root_lines = "\n".join(
        f"  {name}: {rgba8_to_css(rgba8)};"
        for name, rgba8 in sorted(new_vars.items())
    )
    theme_lines = "\n".join(
        f"  --color{name[2:]}: var({name});"  # --foo → --color-foo
        for name in sorted(new_vars.keys())
    )

    # Insert before closing } of :root
    text = re.sub(
        r"(:root\s*\{)(.*?)(\})",
        lambda m: m.group(1) + m.group(2).rstrip() + "\n\n  /* auto-generated */\n" + root_lines + "\n" + m.group(3),
        text, count=1, flags=re.DOTALL,
    )
    # Insert before closing } of @theme inline
    text = re.sub(
        r"(@theme\s+inline\s*\{)(.*?)(\})",
        lambda m: m.group(1) + m.group(2).rstrip() + "\n\n  /* auto-generated */\n" + theme_lines + "\n" + m.group(3),
        text, count=1, flags=re.DOTALL,
    )

    path.write_text(text, encoding="utf-8")


# ── Report ─────────────────────────────────────────────────────────────────

def extraction_report(css_vars: dict):
    files = sorted({f for ext in EXTENSIONS for f in SRC_ROOT.rglob(f"*{ext}")})
    by_hex: dict[str, list] = defaultdict(list)

    for f in files:
        if not f.exists():
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        rel = str(f).replace(str(ROOT) + "/", "")
        for m in HEX_RE.finditer(text):
            t = hex_to_rgba8(m.group(0))
            if t:
                by_hex[rgba8_to_hex8(t)].append((rel, text[:m.start()].count("\n") + 1))
        for m in RGB_RE.finditer(text):
            t = rgb_match_to_rgba8(m)
            by_hex[rgba8_to_hex8(t)].append((rel, text[:m.start()].count("\n") + 1))

    print("=" * 70)
    print(f"CSS VARIABLE DEFINITIONS  ({len(css_vars)})")
    print("=" * 70)
    for name, rgba in sorted(css_vars.items()):
        print(f"  {name:<32} {rgba8_to_hex8(rgba)}  {rgba8_to_css(rgba)}")

    print()
    print("=" * 70)
    print(f"ALL UNIQUE COLOURS  ({len(by_hex)})   [*=no near CSS var]")
    print("=" * 70)
    for hex8, locs in sorted(by_hex.items()):
        rgba8 = hex_to_rgba8(hex8)
        var_name, dist = find_nearest(rgba8, css_vars) if rgba8 else (None, 999)
        marker = " " if var_name else "*"
        var_info = f"→ var({var_name}) [d={dist:.0f}]" if var_name else f"  [nearest d={dist:.0f}]"
        lstr = "; ".join(f"{f}:{l}" for f, l in locs[:2])
        if len(locs) > 2:
            lstr += f" (+{len(locs)-2} more)"
        print(f" {marker} {hex8}  x{len(locs):<3} {var_info:<40} @ {lstr}")

    print()
    matched = sum(1 for h in by_hex if find_nearest(hex_to_rgba8(h), css_vars)[0] is not None)
    print(f"  Total unique: {len(by_hex)}  |  near CSS var: {matched}  |  unmatched: {len(by_hex)-matched}")


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    dry_run = "--apply" not in args and "--add" not in args
    add_mode = "--add" in args
    report_mode = "--report" in args

    css_vars = parse_css_vars(CSS_VAR_SOURCE)
    files = sorted({f for ext in EXTENSIONS for f in SRC_ROOT.rglob(f"*{ext}")})

    if report_mode:
        extraction_report(css_vars)
        return

    if add_mode:
        # Pass 1: collect all unmatched unique colours across all files
        all_unmatched: dict[str, dict] = {}
        for f in files:
            _, unmatched = process_file(f, css_vars, dry_run=True)
            for u in unmatched:
                if u["hex8"] not in all_unmatched:
                    all_unmatched[u["hex8"]] = u

        if all_unmatched:
            # Generate new var names
            new_vars: dict[str, tuple] = {}
            used_names = set(css_vars.keys())

            for hex8, info in sorted(all_unmatched.items()):
                name = auto_var_name(info["rgba8"], css_vars, used_names | set(new_vars.keys()))
                new_vars[name] = info["rgba8"]

            print(f"Adding {len(new_vars)} new CSS vars:")
            for name, rgba8 in sorted(new_vars.items()):
                print(f"  {name}: {rgba8_to_css(rgba8)}")

            if not dry_run:
                add_vars_to_css(CSS_VAR_SOURCE, new_vars)
                print(f"\n→ Written to {CSS_VAR_SOURCE.relative_to(ROOT)}")
                css_vars = parse_css_vars(CSS_VAR_SOURCE)
        else:
            print("No unmatched colours found.")

    # Main pass: replace colours
    all_changes: list[dict] = []
    all_remaining: dict[str, dict] = {}

    for f in files:
        changes, unmatched = process_file(f, css_vars, dry_run=dry_run)
        all_changes.extend(changes)
        for u in unmatched:
            if u["hex8"] not in all_remaining:
                all_remaining[u["hex8"]] = u

        if changes:
            rel = str(f).replace(str(ROOT) + "/", "")
            print(f"\n{rel}  ({len(changes)} replacements)")
            for c in changes:
                src_h = rgba8_to_hex8(c["src"])
                var_h = rgba8_to_hex8(c["var_c"])
                print(f"  {c['orig']!r:50} → {c['repl']}   [{src_h} → {var_h}, d={c['dist']:.0f}]")

    print(f"\n{'─'*60}")
    print(f"Total replacements: {len(all_changes)}")

    if all_remaining and not add_mode:
        print(f"\nUnmatched colours ({len(all_remaining)}) — run with --add to generate CSS vars:")
        for hex8, u in sorted(all_remaining.items(), key=lambda x: -x[1]["nearest_dist"]):
            print(f"  {u['orig']:50}  {hex8}  nearest d={u['nearest_dist']:.0f}")

    if dry_run:
        print("\nDRY-RUN — pass --apply to replace near-colours, --add to add vars + replace all")
    else:
        print("Done!")


if __name__ == "__main__":
    main()
