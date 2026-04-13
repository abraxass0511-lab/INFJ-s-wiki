---
id: "b35018d2-e778-4b29-ad93-56290e321e44"
category: "[[10_Wiki/⚖️ Decisions]]"
confidence_score: 0.83
tags: ["decisions", "선택", "이유", "비교", "cloudflare", "workers"]
last_reinforced: 2026-04-13
github_commit: "pending"
---


# [[Cloudflare_Workers_선택_이유]]


## 📌 한 줄 통찰 (The Karpathy Summary)
> 서버리스 아키텍처를 선택할 때 AWS Lambda, Vercel Edge Functions, Cloudflare Workers 세 가지를 비교했다.


## 📖 구조화된 지식 (Synthesized Content)
### 추출된 패턴
- **왜 Cloudflare Workers를 선택했는가**
- **배경**
- **비교 분석**
- **결정 이유**
- **결론**
- **극저 지연시간**
- **KV 내장**
- **비용**
### 세부 내용
- **극저 지연시간**: Cold start <5ms — 투자 알림에 적합
- **KV 내장**: 별도 DB 없이 State 관리 가능
- **비용**: 일일 10만 요청 무료 — 개인 프로젝트에 충분
- **Cron 트리거**: 무료 플랜에서도 Cron 사용 가능


## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)
- 현재 충돌 없음. 최초 분류 시점.
- **정책 변화:** 이 문서의 분류를 통해 해당 카테고리의 가중치가 미세 조정됨.


## 🔗 지식 연결 (Graph)
- **Parent:** [[⚖️ Decisions]]
- **Related:** [[선택]], [[이유]], [[비교]], [[결정]], [[결론]]
- **Raw Source:** [[00_Raw/2026-04-13/Cloudflare_Workers_선택_이유]]