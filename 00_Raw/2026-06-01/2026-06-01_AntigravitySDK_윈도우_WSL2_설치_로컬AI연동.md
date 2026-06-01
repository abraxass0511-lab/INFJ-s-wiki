---
id: "antigravity-sdk-wsl2-localai-20260601"
category: "[[10_Wiki/💡 Topics]]"
confidence_score: 0.95
tags: ["AntigravitySDK", "WSL2", "Windows", "LM Studio", "로컬AI", "Gemini", "하이브리드아키텍처", "localharness", "미러모드", "가상환경", "에이전트", "google-antigravity"]
last_reinforced: 2026-06-01
github_commit: ""
---

# [[Antigravity SDK 윈도우 WSL2 설치 및 로컬 AI 연동 전체 과정]]

## 📌 한 줄 통찰 (The Karpathy Summary)
> Windows에서 Antigravity SDK는 localharness 바이너리 미지원으로 직접 실행 불가하며, WSL2(Ubuntu) + 미러 네트워킹으로 SDK를 구동하고 LM Studio 로컬 AI와 연동하는 하이브리드 파이프라인이 현재 유일한 해법이다.

## 📖 구조화된 지식 (Synthesized Content)

### 추출된 패턴
- **Windows 직접 설치 = 불완전** — `pip install .` 소스 빌드로 `import`까지 가능하나, `localharness` 바이너리 누락으로 Agent 실행 불가
- **localharness = Go 바이너리** — Google 내부 릴리즈 스크립트가 wheel 빌드 전 플랫폼별 바이너리를 주입, GitHub 소스에는 미포함
- **PyPI Linux wheel에만 바이너리 존재** — WSL2에서 `pip install google-antigravity` 하면 Linux wheel이 설치되어 localharness 포함
- **WSL2 미러 모드 = 네트워크 해결책** — `.wslconfig`에 `networkingMode=mirrored` 설정 시 WSL과 Windows가 `127.0.0.1` 공유
- **Gemini = 에이전트 두뇌, 로컬 AI = 도구** — Antigravity SDK는 Gemini 기반이므로 API 키 필수, 로컬 모델은 도구(tool)로 호출
- **LM Studio Serve on Local Network** — 로컬 네트워크 서빙 활성화 필요 (WSL에서 접근 허용)
- **방화벽 규칙 추가 필요** — WSL → Windows 포트 접근 시 Windows Defender 방화벽에서 포트 1234 허용 규칙 필수

### 세부 내용

- **문제 진단 과정:**

| 단계 | 시도 | 결과 |
| --- | --- | --- |
| 1 | Windows PowerShell에서 직접 실행 | ❌ `RuntimeError: Could not find default localharness binary` |
| 2 | GitHub 소스 클론 + `pip install .` | ❌ import만 성공, Agent 실행 불가 (바이너리 미포함) |
| 3 | GitHub Issue #11 분석 | ❌ 윈도우 완전 성공 사례 없음, 여전히 Open |
| 4 | WSL2 + Ubuntu + PyPI 설치 | ✅ localharness 바이너리 포함, Agent 정상 작동 |

- **WSL2 설치 전체 절차:**

| # | 명령어 | 실행 위치 | 비고 |
| --- | --- | --- | --- |
| 1 | `wsl --install` | 관리자 PowerShell | 재부팅 필요 |
| 2 | `wsl --install -d Ubuntu` | 관리자 PowerShell | Ubuntu 배포판 설치 |
| 3 | 유저이름/비밀번호 설정 | Ubuntu 터미널 | 영어 소문자, 간단한 비밀번호 OK |
| 4 | `apt update` | WSL Ubuntu | root 또는 sudo |
| 5 | `apt install python3-pip python3-venv -y` | WSL Ubuntu | Python 도구 |
| 6 | `mkdir antigravity-test && cd antigravity-test` | WSL Ubuntu | 프로젝트 폴더 |
| 7 | `python3 -m venv venv` | WSL Ubuntu | 가상환경 생성 |
| 8 | `source venv/bin/activate` | WSL Ubuntu | 가상환경 활성화 |
| 9 | `pip install --upgrade pip` | WSL Ubuntu (venv) | pip 업데이트 |
| 10 | `pip install google-antigravity` | WSL Ubuntu (venv) | SDK 설치 (Linux wheel → localharness 포함) |

- **자동 활성화 설정 (.bashrc):**
```bash
# ~/.bashrc 끝에 추가
cd /home/ys/antigravity-test && source venv/bin/activate
export GEMINI_API_KEY=본인의_제미나이_API_키_값
```

- **WSL2 미러 네트워킹 설정:**
```ini
# C:\Users\YS\.wslconfig
[wsl2]
networkingMode=mirrored
```
> ⚠️ 설정 후 반드시 `wsl --shutdown` 실행하여 WSL 재시작 필요

- **Windows 방화벽 규칙 추가 (관리자 PowerShell):**
```powershell
netsh advfirewall firewall add rule name="LM Studio WSL" dir=in action=allow protocol=TCP localport=1234
```

- **LM Studio 서버 설정:**
  - Server Settings → **Serve on Local Network**: ON (토글 활성화)
  - 이 설정이 꺼져있으면 `127.0.0.1`에서만 수신, WSL에서 접근 불가

- **SDK 테스트 코드 (hello.py):**
```python
import os
import asyncio
from google.antigravity import Agent, LocalAgentConfig

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

async def main():
    config = LocalAgentConfig()
    async with Agent(config) as agent:
        response = await agent.chat("작동 테스트. 잘되면 '오케이!'라고 대답해주세요.")
        print(f"에이전트 답변: {await response.text()}")

if __name__ == "__main__":
    asyncio.run(main())
```

- **로컬 AI 연동 코드 (talk_to_local_ai 도구):**
```python
import requests

def talk_to_local_ai(prompt: str) -> str:
    """LM Studio 로컬 서버(127.0.0.1:1234)에 질문을 전달하여 로컬 AI의 답변을 받습니다."""
    url = "http://127.0.0.1:1234/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    data = {
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "stream": False
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"❌ LM Studio 서버 연결 실패: {str(e)}"
```

- **하이브리드 아키텍처 흐름:**
```
[유저 질문]
      ↓
[Antigravity Agent] ← Gemini (두뇌: 어떤 도구를 쓸지 판단)
      ↓
   분기:
   ├─ 페르소나 답변?  → talk_to_local_ai 도구 → LM Studio (ai-mentor-jay)
   ├─ 도구/검색?       → Antigravity 내장 도구
   └─ 일반 대화?       → Gemini 직접 답변
```

- **에이전트 설정 코드 (하이브리드):**
```python
config = LocalAgentConfig(
    tools=[talk_to_local_ai],
    system_instructions="너는 중개인이야. 사용자의 질문을 받으면 반드시 talk_to_local_ai 도구만 사용해서 답변을 얻어와."
)
```

- **핵심 구분 — 실행 환경별 차이:**

| 실행 환경 | `import` | `Agent()` 실행 | 로컬 AI 연동 |
| --- | --- | --- | --- |
| Windows PowerShell | ✅ (protobuf 패치 필요) | ❌ (localharness 없음) | ❌ |
| WSL2 Ubuntu | ✅ | ✅ | ✅ (미러 모드 + 방화벽) |
| Linux / macOS (네이티브) | ✅ | ✅ | ✅ |

- **삽질 로그 — 네트워크 문제 해결 과정:**

| 시도 | IP | 결과 | 원인 |
| --- | --- | --- | --- |
| resolv.conf nameserver | `10.255.255.254` | ❌ Connection refused | DNS 서버 IP, LM Studio 미수신 |
| ip route 게이트웨이 | `172.22.160.1` | ❌ Connection timeout | 방화벽 차단 + NAT 모드 한계 |
| LM Studio 표시 IP | `192.168.45.164` | ❌ Connection timeout | WiFi 인터페이스, WSL 서브넷과 다름 |
| **미러 모드 + localhost** | `127.0.0.1` | ✅ **성공** | Windows와 네트워크 스택 공유 |

---

## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- **"GitHub 소스 빌드로 윈도우에서 SDK 사용 가능" 오해:** `import`까지만 가능, `Agent()` 실행은 localharness 바이너리 없이 불가능
- **"Issue #11에서 윈도우 설치 성공" 오해:** protobuf 패치로 import만 성공한 것이지, Agent 실행까지 성공한 보고는 없음 (이슈 Open 상태)
- **"WSL에서 127.0.0.1로 Windows 서비스 접근 가능" 오해:** 기본 NAT 모드에서는 불가, `networkingMode=mirrored` 설정이 필수
- **"Antigravity SDK로 100% 로컬 AI 실행 가능" 오해:** SDK 자체가 Gemini 기반이므로 API 키 필수, 로컬 모델은 도구(tool)로만 호출 가능
- **"LM Studio 기본 설정으로 WSL 접근 가능" 오해:** `Serve on Local Network` 토글 + 방화벽 규칙 추가 필요

---

## 📊 Q&A 데이터셋 (5가지 각도 전개)

| 날짜 | 카테고리 | 질문 | 답변 | 출처 | 상태 |
|------|----------|------|------|------|------|
| 2026-06-01 | 직접(What) | Antigravity SDK가 뭐야? | Google에서 만든 에이전트 개발 프레임워크예요. Gemini를 두뇌로 쓰고, 도구(tools), 후크(hooks), 트리거(triggers) 등을 지원하는 엔터프라이즈급 SDK예요. | 대화기록 | 신규 |
| 2026-06-01 | 직접(What) | localharness가 뭐야? | SDK 내부에서 사용하는 Go 바이너리예요. 에이전트 세션을 로컬에서 실행하는 핵심 컴포넌트인데, Google 릴리즈 스크립트가 wheel 빌드 시 주입해요. GitHub 소스에는 없어요. | 대화기록 | 신규 |
| 2026-06-01 | 직접(How) | 윈도우에서 SDK를 어떻게 쓰나요? | WSL2(Ubuntu)를 설치하고 그 안에서 pip install google-antigravity 하면 Linux wheel에 localharness가 포함돼요. 미러 네트워킹 설정 후 LM Studio와도 연동 가능해요. | 대화기록 | 신규 |
| 2026-06-01 | 직접(How) | 로컬 AI를 어떻게 연동하나요? | talk_to_local_ai 함수를 만들어 LM Studio API(127.0.0.1:1234)를 호출하고, 이 함수를 LocalAgentConfig의 tools에 등록해요. Gemini가 중개인, 로컬 AI가 실행자 역할이에요. | 대화기록 | 신규 |
| 2026-06-01 | 상황(When) | WSL에서 LM Studio 연결이 안 되면? | 3가지 확인: ① .wslconfig에 networkingMode=mirrored 설정 ② LM Studio Server Settings에서 Serve on Local Network 활성화 ③ 관리자 PowerShell에서 방화벽 포트 1234 허용 규칙 추가 | 대화기록 | 신규 |
| 2026-06-01 | 상황(When) | Gemini API 키 없이 에이전트 실행 가능해? | 불가능해요. Antigravity SDK 자체가 Gemini를 두뇌로 사용하기 때문에 GEMINI_API_KEY가 필수예요. 순수 로컬만 원하면 SDK 없이 LM Studio API를 직접 호출하세요. | 대화기록 | 신규 |
| 2026-06-01 | 초보(Why) | 왜 WSL을 써야 해? | Google이 Antigravity SDK의 Windows용 wheel(localharness.exe)을 아직 배포하지 않았기 때문이에요. Linux wheel에만 바이너리가 포함되어 있어서 WSL로 Linux 환경을 만들어야 해요. | 대화기록 | 신규 |
| 2026-06-01 | 초보(Why) | 미러 모드가 뭐야? | WSL2의 네트워킹 모드 중 하나예요. 기본 NAT 모드에서는 WSL과 Windows가 다른 네트워크인데, 미러 모드에서는 같은 127.0.0.1을 공유해서 Windows 서비스에 바로 접근 가능해요. | 대화기록 | 신규 |
| 2026-06-01 | 반대(But) | GitHub 소스 빌드로도 되지 않아? | import까지만 돼요. pyproject.toml에 명시된 대로 릴리즈 스크립트가 바이너리를 주입하는데, 소스 빌드에서는 이 과정이 생략돼요. Agent() 실행 시 RuntimeError 발생해요. | 대화기록 | 신규 |
| 2026-06-01 | 반대(But) | protobuf 버전 패치하면 해결 안 돼? | import 에러(protobuf runtime_version)만 해결돼요. 진짜 문제는 localharness 바이너리 누락이라 protobuf와는 별개의 문제예요. 2단계 문제 중 1단계만 해결하는 셈이에요. | 대화기록 | 신규 |
| 2026-06-01 | 잡담(Feel) | 설치가 너무 복잡해 | 최초 1회만 복잡해요! 한번 세팅하면 .bashrc 자동 활성화로 WSL 터미널 열자마자 바로 python hello.py만 치면 돼요. 가상환경도, API 키도 자동이에요. | 대화기록 | 신규 |
| 2026-06-01 | 잡담(Feel) | Gemini 키가 왜 필요한지 모르겠어 | 비유하면 "매니저(Gemini)가 판단하고, 직원(로컬 AI)이 실행"하는 구조예요. 매니저 없이 직원만으로도 일은 되지만, SDK의 에이전트 프레임워크(도구, 후크, 정책 등)를 쓰려면 매니저가 필요해요. | 대화기록 | 신규 |

---
*Source: Antigravity IDE Agent Conversation Export | 대화 ID: 4e19adcd-18c7-4710-a169-ffc4a779ad0e*
