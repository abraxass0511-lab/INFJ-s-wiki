"""
Re-deploy worker + set all secrets via Cloudflare REST API
Reads tokens from GitHub Secrets via local wrangler OAuth
"""
import json
import urllib.request
import tomllib
import os

ACCOUNT_ID = "80153aa1bf9a3491f8a39bfec766f625"
SCRIPT_NAME = "wiki-telegram-bot"

# Read OAuth token
config_path = os.path.join(os.environ['APPDATA'], 'xdg.config', '.wrangler', 'config', 'default.toml')
with open(config_path, 'rb') as f:
    config = tomllib.load(f)
TOKEN = config['oauth_token']

def put_secret(name, value):
    url = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}/secrets'
    body = json.dumps({"name": name, "text": value, "type": "secret_text"}).encode('utf-8')
    
    req = urllib.request.Request(url, data=body, method='PUT')
    req.add_header('Authorization', f'Bearer {TOKEN}')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            if result.get('success'):
                print(f"  ✅ {name} 설정 완료")
            else:
                print(f"  ❌ {name} 설정 실패:", result)
    except urllib.error.HTTPError as e:
        print(f"  ❌ {name} 에러 ({e.code}):", e.read().decode('utf-8')[:200])

# Step 1: Deploy the worker code
print("📦 Worker 코드 배포...")
worker_path = os.path.join(os.path.dirname(__file__), 'worker.js')
with open(worker_path, 'r', encoding='utf-8') as f:
    script_content = f.read()

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="metadata"\r\n'
    f'Content-Type: application/json\r\n\r\n'
    f'{json.dumps({"main_module": "worker.js", "compatibility_date": "2024-09-23"})}\r\n'
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="worker.js"; filename="worker.js"\r\n'
    f'Content-Type: application/javascript+module\r\n\r\n'
    f'{script_content}\r\n'
    f'--{boundary}--\r\n'
).encode('utf-8')

url = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}'
req = urllib.request.Request(url, data=body, method='PUT')
req.add_header('Authorization', f'Bearer {TOKEN}')
req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        print(f"  ✅ 배포 성공!")
except urllib.error.HTTPError as e:
    print(f"  ❌ 배포 실패:", e.read().decode('utf-8')[:200])
    exit(1)

# Step 2: Set secrets
# User must provide TELEGRAM_BOT_TOKEN interactively
print("\n🔐 Secrets 설정...")
print("  GITHUB_OWNER, GITHUB_REPO는 하드코딩...")
put_secret("GITHUB_OWNER", "abraxass0511-lab")
put_secret("GITHUB_REPO", "INFJ-s-wiki")

# Read from environment or ask
telegram_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
github_token = os.environ.get("GITHUB_TOKEN", "") or os.environ.get("GIT_PERSONAL_ACCESS_TOKEN", "")

if not telegram_token:
    telegram_token = input("  📱 TELEGRAM_BOT_TOKEN 입력: ").strip()
if not github_token:
    github_token = input("  🐙 GITHUB_TOKEN (PAT) 입력: ").strip()

if telegram_token:
    put_secret("TELEGRAM_BOT_TOKEN", telegram_token)
if github_token:
    put_secret("GITHUB_TOKEN", github_token)

# Step 3: Setup Telegram webhook
print("\n📡 텔레그램 웹훅 설정...")
webhook_url = f"https://{SCRIPT_NAME}.abraxass0511.workers.dev/webhook"
tg_url = f"https://api.telegram.org/bot{telegram_token}/setWebhook?url={webhook_url}"
try:
    with urllib.request.urlopen(tg_url) as resp:
        result = json.loads(resp.read().decode())
        print(f"  ✅ 웹훅: {result}")
except Exception as e:
    print(f"  ❌ 웹훅 설정 실패: {e}")

# Step 4: Verify webhook
print("\n🔍 웹훅 검증...")
try:
    with urllib.request.urlopen(f"https://api.telegram.org/bot{telegram_token}/getWebhookInfo") as resp:
        info = json.loads(resp.read().decode())
        r = info.get('result', {})
        print(f"  URL: {r.get('url', 'N/A')}")
        print(f"  Pending: {r.get('pending_update_count', 0)}")
        print(f"  Last Error: {r.get('last_error_message', 'none')}")
except Exception as e:
    print(f"  ❌ 검증 실패: {e}")

print("\n✅ 전체 설정 완료!")
