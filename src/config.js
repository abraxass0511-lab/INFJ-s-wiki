/**
 * P-Reinforce Configuration
 * 전체 시스템의 경로, 상수, 기본값을 관리합니다.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export const CONFIG = {
  // ── 루트 경로 ──
  ROOT,

  // ── 폴더 구조 ──
  PATHS: {
    RAW:      path.join(ROOT, '00_Raw'),
    WIKI:     path.join(ROOT, '10_Wiki'),
    META:     path.join(ROOT, '20_Meta'),
    PROJECTS: path.join(ROOT, '10_Wiki', '🛠️ Projects'),
    TOPICS:   path.join(ROOT, '10_Wiki', '💡 Topics'),
    DECISIONS:path.join(ROOT, '10_Wiki', '⚖️ Decisions'),
    SKILLS:   path.join(ROOT, '10_Wiki', '🚀 Skills'),
  },

  // ── 메타 파일 ──
  META_FILES: {
    GRAPH:    path.join(ROOT, '20_Meta', 'Graph.json'),
    POLICY:   path.join(ROOT, '20_Meta', 'Policy.md'),
    INDEX:    path.join(ROOT, '20_Meta', 'Index.md'),
    LOG:      path.join(ROOT, '20_Meta', 'ActionLog.json'),
  },

  // ── RL 가중치 (초기값) ── 
  RL_WEIGHTS: {
    w1_categorization: 0.4,   // 분류 정확도 가중치
    w2_connectivity:   0.35,  // 그래프 연결도 가중치
    w3_satisfaction:    0.25,  // 사용자 만족도 가중치
  },

  // ── 유사도 임계값 ──
  THRESHOLDS: {
    EXISTING_CATEGORY: 0.85,  // 기존 카테고리 배치 유사도
    NEW_CATEGORY:      0.50,  // 신규 카테고리 생성 유사도
    REFACTOR_LIMIT:    12,    // 폴더당 최대 파일 수 (초과 시 세분화)
  },

  // ── 4가지 기본 분류 ──
  CATEGORIES: {
    PROJECTS:  { name: '🛠️ Projects',  description: '목표 중심 — 진행 중인 프로젝트, 할 일, 프로젝트 요약' },
    TOPICS:    { name: '💡 Topics',    description: '개념 중심 — 학문, 기술, 철학 등 주제별 지식' },
    DECISIONS: { name: '⚖️ Decisions', description: '의사결정 중심 — 왜 이렇게 판단했는가에 대한 기록' },
    SKILLS:    { name: '🚀 Skills',    description: '실행 중심 — 프롬프트, 워크플로우, 스킬 패턴' },
  },

  // ── 키워드 맵핑 (시작점) ──
  KEYWORD_MAP: {
    PROJECTS:  ['프로젝트', '진행', '할일', 'todo', 'project', '일정', '마일스톤', '목표', 'roadmap', 'milestone', 'goal', 'sprint', 'task', '계획', 'plan', '만들기', 'build', '개발', 'develop'],
    TOPICS:    ['개념', '이론', '정의', '원리', 'concept', 'theory', '심리학', '철학', '과학', '수학', '코딩', 'AI', '머신러닝', 'LLM', '경제', '역사', 'psychology', 'philosophy', 'science', 'learning', '기술', 'technology'],
    DECISIONS: ['결정', '이유', '선택', '비교', '판단', 'decision', 'why', 'tradeoff', '장단점', 'pros', 'cons', '결론', 'conclusion', '분석', 'analysis', '전략', 'strategy', 'vs', '비즈니스'],
    SKILLS:    ['스킬', '방법', '패턴', '워크플로우', '프롬프트', 'prompt', 'workflow', 'skill', 'howto', '템플릿', 'template', '자동화', 'automation', '스크립트', 'script', '도구', 'tool', 'recipe'],
  },

  // ── Git 설정 ──
  GIT: {
    COMMIT_PREFIX: '[P-Reinforce]',
    BRANCH: 'main',
  },

  // ── 날짜 포맷 ──
  DATE_FORMAT: 'YYYY-MM-DD',
};

export default CONFIG;
