import cv2
import numpy as np
from PIL import Image

detector = cv2.QRCodeDetector()

def decode_qr(path, label):
    img = Image.open(path)
    cv_img = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    data, points, _ = detector.detectAndDecode(cv_img)
    
    print(f"\n{'='*55}")
    print(f"  📄 {label}")
    print(f"{'='*55}")
    print(f"  파일: {path}")
    print(f"  이미지 크기: {img.size[0]}x{img.size[1]}px")
    
    if data:
        print(f"  ✅ QR 디코딩 성공")
        print(f"  ┌──────────────────────────────────────────┐")
        print(f"  │ URL: {data}")
        print(f"  └──────────────────────────────────────────┘")
        # URL 분석
        if "kakao" in data:
            print(f"  📌 종류: 카카오톡 플러스친구 링크")
            if "_excUgT" in data:
                print(f"  📌 채널 ID: _excUgT")
            if "from=qr" in data:
                print(f"  📌 유입 경로: QR코드 스캔")
    else:
        print(f"  ❌ QR 디코딩 실패 (QR 감지 불가)")
    
    if points is not None and len(points) > 0:
        pts = points[0]
        x_min = int(min(p[0] for p in pts))
        y_min = int(min(p[1] for p in pts))
        x_max = int(max(p[0] for p in pts))
        y_max = int(max(p[1] for p in pts))
        print(f"  📍 QR 위치: ({x_min},{y_min}) ~ ({x_max},{y_max})")
        print(f"  📐 QR 크기: {x_max-x_min}x{y_max-y_min}px")
    
    return data

print("\n" + "🔍 QR 코드 토큰값 분석 리포트".center(55))
print("=" * 55)

# 1) 새 QR 코드 원본
d1 = decode_qr(
    r"C:\Users\YS\Desktop\새 폴더\Gemini_Generated_Image_42mwsi42mwsi42mw.jpeg",
    "새 QR 코드 (원본)"
)

# 2) 결과 이미지 (교체 후)
d2 = decode_qr(
    r"C:\Users\YS\Desktop\새 폴더\result.png",
    "결과 이미지 (QR 교체 후)"
)

# 3) 원본 인포그래픽
d3 = decode_qr(
    r"C:\Users\YS\Desktop\새 폴더\ChatGPT Image 2026년 5월 7일 오후 12_51_32.png",
    "원본 인포그래픽 (교체 전)"
)

print("\n" + "=" * 55)
print("  📊 종합 결과")
print("=" * 55)
print(f"  새 QR 원본:     {'✅ ' + d1 if d1 else '❌ 실패'}")
print(f"  결과 이미지:     {'✅ ' + d2 if d2 else '❌ 실패'}")
print(f"  원본 인포그래픽: {'✅ ' + d3 if d3 else '❌ 실패 (원래 AI 생성 가짜 QR)'}")
print()

if d1 and d2 and d1 == d2:
    print("  🎯 결론: 새 QR과 결과 이미지의 QR 토큰값이 일치합니다!")
