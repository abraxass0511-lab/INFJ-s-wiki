/**
 * 📱 텔레그램 → GitHub 자동 업로드 Worker
 * 
 * 흐름: 텔레그램 이미지 → 카테고리 선택 → GitHub Push → OCR 워크플로우 → MD 생성 → 알림
 * 
 * 환경 변수 (Cloudflare Dashboard에서 설정):
 *   TELEGRAM_BOT_TOKEN  - BotFather에서 발급받은 봇 토큰
 *   GITHUB_TOKEN        - GitHub Personal Access Token
 *   GITHUB_OWNER        - GitHub 사용자명 (예: abraxass0511-lab)
 *   GITHUB_REPO         - GitHub 리포지토리명 (예: INFJ-s-wiki)
 *   ALLOWED_CHAT_IDS    - (선택) 허용할 텔레그램 Chat ID, 쉼표 구분
 */

// ── 카테고리 목록 ──
const CATEGORIES = [
  { id: 'AI공부', emoji: '🤖', label: 'AI공부' },
  { id: '회사', emoji: '🏢', label: '회사' },
  { id: '유튜브', emoji: '📺', label: '유튜브' },
  { id: '1인기업', emoji: '💼', label: '1인기업' },
  { id: '좋은글', emoji: '📝', label: '좋은글' },
  { id: '운동', emoji: '💪', label: '운동' },
  { id: '육아', emoji: '👶', label: '육아' },
  { id: '기타', emoji: '📁', label: '기타' },
];

// ── 임시 저장소 (이미지 대기 상태) ──
// Cloudflare Worker는 stateless이므로, file_id를 callback_data에 직접 포함
// callback_data 길이 제한(64bytes) 때문에 간략한 키 사용

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
        console.log('📨 Incoming update:', JSON.stringify(update).substring(0, 500));
        await handleTelegramUpdate(update, env);
        return new Response('OK', { status: 200 });
      } catch (e) {
        console.error('Webhook error:', e.message, e.stack);
        // 에러 발생 시 텔레그램으로 에러 메시지 전송 시도
        try {
          const chatId = e.chatId || '0';
          if (chatId !== '0') {
            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text: '❌ 오류: ' + e.message })
            });
          }
        } catch (e2) { /* ignore */ }
        return new Response('Error: ' + e.message, { status: 200 }); // Return 200 to prevent Telegram retry
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

    
    // GET /webhook-info  → 웹훅 상태 조회
    if (request.method === 'GET' && url.pathname === '/webhook-info') {
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /test?chat_id=xxx  → 테스트 메시지 전송
    if (request.method === 'GET' && url.pathname === '/test') {
      const chatId = url.searchParams.get('chat_id');
      if (!chatId) {
        return new Response('chat_id parameter required', { status: 400 });
      }
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ 위키봇 테스트 성공! 이미지를 보내보세요.'
        })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

// POST /notify  → OCR 워크플로우에서 호출하는 알림 엔드포인트
    if (request.method === 'POST' && url.pathname === '/notify') {
      try {
        const body = await request.json();
        const { chat_id, message, secret } = body;
        // 간단한 인증 (GITHUB_TOKEN의 앞 8자리)
        if (!secret || !env.GITHUB_TOKEN || secret !== env.GITHUB_TOKEN.substring(0, 8)) {
          return new Response('Unauthorized', { status: 401 });
        }
        await sendTelegram(env, chat_id, message, 'MarkdownV2');
        return new Response('OK', { status: 200 });
      } catch (e) {
        // MarkdownV2 파싱 실패 시 일반 텍스트로 재시도
        try {
          const body = await request.clone().json?.() || {};
          if (body.chat_id && body.message) {
            await sendTelegram(env, body.chat_id, body.message.replace(/\\/g, ''));
          }
        } catch (_) {}
        return new Response('Error: ' + e.message, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

// ── 텔레그램 업데이트 처리 ──
async function handleTelegramUpdate(update, env) {
  // 📌 Callback Query 처리 (카테고리 선택)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query, env);
    return;
  }

  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text || '';

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
      '🧠 위키 에이전트 봇\n\n' +
      '📸 이미지를 보내면 자동으로:\n' +
      '  1. 카테고리 선택 버튼 표시\n' +
      '  2. GitHub에 업로드\n' +
      '  3. Gemini AI가 분석\n' +
      '  4. MD 문서 생성\n' +
      '  5. 캘린더에 반영\n\n' +
      '📝 각 단계별 진행상황을 실시간 알림!\n\n' +
      '🆔 Chat ID: ' + chatId
    );
    return;
  }

  // /id 명령어
  if (text === '/id') {
    await sendTelegram(env, chatId, `🆔 Chat ID: ${chatId}`);
    return;
  }

  // /status 명령어
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

  // 📸 이미지 수신 → 카테고리 선택 버튼 표시
  if (message.photo || message.document) {
    await askCategorySelection(message, env, chatId);
    return;
  }

  // 기타 메시지
  await sendTelegram(env, chatId, '📸 이미지를 보내주세요! 자동으로 위키에 등록됩니다.');
}

// ── 카테고리 선택 인라인 키보드 표시 ──
async function askCategorySelection(message, env, chatId) {
  let fileId, fileName, isDocument = false;

  if (message.document) {
    fileId = message.document.file_id;
    fileName = message.document.file_name || `doc_${Date.now()}.png`;
    isDocument = true;
  } else if (message.photo) {
    const photo = message.photo[message.photo.length - 1];
    fileId = photo.file_id;
    fileName = `IMG_${getKSTTimestamp()}.jpg`;
  }

  fileName = sanitizeFileName(fileName);

  // callback_data에 file_id를 포함 (64byte 제한 주의)
  // 형식: CAT:카테고리ID:file_id_앞20자:파일명_앞15자
  // → 실제로는 file_id 전체를 message_id와 연결하여 관리
  
  // 인라인 키보드 (2열 배치)
  const keyboard = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    const row = [];
    row.push({
      text: `${CATEGORIES[i].emoji} ${CATEGORIES[i].label}`,
      callback_data: `CAT:${CATEGORIES[i].id}`
    });
    if (i + 1 < CATEGORIES.length) {
      row.push({
        text: `${CATEGORIES[i + 1].emoji} ${CATEGORIES[i + 1].label}`,
        callback_data: `CAT:${CATEGORIES[i + 1].id}`
      });
    }
    keyboard.push(row);
  }

  // 이미지 정보를 포함한 메시지 전송
  // file_id를 텍스트에 숨겨서 나중에 callback에서 추출
  const msgText = '📂 카테고리를 선택하세요\n\n' +
    '📄 파일: ' + fileName + '\n' +
    '📅 날짜: ' + getKSTDate() + '\n\n' +
    '아래 버튼을 눌러 카테고리를 지정하세요:';

  const body = {
    chat_id: chatId,
    text: msgText,
    reply_to_message_id: message.message_id,
    reply_markup: {
      inline_keyboard: keyboard
    }
  };

  const sendRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  // 전송 실패 시 디버그 메시지
  if (!sendRes.ok) {
    const errBody = await sendRes.text();
    console.error('sendMessage failed:', sendRes.status, errBody);
    // 일반 텍스트로 재시도
    await sendTelegram(env, chatId, '📂 카테고리를 선택하세요 (이미지: ' + fileName + ')');
  }
}

// ── Callback Query 처리 (카테고리 선택 완료) ──
async function handleCallbackQuery(callbackQuery, env) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  // 허용된 Chat ID 확인
  if (env.ALLOWED_CHAT_IDS) {
    const allowed = env.ALLOWED_CHAT_IDS.split(',').map(id => id.trim());
    if (!allowed.includes(String(chatId))) {
      await answerCallbackQuery(env, callbackQuery.id, '⛔ 권한이 없습니다');
      return;
    }
  }

  if (!data.startsWith('CAT:')) {
    await answerCallbackQuery(env, callbackQuery.id, '❓ 알 수 없는 요청');
    return;
  }

  const category = data.split(':')[1];

  // 원본 이미지 메시지 찾기 (reply_to_message에 이미지가 있음)
  const originalMsg = callbackQuery.message.reply_to_message;
  if (!originalMsg || (!originalMsg.photo && !originalMsg.document)) {
    await answerCallbackQuery(env, callbackQuery.id, '❌ 원본 이미지를 찾을 수 없습니다');
    await sendTelegram(env, chatId, '❌ 이미지를 다시 보내주세요. 원본 메시지가 만료되었습니다.');
    return;
  }

  // 콜백 응답
  await answerCallbackQuery(env, callbackQuery.id, `✅ ${category} 선택!`);

  // 키보드 제거 + 선택 결과 표시
  const catInfo = CATEGORIES.find(c => c.id === category) || { emoji: '📁' };
  await editMessage(env, chatId, messageId,
    `✅ 카테고리: ${catInfo.emoji} *${escapeMarkdown(category)}* 선택 완료\\!\n⏳ 업로드를 시작합니다\\.\\.\\.`,
    'MarkdownV2'
  );

  // 이미지 업로드 시작
  await handleImageUpload(originalMsg, env, chatId, category);
}

// ── 이미지 업로드 처리 ──
async function handleImageUpload(message, env, chatId, category) {
  const today = getKSTDate();

  // 📌 Step 1: 다운로드 시작 알림
  await sendTelegram(env, chatId, `📥 [1/5] 텔레그램에서 이미지 다운로드 중...`);

  try {
    let fileId, fileName;

    if (message.document) {
      fileId = message.document.file_id;
      fileName = message.document.file_name || `doc_${Date.now()}.png`;
    } else if (message.photo) {
      const photo = message.photo[message.photo.length - 1];
      fileId = photo.file_id;
      fileName = `IMG_${getKSTTimestamp()}.jpg`;
    }

    fileName = sanitizeFileName(fileName);

    const fileData = await downloadTelegramFile(env, fileId);
    if (!fileData) {
      await sendTelegram(env, chatId, '❌ 파일 다운로드 실패');
      return;
    }

    const fileSize = (fileData.byteLength / 1024).toFixed(1);
    await sendTelegram(env, chatId, `✅ [1/5] 다운로드 완료 (${fileSize}KB)`);

    // 📌 Step 2: GitHub 업로드
    await sendTelegram(env, chatId, `📤 [2/5] GitHub에 업로드 중... (00_Raw/${today}/${fileName})`);

    const githubPath = `00_Raw/${today}/${fileName}`;
    await uploadToGitHub(env, githubPath, fileData, `[Telegram] 📸 ${fileName} 업로드 (${category})`);

    await sendTelegram(env, chatId, `✅ [2/5] GitHub 업로드 완료!`);

    // 📌 Step 3: 카테고리 등록
    await sendTelegram(env, chatId, `🏷️ [3/5] 카테고리 등록 중... (${category})`);

    await updateCategories(env, today, category, fileName);

    await sendTelegram(env, chatId, `✅ [3/5] 카테고리 등록 완료!`);

    // 📌 Step 4: 알림 메타데이터 저장 (OCR 워크플로우가 알림을 보낼 수 있도록)
    await sendTelegram(env, chatId, `🤖 [4/5] Gemini AI OCR 처리 대기 중...`);

    // chat_id를 GitHub에 저장하여 OCR 워크플로우가 알림 가능
    await saveNotifyInfo(env, today, chatId, fileName, category);

    // 📌 Step 5: 최종 안내
    const summaryMsg = '🚀 업로드 파이프라인 시작!' + '\n\n' +
      '📁 파일: ' + fileName + '\n' +
      '📂 카테고리: ' + category + '\n' +
      '📅 날짜: ' + today + '\n' +
      '📦 크기: ' + fileSize + 'KB' + '\n\n' +
      '⏳ 남은 자동 처리:' + '\n' +
      '  4. 🤖 Gemini AI → MD 문서 생성' + '\n' +
      '  5. 📅 캘린더 자동 반영' + '\n\n' +
      '완료되면 알림이 옵니다! 🔔';
    await sendTelegram(env, chatId, summaryMsg);

  } catch (e) {
    console.error('Upload error:', e);
    await sendTelegram(env, chatId, `❌ 업로드 실패: ${e.message}`);
  }
}

// ── 알림 메타데이터 저장 ──
async function saveNotifyInfo(env, dateStr, chatId, fileName, category) {
  const path = `00_Raw/_notify.json`;
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;

  let notifyData = {};
  let sha;
  try {
    const res = await fetch(url + '?ref=main', {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',

        'User-Agent': 'wiki-telegram-bot'
      }
    }).then(r => r.json());

    if (res.content) {
      const rawN = atob(res.content.replace(/\n/g, ''));
      const bytesN = new Uint8Array([...rawN].map(c => c.charCodeAt(0)));
      notifyData = JSON.parse(new TextDecoder('utf-8').decode(bytesN));
      sha = res.sha;
    }
  } catch (e) { /* 새 파일 */ }

  // 알림 정보 추가
  if (!notifyData.pending) notifyData.pending = [];
  notifyData.pending.push({
    chat_id: chatId,
    date: dateStr,
    file: fileName,
    category: category,
    timestamp: new Date().toISOString()
  });
  notifyData.worker_url = `https://wiki-telegram-bot.abraxass0511.workers.dev/notify`;

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(notifyData, null, 2))));
  const body = {
    message: `[Telegram] 📋 알림 메타 업데이트`,
    content,
    branch: 'main',
    ...(sha ? { sha } : {})
  };

  await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',

        'User-Agent': 'wiki-telegram-bot',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

// ── 텔레그램 API ──
async function sendTelegram(env, chatId, text, parseMode) {
  const body = { chat_id: chatId, text };
  if (parseMode) body.parse_mode = parseMode;
  
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  // MarkdownV2 파싱 실패 시 일반 텍스트로 재시도
  if (!res.ok && parseMode === 'MarkdownV2') {
    const plainText = text.replace(/\\/g, '').replace(/[*_`\[\]]/g, '');
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: plainText })
    });
  }
}

async function answerCallbackQuery(env, callbackId, text) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text })
  });
}

async function editMessage(env, chatId, messageId, text, parseMode) {
  const body = { chat_id: chatId, message_id: messageId, text };
  if (parseMode) body.parse_mode = parseMode;
  
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function downloadTelegramFile(env, fileId) {
  const fileInfo = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
  ).then(r => r.json());

  if (!fileInfo.ok || !fileInfo.result.file_path) return null;

  const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
  const response = await fetch(fileUrl);
  if (!response.ok) return null;

  return await response.arrayBuffer();
}

// ── GitHub API ──
async function uploadToGitHub(env, path, fileData, message) {
  const content = arrayBufferToBase64(fileData);
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;

  let sha;
  try {
    const existing = await fetch(url, {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',

        'User-Agent': 'wiki-telegram-bot'
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

        'User-Agent': 'wiki-telegram-bot',
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

  let categories = {};
  let sha;
  try {
    const res = await fetch(url + '?ref=main', {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',

        'User-Agent': 'wiki-telegram-bot'
      }
    }).then(r => r.json());

    if (res.content) {
      const raw = atob(res.content.replace(/\n/g, ''));
      const bytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
      categories = JSON.parse(new TextDecoder('utf-8').decode(bytes));
      sha = res.sha;
    }
  } catch (e) { /* 새 파일 */ }

  if (!categories[dateStr]) categories[dateStr] = {};
  if (!categories[dateStr][category]) categories[dateStr][category] = [];
  if (!categories[dateStr][category].includes(fileName)) {
    categories[dateStr][category].push(fileName);
  }

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

        'User-Agent': 'wiki-telegram-bot',
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
        'Accept': 'application/vnd.github.v3+json',

        'User-Agent': 'wiki-telegram-bot'
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
  return name.replace(/[^\w가-힣.\-]/g, '_').replace(/__+/g, '_');
}

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!\-]/g, '\\$&');
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
