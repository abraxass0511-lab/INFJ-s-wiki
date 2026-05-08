"""
QR 코드 완전 교체 v3 — 흰색 배경 영역까지 완벽 제거
"""
from PIL import Image, ImageDraw
import numpy as np
import os, shutil

infographic = Image.open("ChatGPT Image 2026년 5월 7일 오후 12_58_43.png")
new_qr = Image.open("Gemini_Generated_Image_42mwsi42mwsi42mw.jpeg")

width, height = infographic.size
img_array = np.array(infographic)

# ── 기존 QR의 흰색 배경 영역 정확히 찾기 ──
# 우측 하단 QR 영역 주변에서 "밝은 픽셀(흰색)" 영역을 탐색
# QR코드 + 흰색 여백 전체를 찾아야 함

# 탐색 범위: 우측 하단 
sx, sy = 1280, 550
region = img_array[sy:830, sx:1580]

# 흰색에 가까운 픽셀 찾기 (R>200, G>200, B>200)
white_mask = np.all(region > 200, axis=2)

# 흑색에 가까운 픽셀 (QR 패턴)
black_mask = np.all(region < 80, axis=2)

# QR = 흰색 + 흑색이 혼재된 영역
qr_mask = white_mask | black_mask

# 행/열별로 QR 픽셀 비율 확인
row_ratio = qr_mask.mean(axis=1)
col_ratio = qr_mask.mean(axis=0)

# QR 영역: 흑백 비율이 50% 이상인 연속 구간
def find_extent(ratios, threshold=0.40):
    indices = np.where(ratios > threshold)[0]
    if len(indices) == 0:
        return 0, len(ratios)
    return int(indices[0]), int(indices[-1])

r_start, r_end = find_extent(row_ratio)
c_start, c_end = find_extent(col_ratio)

# 절대 좌표 + 여유 마진
margin = 8
abs_x1 = sx + c_start - margin
abs_y1 = sy + r_start - margin
abs_x2 = sx + c_end + margin
abs_y2 = sy + r_end + margin

print(f"기존 QR 전체 영역 (흰배경 포함): ({abs_x1},{abs_y1}) ~ ({abs_x2},{abs_y2})")
print(f"크기: {abs_x2-abs_x1}x{abs_y2-abs_y1}")

# 감지 영역 확인용 저장
detected = infographic.crop((abs_x1, abs_y1, abs_x2, abs_y2))
detected.save("detected_full_qr_area.png")

# ── 배경색 샘플링 (QR 바깥의 주황색) ──
samples = []
# QR 왼쪽의 주황색
for y in range(abs_y1 + 20, abs_y2 - 20, 10):
    for x in range(abs_x1 - 25, abs_x1 - 5):
        if 0 <= x < width and 0 <= y < height:
            samples.append(img_array[y, x, :3])
# QR 아래쪽의 주황색
for y in range(abs_y2 + 5, min(abs_y2 + 20, height)):
    for x in range(abs_x1 + 20, abs_x2 - 20, 10):
        if 0 <= x < width and 0 <= y < height:
            samples.append(img_array[y, x, :3])

bg_color = tuple(np.median(samples, axis=0).astype(int))
print(f"배경색: RGB{bg_color}")

# ── 기존 QR 완전 제거 (배경색으로 채움) ──
result = infographic.copy()
draw = ImageDraw.Draw(result)
draw.rectangle([abs_x1, abs_y1, abs_x2, abs_y2], fill=bg_color)

# ── 새 QR 배치 ──
# 새 QR을 정사각형으로 크롭
nq_w, nq_h = new_qr.size
min_side = min(nq_w, nq_h)
cx = (nq_w - min_side) // 2
cy = (nq_h - min_side) // 2
new_qr_square = new_qr.crop((cx, cy, cx + min_side, cy + min_side))

# 영역에 맞게 크기 조정 (여백 확보)
area_w = abs_x2 - abs_x1
area_h = abs_y2 - abs_y1
qr_size = min(area_w, area_h) - 6  # 살짝 안쪽에 배치

new_qr_resized = new_qr_square.resize((qr_size, qr_size), Image.LANCZOS)

# 중앙 배치
center_x = (abs_x1 + abs_x2) // 2
center_y = (abs_y1 + abs_y2) // 2
paste_x = center_x - qr_size // 2
paste_y = center_y - qr_size // 2

result.paste(new_qr_resized, (paste_x, paste_y))
print(f"새 QR: ({paste_x},{paste_y}), 크기: {qr_size}x{qr_size}")

# ── 저장 ──
output_file = "result_guide_new_qr.png"
result.save(output_file, quality=95)
print(f"\n✅ 저장: {output_file}")

dest = os.path.join("C:\\Users\\YS\\Desktop\\새 폴더", output_file)
shutil.copy2(output_file, dest)
print(f"📁 복사: {dest}")

# ── QR 검증 ──
import cv2
result_arr = np.array(result)
detector = cv2.QRCodeDetector()
data, _, _ = detector.detectAndDecode(result_arr)
print(f"\n{'✅ QR 검증: ' + data if data else '📱 스마트폰 스캔 확인 필요'}")
