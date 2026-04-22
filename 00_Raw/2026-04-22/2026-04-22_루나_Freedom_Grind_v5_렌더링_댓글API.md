# [[Freedom Grind v5 — 렌더링 고도화, 업로드 자동화, 댓글 API 교훈]]

> 📅 2026-04-22 23:17 | 루나 에이전트 대화에서 자동 추출
> 🤖 에이전트: 루나 (YouTube 음악 채널)

## 📌 Brief Summary
render_v4 이모지 버그 수정, 3편 렌더링+업로드 완료, YouTube 댓글 API의 예약 영상 제한 발견 및 교훈 기록.

## 📊 전날 영상 성과 분석 (4/19 업로드 3편 — 수집: 4/22 14:07 KST)

| 슬롯 | 제목 | 조회 | 좋아요 | 댓글 | 기준 대비 | 판정 |
|------|------|------|--------|------|----------|------|
| 1 (21:00) | Coffee mug empties. IDE stays open. ☕💻 \| 138 Phonk | **209** 🔥 | 1 | 0 | 3.21x | ✅ 성공 |
| 2 (01:00) | Laptop hums. Monitor glows. Headphones on. 🎧💻 \| 165 Nightcore | **199** | 1 | 0 | 3.06x | ✅ 성공 |
| 3 (06:00) | Rain taps the window. Keyboard taps the code. 🌧️⌨️ \| 81 Chill | **57** | 0 | 0 | 0.88x | ❌ 실패 |

### 🔴 핵심 문제점
1. **인게이지먼트 완전 실패** — 총 조회 465 / 좋아요 2 / 댓글 0. 좋아요율 0.43%로 업계 평균(4~8%)의 1/10. Description CTA가 7번 연속 실패
2. **Chill 장르 바닥 성과** — 81 BPM Chill이 57뷰로 Phonk(209뷰)의 1/3.7. 채널 DNA(새벽 각성)와 Chill 감성이 정반대
3. **슬롯 1이 슬롯 2 역전** — Coffee(209) > Headphones(199). 제목의 보편적 공감 오브젝트가 슬롯 효과를 압도

### 💡 개선안 + 오늘 적용 결과
1. **Chill 제거 → 고BPM 3장르 편성**: Nightcore 155 + Phonk 140 + Memphis Phonk 145로 변경. Chill 배제
2. **샌드위치 CTA 도입**: 첫 1.5초 훅 + 중간 스토리 + 마지막 2.5초 CTA 3단 구조 → render_v4.py에 구현 완료
3. **Pin 자기응답 댓글**: 미국 도시 기반(Austin TX, Chicago IL, NYC) 댓글 전략 → 업로드 후 API로 등록 시도

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

## 📁 오늘 생성된 에셋

| # | 파일 | 오브젝트 | 장르/BPM | 상태 |
|---|------|---------|---------|------|
| 1 | `260422_v5_coffee_nightcore_155.mp4` | ☕ Coffee | Nightcore 155 | ✅ 업로드 + 댓글 완료 |
| 2 | `260422_v5_headphones_phonk_140.mp4` | 🎧 Headphones | Phonk 140 | ✅ 업로드 / 댓글 대기 |
| 3 | `260422_v5_watch_memphis_145.mp4` | ⏰ Watch 2AM | Memphis 145 | ✅ 업로드 / 댓글 대기 |

## 🎯 다음 세션 우선순위
1. Slot 2/3 공개 후 `add_pin_comments.py` 실행하여 Pin 댓글 등록
2. 4/22 업로드 3편 성과 수집 → 샌드위치 CTA + 고BPM 편성 효과 검증
3. 댓글 자동화를 업로드 스크립트에 통합 (공개 시점에 맞춘 지연 실행 방식)

## 💡 핵심 인사이트
> **"검증 없이 확신하면 실패한다. API든 전략이든, 실제 데이터로 증명되기 전까지는 가설일 뿐이다."**

## 🔗 Knowledge Connections
- [[이모지 렌더링 시스템]]
- [[YouTube Data API v3]]
- [[샌드위치 CTA 전략]]
- [[Pin 댓글 자동화]]
- [[위키 시스템 역할 분리]]

---
*Source: 루나 Agent Conversation Export*
