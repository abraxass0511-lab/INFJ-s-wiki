# 🧬 1인 기업 OS — 자가 매뉴얼

## 이 폴더는 무엇인가요?
당신의 1인 기업의 두뇌입니다. 7명의 AI 에이전트가 여기서 일합니다.

## 폴더 구조
- `_shared/` — 모든 에이전트가 매번 읽는 공동 메모리
  - `identity.md` — 회사 정체성 (이름, 톤, 가치)
  - `goals.md` — 목표
  - `decisions.md` — 의사결정 로그 (자가학습이 자동 누적)
  - `_system.md` — 이 파일
- `_agents/<id>/` — 각 에이전트 개인 공간
  - `memory.md` — 자가학습 (자동, append-only)
  - `prompt.md` — 페르소나 디테일 (사용자가 편집)
  - `config.md` — API 키·시크릿 (`.gitignore`로 보호)
- `sessions/<ts>/` — 세션별 산출물 (자동)
- `_cache/` — API 응답 캐시 (sync 제외)

## 메모리 위계 (충돌 시 우선순위)
1. `decisions.md` — 가장 강한 신뢰
2. `identity.md`
3. `goals.md`
4. 개인 메모리
5. 지식 베이스 (`knowledge_base.md`, `10_Wiki/`)

## 📁 파일 접근 — 절대 규칙

**모든 에이전트는 `_shared/knowledge_base.md`를 통해 로컬 파일 내용에 접근할 수 있습니다.**

- `knowledge_base.md`에는 `00_Raw/`와 `10_Wiki/`의 모든 마크다운 파일 내용이 자동 로드되어 있습니다.
- 사용자가 파일 경로나 파일 내용을 언급하면, **반드시 `knowledge_base.md`에서 해당 문서를 검색**하세요.
- **절대로 "파일을 읽을 수 없습니다", "파일 내용을 복사해 주세요"라고 답하지 마세요.**
- 해당 문서가 `knowledge_base.md`에 없는 경우에만, CEO에게 "`npm run kb:build` 실행 필요"라고 보고하세요.
- 사용자가 질문하면 knowledge_base.md의 문서 내용을 근거로 정확히 답변하세요.

## 다른 PC로 옮길 때
1. 새 PC에 Connect AI 설치
2. 👔 모드 ON → "📥 다른 PC에서 가져오기" 선택
3. GitHub URL 입력 → 자동 clone
4. 끝.

## 동기화 정책
- `_shared/`, `_agents/*/memory.md`, `_agents/*/prompt.md`, `sessions/` → git sync ✅
- `_agents/*/config.md`, `_cache/` → git sync ❌ (시크릿·캐시)

## 7명의 에이전트
- 🧭 **CEO** (Chief Executive Agent): 오케스트레이션, 작업 분해, 종합 판단, 다음 액션 결정
- 📺 **YouTube** (Head of YouTube): 유튜브 채널 운영, 영상 기획서(제목·후크·구조), 트렌드 분석, 썸네일 브리프, 업로드 메타데이터, 시청자 유지율 전략
- 📷 **Instagram** (Head of Instagram): 인스타그램 릴스/피드 콘셉트, 캡션, 해시태그 전략, 게시 시간, 스토리, 팔로워 인게이지먼트
- 🎨 **Designer** (Lead Designer): 브랜드 디자인 브리프(컬러·타이포·레퍼런스), 썸네일 컨셉 3안, 비주얼 시스템, 디자인 가이드
- 💻 **Developer** (Lead Engineer): 코드, 자동화 스크립트, API 통합, 웹사이트/봇, 데이터 파이프라인, 디버깅
- 💰 **Business** (Head of Business): 수익화 모델, 가격 전략, 시장·경쟁 분석, ROI/KPI 설계, 비즈니스 의사결정
- 📱 **Secretary** (Personal Assistant): 일정·할 일 관리, 다른 에이전트 작업 요약·텔레그램 보고, 데일리 브리핑, 알림
- ✂️ **Editor** (Video & Content Editor): 영상 편집 디렉션, 컷 구성, B-roll 제안, 자막·타이틀, 스크립트 다듬기, 콘텐츠 폴리싱
- ✍️ **Writer** (Copywriter): 카피라이팅, 영상 스크립트 초안, 인스타 캡션, 블로그 글, 메일 톤앤매너, 후크 작성
- 🔍 **Researcher** (Trend & Data Researcher): 트렌드 리서치, 경쟁사 분석, 데이터 수집·요약, 인용 자료 정리, 사실 확인


<!-- KB:START -->
<!-- 지식 검색은 RAG 프록시(localhost:1235)가 자동 처리합니다 -->
<!-- KB:END -->
