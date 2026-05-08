"""
"개설이" 텍스트 바로 아래 검은 점 정밀 찾기
"""
from PIL import Image, ImageDraw
import numpy as np

img = Image.open("result_guide_new_qr.png")
img_array = np.array(img)

# "개설이 필요한" 텍스트는 대략 y=480~510, x=300~500 범위로 추정
# 해당 텍스트 바로 아래(+10~30px)에서 고립된 점 찾기

# 넓은 범위 크롭하여 직접 확인
crop = img.crop((200, 460, 550, 530))
crop.save("debug_gaeseori.png")

# "이" 글자 바로 아래 영역에서 어두운 고립 픽셀 찾기  
# 텍스트 행과 비텍스트 행 구분
for sy1, sy2, sx1, sx2 in [(460, 540, 200, 550)]:
    region = img_array[sy1:sy2, sx1:sx2]
    gray = np.mean(region[:,:,:3], axis=2)
    
    # 각 행의 어두운 픽셀 수
    for y in range(len(gray)):
        dark_count = (gray[y] < 80).sum()
        abs_y = sy1 + y
        if dark_count > 0:
            dark_cols = np.where(gray[y] < 80)[0] + sx1
            print(f"  row={abs_y}: {dark_count}px dark, cols={dark_cols[:20]}")
