"""
Gemini API 키 직접 테스트.
사용법: python _test_gemini.py YOUR_API_KEY
"""
import sys, json
from urllib.request import Request, urlopen

if len(sys.argv) < 2:
    print("사용법: python _test_gemini.py YOUR_GEMINI_API_KEY")
    print("(GitHub Secrets에 넣은 키를 그대로 붙여넣으세요)")
    sys.exit(1)

API_KEY = sys.argv[1]
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

print(f"🔑 키 길이: {len(API_KEY)}")
print(f"🔑 키 시작: {API_KEY[:8]}...")
print(f"🌐 모델: gemini-2.5-flash")
print(f"📡 URL: {API_URL}")
print()

# Test 1: Simple text
print("=== 테스트 1: 텍스트 전용 ===")
try:
    payload = json.dumps({"contents":[{"parts":[{"text":"Hello, respond with just 'OK'"}]}]}).encode()
    req = Request(f"{API_URL}?key={API_KEY}", data=payload, headers={"Content-Type":"application/json"}, method="POST")
    with urlopen(req, timeout=15) as r:
        result = json.loads(r.read().decode())
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        print(f"  ✅ 성공! 응답: {text[:100]}")
except Exception as e:
    err_body = ""
    if hasattr(e, "read"):
        try: err_body = e.read().decode()[:500]
        except: pass
    print(f"  ❌ 실패: {e}")
    if err_body:
        print(f"  📋 응답: {err_body}")

# Test 2: Simple image (1x1 red pixel PNG)
print("\n=== 테스트 2: 이미지 전송 (1x1 PNG) ===")
try:
    # Minimal 1x1 red pixel PNG in base64
    tiny_png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    payload = json.dumps({
        "contents":[{"parts":[
            {"text":"What do you see in this image? Reply briefly."},
            {"inline_data":{"mime_type":"image/png","data":tiny_png_b64}}
        ]}],
        "generationConfig": {"temperature":0.3, "maxOutputTokens":256}
    }).encode()
    req = Request(f"{API_URL}?key={API_KEY}", data=payload, headers={"Content-Type":"application/json"}, method="POST")
    with urlopen(req, timeout=30) as r:
        result = json.loads(r.read().decode())
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        print(f"  ✅ 성공! 응답: {text[:100]}")
        print("\n🎉 Gemini API가 정상 작동합니다! 이미지 처리도 가능합니다.")
except Exception as e:
    err_body = ""
    if hasattr(e, "read"):
        try: err_body = e.read().decode()[:500]
        except: pass
    print(f"  ❌ 실패: {e}")
    if err_body:
        print(f"  📋 응답: {err_body}")
