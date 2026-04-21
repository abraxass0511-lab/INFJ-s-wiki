/**
 * P-Reinforce Git Manager
 * 모든 변경사항을 자동으로 Git에 커밋하고 Push합니다.
 * 
 * Git Protocol:
 *   Stage: git add .
 *   Commit: git commit -m "[P-Reinforce] {{Action_Summary}}"
 *   Push: git push origin main
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import CONFIG from './config.js';

const execAsync = promisify(exec);
const CWD = CONFIG.ROOT;

/**
 * Git 명령 실행 래퍼
 */
async function git(command) {
  try {
    const { stdout, stderr } = await execAsync(`git ${command}`, { 
      cwd: CWD,
      encoding: 'utf-8',
    });
    return { success: true, output: stdout.trim(), error: stderr.trim() };
  } catch (err) {
    return { success: false, output: '', error: err.message };
  }
}

/**
 * Git 초기화 (최초 한번)
 */
export async function initGit() {
  const status = await git('status');
  if (!status.success) {
    // git init
    const init = await git('init');
    if (!init.success) return { success: false, error: init.error };
    
    // initial commit
    await git('add .');
    const commit = await git(`commit -m "${CONFIG.GIT.COMMIT_PREFIX} Initial: 프로젝트 구조 초기화"`);
    return { success: true, message: 'Git 저장소 초기화 완료', commit: commit.output };
  }
  return { success: true, message: 'Git 저장소 이미 존재' };
}

/**
 * 변경사항 스테이징 + 커밋
 * @param {string} actionSummary - 커밋 메시지 요약
 * @returns {{ success: boolean, commitHash?: string, error?: string }}
 */
export async function commitChanges(actionSummary) {
  // Stage
  const add = await git('add .');
  if (!add.success) {
    return { success: false, error: `Stage 실패: ${add.error}` };
  }
  
  // 변경사항 확인
  const diff = await git('diff --cached --stat');
  if (!diff.output && !diff.error) {
    return { success: true, message: '변경사항 없음', commitHash: null };
  }
  
  // Commit
  const message = `${CONFIG.GIT.COMMIT_PREFIX} ${actionSummary}`;
  const commit = await git(`commit -m "${message}"`);
  
  if (!commit.success && !commit.output.includes('nothing to commit')) {
    return { success: false, error: `Commit 실패: ${commit.error}` };
  }
  
  // 커밋 해시 추출
  const hashResult = await git('rev-parse --short HEAD');
  const commitHash = hashResult.success ? hashResult.output : null;
  
  return { success: true, commitHash, message: `커밋 완료: ${commitHash}` };
}

/**
 * Push to remote
 */
export async function push() {
  const result = await git(`push origin ${CONFIG.GIT.BRANCH}`);
  return result;
}

/**
 * 전체 프로세스: Stage → Commit → Push
 */
export async function syncToGitHub(actionSummary) {
  const commitResult = await commitChanges(actionSummary);
  if (!commitResult.success) return commitResult;
  if (!commitResult.commitHash) return { ...commitResult, pushed: false };
  
  const pushResult = await push();
  return {
    success: true,
    commitHash: commitResult.commitHash,
    pushed: pushResult.success,
    pushError: pushResult.success ? null : pushResult.error,
  };
}

/**
 * 최근 커밋 로그 조회
 */
export async function getRecentCommits(count = 10) {
  const result = await git(`log --oneline -${count}`);
  if (!result.success) return [];
  return result.output.split('\n').filter(Boolean).map(line => {
    const [hash, ...rest] = line.split(' ');
    return { hash, message: rest.join(' ') };
  });
}

/**
 * 현재 상태 확인
 */
export async function getStatus() {
  const status = await git('status --porcelain');
  const branch = await git('branch --show-current');
  const remote = await git('remote -v');
  
  return {
    branch: branch.output || 'main',
    hasRemote: remote.output.includes('origin'),
    changes: status.output ? status.output.split('\n').filter(Boolean).length : 0,
    changeDetails: status.output || 'Clean',
  };
}

export default { initGit, commitChanges, push, syncToGitHub, getRecentCommits, getStatus };
