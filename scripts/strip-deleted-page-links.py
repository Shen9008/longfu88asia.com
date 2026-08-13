# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DELETED = ["longfu88-singapore.html", "longfu88-thailand.html", "slots.html"]


def strip_deleted_links(html: str) -> str:
    for page in DELETED:
        html = re.sub(
            rf'<a\s+[^>]*href="(?:\.\./)?{re.escape(page)}(?:#[^"]*)?"[^>]*>(.*?)</a>',
            r"\1",
            html,
            flags=re.I | re.S,
        )
    html = re.sub(r",\s*,", ",", html)
    html = re.sub(r",\s*and\s*,", " and ", html)
    html = re.sub(r",\s*and\s*\.", ".", html)
    return html


if __name__ == "__main__":
    for path in ROOT.rglob("*.html"):
        text = path.read_text(encoding="utf-8")
        new = strip_deleted_links(text)
        if new != text:
            path.write_text(new, encoding="utf-8", newline="\n")
            print(f"updated {path.relative_to(ROOT).as_posix()}")
