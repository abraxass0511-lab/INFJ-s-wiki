"""
Interactive setup for Cloudflare Worker secrets
Run: python setup_interactive.py
"""
import json
import urllib.request
import tomllib
import os
import getpass

ACCOUNT_ID = "80153aa1bf9a3491f8a39bfec766f625"
SCRIPT_NAME = "wiki-telegram-bot"
WEBHOOK_URL = f"https://{SCRIPT_NAME}.abraxass0511.workers.dev/webhook"

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
            return result.get('success', False)
    except urllib.error.HTTPError as e:
        print(f"  Error: {e.read().decode('utf-8')[:200]}")
        return False

def setup_webhook(bot_token):
    url = f'https://api.telegram.org/bot{bot_token}/setWebhook?url={WEBHOOK_URL}'
    try:
        with urllib.request.urlopen(url) as r:
            result = json.loads(r.read().decode('utf-8'))
            return result.get('ok', False)
    except:
        return False

print("=" * 50)
print("📱 위키 텔레그램 봇 설정")
print("=" * 50)
print()

# 1. Telegram Bot Token
print("1️⃣  텔레그램 봇 토큰 입력:")
telegram_token = getpass.getpass("   TELEGRAM_BOT_TOKEN: ").strip()
if telegram_token:
    if put_secret("TELEGRAM_BOT_TOKEN", telegram_token):
        print("   ✅ TELEGRAM_BOT_TOKEN 설정 완료")
    else:
        print("   ❌ 실패")
else:
    print("   ⏭️  건너뜀")

print()

# 2. GitHub Token
print("2️⃣  GitHub Personal Access Token 입력:")
github_token = getpass.getpass("   GITHUB_TOKEN: ").strip()
if github_token:
    if put_secret("GITHUB_TOKEN", github_token):
        print("   ✅ GITHUB_TOKEN 설정 완료")
    else:
        print("   ❌ 실패")
else:
    print("   ⏭️  건너뜀")

print()

# 3. Setup Webhook
if telegram_token:
    print("3️⃣  텔레그램 웹훅 설정 중...")
    if setup_webhook(telegram_token):
        print(f"   ✅ 웹훅 연결 완료: {WEBHOOK_URL}")
    else:
        print("   ❌ 웹훅 설정 실패")
else:
    print("3️⃣  텔레그램 토큰 없음 — 웹훅 설정 건너뜀")

print()
print("=" * 50)
print("🎉 설정 완료! 텔레그램에서 이미지를 보내보세요")
print("=" * 50)
