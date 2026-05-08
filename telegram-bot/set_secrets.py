"""
Set Cloudflare Worker secrets via REST API
Usage: python set_secrets.py <secret_name> <secret_value>
"""
import json
import urllib.request
import tomllib
import os
import sys

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

if __name__ == '__main__':
    if len(sys.argv) == 3:
        put_secret(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python set_secrets.py <SECRET_NAME> <SECRET_VALUE>")
        print("\nRequired secrets:")
        print("  TELEGRAM_BOT_TOKEN  - 텔레그램 봇 토큰")
        print("  GITHUB_TOKEN        - GitHub PAT")
        print("  GITHUB_OWNER        - abraxass0511-lab")
        print("  GITHUB_REPO         - INFJ-s-wiki")
