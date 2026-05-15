---
id: "8c68a258-47fd-46b3-b955-585ea5a2ede6"
category: "[[10_Wiki/⚖️ Decisions]]"
confidence_score: 0.35
tags: ["decisions", "분석", "vs", "결정", "2026", "05", "15"]
last_reinforced: 2026-05-15
github_commit: "pending"
---


# [[2026-05-15_SafeGuard_MediaPipe_PPE_감지시스템]]


## 📌 한 줄 통찰 (The Karpathy Summary)
> > 📅 2026-05-15 14:10 | 안티그래비티 에이전트 대화에서 자동 추출


## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- **SafeGuard Pro — MediaPipe 기반 건설현장 안전장구(PPE) 실시간 감지 시스템**
- **💡 핵심 요약**
- **📖 오늘 배운 것**
- **1. MediaPipe Object Detector 웹 연동**
- **2. Zone-based PPE 분석 파이프라인**
- **3. 일반 물품 vs 안전장구 엄격 구분 기법**
- **4. 보안경 vs 일반 안경 감지 강화**
- **5. 작업지시서 기반 자동 분류 프로세스**
### 세부 내용
- `@mediapipe/tasks-vision` NPM 패키지로 브라우저에서 바로 실행
- `FilesetResolver.forVisionTasks()` → `ObjectDetector.createFromOptions()` 초기화 패턴
- `runningMode: 'VIDEO'`로 실시간 프레임 처리, `detectForVideo(video, timestamp)` 호출
- EfficientDet Lite0 모델 사용 (경량, 실시간 가능)
- `categoryAllowlist: ['person']`으로 사람만 필터링하여 성능 최적화
- 사람의 바운딩박스를 5개 Zone으로 분할하여 장비별 분석:
- - 머리(0~22%) → 안전모
- - 얼굴(10~28%) → 보안경, 방진마스크
- - 상체(25~55%) → 안전조끼, 하네스
- - 손(50~72%) → 안전장갑, 절연장갑
- - 발(82~100%) → 안전화
- **HSV 색상 공간 분석**: RGB → HSV 변환하여 안전색(고채도 노란/주황/형광) 감지
- **색상 균일도(Color Uniformity)**: 안전모/보안경은 넓은 면적이 한 가지 색 → 균일도 높음
- **에지 밀도(Edge Density)**: 인접 픽셀 간 색상 차이로 구조물(두꺼운 밑창, 스트랩) 감지
- **피부색 비율(Skin Ratio)**: HSV 범위(H:5-45, S:15-65, V:30-85)로 피부 노출 판별
- 3단계 판정: `pass`(통과) / `warning`(유사품 감지) / `fail`(미착용)
- **핵심 기준**: 피부 노출 비율 — 일반 안경은 렌즈가 작아 눈 주변 피부 많이 노출(>20%)
- 보안경 통과 조건 (3가지 모두 충족):
- - ① 렌즈 커버리지 > 35% (넓은 렌즈가 눈 전체를 감쌈)
- - ② 색상 균일도 > 38% (넓고 균일한 렌즈 면적)
- - ③ 피부 노출 < 22% (wrap-around으로 피부 차단)
- 비피부/비머리카락 비율로 안경류 존재 여부 추가 판별
- **키워드 매칭 방식**으로 작업 내용 → 작업 유형 자동 분류:
- - `전기/배선/분전반` → 전기 작업
- - `용접/그라인더/토치` → 용접 작업
- - `고소/비계/사다리/지붕` → 고소 작업
- - `해체/철거/파쇄` → 해체 작업
- - `굴착/터파기/백호` → 굴착 작업
- 분류된 작업에 필수 장비 자동 매핑
- 2단계 Phase UI: 작업지시서 목록 → PPE 검사 모드
- 일반 물품 감지 시 화면 우측 상단에 경고 토스트 표시
- 3초 중복 방지로 알림 스팸 차단
- 유형별 색상 구분: warning(주황), fail(빨강), pass(초록)
- Zone-based 분석을 채택 (전체 이미지 처리 대비 정확도 향상)
- 알고리즘 기반 분류 우선 적용 (커스텀 TFLite 모델 학습은 향후 과제)
- `localStorage`로 작업지시서(`sg_orders`)와 검사이력(`sg_history2`) 관리
- 작업 승인/불합격 시 자동으로 작업 카드 상태 업데이트 후 목록으로 복귀
- MediaPipe Tasks Vision API 웹 통합 패턴 (ES Module import)
- HSV 색상 공간 기반 산업용 안전색 감지 알고리즘
- Canvas API로 실시간 바운딩박스 + Zone 오버레이 렌더링
- 키워드 매칭 기반 작업 유형 자동 분류 엔진
- [[MediaPipe]]
- [[컴퓨터 비전]]
- [[건설 안전 관리]]
- [[HSV 색상 모델]]
- [[Canvas API]]
- [[실시간 객체 감지]]
- **로컬 경로**: `C:\Users\YS\Desktop\안티그래피티\숙제(미디어 파이프)\`
- **GitHub**: `https://github.com/abraxass0511-lab/safeguard-pro`
- **파일 구성**:
- - `index.html` — 2-Phase UI (작업지시서 + PPE 검사)
- - `style.css` — 다크 테마 대시보드 스타일
- - `app.js` — MediaPipe 연동 + 작업지시서 + 카메라 + 감지 루프
- - `ppe-detector.js` — 엄격한 PPE 분류 엔진 (8종 장비)
- MediaPipe Model Maker를 통한 전이 학습(Transfer Learning) 모델 적용
- 모바일 카메라 최적화
- 검사 결과 PDF 보고서 생성
- 서버 연동으로 작업지시서 다중 기기 공유


## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- 현재 충돌 없음. 최초 분류 시점.
- **정책 변화:** 이 문서의 분류를 통해 해당 카테고리의 가중치가 미세 조정됨.


## 🔗 지식 연결 (Graph)
- **Parent:** [[⚖️ Decisions]]
- **Related:** [[분석]], [[vs]], [[결정]]
- **Raw Source:** [[00_Raw/2026-05-15/2026-05-15_SafeGuard_MediaPipe_PPE_감지시스템]]