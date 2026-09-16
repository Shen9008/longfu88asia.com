import re, sys
for path in sys.argv[1:]:
    t = open(path, encoding='utf-8').read()
    m = re.search(r'score="(\d+)" grade="(\w+)" pages="(\d+)"', t)
    print(f"\n{path}: {m.group(1)}/100 grade {m.group(2)}, {m.group(3)} pages")
    for cid, sc, p, w, f in re.findall(r'<cat id="([^"]+)" score="(\d+)" p="(\d+)" w="(\d+)" f="(\d+)"', t):
        print(f"  {cid:16} {sc:>3}  (pass {p}, warn {w}, fail {f})")
