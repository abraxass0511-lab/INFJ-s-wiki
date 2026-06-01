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

    // ── 캘린더 카테고리 자동 분류 ──
    const calendarCat = classifyCalendarCategory(fileName, rawContent);
    await updateCalendarCategories(fileName + '.md', calendarCat);
    console.log(`  📅 캘린더 카테고리: ${calendarCat}`);

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
 * - 이미 날짜 서브폴더(YYYY-MM-DD)에 있는 파일은 스킵
 * - 루트 00_Raw에 직접 있는 파일만 today() 폴더로 복사
 */
async function archiveRaw(filePath) {
  // 파일의 부모 폴더명이 YYYY-MM-DD 패턴이면 이미 아카이브된 상태
  const parentDir = path.basename(path.dirname(filePath));
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  
  if (datePattern.test(parentDir)) {
    console.log(`  📦 원본 아카이브 스킵 (이미 ${parentDir}/ 폴더에 존재)`);
    return;
  }
  
  const dateFolder = path.join(CONFIG.PATHS.RAW, today());
  await ensureDir(dateFolder);
  
  const fileName = path.basename(filePath);
  const archivePath = path.join(dateFolder, fileName);
  
  try {
    await fs.copyFile(filePath, archivePath);
    await fs.unlink(filePath);  // 원본 삭제 (중복 처리 방지)
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
    const files = [];
    
    // 00_Raw 루트의 파일
    const rootEntries = await fs.readdir(rawPath, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile() && entry.name !== 'README.md' && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
        files.push(path.join(rawPath, entry.name));
      }
    }
    
    // 00_Raw 하위 날짜 폴더 (YYYY-MM-DD) 탐색
    for (const entry of rootEntries) {
      if (entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name)) {
        const subDir = path.join(rawPath, entry.name);
        const subEntries = await fs.readdir(subDir, { withFileTypes: true });
        for (const subEntry of subEntries) {
          if (subEntry.isFile() && (subEntry.name.endsWith('.md') || subEntry.name.endsWith('.txt'))) {
            files.push(path.join(subDir, subEntry.name));
          }
        }
      }
    }
    
    // 이미 10_Wiki에 있는 파일 제외
    const wikiPath = CONFIG.PATHS.WIKI || path.join(CONFIG.ROOT, '10_Wiki');
    let wikiFiles = [];
    try {
      const walkWiki = async (dir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          if (e.isFile() && e.name.endsWith('.md')) wikiFiles.push(e.name);
          if (e.isDirectory()) await walkWiki(path.join(dir, e.name));
        }
      };
      await walkWiki(wikiPath);
    } catch { /* Wiki 폴더 없으면 무시 */ }
    
    const unprocessed = files.filter(f => {
      const baseName = path.basename(f);
      const cleanName = baseName.replace(/^\d{4}-\d{2}-\d{2}_/, '');
      return !wikiFiles.some(w => w === baseName || w.includes(cleanName.replace('.md', '').replace(/^(루나|알파|레오|위키)_/, '')));
    });
    
    if (unprocessed.length === 0) {
      console.log('📭 처리할 파일이 없습니다.');
      return { processed: 0, results: [] };
    }
    
    console.log(`\n🚀 ${unprocessed.length}개 파일 배치 처리 시작 (총 ${files.length}개 중 미처리분)\n`);
    
    const results = [];
    for (const file of unprocessed) {
      const result = await processDocument(file);
      results.push(result);
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n📊 처리 완료: ${successful}/${unprocessed.length} 성공\n`);
    
    return { processed: unprocessed.length, results };
  } catch (err) {
    console.error(`배치 처리 에러: ${err.message}`);
    return { processed: 0, results: [], error: err.message };
  }
}

/**
 * 캘린더 카테고리 자동 분류 (내용 기반)
 * 캘린더 UI의 8개 카테고리: AI공부, 회사, 좋은글, 유튜브, 1인기업, 운동, 육아, 기타
 */
const CALENDAR_CATEGORIES = {
  'AI공부': ['AI', 'ai', '머신러닝', 'machine learning', 'deep learning', '딥러닝', 'LLM', 'GPT', 'mediapipe', 'tensorflow', 'pytorch', 'computer vision', '컴퓨터 비전', '신경망', 'neural', 'NLP', 'OCR', '객체 감지', 'object detect', 'PPE', '감지', 'detection', 'model', '모델'],
  '회사': ['회사', '직장', '업무', '회의', '출근', '퇴근', '사내', '팀', '동료', '상사', '급여', '인사', '근무'],
  '좋은글': ['명언', '좋은글', '감동', '인용', '격언', '철학', '명상', '마음', '성찰', '동기부여', '자기계발'],
  '유튜브': ['유튜브', 'youtube', '채널', '영상', '구독', '조회수', '썸네일', '알고리즘', '크리에이터', 'shorts', '편집'],
  '1인기업': ['1인기업', '사이드프로젝트', '자동화', '위키', 'wiki', '에이전트', 'agent', '프론트엔드', 'frontend', '백엔드', 'backend', '캘린더', 'calendar', '웹', 'web', 'UI', 'UX', '검색', '팝업', '모바일', 'CSS', 'JavaScript', 'HTML', 'Node', 'npm', '배포', 'deploy', 'GitHub', '깃허브', '개인 프로젝트'],
  '운동': ['운동', '헬스', '러닝', '수영', '등산', '요가', '필라테스', '다이어트', '체중', '근력', '유산소', '스트레칭'],
  '육아': ['육아', '아기', '아이', '돌봄', '유치원', '어린이집', '이유식', '수유', '놀이', '성장'],
};

function classifyCalendarCategory(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const scores = {};

  for (const [cat, keywords] of Object.entries(CALENDAR_CATEGORIES)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw.toLowerCase(), 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += Math.log2(1 + matches.length);
      }
    }
    if (score > 0) scores[cat] = score;
  }

  // 가장 높은 점수의 카테고리 반환, 없으면 '기타'
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return '기타';

  console.log(`       → 캘린더 분류 점수: ${sorted.map(([c,s]) => `${c}(${s.toFixed(1)})`).join(', ')}`);
  return sorted[0][0];
}

/**
 * _categories.json에 파일의 캘린더 카테고리 기록
 */
async function updateCalendarCategories(fileName, calendarCategory) {
  const catPath = path.join(CONFIG.PATHS.RAW, '_categories.json');
  let catData = {};

  try {
    const raw = await readText(catPath);
    if (raw) catData = JSON.parse(raw);
  } catch { /* 파일 없으면 새로 생성 */ }

  // 파일명에서 날짜 추출 (YYYY-MM-DD)
  const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
  const dateKey = dateMatch ? dateMatch[1] : today();

  if (!catData[dateKey]) catData[dateKey] = {};

  // 기존 카테고리에서 이 파일 제거 (중복 방지)
  for (const cat of Object.keys(catData[dateKey])) {
    if (Array.isArray(catData[dateKey][cat])) {
      catData[dateKey][cat] = catData[dateKey][cat].filter(f => f !== fileName);
      if (catData[dateKey][cat].length === 0) delete catData[dateKey][cat];
    }
  }

  // 새 카테고리에 추가
  if (!catData[dateKey][calendarCategory]) catData[dateKey][calendarCategory] = [];
  if (!catData[dateKey][calendarCategory].includes(fileName)) {
    catData[dateKey][calendarCategory].push(fileName);
  }

  await writeText(catPath, JSON.stringify(catData, null, 2));
}

export default { processDocument, processAllRaw };
