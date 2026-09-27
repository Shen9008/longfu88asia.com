"""Print SEOmator LLM XML rules with failures or high warnings."""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "seo-audit-gsc-troubleshoot.xml"
text = open(path, encoding="utf-8").read()
# Split on rule tags (single-line XML)
chunks = re.split(r"(?=<rule id=)", text)
rows = []
for chunk in chunks:
    if not chunk.startswith("<rule id="):
        continue
    rid = re.search(r'id="([^"]+)"', chunk)
    name = re.search(r'name="([^"]+)"', chunk)
    f = re.search(r'<counts[^>]*\bf="(\d+)"', chunk)
    w = re.search(r'<counts[^>]*\bw="(\d+)"', chunk)
    if not rid:
        continue
    fail = int(f.group(1)) if f else 0
    warn = int(w.group(1)) if w else 0
    if fail or warn >= 5:
        rows.append((fail, warn, rid.group(1), name.group(1) if name else ""))

rows.sort(key=lambda x: (-x[0], -x[1]))
for fail, warn, rid, name in rows[:40]:
    print(f"fail={fail:4} warn={warn:4}  {rid}  {name}")
