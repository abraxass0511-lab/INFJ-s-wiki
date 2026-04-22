---
id: [UUID_PLACEHOLDER]
category: "[[10_Wiki/⚖️ Decisions]]"
confidence_score: 0.95
tags: [YouTube API, Comment Strategy, Rendering Bug, CTA]
last_reinforced: 2026-04-22
---
# [[Freedom Grind v5 — 렌더링 고도화, 업로드 자동화, 댓글 API 교훈]]
## 📌 한 줄 통찰
> 검증 없이 확신하면 실패한다. API 동작과 전략에 대해 실제 데이터로 증명되기 전까지는 가설일 뿐이다.

## 📖 구조화된 지식
- **렌더링 및 버그 수정**: `render_v4` 이모지 정규식(`_EMOJI_RE`)에 누락된 유니코드 범위(`\U000023E9-\U000023F3`)를 추가하여 이모지 렌더링 버그를 수정했다.
- **YouTube 댓글 API 제한 (핵심 교훈)**: `commentThreads.insert`는 예약 영상에 403 Forbidden을 반환하므로, 공개(public) 상태에서만 작동함을 확인했다. 에이전트의 '100% 가능' 안내는 신뢰하지 말아야 한다.
- **샌드위치 CTA 전략**: 시청자 이탈 방지를 위해 첫 1.5초 훅(질문) + 중간 스토리(내러티브) + 마지막 2.5초 CTA(행동 유도)의 3단 구조를 도입하여 적용했다.
- **Pin 댓글 전략**: 타겟 시청자(미국 야간 그라인더)와의 공감대 형성을 위해 서울 대신 미국 도시(Austin TX, Chicago IL, NYC) 기반의 댓글 전략을 사용한다.

## 🔗 지식 연결
- Parent: [[YouTube Data API v3]]
- Related: [[샌드위치 CTA 전략]], [[Pin 댓글 자동화]], [[이모지 렌더링 시스템]]
- Raw Source: [[00_Raw/2026-04-22/2026-04-22_루나_Freedom_Grind_v5_렌더링_댓글API.md]]