<p align="center">
  <img src="https://img.shields.io/badge/Nodes-58-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Edges-264-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Agents-7-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/RL%20Reward-0.762-orange?style=for-the-badge" />
</p>

# 🧠 P-Reinforce — Autonomous Knowledge Gardener

> *"지식의 중력을 거스르는 자율형 위키 에이전트"*

**P-Reinforce**는 Andre Karpathy의 [영속적 위키(Perpetual Wiki)](https://karpathy.ai) 철학과 강화학습(RL) 이론을 결합한 **자율형 지식 자동화 에이전트**입니다. 파편화된 정보를 읽어 의미론적 분류, 자동 폴더 생성, 지식 간 상호 연결, GitHub 버전 관리를 **인간의 개입 없이** 수행합니다.

---

## ⚡ 핵심 특징

| 특징 | 설명 |
|---|---|
| 🤖 **RL 기반 자동 분류** | 키워드 TF 스코어링 + 컨텍스트 유사도 + 사용자 피드백 가중치로 문서를 자동 분류 |
| 🔗 **지식 그래프** | `[[쌍방향 링크]]`와 유사도 기반 자동 연결로 고립된 지식을 네트워크화 |
| 🌉 **Agent Bridge** | 7개 하위 에이전트(루나, 알파, 레오, 경수, 영식, 코다리, 구글광고)의 지식을 자동 수집 |
| 📊 **실시간 대시보드** | Force-directed 그래프 시각화, RL 보상 게이지, 카테고리 분포 |
| 🔄 **피드백 루프** | 칭찬(+15%), 이동(-20%/+20%), 방치(암묵적 승인)로 정책 실시간 강화 |
| 📦 **Git 자동화** | 모든 지식 변화를 `[P-Reinforce]` 접두사와 함께 자동 커밋 |

---

## 🏗️ 아키텍처

```
📩 입력 (5가지 경로)          🧠 P-Reinforce 엔진          📚 출력
─────────────────          ──────────────────          ──────
                            ┌──────────────┐
 한줄 캡처 ─────────┐       │   Classifier  │
 클립보드 ──────────┤       │  (RL 분류)    │       ┌─ 🛠️ Projects
 웹 스크랩 ─────────┤──→ Raw ──→│              │──→ Wiki ─┤─ 💡 Topics
 대화 내보내기 ─────┤       │   Template    │       ├─ ⚖️ Decisions
 Agent Bridge ──────┘       │  (Karpathy)   │       └─ 🚀 Skills
                            │              │
                            │    Graph     │──→ Graph.json (연결)
                            │    Policy    │──→ Policy.md (가중치)
                            │    Git       │──→ GitHub (버전관리)
                            └──────────────┘
```

### 파이프라인 흐름

```
1. 📥 Raw 입력 → 2. 🔍 RL 분류 → 3. 📝 Karpathy 템플릿 합성
→ 4. 📁 자동 폴더 배치 → 5. 🔗 그래프 연결 → 6. 📦 Git 커밋
→ 7. 💬 사용자 피드백 → 8. 🔄 정책 업데이트 → (반복)
```

---

## 📂 프로젝트 구조

```
INFJ-s-wiki/
│
├── 00_Raw/                         # 📩 입력 폴더 (파일 드롭 → 자동 처리)
│   └── 2026-04-13/                 # 날짜별 원본 아카이브
│
├── 10_Wiki/                        # 📚 구조화된 지식 저장소
│   ├── 🛠️ Projects/               # 목표 중심 — 프로젝트 진행 기록
│   ├── 💡 Topics/                  # 개념 중심 — 기술, 이론, 개념
│   ├── ⚖️ Decisions/              # 의사결정 중심 — 왜 이렇게 판단했는가
│   └── 🚀 Skills/                 # 실행 중심 — 프롬프트, 워크플로우, 패턴
│
├── 20_Meta/                        # 🧠 시스템 메타데이터
│   ├── Graph.json                  # 지식 그래프 (노드 + 엣지)
│   ├── Policy.md                   # RL 정책 가중치
│   ├── Index.md                    # 위키 목차 (자동 생성)
│   ├── ActionLog.json              # 액션 히스토리
│   └── BridgeSync.json             # 에이전트 동기화 상태
│
├── src/                            # 🔧 엔진 소스 코드
│   ├── config.js                   # 시스템 설정 / 상수
│   ├── utils.js                    # 유틸리티 (파일 I/O, 유사도, 파싱)
│   ├── classifier.js               # RL 기반 분류 엔진
│   ├── template.js                 # Karpathy 위키 템플릿 생성
│   ├── graph.js                    # 지식 그래프 관리
│   ├── policy.js                   # RL 정책 & 피드백 엔진
│   ├── git.js                      # Git 자동화
│   ├── processor.js                # 메인 프로세싱 파이프라인
│   ├── watcher.js                  # 실시간 파일 감시 (chokidar)
│   ├── capture.js                  # 멀티모드 지식 캡처
│   ├── chat-export.js              # 대화 학습 내용 자동 추출
│   ├── agent-bridge.js             # 다중 에이전트 지식 수집
│   ├── notion-sync.js              # Notion 연동
│   ├── init.js                     # 프로젝트 초기화
│   ├── process.js                  # 배치 처리 러너
│   ├── status.js                   # 시스템 상태 리포터
│   ├── index.js                    # 대화형 CLI 메뉴
│   └── dashboard/
│       └── server.js               # 웹 대시보드 (포트 3777)
│
├── WIKI_EXPORT_SKILL.md            # 범용 위키 내보내기 스킬
└── package.json
```

---

## 🚀 사용법

### 설치

```bash
npm install
npm run init          # 최초 1회 — 폴더 구조 + 메타 파일 생성
```

### 핵심 명령어

| 명령어 | 설명 |
|---|---|
| `npm run process` | 📦 `00_Raw/` 폴더의 모든 파일 배치 분류·위키화 |
| `npm run watch` | 👁️ 실시간 감시 모드 — 파일 드롭 시 자동 처리 |
| `npm run dashboard` | 📊 웹 대시보드 실행 ([localhost:3777](http://localhost:3777)) |
| `npm run status` | 📋 시스템 상태 CLI 출력 |
| `npm start` | 🎮 대화형 CLI 메뉴 (전체 기능 접근) |

### 지식 입력

| 명령어 | 설명 | 예시 |
|---|---|---|
| `npm run capture "텍스트"` | ✏️ 한줄 캡처 → 즉시 분류 | `npm run capture "React Server Components는..."` |
| `npm run capture:clip` | 📋 클립보드 내용 캡처 | `Ctrl+C`로 복사 → 명령 실행 |
| `npm run capture:web <URL>` | 🌐 웹 페이지 스크랩 | `npm run capture:web https://example.com` |
| `npm run capture:file <PATH>` | 📁 파일 가져오기 | `npm run capture:file ./notes.md` |
| `npm run export:chat` | 💬 대화 학습 내보내기 | 대화형 입력 또는 API 호출 |

### 에이전트 동기화

| 명령어 | 설명 |
|---|---|
| `npm run bridge` | 🌉 7개 에이전트 + KI 지식 자동 수집 (변경분만) |
| `npm run bridge:force` | 🔄 전체 강제 재동기화 |

---

## 🤖 RL 분류 엔진 상세

### 분류 프로세스

```
입력 문서
  ↓
┌───────────────────────────────────┐
│  1. 키워드 TF 스코어링            │  각 카테고리 키워드 출현 빈도
│     score = log₂(1 + count)      │  → Projects/Topics/Decisions/Skills
│                                   │
│  2. Policy 가중치 적용            │  Policy.md에서 사용자 피드백 기반
│     adjusted = score × weight    │  가중치 로드 → 곱 적용
│                                   │
│  3. 컨텍스트 유사도               │  기존 Wiki 문서와 Jaccard bigram
│     similarity = |A∩B| / |A∪B|   │  유사도 비교
│                                   │
│  4. 최종 점수                     │  keyword × 0.7 + context × 0.3
│     → 최고 점수 카테고리에 배치   │
└───────────────────────────────────┘
  ↓
카테고리 배치 + 신뢰도 점수 (0.0 ~ 1.0)
```

### 보상 함수

$$R = w_1 \times \text{분류 정확도} + w_2 \times \text{연결도} + w_3 \times \text{만족도}$$

| 사용자 행동 | 효과 |
|---|---|
| ✅ 칭찬 | 해당 카테고리 키워드 가중치 **+15%** |
| 🔀 이동 (재분류) | 원래 카테고리 **-20%**, 새 카테고리 **+20%** |
| 😶 방치 | 암묵적 승인 → 미세 강화 |

---

## 🌉 Agent Bridge — 다중 에이전트 네트워크

P-Reinforce는 독립적으로 운영되는 7개 전문 에이전트의 **지식 허브** 역할을 합니다.

```
┌─ 🎵 루나 (Luna)          YouTube 음악 채널 자동화
├─ 📈 알파 (Alpha)          주식 투자 자동화
├─ 📊 레오 (Leo)            YouTube 알고리즘 분석
├─ 🔍 경수 (Gyeongsu)       AI 사이버 수사
├─ 🎬 영식 (Youngsik)       영상 생성
├─ 💰 구글 광고              구글 광고 수익화
└─ 🔬 코다리 (Kodari)       연구 에이전트
         │
         ▼
    🧠 P-Reinforce
    (중앙 지식 허브)
         │
         ▼
    📚 INFJ-s-wiki
    (구조화된 위키)
```

각 에이전트의 `SKILL.md`와 `KNOWLEDGE_BASE.md`를 **해시 기반으로 추적**하여, 변경된 파일만 자동으로 가져와 위키로 변환합니다.

---

## 📊 Karpathy 위키 템플릿

모든 문서는 다음 표준 형식으로 합성됩니다:

```markdown
---
id: "uuid-v4"
category: "[[10_Wiki/🚀 Skills]]"
confidence_score: 0.84
tags: ["tag1", "tag2", "tag3"]
last_reinforced: 2026-04-13
github_commit: "pending"
---

# [[문서_제목]]

## 📌 한 줄 통찰 (The Karpathy Summary)
> 이 문서가 존재하는 이유를 한 문장으로.

## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- ...
### 세부 내용
- ...

## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- 현재 충돌 없음.

## 🔗 지식 연결 (Graph)
- **Parent:** [[카테고리]]
- **Related:** [[관련_문서_1]], [[관련_문서_2]]
- **Raw Source:** [[00_Raw/원본_경로]]
```

---

## 📈 현재 위키 통계

| 지표 | 값 |
|---|---|
| 총 문서 수 | **43개** |
| 그래프 노드 | **58개** |
| 그래프 엣지 | **264개** |
| 연결도 | **100%** (고립 노드 없음) |
| RL 보상 점수 | **R = 0.762** |
| 🛠️ Projects | 25개 |
| 💡 Topics | 5개 |
| ⚖️ Decisions | 5개 |
| 🚀 Skills | 8개 |

---

## 🛠️ 기술 스택

| 기술 | 용도 |
|---|---|
| **Node.js 24** (ESM) | 런타임 |
| **chokidar** | 파일 시스템 실시간 감시 |
| **gray-matter** | 마크다운 frontmatter 파싱 |
| **natural** | NLP 토큰화·유사도 계산 |
| **Canvas 2D** | 대시보드 그래프 시각화 |
| **uuid** | 고유 노드 식별자 |
| **Git** | 자동 버전 관리 |

---

## 🗺️ 로드맵

- [ ] **Gemini API 연동** — 의미론적 분류 정확도 향상
- [ ] **자동 Refactoring** — 폴더 내 12개 초과 시 하위 카테고리 자동 세분화
- [ ] **Obsidian 플러그인** — `10_Wiki/` 폴더를 Obsidian Vault로 직접 활용
- [ ] **일간 다이제스트** — 매일 자정 "오늘의 지식 변화" 요약 리포트
- [ ] **크로스 에이전트 쿼리** — "알파 에이전트가 배운 투자 전략은?" 같은 질문 대응

---

## 📜 라이선스

MIT License

---

<p align="center">
  <strong>🧠 P-Reinforce</strong> — <em>Knowledge never sleeps.</em>
</p>
