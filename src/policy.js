/**
 * P-Reinforce RL Policy Engine
 * 사용자 피드백을 수집하고, 분류 가중치를 업데이트합니다.
 * 
 * 보상 함수: R = w1(분류 정확도) + w2(그래프 연결도) + w3(사용자 만족도)
 */

import CONFIG from './config.js';
import { readText, writeText, readJSON, writeJSON, today } from './utils.js';

/**
 * 피드백 유형
 */
export const FEEDBACK = {
  PRAISE:   'praise',    // 칭찬 → 가중치 강화
  CORRECT:  'correct',   // 수정 → 경계 재설정
  MOVE:     'move',      // 이동 → 카테고리 재학습
  IGNORE:   'ignore',    // 방치 → 암묵적 승인 (소폭 강화)
};

/**
 * 피드백 기록 및 정책 업데이트
 */
export async function recordFeedback(feedback) {
  const {
    type,          // FEEDBACK enum
    docId,         // 문서 ID
    docTitle,      // 문서 제목
    fromCategory,  // 원래 카테고리
    toCategory,    // 새 카테고리 (move/correct 시)
    keywords,      // 관련 키워드
    note,          // 사용자 메모
  } = feedback;

  // 1. 액션 로그에 기록
  await logAction({
    timestamp: new Date().toISOString(),
    type,
    docId,
    docTitle,
    fromCategory,
    toCategory: toCategory || fromCategory,
    keywords: keywords || [],
    note: note || '',
  });

  // 2. 정책 업데이트
  await updatePolicy(feedback);

  // 3. 보상 점수 계산
  const reward = calculateReward(type);
  
  return { reward, message: buildFeedbackMessage(type, docTitle) };
}

/**
 * 보상 점수 계산
 */
function calculateReward(type) {
  const rewards = {
    [FEEDBACK.PRAISE]:  +1.0,
    [FEEDBACK.CORRECT]: -0.3,
    [FEEDBACK.MOVE]:    -0.5,
    [FEEDBACK.IGNORE]:  +0.1,
  };
  return rewards[type] || 0;
}

/**
 * Policy.md 업데이트
 */
async function updatePolicy(feedback) {
  const { type, fromCategory, toCategory, keywords, docTitle } = feedback;
  
  let policy = await readText(CONFIG.META_FILES.POLICY);
  
  // 정책 파일이 없으면 초기 생성
  if (!policy) {
    policy = generateInitialPolicy();
  }

  const dateStr = today();
  const historyEntry = `\n| ${dateStr} | ${type} | ${docTitle || '-'} | ${fromCategory || '-'} → ${toCategory || fromCategory || '-'} | ${(keywords || []).join(', ') || '-'} |`;

  // 히스토리 테이블에 추가
  if (policy.includes('| 날짜 | 유형 |')) {
    // 테이블 마지막 행 뒤에 삽입
    const lastPipeIdx = policy.lastIndexOf('|');
    const lineEnd = policy.indexOf('\n', lastPipeIdx);
    if (lineEnd > 0) {
      policy = policy.slice(0, lineEnd) + historyEntry + policy.slice(lineEnd);
    } else {
      policy += historyEntry;
    }
  }

  // 키워드 가중치 업데이트
  if (type === FEEDBACK.PRAISE && keywords) {
    for (const kw of keywords) {
      policy = adjustWeight(policy, fromCategory, kw, +0.15);
    }
  } else if (type === FEEDBACK.MOVE && fromCategory && toCategory) {
    for (const kw of (keywords || [])) {
      policy = adjustWeight(policy, fromCategory, kw, -0.2);
      policy = adjustWeight(policy, toCategory, kw, +0.2);
    }
  } else if (type === FEEDBACK.CORRECT) {
    for (const kw of (keywords || [])) {
      policy = adjustWeight(policy, fromCategory, kw, -0.1);
      if (toCategory) policy = adjustWeight(policy, toCategory, kw, +0.15);
    }
  }

  // 업데이트 카운터
  const updateCount = (policy.match(/총 업데이트: (\d+)/)?.[1] || 0);
  policy = policy.replace(/총 업데이트: \d+/, `총 업데이트: ${parseInt(updateCount) + 1}`);
  policy = policy.replace(/마지막 업데이트: .*/, `마지막 업데이트: ${new Date().toISOString()}`);

  await writeText(CONFIG.META_FILES.POLICY, policy);
}

/**
 * 가중치 조정
 */
function adjustWeight(policyContent, category, keyword, delta) {
  const pattern = `\`${category}.${keyword}\`: `;
  const idx = policyContent.indexOf(pattern);
  
  if (idx >= 0) {
    // 기존 가중치 업데이트
    const numStart = idx + pattern.length;
    const numEnd = policyContent.indexOf('\n', numStart);
    const oldVal = parseFloat(policyContent.slice(numStart, numEnd));
    const newVal = Math.max(0.1, Math.min(3.0, oldVal + delta));
    return policyContent.slice(0, numStart) + newVal.toFixed(2) + policyContent.slice(numEnd);
  } else {
    // 새 가중치 추가
    const sectionMarker = '## 키워드 가중치';
    const sectionIdx = policyContent.indexOf(sectionMarker);
    if (sectionIdx >= 0) {
      const insertPoint = policyContent.indexOf('\n', sectionIdx) + 1;
      const newEntry = `- \`${category}.${keyword}\`: ${(1.0 + delta).toFixed(2)}\n`;
      return policyContent.slice(0, insertPoint) + newEntry + policyContent.slice(insertPoint);
    }
  }
  
  return policyContent;
}

/**
 * 액션 로그 기록
 */
async function logAction(entry) {
  const log = await readJSON(CONFIG.META_FILES.LOG, []);
  log.push(entry);
  // 최근 500개만 유지
  const trimmed = log.slice(-500);
  await writeJSON(CONFIG.META_FILES.LOG, trimmed);
}

/**
 * 피드백 메시지 생성
 */
function buildFeedbackMessage(type, docTitle) {
  const messages = {
    [FEEDBACK.PRAISE]:  `✨ 칭찬 기록: "${docTitle}" — 해당 분류 가중치 +15% 강화`,
    [FEEDBACK.CORRECT]: `🔧 수정 기록: "${docTitle}" — 경계 재설정 반영`,
    [FEEDBACK.MOVE]:    `📦 이동 기록: "${docTitle}" — 카테고리 경계선 재학습`,
    [FEEDBACK.IGNORE]:  `👍 암묵적 승인: "${docTitle}" — 미세 강화 반영`,
  };
  return messages[type] || `📝 피드백 기록: ${docTitle}`;
}

/**
 * 초기 Policy.md 생성
 */
export function generateInitialPolicy() {
  return `# P-Reinforce Policy (RL Weights)

> 이 파일은 P-Reinforce 에이전트의 분류 정책을 기록합니다.
> 사용자 피드백에 의해 자동으로 갱신되며, 수동 편집도 가능합니다.

## 시스템 상태
- 총 업데이트: 0
- 마지막 업데이트: ${new Date().toISOString()}
- 정책 버전: 1.0

## RL 가중치
| 가중치 | 값 | 설명 |
|---|---|---|
| w1 (분류 정확도) | ${CONFIG.RL_WEIGHTS.w1_categorization} | 키워드/의미론적 매칭 정확도 |
| w2 (그래프 연결도) | ${CONFIG.RL_WEIGHTS.w2_connectivity} | 지식 간 링크 밀도 |
| w3 (사용자 만족도) | ${CONFIG.RL_WEIGHTS.w3_satisfaction} | 피드백 기반 만족도 |

## 키워드 가중치
*(사용자 피드백에 따라 자동 갱신됩니다)*

## 피드백 히스토리
| 날짜 | 유형 | 문서 | 카테고리 변경 | 키워드 |
|---|---|---|---|---|
`;
}

/**
 * 전체 보상 점수 계산
 */
export async function computeTotalReward(categorizationScore, graphConnectivity) {
  const w = CONFIG.RL_WEIGHTS;
  
  // 사용자 만족도는 최근 피드백에서 계산
  const log = await readJSON(CONFIG.META_FILES.LOG, []);
  const recentFeedback = log.slice(-20);
  const satisfactionScore = recentFeedback.length > 0
    ? recentFeedback.reduce((sum, entry) => sum + calculateReward(entry.type), 0) / recentFeedback.length
    : 0.5; // 기본값

  const R = w.w1_categorization * categorizationScore
          + w.w2_connectivity * graphConnectivity
          + w.w3_satisfaction * Math.max(0, Math.min(1, (satisfactionScore + 1) / 2));

  return {
    total: Math.round(R * 1000) / 1000,
    breakdown: {
      categorization: categorizationScore,
      connectivity: graphConnectivity,
      satisfaction: satisfactionScore,
    },
  };
}

export default { recordFeedback, computeTotalReward, generateInitialPolicy, FEEDBACK };
