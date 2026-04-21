/**
 * P-Reinforce Classifier Engine
 * RL 기반 한국어/영어 컨텐츠 자동 분류 엔진
 * 
 * 키워드 빈도 분석 + TF-IDF 유사 가중치 + Policy.md 피드백을 결합하여
 * 문서를 최적 카테고리(Projects/Topics/Decisions/Skills)에 배치합니다.
 */

import path from 'path';
import CONFIG from './config.js';
import { readJSON, readText, textSimilarity, findMarkdownFiles, parseFrontmatter } from './utils.js';

/**
 * 메인 분류 함수
 * @param {string} title - 문서 제목
 * @param {string} content - 문서 내용
 * @returns {{ category: string, subcategory: string|null, confidence: number, reasoning: string }}
 */
export async function classify(title, content) {
  const fullText = `${title} ${content}`.toLowerCase();
  
  // 1. 정책 가중치 로드
  const policyWeights = await loadPolicyWeights();
  
  // 2. 키워드 기반 점수 계산
  const scores = {};
  for (const [cat, keywords] of Object.entries(CONFIG.KEYWORD_MAP)) {
    let score = 0;
    let matchedKeywords = [];
    
    for (const keyword of keywords) {
      const regex = new RegExp(escapeRegex(keyword), 'gi');
      const matches = fullText.match(regex);
      if (matches) {
        const count = matches.length;
        // TF-like: 빈도에 따른 점수 (log 스케일로 감쇠)
        const tfScore = Math.log2(1 + count);
        // 정책 보너스/페널티
        const policyMod = policyWeights[cat]?.[keyword] || 1.0;
        score += tfScore * policyMod;
        matchedKeywords.push({ keyword, count, adjusted: tfScore * policyMod });
      }
    }
    
    scores[cat] = { score, matchedKeywords };
  }

  // 3. 기존 문서들과의 유사도 분석
  const contextScores = await contextAnalysis(fullText);
  
  // 4. 점수 합산 (키워드 70% + 컨텍스트 30%)
  const finalScores = {};
  for (const cat of Object.keys(CONFIG.KEYWORD_MAP)) {
    const keywordScore = scores[cat].score;
    const contextScore = contextScores[cat] || 0;
    finalScores[cat] = keywordScore * 0.7 + contextScore * 0.3;
  }
  
  // 5. 최고 점수 카테고리 선택
  const sorted = Object.entries(finalScores)
    .sort(([, a], [, b]) => b - a);
  
  const [bestCat, bestScore] = sorted[0];
  const totalScore = sorted.reduce((sum, [, s]) => sum + s, 0);
  
  // 6. 신뢰도 계산 (상대적 점수 비율)
  const confidence = totalScore > 0 
    ? Math.min(1.0, bestScore / totalScore) 
    : 0.3; // 매칭 키워드가 없으면 0.3 기본값

  // 7. 서브카테고리 추출 (제목 기반)
  const subcategory = await inferSubcategory(bestCat, title, content);

  return {
    category: bestCat,
    categoryName: CONFIG.CATEGORIES[bestCat].name,
    subcategory,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: buildReasoning(scores, bestCat, confidence),
    scores: finalScores,
    matchedKeywords: scores[bestCat].matchedKeywords,
  };
}

/**
 * Policy.md에서 사용자 피드백 기반 가중치 로드
 */
async function loadPolicyWeights() {
  const policyPath = CONFIG.META_FILES.POLICY;
  const content = await readText(policyPath);
  
  const weights = {};
  // Policy.md에서 가중치 섹션 파싱
  const weightSection = content.match(/## 키워드 가중치\n([\s\S]*?)(?=\n##|\n$|$)/);
  if (weightSection) {
    const lines = weightSection[1].split('\n').filter(l => l.startsWith('- '));
    for (const line of lines) {
      const match = line.match(/- `(\w+)\.(\S+)`: ([\d.]+)/);
      if (match) {
        const [, cat, keyword, weight] = match;
        if (!weights[cat]) weights[cat] = {};
        weights[cat][keyword] = parseFloat(weight);
      }
    }
  }
  
  return weights;
}

/**
 * 기존 Wiki 문서들과의 컨텍스트 유사도 분석
 */
async function contextAnalysis(fullText) {
  const scores = {};
  
  for (const [key, catInfo] of Object.entries(CONFIG.CATEGORIES)) {
    const catPath = CONFIG.PATHS[key];
    const files = await findMarkdownFiles(catPath);
    
    if (files.length === 0) {
      scores[key] = 0;
      continue;
    }
    
    let totalSim = 0;
    let count = 0;
    
    // 최근 10개 파일만 비교 (성능)
    const recent = files.slice(-10);
    for (const f of recent) {
      try {
        const content = await readText(f);
        const { content: body } = parseFrontmatter(content);
        const sim = textSimilarity(fullText, body);
        totalSim += sim;
        count++;
      } catch {
        // skip
      }
    }
    
    scores[key] = count > 0 ? (totalSim / count) * 10 : 0; // 스케일 조정
  }
  
  return scores;
}

/**
 * 서브카테고리 추론 (기존 폴더 기반)
 */
async function inferSubcategory(category, title, content) {
  const catPath = CONFIG.PATHS[category];
  const fullText = `${title} ${content}`.toLowerCase();
  
  try {
    const entries = await (await import('fs')).promises.readdir(catPath, { withFileTypes: true });
    const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    
    if (subdirs.length === 0) return null;
    
    // 기존 하위 폴더와의 유사도 비교
    let bestMatch = null;
    let bestScore = 0;
    
    for (const sub of subdirs) {
      const subClean = sub.replace(/[🛠️💡⚖️🚀]/g, '').trim().toLowerCase();
      const sim = textSimilarity(fullText, subClean);
      if (sim > bestScore && sim > 0.15) {
        bestScore = sim;
        bestMatch = sub;
      }
    }
    
    return bestMatch;
  } catch {
    return null;
  }
}

/**
 * 분류 근거 텍스트 생성
 */
function buildReasoning(scores, bestCat, confidence) {
  const matched = scores[bestCat].matchedKeywords;
  const topKeywords = matched
    .sort((a, b) => b.adjusted - a.adjusted)
    .slice(0, 5)
    .map(k => `\`${k.keyword}\`(${k.count}회)`)
    .join(', ');
  
  const catName = CONFIG.CATEGORIES[bestCat].name;
  
  if (confidence >= 0.85) {
    return `높은 확신(${confidence}): ${catName}에 명확히 부합. 핵심 키워드: ${topKeywords || '컨텍스트 유사도 기반'}`;
  } else if (confidence >= 0.50) {
    return `보통 확신(${confidence}): ${catName}에 배치. 매칭 키워드: ${topKeywords || '컨텍스트 유사도 기반'}, 추후 사용자 피드백 필요`;
  } else {
    return `낮은 확신(${confidence}): ${catName}에 임시 배치. 매칭 근거 부족. 사용자 리뷰 권장.`;
  }
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { classify };
