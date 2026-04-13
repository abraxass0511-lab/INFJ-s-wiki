/**
 * P-Reinforce Notion Sync
 * Notion 데이터베이스/페이지에서 자동으로 지식을 가져옵니다.
 * 
 * Usage: npm run sync:notion
 */

import fs from 'fs/promises';
import path from 'path';
import CONFIG from './config.js';
import { ensureDir, today, sanitizeFilename } from './utils.js';
import { processDocument } from './processor.js';

/**
 * Notion 페이지 내용을 가져와서 00_Raw에 저장
 * 이 함수는 MCP notion-mcp-server를 통해 호출됩니다.
 */
export async function importFromNotion(pageId, pageTitle, blocks) {
  // Notion 블록을 마크다운으로 변환
  const markdown = blocksToMarkdown(blocks);
  
  const fileName = `${today()}_notion_${sanitizeFilename(pageTitle)}.md`;
  const filePath = path.join(CONFIG.PATHS.RAW, fileName);
  
  const content = `# ${pageTitle}\n\n> Source: Notion (${pageId})\n> Synced: ${new Date().toISOString()}\n\n${markdown}`;
  
  await ensureDir(CONFIG.PATHS.RAW);
  await fs.writeFile(filePath, content, 'utf-8');
  
  console.log(`  📓 Notion 페이지 가져오기: ${pageTitle}`);
  
  // 자동 처리
  const result = await processDocument(filePath);
  return result;
}

/**
 * Notion Block 배열을 마크다운으로 변환
 */
function blocksToMarkdown(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  
  return blocks.map(block => {
    const type = block.type;
    
    switch (type) {
      case 'paragraph':
        return richTextToMd(block.paragraph?.rich_text) + '\n';
      case 'heading_1':
        return `# ${richTextToMd(block.heading_1?.rich_text)}\n`;
      case 'heading_2':
        return `## ${richTextToMd(block.heading_2?.rich_text)}\n`;
      case 'heading_3':
        return `### ${richTextToMd(block.heading_3?.rich_text)}\n`;
      case 'bulleted_list_item':
        return `- ${richTextToMd(block.bulleted_list_item?.rich_text)}`;
      case 'numbered_list_item':
        return `1. ${richTextToMd(block.numbered_list_item?.rich_text)}`;
      case 'to_do':
        const checked = block.to_do?.checked ? 'x' : ' ';
        return `- [${checked}] ${richTextToMd(block.to_do?.rich_text)}`;
      case 'toggle':
        return `<details>\n<summary>${richTextToMd(block.toggle?.rich_text)}</summary>\n</details>\n`;
      case 'code':
        const lang = block.code?.language || '';
        return `\`\`\`${lang}\n${richTextToMd(block.code?.rich_text)}\n\`\`\`\n`;
      case 'quote':
        return `> ${richTextToMd(block.quote?.rich_text)}\n`;
      case 'callout':
        const icon = block.callout?.icon?.emoji || '💡';
        return `> ${icon} ${richTextToMd(block.callout?.rich_text)}\n`;
      case 'divider':
        return '---\n';
      case 'table_of_contents':
        return '<!-- TOC -->\n';
      default:
        return '';
    }
  }).join('\n');
}

/**
 * Notion Rich Text 배열을 마크다운 문자열로 변환
 */
function richTextToMd(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  
  return richTextArray.map(rt => {
    let text = rt.plain_text || '';
    const ann = rt.annotations || {};
    
    if (ann.bold) text = `**${text}**`;
    if (ann.italic) text = `*${text}*`;
    if (ann.strikethrough) text = `~~${text}~~`;
    if (ann.code) text = `\`${text}\``;
    if (rt.href) text = `[${text}](${rt.href})`;
    
    return text;
  }).join('');
}

// ── Main ──
async function main() {
  console.log(`\n  ${'━'.repeat(50)}`);
  console.log(`  📓 P-Reinforce Notion Sync`);
  console.log(`  ${'━'.repeat(50)}`);
  console.log(`\n  이 기능은 Antigravity의 Notion MCP를 통해 사용합니다.`);
  console.log(`  예시: "Notion에서 '학습 노트' 페이지를 가져와서 위키에 추가해줘"`);
  console.log(`\n  또는 직접 API로 호출:`);
  console.log(`    import { importFromNotion } from './notion-sync.js'`);
  console.log(`    await importFromNotion(pageId, title, blocks)\n`);
}

main();

export default { importFromNotion };
