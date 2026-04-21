/**
 * P-Reinforce Main Entry Point
 * 대화형 CLI 메뉴로 모든 기능에 접근합니다.
 */

import { createInterface } from 'readline';
import { processAllRaw } from './processor.js';
import { startWatcher } from './watcher.js';
import { getStatus, getRecentCommits, syncToGitHub } from './git.js';
import { loadGraph, rebuildGraph, getGraphConnectivity } from './graph.js';
import { recordFeedback, FEEDBACK, computeTotalReward } from './policy.js';
import { readJSON, findMarkdownFiles } from './utils.js';
import CONFIG from './config.js';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function showBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ██████╗       ██████╗ ███████╗██╗███╗   ██╗              ║
║    ██╔══██╗      ██╔══██╗██╔════╝██║████╗  ██║              ║
║    ██████╔╝█████╗██████╔╝█████╗  ██║██╔██╗ ██║              ║
║    ██╔═══╝ ╚════╝██╔══██╗██╔══╝  ██║██║╚██╗██║              ║
║    ██║            ██║  ██║███████╗██║██║ ╚████║              ║
║    ╚═╝            ╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝              ║
║                                                              ║
║       The Autonomous Knowledge Gardener                      ║
║       "지식의 중력을 거스르는 외부 뇌"                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

async function showMenu() {
  console.log(`
  ┌─────────────────────────────────────┐
  │  📋 P-Reinforce 명령어              │
  ├─────────────────────────────────────┤
  │  [1] 📥 Raw 폴더 배치 처리          │
  │  [2] 🔭 실시간 감시 모드            │
  │  [3] 📊 시스템 상태 확인            │
  │  [4] 🔄 그래프 재구축              │
  │  [5] 📦 GitHub 동기화               │
  │  [6] 💬 피드백 입력                 │
  │  [7] 📜 최근 커밋 로그              │
  │  [0] 🚪 종료                        │
  └─────────────────────────────────────┘
`);
}

async function handleCommand(cmd) {
  switch (cmd.trim()) {
    case '1':
      await processAllRaw();
      break;
      
    case '2':
      console.log('  실시간 감시 모드 진입... (Ctrl+C로 중단)');
      startWatcher();
      return false; // 메뉴 루프 중단
      
    case '3':
      await showSystemStatus();
      break;
      
    case '4':
      console.log('  🔄 그래프 재구축 중...');
      const graph = await rebuildGraph();
      const nodeCount = Object.keys(graph.nodes).length;
      const edgeCount = graph.edges.length;
      console.log(`  ✅ 재구축 완료: ${nodeCount}개 노드, ${edgeCount}개 엣지`);
      break;
      
    case '5':
      console.log('  📦 GitHub 동기화 중...');
      const syncResult = await syncToGitHub('수동 동기화');
      if (syncResult.success) {
        console.log(`  ✅ 커밋: ${syncResult.commitHash || '변경없음'}`);
        if (syncResult.pushed) console.log('  ✅ Push 완료');
        else if (syncResult.pushError) console.log(`  ⚠️ Push 실패: ${syncResult.pushError}`);
      } else {
        console.log(`  ❌ 동기화 실패: ${syncResult.error}`);
      }
      break;
      
    case '6':
      await handleFeedback();
      break;
      
    case '7':
      const commits = await getRecentCommits(10);
      console.log('\n  📜 최근 커밋:');
      for (const c of commits) {
        console.log(`     ${c.hash} ${c.message}`);
      }
      if (commits.length === 0) console.log('     (커밋 없음)');
      console.log();
      break;
      
    case '0':
      console.log('\n  👋 P-Reinforce 종료\n');
      rl.close();
      process.exit(0);
      
    default:
      console.log('  ❓ 알 수 없는 명령어입니다.');
  }
  return true;
}

async function showSystemStatus() {
  console.log('\n  ━━━━━━━━━ 📊 시스템 상태 ━━━━━━━━━');
  
  // Git 상태
  const gitStatus = await getStatus();
  console.log(`  🔧 Git 브랜치: ${gitStatus.branch}`);
  console.log(`  🌐 리모트: ${gitStatus.hasRemote ? '연결됨' : '❌ 설정 필요'}`);
  console.log(`  📝 변경사항: ${gitStatus.changes}개 파일`);
  
  // 그래프 상태
  const graph = await loadGraph();
  const nodeCount = Object.keys(graph.nodes).length;
  const edgeCount = graph.edges.length;
  const connectivity = getGraphConnectivity(graph);
  console.log(`  🧠 노드: ${nodeCount}개`);
  console.log(`  🔗 엣지: ${edgeCount}개`);
  console.log(`  📈 연결도: ${(connectivity * 100).toFixed(1)}%`);
  
  // Wiki 문서 수
  const wikiFiles = await findMarkdownFiles(CONFIG.PATHS.WIKI);
  console.log(`  📄 위키 문서: ${wikiFiles.length}개`);
  
  // 보상 점수
  const avgConfidence = nodeCount > 0
    ? Object.values(graph.nodes).reduce((sum, n) => sum + (n.confidence || 0), 0) / nodeCount
    : 0;
  const reward = await computeTotalReward(avgConfidence, connectivity);
  console.log(`  🏆 보상(R): ${reward.total}`);
  console.log(`     ├─ 분류 정확도: ${reward.breakdown.categorization.toFixed(2)}`);
  console.log(`     ├─ 그래프 연결: ${reward.breakdown.connectivity.toFixed(2)}`);
  console.log(`     └─ 사용자 만족: ${reward.breakdown.satisfaction.toFixed(2)}`);
  
  // 액션 로그
  const log = await readJSON(CONFIG.META_FILES.LOG, []);
  console.log(`  📜 총 액션: ${log.length}회`);
  
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function handleFeedback() {
  console.log('\n  💬 피드백 유형:');
  console.log('    [1] ✨ 칭찬 - 이 분류 좋아!');
  console.log('    [2] 🔧 수정 - 다른 카테고리로 옮겨줘');
  console.log('    [3] 📝 메모 - 참고 사항 기록');
  
  const type = await ask('  선택 > ');
  const docTitle = await ask('  문서 제목 > ');
  
  let feedbackType = FEEDBACK.IGNORE;
  let fromCategory = null;
  let toCategory = null;
  let note = '';
  
  switch (type.trim()) {
    case '1':
      feedbackType = FEEDBACK.PRAISE;
      fromCategory = await ask('  현재 카테고리 (Projects/Topics/Decisions/Skills) > ');
      break;
    case '2':
      feedbackType = FEEDBACK.MOVE;
      fromCategory = await ask('  현재 카테고리 > ');
      toCategory = await ask('  새 카테고리 > ');
      break;
    case '3':
      feedbackType = FEEDBACK.CORRECT;
      note = await ask('  메모 > ');
      break;
  }
  
  const result = await recordFeedback({
    type: feedbackType,
    docTitle,
    fromCategory,
    toCategory,
    keywords: docTitle.split(/\s+/).filter(w => w.length > 1),
    note,
  });
  
  console.log(`\n  ${result.message}`);
  console.log(`  보상 변화: ${result.reward > 0 ? '+' : ''}${result.reward}\n`);
}

// ── Main ──
async function main() {
  await showBanner();
  
  let running = true;
  while (running) {
    await showMenu();
    const cmd = await ask('  선택 > ');
    running = await handleCommand(cmd);
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
