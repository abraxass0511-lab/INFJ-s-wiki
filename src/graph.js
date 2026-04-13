/**
 * P-Reinforce Knowledge Graph Manager
 * 지식 간 연결 관계를 Graph.json으로 관리하고,
 * 새 문서 추가 시 자동으로 관련 노드를 연결합니다.
 */

import CONFIG from './config.js';
import { readJSON, writeJSON, readText, findMarkdownFiles, extractWikiLinks, textSimilarity, parseFrontmatter } from './utils.js';

/**
 * 그래프 구조:
 * {
 *   nodes: { [id]: { title, path, category, tags, created, lastUpdated } },
 *   edges: [ { source, target, type, weight } ]
 * }
 */

const EDGE_TYPES = {
  WIKI_LINK:  'wiki_link',     // [[쌍방향 링크]]
  PARENT:     'parent',        // 상위 카테고리
  SIMILARITY: 'similarity',   // 유사도 기반 자동 연결
  USER_LINK:  'user_link',    // 사용자 수동 연결
};

/**
 * 현재 그래프 로드
 */
export async function loadGraph() {
  const graph = await readJSON(CONFIG.META_FILES.GRAPH, { nodes: {}, edges: [] });
  return graph;
}

/**
 * 그래프 저장
 */
export async function saveGraph(graph) {
  await writeJSON(CONFIG.META_FILES.GRAPH, graph);
}

/**
 * 새 노드 추가
 */
export async function addNode(graph, nodeData) {
  const { id, title, path: nodePath, category, tags = [], confidence } = nodeData;
  
  graph.nodes[id] = {
    title,
    path: nodePath,
    category,
    tags,
    confidence,
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    accessCount: 0,
  };
  
  return graph;
}

/**
 * 기존 노드 업데이트
 */
export async function updateNode(graph, id, updates) {
  if (graph.nodes[id]) {
    graph.nodes[id] = {
      ...graph.nodes[id],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
  }
  return graph;
}

/**
 * 엣지 추가 (중복 방지)
 */
export function addEdge(graph, source, target, type = EDGE_TYPES.SIMILARITY, weight = 1.0) {
  // 중복 체크
  const exists = graph.edges.some(e => 
    (e.source === source && e.target === target && e.type === type) ||
    (e.source === target && e.target === source && e.type === type)
  );
  
  if (!exists) {
    graph.edges.push({ source, target, type, weight, created: new Date().toISOString() });
  }
  
  return graph;
}

/**
 * 새 문서에 대해 최소 2개의 관련 지식을 자동 연결
 * (Karpathy Spec: "최소 2개 이상의 관련 지식을 링크")
 */
export async function autoLink(graph, newDocId, newTitle, newContent) {
  const connections = [];
  
  // 1. Wiki 링크에서 연결 추출
  const wikiLinks = extractWikiLinks(newContent);
  for (const linkTitle of wikiLinks) {
    const targetNode = Object.entries(graph.nodes).find(([, n]) => n.title === linkTitle);
    if (targetNode) {
      addEdge(graph, newDocId, targetNode[0], EDGE_TYPES.WIKI_LINK);
      connections.push({ target: linkTitle, type: 'wiki_link' });
    }
  }
  
  // 2. 유사도 기반 자동 연결
  const fullText = `${newTitle} ${newContent}`;
  const similarities = [];
  
  for (const [nodeId, node] of Object.entries(graph.nodes)) {
    if (nodeId === newDocId) continue;
    
    // 제목 기반 유사도
    const titleSim = textSimilarity(newTitle, node.title);
    // 태그 기반 유사도
    const tagOverlap = calculateTagOverlap(newContent, node.tags || []);
    // 카테고리 동일 보너스
    const catBonus = graph.nodes[newDocId]?.category === node.category ? 0.1 : 0;
    
    const combinedScore = titleSim * 0.5 + tagOverlap * 0.3 + catBonus;
    
    if (combinedScore > 0.1) {
      similarities.push({ nodeId, title: node.title, score: combinedScore });
    }
  }
  
  // 상위 N개 연결 (최소 2개 보장)
  const topSimilar = similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(2, Math.min(5, similarities.length)));
  
  for (const sim of topSimilar) {
    addEdge(graph, newDocId, sim.nodeId, EDGE_TYPES.SIMILARITY, sim.score);
    connections.push({ target: sim.title, type: 'similarity', score: sim.score });
  }
  
  return { graph, connections };
}

/**
 * 태그 오버랩 계산
 */
function calculateTagOverlap(content, tags) {
  if (tags.length === 0) return 0;
  const contentLower = content.toLowerCase();
  const matched = tags.filter(t => contentLower.includes(t.toLowerCase()));
  return matched.length / tags.length;
}

/**
 * 노드의 연결도 계산 (degree centrality)
 */
export function getNodeDegree(graph, nodeId) {
  return graph.edges.filter(e => e.source === nodeId || e.target === nodeId).length;
}

/**
 * 그래프 전체 연결도 점수
 */
export function getGraphConnectivity(graph) {
  const nodeCount = Object.keys(graph.nodes).length;
  if (nodeCount < 2) return 1.0;
  
  const maxEdges = nodeCount * (nodeCount - 1) / 2;
  const actualEdges = graph.edges.length;
  
  return Math.min(1.0, actualEdges / (maxEdges * 0.1)); // 10% 연결도면 만점
}

/**
 * 특정 노드의 이웃 노드 목록 반환
 */
export function getNeighbors(graph, nodeId) {
  const neighbors = [];
  for (const edge of graph.edges) {
    if (edge.source === nodeId) {
      neighbors.push({ id: edge.target, ...graph.nodes[edge.target], edgeType: edge.type });
    } else if (edge.target === nodeId) {
      neighbors.push({ id: edge.source, ...graph.nodes[edge.source], edgeType: edge.type });
    }
  }
  return neighbors;
}

/**
 * 전체 Wiki 폴더 스캔하여 그래프 재구축
 */
export async function rebuildGraph() {
  const graph = { nodes: {}, edges: [] };
  const allFiles = await findMarkdownFiles(CONFIG.PATHS.WIKI);
  
  for (const filePath of allFiles) {
    const content = await readText(filePath);
    const { data, content: body } = parseFrontmatter(content);
    
    if (data.id) {
      graph.nodes[data.id] = {
        title: extractTitle(body) || filePath.split(/[/\\]/).pop().replace('.md', ''),
        path: filePath,
        category: data.category || 'unknown',
        tags: data.tags || [],
        confidence: data.confidence_score || 0.5,
        created: data.created || new Date().toISOString(),
        lastUpdated: data.last_reinforced || new Date().toISOString(),
      };
    }
  }
  
  // 모든 문서간 wiki link 연결
  for (const filePath of allFiles) {
    const content = await readText(filePath);
    const { data, content: body } = parseFrontmatter(content);
    if (!data.id) continue;
    
    const links = extractWikiLinks(content);
    for (const linkTitle of links) {
      const target = Object.entries(graph.nodes).find(([, n]) => n.title === linkTitle);
      if (target) {
        addEdge(graph, data.id, target[0], EDGE_TYPES.WIKI_LINK);
      }
    }
  }
  
  await saveGraph(graph);
  return graph;
}

/**
 * 마크다운에서 H1 제목 추출
 */
function extractTitle(content) {
  const match = content.match(/^#\s+(?:\[\[)?(.*?)(?:\]\])?$/m);
  return match ? match[1] : null;
}

export default { loadGraph, saveGraph, addNode, addEdge, autoLink, rebuildGraph, getGraphConnectivity };
