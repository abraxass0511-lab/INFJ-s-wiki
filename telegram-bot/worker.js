/**
 * 📱 텔레그램 → GitHub 자동 업로드 Worker
 * 
 * 흐름: 텔레그램 이미지 → Cloudflare Worker → GitHub Push → OCR 워크플로우 → MD 생성
 * 
 * 환경 변수 (Cloudflare Dashboard에서 설정):
 *   TELEGRAM_BOT_TOKEN  - BotFather에서 발급받은 봇 토큰
 *   GITHUB_TOKEN        - GitHub Personal Access Token
 *   GITHUB_OWNER        - GitHub 사용자명 (예: abraxass0511-lab)
 *   GITHUB_REPO         - GitHub 리포지토리명 (예: INFJ-s-wiki)
 *   ALLOWED_CHAT_IDS    - (선택) 허용할 텔레그램 Chat ID, 쉼표 구분
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /  → 상태 확인
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('✅ 텔레그램-GitHub 위키 봇 활성화됨', { status: 200 });
    }

    // POST /webhook  → 텔레그램 웹훅 처리
    if (request.method === 'POST' && url.pathname === '/webhook') {
      try {
        const update = await request.json();
        await handleTelegramUpdate(update, env);
        return new Response('OK', { status: 200 });
      } catch (e) {
        console.error('Webhook error:', e);
        return new Response('Error', { status: 500 });
      }
    }

    // GET /setup  → 웹훅 자동 등록
    if (request.method === 'GET' && url.pathname === '/setup') {
      const webhookUrl = `${url.origin}/webhook`;
      const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
      const res = await fetch(telegramUrl);
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

// ── 텔레그램 업데이트 처리 ──
async function handleTelegramUpdate(update, env) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text || '';
  const caption = message.caption || '';

  // 허용된 Chat ID 확인 (설정된 경우)
  if (env.ALLOWED_CHAT_IDS) {
    const allowed = env.ALLOWED_CHAT_IDS.split(',').map(id => id.trim());
    if (!allowed.includes(String(chatId))) {
      await sendTelegram(env, chatId, '⛔ 권한이 없습니다. Chat ID: ' + chatId);
      return;
    }
  }

  // /start 명령어
  if (text === '/start') {
    await sendTelegram(env, chatId, 
      '🧠 *위키 에이전트 봇*\n\n' +
      '📸 이미지를 보내면 자동으로:\n' +
      '  1\\. GitHub에 업로드\n' +
      '  2\\. Gemini AI가 분석\n' +
      '  3\\. MD 문서 생성\n' +
      '  4\\. 캘린더에 반영\n\n' +
      '📝 *사용법:*\n' +
      '• 이미지만 보내기 → "AI공부" 카테고리\n' +
      '• 이미지 \\+ 캡션 → 캡션이 카테고리\n' +
      '  예: `회사`, `유튜브`, `기타`\n\n' +
      '🆔 Your Chat ID: `' + chatId + '`\n' +
      '이 ID를 ALLOWED\\_CHAT\\_IDS에 추가하세요',
      'MarkdownV2'
    );
    return;
  }

  // /id 명령어 - Chat ID 확인
  if (text === '/id') {
    await sendTelegram(env, chatId, `🆔 Chat ID: ${chatId}`);
    return;
  }

  // /status 명령어 - 최근 파일 확인
  if (text === '/status') {
    try {
      const today = getKSTDate();
      const files = await getGitHubFiles(env, today);
      if (files.length === 0) {
        await sendTelegram(env, chatId, `📅 ${today}: 파일 없음`);
      } else {
        const list = files.map(f => `• ${f.name}`).join('\n');
        await sendTelegram(env, chatId, `📅 ${today} 파일 목록:\n${list}`);
      }
    } catch (e) {
      await sendTelegram(env, chatId, `❌ 상태 확인 실패: ${e.message}`);
    }
    return;
  }

  // 📸 이미지 처리
  if (message.photo || message.document) {
    await handleImageUpload(message, env, chatId, caption);
    return;
  }

  // 기타 메시지
  await sendTelegram(env, chatId, '📸 이미지를 보내주세요! 자동으로 위키에 등록됩니다.');
}

// ── 이미지 업로드 처리 ──
async function handleImageUpload(message, env, chatId, caption) {
  const category = caption.trim() || 'AI공부';
  const today = getKSTDate();
  
  await sendTelegram(env, chatId, `⏳ 업로드 시작... (📁 ${today} / 📂 ${category})`);

  try {
    // 1. 텔레그램에서 파일 정보 가져오기
    let fileId, fileName, isDocument = false;

    if (message.document) {
      // 문서로 보낸 이미지 (원본 품질)
      fileId = message.document.file_id;
      fileName = message.document.file_name || `doc_${Date.now()}.png`;
      isDocument = true;
    } else if (message.photo) {
      // 일반 사진 (가장 큰 해상도 선택)
      const photo = message.photo[message.photo.length - 1];
      fileId = photo.file_id;
      fileName = `IMG_${getKSTTimestamp()}.jpg`;
    }

    // 파일명에서 특수문자 제거
    fileName = sanitizeFileName(fileName);

    // 2. 텔레그램에서 파일 다운로드
    const fileData = await downloadTelegramFile(env, fileId);
    if (!fileData) {
      await sendTelegram(env, chatId, '❌ 파일 다운로드 실패');
      return;
    }

    // 3. GitHub에 업로드
    const githubPath = `00_Raw/${today}/${fileName}`;
    await uploadToGitHub(env, githubPath, fileData, `[Telegram] 📸 ${fileName} 업로드`);

    // 4. _categories.json 업데이트
    await updateCategories(env, today, category, fileName);

    // 5. 성공 알림
    const fileSize = (fileData.byteLength / 1024).toFixed(1);
    await sendTelegram(env, chatId,
      `✅ *업로드 완료\\!*\n\n` +
      `📁 경로: \`00_Raw/${today}/${fileName}\`\n` +
      `📂 카테고리: ${escapeMarkdown(category)}\n` +
      `📦 크기: ${fileSize}KB\n\n` +
      `🤖 Gemini OCR 처리가 자동으로 시작됩니다\\.\n` +
      `📄 MD 파일이 곧 생성됩니다\\.`,
      'MarkdownV2'
    );

  } catch (e) {
    console.error('Upload error:', e);
    await sendTelegram(env, chatId, `❌ 업로드 실패: ${e.message}`);
  }
}

// ── 텔레그램 API ──
async function sendTelegram(env, chatId, text, parseMode) {
  const body = { chat_id: chatId, text };
  if (parseMode) body.parse_mode = parseMode;
  
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function downloadTelegramFile(env, fileId) {
  // 파일 경로 가져오기
  const fileInfo = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
  ).then(r => r.json());

  if (!fileInfo.ok || !fileInfo.result.file_path) return null;

  // 파일 다운로드
  const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
  const response = await fetch(fileUrl);
  if (!response.ok) return null;

  return await response.arrayBuffer();
}

// ── GitHub API ──
async function uploadToGitHub(env, path, fileData, message) {
  const content = arrayBufferToBase64(fileData);
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;

  // 기존 파일 SHA 확인 (덮어쓰기용)
  let sha;
  try {
    const existing = await fetch(url, {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }).then(r => r.json());
    if (existing.sha) sha = existing.sha;
  } catch (e) { /* 새 파일 */ }

  const body = {
    message,
    content,
    branch: 'main',
    ...(sha ? { sha } : {})
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub upload failed (${response.status}): ${err.substring(0, 200)}`);
  }

  return response.json();
}

async function updateCategories(env, dateStr, category, fileName) {
  const path = `00_Raw/_categories.json`;
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;

  // 현재 _categories.json 읽기
  let categories = {};
  let sha;
  try {
    const res = await fetch(url + '?ref=main', {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }).then(r => r.json());

    if (res.content) {
      categories = JSON.parse(atob(res.content.replace(/\n/g, '')));
      sha = res.sha;
    }
  } catch (e) { /* 새 파일 */ }

  // 카테고리 항목 추가
  if (!categories[dateStr]) categories[dateStr] = {};
  if (!categories[dateStr][category]) categories[dateStr][category] = [];
  if (!categories[dateStr][category].includes(fileName)) {
    categories[dateStr][category].push(fileName);
  }

  // 저장
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(categories, null, 2))));
  const body = {
    message: `[Telegram] 📂 카테고리 업데이트: ${dateStr}/${category}`,
    content,
    branch: 'main',
    ...(sha ? { sha } : {})
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    console.warn('Category update failed:', await response.text());
  }
}

async function getGitHubFiles(env, dateStr) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/00_Raw/${dateStr}?ref=main`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }).then(r => r.json());
    return Array.isArray(res) ? res.filter(f => f.type === 'file') : [];
  } catch (e) {
    return [];
  }
}

// ── 유틸리티 ──
function getKSTDate() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function getKSTTimestamp() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace(/[-:T]/g, '').split('.')[0];
}

function sanitizeFileName(name) {
  // 특수문자 제거하되 한글/영문/숫자/점/밑줄/하이픈 유지
  return name.replace(/[^\w가-힣.\-]/g, '_').replace(/__+/g, '_');
}

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
