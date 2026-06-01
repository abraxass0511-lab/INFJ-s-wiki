---
id: "workout-app-firebase-cicd-20260528"
category: "[[10_Wiki/🚀 Skills]]"
confidence_score: 0.93
tags: ["Firebase", "Google-Auth", "Firestore", "GitHub-Actions", "CI-CD", "Vite", "PWA", "CDN", "환경변수", "배포", "인증", "클라우드동기화", "React", "GitHub-Pages", "HashRouter", "이모지", "navigator-share", "모바일"]
last_reinforced: 2026-05-28
github_commit: "faf88ed"
---

# [[운동관리 PWA 개발 — Firebase 연동, Google 로그인, GitHub Actions CI/CD 전체 기록]]

## 📌 한 줄 통찰 (The Karpathy Summary)
> PWA를 GitHub Pages에 배포할 때는 HashRouter + base path 설정이 필수이며, Firebase SDK(npm)는 Vite 8 + Node 24에서 빌드 크래시를 유발하므로 CDN compat 방식으로 전환하고 GitHub Actions(Node 20)에서 빌드해야 한다. Google OAuth는 인앱 브라우저에서 차단되므로 popup 우선 전략이 필요하며, API 키는 GitHub Secrets → Vite 환경변수로 빌드 시 주입한다.

## 📖 구조화된 지식 (Synthesized Content)

### 추출된 패턴
- **풀스택 PWA 개발** — React + Vite + Firebase + GitHub Pages로 모바일 우선 PWA 완성
- **GitHub Pages SPA** — HashRouter 사용 + vite `base` 설정 + 404.html redirect 필수
- **이미지 경로** — `import.meta.env.BASE_URL`로 동적 경로 참조 필수 (하드코딩 금지)
- **이모지 호환성** — 복합 이모지(가족 👨‍👩‍👧)는 플랫폼마다 깨질 수 있음 → 단순 이모지(🏃‍♂️) 사용
- **Firebase SDK 번들 문제** — npm 패키지 Vite 빌드 크래시 → CDN compat 방식으로 우회
- **Node 버전 호환성** — Node 24 + Vite 8(rolldown) 네이티브 모듈 충돌 → CI에서 Node 20 사용
- **Google OAuth 제한** — 인앱 브라우저(WebView)에서 차단 → popup 우선 전략
- **공유 API 분기** — PC의 `navigator.share`는 Windows 공유 시트를 뜨게 함 → `isMobile` 체크 필수
- **환경변수 보안** — GitHub Secrets → 빌드 시 VITE_ 접두사로 주입

---

## 0️⃣ 앱 개요 — Antigravity 운동관리 PWA

### 앱 소개

```
Antigravity 운동관리 앱
  - 이름: 집돌이 (운동관리하는에이전트)
  - 유형: PWA (Progressive Web App)
  - 목적: 개인 운동 습관 관리 + 가족 공유
  - URL: https://abraxass0511-lab.github.io/workout/
  - 저장소: https://github.com/abraxass0511-lab/workout
```

### 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **프론트엔드** | React | 19.x |
| **빌드 도구** | Vite | 8.0.14 |
| **라우팅** | React Router (HashRouter) | 7.15.1 |
| **아이콘** | Lucide React | 1.16.0 |
| **스타일** | Vanilla CSS (다크 테마, 글라스모피즘) | - |
| **인증** | Firebase Auth (Google OAuth) | 11.8.1 (CDN) |
| **DB** | Firebase Firestore | 11.8.1 (CDN) |
| **배포** | GitHub Pages (gh-pages 브랜치) | - |
| **CI/CD** | GitHub Actions | - |
| **AI** | Gemini API (리포트 생성) | - |

### 주요 기능 5가지

```
1. 📅 캘린더 (CalendarPage)
   - 월별 운동 기록 표시
   - 날짜별 운동 완료/미완료 체크 (초록🟢/빨강🔴)
   - 오늘 날짜 하이라이트
   - 운동 완료 시 가족에게 메시지 전송 (SendSavingsModal)

2. 💪 루틴 관리 (RoutinePage)
   - 요일별 운동 루틴 설정
   - 운동 종목/세트/횟수 커스터마이징
   - 운동 목표 관리

3. 🏆 성적표 (AchievementPage)
   - 월별 운동 달성률 통계
   - Gemini AI 총평 리포트 생성
   - 스트릭(연속 운동일) 표시
   - 동기부여 메시지

4. ⚙️ 설정 (SettingsPage)
   - 프로필 수정 (이름, 닉네임, 키)
   - 체중 기록 + 변화 이력
   - BMI 자동 계산
   - Google 계정 정보 표시
   - 로그아웃
   - 데이터 초기화

5. 🔔 모달/알림
   - 월초 체중 입력 알림 (MonthlyWeightModal)
   - 월간 리워드 모달 (MonthlyRewardModal)
   - 운동 완료 메시지 공유 (SendSavingsModal)
   - 알림 토스트 (NotificationToast)
```

### 프로젝트 구조

```
운동관리하는에이전트(집돌이)/
├── public/
│     └── images/          ← 아바타 이미지 (fit, normal, overweight, underweight)
├── src/
│     ├── pages/           ← 6개 페이지
│     │     ├── LoginPage.jsx        ← Google 로그인
│     │     ├── OnboardingPage.jsx   ← 첫 사용자 설정
│     │     ├── CalendarPage.jsx     ← 월별 운동 기록
│     │     ├── RoutinePage.jsx      ← 요일별 루틴 관리
│     │     ├── AchievementPage.jsx  ← 성적표 + AI 리포트
│     │     └── SettingsPage.jsx     ← 프로필/체중/로그아웃
│     ├── components/      ← 5개 공통 컴포넌트
│     │     ├── BottomNav.jsx          ← 하단 탭 네비게이션
│     │     ├── MonthlyWeightModal.jsx ← 월초 체중 입력
│     │     ├── MonthlyRewardModal.jsx ← 월간 리워드
│     │     ├── SendSavingsModal.jsx   ← 운동 완료 공유
│     │     └── NotificationToast.jsx  ← 알림 토스트
│     ├── contexts/        ← 상태 관리 (React Context + useReducer)
│     │     ├── UserContext.jsx     ← 사용자 프로필, 체중 이력
│     │     └── WorkoutContext.jsx  ← 운동 기록, 루틴
│     ├── utils/           ← 유틸리티
│     │     ├── firebase.js        ← Firebase Auth + Firestore
│     │     ├── storage.js         ← localStorage 래퍼
│     │     ├── dateUtils.js       ← 날짜/BMI 계산
│     │     └── reportGenerator.js ← Gemini AI 리포트 생성
│     ├── App.jsx          ← 라우팅 + 인증 상태 관리
│     ├── App.css
│     ├── index.css        ← 디자인 시스템 (CSS 변수, 다크테마)
│     └── main.jsx         ← 엔트리포인트
├── index.html             ← Firebase CDN 스크립트
├── vite.config.js         ← base: '/workout/'
├── firebase.json          ← Firestore rules 경로
├── firestore.rules        ← 보안 규칙
├── .firebaserc            ← Firebase 프로젝트 연결
├── .github/workflows/
│     └── deploy.yml       ← CI/CD 자동 배포
└── package.json
```

### 상태 관리 아키텍처

```
React Context + useReducer 패턴

UserContext (사용자 데이터)
  ├── state: { name, nickname, heightCm, weightKg, weightHistory[], ... }
  ├── dispatch → userReducer
  ├── localStorage 자동 저장 (useEffect)
  └── Firestore 동기화 (saveUserData)

WorkoutContext (운동 데이터)
  ├── state: { records: {날짜: {completed, routines}}, routines: {요일: [...]} }
  ├── dispatch → workoutReducer
  ├── localStorage 자동 저장 (useEffect)
  └── Firestore 동기화 (saveWorkoutData)

데이터 흐름:
  사용자 입력 → dispatch(action) → reducer → 새 state
    → useEffect → localStorage 저장
    → useEffect → Firestore 저장 (클라우드 백업)
```

### 디자인 시스템

```
CSS 변수 기반 다크 테마:
  --bg-primary: #0a0a0f          (배경)
  --bg-glass: rgba(255,255,255,0.05) (글라스모피즘)
  --accent: #6366f1              (보라색 강조)
  --green: #4ade80               (운동 완료)
  --red: #ef4444                 (운동 미완료)
  --gradient-green: linear-gradient(135deg, #4ade80, #22c55e)

UI 특징:
  - 모바일 퍼스트 디자인
  - 하단 탭 네비게이션 (4탭)
  - 글라스모피즘 카드
  - 부드러운 애니메이션 (fadeIn, slideUp)
  - 아바타 시스템 (BMI에 따라 4종 아바타 변경)
```

---

## 1️⃣ GitHub Pages 배포 — SPA 라우팅 문제 해결

### 문제: GitHub Pages에서 새로고침 시 404

```
GitHub Pages는 정적 파일 서버
  → /workout/routine → 404 (서버에 해당 파일 없음)
  → SPA는 클라이언트 라우팅이 필요

해결:
  1. BrowserRouter → HashRouter 변경
     /workout/#/routine → index.html이 항상 로드됨
  2. vite.config.js에 base 설정
     base: '/workout/'   ← 리포지토리명과 일치
```

### HashRouter vs BrowserRouter

| 항목 | BrowserRouter | HashRouter |
|------|-------------|-----------|
| URL 형태 | `/workout/routine` | `/workout/#/routine` |
| 서버 설정 | rewrite 규칙 필요 | 불필요 |
| GitHub Pages | ❌ 404 발생 | ✅ 정상 작동 |
| SEO | 좋음 | 나쁨 (해시 무시됨) |
| PWA 용도 | 서버 필요 | ✅ 추천 |

### 이미지 경로 문제

```javascript
// ❌ 하드코딩 — 로컬에서만 작동
<img src="/images/avatar.png" />

// ✅ 동적 경로 — 배포 환경에서도 작동
<img src={`${import.meta.env.BASE_URL}images/avatar.png`} />

// vite.config.js에서 base: '/workout/' 설정 시
// import.meta.env.BASE_URL === '/workout/'
```

---

## 2️⃣ 이모지 호환성 — 가족 이모지 깨짐

### 문제

```
복합 이모지 (ZWJ 시퀀스):
  👨‍👩‍👧 = 👨 + ZWJ + 👩 + ZWJ + 👧 (3개 이모지 결합)
  
일부 모바일 기기에서 결합이 풀려 깨져 보임:
  👨👩👧 (분리되어 표시)

해결:
  단순 이모지만 사용 → 🏃‍♂️ (달리는 남자)
  복합 이모지 제거
```

### 수정 파일

```
src/pages/AchievementPage.jsx
  - 가족 이모지(👨‍👩‍👧‍👦) 제거
  - 달리는 남자(🏃‍♂️) 이모지만 유지
```

---

## 3️⃣ Firebase 프로젝트 설정

### Firebase 콘솔 설정 순서

```
Firebase Console (console.firebase.google.com)
├── 1. 프로젝트 생성 (antigravity-workout-app1)
├── 2. 웹 앱 추가 (Antigravity Web)
├── 3. Authentication 활성화
│     ├── 익명 (Anonymous) ✅
│     └── Google ✅
├── 4. Firestore Database 생성
│     ├── 버전: Standard (무료)
│     ├── 위치: asia-northeast3 (서울)
│     └── 모드: 테스트 모드 (30일 제한)
└── 5. 승인된 도메인 추가
      └── abraxass0511-lab.github.io
```

### MCP로 Firebase 프로젝트 관리

```
Firebase MCP 서버 연결 후 사용 가능한 도구:
  - firebase_get_project: 프로젝트 정보 조회
  - firebase_create_app: 웹 앱 생성
  - firebase_get_sdk_config: SDK 설정 값 가져오기
  - firebase_deploy: 규칙/호스팅 배포
  - firestore_* : Firestore CRUD 조작
```

### Firestore 무료 한도 (Spark 플랜)

| 항목 | 무료 제한 | 개인 앱 예상 사용량 |
|------|----------|------------------|
| 저장 용량 | 1GB | 수 KB |
| 읽기 | 5만/일 | ~100/일 |
| 쓰기 | 2만/일 | ~50/일 |
| 인증 사용자 | 무제한 | 1명 |

### Firestore 테스트 모드 vs 프로덕션 모드

```
테스트 모드:
  → 30일간 누구나 읽기/쓰기 가능
  → 30일 후 모든 접근 차단됨 (앱 중단!)
  → 나중에 변경 가능 (보안 규칙 업데이트)

프로덕션 모드:
  → 처음부터 보안 규칙 필수
  → 규칙 없으면 모든 접근 차단

권장: 테스트 모드로 시작 → 바로 보안 규칙 배포
```

---

## 4️⃣ Firebase SDK — npm vs CDN compat

### 문제: npm 패키지 빌드 크래시

```
증상:
  vite v8.0.14 building client environment for production...
  ✓ 1789 modules transformed.
  (크래시 — 출력 없이 종료)

Exit code: -1073740791 (STATUS_HEAP_CORRUPTION)

원인:
  Node 24 + Vite 8(rolldown 네이티브 모듈) 호환성 문제
  Firebase SDK가 1700+ 모듈을 번들에 포함 → 메모리 압박

시도한 해결책 (모두 실패):
  ✗ --max-old-space-size=8192
  ✗ manualChunks로 Firebase 분리 (Vite 8은 함수형만 지원)
  ✗ Vite 7, 6, 5 다운그레이드
  ✗ node_modules 삭제 후 재설치
  ✗ dev 서버 종료 후 빌드
  ✗ Firebase npm 패키지 제거 후 빌드 (동일 크래시 → Node 24 자체 문제)
```

### 해결: CDN compat 방식

```html
<!-- index.html에 스크립트 태그 추가 -->
<script src="https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/11.8.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore-compat.js"></script>
```

### npm vs CDN 비교

| 항목 | npm (모듈형) | CDN (compat) |
|------|------------|--------------|
| import | `import { getAuth } from 'firebase/auth'` | `window.firebase.auth()` |
| 번들 크기 | 200KB+ (tree-shaken) | 0 (런타임 CDN 로드) |
| 빌드 포함 | ✅ 포함 | ❌ 미포함 |
| Vite 8 + Node 24 | ❌ 크래시 | ✅ 문제 없음 |
| Tree-shaking | ✅ | ❌ 전체 로드 |
| API 스타일 | v9 모듈형 | v8 네임스페이스 |

### CDN compat 코드 패턴

```javascript
// firebase.js — window.firebase 사용
function ensureInit() {
  if (app) return true;
  const fb = window.firebase;    // CDN에서 로드된 전역 객체
  if (!fb) return false;
  app = fb.initializeApp(config);
  auth = fb.auth();              // compat API
  db = fb.firestore();           // compat API
  return true;
}

// Firestore CRUD (compat v8 스타일)
await db.collection('users').doc(uid).set(
  { profile: data, updatedAt: new Date().toISOString() },
  { merge: true }
);

// CDN 로드 대기 (async)
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebase) { resolve(); return; }
    const check = setInterval(() => {
      if (window.firebase) { clearInterval(check); resolve(); }
    }, 50);
    setTimeout(() => { clearInterval(check); resolve(); }, 5000);
  });
}
```

---

## 5️⃣ Google 로그인 — 인앱 브라우저 차단

### 에러: `403 disallowed_useragent`

```
Google은 2016년부터 WebView(인앱 브라우저)에서 OAuth 차단

발생 환경:
  ❌ 카카오톡 내 브라우저
  ❌ 네이버앱 내 브라우저
  ❌ 인스타그램 내 브라우저
  ✅ Chrome 앱 직접 열기
  ✅ Safari 직접 열기
  ✅ Samsung Internet (보통 가능)
```

### 로그인 전략: popup 우선 → redirect fallback

```javascript
export async function signInWithGoogle() {
  const provider = new window.firebase.auth.GoogleAuthProvider();

  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (e) {
    if (e.code === 'auth/popup-blocked' ||
        e.code === 'auth/popup-closed-by-user') {
      await auth.signInWithRedirect(provider);
    }
    if (e.code === 'auth/unauthorized-domain') throw e;
    return null;
  }
}
```

### signInWithPopup vs signInWithRedirect

| 항목 | popup | redirect |
|------|-------|----------|
| 동작 | 새 창 열림 | 현재 페이지 이동 → 복귀 |
| 모바일 Chrome | ✅ | ✅ (getRedirectResult 필요) |
| 인앱 브라우저 | ❌ | ❌ |
| 구현 난이도 | 쉬움 | 복잡 (리다이렉트 결과 처리) |
| 추천 | ✅ 우선 사용 | fallback으로만 |

### 앱 인증 흐름

```
앱 시작
  ├── Firebase CDN 로드 대기 (waitForFirebase)
  ├── onAuthStateChanged 리스너 등록
  ├── 사용자 없음 → LoginPage 표시
  │     └── "Google로 시작하기" 버튼 클릭
  │           └── signInWithPopup → 성공 → onAuthStateChanged 트리거
  ├── 사용자 있음 → CloudSync (Firestore에서 데이터 로드)
  │     └── AppContent 렌더링 (캘린더, 루틴 등)
  └── 설정 > 로그아웃 → auth.signOut() → LoginPage로 이동
```

### 승인된 도메인 설정 (필수!)

```
Firebase Console → Authentication → 설정 → 승인된 도메인
  기본 포함:
    localhost
    antigravity-workout-app1.firebaseapp.com
  반드시 추가:
    abraxass0511-lab.github.io    ← 이걸 안 하면 로그인 에러
```

### 로그인 페이지 UI 구성

```
LoginPage.jsx + LoginPage.css
  - 그라디언트 배경 (#667eea → #764ba2)
  - 글라스모피즘 카드
  - Google 로고 SVG 버튼
  - 로딩/에러 상태 표시
  - 에러 코드별 구체적 메시지 (unauthorized-domain 등)
```

---

## 6️⃣ 모바일/PC 공유 — navigator.share 분기

### 문제: PC에서도 공유 시트가 뜸

```
Windows 10/11 + Chrome/Edge → navigator.share 존재!
  → 무조건 사용하면 Windows 공유 시트가 뜨는 문제
  → 카카오톡이 목록에 없어 불편

해결: isMobile 체크 후 분기
```

### 최종 공유 전략

```javascript
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

if (isMobile && navigator.share) {
  // 모바일: 네이티브 공유 시트 (카카오톡 등 선택 가능)
  await navigator.share({ title: '안티그래비티', text: msg });
} else {
  // PC: 클립보드 복사만
  await navigator.clipboard.writeText(msg);
  alert('📋 메시지가 복사되었습니다!\n카카오톡 PC에서 붙여넣기(Ctrl+V) 해주세요.');
}
```

### 공유 버튼 UI 분기

```
모바일 → "공유하기 (카카오톡 등)" 버튼 + 카카오 아이콘
PC     → "📋 메시지 복사하기" 버튼
```

---

## 7️⃣ GitHub Actions CI/CD

### 로컬 빌드 불가 → CI 빌드로 전환

```
문제: Node 24(로컬) + Vite 8 → 빌드 크래시 (STATUS_HEAP_CORRUPTION)
해결: GitHub Actions에서 Node 20으로 빌드

장점:
  ✅ Node 20 안정 환경 (LTS)
  ✅ push만 하면 자동 빌드 + gh-pages 배포
  ✅ GitHub Secrets로 API 키 안전 주입
```

### 워크플로우 설정

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [master]

permissions:
  contents: write    # ← write 필수! (gh-pages push)

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install     # npm ci 아닌 install
      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### CI/CD 트러블슈팅 이력

| 문제 | 원인 | 해결 |
|------|------|------|
| `npm ci` 실패 | Node 24(로컬) vs 20(CI) lock 불일치 | `npm install` 사용 |
| gh-pages push 403 | `contents: read` 기본값 | `contents: write`로 변경 |
| Secrets 이름 불일치 | `GEMINI_API_KEY` vs `VITE_GEMINI_API_KEY` | env에서 매핑 |
| 빌드 크래시 (로컬) | Node 24 + Vite 8 rolldown | CI에서 Node 20 사용 |

---

## 8️⃣ Vite 환경변수 — API 키 보안

### 환경변수 주입 흐름

```
GitHub Secrets (GEMINI_API_KEY)
  ↓ workflow env 매핑
Vite 빌드 환경변수 (VITE_GEMINI_API_KEY)
  ↓ import.meta.env
클라이언트 코드 (import.meta.env.VITE_GEMINI_API_KEY)
```

### Vite 환경변수 규칙

```
✅ VITE_ 접두사 필수 — import.meta.env.VITE_XXX
❌ VITE_ 없으면 — 클라이언트 코드에서 접근 불가

주의: VITE_ 환경변수는 빌드된 JS에 문자열로 포함됨
  → 브라우저 개발자 도구로 볼 수 있음
  → 완전한 보안은 아님 (서버사이드 권장)
```

### 설정 페이지에서 API 키 UI 제거

```
이전: 설정 > Gemini API 키 > 사용자가 직접 입력
이후: GitHub Secrets에서 빌드 시 자동 주입
  → 설정 페이지에서 Key 입력 UI 삭제
  → AchievementPage에서 import.meta.env.VITE_GEMINI_API_KEY 사용
```

---

## 9️⃣ Firestore 보안 규칙

### 인증 사용자만 자기 데이터 접근

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 배포

```powershell
# firebase.json에 rules 경로 설정 필요
npx firebase-tools deploy --only firestore:rules --project antigravity-workout-app1
```

---

## 🔟 설정 페이지 업데이트

### 추가된 기능

```
프로필 카드:
  - Google 프로필 사진 표시 (getCurrentUser().photoURL)
  - 이메일 표시 (getCurrentUser().email)

로그아웃 버튼:
  - 빨간색 LogOut 아이콘
  - signOut() 호출 → LoginPage로 이동

제거된 기능:
  - Gemini API 키 입력 UI
```

---

## 📋 오늘의 전체 커밋 이력

```
cc68d05 Initial commit: Antigravity workout tracker
bd757cc Update base path to workout
fabacfe Switch to HashRouter for GitHub Pages
8de0df0 Fix avatar image paths for GitHub Pages
e8acac2 Fix broken family emoji, keep running man only
9b8d493 Add Firebase sync + GitHub Actions CI/CD
4f0e9d7 Fix CI: use npm install instead of npm ci
06a0937 Fix CI: add write permissions for gh-pages deploy
784a571 Fix mobile share: use navigator.share first, fallback to clipboard
95a6370 Add Google login UI, logout button, auth flow
716cb8e Fix PC share: clipboard only, no Windows share sheet
2aaff81 Fix mobile Google login: use redirect instead of popup
2882b4f Fix: handle redirect result, wait for CDN, async auth flow
035eb8e Fix: popup-first auth, better error messages
dbb0468 Remove Gemini key from settings, use GitHub Secrets env var
faf88ed Fix: map GEMINI_API_KEY secret to VITE_GEMINI_API_KEY
```

---

## 📂 수정된 파일 전체 목록

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | Firebase CDN 스크립트 태그 추가 |
| `vite.config.js` | base: '/workout/' 설정 |
| `src/App.jsx` | HashRouter, 인증 상태 관리, CloudSync 컴포넌트 |
| `src/App.css` | 로딩 스피너 스타일 |
| `src/utils/firebase.js` | [NEW] Firebase compat SDK, Google Auth, Firestore CRUD |
| `src/pages/LoginPage.jsx` | [NEW] Google 로그인 페이지 |
| `src/pages/LoginPage.css` | [NEW] 로그인 UI 스타일 |
| `src/pages/AchievementPage.jsx` | 이모지 수정, Gemini 키 환경변수 전환 |
| `src/pages/SettingsPage.jsx` | 프로필 사진/이메일 표시, 로그아웃, API 키 UI 제거 |
| `src/pages/SettingsPage.css` | 프로필 이미지, 로그아웃 스타일 |
| `src/components/SendSavingsModal.jsx` | 공유 로직 개선 (popup/clipboard 분기) |
| `src/contexts/UserContext.jsx` | 클라우드 동기화 useEffect |
| `src/contexts/WorkoutContext.jsx` | 클라우드 동기화 useEffect |
| `firestore.rules` | [NEW] Firestore 보안 규칙 |
| `firebase.json` | [NEW] Firebase 설정 |
| `.firebaserc` | [NEW] Firebase 프로젝트 연결 |
| `.github/workflows/deploy.yml` | [NEW] CI/CD 자동 빌드+배포 |

---

## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- **"Firebase npm이 표준" 오해:** Vite 8 + Node 24에서는 빌드 불가 → CDN compat가 현실적 대안
- **"navigator.share는 모바일만" 오해:** Windows 10/11에서도 지원됨 → isMobile 분기 필수
- **"signInWithRedirect가 모바일에서 안정적" 오해:** 페이지 리로드로 상태 관리 복잡 → signInWithPopup이 Chrome에서 더 안정적
- **"npm ci가 CI에서 표준" 오해:** Node 버전 차이로 lock 파일 불일치 → npm install이 안전
- **"BrowserRouter가 더 좋다" 오해:** GitHub Pages에서는 HashRouter 필수 (서버 rewrite 불가)
- **복합 이모지 깨짐:** 가족 이모지(👨‍👩‍👧)는 ZWJ 시퀀스로 일부 기기에서 깨짐 → 단순 이모지 사용
- **Firestore 테스트 모드 함정:** 30일 후 모든 접근 차단 → 보안 규칙 미배포 시 앱 중단
- **GitHub Actions permissions:** `contents: read` 기본값 → gh-pages push 403 → `contents: write` 필요
- **Vite manualChunks:** v8에서는 객체가 아닌 함수형만 지원 (rolldown 변경)

## 🔗 지식 연결 (Graph)
- **Parent:** [[10_Wiki/🚀 Skills/웹 개발]]
- **Related:** [[Antigravity CLI/SDK 설치 — Windows 트러블슈팅 & 제품 구분 가이드]], [[GitHub Pages PWA 배포]], [[React SPA 라우팅]]
- **Raw Source:** [[00_Raw/2026-05-28/2026-05-28_Firebase_Google_Auth_GitHub_Actions_CI_CD]]
