/**
 * P-Reinforce Initializer
 * 폴더 구조 및 메타 파일을 초기 생성합니다.
 */

import CONFIG from './config.js';
import { ensureDir, writeText, writeJSON } from './utils.js';
import { generateInitialPolicy } from './policy.js';
import { initGit } from './git.js';

async function init() {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`  🌱 P-Reinforce 초기화`);
  console.log(`${'━'.repeat(60)}\n`);

  // 1. 폴더 구조 생성
  console.log('  📁 폴더 구조 생성...');
  const folders = [
    CONFIG.PATHS.RAW,
    CONFIG.PATHS.WIKI,
    CONFIG.PATHS.META,
    CONFIG.PATHS.PROJECTS,
    CONFIG.PATHS.TOPICS,
    CONFIG.PATHS.DECISIONS,
    CONFIG.PATHS.SKILLS,
  ];

  for (const folder of folders) {
    await ensureDir(folder);
    console.log(`     ✓ ${folder.replace(CONFIG.ROOT, '.')}`);
  }

  // 2. Graph.json 초기화
  console.log('\n  📊 Graph.json 초기화...');
  await writeJSON(CONFIG.META_FILES.GRAPH, { nodes: {}, edges: [] });

  // 3. Policy.md 초기화
  console.log('  📋 Policy.md 초기화...');
  await writeText(CONFIG.META_FILES.POLICY, generateInitialPolicy());

  // 4. Index.md 초기화
  console.log('  📑 Index.md 초기화...');
  const indexContent = `# 🧠 P-Reinforce Wiki Index

> 지식의 중력을 거스르는 자율형 위키 시스템
> 마지막 업데이트: ${new Date().toISOString()}

---

## 🛠️ Projects
목표 중심 — 현재 진행 중인 일, 프로젝트별 요약

## 💡 Topics
개념 중심 — 심리학, 코딩, 철학 등 스스로 생성한 분류

## ⚖️ Decisions
의사결정 중심 — 왜 이렇게 판단했는가에 대한 기록

## 🚀 Skills
실행 중심 — 사용자만의 프롬프트, 워크플로우 패턴

---

## 📊 시스템 통계
- 총 문서 수: 0
- 그래프 노드: 0
- 그래프 엣지: 0
- 평균 신뢰도: N/A
`;
  await writeText(CONFIG.META_FILES.INDEX, indexContent);

  // 5. ActionLog.json 초기화
  console.log('  📝 ActionLog.json 초기화...');
  await writeJSON(CONFIG.META_FILES.LOG, []);

  // 6. 00_Raw에 안내 파일 생성
  console.log('  📩 Raw 폴더 안내 생성...');
  await writeText(`${CONFIG.PATHS.RAW}/README.md`, `# 📩 00_Raw — 입력 폴더

이 폴더에 \`.md\` 또는 \`.txt\` 파일을 넣으면 P-Reinforce 에이전트가 자동으로:

1. 📊 **분류**: RL 기반 키워드/컨텍스트 분석으로 최적 카테고리 결정
2. 📝 **변환**: Karpathy 위키 템플릿으로 구조화
3. 🔗 **연결**: 최소 2개 이상의 관련 지식을 자동 링크
4. 📦 **배치**: \`10_Wiki/\` 하위 적합한 폴더에 저장
5. 🔄 **커밋**: GitHub에 자동 커밋

## 사용법
\`\`\`
# 파일을 이 폴더에 드롭하면 자동 처리됩니다
# 또는 수동으로:
npm run process    # 현재 Raw 폴더의 모든 파일 배치 처리
npm run watch      # 실시간 감시 모드
\`\`\`

## 주의사항
- 처리 완료된 원본은 \`00_Raw/YYYY-MM-DD/\` 날짜 폴더로 아카이브됩니다.
- \`.md\`와 \`.txt\` 확장자만 처리됩니다.
`);

  // 7. Git 초기화
  console.log('\n  🔧 Git 초기화...');
  const gitResult = await initGit();
  console.log(`     ${gitResult.message}`);

  console.log(`\n${'━'.repeat(60)}`);
  console.log(`  ✅ P-Reinforce 초기화 완료!`);
  console.log(`\n  사용법:`);
  console.log(`    npm run process  — Raw 폴더 배치 처리`);
  console.log(`    npm run watch    — 실시간 감시 모드`);
  console.log(`    npm run dashboard — 대시보드 실행`);
  console.log(`    npm run status   — 시스템 상태 확인`);
  console.log(`${'━'.repeat(60)}\n`);
}

init().catch(err => {
  console.error('초기화 실패:', err);
  process.exit(1);
});
