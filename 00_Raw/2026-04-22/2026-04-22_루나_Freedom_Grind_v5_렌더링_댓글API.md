# [[Freedom Grind v5 — 렌더링 고도화, 업로드 자동화, 댓글 API 교훈]]

> 📅 2026-04-22 23:17 | 루나 에이전트 대화에서 자동 추출
> 🤖 에이전트: 루나 (YouTube 음악 채널)

## 📌 Brief Summary
render_v4 이모지 버그 수정, 3편 렌더링+업로드 완료, YouTube 댓글 API의 예약 영상 제한 발견 및 교훈 기록.

## 📖 Core Content

### 오늘 배운 것
- **⏰ 이모지 렌더링 버그 수정**: `_EMOJI_RE` 정규식에 `\U000023E9-\U000023F3` 범위 누락 → ⏰⏱⏲⏳이 □(두부)로 깨짐. 범위 추가로 해결
- **YouTube 댓글 API 제한 (핵심 교훈)**: `commentThreads.insert`는 **예약(private scheduled) 상태 영상에 403 Forbidden 반환**. 공개(public) 상태에서만 작동. 에이전트가 "100% 가능"이라고 잘못 안내한 후 실제 API 호출에서 403으로 검증됨
- **OAuth 토큰 스코프**: `youtube.force-ssl` 스코프가 `setup_youtube_api.py`에 이미 포함되어 있었으나, 기존 `token.pickle`이 이전 스코프로 발급된 토큰이어서 삭제 후 재인증 필요했음
- **샌드위치 CTA 구조**: 첫 1.5초 훅(질문) + 중간 스토리(내러티브) + 마지막 2.5초 CTA(행동 유도) 3단 구조 도입
- **Pin 댓글 전략**: 서울 대신 미국 도시(Austin TX, Chicago IL, NYC) 사용 → 타겟 시청자(미국 야간 그라인더)와의 공감대 형성

### 결정한 사항
- **위키 역할 분리 확정**: 각 에이전트(루나 등) = `00_Raw/` 저장만, 위키에이전트 = `10_Wiki/` + `20_Meta/` 구조화 + Git Push
- **Pin 댓글 워크플로**: 예약 영상에는 댓글 불가 → 공개 후 별도 스크립트(`add_pin_comments.py`) 실행
- **검증되지 않은 API 동작을 확신하지 말 것** — 절대 규칙으로 SKILL.md에 영구 기록

### 새로운 스킬/패턴
- `render_v4.py` 이모지 정규식 확장 패턴: 새 이모지 사용 전 반드시 `_EMOJI_RE` 유니코드 범위 확인
- `token.pickle` 스코프 갱신: 스코프 변경 시 토큰 삭제 → 재인증 필수

## 📊 오늘 생성된 에셋

| # | 파일 | 오브젝트 | 장르/BPM | 상태 |
|---|------|---------|---------|------|
| 1 | `260422_v5_coffee_nightcore_155.mp4` | ☕ Coffee | Nightcore 155 | ✅ 업로드 + 댓글 완료 |
| 2 | `260422_v5_headphones_phonk_140.mp4` | 🎧 Headphones | Phonk 140 | ✅ 업로드 / 댓글 대기 (공개 후) |
| 3 | `260422_v5_watch_memphis_145.mp4` | ⏰ Watch 2AM | Memphis 145 | ✅ 업로드 / 댓글 대기 (공개 후) |

**업로드 스케줄:**
- Slot 1: KST 2026-04-22 21:05 (공개 완료)
- Slot 2: KST 2026-04-23 01:05
- Slot 3: KST 2026-04-23 06:04

## 🔗 Knowledge Connections
- [[이모지 렌더링 시스템]]
- [[YouTube Data API v3]]
- [[샌드위치 CTA 전략]]
- [[Pin 댓글 자동화]]
- [[위키 시스템 역할 분리]]

---
*Source: 루나 Agent Conversation Export*
