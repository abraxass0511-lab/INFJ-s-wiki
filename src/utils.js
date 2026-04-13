/**
 * P-Reinforce Utility Functions
 * 범용 유틸리티: 파일 I/O, 날짜, 텍스트 처리 등
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * 디렉토리가 없으면 재귀적으로 생성
 */
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * JSON 파일 안전 읽기 (없으면 기본값 반환)
 */
export async function readJSON(filePath, defaultValue = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * JSON 파일 안전 쓰기
 */
export async function writeJSON(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 텍스트 파일 안전 읽기
 */
export async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * 텍스트 파일 안전 쓰기
 */
export async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 현재 시각의 ISO 문자열 반환
 */
export function now() {
  return new Date().toISOString();
}

/**
 * 파일명에서 안전하지 않은 문자 제거 (이모지는 유지)
 */
export function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * 마크다운 텍스트에서 [[쌍방향 링크]] 추출
 */
export function extractWikiLinks(content) {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }
  return [...new Set(links)];
}

/**
 * 디렉토리 내 모든 .md 파일 재귀 검색
 */
export async function findMarkdownFiles(dirPath) {
  const results = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const sub = await findMarkdownFiles(fullPath);
        results.push(...sub);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch {
    // directory doesn't exist
  }
  return results;
}

/**
 * 디렉토리 내 파일 수 카운트
 */
export async function countFilesInDir(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.filter(e => e.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

/**
 * 간단한 텍스트 유사도 (Jaccard coefficient on bigrams)
 */
export function textSimilarity(a, b) {
  const bigramsA = getBigrams(a.toLowerCase());
  const bigramsB = getBigrams(b.toLowerCase());
  const intersection = bigramsA.filter(x => bigramsB.includes(x));
  const union = [...new Set([...bigramsA, ...bigramsB])];
  if (union.length === 0) return 0;
  return intersection.length / union.length;
}

function getBigrams(str) {
  const tokens = str.split(/\s+/).filter(Boolean);
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  // 단어 자체도 포함 (단어 수준 유사도)
  return [...bigrams, ...tokens];
}

/**
 * frontmatter 문자열 파싱 (gray-matter 없이도 사용 가능)
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, content };

  const frontmatterStr = match[1];
  const data = {};
  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      // 배열 파싱
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map(v => v.trim().replace(/"/g, ''));
      }
      // 숫자 파싱
      else if (!isNaN(val) && val !== '') {
        val = parseFloat(val);
      }
      // 따옴표 제거
      else {
        val = val.replace(/^["']|["']$/g, '');
      }
      data[key] = val;
    }
  }

  const body = content.slice(match[0].length).trim();
  return { data, content: body };
}
