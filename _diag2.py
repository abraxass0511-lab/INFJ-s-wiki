import json
from urllib.request import Request, urlopen

REPO = "abraxass0511-lab/INFJ-s-wiki"

# Check each date folder's MD files
for date in ["2026-05-04", "2026-05-06", "2026-05-08"]:
    try:
        url = f"https://api.github.com/repos/{REPO}/contents/00_Raw/{date}"
        items = json.loads(urlopen(Request(url)).read().decode())
        for item in items:
            if item["name"].endswith(".md") and item["name"] != "README.md":
                raw = urlopen(item["download_url"]).read().decode("utf-8")
                name = item["name"]
                # Extract source and title
                source = "unknown"
                title = "unknown"
                for line in raw.split("\n"):
                    if line.startswith("source:"):
                        source = line.split(":", 1)[1].strip()
                    if line.startswith("title:"):
                        title = line.split(":", 1)[1].strip()
                print(f"[{date}] {name}")
                print(f"  source: {source}")
                print(f"  title: {title}")
                print(f"  첫 100자: {raw[:100]}")
                print()
    except Exception as e:
        print(f"[{date}] Error: {e}")
