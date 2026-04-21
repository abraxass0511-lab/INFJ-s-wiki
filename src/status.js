/**
 * P-Reinforce Status Reporter
 * 시스템 상태를 한눈에 확인합니다.
 * 
 * Usage: npm run status
 */

import CONFIG from './config.js';
import { loadGraph, getGraphConnectivity } from './graph.js';
import { getStatus, getRecentCommits } from './git.js';
import { readJSON, findMarkdownFiles, countFilesInDir } from './utils.js';
import { computeTotalReward } from './policy.js';

async function status() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🧠 P-Reinforce System Status`);
  console.log(`${'═'.repeat(60)}`);

  // ── 폴더별 문서 수 ──
  console.log('\n  📂 폴더 구조:');
  for (const [key, cat] of Object.entries(CONFIG.CATEGORIES)) {
    const count = await countFilesInDir(CONFIG.PATHS[key]);
    const bar = '█'.repeat(Math.min(count, 20)) + '░'.repeat(Math.max(0, 20 - count));
    console.log(`     ${cat.name.padEnd(16)} ${bar} ${count}개`);
  }

  // ── 그래프 ──
  const graph = await loadGraph();
  const nodeCount = Object.keys(graph.nodes).length;
  const edgeCount = graph.edges.length;
  const connectivity = getGraphConnectivity(graph);
  
  console.log('\n  🔗 지식 그래프:');
  console.log(`     노드: ${nodeCount}개  |  엣지: ${edgeCount}개  |  연결도: ${(connectivity * 100).toFixed(1)}%`);

  // ── Git ──
  const git = await getStatus();
  console.log('\n  🔧 Git 상태:');
  console.log(`     브랜치: ${git.branch}  |  리모트: ${git.hasRemote ? '✅' : '❌'}  |  변경: ${git.changes}개`);

  // ── 최근 활동 ──
  const log = await readJSON(CONFIG.META_FILES.LOG, []);
  const recent = log.slice(-5).reverse();
  console.log('\n  📜 최근 활동:');
  if (recent.length > 0) {
    for (const entry of recent) {
      const date = entry.timestamp?.slice(0, 10) || '?';
      console.log(`     [${date}] ${entry.type}: ${entry.docTitle || '-'}`);
    }
  } else {
    console.log('     (아직 활동 없음)');
  }

  // ── 보상 점수 ──
  const avgConf = nodeCount > 0
    ? Object.values(graph.nodes).reduce((sum, n) => sum + (n.confidence || 0), 0) / nodeCount
    : 0;
  const reward = await computeTotalReward(avgConf, connectivity);
  
  console.log('\n  🏆 RL 보상 점수:');
  console.log(`     R = ${reward.total}  (분류: ${reward.breakdown.categorization.toFixed(2)} | 연결: ${reward.breakdown.connectivity.toFixed(2)} | 만족: ${reward.breakdown.satisfaction.toFixed(2)})`);

  console.log(`\n${'═'.repeat(60)}\n`);
}

status().catch(err => {
  console.error('Status 에러:', err);
  process.exit(1);
});
