from PIL import Image
import numpy as np
import shutil

img = Image.open("result_guide_new_qr.png")
arr = np.array(img)
h, w = arr.shape[:2]

# 텍스트 영역(입출금 통장 섹션) 전체에서 고립된 어두운 점 제거
# 고립 = 주변 8방향 중 어두운 픽셀이 적은 경우
gray = np.mean(arr[:,:,:3].astype(float), axis=2)

# 배경색 샘플링 (주변 밝은 영역)
changed = 0
for y in range(2, h-2):
    for x in range(2, w-2):
        if gray[y, x] < 110:  # 어두운 픽셀
            # 주변 11x11 영역에서 어두운 픽셀 수
            region = gray[max(0,y-5):y+6, max(0,x-5):x+6]
            dark_neighbors = (region < 110).sum()
            if dark_neighbors <= 4:  # 본인 포함 4개 이하 = 고립 점
                # 주변 밝은 픽셀의 평균으로 대체
                surround = arr[max(0,y-3):y+4, max(0,x-3):x+4, :3]
                sg = np.mean(surround.reshape(-1, 3).astype(float), axis=1)
                bright_mask = sg >= 110
                if bright_mask.any():
                    bg = surround.reshape(-1, 3)[bright_mask].mean(axis=0).astype(np.uint8)
                    arr[y, x, :3] = bg
                    changed += 1

print(f"제거된 고립 점: {changed}개")
result = Image.fromarray(arr)
result.save("result_guide_new_qr.png")
shutil.copy("result_guide_new_qr.png", r"C:\Users\YS\Desktop\새 폴더\result_guide_new_qr.png")
print("저장 완료")
