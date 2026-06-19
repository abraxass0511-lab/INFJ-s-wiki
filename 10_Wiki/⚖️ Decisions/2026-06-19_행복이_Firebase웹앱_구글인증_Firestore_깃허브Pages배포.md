---
id: "38457c9c-d072-4afd-b53a-68d24b8b8ed6"
category: "[[10_Wiki/⚖️ Decisions]]"
confidence_score: 0.35
tags: ["decisions", "이유", "선택", "why", "2026", "06", "19"]
last_reinforced: 2026-06-19
github_commit: "pending"
---


# [[2026-06-19_행복이_Firebase웹앱_구글인증_Firestore_깃허브Pages배포]]


## 📌 한 줄 통찰 (The Karpathy Summary)
> id: "happiness-tracker-webapp-firebase-deployment-20260619"


## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- **[[나의 진짜 행복 측정기 — 핵심가치 기반 감사 트래킹 웹앱 구축기]]**
- **📌 한 줄 통찰 (The Karpathy Summary)**
- **📖 구조화된 지식 (Synthesized Content)**
- **왜 만들었는가? — 동기와 철학**
- **무엇을 만들었는가? — 앱 구조**
- **어떻게 구현했는가? — 기술 스택 & 아키텍처**
- **삽질 & 교훈**
- **⚠️ 모순 및 업데이트 (Contradictions & RL Update)**
### 세부 내용
- **첫 화면:** 귀여운 아기 캐릭터가 "아빠, 오늘 하루 행복했어?"라고 묻는다
- **체크 화면:** 3가지 질문이 하나씩 팝업되며 체크
- **기록 완료:** 달력 위에 핵심 가치 3가지가 표시되고, 달력에 😊 이모지로 감사한 날이 표시됨
- **달력 클릭:** 과거 기록을 팝업으로 확인 가능
- **설정:** 핵심 가치를 언제든 수정 가능
- **`gratefulDays` 크래시:** HTML에서 "이번 달 감사한 하루 X일" 요소를 삭제했는데, JS의 `renderCalendar()`에서 여전히 `el.gratefulDays.textContent = count`를 참조 → **앱 전체가 멈춤**. DOM 요소 삭제 시 관련 JS 참조도 반드시 함께 정리해야 한다.
- **Firebase 콘솔 자동화 한계:** MCP 도구로 Firestore DB 생성을 시도했으나 Billing 이슈로 실패. Firebase 콘솔에서 수동으로 하는 게 확실하다.
- **CSS 캐시:** `style.css` 수정 후 브라우저에 반영 안 될 때 → `Ctrl+Shift+R` 강제 새로고침.
- **GitHub Pages 도메인 등록:** Firebase Auth에 `abraxass0511-lab.github.io`를 승인 도메인으로 추가해야 Google 로그인이 작동한다.
- **"완벽한 하루/평온한 하루/지킨 하루" 분류 → 불필요.** 처음에는 체크 개수에 따라 등급을 나눴지만, "지금 행복한가?"에만 집중하기로 결정. 등급보다 **감사** 자체에 초점.
- **"행복" → "감사"로 피벗.** "행복한 하루"보다 "감사한 하루"가 더 본질적. 행복은 기준이 모호하지만, 감사는 구체적으로 체크 가능.
- **localStorage → Firestore 전환.** 처음에는 localStorage로 구현했지만, 모바일+PC 동기화와 다중 사용자 지원을 위해 Firestore로 전환.
- 📱 앱 URL: https://abraxass0511-lab.github.io/happiness-tracker/
- 💻 GitHub 레포: https://github.com/abraxass0511-lab/happiness-tracker
- 🔥 Firebase 콘솔: https://console.firebase.google.com/project/happiness-tracker-ys


## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- 현재 충돌 없음. 최초 분류 시점.
- **정책 변화:** 이 문서의 분류를 통해 해당 카테고리의 가중치가 미세 조정됨.


## 🔗 지식 연결 (Graph)
- **Parent:** [[⚖️ Decisions]]
- **Related:** [[이유]], [[선택]], [[why]], [[결정]], [[cons]]
- **Raw Source:** [[00_Raw/2026-06-19/2026-06-19_행복이_Firebase웹앱_구글인증_Firestore_깃허브Pages배포]]