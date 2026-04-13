/**
 * P-Reinforce Dashboard Server
 * 지식 그래프 시각화 + 시스템 모니터링 웹 대시보드
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import CONFIG from '../config.js';
import { loadGraph, getGraphConnectivity } from '../graph.js';
import { readJSON, findMarkdownFiles, countFilesInDir } from '../utils.js';
import { computeTotalReward } from '../policy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3777;

async function getApiData() {
  const graph = await loadGraph();
  const nodeCount = Object.keys(graph.nodes).length;
  const edgeCount = graph.edges.length;
  const connectivity = getGraphConnectivity(graph);
  
  // 카테고리별 문서 수
  const categories = {};
  for (const [key, cat] of Object.entries(CONFIG.CATEGORIES)) {
    categories[cat.name] = await countFilesInDir(CONFIG.PATHS[key]);
  }
  
  // 보상 점수
  const avgConf = nodeCount > 0
    ? Object.values(graph.nodes).reduce((sum, n) => sum + (n.confidence || 0), 0) / nodeCount
    : 0;
  const reward = await computeTotalReward(avgConf, connectivity);
  
  // 최근 액션 로그
  const log = await readJSON(CONFIG.META_FILES.LOG, []);
  
  return {
    graph,
    stats: {
      nodeCount,
      edgeCount,
      connectivity: (connectivity * 100).toFixed(1),
      categories,
      reward,
      totalActions: log.length,
      recentActions: log.slice(-10).reverse(),
    },
  };
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const data = await getApiData();
    res.end(JSON.stringify(data));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
  }
});

server.listen(PORT, () => {
  console.log(`\n  🌐 P-Reinforce Dashboard: http://localhost:${PORT}\n`);
});

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>P-Reinforce — Knowledge Dashboard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --bg-primary: #0a0a0f;
    --bg-secondary: #12121a;
    --bg-card: #1a1a2e;
    --bg-card-hover: #1e1e35;
    --border: rgba(255,255,255,0.06);
    --text-primary: #e8e8f0;
    --text-secondary: #8888aa;
    --text-muted: #55556a;
    --accent-purple: #7c5cf5;
    --accent-blue: #4ea8ff;
    --accent-green: #34d399;
    --accent-amber: #fbbf24;
    --accent-rose: #fb7185;
    --accent-cyan: #22d3ee;
    --glow-purple: rgba(124,92,245,0.15);
    --glow-blue: rgba(78,168,255,0.15);
    --radius: 16px;
    --radius-sm: 10px;
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── Ambient Background ── */
  body::before {
    content: '';
    position: fixed;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(ellipse at 20% 50%, var(--glow-purple), transparent 50%),
                radial-gradient(ellipse at 80% 20%, var(--glow-blue), transparent 50%),
                radial-gradient(ellipse at 50% 80%, rgba(52,211,153,0.05), transparent 50%);
    animation: ambientDrift 20s ease-in-out infinite;
    z-index: -1;
    pointer-events: none;
  }

  @keyframes ambientDrift {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(2%, -1%) rotate(1deg); }
    66% { transform: translate(-1%, 2%) rotate(-1deg); }
  }

  /* ── Header ── */
  .header {
    padding: 32px 40px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(10,10,15,0.8);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 20px rgba(124,92,245,0.3);
    animation: logoGlow 3s ease-in-out infinite;
  }

  @keyframes logoGlow {
    0%, 100% { box-shadow: 0 4px 20px rgba(124,92,245,0.3); }
    50% { box-shadow: 0 4px 30px rgba(124,92,245,0.5); }
  }

  .header h1 {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(90deg, #fff, var(--accent-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header h1 span {
    font-size: 13px;
    font-weight: 400;
    display: block;
    background: none;
    -webkit-text-fill-color: var(--text-secondary);
    letter-spacing: 0;
  }

  .pulse-dot {
    width: 10px; height: 10px;
    background: var(--accent-green);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 8px var(--accent-green);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* ── Grid Layout ── */
  .dashboard {
    padding: 28px 40px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: min-content;
    gap: 20px;
  }

  /* ── Cards ── */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-purple), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .card:hover {
    background: var(--bg-card-hover);
    border-color: rgba(124,92,245,0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
  }

  .card:hover::before { opacity: 1; }

  .card-title {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-muted);
    margin-bottom: 12px;
    font-weight: 600;
  }

  .card-value {
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    font-family: 'JetBrains Mono', monospace;
  }

  .card-sub {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 6px;
  }

  /* ── Metric Colors ── */
  .metric-purple .card-value { color: var(--accent-purple); }
  .metric-blue .card-value { color: var(--accent-blue); }
  .metric-green .card-value { color: var(--accent-green); }
  .metric-amber .card-value { color: var(--accent-amber); }

  /* ── Graph Canvas ── */
  .card-graph {
    grid-column: span 3;
    grid-row: span 2;
    min-height: 420px;
    padding: 0;
    position: relative;
  }

  .card-graph .card-title {
    position: absolute;
    top: 20px; left: 24px;
    z-index: 10;
  }

  #graphCanvas {
    width: 100%;
    height: 100%;
    border-radius: var(--radius);
  }

  /* ── Category Bars ── */
  .card-categories { grid-column: span 1; }
  
  .cat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }

  .cat-item:last-child { border-bottom: none; }

  .cat-icon {
    font-size: 20px;
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
  }

  .cat-info { flex: 1; }
  .cat-name { font-size: 14px; font-weight: 600; }
  .cat-count { font-size: 12px; color: var(--text-secondary); }

  .cat-bar {
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    margin-top: 6px;
    overflow: hidden;
  }

  .cat-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 1s ease;
  }

  /* ── Activity Feed ── */
  .card-activity {
    grid-column: span 2;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }

  .activity-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
  }

  .activity-time {
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    flex-shrink: 0;
  }

  /* ── Reward Gauge ── */
  .card-reward {
    grid-column: span 2;
  }

  .reward-gauge {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
  }

  .gauge-ring {
    width: 100px; height: 100px;
    position: relative;
  }

  .gauge-ring svg {
    transform: rotate(-90deg);
  }

  .gauge-value {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 22px;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;
    color: var(--accent-purple);
  }

  .reward-breakdown {
    flex: 1;
  }

  .reward-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
  }

  .reward-label { color: var(--text-secondary); }
  .reward-val { font-family: 'JetBrains Mono', monospace; font-weight: 600; }

  /* ── Loading ── */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--text-muted);
  }

  .loading-spinner {
    width: 32px; height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--accent-purple);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 12px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Empty State ── */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-muted);
  }

  .empty-state .emoji { font-size: 48px; margin-bottom: 12px; }
  .empty-state p { font-size: 14px; line-height: 1.6; }

  /* ── Responsive ── */
  @media (max-width: 1200px) {
    .dashboard { grid-template-columns: repeat(2, 1fr); }
    .card-graph { grid-column: span 2; }
    .card-activity, .card-reward { grid-column: span 2; }
  }

  @media (max-width: 768px) {
    .dashboard { grid-template-columns: 1fr; padding: 16px; }
    .card-graph, .card-activity, .card-reward, .card-categories { grid-column: span 1; }
    .header { padding: 16px 20px; }
  }
</style>
</head>
<body>
  <header class="header">
    <div class="header-left">
      <div class="logo">🧠</div>
      <h1>P-Reinforce<span>The Autonomous Knowledge Gardener</span></h1>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <div class="pulse-dot"></div>
      <span style="font-size:12px;color:var(--text-secondary);">LIVE</span>
    </div>
  </header>

  <div class="dashboard" id="dashboard">
    <div class="loading">
      <div class="loading-spinner"></div>
      데이터 로딩 중...
    </div>
  </div>

<script>
const COLORS = {
  purple: '#7c5cf5',
  blue: '#4ea8ff',
  green: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  cyan: '#22d3ee',
};

const CAT_COLORS = {
  '🛠️ Projects':  COLORS.blue,
  '💡 Topics':    COLORS.purple,
  '⚖️ Decisions': COLORS.amber,
  '🚀 Skills':    COLORS.green,
};

async function loadData() {
  const res = await fetch('/api/data');
  return res.json();
}

function renderDashboard(data) {
  const { graph, stats } = data;
  const dash = document.getElementById('dashboard');

  dash.innerHTML = \`
    \${renderMetricCards(stats)}
    \${renderGraph(graph)}
    \${renderCategories(stats.categories)}
    \${renderReward(stats.reward)}
    \${renderActivity(stats.recentActions)}  
  \`;

  requestAnimationFrame(() => drawGraph(graph));
}

function renderMetricCards(stats) {
  return \`
    <div class="card metric-purple">
      <div class="card-title">Knowledge Nodes</div>
      <div class="card-value">\${stats.nodeCount}</div>
      <div class="card-sub">총 지식 문서</div>
    </div>
    <div class="card metric-blue">
      <div class="card-title">Graph Edges</div>
      <div class="card-value">\${stats.edgeCount}</div>
      <div class="card-sub">지식 간 연결</div>
    </div>
    <div class="card metric-green">
      <div class="card-title">Connectivity</div>
      <div class="card-value">\${stats.connectivity}%</div>
      <div class="card-sub">그래프 연결도</div>
    </div>
    <div class="card metric-amber">
      <div class="card-title">Total Actions</div>
      <div class="card-value">\${stats.totalActions}</div>
      <div class="card-sub">누적 처리 횟수</div>
    </div>
  \`;
}

function renderGraph(graph) {
  const nodes = Object.keys(graph.nodes);
  if (nodes.length === 0) {
    return \`
      <div class="card card-graph">
        <div class="card-title">🔗 Knowledge Graph</div>
        <div class="empty-state">
          <div class="emoji">🌱</div>
          <p>아직 지식이 없습니다.<br>00_Raw 폴더에 파일을 추가해보세요!</p>
        </div>
      </div>
    \`;
  }
  return \`
    <div class="card card-graph">
      <div class="card-title">🔗 Knowledge Graph</div>
      <canvas id="graphCanvas"></canvas>
    </div>
  \`;
}

function renderCategories(categories) {
  const max = Math.max(1, ...Object.values(categories));
  const items = Object.entries(categories).map(([name, count]) => {
    const icon = name.split(' ')[0];
    const label = name.split(' ').slice(1).join(' ');
    const pct = (count / max * 100).toFixed(0);
    const color = CAT_COLORS[name] || COLORS.purple;
    return \`
      <div class="cat-item">
        <div class="cat-icon">\${icon}</div>
        <div class="cat-info">
          <div class="cat-name">\${label}</div>
          <div class="cat-count">\${count}개 문서</div>
          <div class="cat-bar">
            <div class="cat-bar-fill" style="width:\${pct}%;background:\${color};"></div>
          </div>
        </div>
      </div>
    \`;
  }).join('');
  
  return \`
    <div class="card card-categories">
      <div class="card-title">📂 Categories</div>
      \${items || '<div class="cat-count">카테고리 없음</div>'}
    </div>
  \`;
}

function renderReward(reward) {
  const total = reward.total;
  const pct = Math.min(100, Math.max(0, total * 100));
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (pct / 100) * circumference;

  return \`
    <div class="card card-reward">
      <div class="card-title">🏆 RL Reward Score</div>
      <div class="reward-gauge">
        <div class="gauge-ring">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="\${COLORS.purple}" stroke-width="6"
              stroke-dasharray="\${circumference}" stroke-dashoffset="\${offset}"
              stroke-linecap="round" style="transition:stroke-dashoffset 1.5s ease;"/>
          </svg>
          <div class="gauge-value">\${total.toFixed(2)}</div>
        </div>
        <div class="reward-breakdown">
          <div class="reward-row">
            <span class="reward-label">w1 · 분류 정확도</span>
            <span class="reward-val" style="color:\${COLORS.blue}">\${reward.breakdown.categorization.toFixed(3)}</span>
          </div>
          <div class="reward-row">
            <span class="reward-label">w2 · 그래프 연결</span>
            <span class="reward-val" style="color:\${COLORS.green}">\${reward.breakdown.connectivity.toFixed(3)}</span>
          </div>
          <div class="reward-row">
            <span class="reward-label">w3 · 사용자 만족</span>
            <span class="reward-val" style="color:\${COLORS.amber}">\${reward.breakdown.satisfaction.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  \`;
}

function renderActivity(actions) {
  const dotColors = { praise: COLORS.green, correct: COLORS.amber, move: COLORS.rose, ignore: COLORS.blue };
  
  if (actions.length === 0) {
    return \`
      <div class="card card-activity">
        <div class="card-title">📜 Recent Activity</div>
        <div class="empty-state" style="padding:20px;">
          <p>아직 활동 기록이 없습니다.</p>
        </div>
      </div>
    \`;
  }

  const items = actions.map(a => \`
    <div class="activity-item">
      <div class="activity-dot" style="background:\${dotColors[a.type] || COLORS.purple}"></div>
      <div style="flex:1;">
        <strong>\${a.type}</strong>: \${a.docTitle || '-'}
        \${a.fromCategory ? \`<br><span style="color:var(--text-muted)">\${a.fromCategory} → \${a.toCategory || a.fromCategory}</span>\` : ''}
      </div>
      <span class="activity-time">\${(a.timestamp || '').slice(0, 10)}</span>
    </div>
  \`).join('');

  return \`
    <div class="card card-activity">
      <div class="card-title">📜 Recent Activity</div>
      \${items}
    </div>
  \`;
}

// ── Force-directed Graph Visualization ──
function drawGraph(graph) {
  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const W = rect.width, H = rect.height;

  const nodeIds = Object.keys(graph.nodes);
  if (nodeIds.length === 0) return;

  // Initialize positions
  const positions = {};
  nodeIds.forEach((id, i) => {
    const angle = (i / nodeIds.length) * Math.PI * 2;
    const r = Math.min(W, H) * 0.3;
    positions[id] = {
      x: W/2 + Math.cos(angle) * r + (Math.random() - 0.5) * 50,
      y: H/2 + Math.sin(angle) * r + (Math.random() - 0.5) * 50,
      vx: 0, vy: 0,
    };
  });

  function simulate() {
    // Repulsion
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const a = positions[nodeIds[i]], b = positions[nodeIds[j]];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
        const force = 3000 / (dist * dist);
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Attraction (edges)
    for (const edge of graph.edges) {
      const a = positions[edge.source], b = positions[edge.target];
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const force = (dist - 120) * 0.01;
      const fx = (dx / Math.max(1, dist)) * force;
      const fy = (dy / Math.max(1, dist)) * force;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // Center gravity
    for (const id of nodeIds) {
      const p = positions[id];
      p.vx += (W/2 - p.x) * 0.001;
      p.vy += (H/2 - p.y) * 0.001;
      p.vx *= 0.85; p.vy *= 0.85;
      p.x += p.vx; p.y += p.vy;
      p.x = Math.max(40, Math.min(W - 40, p.x));
      p.y = Math.max(60, Math.min(H - 20, p.y));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Edges
    for (const edge of graph.edges) {
      const a = positions[edge.source], b = positions[edge.target];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(124, 92, 245, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Nodes
    for (const id of nodeIds) {
      const p = positions[id];
      const node = graph.nodes[id];
      const color = CAT_COLORS[node.category] || COLORS.purple;

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = color + '20';
      ctx.fill();

      // Node
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      const label = (node.title || id).slice(0, 20);
      ctx.fillText(label, p.x, p.y + 22);
    }
  }

  let frame = 0;
  function loop() {
    simulate();
    draw();
    frame++;
    if (frame < 300) requestAnimationFrame(loop);
  }
  loop();
}

// ── Init ──
loadData().then(renderDashboard);
setInterval(() => loadData().then(renderDashboard), 15000);
</script>
</body>
</html>`;
