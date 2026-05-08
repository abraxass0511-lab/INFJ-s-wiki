"""
Deploy wiki-telegram-bot to Cloudflare Workers via REST API
"""
import json
import urllib.request
import os

ACCOUNT_ID = "80153aa1bf9a3491f8a39bfec766f625"
SCRIPT_NAME = "wiki-telegram-bot"

# Read OAuth token
import tomllib
config_path = os.path.join(os.environ['APPDATA'], 'xdg.config', '.wrangler', 'config', 'default.toml')
with open(config_path, 'rb') as f:
    config = tomllib.load(f)
TOKEN = config['oauth_token']

# Read worker.js
worker_path = os.path.join(os.path.dirname(__file__), 'worker.js')
with open(worker_path, 'r', encoding='utf-8') as f:
    script_content = f.read()

# Build multipart form data
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
        print(f"✅ 배포 성공!")
        print(f"   Script: {result.get('result', {}).get('id', 'N/A')}")
        print(f"   Modified: {result.get('result', {}).get('modified_on', 'N/A')}")
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"❌ 배포 실패 ({e.code}):")
    print(error_body)
