/**
 * P-Reinforce Conversation Exporter
 * Antigravity와의 대화에서 핵심 학습 내용을 자동으로 추출하여 
 * 00_Raw에 저장합니다.
 * 
 * 이 모듈은 Antigravity가 대화 종료 시 호출하거나,
 * 사용자가 "오늘 배운 거 정리해줘" 라고 요청할 때 사용됩니다.
 * 
 * Usage: npm run export:chat
 */

import fs from 'fs/promises';
import path from 'path';
import CONFIG from './config.js';
import { ensureDir, today, sanitizeFilename } from './utils.js';
import { processDocument } from './processor.js';

/**
 * 대화에서 추출한 학습 내용을 Raw에 저장 후 자동 처리
 * 
 * @param {object} params
 * @param {string} params.title - 학습 주제
 * @param {string} params.summary - 한줄 요약
 * @param {string[]} params.keyLearnings - 핵심 배운 점 목록
 * @param {string[]} params.decisions - 결정한 사항들
 * @param {string[]} params.skills - 새로 배운 스킬/패턴
 * @param {string[]} params.connections - 관련 기존 지식
 * @param {string} params.context - 대화 컨텍스트 (선택)
 * @param {string} params.conversationId - 대화 ID (선택)
 */
export async function exportConversation({
  title,
  summary = '',
  keyLearnings = [],
  decisions = [],
  skills = [],
  connections = [],
  context = '',
  conversationId = '',
}) {
  const dateStr = today();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // 마크다운 생성
  let content = `# ${title}\n\n`;
  content += `> 📅 ${dateStr} ${timeStr} | Antigravity 대화에서 자동 추출\n`;
  if (conversationId) {
    content += `> 🔗 Conversation: ${conversationId}\n`;
  }
  content += '\n';
  
  if (summary) {
    content += `## 💡 핵심 요약\n${summary}\n\n`;
  }
  
  if (keyLearnings.length > 0) {
    content += `## 📖 오늘 배운 것\n`;
    for (const item of keyLearnings) {
      content += `- ${item}\n`;
    }
    content += '\n';
  }
  
  if (decisions.length > 0) {
    content += `## ⚖️ 결정한 사항\n`;
    for (const item of decisions) {
      content += `- ${item}\n`;
    }
    content += '\n';
  }
  
  if (skills.length > 0) {
    content += `## 🚀 새로운 스킬/패턴\n`;
    for (const item of skills) {
      content += `- ${item}\n`;
    }
    content += '\n';
  }
  
  if (connections.length > 0) {
    content += `## 🔗 연관 지식\n`;
    for (const item of connections) {
      content += `- [[${item}]]\n`;
    }
    content += '\n';
  }
  
  if (context) {
    content += `## 📋 컨텍스트\n${context}\n\n`;
  }
  
  content += `---\n*Source: Antigravity Conversation Export*\n`;

  // 저장
  const fileName = `${dateStr}_chat_${sanitizeFilename(title)}.md`;
  const filePath = path.join(CONFIG.PATHS.RAW, fileName);
  
  await ensureDir(CONFIG.PATHS.RAW);
  await fs.writeFile(filePath, content, 'utf-8');
  
  console.log(`\n  📤 대화 내보내기: ${fileName}`);
  
  // 자동 처리
  const result = await processDocument(filePath);
  return result;
}

/**
 * 여러 학습 항목을 한번에 내보내기
 */
export async function batchExport(items) {
  const results = [];
  for (const item of items) {
    const result = await exportConversation(item);
    results.push(result);
  }
  return results;
}

// ── CLI 모드 ──
async function main() {
  const { createInterface } = await import('readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(r => rl.question(q, r));

  console.log(`\n  ${'━'.repeat(50)}`);
  console.log(`  📤 P-Reinforce 대화 내보내기`);
  console.log(`  ${'━'.repeat(50)}\n`);

  const title = await ask('  제목 (오늘 뭘 배웠나요?) > ');
  const summary = await ask('  한줄 요약 > ');
  
  console.log('  배운 점 입력 (빈 줄 입력 시 다음 단계):');
  const keyLearnings = [];
  while (true) {
    const item = await ask('    - ');
    if (!item.trim()) break;
    keyLearnings.push(item);
  }
  
  console.log('  결정한 사항 (빈 줄 입력 시 다음 단계):');
  const decisions = [];
  while (true) {
    const item = await ask('    - ');
    if (!item.trim()) break;
    decisions.push(item);
  }

  rl.close();
  
  await exportConversation({
    title,
    summary,
    keyLearnings,
    decisions,
  });
}

// CLI 직접 실행 시
if (process.argv[1]?.includes('chat-export')) {
  main().catch(console.error);
}
