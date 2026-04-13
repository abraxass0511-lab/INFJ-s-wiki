/**
 * P-Reinforce Document Processor
 * Raw 문서를 읽어 → 분류 → 변환 → 배치 → 연결 → 커밋 까지의 전체 파이프라인
 */

import fs from 'fs/promises';
import path from 'path';
import CONFIG from './config.js';
import { classify } from './classifier.js';
import { synthesizeFromRaw } from './template.js';
import { loadGraph, saveGraph, addNode, autoLink, getGraphConnectivity } from './graph.js';
import { syncToGitHub } from './git.js';
import { computeTotalReward } from './policy.js';
import { ensureDir, readText, writeText, today, sanitizeFilename, countFilesInDir, parseFrontmatter } from './utils.js';

/**
 * 단일 문서 처리 (전체 파이프라인)
 * @param {string} filePath - 원본 파일 경로
 * @returns {{ success: boolean, result: object }}
 */
export async function processDocument(filePath) {
  const startTime = Date.now();
  const fileName = path.basename(filePath, path.extname(filePath));
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🧠 P-Reinforce Processing: ${fileName}`);
  console.log(`${'═'.repeat(60)}`);

  try {
    // ── Step 1: 원본 읽기 ──
    console.log('  📥 [1/6] 원본 파일 읽기...');
    const rawContent = await readText(filePath);
    if (!rawContent.trim()) {
      return { success: false, error: '빈 파일입니다.' };
    }

    // ── Step 2: 상태(State) 분석 — RL 분류 ──
    console.log('  🔍 [2/6] RL 기반 분류 중...');
    const classification = await classify(fileName, rawContent);
    console.log(`       → 카테고리: ${classification.categoryName}`);
    console.log(`       → 신뢰도: ${classification.confidence}`);
    console.log(`       → 근거: ${classification.reasoning}`);

    // ── Step 3: 행동(Action) — 폴더 결정 ──
    console.log('  📁 [3/6] 폴더 구조 결정...');
    const targetFolder = await determineFolder(classification);
    console.log(`       → 배치 경로: ${path.relative(CONFIG.ROOT, targetFolder)}`);

    // ── Step 4: 행동(Action) — 지식 합성 ──
    console.log('  📝 [4/6] Karpathy 템플릿으로 합성...');
    const wikiDoc = synthesizeFromRaw(fileName, rawContent, classification);
    const { data: frontmatter } = parseFrontmatter(wikiDoc);
    
    // 파일 저장
    const targetFileName = `${sanitizeFilename(fileName)}.md`;
    const targetPath = path.join(targetFolder, targetFileName);
    await writeText(targetPath, wikiDoc);
    console.log(`       → 저장: ${path.relative(CONFIG.ROOT, targetPath)}`);

    // ── Step 5: 그래프 연결 ──
    console.log('  🔗 [5/6] 지식 그래프 연결...');
    let graph = await loadGraph();
    graph = await addNode(graph, {
      id: frontmatter.id,
      title: fileName,
      path: targetPath,
      category: classification.categoryName,
      tags: frontmatter.tags || [],
      confidence: classification.confidence,
    });
    
    const { graph: updatedGraph, connections } = await autoLink(
      graph, frontmatter.id, fileName, rawContent
    );
    
    await saveGraph(updatedGraph);
    console.log(`       → ${connections.length}개 연결 생성`);
    for (const conn of connections) {
      console.log(`         · ${conn.type}: [[${conn.target}]]`);
    }

    // ── Step 6: Git 커밋 + Push ──
    console.log('  📦 [6/6] Git 커밋 + Push...');
    const commitSummary = `"${classification.categoryName}" 폴더에 "${fileName}" 문서 배치 (신뢰도: ${classification.confidence})`;
    const gitResult = await syncToGitHub(commitSummary);
    
    if (gitResult.commitHash) {
      console.log(`       → 커밋: ${gitResult.commitHash}`);
    }
    if (gitResult.pushed) {
      console.log(`       → GitHub Push ✅`);
    }

    // ── 원본 백업 이동 ──
    await archiveRaw(filePath);

    // ── 보상 점수 계산 ──
    const graphConn = getGraphConnectivity(updatedGraph);
    const reward = await computeTotalReward(classification.confidence, graphConn);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n  ✅ 완료! (${elapsed}s) | 보상(R): ${reward.total}`);
    console.log(`${'═'.repeat(60)}\n`);

    // ── Index.md 업데이트 ──
    await updateIndex(fileName, targetPath, classification);

    return {
      success: true,
      result: {
        title: fileName,
        category: classification.categoryName,
        confidence: classification.confidence,
        path: targetPath,
        connections: connections.length,
        commitHash: gitResult.commitHash,
        reward: reward.total,
        elapsed,
      },
    };

  } catch (err) {
    console.error(`  ❌ 에러: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * 폴더 결정 로직 (구조 재설계 포함)
 */
async function determineFolder(classification) {
  const baseFolder = CONFIG.PATHS[classification.category];
  await ensureDir(baseFolder);

  // 서브카테고리가 있으면 해당 폴더 사용
  if (classification.subcategory) {
    const subPath = path.join(baseFolder, classification.subcategory);
    await ensureDir(subPath);
    return subPath;
  }

  // 폴더 파일 수 체크 (Refactoring Threshold)
  const fileCount = await countFilesInDir(baseFolder);
  if (fileCount >= CONFIG.THRESHOLDS.REFACTOR_LIMIT) {
    console.log(`       ⚠️ ${classification.categoryName} 폴더에 ${fileCount}개 파일 — 세분화 권장`);
    // TODO: 자동 세분화 로직 (추후 구현)
  }

  return baseFolder;
}

/**
 * 원본 파일을 00_Raw/날짜 폴더로 아카이브
 */
async function archiveRaw(filePath) {
  const dateFolder = path.join(CONFIG.PATHS.RAW, today());
  await ensureDir(dateFolder);
  
  const fileName = path.basename(filePath);
  const archivePath = path.join(dateFolder, fileName);
  
  try {
    await fs.copyFile(filePath, archivePath);
    // 원본은 유지 (삭제는 사용자 선택)
    console.log(`  📦 원본 아카이브: ${path.relative(CONFIG.ROOT, archivePath)}`);
  } catch (err) {
    console.log(`  ⚠️ 아카이브 실패: ${err.message}`);
  }
}

/**
 * Index.md 업데이트
 */
async function updateIndex(title, targetPath, classification) {
  let index = await readText(CONFIG.META_FILES.INDEX);
  
  if (!index) {
    index = `# P-Reinforce Wiki Index\n\n> 자동 생성된 위키 목차입니다.\n> 마지막 업데이트: ${new Date().toISOString()}\n\n`;
    for (const cat of Object.values(CONFIG.CATEGORIES)) {
      index += `## ${cat.name}\n${cat.description}\n\n`;
    }
  }

  // 해당 카테고리 섹션에 항목 추가
  const catName = classification.categoryName;
  const sectionHeader = `## ${catName}`;
  const sectionIdx = index.indexOf(sectionHeader);
  
  if (sectionIdx >= 0) {
    const insertPoint = index.indexOf('\n', sectionIdx) + 1;
    const nextSection = index.indexOf('\n## ', insertPoint);
    const sectionEnd = nextSection > 0 ? nextSection : index.length;
    
    // 중복 체크
    if (!index.slice(sectionIdx, sectionEnd).includes(`[[${title}]]`)) {
      const relPath = path.relative(CONFIG.ROOT, targetPath).replace(/\\/g, '/');
      const entry = `- [[${title}]] — 신뢰도: ${classification.confidence} | ${today()}\n`;
      
      // 설명 줄 다음에 삽입
      const descEnd = index.indexOf('\n', insertPoint) + 1;
      index = index.slice(0, descEnd) + entry + index.slice(descEnd);
    }
  }

  // 타임스탬프 업데이트
  index = index.replace(/마지막 업데이트: .*/, `마지막 업데이트: ${new Date().toISOString()}`);
  
  await writeText(CONFIG.META_FILES.INDEX, index);
}

/**
 * 00_Raw 폴더의 모든 미처리 파일을 배치 처리
 */
export async function processAllRaw() {
  const rawPath = CONFIG.PATHS.RAW;
  
  try {
    const entries = await fs.readdir(rawPath, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
        files.push(path.join(rawPath, entry.name));
      }
    }
    
    if (files.length === 0) {
      console.log('📭 처리할 파일이 없습니다.');
      return { processed: 0, results: [] };
    }
    
    console.log(`\n🚀 ${files.length}개 파일 배치 처리 시작\n`);
    
    const results = [];
    for (const file of files) {
      const result = await processDocument(file);
      results.push(result);
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n📊 처리 완료: ${successful}/${files.length} 성공\n`);
    
    return { processed: files.length, results };
  } catch (err) {
    console.error(`배치 처리 에러: ${err.message}`);
    return { processed: 0, results: [], error: err.message };
  }
}

export default { processDocument, processAllRaw };
