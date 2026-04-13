/**
 * P-Reinforce Template Generator
 * Karpathy 영속적 위키 템플릿에 맞춰 마크다운 문서를 합성합니다.
 */

import { v4 as uuidv4 } from 'uuid';
import { today } from './utils.js';

/**
 * Wiki 문서 생성
 * @param {object} params - 문서 생성 파라미터
 * @returns {string} 완성된 마크다운 문서
 */
export function generateWikiDoc({
  title,
  categoryPath,
  confidence,
  tags = [],
  summary = '',
  patterns = [],
  details = [],
  contradictions = [],
  parentCategory = null,
  relatedDocs = [],
  rawSource = null,
}) {
  const id = uuidv4();
  const dateStr = today();

  // Frontmatter
  const frontmatter = [
    '---',
    `id: "${id}"`,
    `category: "[[${categoryPath}]]"`,
    `confidence_score: ${confidence}`,
    `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
    `last_reinforced: ${dateStr}`,
    `github_commit: "pending"`,
    '---',
  ].join('\n');

  // H1 제목
  const titleSection = `\n# [[${title}]]`;

  // 한 줄 통찰
  const karpathySummary = `\n## 📌 한 줄 통찰 (The Karpathy Summary)\n> ${summary || '이 지식의 핵심을 정리 중...'}`;

  // 구조화된 지식
  const synthesized = buildSynthesizedContent(patterns, details);

  // 모순 및 업데이트
  const contradictionSection = buildContradictions(contradictions);

  // 지식 연결
  const graphSection = buildGraphSection(parentCategory, relatedDocs, rawSource);

  return [
    frontmatter,
    titleSection,
    karpathySummary,
    synthesized,
    contradictionSection,
    graphSection,
  ].join('\n\n');
}

/**
 * 원본 텍스트에서 자동으로 Wiki 문서 합성
 */
export function synthesizeFromRaw(rawTitle, rawContent, classification) {
  // 내용에서 패턴과 세부사항 추출
  const lines = rawContent.split('\n').filter(l => l.trim());
  
  // 불렛포인트 추출
  const bullets = lines.filter(l => /^[-*•]\s/.test(l.trim()));
  const paragraphs = lines.filter(l => !l.startsWith('#') && !/^[-*•]\s/.test(l.trim()) && l.trim().length > 10);
  
  // 패턴 추출 (반복되는 키워드 기반)
  const patterns = extractPatterns(rawContent);
  
  // 태그 추출
  const tags = extractTags(rawTitle, rawContent, classification);
  
  // 요약 생성
  const summary = generateSummary(rawTitle, paragraphs);

  return generateWikiDoc({
    title: rawTitle,
    categoryPath: `10_Wiki/${classification.categoryName}`,
    confidence: classification.confidence,
    tags,
    summary,
    patterns,
    details: bullets.length > 0 ? bullets : paragraphs.slice(0, 5),
    contradictions: [],
    parentCategory: classification.categoryName,
    relatedDocs: classification.matchedKeywords?.map(k => k.keyword) || [],
    rawSource: `00_Raw/${today()}/${rawTitle}`,
  });
}

// ── Private helpers ──

function buildSynthesizedContent(patterns, details) {
  let section = '\n## 📖 구조화된 지식 (Synthesized Content)';
  
  if (patterns.length > 0) {
    section += '\n### 추출된 패턴';
    for (const p of patterns) {
      section += `\n- **${p}**`;
    }
  }
  
  if (details.length > 0) {
    section += '\n### 세부 내용';
    for (const d of details) {
      const clean = d.replace(/^[-*•]\s*/, '').trim();
      section += `\n- ${clean}`;
    }
  }
  
  if (patterns.length === 0 && details.length === 0) {
    section += '\n- *(원본 데이터에서 구조화 대기중)*';
  }
  
  return section;
}

function buildContradictions(contradictions) {
  let section = '\n## ⚠️ 모순 및 업데이트 (Contradictions & RL Update)';
  
  if (contradictions.length > 0) {
    for (const c of contradictions) {
      section += `\n- **과거 데이터와의 충돌:** ${c}`;
    }
  } else {
    section += '\n- 현재 충돌 없음. 최초 분류 시점.';
    section += '\n- **정책 변화:** 이 문서의 분류를 통해 해당 카테고리의 가중치가 미세 조정됨.';
  }
  
  return section;
}

function buildGraphSection(parent, related, rawSource) {
  let section = '\n## 🔗 지식 연결 (Graph)';
  
  section += `\n- **Parent:** ${parent ? `[[${parent}]]` : '[[미분류]]'}`;
  
  if (related.length > 0) {
    const relatedLinks = related.slice(0, 5).map(r => `[[${r}]]`).join(', ');
    section += `\n- **Related:** ${relatedLinks}`;
  } else {
    section += '\n- **Related:** *(자동 탐색 중...)*';
  }
  
  if (rawSource) {
    section += `\n- **Raw Source:** [[${rawSource}]]`;
  }
  
  return section;
}

function extractPatterns(content) {
  const patterns = [];
  const lines = content.split('\n');
  
  // 헤더 기반 패턴
  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headerMatch) {
      patterns.push(headerMatch[1].trim());
    }
  }
  
  // 강조(**bold**) 텍스트 추출
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;
  while ((match = boldRegex.exec(content)) !== null) {
    if (!patterns.includes(match[1])) {
      patterns.push(match[1]);
    }
  }
  
  return patterns.slice(0, 8); // 최대 8개
}

function extractTags(title, content, classification) {
  const tags = new Set();
  
  // 분류 카테고리 태그
  const catKey = classification.category.toLowerCase();
  tags.add(catKey);
  
  // 매칭된 키워드에서 태그
  if (classification.matchedKeywords) {
    for (const kw of classification.matchedKeywords.slice(0, 3)) {
      tags.add(kw.keyword.toLowerCase());
    }
  }
  
  // 해시태그 추출
  const hashtagRegex = /#(\w+)/g;
  let m;
  while ((m = hashtagRegex.exec(content)) !== null) {
    tags.add(m[1].toLowerCase());
  }
  
  // 제목에서 핵심 단어 (2글자 이상)
  const titleWords = title.split(/[\s_-]+/).filter(w => w.length >= 2);
  for (const w of titleWords.slice(0, 3)) {
    tags.add(w.toLowerCase());
  }
  
  return [...tags].slice(0, 8);
}

function generateSummary(title, paragraphs) {
  if (paragraphs.length > 0) {
    // 첫 문단을 축약
    const first = paragraphs[0].trim();
    return first.length > 100 ? first.slice(0, 97) + '...' : first;
  }
  return `${title}에 대한 지식을 구조화한 문서.`;
}

export default { generateWikiDoc, synthesizeFromRaw };
