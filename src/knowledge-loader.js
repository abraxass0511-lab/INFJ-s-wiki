/**
 * P-Reinforce Knowledge Loader
 * 
 * 지정 폴더(00_Raw, 10_Wiki)의 모든 마크다운 파일을 스캔하여
 * _shared/knowledge_base.md에 에이전트가 읽을 수 있는 형태로 로드합니다.
 * 
 * 에이전트는 이 파일을 통해 로컬 파일의 내용을 직접 검색/참조할 수 있습니다.
 * 
 * Usage:
 *   npm run kb:build              → 전체 지식 베이스 빌드
 *   npm run kb:watch              → 파일 변경 감시 + 자동 리빌드
 */

import fs from 'fs/promises';
import path from 'path';
import CONFIG from './config.js';
import { ensureDir, findMarkdownFiles, today } from './utils.js';

// ── 설정 ──
const SHARED_DIR = path.join(CONFIG.ROOT, '_shared');
const KB_OUTPUT = path.join(SHARED_DIR, 'knowledge_base.md');
const KB_INDEX = path.join(CONFIG.PATHS.META, 'KBIndex.json');

// 스캔 대상 폴더
const SCAN_FOLDERS = [
  { path: CONFIG.PATHS.RAW, label: '00_Raw' },
  { path: CONFIG.PATHS.WIKI, label: '10_Wiki' },
];

// 출력 제한 (Connect AI 컨텍스트 윈도우 고려)
const MAX_FILE_CONTENT = 1500;    // 파일당 최대 글자 수
const MAX_TOTAL_OUTPUT = 80000;   // 전체 출력 상한

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. 파일 스캔 및 파싱
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scanAllFiles() {
  const allFiles = [];

  for (const folder of SCAN_FOLDERS) {
    try {
      const mdFiles = await findMarkdownFiles(folder.path);

      for (const filePath of mdFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.trim().length < 10) continue; // 빈 파일 스킵

          const stat = await fs.stat(filePath);
          const relativePath = path.relative(CONFIG.ROOT, filePath);

          // 제목 추출: frontmatter title → 첫 # 헤더 → 파일명
          let title = path.basename(filePath, '.md').replace(/_/g, ' ');
          const fmTitleMatch = content.match(/title:\s*["']?(.+?)["']?\s*$/m);
          const h1Match = content.match(/^#\s+(.+)$/m);
          if (fmTitleMatch) title = fmTitleMatch[1].trim();
          else if (h1Match) title = h1Match[1].replace(/[#*_\[\]]/g, '').trim();

          // 키워드 추출 (빈도 상위)
          const keywords = extractKeywords(content);

          allFiles.push({
            path: filePath,
            relativePath,
            title,
            content,
            size: content.length,
            keywords,
            modified: stat.mtime.toISOString(),
            folder: folder.label,
          });
        } catch {
          // 읽기 실패 → 스킵
        }
      }
    } catch {
      console.log(`  ⚠️ ${folder.label} 폴더 접근 실패`);
    }
  }

  // 최신 파일 우선 정렬
  allFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  return allFiles;
}

function extractKeywords(content) {
  // 마크다운 문법, 특수문자 제거
  const cleaned = content
    .replace(/```[\s\S]*?```/g, '')       // 코드블록 제거
    .replace(/^---[\s\S]*?---/m, '')      // frontmatter 제거
    .replace(/[#\-*\[\](){}|`>_~!@$%^&=+\\/<>:;"',.?]/g, ' ')
    .replace(/https?:\/\/\S+/g, '')       // URL 제거
    .replace(/\d{4}-\d{2}-\d{2}/g, '');   // 날짜 제거

  const words = cleaned
    .split(/\s+/)
    .filter(w => w.length > 1)
    .map(w => w.toLowerCase());

  // 불용어 제거
  const stopWords = new Set([
    'the', 'is', 'at', 'of', 'and', 'or', 'to', 'in', 'for', 'on', 'with',
    'by', 'an', 'as', 'it', 'be', 'was', 'are', 'has', 'had', 'have', 'from',
    'this', 'that', 'not', 'but', 'all', 'can', 'will', 'do', 'if', 'my',
    '이', '그', '저', '및', '등', '를', '을', '의', '에', '는', '가', '도',
    '로', '으로', '에서', '와', '과', '한', '된', '있', '없', '수', '것',
    '하', '되', '위', '대', '중', '후', '전', '더', '내', '외',
  ]);

  const wordFreq = {};
  for (const w of words) {
    if (stopWords.has(w)) continue;
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  }

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. 지식 베이스 문서 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildKnowledgeBase(files) {
  const lines = [];

  lines.push(`# 📚 지식 베이스 (Knowledge Base)`);
  lines.push(``);
  lines.push(`> 이 파일은 자동 생성됩니다. 직접 수정하지 마세요.`);
  lines.push(`> 🔄 마지막 빌드: ${new Date().toLocaleString('ko-KR')}`);
  lines.push(`> 📄 총 문서: ${files.length}개`);
  lines.push(``);
  lines.push(`## ⚡ 사용 지침`);
  lines.push(`- 사용자 질문에 답하기 전 이 문서를 반드시 검색하세요.`);
  lines.push(`- 파일 경로가 언급되면 해당 문서 내용을 이 파일에서 찾으세요.`);
  lines.push(`- "파일을 읽을 수 없습니다"라고 답하지 마세요. 여기에 내용이 있습니다.`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  let totalLen = lines.join('\n').length;

  // 폴더별 그룹핑
  const grouped = {};
  for (const file of files) {
    if (!grouped[file.folder]) grouped[file.folder] = [];
    grouped[file.folder].push(file);
  }

  for (const [folder, folderFiles] of Object.entries(grouped)) {
    lines.push(`## 📁 ${folder} (${folderFiles.length}개 문서)`);
    lines.push(``);

    for (const file of folderFiles) {
      if (totalLen > MAX_TOTAL_OUTPUT) {
        lines.push(`> ⚠️ 출력 한도 도달. 나머지 문서 생략. \`npm run kb:build\`로 리빌드하세요.`);
        break;
      }

      // 본문 내용 (frontmatter 제거)
      let body = file.content
        .replace(/^---[\s\S]*?---\s*/m, '')  // frontmatter 제거
        .trim();

      // 길이 제한
      const truncated = body.length > MAX_FILE_CONTENT;
      if (truncated) {
        body = body.slice(0, MAX_FILE_CONTENT);
        // 마지막 완전한 줄에서 자르기
        const lastNewline = body.lastIndexOf('\n');
        if (lastNewline > MAX_FILE_CONTENT * 0.5) {
          body = body.slice(0, lastNewline);
        }
      }

      const section = [
        `### 📄 ${file.title}`,
        `> 📂 경로: \`${file.relativePath}\``,
        `> 📅 수정: ${file.modified.split('T')[0]} | 📏 ${file.size}자`,
        `> 🏷️ 키워드: ${file.keywords.join(', ')}`,
        ``,
        body,
        truncated ? `\n> *(전체 ${file.size}자 중 ${MAX_FILE_CONTENT}자 표시)*` : '',
        ``,
        `---`,
        ``,
      ].join('\n');

      lines.push(section);
      totalLen += section.length;
    }
  }

  lines.push(`\n> 📊 총 출력: ${(totalLen / 1024).toFixed(1)}KB`);

  return lines.join('\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. 인덱스 저장 (빠른 조회용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function saveIndex(files) {
  const index = files.map(f => ({
    path: f.relativePath,
    title: f.title,
    keywords: f.keywords,
    size: f.size,
    modified: f.modified,
    folder: f.folder,
  }));

  await ensureDir(CONFIG.PATHS.META);
  await fs.writeFile(KB_INDEX, JSON.stringify(index, null, 2), 'utf-8');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. 빌드 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function build() {
  console.log(`\n${'━'.repeat(55)}`);
  console.log(`  📚 P-Reinforce Knowledge Loader`);
  console.log(`${'━'.repeat(55)}\n`);

  // 스캔
  console.log('  🔎 폴더 스캔 중...');
  const files = await scanAllFiles();
  console.log(`  → ${files.length}개 마크다운 파일 발견\n`);

  if (files.length === 0) {
    console.log('  ⚠️ 스캔된 파일이 없습니다.');
    return { fileCount: 0, outputSize: 0 };
  }

  // 빌드
  console.log('  📦 지식 베이스 생성 중...');
  const output = buildKnowledgeBase(files);

  // 저장
  await ensureDir(SHARED_DIR);
  await fs.writeFile(KB_OUTPUT, output, 'utf-8');
  await saveIndex(files);

  const sizeKB = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);

  console.log(`  ✅ 지식 베이스 저장 완료`);
  console.log(`     📄 _shared/knowledge_base.md (${sizeKB}KB)`);
  console.log(`     📊 인덱스: 20_Meta/KBIndex.json`);
  console.log(`     📁 문서 수: ${files.length}개`);

  // 파일 목록 출력
  console.log(`\n  ── 포함된 문서 ──`);
  for (const file of files) {
    console.log(`     📄 [${file.folder}] ${file.title}`);
  }

  console.log(`\n${'━'.repeat(55)}\n`);

  return { fileCount: files.length, outputSize: output.length };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  5. Watch 모드 (파일 변경 시 자동 리빌드)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function watch() {
  const chokidar = await import('chokidar');

  console.log(`\n${'━'.repeat(55)}`);
  console.log(`  👁️ Knowledge Loader Watch 모드`);
  console.log(`${'━'.repeat(55)}\n`);

  // 초기 빌드
  await build();

  // 감시 대상
  const watchPaths = SCAN_FOLDERS.map(f => 
    path.join(f.path, '**/*.md').replace(/\\/g, '/')
  );

  console.log('  👁️ 파일 변경 감시 중... (Ctrl+C로 중단)\n');

  let debounceTimer = null;

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 1000 },
  });

  watcher.on('all', (event, filePath) => {
    console.log(`  📡 [${event}] ${path.relative(CONFIG.ROOT, filePath)}`);

    // 디바운스: 연속 변경 시 마지막 변경 후 2초 대기
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log('  🔄 지식 베이스 자동 리빌드...');
      await build();
    }, 2000);
  });
}

// ── CLI ──
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--watch') || args.includes('-w')) {
    await watch();
  } else {
    await build();
  }
}

export { build, scanAllFiles, buildKnowledgeBase };

main().catch(err => {
  console.error('Knowledge Loader 에러:', err);
  process.exit(1);
});
