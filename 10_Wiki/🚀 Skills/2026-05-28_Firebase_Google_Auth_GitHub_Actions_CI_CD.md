---
id: "6ecd8945-5eb5-4560-9c7e-c2703e1089af"
category: "[[10_Wiki/🚀 Skills]]"
confidence_score: 0.35
tags: ["skills", "script", "workflow", "패턴", "0a0a0f", "6366f1", "4ade80", "ef4444"]
last_reinforced: 2026-06-01
github_commit: "pending"
---


# [[2026-05-28_Firebase_Google_Auth_GitHub_Actions_CI_CD]]


## 📌 한 줄 통찰 (The Karpathy Summary)
> id: "workout-app-firebase-cicd-20260528"


## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- **[[운동관리 PWA 개발 — Firebase 연동, Google 로그인, GitHub Actions CI/CD 전체 기록]]**
- **📌 한 줄 통찰 (The Karpathy Summary)**
- **📖 구조화된 지식 (Synthesized Content)**
- **추출된 패턴**
- **0️⃣ 앱 개요 — Antigravity 운동관리 PWA**
- **앱 소개**
- **기술 스택**
- **주요 기능 5가지**
### 세부 내용
- **풀스택 PWA 개발** — React + Vite + Firebase + GitHub Pages로 모바일 우선 PWA 완성
- **GitHub Pages SPA** — HashRouter 사용 + vite `base` 설정 + 404.html redirect 필수
- **이미지 경로** — `import.meta.env.BASE_URL`로 동적 경로 참조 필수 (하드코딩 금지)
- **이모지 호환성** — 복합 이모지(가족 👨‍👩‍👧)는 플랫폼마다 깨질 수 있음 → 단순 이모지(🏃‍♂️) 사용
- **Firebase SDK 번들 문제** — npm 패키지 Vite 빌드 크래시 → CDN compat 방식으로 우회
- **Node 버전 호환성** — Node 24 + Vite 8(rolldown) 네이티브 모듈 충돌 → CI에서 Node 20 사용
- **Google OAuth 제한** — 인앱 브라우저(WebView)에서 차단 → popup 우선 전략
- **공유 API 분기** — PC의 `navigator.share`는 Windows 공유 시트를 뜨게 함 → `isMobile` 체크 필수
- **환경변수 보안** — GitHub Secrets → 빌드 시 VITE_ 접두사로 주입
- - 이름: 집돌이 (운동관리하는에이전트)
- - 유형: PWA (Progressive Web App)
- - 목적: 개인 운동 습관 관리 + 가족 공유
- - URL: https://abraxass0511-lab.github.io/workout/
- - 저장소: https://github.com/abraxass0511-lab/workout
- - 월별 운동 기록 표시
- - 날짜별 운동 완료/미완료 체크 (초록🟢/빨강🔴)
- - 오늘 날짜 하이라이트
- - 운동 완료 시 가족에게 메시지 전송 (SendSavingsModal)
- - 요일별 운동 루틴 설정
- - 운동 종목/세트/횟수 커스터마이징
- - 운동 목표 관리
- - 월별 운동 달성률 통계
- - Gemini AI 총평 리포트 생성
- - 스트릭(연속 운동일) 표시
- - 동기부여 메시지
- - 프로필 수정 (이름, 닉네임, 키)
- - 체중 기록 + 변화 이력
- - BMI 자동 계산
- - Google 계정 정보 표시
- - 로그아웃
- - 데이터 초기화
- - 월초 체중 입력 알림 (MonthlyWeightModal)
- - 월간 리워드 모달 (MonthlyRewardModal)
- - 운동 완료 메시지 공유 (SendSavingsModal)
- - 알림 토스트 (NotificationToast)
- - 모바일 퍼스트 디자인
- - 하단 탭 네비게이션 (4탭)
- - 글라스모피즘 카드
- - 부드러운 애니메이션 (fadeIn, slideUp)
- - 아바타 시스템 (BMI에 따라 4종 아바타 변경)
- - 가족 이모지(👨‍👩‍👧‍👦) 제거
- - 달리는 남자(🏃‍♂️) 이모지만 유지
- - firebase_get_project: 프로젝트 정보 조회
- - firebase_create_app: 웹 앱 생성
- - firebase_get_sdk_config: SDK 설정 값 가져오기
- - firebase_deploy: 규칙/호스팅 배포
- - firestore_* : Firestore CRUD 조작
- - 그라디언트 배경 (#667eea → #764ba2)
- - 글라스모피즘 카드
- - Google 로고 SVG 버튼
- - 로딩/에러 상태 표시
- - 에러 코드별 구체적 메시지 (unauthorized-domain 등)
- - uses: actions/checkout@v4
- - uses: actions/setup-node@v4
- - run: npm install     # npm ci 아닌 install
- - name: Build
- - uses: peaceiris/actions-gh-pages@v3
- - Google 프로필 사진 표시 (getCurrentUser().photoURL)
- - 이메일 표시 (getCurrentUser().email)
- - 빨간색 LogOut 아이콘
- - signOut() 호출 → LoginPage로 이동
- - Gemini API 키 입력 UI
- **"Firebase npm이 표준" 오해:** Vite 8 + Node 24에서는 빌드 불가 → CDN compat가 현실적 대안
- **"navigator.share는 모바일만" 오해:** Windows 10/11에서도 지원됨 → isMobile 분기 필수
- **"signInWithRedirect가 모바일에서 안정적" 오해:** 페이지 리로드로 상태 관리 복잡 → signInWithPopup이 Chrome에서 더 안정적
- **"npm ci가 CI에서 표준" 오해:** Node 버전 차이로 lock 파일 불일치 → npm install이 안전
- **"BrowserRouter가 더 좋다" 오해:** GitHub Pages에서는 HashRouter 필수 (서버 rewrite 불가)
- **복합 이모지 깨짐:** 가족 이모지(👨‍👩‍👧)는 ZWJ 시퀀스로 일부 기기에서 깨짐 → 단순 이모지 사용
- **Firestore 테스트 모드 함정:** 30일 후 모든 접근 차단 → 보안 규칙 미배포 시 앱 중단
- **GitHub Actions permissions:** `contents: read` 기본값 → gh-pages push 403 → `contents: write` 필요
- **Vite manualChunks:** v8에서는 객체가 아닌 함수형만 지원 (rolldown 변경)
- **Parent:** [[10_Wiki/🚀 Skills/웹 개발]]
- **Related:** [[Antigravity CLI/SDK 설치 — Windows 트러블슈팅 & 제품 구분 가이드]], [[GitHub Pages PWA 배포]], [[React SPA 라우팅]]
- **Raw Source:** [[00_Raw/2026-05-28/2026-05-28_Firebase_Google_Auth_GitHub_Actions_CI_CD]]


## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- 현재 충돌 없음. 최초 분류 시점.
- **정책 변화:** 이 문서의 분류를 통해 해당 카테고리의 가중치가 미세 조정됨.


## 🔗 지식 연결 (Graph)
- **Parent:** [[🚀 Skills]]
- **Related:** [[script]], [[workflow]], [[패턴]], [[스크립트]], [[도구]]
- **Raw Source:** [[00_Raw/2026-06-01/2026-05-28_Firebase_Google_Auth_GitHub_Actions_CI_CD]]