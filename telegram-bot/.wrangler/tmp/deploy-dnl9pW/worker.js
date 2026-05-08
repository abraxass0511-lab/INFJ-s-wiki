var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
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
    return new Response("Not Found", { status: 404 });
  }
};
async function handleTelegramUpdate(update, env) {
  const message = update.message;
  if (!message) return;
  const chatId = message.chat.id;
  const text = message.text || "";
  const caption = message.caption || "";
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
      '\u{1F9E0} *\uC704\uD0A4 \uC5D0\uC774\uC804\uD2B8 \uBD07*\n\n\u{1F4F8} \uC774\uBBF8\uC9C0\uB97C \uBCF4\uB0B4\uBA74 \uC790\uB3D9\uC73C\uB85C:\n  1\\. GitHub\uC5D0 \uC5C5\uB85C\uB4DC\n  2\\. Gemini AI\uAC00 \uBD84\uC11D\n  3\\. MD \uBB38\uC11C \uC0DD\uC131\n  4\\. \uCE98\uB9B0\uB354\uC5D0 \uBC18\uC601\n\n\u{1F4DD} *\uC0AC\uC6A9\uBC95:*\n\u2022 \uC774\uBBF8\uC9C0\uB9CC \uBCF4\uB0B4\uAE30 \u2192 "AI\uACF5\uBD80" \uCE74\uD14C\uACE0\uB9AC\n\u2022 \uC774\uBBF8\uC9C0 \\+ \uCEA1\uC158 \u2192 \uCEA1\uC158\uC774 \uCE74\uD14C\uACE0\uB9AC\n  \uC608: `\uD68C\uC0AC`, `\uC720\uD29C\uBE0C`, `\uAE30\uD0C0`\n\n\u{1F194} Your Chat ID: `' + chatId + "`\n\uC774 ID\uB97C ALLOWED\\_CHAT\\_IDS\uC5D0 \uCD94\uAC00\uD558\uC138\uC694",
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
    await handleImageUpload(message, env, chatId, caption);
    return;
  }
  await sendTelegram(env, chatId, "\u{1F4F8} \uC774\uBBF8\uC9C0\uB97C \uBCF4\uB0B4\uC8FC\uC138\uC694! \uC790\uB3D9\uC73C\uB85C \uC704\uD0A4\uC5D0 \uB4F1\uB85D\uB429\uB2C8\uB2E4.");
}
__name(handleTelegramUpdate, "handleTelegramUpdate");
async function handleImageUpload(message, env, chatId, caption) {
  const category = caption.trim() || "AI\uACF5\uBD80";
  const today = getKSTDate();
  await sendTelegram(env, chatId, `\u23F3 \uC5C5\uB85C\uB4DC \uC2DC\uC791... (\u{1F4C1} ${today} / \u{1F4C2} ${category})`);
  try {
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
    const fileData = await downloadTelegramFile(env, fileId);
    if (!fileData) {
      await sendTelegram(env, chatId, "\u274C \uD30C\uC77C \uB2E4\uC6B4\uB85C\uB4DC \uC2E4\uD328");
      return;
    }
    const githubPath = `00_Raw/${today}/${fileName}`;
    await uploadToGitHub(env, githubPath, fileData, `[Telegram] \u{1F4F8} ${fileName} \uC5C5\uB85C\uB4DC`);
    await updateCategories(env, today, category, fileName);
    const fileSize = (fileData.byteLength / 1024).toFixed(1);
    await sendTelegram(
      env,
      chatId,
      `\u2705 *\uC5C5\uB85C\uB4DC \uC644\uB8CC\\!*

\u{1F4C1} \uACBD\uB85C: \`00_Raw/${today}/${fileName}\`
\u{1F4C2} \uCE74\uD14C\uACE0\uB9AC: ${escapeMarkdown(category)}
\u{1F4E6} \uD06C\uAE30: ${fileSize}KB

\u{1F916} Gemini OCR \uCC98\uB9AC\uAC00 \uC790\uB3D9\uC73C\uB85C \uC2DC\uC791\uB429\uB2C8\uB2E4\\.
\u{1F4C4} MD \uD30C\uC77C\uC774 \uACE7 \uC0DD\uC131\uB429\uB2C8\uB2E4\\.`,
      "MarkdownV2"
    );
  } catch (e) {
    console.error("Upload error:", e);
    await sendTelegram(env, chatId, `\u274C \uC5C5\uB85C\uB4DC \uC2E4\uD328: ${e.message}`);
  }
}
__name(handleImageUpload, "handleImageUpload");
async function sendTelegram(env, chatId, text, parseMode) {
  const body = { chat_id: chatId, text };
  if (parseMode) body.parse_mode = parseMode;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
__name(sendTelegram, "sendTelegram");
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
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
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
