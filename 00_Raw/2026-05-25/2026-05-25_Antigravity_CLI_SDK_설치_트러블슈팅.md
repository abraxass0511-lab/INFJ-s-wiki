---
id: "antigravity-cli-sdk-install-troubleshooting-20260525"
category: "[[10_Wiki/🚀 Skills]]"
confidence_score: 0.95
tags: ["Antigravity", "CLI", "SDK", "agy", "Google-AI", "설치", "트러블슈팅", "인증", "OAuth", "Windows", "PyPI", "에이전트"]
last_reinforced: 2026-05-25
github_commit: "pending"
---

# [[Antigravity CLI/SDK 설치 — Windows 트러블슈팅 & 제품 구분 가이드]]

## 📌 한 줄 통찰 (The Karpathy Summary)
> Antigravity는 IDE·CLI·SDK 3개의 별개 제품이며, CLI는 Windows에서 정상 작동하지만 SDK(pip)는 macOS ARM64만 지원한다. CLI 인증 시 "Google OAuth"를 선택해야 하며, "Google Cloud project"를 선택하면 Project ID가 비어 에이전트 실행이 실패한다.

## 📖 구조화된 지식 (Synthesized Content)

### 추출된 패턴
- **제품 구분** — "Antigravity"는 IDE, CLI, SDK 3가지 별개 제품이며, 각각 지원 범위가 다름
- **인증 방식** — 개인 사용자는 반드시 "Google OAuth" 선택 (GCP 프로젝트 불필요)
- **에러 진단** — 로그 파일(`~/.gemini/antigravity-cli/log/`)에서 실제 에러 원인 확인 가능
- **자격 증명 초기화** — Windows Credential Manager의 `gemini:antigravity` 삭제 후 재인증으로 해결
- **SDK 플랫폼 제한** — PyPI의 wheel 파일명으로 지원 OS 확인 가능

---

## 1️⃣ Antigravity 제품 3종 구분

### 전체 제품 맵

```
Antigravity 생태계
├── ① IDE (데스크톱 앱)     → VS Code 기반 코딩 에디터
│     설치: antigravity.google/download (.exe)
│     용도: 코드 편집 + AI 에이전트 내장
│
├── ② CLI (터미널 도구)      → Go 바이너리 (agy.exe)
│     설치: irm https://antigravity.google/cli/install.ps1 | iex
│     용도: 터미널에서 AI 에이전트 직접 사용
│
└── ③ SDK (Python 라이브러리) → pip 패키지 (google-antigravity)
      설치: pip install google-antigravity
      용도: Python 코드로 에이전트 프로그래밍
```

### 플랫폼 지원 현황 (2026-05-25 기준)

| 제품 | Windows | Mac (Apple Silicon) | Mac (Intel) | Linux |
|------|---------|-------------------|-------------|-------|
| **① IDE** | ✅ | ✅ | ✅ | ✅ |
| **② CLI (`agy`)** | ✅ | ✅ | ✅ | ✅ |
| **③ SDK (`pip`)** | ❌ | ✅ | ❌ | ❌ |

### SDK가 Windows에서 안 되는 이유

```
PyPI에 등록된 wheel 파일:
  google_antigravity-0.1.0-py3-none-macosx_11_0_arm64.whl
                                    ^^^^^^^^^^^^^^^^^^^^^
                                    macOS ARM64 전용!

v0.1.0 (2026-05-19 출시) = 초기 버전 → Windows/Linux wheel 미제공
pip install 시 "No matching distribution found" 에러 발생
```

### SDK 확인 방법

```
PyPI 패키지 페이지:  https://pypi.org/project/google-antigravity/
Simple 인덱스:      https://pypi.org/simple/google-antigravity/
                    → wheel 파일 목록으로 지원 플랫폼 확인 가능
```

---

## 2️⃣ CLI 설치 방법 (Windows)

### 설치 명령어

```powershell
# PowerShell에서 실행
irm https://antigravity.google/cli/install.ps1 | iex
```

### 설치 확인

```powershell
agy --version    # → 1.0.2
```

### 설치 경로

| 항목 | 경로 |
|------|------|
| 바이너리 | `C:\Users\YS\AppData\Local\agy\bin\agy.exe` |
| 설정 파일 | `C:\Users\YS\.gemini\antigravity-cli\settings.json` |
| 로그 파일 | `C:\Users\YS\.gemini\antigravity-cli\log\` |
| 캐시 | `C:\Users\YS\.gemini\antigravity-cli\cache\` |
| MCP 설정 | `C:\Users\YS\.gemini\config\mcp_config.json` |
| 자격 증명 | Windows Credential Manager → `gemini:antigravity` |

### CLI 주요 옵션

| 옵션 | 설명 |
|------|------|
| `agy` | 대화형 모드 (TUI) |
| `agy --print "질문"` 또는 `-p` | 비대화형 모드 (한 번 질문 → 답변 → 종료) |
| `agy --dangerously-skip-permissions` | 모든 도구 권한 자동 승인 |
| `agy --sandbox` | 터미널 제한 모드 |
| `agy -c` 또는 `--continue` | 이전 대화 이어하기 |
| `agy update` | CLI 업데이트 |
| `agy plugin list` | 플러그인 목록 |

---

## 3️⃣ CLI 인증 — 핵심 주의사항

### 로그인 방법 선택

```
Select login method:
> 1. Google OAuth              ← ✅ 개인 사용자는 이것!
  2. Use a Google Cloud project ← ❌ GCP 프로젝트 없으면 선택 금지!
```

### ❌ 잘못된 선택 시 발생하는 문제

```
"Use a Google Cloud project" 선택 시:
  → Antigravity Business 모드로 인증
  → GCP Project ID가 비어있으면 ("") 에이전트 실행 실패
  → 에러 메시지: "⚠️ Agent execution terminated due to error."
  → 로그: "agent executor error: invalid project ID: """
```

### 인증 결과 비교

| 항목 | Google OAuth (✅) | Google Cloud project (❌) |
|------|-------------------|--------------------------|
| 계정 유형 | Google AI Ultra | Antigravity Business |
| 모델 | Gemini 3.5 Flash (Medium) | Gemini 3.5 Flash |
| Project ID | 자동 관리 | 수동 설정 필요 |
| GCP 필요 | ❌ 불필요 | ✅ 필수 |
| 결과 | 정상 작동 | Project ID 없으면 실패 |

### 인증 흐름 (Google OAuth)

```
1. agy 실행 → "Google OAuth" 선택
2. 터미널에 긴 URL 표시
3. URL을 브라우저에 복사 → 붙여넣기 → 열기
4. Google 계정으로 로그인
5. 화면에 authorization code 표시
6. 코드를 복사 → 터미널에 붙여넣기 → Enter
7. 인증 완료!
```

---

## 4️⃣ 트러블슈팅 — "Agent execution terminated due to error"

### 에러 진단 방법

```powershell
# 로그 파일 목록 확인
Get-ChildItem "$env:USERPROFILE\.gemini\antigravity-cli\log" -Filter "*.log" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 5

# 최신 로그 내용 확인
Get-Content "$env:USERPROFILE\.gemini\antigravity-cli\log\cli-최신파일명.log"
```

### 핵심 에러 로그 해석

| 로그 메시지 | 원인 | 해결 |
|---|---|---|
| `invalid project ID: ""` | GCP 프로젝트 미설정 | 자격 증명 삭제 → Google OAuth로 재인증 |
| `You are not logged into Antigravity` | 인증 만료/손상 | 자격 증명 삭제 → 재인증 |
| `A required privilege is not held` | symlink 권한 부족 | 관리자 권한으로 실행 또는 무시 가능 |

### 자격 증명 초기화 (가장 확실한 해결법)

```powershell
# 1. 저장된 자격 증명 확인
cmdkey /list | Select-String "antigravity","gemini"

# 2. 자격 증명 삭제
cmdkey /delete:gemini:antigravity

# 3. agy 재실행 → Google OAuth 선택 → 재인증
agy
```

### MCP 설정 점검

```powershell
# mcp_config.json이 비어있으면(0 bytes) 유효한 JSON으로 수정
# 파일 경로: C:\Users\YS\.gemini\config\mcp_config.json
# 내용이 비어있으면 {} 로 채워야 함

[System.IO.File]::ReadAllText("$env:USERPROFILE\.gemini\config\mcp_config.json")
# 비어있으면:
[System.IO.File]::WriteAllText("$env:USERPROFILE\.gemini\config\mcp_config.json", '{}')
```

### 전체 트러블슈팅 체크리스트

```
□ agy --version 으로 설치 확인
□ 로그 파일에서 실제 에러 메시지 확인
□ "invalid project ID" → 자격 증명 삭제 → Google OAuth 재인증
□ mcp_config.json이 비어있지 않은지 확인
□ agy update로 최신 버전 확인
□ 새 대화에서 재시도 (이전 대화 이력 손상 가능성)
```

---

## 5️⃣ SDK (Python) — 현재 상황 & 대안

### 현재 상태 (v0.1.0)

| 항목 | 값 |
|------|-----|
| 패키지명 | `google-antigravity` |
| 버전 | 0.1.0 |
| 출시일 | 2026-05-19 |
| Python | ≥ 3.10 |
| 지원 OS | macOS ARM64만 |
| 라이선스 | Apache-2.0 |
| 제작자 | Google LLC |

### SDK 사용 예시 (hello.py)

```python
import asyncio
from google.antigravity import Agent, LocalAgentConfig

async def main() -> None:
    config = LocalAgentConfig()
    async with Agent(config) as my_agent:
        prompt = "작동되는지 테스트좀 하겠습니다! 잘되면 오케이!라고 해주세요"
        response = await my_agent.chat(prompt)
        response_text = await response.text()
        print(f"Agent: {response_text}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Windows에서 SDK 사용 대안

| 방법 | 실현 가능성 | 설명 |
|------|-----------|------|
| **Windows wheel 출시 대기** | ⭐ 가장 현실적 | v0.1.0은 6일 전 출시, 곧 추가될 가능성 높음 |
| **WSL에서 설치** | 가능 | Linux wheel 출시되면 WSL Ubuntu에서 pip install |
| **CLI로 대체** | ✅ 지금 가능 | `agy --print "질문"` 으로 비슷한 기능 사용 가능 |

---

## 6️⃣ 환경 파일 구조 (참고용)

### 가상환경 구조

```
c:\Users\YS\Desktop\안티그래피티\테스트CLI\
└── venv\
    ├── Scripts\           ← 가상환경 활성화 스크립트
    ├── Lib\               ← 설치된 패키지
    ├── antigravity.pth    ← Antigravity IDE 경로 연결
    ├── hello.py           ← SDK 테스트 코드
    └── pyvenv.cfg         ← Python 3.13.13
```

### 가상환경 활성화

```powershell
# PowerShell에서
.\venv\Scripts\Activate.ps1

# 확인
python --version    # → Python 3.13.13
pip list            # → 설치된 패키지 목록
```

---

## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- **"Antigravity는 Windows 안 됨" 오해:** IDE·CLI는 Windows 완벽 지원, SDK(pip)만 macOS ARM64 전용 → 제품 3종 구분 필수
- **인증 방식 실수:** 처음 "Google Cloud project"로 인증 → Project ID 빈 문자열 → 에이전트 실패 → "Google OAuth"로 재인증하여 해결
- **"5001" 에러 미스터리:** 배치 파일의 `chcp 65001` 한글 인코딩 깨짐이 원인으로 추정, agy 자체 문제는 아님
- **CLI 출력 캡처 불가:** agy는 TUI(Terminal UI) 렌더링 사용 → 비대화형 환경에서 stdout 캡처 안 됨 → 직접 터미널에서 실행 필요
- **onboarding.json 수정은 효과 없음:** 캐시 파일 수정만으로는 인증 문제 해결 안 됨 → 자격 증명 초기화가 근본 해결
- **securecoder 플러그인 비활성화도 효과 없음:** 포트 5001 에러의 원인이 아니었음
- **pip install 실패 메시지 개선 필요:** "No matching distribution" 에러만으로는 OS 미지원인지 패키지 없음인지 구분 어려움 → PyPI simple 인덱스 직접 확인 필요

## 🔗 지식 연결 (Graph)
- **Parent:** [[10_Wiki/🚀 Skills/AI 자동화]]
- **Related:** [[Gemma 4 파인튜닝 — 학습 성공 및 최적화 전략]], [[Kaggle GGUF 변환 — 코랩 한계 돌파 & 환경 비교 전략]]
- **Raw Source:** [[00_Raw/2026-05-25/Antigravity_CLI_SDK_설치_트러블슈팅]]
