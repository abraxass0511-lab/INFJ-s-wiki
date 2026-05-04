/**
 * P-Reinforce Knowledge Loader v2
 * 
 * _system.md에 지식 베이스를 직접 주입합니다.
 * Connect AI가 확실히 읽는 _system.md 안에 지식을 넣어야 에이전트가 접근 가능합니다.
 * 
 * 전략:
 *   1. 00_Raw, 10_Wiki의 모든 마크다운 파일을 스캔
 *   2. 파일별 제목 + 경로 + 키워드 + 핵심 내용(앞 300자) 추출
 *   3. _system.md의 <!-- KB:START --> ~ <!-- KB:END --> 사이에 주입
 *   4. 총 크기를 15KB 이내로 유지 (로컬 LLM 컨텍스트 안전)
 * 
 * Usage:
 *   npm run kb:build   → 빌드 후 _system.md에 주입
 *   npm run kb:watch   → 파일 변경 감시 + 자동 주입
 */

import fs from 'fs/promises';
import path from 'path';
import CONFIG from './config.js';
import { ensureDir, findMarkdownFiles } from './utils.js';

// ── 설정 ──
const SYSTEM_MD = path.join(CONFIG.ROOT, '_shared', '_system.md');
const KB_INDEX = path.join(CONFIG.PATHS.META, 'KBIndex.json');
const KB_MARKER_START = '<!-- KB:START -->';
const KB_MARKER_END = '<!-- KB:END -->';

const SCAN_FOLDERS = [
  { path: CONFIG.PATHS.RAW, label: '00_Raw' },
  { path: CONFIG.PATHS.WIKI, label: '10_Wiki' },
];

// 크기 제한
const MAX_CONTENT_PER_FILE = 150;       // 색인 파일당 요약 최대 글자
const MAX_FULL_CONTENT_FILES = 5;       // 전체 내용 포함 파일 수 (최신 우선)
const MAX_FULL_CONTENT_CHARS = 500;     // 전체 내용 파일당 최대 글자
const MAX_TOTAL_KB_SIZE = 10000;        // 지식 섹션 총 크기 (10KB)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. 파일 스캔
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scanAllFiles() {
  const allFiles = [];

  for (const folder of SCAN_FOLDERS) {
    try {
      const mdFiles = await findMarkdownFiles(folder.path);

      for (const filePath of mdFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.trim().length < 10) continue;

          const stat = await fs.stat(filePath);
          const relativePath = path.relative(CONFIG.ROOT, filePath);

          // 제목 추출
          let title = path.basename(filePath, '.md').replace(/_/g, ' ');
          const h1Match = content.match(/^#\s+(.+)$/m);
          if (h1Match) title = h1Match[1].replace(/[#*_\[\]]/g, '').trim();

          // 본문 (frontmatter 제거)
          const body = content.replace(/^---[\s\S]*?---\s*/m, '').trim();

          // 키워드 추출
          const keywords = extractKeywords(body);

          allFiles.push({
            path: filePath,
            relativePath,
            title,
            body,
            size: content.length,
            keywords,
            modified: stat.mtime,
            folder: folder.label,
          });
        } catch { /* 읽기 실패 → 스킵 */ }
      }
    } catch {
      console.log(`  ⚠️ ${folder.label} 폴더 접근 실패`);
    }
  }

  // 최신 파일 우선
  allFiles.sort((a, b) => b.modified - a.modified);
  return allFiles;
}

function extractKeywords(text) {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#\-*\[\](){}|`>_~!@$%^&=+\\/<>:;"',.?]/g, ' ')
    .replace(/https?:\/\/\S+/g, '');

  const words = cleaned.split(/\s+/).filter(w => w.length > 1).map(w => w.toLowerCase());

  const stopWords = new Set([
    'the', 'is', 'at', 'of', 'and', 'or', 'to', 'in', 'for', 'on', 'with',
    'by', 'an', 'as', 'it', 'be', 'was', 'are', 'has', 'had', 'have', 'from',
    'this', 'that', 'not', 'but', 'all', 'can', 'will', 'do', 'if', 'my',
    '이', '그', '저', '및', '등', '를', '을', '의', '에', '는', '가', '도',
    '로', '으로', '에서', '와', '과', '한', '된', '있', '없', '수', '것',
    '하', '되', '위', '대', '중', '후', '전', '더', '내', '외',
  ]);

  const freq = {};
  for (const w of words) {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. 지식 블록 생성 (_system.md 주입용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildKnowledgeBlock(files) {
  const lines = [];
  let totalLen = 0;

  lines.push('');
  lines.push('## 📚 에이전트 지식 베이스');
  lines.push('');
  lines.push(`> 자동 생성됨 (${new Date().toLocaleString('ko-KR')}) | 총 ${files.length}개 문서`);
  lines.push('> **사용자가 파일 내용을 물으면 아래에서 검색하여 답하세요.**');
  lines.push('> **"파일을 읽을 수 없습니다"라고 답하지 마세요.**');
  lines.push('');

  totalLen = lines.join('\n').length;

  // ── 최신 파일: 전체 내용 포함 (상위 N개) ──
  const fullContentFiles = files.slice(0, MAX_FULL_CONTENT_FILES);
  const summaryFiles = files.slice(MAX_FULL_CONTENT_FILES);

  if (fullContentFiles.length > 0) {
    lines.push('### 📄 주요 문서 (전체 내용)');
    lines.push('');

    for (const f of fullContentFiles) {
      if (totalLen > MAX_TOTAL_KB_SIZE) break;

      let content = f.body;
      if (content.length > MAX_FULL_CONTENT_CHARS) {
        content = content.slice(0, MAX_FULL_CONTENT_CHARS);
        const lastNl = content.lastIndexOf('\n');
        if (lastNl > MAX_FULL_CONTENT_CHARS * 0.5) content = content.slice(0, lastNl);
        content += '\n(...생략)';
      }

      const block = [
        `**${f.title}** \`${f.relativePath}\``,
        `키워드: ${f.keywords.join(', ')}`,
        '',
        content,
        '',
        '---',
        '',
      ].join('\n');

      lines.push(block);
      totalLen += block.length;
    }
  }

  // ── 나머지 파일: 요약만 ──
  if (summaryFiles.length > 0) {
    lines.push('### 📋 기타 문서 색인');
    lines.push('');

    for (const f of summaryFiles) {
      if (totalLen > MAX_TOTAL_KB_SIZE) {
        lines.push(`> ⚠️ 크기 제한으로 ${files.length - fullContentFiles.length}개 중 일부만 표시`);
        break;
      }

      // 핵심 첫 줄 추출 (# 헤더 제외, 실제 내용의 첫 줄)
      const firstLine = f.body
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('---'))
        .slice(0, 1)
        .join('')
        .slice(0, MAX_CONTENT_PER_FILE);

      const entry = `- **${f.title}** (\`${f.folder}\`) — ${f.keywords.slice(0, 5).join(', ')}${firstLine ? ' | ' + firstLine : ''}\n`;
      lines.push(entry);
      totalLen += entry.length;
    }
  }

  return lines.join('\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. _system.md에 주입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function injectIntoSystemMd(knowledgeBlock) {
  let systemMd = await fs.readFile(SYSTEM_MD, 'utf-8');

  const startIdx = systemMd.indexOf(KB_MARKER_START);
  const endIdx = systemMd.indexOf(KB_MARKER_END);

  const injection = `${KB_MARKER_START}\n${knowledgeBlock}\n${KB_MARKER_END}`;

  if (startIdx !== -1 && endIdx !== -1) {
    // 기존 블록 교체
    systemMd = systemMd.slice(0, startIdx) + injection + systemMd.slice(endIdx + KB_MARKER_END.length);
  } else {
    // 처음 주입: 파일 끝에 추가
    systemMd = systemMd.trimEnd() + '\n\n' + injection + '\n';
  }

  await fs.writeFile(SYSTEM_MD, systemMd, 'utf-8');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. 인덱스 저장
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function saveIndex(files) {
  const index = files.map(f => ({
    path: f.relativePath,
    title: f.title,
    keywords: f.keywords,
    size: f.size,
    modified: f.modified.toISOString(),
    folder: f.folder,
  }));

  await ensureDir(CONFIG.PATHS.META);
  await fs.writeFile(KB_INDEX, JSON.stringify(index, null, 2), 'utf-8');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  5. 빌드 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function build() {
  console.log(`\n${'━'.repeat(55)}`);
  console.log(`  📚 Knowledge Loader v2 → _system.md 직접 주입`);
  console.log(`${'━'.repeat(55)}\n`);

  // 스캔
  console.log('  🔎 폴더 스캔 중...');
  const files = await scanAllFiles();
  console.log(`  → ${files.length}개 마크다운 파일 발견\n`);

  if (files.length === 0) {
    console.log('  ⚠️ 스캔된 파일이 없습니다.');
    return;
  }

  // 지식 블록 생성
  console.log('  📦 지식 블록 생성 중...');
  const block = buildKnowledgeBlock(files);

  // _system.md에 주입
  console.log('  💉 _system.md에 주입 중...');
  await injectIntoSystemMd(block);

  // 인덱스 저장
  await saveIndex(files);

  const sizeKB = (Buffer.byteLength(block, 'utf-8') / 1024).toFixed(1);

  console.log(`\n  ✅ 완료!`);
  console.log(`     📄 _shared/_system.md에 ${sizeKB}KB 지식 주입됨`);
  console.log(`     📊 인덱스: 20_Meta/KBIndex.json`);
  console.log(`     📁 전체 내용 포함: 최신 ${Math.min(files.length, MAX_FULL_CONTENT_FILES)}개`);
  console.log(`     📋 색인만 포함: ${Math.max(0, files.length - MAX_FULL_CONTENT_FILES)}개`);

  // 주요 파일 목록
  console.log(`\n  ── 주요 문서 (전체 내용 포함) ──`);
  files.slice(0, MAX_FULL_CONTENT_FILES).forEach(f => {
    console.log(`     📄 [${f.folder}] ${f.title}`);
  });

  console.log(`\n${'━'.repeat(55)}\n`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  6. Watch 모드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function watch() {
  const chokidar = await import('chokidar');

  console.log(`\n${'━'.repeat(55)}`);
  console.log(`  👁️ Knowledge Loader Watch 모드`);
  console.log(`${'━'.repeat(55)}\n`);

  await build();

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
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log('  🔄 _system.md 자동 업데이트...');
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

export { build, scanAllFiles, buildKnowledgeBlock };

main().catch(err => {
  console.error('Knowledge Loader 에러:', err);
  process.exit(1);
});
