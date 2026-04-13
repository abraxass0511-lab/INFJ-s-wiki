/**
 * P-Reinforce File Watcher
 * 00_Raw 폴더를 실시간 감시하여 새 파일 발견 시 자동 처리합니다.
 */

import chokidar from 'chokidar';
import path from 'path';
import CONFIG from './config.js';
import { processDocument } from './processor.js';

const DEBOUNCE_MS = 2000; // 파일 쓰기 완료 대기
const pendingFiles = new Map();

export function startWatcher() {
  const rawPath = CONFIG.PATHS.RAW;

  console.log(`\n${'━'.repeat(60)}`);
  console.log(`  🔭 P-Reinforce Watcher 가동`);
  console.log(`  📂 감시 대상: ${rawPath}`);
  console.log(`  📄 대상 확장자: .md, .txt`);
  console.log(`${'━'.repeat(60)}\n`);
  console.log('  ⏳ 새 파일을 기다리는 중...\n');

  const watcher = chokidar.watch(rawPath, {
    ignored: [
      /(^|[/\\])\../,        // dotfiles
      /node_modules/,
      '**/20*/**',            // 날짜 아카이브 폴더 제외
    ],
    persistent: true,
    ignoreInitial: true,      // 기존 파일 무시
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 300,
    },
    depth: 0,                 // Raw 폴더 루트만 감시
  });

  watcher.on('add', (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.md' && ext !== '.txt') return;
    
    // Debounce: 같은 파일이 빠르게 여러번 트리거되는 것 방지
    if (pendingFiles.has(filePath)) {
      clearTimeout(pendingFiles.get(filePath));
    }
    
    const timer = setTimeout(async () => {
      pendingFiles.delete(filePath);
      console.log(`\n  📩 새 파일 감지: ${path.basename(filePath)}`);
      
      try {
        const result = await processDocument(filePath);
        if (result.success) {
          console.log(`  ✅ 처리 완료: ${result.result.title} → ${result.result.category}`);
        } else {
          console.log(`  ⚠️ 처리 실패: ${result.error}`);
        }
      } catch (err) {
        console.error(`  ❌ 프로세서 에러: ${err.message}`);
      }
      
      console.log('\n  ⏳ 새 파일을 기다리는 중...\n');
    }, DEBOUNCE_MS);
    
    pendingFiles.set(filePath, timer);
  });

  watcher.on('error', (error) => {
    console.error(`  ❌ Watcher 에러: ${error.message}`);
  });

  // 종료 핸들링
  process.on('SIGINT', () => {
    console.log('\n\n  🛑 Watcher 종료...');
    watcher.close();
    process.exit(0);
  });

  return watcher;
}

// 직접 실행 시
startWatcher();
