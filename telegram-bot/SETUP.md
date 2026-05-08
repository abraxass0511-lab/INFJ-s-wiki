# 📱 텔레그램 → 위키 자동 등록 봇 셋업 가이드

## 전체 흐름
```
📱 텔레그램 이미지 → ☁️ Cloudflare Worker → 🐙 GitHub Push → ⚙️ OCR → 📄 MD → 📅 캘린더
```

---

## 🔧 1단계: 텔레그램 봇 생성 (2분)

1. 텔레그램에서 **@BotFather** 검색
2. `/newbot` 입력
3. 봇 이름 입력 (예: `위키에이전트봇`)
4. 봇 사용자명 입력 (예: `wiki_agent_ys_bot`) — `_bot`으로 끝나야 함
5. **봇 토큰을 복사** (예: `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxx`)

---

## ☁️ 2단계: Cloudflare 계정 생성 & Workers 배포 (5분)

### 2-1. Cloudflare 가입
1. https://dash.cloudflare.com/sign-up 접속
2. 무료 계정 생성 (신용카드 불필요)

### 2-2. Wrangler CLI 설치 & 로그인
```powershell
cd telegram-bot
npm install
npx wrangler login
```
→ 브라우저가 열리면 Cloudflare 계정으로 로그인 허용

### 2-3. 환경 변수 설정 (시크릿)
```powershell
# 텔레그램 봇 토큰
npx wrangler secret put TELEGRAM_BOT_TOKEN
# → 프롬프트에 봇 토큰 붙여넣기

# GitHub 토큰
npx wrangler secret put GITHUB_TOKEN
# → GitHub Personal Access Token 붙여넣기

# GitHub 사용자명
npx wrangler secret put GITHUB_OWNER
# → abraxass0511-lab

# GitHub 리포지토리명
npx wrangler secret put GITHUB_REPO
# → INFJ-s-wiki

# (선택) 허용 Chat ID - 다른 사람이 못 쓰도록 제한
npx wrangler secret put ALLOWED_CHAT_IDS
# → 본인 Chat ID 입력 (/start로 확인 가능)
```

### 2-4. 배포
```powershell
npx wrangler deploy
```
→ 배포 URL이 나옴 (예: `https://wiki-telegram-bot.YS.workers.dev`)

---

## 🔗 3단계: 웹훅 연결 (30초)

배포된 Worker URL에 `/setup`을 붙여서 브라우저에서 접속:
```
https://wiki-telegram-bot.YS.workers.dev/setup
```

`"ok": true` 가 나오면 성공! 웹훅 연결 완료.

---

## 📸 사용법

### 이미지 보내기
- **이미지만 전송** → `AI공부` 카테고리로 자동 등록
- **이미지 + 캡션** → 캡션이 카테고리명
  - 예: 이미지 + `회사` → `회사` 카테고리
  - 예: 이미지 + `유튜브` → `유튜브` 카테고리

### 명령어
| 명령어 | 설명 |
|--------|------|
| `/start` | 봇 소개 & Chat ID 확인 |
| `/id` | Chat ID 확인 |
| `/status` | 오늘 업로드된 파일 목록 |

### 예시
```
1. 텔레그램에서 📸 스크린샷 보내기
2. 봇 응답: "✅ 업로드 완료! 00_Raw/2026-05-08/IMG_xxxxx.jpg"
3. ~1분 후: GitHub Actions가 Gemini로 MD 생성
4. 캘린더에 자동 반영!
```

---

## ⚙️ 기술 사양

- **호스팅**: Cloudflare Workers (무료 — 매일 10만 요청)
- **응답 시간**: ~2초 (이미지 크기에 따라)
- **지원 형식**: PNG, JPG, JPEG, WebP, BMP
- **최대 파일 크기**: 20MB (텔레그램 제한)
- **시간대**: KST (한국 표준시) 기준 날짜 자동 계산

---

## 🔒 보안

1. `ALLOWED_CHAT_IDS`로 본인만 사용 가능하도록 제한
2. 모든 토큰은 Cloudflare의 암호화된 시크릿으로 저장
3. GitHub Token은 필요한 최소 권한만 부여 (repo scope)

---

## ❓ 문제 해결

### "권한이 없습니다" 오류
→ `/id`로 Chat ID 확인 후 `ALLOWED_CHAT_IDS`에 추가

### 이미지가 GitHub에 안 올라감
→ `GITHUB_TOKEN` 권한 확인 (repo scope 필요)

### MD 파일이 안 생성됨
→ GitHub Actions > ocr-process.yml 워크플로우 로그 확인
→ `GEMINI_API_KEY` GitHub Secret 확인
