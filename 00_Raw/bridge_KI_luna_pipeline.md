# 🧠 Knowledge Item: luna_pipeline

> 📋 요약: 2 AM: The Freedom Grind 채널 자동화 파이프라인의 전체 기술 문서. API 모델 현황(이미지/음악/텍스트), 파이프라인 6단계 플로우, onia music 브랜딩 전략, BPM 동기화, 쿼터 관리, 알려진 이슈 및 해결 현황을 포함. 대화 시작 시 반드시 이 문서와 SKILL.md를 먼저 읽어야 함.
> 📅 동기화: 2026-04-13T05:22:38.422Z
> 📁 원본: C:\Users\YS\.gemini\antigravity\knowledge\luna_pipeline\artifacts\pipeline_summary.md

# Luna Agent: Freedom Grind Pipeline — 종합 기술 문서

> 최종 업데이트: 2026-04-09

---

## 🔴 절대 규칙 (MANDATORY RULES)

1. **대화 시작 시 반드시 SKILL.md와 이 문서를 먼저 읽고 응답할 것**
2. 코드 수정 전 `freedom_grind_pipeline.py` 현재 상태를 반드시 확인할 것
3. API 호출 테스트 시 불필요한 연속 호출 금지 (무료 쿼터 소진 방지)

---

## 📁 핵심 파일 구조

```
음악채널에이전트(루나)/
├── freedom_grind_pipeline.py    ← 메인 파이프라인 (538줄)
├── render_today.py              ← 텍스트 오버레이 + 비주얼 이펙트 (237줄)
├── setup_youtube_api.py         ← YouTube API 인증
├── progress.json                ← 현재 day 진행 추적
├── .env                         ← GOOGLE_API_KEY
├── token.pickle                 ← YouTube OAuth 토큰
├── assets/                      ← 생성된 이미지/오디오/영상
└── .agent/skills/agent-luna/
    ├── SKILL.md                 ← 스킬 정의
    └── prompt_templates.json    ← 장르별 씬/프롬프트 (285줄)
```

---

## 🔧 API 모델 현황 (2026-04-09 검증 완료)

### 이미지 생성

| 모델 | API 방식 | 무료 플랜 | 비고 |
|------|----------|-----------|------|
| `gemini-2.5-flash-image` | `generate_content(response_modalities=['IMAGE','TEXT'])` | ✅ 사용 가능 | **1순위** |
| `gemini-3-pro-image-preview` | `generate_content(response_modalities=['IMAGE','TEXT'])` | ✅ 사용 가능 | 2순위 폴백 |
| `gemini-3.1-flash-image-preview` | `generate_content(response_modalities=['IMAGE','TEXT'])` | ✅ 사용 가능 | 3순위 폴백 |
| `gemini-2.0-flash` | ❌ IMAGE 모달리티 미지원 | - | 사용 불가 |
| `imagen-4.0-*` | `generate_images()` | ❌ 유료만 | 사용 불가 |

> ⚠️ **중요**: `generate_images()` API는 무료 플랜에서 작동하지 않음.
> 반드시 `generate_content(response_modalities=['IMAGE', 'TEXT'])` 사용.

### 음악 생성

| 모델 | API | 무료 플랜 | 비고 |
|------|-----|-----------|------|
| `lyria-realtime-exp` | `bidiGenerateContent` (WebSocket) | ✅ **유일하게 작동** | 현재 메인 |
| `lyria-3-pro-preview` | `bidiGenerateMusic` | ❌ 404 모델 미존재 | 목록에는 있지만 호출 불가 |
| `lyria-3-clip-preview` | `generate_content` | ❌ 무료 쿼터 = 0 | 유료만 가능 |

### 텍스트 생성 (메타데이터/스토리)

| 모델 | 무료 플랜 | 비고 |
|------|-----------|------|
| `gemini-2.5-flash` | ✅ 20 RPD / 분당 제한 | 메인 모델 |
| `gemini-2.5-pro` | ✅ 매우 제한적 | 폴백 |

### 쿼터 관리 팁

- 무료 플랜 이미지 생성: **분당 제한** 있음 (연속 호출 시 429 발생)
- 테스트는 최소한으로, 실전 파이프라인 실행 시 1회로 제한
- 429 발생 시 **10-15초 대기** 후 재시도
- 새 API 키 추가 시 `.env`에 `GOOGLE_API_KEY_2` 추가 → 키 로테이션 가능

---

## 🔄 파이프라인 6단계 플로우

```
① select_genre(day)        → 시간대별 장르/BPM 자동 결정
② generate_dynamic_story() → Gemini로 훅/스토리 텍스트 생성
③ generate_image(day)      → 장르 연동 씬 이미지 (scene_pool 기반)
④ generate_audio(day)      → Lyria Realtime으로 음악 생성
⑤ render_video()           → 워터마크 + 텍스트 + 글리치 효과
⑥ upload()                 → YouTube 예약 업로드
```

### 장르별 시간대 매핑

| KST 시간대 | 장르 | BPM 범위 | 분위기 |
|-------------|------|----------|--------|
| 18:00-23:00 | Nightcore Hustle | 155-175 | 퇴근 후 각성 |
| 00:00-03:00 | Drift Phonk Grind | 130-155 | 새벽 전투 |
| 04:00-07:00 | Slowed Reverb | 55-75 | 새벽 성찰 |
| 기타 | day % 3 순환 | 장르별 | 자동 |

### 예약 업로드 슬롯

| day % 3 | KST 시간 | UTC 시간 |
|---------|----------|----------|
| 0 | 21:00 | 12:00 |
| 1 | 01:00 | 16:00 |
| 2 | 06:00 | 21:00 |

---

## 🎨 onia music 브랜딩 적용 사항

- **워터마크**: 하단 중앙 36pt "2 AM : The Freedom Grind" + 그림자 (반투명)
- **카메라 앵글**: 45도 탑다운 + 필름 그레인 + 아날로그 톤
- **제목 포맷**: `[장르] "감성 훅" 이모지 | BPM`
- **설명**: 해시태그 3개 → 마이크로스토리 → 1시간 믹스 링크
- **언어**: 100% 영어 (글로벌 알고리즘 최적화)

---

## ⚡ render_today.py 비주얼 효과

- **BPM 동기화**: `compose_visuals(bpm=실제BPM)` 파라미터로 전달 (2026-04-09 수정)
- **루마 펄스**: 비트마다 밝기 증가
- **카메라 쉐이크**: 비트 정점에 ±4px 흔들림
- **RGB 글리치**: 채널별 색 분리 + 반전 라인
- **타이핑 효과**: 0-1.5s 훅 텍스트 타이핑
- **순차 스토리**: 1.5-15s 동안 story_1~4 페이드 전환
- **CTA 깜빡임**: 13.5s 이후 "FULL 1-HOUR MIX BELOW" 깜빡임

---

## 🐛 알려진 이슈 및 해결 현황

| 이슈 | 상태 | 해결 |
|------|------|------|
| BPM 92 하드코딩 | ✅ 해결 | compose_visuals에 bpm 파라미터 추가 |
| generate_images API 404 | ✅ 해결 | generate_content로 전환 |
| lyria-3-pro-preview 404 | ⚠️ 우회 | lyria-realtime-exp 폴백으로 정상 동작 |
| generate_metadata None 반환 | ⚠️ 허용됨 | upload() 내 하드코딩 폴백 존재 |
| 텍스트 타이밍 15s vs 오디오 20s | 🟡 미수정 | 마지막 5초 CTA만 표시 (허용 수준) |

---

## 📌 향후 작업

1. 롱폼 전환 로직 (조회수 높은 숏폼 → 1시간 믹스)
2. API 키 로테이션 (쿼터 관리)
3. 감성 폰트 적용 (arial → 필기체)
4. scene_pool 지속 확장
