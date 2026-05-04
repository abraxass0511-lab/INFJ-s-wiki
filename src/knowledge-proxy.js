/**
 * P-Reinforce Knowledge RAG Proxy
 * 
 * Connect AI ↔ LM Studio 사이에서 동작하는 RAG 프록시 서버.
 * 
 * 원리:
 *   1. Connect AI가 이 프록시(포트 1235)에 요청을 보냄
 *   2. 사용자 메시지에서 키워드 추출
 *   3. 00_Raw, 10_Wiki에서 관련 파일을 검색
 *   4. 검색된 파일 내용을 시스템 프롬프트에 자동 주입
 *   5. LM Studio(포트 1234)로 전달
 *   6. 응답을 Connect AI에 반환
 * 
 * 에이전트는 아무것도 바꿀 필요 없이 파일 내용에 접근할 수 있습니다.
 * 
 * Usage:
 *   npm run proxy          → 프록시 서버 시작
 *   npm run proxy:build    → 검색 인덱스 재빌드 후 시작
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import CONFIG from './config.js';
import { findMarkdownFiles } from './utils.js';

// ── 설정 ──
const PROXY_PORT = parseInt(process.env.PROXY_PORT || '1235');
const LM_STUDIO_HOST = process.env.LM_HOST || 'localhost';
const LM_STUDIO_PORT = parseInt(process.env.LM_PORT || '1234');

const SCAN_FOLDERS = [
  { path: CONFIG.PATHS.RAW, label: '00_Raw' },
  { path: CONFIG.PATHS.WIKI, label: '10_Wiki' },
];

const MAX_INJECT_FILES = 3;         // 최대 주입 파일 수
const MAX_INJECT_CHARS = 2000;      // 파일당 최대 주입 글자 수
const INDEX_PATH = path.join(CONFIG.PATHS.META, 'SearchIndex.json');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. 검색 인덱스 빌드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let searchIndex = [];

async function buildSearchIndex() {
  console.log('  🔎 검색 인덱스 빌드 중...');
  searchIndex = [];

  for (const folder of SCAN_FOLDERS) {
    try {
      const mdFiles = await findMarkdownFiles(folder.path);

      for (const filePath of mdFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.trim().length < 10) continue;

          const relativePath = path.relative(CONFIG.ROOT, filePath);

          // 제목 추출
          let title = path.basename(filePath, '.md').replace(/_/g, ' ');
          const h1Match = content.match(/^#\s+(.+)$/m);
          if (h1Match) title = h1Match[1].replace(/[#*_\[\]]/g, '').trim();

          // 본문 (frontmatter 제거)
          const body = content.replace(/^---[\s\S]*?---\s*/m, '').trim();

          // 토큰화 (검색용)
          const tokens = tokenize(title + ' ' + body);

          searchIndex.push({
            path: filePath,
            relativePath,
            title,
            body,
            tokens,
            folder: folder.label,
          });
        } catch { /* skip */ }
      }
    } catch {
      console.log(`  ⚠️ ${folder.label} 폴더 접근 실패`);
    }
  }

  // 인덱스 저장 (경량)
  const indexMeta = searchIndex.map(f => ({
    path: f.relativePath,
    title: f.title,
    folder: f.folder,
    tokenCount: f.tokens.size,
  }));
  await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true });
  await fs.writeFile(INDEX_PATH, JSON.stringify(indexMeta, null, 2), 'utf-8');

  console.log(`  ✅ ${searchIndex.length}개 문서 인덱싱 완료\n`);
}

function tokenize(text) {
  const cleaned = text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#\-*\[\](){}|`>_~!@$%^&=+\\/<>:;"',.?]/g, ' ');

  const stopWords = new Set([
    'the', 'is', 'at', 'of', 'and', 'or', 'to', 'in', 'for', 'on', 'with',
    'by', 'an', 'as', 'it', 'be', 'was', 'are', 'has', 'from', 'this', 'that',
    '이', '그', '저', '및', '등', '를', '을', '의', '에', '는', '가', '도',
    '로', '으로', '에서', '와', '과', '한', '된', '있', '없', '수', '것',
  ]);

  const words = cleaned.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  return new Set(words);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. 파일 검색 (키워드 매칭)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function searchFiles(query) {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return [];

  const scored = searchIndex.map(doc => {
    let score = 0;

    for (const qt of queryTokens) {
      // 정확 매치
      if (doc.tokens.has(qt)) {
        score += 3;
      }
      // 부분 매치 (제목에 포함)
      if (doc.title.toLowerCase().includes(qt)) {
        score += 5;
      }
      // 부분 매치 (본문에서 부분 문자열)
      for (const dt of doc.tokens) {
        if (dt.includes(qt) || qt.includes(dt)) {
          score += 1;
          break;
        }
      }
    }

    return { ...doc, score };
  });

  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_INJECT_FILES);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. 프록시 서버
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createProxy() {
  const server = http.createServer(async (req, res) => {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // /v1/models → LM Studio로 직접 프록시
    if (req.url === '/v1/models' || req.url === '/api/models') {
      return proxyToLMStudio(req, res, null);
    }

    // /v1/chat/completions → RAG 주입 후 프록시
    if (req.url === '/v1/chat/completions' && req.method === 'POST') {
      return handleChatCompletion(req, res);
    }

    // 그 외 요청 → 직접 프록시
    return proxyToLMStudio(req, res, null);
  });

  return server;
}

async function handleChatCompletion(req, res) {
  // 요청 본문 수집
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf-8');

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  // 마지막 사용자 메시지 추출
  const messages = body.messages || [];
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');

  if (lastUserMsg && lastUserMsg.content) {
    const query = typeof lastUserMsg.content === 'string'
      ? lastUserMsg.content
      : lastUserMsg.content.map(c => c.text || '').join(' ');

    // 관련 파일 검색
    const results = searchFiles(query);

    if (results.length > 0) {
      // 검색 결과를 시스템 메시지로 주입
      const contextParts = results.map(r => {
        let content = r.body;
        if (content.length > MAX_INJECT_CHARS) {
          content = content.slice(0, MAX_INJECT_CHARS) + '\n(...생략)';
        }
        return `## 📄 ${r.title}\n> 파일: ${r.relativePath}\n\n${content}`;
      });

      const contextMsg = {
        role: 'system',
        content: [
          '📚 [자동 검색 결과] 아래는 사용자 질문과 관련된 로컬 파일 내용입니다.',
          '이 내용을 기반으로 정확히 답변하세요. "파일을 읽을 수 없다"고 하지 마세요.',
          '',
          ...contextParts,
        ].join('\n'),
      };

      // 시스템 메시지 바로 뒤에 삽입
      const sysIdx = messages.findIndex(m => m.role === 'system');
      if (sysIdx !== -1) {
        messages.splice(sysIdx + 1, 0, contextMsg);
      } else {
        messages.unshift(contextMsg);
      }

      body.messages = messages;

      console.log(`  🔍 "${query.slice(0, 50)}..." → ${results.length}개 문서 주입`);
      results.forEach(r => console.log(`     📄 ${r.title} (score: ${r.score})`));
    }
  }

  // LM Studio로 전달
  const modifiedBody = JSON.stringify(body);
  proxyToLMStudio(req, res, modifiedBody);
}

function proxyToLMStudio(clientReq, clientRes, overrideBody) {
  const options = {
    hostname: LM_STUDIO_HOST,
    port: LM_STUDIO_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: { ...clientReq.headers },
  };

  // 바디 덮어쓰기 시 Content-Length 업데이트
  if (overrideBody) {
    options.headers['content-length'] = Buffer.byteLength(overrideBody);
    delete options.headers['transfer-encoding'];
  }

  // host 헤더 수정
  options.headers['host'] = `${LM_STUDIO_HOST}:${LM_STUDIO_PORT}`;

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`  ❌ LM Studio 연결 실패: ${err.message}`);
    clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({
      error: `LM Studio 연결 실패 (localhost:${LM_STUDIO_PORT}). LM Studio가 실행 중인지 확인하세요.`,
    }));
  });

  if (overrideBody) {
    proxyReq.end(overrideBody);
  } else {
    clientReq.pipe(proxyReq, { end: true });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. 파일 감시 (인덱스 자동 업데이트)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startFileWatcher() {
  try {
    const chokidar = await import('chokidar');

    const watchPaths = SCAN_FOLDERS.map(f =>
      path.join(f.path, '**/*.md').replace(/\\/g, '/')
    );

    let debounceTimer = null;

    const watcher = chokidar.watch(watchPaths, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 1000 },
    });

    watcher.on('all', (event, filePath) => {
      console.log(`  📡 [${event}] ${path.relative(CONFIG.ROOT, filePath)}`);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        console.log('  🔄 검색 인덱스 재빌드...');
        await buildSearchIndex();
      }, 2000);
    });

    console.log('  👁️ 파일 변경 감시 활성화\n');
  } catch {
    console.log('  ⚠️ chokidar 없음 — 파일 감시 비활성 (npm i chokidar)\n');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Main
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🧠 P-Reinforce Knowledge RAG Proxy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Connect AI  →  localhost:${PROXY_PORT} (이 프록시)
       ↕ 자동 파일 검색 & 주입
  LM Studio   →  localhost:${LM_STUDIO_PORT}
`);

  // 검색 인덱스 빌드
  await buildSearchIndex();

  // 파일 감시 시작
  await startFileWatcher();

  // 프록시 서버 시작
  const server = createProxy();

  server.listen(PROXY_PORT, () => {
    console.log(`  ✅ RAG 프록시 실행 중: http://localhost:${PROXY_PORT}`);
    console.log(`  📡 LM Studio 대상: http://${LM_STUDIO_HOST}:${LM_STUDIO_PORT}`);
    console.log(`\n  ⚙️ Connect AI 설정에서 API 주소를:`);
    console.log(`     http://localhost:${LM_STUDIO_PORT} → http://localhost:${PROXY_PORT}`);
    console.log(`     으로 변경하세요.\n`);
    console.log(`${'━'.repeat(55)}\n`);
  });
}

main().catch(err => {
  console.error('RAG Proxy 에러:', err);
  process.exit(1);
});
