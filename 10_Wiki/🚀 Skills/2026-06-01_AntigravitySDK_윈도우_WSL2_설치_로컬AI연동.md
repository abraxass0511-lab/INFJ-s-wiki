---
id: "92c3ceeb-ad21-4e83-9c6a-861da083c1f1"
category: "[[10_Wiki/🚀 Skills]]"
confidence_score: 0.46
tags: ["skills", "도구", "tool", "스크립트", "11", "2026", "06", "01"]
last_reinforced: 2026-06-01
github_commit: "pending"
---


# [[2026-06-01_AntigravitySDK_윈도우_WSL2_설치_로컬AI연동]]


## 📌 한 줄 통찰 (The Karpathy Summary)
> id: "antigravity-sdk-wsl2-localai-20260601"


## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- **[[Antigravity SDK 윈도우 WSL2 설치 및 로컬 AI 연동 전체 과정]]**
- **📌 한 줄 통찰 (The Karpathy Summary)**
- **📖 구조화된 지식 (Synthesized Content)**
- **추출된 패턴**
- **세부 내용**
- **~/.bashrc 끝에 추가**
- **C:\Users\YS\.wslconfig**
- **⚠️ 모순 및 업데이트 (Contradictions & RL Update)**
### 세부 내용
- **Windows 직접 설치 = 불완전** — `pip install .` 소스 빌드로 `import`까지 가능하나, `localharness` 바이너리 누락으로 Agent 실행 불가
- **localharness = Go 바이너리** — Google 내부 릴리즈 스크립트가 wheel 빌드 전 플랫폼별 바이너리를 주입, GitHub 소스에는 미포함
- **PyPI Linux wheel에만 바이너리 존재** — WSL2에서 `pip install google-antigravity` 하면 Linux wheel이 설치되어 localharness 포함
- **WSL2 미러 모드 = 네트워크 해결책** — `.wslconfig`에 `networkingMode=mirrored` 설정 시 WSL과 Windows가 `127.0.0.1` 공유
- **Gemini = 에이전트 두뇌, 로컬 AI = 도구** — Antigravity SDK는 Gemini 기반이므로 API 키 필수, 로컬 모델은 도구(tool)로 호출
- **LM Studio Serve on Local Network** — 로컬 네트워크 서빙 활성화 필요 (WSL에서 접근 허용)
- **방화벽 규칙 추가 필요** — WSL → Windows 포트 접근 시 Windows Defender 방화벽에서 포트 1234 허용 규칙 필수
- **문제 진단 과정:**
- **WSL2 설치 전체 절차:**
- **자동 활성화 설정 (.bashrc):**
- **WSL2 미러 네트워킹 설정:**
- **Windows 방화벽 규칙 추가 (관리자 PowerShell):**
- **LM Studio 서버 설정:**
- - Server Settings → **Serve on Local Network**: ON (토글 활성화)
- - 이 설정이 꺼져있으면 `127.0.0.1`에서만 수신, WSL에서 접근 불가
- **SDK 테스트 코드 (hello.py):**
- **로컬 AI 연동 코드 (talk_to_local_ai 도구):**
- **하이브리드 아키텍처 흐름:**
- **에이전트 설정 코드 (하이브리드):**
- **핵심 구분 — 실행 환경별 차이:**
- **삽질 로그 — 네트워크 문제 해결 과정:**
- **"GitHub 소스 빌드로 윈도우에서 SDK 사용 가능" 오해:** `import`까지만 가능, `Agent()` 실행은 localharness 바이너리 없이 불가능
- **"Issue #11에서 윈도우 설치 성공" 오해:** protobuf 패치로 import만 성공한 것이지, Agent 실행까지 성공한 보고는 없음 (이슈 Open 상태)
- **"WSL에서 127.0.0.1로 Windows 서비스 접근 가능" 오해:** 기본 NAT 모드에서는 불가, `networkingMode=mirrored` 설정이 필수
- **"Antigravity SDK로 100% 로컬 AI 실행 가능" 오해:** SDK 자체가 Gemini 기반이므로 API 키 필수, 로컬 모델은 도구(tool)로만 호출 가능
- **"LM Studio 기본 설정으로 WSL 접근 가능" 오해:** `Serve on Local Network` 토글 + 방화벽 규칙 추가 필요


## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- 현재 충돌 없음. 최초 분류 시점.
- **정책 변화:** 이 문서의 분류를 통해 해당 카테고리의 가중치가 미세 조정됨.


## 🔗 지식 연결 (Graph)
- **Parent:** [[🚀 Skills]]
- **Related:** [[도구]], [[tool]], [[스크립트]], [[prompt]], [[패턴]]
- **Raw Source:** [[00_Raw/2026-06-01/2026-06-01_AntigravitySDK_윈도우_WSL2_설치_로컬AI연동]]