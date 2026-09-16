# -*- coding: utf-8 -*-
"""Apply batch SEO fixes: OG images, extensionless canonicals, social meta."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://longfu88asia.com"
DEFAULT_OG = f"{DOMAIN}/images/hero-home-main.webp"
OG_BLOCK = f"""    <meta property="og:image" content="{DEFAULT_OG}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:image" content="{DEFAULT_OG}">"""

HTML_FILES = [
    p for p in ROOT.rglob("*.html")
    if "node_modules" not in p.parts and ".cursor" not in p.parts
]


def public_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return f"{DOMAIN}/"
    if rel.endswith("/index.html"):
        rel = rel[: -len("index.html")]
        return f"{DOMAIN}/{rel}"
    if rel.endswith(".html"):
        rel = rel[: -5]
    return f"{DOMAIN}/{rel}"


def normalize_loc(url: str) -> str:
    if url == f"{DOMAIN}/index.html":
        return f"{DOMAIN}/"
    if url.endswith(".html"):
        return url[:-5]
    return url


def ensure_og_image(content: str) -> str:
    if 'property="og:image"' in content:
        return content
    for pattern in (
        r'<meta property="og:description"[^>]+>',
        r'<meta property="og:url"[^>]+>',
        r'<meta name="twitter:card"[^>]+>',
    ):
        match = re.search(pattern, content)
        if match:
            pos = match.end()
            return content[:pos] + "\n" + OG_BLOCK + content[pos:]
    return content


def upgrade_twitter_card(content: str) -> str:
    return content.replace(
        'name="twitter:card" content="summary"',
        'name="twitter:card" content="summary_large_image"',
    )


def normalize_canonicals(content: str, page_url: str) -> str:
    content = re.sub(
        r'(<link rel="canonical" href=")https://longfu88asia\.com/[^"]+(">)',
        rf"\1{page_url}\2",
        content,
        count=1,
    )
    if 'property="og:url"' in content:
        content = re.sub(
            r'(<meta property="og:url" content=")https://longfu88asia\.com/[^"]+(">)',
            rf"\1{page_url}\2",
            content,
            count=1,
        )
    return content


def fix_ibia_links(content: str) -> str:
    return re.sub(
        r'<a href="https://www\.ibia\.bet/?"[^>]*>(.*?)</a>',
        r"\1",
        content,
        flags=re.I | re.S,
    )


def process_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original
    page_url = public_url(path)
    updated = normalize_canonicals(updated, page_url)
    updated = ensure_og_image(updated)
    updated = upgrade_twitter_card(updated)
    updated = fix_ibia_links(updated)
    if updated != original:
        path.write_text(updated, encoding="utf-8", newline="\n")
        return True
    return False


def process_sitemap() -> bool:
    sitemap = ROOT / "sitemap.xml"
    original = sitemap.read_text(encoding="utf-8")
    updated = re.sub(
        r"(<loc>)(https://longfu88asia\.com/[^<]+)(</loc>)",
        lambda m: m.group(1) + normalize_loc(m.group(2)) + m.group(3),
        original,
    )
    if updated != original:
        sitemap.write_text(updated, encoding="utf-8", newline="\n")
        return True
    return False


def main() -> None:
    changed = 0
    for path in sorted(HTML_FILES):
        if process_file(path):
            print(f"  [OK] {path.relative_to(ROOT)}")
            changed += 1
    if process_sitemap():
        print("  [OK] sitemap.xml")
        changed += 1
    print(f"Done. Updated {changed} file(s).")


if __name__ == "__main__":
    main()
