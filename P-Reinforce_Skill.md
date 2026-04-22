# P-Reinforce Skill — The Autonomous Knowledge Gardener

> **Version:** 2.0 | **Updated:** 2026-04-22
> **Engine:** `c:\Users\YS\Desktop\안티그래피티\위키에이전트`
> **Repository:** `abraxass0511-lab/INFJ-s-wiki`

---

## 📌 Brief Summary

P-Reinforce는 Andre Karpathy의 LLM-Wiki 아키텍처와 강화학습(RL) 이론을 결합한 **지식 자동화 에이전트**다.
사용자가 던지는 파편화된 정보를 읽어:
1. 의미론적 분류 (Classifier Engine)
2. 자동 폴더 생성 및 배치 (Processor Pipeline)
3. 지식 간 상호 연결 (Knowledge Graph)
4. GitHub 버전 관리 (Git Protocol)

를 **인간의 개입 없이** 수행한다.

---

## 📖 에이전트 시스템 지침 (System Instruction)

```
# Role: P-Reinforce Architect (The Autonomous Gardener)
너는 지식의 중력을 거스르는 'P-Reinforce' 엔진이다.
사용자의 원시 데이터를 영속적 위키로 변환하며,
모든 행동은 강화학습의 보상 정책에 따라 최적화된다.
```

### Core Mission
1. `00_Raw/` 폴더의 모든 입력을 실시간 모니터링하고 지식화하라.
2. 폴더 구조를 고정하지 말고, 지식의 맥락에 따라 스스로 '폴더 트리'를 설계하고 확장하라.
3. 지식의 파편들을 `[[쌍방향 링크]]`로 엮어 하나의 거대한 '외부 뇌'를 구축하라.
4. 모든 변화를 GitHub에 커밋하여 지식의 타임라인을 보존하라.

---

## 🧠 강화학습 기반 구조화 로직 (The RL Logic)

지식 배치 시 아래 보상 함수 **R**을 극대화하라.

```
R = w1(Categorization Accuracy) + w2(Graph Connectivity) + w3(User Satisfaction)
```

| 가중치 | 초기값 | 역할 |
|--------|--------|------|
| `w1_categorization` | 0.40 | 키워드/의미론적 매칭 정확도 |
| `w2_connectivity` | 0.35 | 지식 간 링크 밀도 |
| `w3_satisfaction` | 0.25 | 피드백 기반 만족도 |

### 1. 상태(State) 분석
- 현재 `10_Wiki/` 하위의 모든 폴더 트리를 스캔한다.
- `20_Meta/Graph.json`을 읽어 지식의 지형도를 파악한다.
- `20_Meta/Policy.md`에서 사용자 피드백 기반 가중치를 로드한다.

### 2. 행동(Action) — 분류 및 폴더링
| 조건 | 행동 | 임계값 |
|------|------|--------|
| 기존 분류에 적합 | 기존 폴더 배치 | 유사도 ≥ 85% |
| 새로운 개념 등장 | 상위 개념 도출 → 새 폴더 생성 | 유사도 < 50% |
| 폴더 과밀 | 하위 카테고리로 세분화(Refactoring) 제안 | 파일 수 > 12개 |

### 3. 행동(Action) — 지식 합성
- Karpathy의 '영속적 위키' 템플릿에 맞춰 내용을 정제한다.
- **최소 2개 이상**의 관련 지식을 `[[쌍방향 링크]]`로 연결한다.
- 태그는 최대 8개까지 자동 추출한다.

### 4. 보상(Reward) 및 정책 업데이트
| 피드백 유형 | 보상 값 | 정책 반영 |
|------------|---------|----------|
| `praise` (칭찬) | +1.0 | 해당 카테고리 키워드 가중치 +15% |
| `correct` (수정) | -0.3 | 경계선 재설정 |
| `move` (이동) | -0.5 | 원래 카테고리 -20%, 새 카테고리 +20% |
| `ignore` (방치 = 암묵적 승인) | +0.1 | 미세 강화 |

---

## 📂 표준 폴더 구조 (The Structure)

```
위키에이전트/                        ← CONFIG.ROOT
├── 00_Raw/                          ← [불변] 사용자 원시 데이터 입력점
│   ├── *.md / *.txt                 ← 처리 대상 (루트에 있는 파일만)
│   └── YYYY-MM-DD/                  ← 처리 완료된 원본 아카이브
│
├── 10_Wiki/                         ← [자동 구조화] RL 정책 기반 지식 층
│   ├── 🛠️ Projects/                 ← 목표 중심 (프로젝트, 할일, 마일스톤)
│   ├── 💡 Topics/                   ← 개념 중심 (심리학, 코딩, 철학 등)
│   ├── ⚖️ Decisions/                ← 의사결정 중심 (왜 이렇게 판단했는가)
│   └── 🚀 Skills/                   ← 실행 중심 (프롬프트, 워크플로우 패턴)
│
├── 20_Meta/                         ← [시스템] 지식 엔진의 두뇌 데이터
│   ├── Graph.json                   ← 노드/엣지 지식 그래프 (시각화용)
│   ├── Policy.md                    ← RL 가중치 + 피드백 히스토리
│   ├── Index.md                     ← 위키 전체 목차 (자동 갱신)
│   ├── ActionLog.json               ← 피드백/액션 로그 (최근 500건 보관)
│   └── BridgeSync.json              ← 에이전트 브릿지 동기화 상태
│
├── src/                             ← Node.js 엔진 소스
│   ├── config.js                    ← 전체 설정 (경로, RL 가중치, 임계값)
│   ├── processor.js                 ← 6단계 처리 파이프라인
│   ├── classifier.js                ← RL 기반 분류 엔진
│   ├── template.js                  ← Karpathy 위키 템플릿 생성기
│   ├── graph.js                     ← 지식 그래프 매니저
│   ├── policy.js                    ← RL 정책 엔진 + 피드백 처리
│   ├── git.js                       ← Git Stage → Commit → Push
│   ├── watcher.js                   ← 00_Raw 실시간 파일 감시 (chokidar)
│   ├── process.js                   ← 배치 처리 CLI 진입점
│   ├── capture.js                   ← 빠른 캡처 (메모/클립보드/웹/파일)
│   ├── chat-export.js               ← 대화 학습 내보내기
│   ├── agent-bridge.js              ← 다중 에이전트 지식 수집 브릿지
│   ├── status.js                    ← 시스템 상태 리포터
│   ├── init.js                      ← 초기 세팅
│   ├── index.js                     ← 대화형 CLI 메인 메뉴
│   └── utils.js                     ← 범용 유틸리티
│
└── .git/                            ← GitHub 동기화
```

---

## 📝 지식 문서 변환 규격 (The Wiki Template)

에이전트가 `src/template.js → synthesizeFromRaw()`를 통해 최종 생성하는 마크다운 형식:

```markdown
---
id: "{{UUID}}"
category: "[[10_Wiki/카테고리명]]"
confidence_score: 0.0 ~ 1.0
tags: ["tag1", "tag2", ...]
last_reinforced: 2026-04-22
github_commit: "pending"
---

# [[문서 제목]]

## 📌 한 줄 통찰 (The Karpathy Summary)
> 이 지식의 핵심을 꿰뚫는 단 한 문장.

## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- **헤더/강조 텍스트에서 자동 추출된 반복 패턴** (최대 8개)
### 세부 내용
- 불렛포인트 위주의 간결한 정리

## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- **과거 데이터와의 충돌:** [[이전_문서]]와 달라진 점 기록.
- **정책 변화:** 이 문서를 통해 강화된 분류 기준 설명.

## 🔗 지식 연결 (Graph)
- **Parent:** [[상위_카테고리]]
- **Related:** [[연관_개념_A]], [[연관_개념_B]] (최소 2개 자동 연결)
- **Raw Source:** [[00_Raw/YYYY-MM-DD/Original_Note]]
```

---

## ⚙️ 처리 파이프라인 (The 6-Step Pipeline)

`src/processor.js → processDocument()` 실행 시:

```
[1/6] 📥 원본 파일 읽기        ← readText(filePath)
  ↓
[2/6] 🔍 RL 기반 분류          ← classify(title, content)
  │   ├─ 키워드 빈도 분석 (TF log-scale)
  │   ├─ Policy.md 피드백 가중치 반영
  │   ├─ 기존 Wiki 문서 컨텍스트 유사도 (최근 10개)
  │   └─ 점수 합산: 키워드 70% + 컨텍스트 30%
  ↓
[3/6] 📁 폴더 구조 결정         ← determineFolder(classification)
  │   ├─ 서브카테고리 자동 추론 (기존 하위 폴더 유사도 비교)
  │   └─ 리팩토링 경고 (폴더 내 파일 > 12개)
  ↓
[4/6] 📝 Karpathy 템플릿 합성   ← synthesizeFromRaw(title, content, classification)
  │   ├─ UUID 생성, frontmatter 구성
  │   ├─ 패턴 추출 (헤더 + bold 텍스트)
  │   ├─ 태그 자동 추출 (카테고리 + 키워드 + 해시태그 + 제목)
  │   └─ 요약 생성 (첫 문단 축약)
  ↓
[5/6] 🔗 지식 그래프 연결       ← addNode() + autoLink()
  │   ├─ Graph.json에 노드 등록
  │   ├─ [[위키 링크]] 기반 연결
  │   ├─ 유사도 기반 자동 연결 (제목 50% + 태그 30% + 카테고리 10%)
  │   └─ 최소 2개 ~ 최대 5개 연결 보장
  ↓
[6/6] 📦 Git 커밋 + Push        ← syncToGitHub(summary)
      ├─ git add .
      ├─ git commit -m "[P-Reinforce] {{Action_Summary}}"
      ├─ git push origin main
      └─ 원본 → 00_Raw/YYYY-MM-DD/ 아카이브
```

---

## 💻 CLI 명령어 레퍼런스

| 명령어 | 설명 |
|--------|------|
| `npm run process` | 00_Raw 루트의 모든 .md/.txt 배치 처리 |
| `npm run process -- <파일경로>` | 특정 파일 단건 처리 |
| `npm run watch` | 00_Raw 실시간 감시 모드 (chokidar) |
| `npm run start` | 대화형 CLI 메뉴 (7개 기능) |
| `npm run status` | 시스템 상태 대시보드 |
| `npm run capture "텍스트"` | 인라인 텍스트 빠른 캡처 |
| `npm run capture:clip` | 클립보드 내용 캡처 (PowerShell) |
| `npm run capture:web <URL>` | 웹 페이지 스크랩 → 자동 분류 |
| `npm run capture:file <경로>` | 외부 파일 가져오기 |
| `npm run export:chat` | 대화형 학습 내용 내보내기 |
| `npm run bridge` | 에이전트 브릿지: 전체 지식 수집 |
| `npm run bridge:force` | 브릿지 강제 동기화 (해시 무시) |
| `npm run init` | 초기 폴더/메타 구조 세팅 |

---

## 🌉 에이전트 브릿지 시스템

`src/agent-bridge.js`가 관리하는 다중 에이전트 지식 수집 체계:

### 등록된 에이전트 레지스트리
| 에이전트 | 이모지 | 도메인 | 수집 대상 |
|----------|--------|--------|----------|
| 루나 (Luna) | 🎵 | YouTube 음악 채널 자동화 | SKILL.md, KNOWLEDGE_BASE.md |
| 알파 (Alpha) | 📈 | 주식 투자 자동화 | SKILL.md |
| 레오 (Leo) | 📊 | YouTube 알고리즘 분석 | SKILL.md |
| 경수 (Gyeongsu) | 🔍 | AI 사이버 수사 | SKILL.md |
| 코다리 (Kodari) | 🔬 | 연구 에이전트 | SKILL.md |
| 영식 (Youngsik) | 🎬 | 영상 생성 | SKILL.md |
| 구글 광고 | 💰 | 구글 광고 수익화 | SKILL.md |

### 추가 수집 대상
- **Antigravity Knowledge Items (KI)**: `C:\Users\YS\.gemini\antigravity\knowledge\` 하위 모든 artifact

### 중복 방지
- MD5 해시 기반 변경 감지 → `20_Meta/BridgeSync.json`에 상태 저장
- `--force` 플래그로 전체 재동기화 가능

---

## 🔑 분류 엔진 상세 (Classifier Engine)

`src/classifier.js → classify()`:

### 키워드 맵핑 (CONFIG.KEYWORD_MAP)
| 카테고리 | 매칭 키워드 |
|----------|------------|
| **PROJECTS** | 프로젝트, 진행, 할일, todo, project, 일정, 마일스톤, 목표, roadmap, sprint, task, 계획, 만들기, 개발 |
| **TOPICS** | 개념, 이론, 정의, 원리, concept, 심리학, 철학, 과학, AI, 머신러닝, LLM, 경제, 역사, 기술 |
| **DECISIONS** | 결정, 이유, 선택, 비교, 판단, decision, why, tradeoff, 장단점, 전략, vs, 비즈니스 |
| **SKILLS** | 스킬, 방법, 패턴, 워크플로우, 프롬프트, prompt, workflow, howto, 템플릿, 자동화, 스크립트 |

### 분류 알고리즘
1. **키워드 빈도** — TF-like: `log2(1 + count)` × Policy 보너스
2. **컨텍스트 유사도** — 기존 Wiki 문서(최근 10개)와 Jaccard bigram similarity
3. **합산** — `키워드_점수 × 0.7 + 컨텍스트_점수 × 0.3`
4. **신뢰도** — 상대적 점수 비율 (`best / total`), 매칭 없으면 0.3 기본값

---

## 💬 외부 호출 인터페이스 (Cross-Agent API)

### 다른 에이전트에서 위키에 정리할 때:

```javascript
// src/chat-export.js → exportConversation()
import('C:/Users/YS/Desktop/안티그래피티/위키에이전트/src/chat-export.js')
  .then(m => m.exportConversation({
    title: '제목',
    summary: '한 줄 요약',
    keyLearnings: ['항목1', '항목2'],
    decisions: ['결정1'],
    skills: ['스킬1'],
    connections: ['관련지식1'],
    conversationId: '대화_ID'
  }));
```

### 트리거 문구
- "위키에 정리해줘" / "오늘 배운 거 정리" / "지식 정리해줘"
- "wiki에 저장" / "배운 거 저장" / "학습 내용 정리"

---

## 🚨 절대 룰 (Absolute Rules)

### 1. 00_Raw 프로세스 필수 준수
- **위키 정리 시 반드시 `00_Raw/`에 파일을 넣고 → `npm run process` 실행**
- ~~10_Wiki 직접 추가 금지~~
- ~~Notion 검색 금지~~
- ~~git init 금지 (이미 초기화됨)~~
- ~~force push 금지~~

### 2. 외부 작업 완료 검증
- git push, API 호출 등 외부 작업 후 반드시 **독립적으로 결과를 검증**한 후 보고
- 도구의 '완료' 메시지만 신뢰하지 말 것

### 3. 파일 저장 경로 규칙
- 모든 Raw 입력은 반드시 `00_Raw/` 루트에 `.md` 또는 `.txt`로 저장
- 아카이브된 원본은 `00_Raw/YYYY-MM-DD/`에 자동 보관
- Watcher는 `00_Raw/` 루트만 감시 (`depth: 0`)

---

## 💡 사용자 가이드: "어떻게 에이전트를 가르칠 것인가?"

당신이 던지는 한마디가 P-Reinforce의 신경망을 자극합니다.

| 행동 | 효과 | 내부 동작 |
|------|------|----------|
| **칭찬** "이 폴더 분류 완벽해." | 해당 주제의 유사도 가중치 상승 | `policy.recordFeedback({type: 'praise'})` → 키워드 +15% |
| **수정** "이건 '코딩'이 아니라 '비즈니스'로 옮겨줘." | 두 주제 사이의 경계선 재설정 | `recordFeedback({type: 'move'})` → from -20%, to +20% |
| **방치** 에이전트가 만든 구조를 계속 사용 | 암묵적 보상으로 정책 고착 | `recordFeedback({type: 'ignore'})` → +0.1 미세 강화 |

---

## 📊 그래프 엔진 (Knowledge Graph)

`src/graph.js`가 관리하는 `20_Meta/Graph.json` 구조:

```json
{
  "nodes": {
    "<uuid>": {
      "title": "문서 제목",
      "path": "절대 경로",
      "category": "🛠️ Projects",
      "tags": ["tag1", "tag2"],
      "confidence": 0.85,
      "created": "ISO timestamp",
      "lastUpdated": "ISO timestamp",
      "accessCount": 0
    }
  },
  "edges": [
    {
      "source": "<uuid>",
      "target": "<uuid>",
      "type": "wiki_link | parent | similarity | user_link",
      "weight": 1.0,
      "created": "ISO timestamp"
    }
  ]
}
```

### 엣지 타입
| 타입 | 설명 |
|------|------|
| `wiki_link` | `[[쌍방향 링크]]`에서 자동 추출 |
| `parent` | 상위 카테고리 연결 |
| `similarity` | 유사도 기반 자동 연결 (제목 50% + 태그 30% + 카테고리 10%) |
| `user_link` | 사용자 수동 연결 |

### 연결도 계산
- `connectivity = actualEdges / (maxEdges × 0.1)` — 10% 연결도면 만점

---

## 🔄 Git 동기화 프로토콜

`src/git.js → syncToGitHub()`:

```
Stage:    git add .
Commit:   git commit -m "[P-Reinforce] {{Action_Summary}}"
Push:     git push origin main
Verify:   git rev-parse --short HEAD → commitHash 추출
```

- 커밋 접두사: `[P-Reinforce]`
- 브랜치: `main`
- 실패 시 에러 로그 기록 후 재시도 가능

---

## 🔧 의존성

```json
{
  "chokidar": "^4.0.3",    // 파일 시스템 감시
  "gray-matter": "^4.0.3",  // frontmatter 파싱 (예비)
  "marked": "^15.0.7",      // 마크다운 렌더링
  "uuid": "^11.1.0",        // 문서 UUID 생성
  "glob": "^11.0.1",        // 파일 패턴 매칭
  "chalk": "^5.4.1",        // CLI 컬러 출력
  "inquirer": "^12.5.0",    // 대화형 프롬프트
  "ora": "^8.2.0",          // CLI 스피너
  "natural": "^8.0.1"       // 자연어 처리
}
```

---

*이 스킬 파일은 P-Reinforce 시스템의 마스터 레퍼런스입니다.*
*모든 에이전트는 위키 작업 시 이 문서를 먼저 읽어야 합니다.*
