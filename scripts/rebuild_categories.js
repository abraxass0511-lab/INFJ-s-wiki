/**
 * _categories.json 재생성 스크립트
 * 00_Raw의 모든 날짜 폴더를 스캔하여 파일을 올바른 날짜에 분류
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_PATH = path.join(ROOT, '00_Raw');

// 캘린더 카테고리 키워드 (processor.js와 동일)
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

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return '기타';
  return sorted[0][0];
}

async function rebuild() {
  const catData = {};
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  // 00_Raw 하위 날짜 폴더만 스캔
  const entries = await fs.readdir(RAW_PATH, { withFileTypes: true });
  const dateDirs = entries.filter(e => e.isDirectory() && datePattern.test(e.name));

  let totalFiles = 0;

  for (const dir of dateDirs) {
    const dateKey = dir.name;
    const dirPath = path.join(RAW_PATH, dir.name);
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile()) continue;
      
      const fileName = file.name;
      const filePath = path.join(dirPath, fileName);

      // md/txt 파일만 내용 기반 분류, 나머지는 파일명 기반
      let content = '';
      if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        try {
          content = await fs.readFile(filePath, 'utf-8');
        } catch { /* ignore */ }
      }

      const category = classifyCalendarCategory(fileName, content);

      if (!catData[dateKey]) catData[dateKey] = {};
      if (!catData[dateKey][category]) catData[dateKey][category] = [];
      if (!catData[dateKey][category].includes(fileName)) {
        catData[dateKey][category].push(fileName);
      }
      totalFiles++;
    }
  }

  // 날짜순 정렬
  const sorted = Object.keys(catData).sort();
  const sortedData = {};
  for (const key of sorted) {
    sortedData[key] = catData[key];
  }

  // 저장
  const catPath = path.join(RAW_PATH, '_categories.json');
  
  // 백업
  try {
    await fs.copyFile(catPath, catPath + '.bak');
    console.log('📦 기존 _categories.json 백업 완료');
  } catch { /* 없으면 무시 */ }

  await fs.writeFile(catPath, JSON.stringify(sortedData, null, 2), 'utf-8');
  
  console.log(`\n✅ _categories.json 재생성 완료!`);
  console.log(`   - ${sorted.length}개 날짜`);
  console.log(`   - ${totalFiles}개 파일 분류\n`);

  // 2026-06-16 결과만 출력
  if (sortedData['2026-06-16']) {
    console.log('📅 2026-06-16 분류 결과:');
    for (const [cat, files] of Object.entries(sortedData['2026-06-16'])) {
      console.log(`   ${cat}: ${files.length}개 — ${files.join(', ')}`);
    }
  }
}

rebuild().catch(console.error);
