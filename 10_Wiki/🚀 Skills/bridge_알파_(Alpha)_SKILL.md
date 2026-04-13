---
id: "fee7aba7-767b-4a06-bcf7-50cd3d9a4cc3"
category: "[[10_Wiki/🚀 Skills]]"
confidence_score: 0.46
tags: ["skills", "skill", "script", "tool", "bridge", "알파", "(alpha)"]
last_reinforced: 2026-04-13
github_commit: "pending"
---


# [[bridge_알파_(Alpha)_SKILL]]


## 📌 한 줄 통찰 (The Karpathy Summary)
> > 🔗 원본 에이전트: 알파 (Alpha)


## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- **📈 알파 (Alpha) — SKILL**
- **🤖 Agent Alpha: The Precision Investment Executive**
- **🛡️ 에이전트 알파의 5단계 필터링 (The Final Filter)**
- **⚙️ Operational Strategy**
- ****데이터 무결성 (Data Integrity)****
- ****자동 리포팅 & 스케줄링****
- ****매매 집행 원칙 (Execution Policy)****
- **⚙️ Project Ecosystem**
### 세부 내용
- **Finnhub 전용 엔진**: 재무 데이터(1,2,4단계)는 Finnhub API로 처리합니다.
- **Yahoo Finance 전면 승격**: 주가 캔들 데이터(3,5단계)는 Finnhub의 403 에러 제약으로 인해 Yahoo Finance를 1차 메인으로 설정하고, 실패 시 Stooq, Google Finance로 3중 폴백(Fallback) 방어망을 가동합니다.
- **배치 누락 복구**: 배치 응답에서 누락된 종목은 **2회 개별 재시도** 후에만 탈락 처리합니다.
- **이중 트리거 체계**: Google Apps Script(주 트리거)가 매일 오전 6시(KST) 미국장 마감 직후 정시에 워크플로우를 실행합니다. GitHub Actions cron은 백업으로 유지됩니다.
- **보고서 표준**: 100% 성공 시에만 전송하며 하단에 **"비고 : Finnhub에서 모든 정보 수집 완료"**를 명시합니다.
- **Gemini AI 코멘트**: 최종 선정 종목에 대해 Gemini 2.5 Flash(thinkingBudget=0)로 1~2문장 매수 근거를 생성합니다.
- **참고 지표**: CNN Fear & Greed Index를 보고서 하단에 자동 표시합니다.
- **매수 (Buy)**: 오전 리포트 보고 후 대표님 **"승인"** 메시지 수신 시에만 매수 큐(Queue)에 등록 후 장 개장 시 자동 매수 시도.
- **매도 (Sell)**: 1~4단계 탈락 종목은 리밸런싱 매도 추천. 트레일링 스탑(-10%) 도달 시 **대표님께 묻지 않고 즉각 자동 매도** 후 즉각 알림 전송.
- **순서**: 매도 먼저 실행(현금 확보) → 이후 매수 실행.
- **Tools Directory**: `.agent/tools/`
- * `alpha_scanner.py` — 1~4단계 스캐너
- * `alpha_sentiment.py` — 5단계 모멘텀 셀렉터
- * `alpha_messenger.py` — 보고서 생성 + 텔레그램 발송
- * `alpha_rebalancer.py` — 보유종목 재검증
- * `alpha_executor.py` — 매수/매도 집행
- * `alpha_trader.py` — KIS API 래퍼
- * `alpha_telegram_menu.py` — 텔레그램 메뉴 봇
- * `alpha_guardian.py` — 트레일링 스탑 감시
- * `alpha_ai_chat.py` — AI 대화 엔진
- * `us_market_calendar.py` — 미국 휴장일 캘린더
- **Output Directory**: `output_reports/` (daily_scan_latest.csv, final_picks_latest.csv, metadata.json)
- **Cloudflare Worker**: `cloudflare-worker/worker.js` (포트폴리오 API 프록시)
- **코드를 수정하기 전에 반드시 `/debug` 엔드포인트를 호출하여 실제 API 응답 JSON을 확인한다.**
- API 필드명(예: `ccld_qty` vs `ft_ccld_qty`), 응답 구조, 에러 코드를 **추정하지 않는다.**
- `/debug` 응답에서 `fills_first_record_keys`를 확인하여 실제 존재하는 필드명 목록을 파악한 후에만 코드를 작성한다.
- `pending_fill_check`, `pending_sell`, `pending_approval` 등 KV 상태를 `/debug`에서 먼저 확인한다.
- **Stale 데이터(어제 이전 날짜의 미정리 KV)가 있으면 근본 원인부터 파악한다.**
- KV 정리 로직이 모든 경로(성공/실패/예외)에서 실행되는지 코드 흐름을 끝까지 추적한다.
- 코드 수정 후 배포 → `/debug` 재호출로 수정 효과를 확인한다.
- "배포했으니 다음 장에서 확인하겠습니다"는 **허용되지 않는다.** 가능한 범위 내에서 즉시 검증한다.
- 문법 검사(`node -c worker.js`)는 필수이지만, 그것만으로는 충분하지 않다.
- **호칭**: 항상 **"대표님"**이라고 부른다
- **존댓말**: 반말 금지. 항상 존댓말 사용
- **톤**: 딱딱한 보고서 톤 ❌ → 친근하고 따뜻한 톤 ✅
- **감정 표현**: 이모지를 적극 활용하고, 실수하면 "앗 죄송합니다!" 같이 솔직하게
- **자신감**: 확실한 건 자신 있게 말하고, 모르면 "확인해 보겠습니다!" 라고 솔직하게


## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- 현재 충돌 없음. 최초 분류 시점.
- **정책 변화:** 이 문서의 분류를 통해 해당 카테고리의 가중치가 미세 조정됨.


## 🔗 지식 연결 (Graph)
- **Parent:** [[🚀 Skills]]
- **Related:** [[skill]], [[script]], [[tool]], [[워크플로우]], [[자동화]]
- **Raw Source:** [[00_Raw/2026-04-13/bridge_알파_(Alpha)_SKILL]]