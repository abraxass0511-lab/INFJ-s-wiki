"""Trigger GitHub Actions 'Setup Telegram Bot' workflow via API"""
import json
import urllib.request
import os
import tomllib

# Get GitHub PAT from wrangler config (for Cloudflare) — we need GitHub token separately
# Let's use the GitHub CLI or environment variable approach

# First, read the GitHub PAT from git credential
# We'll trigger via the GitHub API

OWNER = "abraxass0511-lab"
REPO = "INFJ-s-wiki"
WORKFLOW = "deploy-telegram-bot.yml"

# Try git credential
import subprocess
result = subprocess.run(
    ["git", "credential", "fill"],
    input="protocol=https\nhost=github.com\n",
    capture_output=True,
    text=True,
    cwd=os.path.dirname(__file__)
)

github_token = ""
for line in result.stdout.splitlines():
    if line.startswith("password="):
        github_token = line.split("=", 1)[1]
        break

if not github_token:
    print("❌ GitHub 토큰을 찾을 수 없습니다")
    exit(1)

print(f"✅ GitHub 토큰 확인 (길이: {len(github_token)})")

# Trigger workflow
url = f"https://api.github.com/repos/{OWNER}/{REPO}/actions/workflows/{WORKFLOW}/dispatches"
body = json.dumps({"ref": "main"}).encode()

req = urllib.request.Request(url, data=body, method='POST')
req.add_header('Authorization', f'token {github_token}')
req.add_header('Accept', 'application/vnd.github.v3+json')
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req) as resp:
        print(f"✅ 워크플로우 트리거 성공! (HTTP {resp.status})")
        print("   GitHub Actions에서 Cloudflare Secrets 설정 + 웹훅 등록 중...")
        print(f"   확인: https://github.com/{OWNER}/{REPO}/actions")
except urllib.error.HTTPError as e:
    if e.code == 204:
        print(f"✅ 워크플로우 트리거 성공! (HTTP 204)")
        print("   GitHub Actions에서 Cloudflare Secrets 설정 + 웹훅 등록 중...")
        print(f"   확인: https://github.com/{OWNER}/{REPO}/actions")
    else:
        print(f"❌ 트리거 실패 ({e.code}):", e.read().decode()[:300])
