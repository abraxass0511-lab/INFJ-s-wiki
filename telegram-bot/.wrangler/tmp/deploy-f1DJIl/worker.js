var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var CATEGORIES = [
  { id: "AI\uACF5\uBD80", emoji: "\u{1F916}", label: "AI\uACF5\uBD80" },
  { id: "\uD68C\uC0AC", emoji: "\u{1F3E2}", label: "\uD68C\uC0AC" },
  { id: "\uC720\uD29C\uBE0C", emoji: "\u{1F4FA}", label: "\uC720\uD29C\uBE0C" },
  { id: "1\uC778\uAE30\uC5C5", emoji: "\u{1F4BC}", label: "1\uC778\uAE30\uC5C5" },
  { id: "\uC88B\uC740\uAE00", emoji: "\u{1F4DD}", label: "\uC88B\uC740\uAE00" },
  { id: "\uC6B4\uB3D9", emoji: "\u{1F4AA}", label: "\uC6B4\uB3D9" },
  { id: "\uC721\uC544", emoji: "\u{1F476}", label: "\uC721\uC544" },
  { id: "\uAE30\uD0C0", emoji: "\u{1F4C1}", label: "\uAE30\uD0C0" }
];
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("\u2705 \uD154\uB808\uADF8\uB7A8-GitHub \uC704\uD0A4 \uBD07 \uD65C\uC131\uD654\uB428", { status: 200 });
    }
    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        const update = await request.json();
        await handleTelegramUpdate(update, env);
        return new Response("OK", { status: 200 });
      } catch (e) {
        console.error("Webhook error:", e);
        return new Response("Error", { status: 500 });
      }
    }
    if (request.method === "GET" && url.pathname === "/setup") {
      const webhookUrl = `${url.origin}/webhook`;
      const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
      const res = await fetch(telegramUrl);
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method === "POST" && url.pathname === "/notify") {
      try {
        const body = await request.json();
        const { chat_id, message, secret } = body;
        if (!secret || !env.GITHUB_TOKEN || secret !== env.GITHUB_TOKEN.substring(0, 8)) {
          return new Response("Unauthorized", { status: 401 });
        }
        await sendTelegram(env, chat_id, message, "MarkdownV2");
        return new Response("OK", { status: 200 });
      } catch (e) {
        try {
          const body = await request.clone().json?.() || {};
          if (body.chat_id && body.message) {
            await sendTelegram(env, body.chat_id, body.message.replace(/\\/g, ""));
          }
        } catch (_) {
        }
        return new Response("Error: " + e.message, { status: 500 });
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};
async function handleTelegramUpdate(update, env) {
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query, env);
    return;
  }
  const message = update.message;
  if (!message) return;
  const chatId = message.chat.id;
  const text = message.text || "";
  if (env.ALLOWED_CHAT_IDS) {
    const allowed = env.ALLOWED_CHAT_IDS.split(",").map((id) => id.trim());
    if (!allowed.includes(String(chatId))) {
      await sendTelegram(env, chatId, "\u26D4 \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. Chat ID: " + chatId);
      return;
    }
  }
  if (text === "/start") {
    await sendTelegram(
      env,
      chatId,
      "\u{1F9E0} *\uC704\uD0A4 \uC5D0\uC774\uC804\uD2B8 \uBD07*\n\n\u{1F4F8} \uC774\uBBF8\uC9C0\uB97C \uBCF4\uB0B4\uBA74 \uC790\uB3D9\uC73C\uB85C:\n  1\\. \uCE74\uD14C\uACE0\uB9AC \uC120\uD0DD \uBC84\uD2BC \uD45C\uC2DC\n  2\\. GitHub\uC5D0 \uC5C5\uB85C\uB4DC\n  3\\. Gemini AI\uAC00 \uBD84\uC11D\n  4\\. MD \uBB38\uC11C \uC0DD\uC131\n  5\\. \uCE98\uB9B0\uB354\uC5D0 \uBC18\uC601\n\n\u{1F4DD} *\uAC01 \uB2E8\uACC4\uBCC4 \uC9C4\uD589\uC0C1\uD669\uC744 \uC2E4\uC2DC\uAC04 \uC54C\uB9BC\\!*\n\n\u{1F194} Chat ID: `" + chatId + "`",
      "MarkdownV2"
    );
    return;
  }
  if (text === "/id") {
    await sendTelegram(env, chatId, `\u{1F194} Chat ID: ${chatId}`);
    return;
  }
  if (text === "/status") {
    try {
      const today = getKSTDate();
      const files = await getGitHubFiles(env, today);
      if (files.length === 0) {
        await sendTelegram(env, chatId, `\u{1F4C5} ${today}: \uD30C\uC77C \uC5C6\uC74C`);
      } else {
        const list = files.map((f) => `\u2022 ${f.name}`).join("\n");
        await sendTelegram(env, chatId, `\u{1F4C5} ${today} \uD30C\uC77C \uBAA9\uB85D:
${list}`);
      }
    } catch (e) {
      await sendTelegram(env, chatId, `\u274C \uC0C1\uD0DC \uD655\uC778 \uC2E4\uD328: ${e.message}`);
    }
    return;
  }
  if (message.photo || message.document) {
    await askCategorySelection(message, env, chatId);
    return;
  }
  await sendTelegram(env, chatId, "\u{1F4F8} \uC774\uBBF8\uC9C0\uB97C \uBCF4\uB0B4\uC8FC\uC138\uC694! \uC790\uB3D9\uC73C\uB85C \uC704\uD0A4\uC5D0 \uB4F1\uB85D\uB429\uB2C8\uB2E4.");
}
__name(handleTelegramUpdate, "handleTelegramUpdate");
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
  const msgText = `\u{1F4C2} *\uCE74\uD14C\uACE0\uB9AC\uB97C \uC120\uD0DD\uD558\uC138\uC694*

\u{1F4C4} \uD30C\uC77C: ${escapeMarkdown(fileName)}
\u{1F4C5} \uB0A0\uC9DC: ${getKSTDate()}

\uC544\uB798 \uBC84\uD2BC\uC744 \uB20C\uB7EC \uCE74\uD14C\uACE0\uB9AC\uB97C \uC9C0\uC815\uD558\uC138\uC694:`;
  const body = {
    chat_id: chatId,
    text: msgText,
    parse_mode: "MarkdownV2",
    reply_to_message_id: message.message_id,
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
__name(askCategorySelection, "askCategorySelection");
async function handleCallbackQuery(callbackQuery, env) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  if (env.ALLOWED_CHAT_IDS) {
    const allowed = env.ALLOWED_CHAT_IDS.split(",").map((id) => id.trim());
    if (!allowed.includes(String(chatId))) {
      await answerCallbackQuery(env, callbackQuery.id, "\u26D4 \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4");
      return;
    }
  }
  if (!data.startsWith("CAT:")) {
    await answerCallbackQuery(env, callbackQuery.id, "\u2753 \uC54C \uC218 \uC5C6\uB294 \uC694\uCCAD");
    return;
  }
  const category = data.split(":")[1];
  const originalMsg = callbackQuery.message.reply_to_message;
  if (!originalMsg || !originalMsg.photo && !originalMsg.document) {
    await answerCallbackQuery(env, callbackQuery.id, "\u274C \uC6D0\uBCF8 \uC774\uBBF8\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
    await sendTelegram(env, chatId, "\u274C \uC774\uBBF8\uC9C0\uB97C \uB2E4\uC2DC \uBCF4\uB0B4\uC8FC\uC138\uC694. \uC6D0\uBCF8 \uBA54\uC2DC\uC9C0\uAC00 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    return;
  }
  await answerCallbackQuery(env, callbackQuery.id, `\u2705 ${category} \uC120\uD0DD!`);
  const catInfo = CATEGORIES.find((c) => c.id === category) || { emoji: "\u{1F4C1}" };
  await editMessage(
    env,
    chatId,
    messageId,
    `\u2705 \uCE74\uD14C\uACE0\uB9AC: ${catInfo.emoji} *${escapeMarkdown(category)}* \uC120\uD0DD \uC644\uB8CC\\!
\u23F3 \uC5C5\uB85C\uB4DC\uB97C \uC2DC\uC791\uD569\uB2C8\uB2E4\\.\\.\\.`,
    "MarkdownV2"
  );
  await handleImageUpload(originalMsg, env, chatId, category);
}
__name(handleCallbackQuery, "handleCallbackQuery");
async function handleImageUpload(message, env, chatId, category) {
  const today = getKSTDate();
  await sendTelegram(env, chatId, `\u{1F4E5} [1/5] \uD154\uB808\uADF8\uB7A8\uC5D0\uC11C \uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC \uC911...`);
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
      await sendTelegram(env, chatId, "\u274C \uD30C\uC77C \uB2E4\uC6B4\uB85C\uB4DC \uC2E4\uD328");
      return;
    }
    const fileSize = (fileData.byteLength / 1024).toFixed(1);
    await sendTelegram(env, chatId, `\u2705 [1/5] \uB2E4\uC6B4\uB85C\uB4DC \uC644\uB8CC (${fileSize}KB)`);
    await sendTelegram(env, chatId, `\u{1F4E4} [2/5] GitHub\uC5D0 \uC5C5\uB85C\uB4DC \uC911... (00_Raw/${today}/${fileName})`);
    const githubPath = `00_Raw/${today}/${fileName}`;
    await uploadToGitHub(env, githubPath, fileData, `[Telegram] \u{1F4F8} ${fileName} \uC5C5\uB85C\uB4DC (${category})`);
    await sendTelegram(env, chatId, `\u2705 [2/5] GitHub \uC5C5\uB85C\uB4DC \uC644\uB8CC!`);
    await sendTelegram(env, chatId, `\u{1F3F7}\uFE0F [3/5] \uCE74\uD14C\uACE0\uB9AC \uB4F1\uB85D \uC911... (${category})`);
    await updateCategories(env, today, category, fileName);
    await sendTelegram(env, chatId, `\u2705 [3/5] \uCE74\uD14C\uACE0\uB9AC \uB4F1\uB85D \uC644\uB8CC!`);
    await sendTelegram(env, chatId, `\u{1F916} [4/5] Gemini AI OCR \uCC98\uB9AC \uB300\uAE30 \uC911...`);
    await saveNotifyInfo(env, today, chatId, fileName, category);
    const summaryMsg = "\u{1F680} \uC5C5\uB85C\uB4DC \uD30C\uC774\uD504\uB77C\uC778 \uC2DC\uC791!\n\n\u{1F4C1} \uD30C\uC77C: " + fileName + "\n\u{1F4C2} \uCE74\uD14C\uACE0\uB9AC: " + category + "\n\u{1F4C5} \uB0A0\uC9DC: " + today + "\n\u{1F4E6} \uD06C\uAE30: " + fileSize + "KB\n\n\u23F3 \uB0A8\uC740 \uC790\uB3D9 \uCC98\uB9AC:\n  4. \u{1F916} Gemini AI \u2192 MD \uBB38\uC11C \uC0DD\uC131\n  5. \u{1F4C5} \uCE98\uB9B0\uB354 \uC790\uB3D9 \uBC18\uC601\n\n\uC644\uB8CC\uB418\uBA74 \uC54C\uB9BC\uC774 \uC635\uB2C8\uB2E4! \u{1F514}";
    await sendTelegram(env, chatId, summaryMsg);
  } catch (e) {
    console.error("Upload error:", e);
    await sendTelegram(env, chatId, `\u274C \uC5C5\uB85C\uB4DC \uC2E4\uD328: ${e.message}`);
  }
}
__name(handleImageUpload, "handleImageUpload");
async function saveNotifyInfo(env, dateStr, chatId, fileName, category) {
  const path = `00_Raw/_notify.json`;
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  let notifyData = {};
  let sha;
  try {
    const res = await fetch(url + "?ref=main", {
      headers: {
        "Authorization": `token ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
      }
    }).then((r) => r.json());
    if (res.content) {
      notifyData = JSON.parse(atob(res.content.replace(/\n/g, "")));
      sha = res.sha;
    }
  } catch (e) {
  }
  if (!notifyData.pending) notifyData.pending = [];
  notifyData.pending.push({
    chat_id: chatId,
    date: dateStr,
    file: fileName,
    category,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  notifyData.worker_url = `https://wiki-telegram-bot.abraxass0511.workers.dev/notify`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(notifyData, null, 2))));
  const body = {
    message: `[Telegram] \u{1F4CB} \uC54C\uB9BC \uBA54\uD0C0 \uC5C5\uB370\uC774\uD2B8`,
    content,
    branch: "main",
    ...sha ? { sha } : {}
  };
  await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}
__name(saveNotifyInfo, "saveNotifyInfo");
async function sendTelegram(env, chatId, text, parseMode) {
  const body = { chat_id: chatId, text };
  if (parseMode) body.parse_mode = parseMode;
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok && parseMode === "MarkdownV2") {
    const plainText = text.replace(/\\/g, "").replace(/[*_`\[\]]/g, "");
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: plainText })
    });
  }
}
__name(sendTelegram, "sendTelegram");
async function answerCallbackQuery(env, callbackId, text) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text })
  });
}
__name(answerCallbackQuery, "answerCallbackQuery");
async function editMessage(env, chatId, messageId, text, parseMode) {
  const body = { chat_id: chatId, message_id: messageId, text };
  if (parseMode) body.parse_mode = parseMode;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
__name(editMessage, "editMessage");
async function downloadTelegramFile(env, fileId) {
  const fileInfo = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
  ).then((r) => r.json());
  if (!fileInfo.ok || !fileInfo.result.file_path) return null;
  const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
  const response = await fetch(fileUrl);
  if (!response.ok) return null;
  return await response.arrayBuffer();
}
__name(downloadTelegramFile, "downloadTelegramFile");
async function uploadToGitHub(env, path, fileData, message) {
  const content = arrayBufferToBase64(fileData);
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  let sha;
  try {
    const existing = await fetch(url, {
      headers: {
        "Authorization": `token ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
      }
    }).then((r) => r.json());
    if (existing.sha) sha = existing.sha;
  } catch (e) {
  }
  const body = {
    message,
    content,
    branch: "main",
    ...sha ? { sha } : {}
  };
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub upload failed (${response.status}): ${err.substring(0, 200)}`);
  }
  return response.json();
}
__name(uploadToGitHub, "uploadToGitHub");
async function updateCategories(env, dateStr, category, fileName) {
  const path = `00_Raw/_categories.json`;
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  let categories = {};
  let sha;
  try {
    const res = await fetch(url + "?ref=main", {
      headers: {
        "Authorization": `token ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
      }
    }).then((r) => r.json());
    if (res.content) {
      categories = JSON.parse(atob(res.content.replace(/\n/g, "")));
      sha = res.sha;
    }
  } catch (e) {
  }
  if (!categories[dateStr]) categories[dateStr] = {};
  if (!categories[dateStr][category]) categories[dateStr][category] = [];
  if (!categories[dateStr][category].includes(fileName)) {
    categories[dateStr][category].push(fileName);
  }
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(categories, null, 2))));
  const body = {
    message: `[Telegram] \u{1F4C2} \uCE74\uD14C\uACE0\uB9AC \uC5C5\uB370\uC774\uD2B8: ${dateStr}/${category}`,
    content,
    branch: "main",
    ...sha ? { sha } : {}
  };
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    console.warn("Category update failed:", await response.text());
  }
}
__name(updateCategories, "updateCategories");
async function getGitHubFiles(env, dateStr) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/00_Raw/${dateStr}?ref=main`;
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `token ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
      }
    }).then((r) => r.json());
    return Array.isArray(res) ? res.filter((f) => f.type === "file") : [];
  } catch (e) {
    return [];
  }
}
__name(getGitHubFiles, "getGitHubFiles");
function getKSTDate() {
  const now = /* @__PURE__ */ new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1e3);
  return kst.toISOString().split("T")[0];
}
__name(getKSTDate, "getKSTDate");
function getKSTTimestamp() {
  const now = /* @__PURE__ */ new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1e3);
  return kst.toISOString().replace(/[-:T]/g, "").split(".")[0];
}
__name(getKSTTimestamp, "getKSTTimestamp");
function sanitizeFileName(name) {
  return name.replace(/[^\w가-힣.\-]/g, "_").replace(/__+/g, "_");
}
__name(sanitizeFileName, "sanitizeFileName");
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!\-]/g, "\\$&");
}
__name(escapeMarkdown, "escapeMarkdown");
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
__name(arrayBufferToBase64, "arrayBufferToBase64");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
