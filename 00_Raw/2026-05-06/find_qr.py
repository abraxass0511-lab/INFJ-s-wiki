"""
QR 코드 좌표 정밀 탐색
원본 인포그래픽(1672x941)에서 QR코드의 정확한 정사각형 좌표를 찾기
"""
from PIL import Image
import numpy as np

infographic = Image.open("ChatGPT Image 2026년 5월 7일 오후 12_58_43.png")
width, height = infographic.size
print(f"이미지 크기: {width}x{height}")

# QR 코드는 우측 하단에 위치 - 더 넓은 영역에서 정밀 탐색
# 우측 40%, 하단 55%
sx = int(width * 0.60)
sy = int(height * 0.45)

crop = infographic.crop((sx, sy, width, height))
img_array = np.array(crop)

# QR 코드의 특징: Finder Pattern (좌상, 우상, 좌하 모서리의 검은 사각형)
# 흑백 비율이 높은 영역을 찾기 위해 RGB -> 그레이스케일 -> 이진화
gray = np.mean(img_array[:,:,:3], axis=2)
binary = (gray < 100).astype(np.uint8)  # 더 엄격한 threshold

# 열(column)별 흑색 밀도 프로파일
col_profile = binary.mean(axis=0)
# 행(row)별 흑색 밀도 프로파일  
row_profile = binary.mean(axis=1)

# QR 코드 영역은 밀도가 일정 수준(20%+) 이상인 연속 열/행
print("\n=== 열(column) 밀도 프로파일 (상위) ===")
for i in range(0, len(col_profile), 10):
    if col_profile[i] > 0.08:
        print(f"  col={i+sx}: density={col_profile[i]:.3f}")

print("\n=== 행(row) 밀도 프로파일 (상위) ===")
for i in range(0, len(row_profile), 10):
    if row_profile[i] > 0.08:
        print(f"  row={i+sy}: density={row_profile[i]:.3f}")

# 보다 정확한 방법: 슬라이딩 윈도우로 정사각형 QR 영역 탐색
# QR 코드의 예상 크기: 이미지 높이의 ~20-30% 정도
expected_qr_size = int(height * 0.22)  # ~207px
print(f"\n예상 QR 크기: ~{expected_qr_size}px")

# 각 위치에서 정사각형 영역의 흑색 밀도 계산
best_score = 0
best_pos = (0, 0)
best_size = expected_qr_size

step = 5
for test_size in range(expected_qr_size - 40, expected_qr_size + 40, 10):
    for y in range(0, len(row_profile) - test_size, step):
        for x in range(0, len(col_profile) - test_size, step):
            block = binary[y:y+test_size, x:x+test_size]
            density = block.mean()
            
            # QR 코드는 보통 30~55% 흑색 밀도
            if 0.25 < density < 0.60:
                # 추가 검증: 4개 모서리 중 3개에 finder pattern이 있는지
                corner_size = test_size // 5
                corners = [
                    block[:corner_size, :corner_size].mean(),  # 좌상
                    block[:corner_size, -corner_size:].mean(),  # 우상
                    block[-corner_size:, :corner_size].mean(),  # 좌하
                    block[-corner_size:, -corner_size:].mean(), # 우하
                ]
                # Finder pattern이 있는 모서리는 밀도가 높음 (40%+)
                high_corners = sum(1 for c in corners if c > 0.35)
                
                score = density * (high_corners + 1)
                if score > best_score:
                    best_score = score
                    best_pos = (x, y)
                    best_size = test_size
                    best_density = density
                    best_corners = corners

bx, by = best_pos
print(f"\n최적 QR 위치 (탐색 영역 내): ({bx}, {by})")
print(f"크기: {best_size}x{best_size}")
print(f"밀도: {best_density:.3f}")
print(f"모서리 밀도: {[f'{c:.3f}' for c in best_corners]}")

# 절대 좌표
abs_x = sx + bx
abs_y = sy + by
print(f"\n절대 좌표: ({abs_x}, {abs_y}) ~ ({abs_x+best_size}, {abs_y+best_size})")

# 감지된 영역 저장
detected = infographic.crop((abs_x, abs_y, abs_x + best_size, abs_y + best_size))
detected.save("detected_qr_precise.png")
print("정밀 QR 영역 저장: detected_qr_precise.png")
