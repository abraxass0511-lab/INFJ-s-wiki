/**
 * P-Reinforce Agent Bridge
 * 다른 에이전트 워크스페이스 + Antigravity KI에서 지식을 자동 수집합니다.
 * 
 * 지식 소스:
 *   1. 에이전트 SKILL.md / KNOWLEDGE_BASE.md → 각 에이전트의 핵심 운영 지식
 *   2. Antigravity Knowledge Items (KI) → 대화에서 증류된 구조화된 지식
 *   3. Antigravity 대화 로그 → 과거 세션의 학습 내용
 * 
 * Usage: npm run bridge
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import CONFIG from './config.js';
import { ensureDir, today, sanitizeFilename } from './utils.js';
import { processDocument } from './processor.js';

// ── 에이전트 레지스트리: 모든 에이전트 워크스페이스 ──
const AGENT_REGISTRY = [
  {
    name: '루나 (Luna)',
    emoji: '🎵',
    domain: 'YouTube 음악 채널 자동화',
    basePath: 'C:\\Users\\YS\\Desktop\\안티그래피티\\음악채널에이전트(루나)',
    knowledgeFiles: [
      '.agent\\skills\\agent-luna\\SKILL.md',
      '.agent\\skills\\agent-luna\\KNOWLEDGE_BASE.md',
      'KNOWLEDGE_BASE.md',
    ],
  },
  {
    name: '알파 (Alpha)',
    emoji: '📈',
    domain: '주식 투자 자동화',
    basePath: 'C:\\Users\\YS\\Desktop\\안티그래피티\\주식투자하는에이전트(알파)',
    knowledgeFiles: [
      '.agent\\skills\\agent-alpha\\SKILL.md',
    ],
  },
  {
    name: '레오 (Leo)',
    emoji: '📊',
    domain: 'YouTube 알고리즘 분석',
    basePath: 'C:\\Users\\YS\\Desktop\\안티그래피티\\유튜브알고리즘에이전트(레오)',
    knowledgeFiles: [
      '.agent\\skills\\youtube-growth-master\\SKILL.md',
    ],
  },
  {
    name: '경수 (Gyeongsu)',
    emoji: '🔍',
    domain: 'AI 사이버 수사',
    basePath: 'C:\\Users\\YS\\Desktop\\안티그래피티\\AI사이버수사대에이전트(경수)',
    knowledgeFiles: [
      '.agent\\skills\\gyeongsu\\SKILL.md',
    ],
  },
  {
    name: '코다리 (Kodari)',
    emoji: '🔬',
    domain: '연구 에이전트',
    basePath: 'C:\\Users\\YS\\Desktop\\안티그래피티\\연구에이전트(코다리)',
    knowledgeFiles: [
      '.agent\\skills\\kodari-gamemaster\\SKILL.md',
    ],
  },
  {
    name: '영식 (Youngsik)',
    emoji: '🎬',
    domain: '영상 생성',
    basePath: 'C:\\Users\\YS\\Desktop\\안티그래피티\\영상생성하는에이전트(영식)',
    knowledgeFiles: [
      '.agent\\skills\\agent-youngsik\\SKILL.md',
    ],
  },
  {
    name: '구글 광고',
    emoji: '💰',
    domain: '구글 광고 수익화',
    basePath: 'C:\\Users\\YS\\Desktop\\안티그래피티\\구글광고에이전트',
    knowledgeFiles: [
      '.agent\\skills\\google-monetize\\SKILL.md',
    ],
  },
];

// ── Antigravity Knowledge Items ──
const KI_BASE_PATH = 'C:\\Users\\YS\\.gemini\\antigravity\\knowledge';

// ── 동기화 상태 파일 (중복 방지) ──
const SYNC_STATE_PATH = path.join(CONFIG.PATHS.META, 'BridgeSync.json');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. 동기화 상태 관리 (해시 기반 중복 방지)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loadSyncState() {
  try {
    const data = await fs.readFile(SYNC_STATE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { syncedFiles: {}, lastSync: null };
  }
}

async function saveSyncState(state) {
  state.lastSync = new Date().toISOString();
  await fs.writeFile(SYNC_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function fileHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. 에이전트 지식 수집
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function collectAgentKnowledge() {
  const collected = [];

  for (const agent of AGENT_REGISTRY) {
    for (const relFile of agent.knowledgeFiles) {
      const fullPath = path.join(agent.basePath, relFile);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        if (content.trim().length < 50) continue; // 빈 파일 스킵

        collected.push({
          source: 'agent',
          agentName: agent.name,
          agentEmoji: agent.emoji,
          domain: agent.domain,
          filePath: fullPath,
          fileName: path.basename(relFile),
          content,
          hash: fileHash(content),
        });
      } catch {
        // 파일이 없으면 스킵
      }
    }
  }

  return collected;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. Antigravity KI 수집
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function collectKnowledgeItems() {
  const collected = [];
  
  try {
    const dirs = await fs.readdir(KI_BASE_PATH, { withFileTypes: true });

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;

      const kiDir = path.join(KI_BASE_PATH, dir.name);
      
      // metadata.json에서 요약 읽기
      let meta = {};
      try {
        const metaData = await fs.readFile(path.join(kiDir, 'metadata.json'), 'utf-8');
        meta = JSON.parse(metaData);
      } catch { /* skip */ }

      // artifacts 폴더의 .md 파일들 읽기
      const artifactsDir = path.join(kiDir, 'artifacts');
      try {
        const artFiles = await fs.readdir(artifactsDir);
        for (const artFile of artFiles) {
          if (!artFile.endsWith('.md')) continue;
          
          const artPath = path.join(artifactsDir, artFile);
          const content = await fs.readFile(artPath, 'utf-8');
          
          collected.push({
            source: 'ki',
            kiName: dir.name,
            kiSummary: meta.summary || '',
            filePath: artPath,
            fileName: artFile,
            content,
            hash: fileHash(content),
          });
        }
      } catch { /* no artifacts */ }
    }
  } catch {
    console.log('  ⚠️ Antigravity KI 경로 접근 불가');
  }

  return collected;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. 수집된 지식을 00_Raw에 저장 + 자동 처리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function importCollectedItem(item, syncState) {
  // 해시 기반 중복 체크
  const stateKey = `${item.source}:${item.filePath}`;
  if (syncState.syncedFiles[stateKey] === item.hash) {
    return null; // 변경 없음 — 스킵
  }
  
  // Raw 파일 생성
  let rawContent = '';
  let rawFileName = '';

  if (item.source === 'agent') {
    rawFileName = `bridge_${sanitizeFilename(item.agentName)}_${sanitizeFilename(item.fileName)}`;
    rawContent = [
      `# ${item.agentEmoji} ${item.agentName} — ${item.fileName.replace('.md', '')}`,
      '',
      `> 🔗 원본 에이전트: ${item.agentName}`,
      `> 🏷️ 도메인: ${item.domain}`,
      `> 📅 동기화: ${new Date().toISOString()}`,
      `> 📁 원본 경로: ${item.filePath}`,
      '',
      item.content,
    ].join('\n');
  } else if (item.source === 'ki') {
    rawFileName = `bridge_KI_${sanitizeFilename(item.kiName)}`;
    rawContent = [
      `# 🧠 Knowledge Item: ${item.kiName}`,
      '',
      `> 📋 요약: ${item.kiSummary}`,
      `> 📅 동기화: ${new Date().toISOString()}`,
      `> 📁 원본: ${item.filePath}`,
      '',
      item.content,
    ].join('\n');
  }

  if (!rawFileName.endsWith('.md')) rawFileName += '.md';
  
  const rawPath = path.join(CONFIG.PATHS.RAW, rawFileName);
  await ensureDir(CONFIG.PATHS.RAW);
  await fs.writeFile(rawPath, rawContent, 'utf-8');

  // 자동 처리
  try {
    await processDocument(rawPath);
  } catch (err) {
    console.log(`  ⚠️ 처리 실패: ${rawFileName} — ${err.message}`);
  }

  // 동기화 상태 업데이트
  syncState.syncedFiles[stateKey] = item.hash;
  
  return rawFileName;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  5. 메인 브릿지 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function runBridge({ agents = true, ki = true, force = false } = {}) {
  console.log(`\n${'━'.repeat(58)}`);
  console.log(`  🌉 P-Reinforce Agent Bridge`);
  console.log(`${'━'.repeat(58)}\n`);

  const syncState = force ? { syncedFiles: {}, lastSync: null } : await loadSyncState();
  
  if (syncState.lastSync) {
    console.log(`  마지막 동기화: ${new Date(syncState.lastSync).toLocaleString('ko-KR')}\n`);
  }

  let totalNew = 0;
  let totalSkipped = 0;

  // ── 에이전트 지식 수집 ──
  if (agents) {
    console.log('  📡 에이전트 워크스페이스 스캔...');
    const agentItems = await collectAgentKnowledge();
    console.log(`     → ${agentItems.length}개 지식 파일 발견\n`);

    for (const item of agentItems) {
      const result = await importCollectedItem(item, syncState);
      if (result) {
        totalNew++;
      } else {
        totalSkipped++;
        console.log(`  ⏭️  스킵 (변경없음): ${item.agentEmoji} ${item.agentName}/${item.fileName}`);
      }
    }
  }

  // ── Antigravity KI 수집 ──
  if (ki) {
    console.log('\n  🧠 Antigravity Knowledge Items 스캔...');
    const kiItems = await collectKnowledgeItems();
    console.log(`     → ${kiItems.length}개 KI 아티팩트 발견\n`);

    for (const item of kiItems) {
      const result = await importCollectedItem(item, syncState);
      if (result) {
        totalNew++;
      } else {
        totalSkipped++;
        console.log(`  ⏭️  스킵 (변경없음): KI/${item.kiName}`);
      }
    }
  }

  // ── 동기화 상태 저장 ──
  await saveSyncState(syncState);

  console.log(`\n${'━'.repeat(58)}`);
  console.log(`  ✅ 브릿지 완료: ${totalNew}개 새로 가져옴 | ${totalSkipped}개 스킵`);
  console.log(`${'━'.repeat(58)}\n`);

  return { totalNew, totalSkipped };
}

// ── CLI ──
async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const agentsOnly = args.includes('--agents');
  const kiOnly = args.includes('--ki');

  await runBridge({
    agents: !kiOnly,
    ki: !agentsOnly,
    force,
  });
}

export { runBridge, collectAgentKnowledge, collectKnowledgeItems };

main().catch(err => {
  console.error('Bridge 에러:', err);
  process.exit(1);
});
