# P-Reinforce 자율형 위키 에이전트 구축

> 📅 2026-04-13 14:18 | Antigravity 대화에서 자동 추출
> 🔗 Conversation: 2b36e846-aba4-4cf2-af5a-d7cfe6042c82

## 💡 핵심 요약
Andre Karpathy의 LLM-Wiki 아키텍처와 RL 이론을 결합한 지식 자동화 에이전트를 Node.js로 구축했다.

## 📖 오늘 배운 것
- 키워드 TF 스코어링 + 컨텍스트 유사도 조합으로 수동 규칙 없이 의미론적 분류 가능
- Jaccard bigram 유사도는 한국어/영어 혼합 문서에서도 작동
- chokidar 파일 감시로 실시간 자동화 파이프라인 구현
- Force-directed 그래프는 Canvas 2D로 300 프레임 시뮬레이션하면 자연스러운 레이아웃 생성

## ⚖️ 결정한 사항
- Node.js ESM 기반 (Python 미설치 환경)
- 4가지 분류: Projects/Topics/Decisions/Skills
- 폴더당 12개 초과 시 자동 세분화 트리거

## 🚀 새로운 스킬/패턴
- RL 보상 함수 설계: R = w1*분류정확도 + w2*연결도 + w3*만족도
- Policy.md를 통한 사용자 피드백 → 가중치 업데이트 루프
- Karpathy 위키 템플릿: frontmatter + 한줄통찰 + 구조화 + 모순기록 + 그래프 연결

## 🔗 연관 지식
- [[Luna Agent 파이프라인]]
- [[Alpha 투자 에이전트]]
- [[Cloudflare Workers]]

---
*Source: Antigravity Conversation Export*
