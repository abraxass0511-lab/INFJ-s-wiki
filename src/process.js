/**
 * P-Reinforce Process Runner
 * Raw 폴더의 모든 파일을 즉시 배치 처리합니다.
 * 
 * Usage: npm run process
 */

import { processAllRaw, processDocument } from './processor.js';

const args = process.argv.slice(2);

async function main() {
  if (args.length > 0) {
    // 특정 파일 처리
    console.log(`\n🎯 단일 파일 처리: ${args[0]}\n`);
    const result = await processDocument(args[0]);
    if (result.success) {
      console.log('✅ 성공:', JSON.stringify(result.result, null, 2));
    } else {
      console.error('❌ 실패:', result.error);
    }
  } else {
    // 전체 Raw 폴더 처리
    await processAllRaw();
  }
}

main().catch(err => {
  console.error('❌ Process 에러:', err);
  process.exit(1);
});
