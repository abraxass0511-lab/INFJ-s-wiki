---
id: "happiness-tracker-webapp-firebase-deployment-20260619"
category: "[[10_Wiki/💡 Topics]]"
confidence_score: 0.92
tags: ["Firebase", "GoogleAuth", "Firestore", "GitHubPages", "웹앱배포", "감사일기", "행복측정기", "핵심가치", "데일리트래킹", "모바일웹앱"]
last_reinforced: 2026-06-19
github_commit: ""
---

# [[나의 진짜 행복 측정기 — 핵심가치 기반 감사 트래킹 웹앱 구축기]]

## 📌 한 줄 통찰 (The Karpathy Summary)
> 매일 밤 "나와 가족은 건강한가?", "웃으며 함께 시간을 보냈는가?", "하고 싶은 걸 할 시간이 있었는가?" — 이 3가지 질문에 답하는 것만으로 뇌의 행복 기준점을 외부가 아닌 **나의 본질적 가치**로 되돌릴 수 있다. 이를 위한 데일리 트래킹 웹앱을 Firebase + GitHub Pages로 **서버 없이, 무료로** 구축했다.

## 📖 구조화된 지식 (Synthesized Content)

### 왜 만들었는가? — 동기와 철학

외부의 소음이나 타인의 기준에 흔들리지 않고, **나만의 본질적인 가치를 매일 확인**하기 위해 만들었다.

우리는 매일 SNS, 뉴스, 직장에서 "이게 성공이다", "이렇게 살아야 한다"는 외부 기준에 노출된다. 그런데 정작 **나에게 중요한 건 단 3가지**뿐이다:

| 순번 | 나의 핵심 가치 | 매일 밤 자문 |
| --- | --- | --- |
| 1 | 🏥 건강 | 나와 가족은 건강한가? |
| 2 | 👨‍👩‍👧‍👦 가족 | 웃으며 함께 시간을 보냈는가? |
| 3 | 📚 자유 | 하고 싶은 걸 할 시간이 있었는가? |

이 질문들은 결국 **"오늘 하루 감사한가?"**에 대한 구체적 체크리스트다. 자녀가 아빠에게 "아빠, 오늘 하루 행복했어?"라고 묻는 컨셉으로, 매일 밤 스스로를 돌아보는 감사 트래킹 앱을 만들었다.

### 무엇을 만들었는가? — 앱 구조

**"나의 진짜 행복 측정기"** — 매일 밤 3가지 핵심 가치를 체크하고, 달력에 기록을 남기는 웹앱.

- **첫 화면:** 귀여운 아기 캐릭터가 "아빠, 오늘 하루 행복했어?"라고 묻는다
- **체크 화면:** 3가지 질문이 하나씩 팝업되며 체크
- **기록 완료:** 달력 위에 핵심 가치 3가지가 표시되고, 달력에 😊 이모지로 감사한 날이 표시됨
- **달력 클릭:** 과거 기록을 팝업으로 확인 가능
- **설정:** 핵심 가치를 언제든 수정 가능

### 어떻게 구현했는가? — 기술 스택 & 아키텍처

#### 핵심 기술 선택 이유

| 기술 | 선택 이유 |
| --- | --- |
| **Firebase Auth (Google)** | 별도 회원가입 없이 Google 계정 하나로 로그인. 가족 각자 본인 데이터만 접근 |
| **Firestore** | 서버 없이 브라우저에서 직접 DB 접근. 기기 간 동기화 자동 |
| **GitHub Pages** | 정적 호스팅 무료. Push만 하면 자동 배포 |
| **Vanilla JS + CSS** | 프레임워크 없이 가볍게. CDN으로 Firebase SDK만 import |

#### 구현 과정

```
1. UI/UX 설계
   ├── 아기 캐릭터 이미지 생성 (AI)
   ├── 파스텔톤 베이지+화이트 기반 깔끔한 디자인
   └── 모바일 퍼스트 반응형 레이아웃

2. 핵심 기능 구현
   ├── 체크 화면: 3가지 질문 토글 + 감사 메모 입력
   ├── 달력: 월별 뷰 + 감사한 날 😊 표시
   ├── 팝업: 과거 기록 확인
   └── 설정: 핵심 가치 수정

3. Firebase 연동
   ├── 프로젝트 생성 (happiness-tracker-ys)
   ├── Google Auth 활성화
   ├── Firestore DB 생성 (asia-northeast3, Seoul)
   └── 코드에서 CDN import로 SDK 연결

4. 배포
   ├── GitHub 레포 생성 (abraxass0511-lab/happiness-tracker)
   ├── GitHub Actions 워크플로우 (deploy.yml)
   └── GitHub Pages 자동 배포
```

#### Firestore 데이터 구조

```
users/{uid}/
  ├── settings/values
  │   ├── value1: { name: "건강", icon: "🏥", question: "나와 가족은 건강한가?" }
  │   ├── value2: { name: "가족", icon: "👨‍👩‍👧‍👦", question: "웃으며 함께 시간을 보냈는가?" }
  │   └── value3: { name: "자유", icon: "📚", question: "하고 싶은 걸 할 시간이 있었는가?" }
  └── logs/{YYYY-MM-DD}
      ├── check1~3: true/false
      ├── score: 0~3
      ├── note: "오늘 특히 감사한 일"
      └── date: "2026-06-19"
```

#### 비용 구조

| 서비스 | 무료 한도 | 이 앱 예상 사용량 |
| --- | --- | --- |
| Firebase Auth | 무제한 | 가족 5명 = 여유 |
| Firestore 읽기 | 50,000회/일 | ~50회/일 (0.1%) |
| Firestore 쓰기 | 20,000회/일 | ~10회/일 (0.05%) |
| GitHub Pages | 무제한 | 정적 파일 호스팅 |

> **결론: 100% 무료.** Spark(무료) 플랜에서는 한도 초과 시 서비스만 차단되고 과금은 절대 없다.

### 삽질 & 교훈

- **`gratefulDays` 크래시:** HTML에서 "이번 달 감사한 하루 X일" 요소를 삭제했는데, JS의 `renderCalendar()`에서 여전히 `el.gratefulDays.textContent = count`를 참조 → **앱 전체가 멈춤**. DOM 요소 삭제 시 관련 JS 참조도 반드시 함께 정리해야 한다.
- **Firebase 콘솔 자동화 한계:** MCP 도구로 Firestore DB 생성을 시도했으나 Billing 이슈로 실패. Firebase 콘솔에서 수동으로 하는 게 확실하다.
- **CSS 캐시:** `style.css` 수정 후 브라우저에 반영 안 될 때 → `Ctrl+Shift+R` 강제 새로고침.
- **GitHub Pages 도메인 등록:** Firebase Auth에 `abraxass0511-lab.github.io`를 승인 도메인으로 추가해야 Google 로그인이 작동한다.

---

## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- **"완벽한 하루/평온한 하루/지킨 하루" 분류 → 불필요.** 처음에는 체크 개수에 따라 등급을 나눴지만, "지금 행복한가?"에만 집중하기로 결정. 등급보다 **감사** 자체에 초점.
- **"행복" → "감사"로 피벗.** "행복한 하루"보다 "감사한 하루"가 더 본질적. 행복은 기준이 모호하지만, 감사는 구체적으로 체크 가능.
- **localStorage → Firestore 전환.** 처음에는 localStorage로 구현했지만, 모바일+PC 동기화와 다중 사용자 지원을 위해 Firestore로 전환.

---

## 📊 Q&A 데이터셋 (5가지 각도 전개)

| 날짜 | 카테고리 | 질문 | 답변 | 출처 | 상태 |
|------|----------|------|------|------|------|
| 2026-06-19 | 직접(What) | 행복 측정기가 뭐야? | 매일 밤 나의 핵심 가치 3가지(건강, 가족, 자유)를 체크하는 감사 트래킹 웹앱이에요. 외부 기준 대신 나만의 가치로 하루를 돌아보는 도구예요. | 행복이 대화 | 신규 |
| 2026-06-19 | 직접(How) | 서버 없이 어떻게 DB가 있는 웹앱을 만들어? | Firebase SDK를 CDN으로 import하면 브라우저에서 직접 Firestore DB에 접근해요. GitHub Pages(정적 호스팅) + Firebase(인증+DB) 조합으로 서버 없이 풀스택 앱이 가능해요. | 행복이 대화 | 신규 |
| 2026-06-19 | 직접(How) | Push만 하면 자동 배포되는 건 어떻게 설정해? | `.github/workflows/deploy.yml`에 GitHub Actions 워크플로우를 만들면 main 브랜치에 push할 때마다 자동으로 GitHub Pages에 배포돼요. | 행복이 대화 | 신규 |
| 2026-06-19 | 상황(When) | Firestore 테스트 모드 보안 규칙은 언제 갱신해야 해? | 30일 후 만료돼요. 그 전에 UID 기반 규칙(`request.auth.uid == userId`)으로 업데이트해야 앱이 계속 작동해요. | 행복이 대화 | 신규 |
| 2026-06-19 | 초보(Why) | 왜 "행복"이 아니라 "감사"로 바꿨어? | "행복"은 기준이 모호하지만, "감사"는 "건강한가? 함께 웃었는가? 하고 싶은 걸 했는가?"처럼 구체적으로 체크할 수 있어요. 감사가 더 실천적이에요. | 행복이 대화 | 신규 |
| 2026-06-19 | 초보(Why) | DOM 요소 삭제하면 왜 앱이 멈춰? | HTML에서 요소를 지웠는데 JS에서 그 요소를 참조하면 `null` 에러가 나면서 이후 코드 실행이 전부 중단돼요. 요소 삭제 시 JS 참조도 함께 정리해야 해요. | 행복이 대화 | 신규 |
| 2026-06-19 | 반대(But) | 이거 돈 안 드는 거 맞아? | 네, Firebase Spark 플랜은 한도 초과 시 차단만 되고 과금 안 돼요. Blaze로 직접 업그레이드하지 않는 한 평생 무료예요. 가족 앱 수준이면 한도의 0.1%도 안 써요. | 행복이 대화 | 신규 |
| 2026-06-19 | 반대(But) | 다른 사람이 링크 열면 내 데이터 보여? | 아니요, Google 로그인 기반이라 각자 자기 계정의 데이터만 보여요. 같은 URL이지만 UID별로 데이터가 완전히 분리돼요. | 행복이 대화 | 신규 |

---

## 🔧 실전 체크리스트

| 단계 | 체크 항목 |
| --- | --- |
| 동기 설정 | ☐ 나의 핵심 가치 3가지 정의 / ☐ 매일 밤 자문할 질문 작성 |
| Firebase 설정 | ☐ 프로젝트 생성 / ☐ Web 앱 등록 / ☐ Google Auth 활성화 / ☐ Firestore DB 생성 |
| 코드 구현 | ☐ Firebase CDN import / ☐ Auth 옵저버 / ☐ Firestore CRUD / ☐ 달력 렌더링 |
| 배포 | ☐ GitHub 레포 생성 / ☐ deploy.yml 작성 / ☐ Pages 활성화 / ☐ 승인 도메인 추가 |
| 30일 후 | ☐ Firestore 보안 규칙 UID 기반으로 갱신 |

---

## 🔗 관련 링크

- 📱 앱 URL: https://abraxass0511-lab.github.io/happiness-tracker/
- 💻 GitHub 레포: https://github.com/abraxass0511-lab/happiness-tracker
- 🔥 Firebase 콘솔: https://console.firebase.google.com/project/happiness-tracker-ys

---
*Source: 행복이(Happiness Tracker) Agent Conversation Export — 핵심가치 기반 감사 트래킹 웹앱 구축기*
