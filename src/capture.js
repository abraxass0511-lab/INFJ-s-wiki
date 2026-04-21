/**
 * P-Reinforce Quick Capture
 * 다양한 방식으로 지식을 00_Raw에 빠르게 투입합니다.
 *
 * Usage:
 *   npm run capture "오늘 배운 것: React Server Components는..."
 *   npm run capture                    → 대화형 메모 입력
 *   npm run capture:clip               → 클립보드 내용 캡처
 *   npm run capture:web <URL>          → 웹 페이지 스크랩
 */

import fs from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';
import CONFIG from './config.js';
import { ensureDir, today, sanitizeFilename } from './utils.js';
import { processDocument } from './processor.js';

const execAsync = promisify(exec);

// ── 날짜+시간 기반 고유 파일명 생성 ──
function generateFilename(hint = 'memo') {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const cleanHint = sanitizeFilename(hint).slice(0, 40);
  return `${today()}_${time}_${cleanHint}.md`;
}

// ── 1. 인라인 캡처: npm run capture "내용" ──
async function inlineCapture(text) {
  const firstLine = text.split('\n')[0].slice(0, 50).replace(/[#\-*]/g, '').trim();
  const title = firstLine || 'quick_memo';
  const fileName = generateFilename(title);
  const filePath = path.join(CONFIG.PATHS.RAW, fileName);

  const content = `# ${title}\n\n${text}\n\n---\n*Captured: ${new Date().toISOString()}*\n`;
  
  await ensureDir(CONFIG.PATHS.RAW);
  await fs.writeFile(filePath, content, 'utf-8');
  
  console.log(`\n  ✅ 캡처 완료: ${fileName}`);
  return filePath;
}

// ── 2. 대화형 캡처: 여러 줄 입력 ──
async function interactiveCapture() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(r => rl.question(q, r));

  console.log(`\n  ${'━'.repeat(50)}`);
  console.log(`  📝 P-Reinforce Quick Capture`);
  console.log(`  ${'━'.repeat(50)}`);
  console.log(`  여러 줄 입력 가능. 빈 줄 2번 입력하면 저장.\n`);

  const title = await ask('  제목 > ');
  console.log('  내용 (빈 줄 2번 = 종료):');
  
  const lines = [];
  let emptyCount = 0;
  
  const lineReader = createInterface({ input: process.stdin, output: process.stdout });
  
  return new Promise((resolve) => {
    const collectLines = async () => {
      lineReader.on('line', async (line) => {
        if (line.trim() === '') {
          emptyCount++;
          if (emptyCount >= 2) {
            lineReader.close();
            rl.close();

            const content = lines.join('\n');
            if (!content.trim()) {
              console.log('  ⚠️ 내용이 비어있습니다.');
              resolve(null);
              return;
            }

            const filePath = await inlineCapture(`${title}\n\n${content}`);
            
            // 즉시 처리 여부 확인
            const rl2 = createInterface({ input: process.stdin, output: process.stdout });
            rl2.question('\n  즉시 처리할까요? (y/N) > ', async (answer) => {
              rl2.close();
              if (answer.toLowerCase() === 'y') {
                await processDocument(filePath);
              } else {
                console.log('  📥 00_Raw에 저장됨. `npm run process`로 나중에 처리 가능.\n');
              }
              resolve(filePath);
            });
            return;
          }
          lines.push('');
        } else {
          emptyCount = 0;
          lines.push(line);
        }
      });
    };
    collectLines();
  });
}

// ── 3. 클립보드 캡처 ──
async function clipboardCapture() {
  try {
    // Windows: PowerShell의 Get-Clipboard 사용
    const { stdout } = await execAsync('powershell -command "Get-Clipboard"', { encoding: 'utf-8' });
    const text = stdout.trim();
    
    if (!text) {
      console.log('  ⚠️ 클립보드가 비어있습니다.');
      return null;
    }
    
    console.log(`  📋 클립보드 내용 (${text.length}자):`);
    console.log(`  ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`);
    
    const filePath = await inlineCapture(text);
    
    // 즉시 처리
    console.log('  🧠 자동 분류 시작...');
    await processDocument(filePath);
    
    return filePath;
  } catch (err) {
    console.error('  ❌ 클립보드 접근 실패:', err.message);
    return null;
  }
}

// ── 4. 웹 페이지 스크랩 ──
async function webCapture(url) {
  try {
    console.log(`  🌐 웹 페이지 로딩: ${url}`);
    
    // Node.js native fetch (18+)
    const res = await fetch(url);
    const html = await res.text();
    
    // 간단한 HTML → 텍스트 변환
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // 제목 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
    
    const content = `# ${pageTitle}\n\n> Source: ${url}\n> Captured: ${new Date().toISOString()}\n\n${text.slice(0, 5000)}`;
    
    const filePath = await inlineCapture(content);
    console.log(`  🧠 자동 분류 시작...`);
    await processDocument(filePath);
    
    return filePath;
  } catch (err) {
    console.error('  ❌ 웹 스크랩 실패:', err.message);
    return null;
  }
}

// ── 5. 파일 가져오기 (드래그앤드롭 대응) ──
async function fileImport(sourcePath) {
  try {
    const content = await fs.readFile(sourcePath, 'utf-8');
    const fileName = path.basename(sourcePath);
    const targetPath = path.join(CONFIG.PATHS.RAW, fileName);
    
    await ensureDir(CONFIG.PATHS.RAW);
    await fs.copyFile(sourcePath, targetPath);
    
    console.log(`  📁 파일 가져오기: ${fileName}`);
    console.log('  🧠 자동 분류 시작...');
    await processDocument(targetPath);
    
    return targetPath;
  } catch (err) {
    console.error('  ❌ 파일 가져오기 실패:', err.message);
    return null;
  }
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  
  if (mode === '--clip' || mode === '-c') {
    // 클립보드 모드
    await clipboardCapture();
  } else if (mode === '--web' || mode === '-w') {
    // 웹 스크랩 모드
    const url = args[1];
    if (!url) {
      console.log('  사용법: npm run capture:web <URL>');
      process.exit(1);
    }
    await webCapture(url);
  } else if (mode === '--file' || mode === '-f') {
    // 파일 가져오기 모드
    const filePath = args[1];
    if (!filePath) {
      console.log('  사용법: npm run capture:file <파일경로>');
      process.exit(1);
    }
    await fileImport(filePath);
  } else if (mode && !mode.startsWith('-')) {
    // 인라인 텍스트 캡처
    const text = args.join(' ');
    const filePath = await inlineCapture(text);
    console.log('  🧠 자동 분류 시작...');
    await processDocument(filePath);
  } else {
    // 대화형 모드
    await interactiveCapture();
  }
}

export { inlineCapture, clipboardCapture, webCapture, fileImport };

main().catch(err => {
  console.error('Capture 에러:', err);
  process.exit(1);
});
