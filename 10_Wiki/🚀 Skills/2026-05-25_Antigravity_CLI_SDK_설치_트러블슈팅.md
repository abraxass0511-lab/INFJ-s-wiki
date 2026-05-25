---
id: "antigravity-cli-sdk-install-20260525"
category: "[[10_Wiki/🚀 Skills]]"
confidence_score: 0.95
tags: ["Antigravity", "CLI", "SDK", "agy", "Google-AI", "설치", "트러블슈팅", "인증", "OAuth", "Windows"]
last_reinforced: 2026-05-25
github_commit: "pending"
---


# [[2026-05-25_Antigravity_CLI_SDK_설치_트러블슈팅]]


## 📌 한 줄 통찰 (The Karpathy Summary)
> Antigravity는 IDE·CLI·SDK 3개의 별개 제품이며, CLI(agy)는 Windows에서 정상 작동하지만 SDK(pip)는 macOS ARM64만 지원한다. CLI 인증 시 반드시 "Google OAuth"를 선택해야 하며, "Google Cloud project"를 선택하면 Project ID가 비어 에이전트 실행이 실패한다.


## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- **[[Antigravity CLI/SDK 설치 — Windows 트러블슈팅 & 제품 구분 가이드]]**
- **제품 구분** — IDE(데스크톱), CLI(터미널), SDK(Python pip) 3가지 별개 제품
- **인증 방식** — 개인 사용자 = Google OAuth, 기업 = Google Cloud project
- **에러 진단** — 로그(`~/.gemini/antigravity-cli/log/`)에서 원인 확인
- **자격 증명 초기화** — `cmdkey /delete:gemini:antigravity` → 재인증
### 세부 내용
- **제품 3종 구분:** IDE(Windows ✅) / CLI(Windows ✅) / SDK(macOS ARM64만 ✅, Windows ❌)
- **CLI 설치:** `irm https://antigravity.google/cli/install.ps1 | iex`
- **CLI 경로:** `C:\Users\YS\AppData\Local\agy\bin\agy.exe`
- **인증 선택:** Google OAuth → Google AI Ultra (정상) / Google Cloud project → Antigravity Business (Project ID 비면 실패)
- **에러:** `"Agent execution terminated due to error"` → 로그에서 `"invalid project ID: """` 확인
- **해결:** Windows Credential Manager에서 `gemini:antigravity` 삭제 → agy 재실행 → Google OAuth 선택
- **SDK 현황:** google-antigravity v0.1.0 (2026-05-19) — PyPI에 `macosx_11_0_arm64` wheel만 존재
- **SDK 대안:** Windows wheel 출시 대기 / WSL 사용 / CLI `agy --print "질문"`으로 대체
- **설정 파일:** `~/.gemini/antigravity-cli/settings.json`, `~/.gemini/config/mcp_config.json`
- **mcp_config.json 주의:** 빈 파일(0 bytes)이면 `{}`로 수정 필요
- **CLI 주요 옵션:** `--print`(비대화형), `--dangerously-skip-permissions`(권한 자동승인), `--sandbox`(제한모드)
- **Parent:** [[10_Wiki/🚀 Skills/AI 자동화]]
- **Related:** [[Gemma 4 파인튜닝 — 학습 성공 및 최적화 전략]], [[Kaggle GGUF 변환 — 코랩 한계 돌파 & 환경 비교 전략]]
- **Raw Source:** [[00_Raw/2026-05-25/2026-05-25_Antigravity_CLI_SDK_설치_트러블슈팅]]


## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- **"Antigravity Windows 미지원" 오해 교정:** IDE·CLI는 Windows 완벽 지원, SDK(pip)만 macOS ARM64 전용
- **인증 방식 교훈:** Google Cloud project 선택 시 GCP 프로젝트 없으면 실패 → 개인은 반드시 Google OAuth
- **onboarding.json, securecoder 플러그인 수정은 효과 없었음** → 근본 원인은 자격 증명의 Project ID 누락
- **정책 변화:** 이 문서의 분류를 통해 해당 카테고리의 가중치가 미세 조정됨.


## 🔗 지식 연결 (Graph)
- **Parent:** [[🚀 Skills]]
- **Related:** [[Antigravity]], [[CLI]], [[SDK]], [[Google-AI]], [[설치]], [[트러블슈팅]], [[인증]], [[OAuth]]
- **Raw Source:** [[00_Raw/2026-05-25/2026-05-25_Antigravity_CLI_SDK_설치_트러블슈팅]]
