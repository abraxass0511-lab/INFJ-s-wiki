# 왜 Cloudflare Workers를 선택했는가

## 배경
서버리스 아키텍처를 선택할 때 AWS Lambda, Vercel Edge Functions, Cloudflare Workers 세 가지를 비교했다.

## 비교 분석
| 항목 | AWS Lambda | Vercel Edge | Cloudflare Workers |
|---|---|---|---|
| Cold Start | 100-500ms | 50-200ms | <5ms |
| 무료 티어 | 100만 요청 | - | 10만 요청/일 |
| KV 스토리지 | DynamoDB (별도) | 없음 | Workers KV (내장) |
| 글로벌 배포 | 리전 선택 필요 | 자동 | 자동 (300+ PoP) |

## 결정 이유
- **극저 지연시간**: Cold start <5ms — 투자 알림에 적합
- **KV 내장**: 별도 DB 없이 State 관리 가능
- **비용**: 일일 10만 요청 무료 — 개인 프로젝트에 충분
- **Cron 트리거**: 무료 플랜에서도 Cron 사용 가능

## 결론
> Cloudflare Workers는 "빠르고 싸고 간단한" 서버리스의 최전선이다. 개인 프로젝트의 백엔드로 이보다 나은 선택은 현재 없다.
