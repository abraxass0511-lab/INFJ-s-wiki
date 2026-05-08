import json, base64
from urllib.request import Request, urlopen

REPO = "abraxass0511-lab/INFJ-s-wiki"

# 1) Check latest workflow runs
print("=== 최근 워크플로우 실행 ===")
url = f"https://api.github.com/repos/{REPO}/actions/runs?per_page=5"
data = json.loads(urlopen(Request(url, headers={"Accept":"application/vnd.github+json"})).read().decode())
for run in data.get("workflow_runs", []):
    print(f"  {run['id']} | {run['name']} | {run['created_at']} | {run['conclusion']} | trigger:{run['event']}")

# 2) Check current workflow model name
print("\n=== 현재 워크플로우 모델명 확인 ===")
wf_url = f"https://api.github.com/repos/{REPO}/contents/.github/workflows/ocr-process.yml?ref=main"
wf_data = json.loads(urlopen(Request(wf_url, headers={"Accept":"application/vnd.github+json"})).read().decode())
wf_content = base64.b64decode(wf_data["content"]).decode("utf-8")
for i, line in enumerate(wf_content.split("\n"), 1):
    if "API_URL" in line and "generativelanguage" in line:
        print(f"  Line {i}: {line.strip()}")
    if "gemini" in line.lower() and ("model" in line.lower() or "url" in line.lower()):
        print(f"  Line {i}: {line.strip()}")

# 3) Check if 2026-05-08 folder exists and what's in it
print("\n=== 2026-05-08 폴더 상태 ===")
try:
    folder_url = f"https://api.github.com/repos/{REPO}/contents/00_Raw/2026-05-08?ref=main"
    folder_data = json.loads(urlopen(Request(folder_url, headers={"Accept":"application/vnd.github+json"})).read().decode())
    for item in folder_data:
        print(f"  {item['name']} ({item['size']} bytes)")
        # If it's an MD file, read content to check source
        if item["name"].endswith(".md"):
            md_raw = urlopen(item["download_url"]).read().decode("utf-8", errors="replace")
            for line in md_raw.split("\n")[:15]:
                if "source" in line.lower() or "gemini" in line.lower() or "tesseract" in line.lower() or "자동 추출" in line:
                    print(f"    >>> {line.strip()}")
except Exception as e:
    print(f"  폴더 없음 또는 에러: {e}")

# 4) Check _categories.json for 2026-05-08
print("\n=== _categories.json 2026-05-08 항목 ===")
try:
    cat_url = f"https://api.github.com/repos/{REPO}/contents/00_Raw/_categories.json?ref=main"
    cat_data = json.loads(urlopen(Request(cat_url, headers={"Accept":"application/vnd.github+json"})).read().decode())
    cat_content = json.loads(base64.b64decode(cat_data["content"]).decode())
    if "2026-05-08" in cat_content:
        print(f"  {json.dumps(cat_content['2026-05-08'], indent=2, ensure_ascii=False)}")
    else:
        print("  2026-05-08 항목 없음")
except Exception as e:
    print(f"  에러: {e}")
