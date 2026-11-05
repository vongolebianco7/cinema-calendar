'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflowPath = path.resolve(__dirname, '../.github/workflows/development-stall-watchdog.yml');

function loadWorkflowScript() {
  const lines = fs.readFileSync(workflowPath, 'utf8').split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === 'script: |');
  assert.notEqual(start, -1, 'watchdog workflow must keep an executable GitHub Script block');
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && !line.startsWith('            ')) break;
    body.push(line.startsWith('            ') ? line.slice(12) : '');
  }
  return body.join('\n');
}

async function runWatchdog({ now, prs = [], runsBySha = {}, checkpoint, comments = [] }) {
  const summary = [];
  const postedComments = [];
  const warnings = [];
  const rest = {
    pulls: { list: () => {} },
    actions: { listWorkflowRunsForRepo: () => {} },
    repos: { getContent: () => {} },
    issues: { listComments: () => {}, createComment: () => {} }
  };
  const datasets = new Map([
    [rest.pulls.list, () => prs],
    [rest.actions.listWorkflowRunsForRepo, params => runsBySha[params.head_sha] || []],
    [rest.issues.listComments, () => comments]
  ]);
  const github = {
    rest,
    paginate: async (method, params) => datasets.has(method) ? datasets.get(method)(params || {}) : [],
    rest: {
      ...rest,
      repos: { getContent: async () => ({ data: { content: Buffer.from(JSON.stringify(checkpoint)).toString('base64') } }) },
      issues: {
        ...rest.issues,
        createComment: async input => postedComments.push(input.body)
      }
    }
  };
  const core = {
    summary: {
      addHeading(value) { summary.push(value); return this; },
      addRaw(value) { summary.push(value); return this; },
      async write() { return undefined; }
    },
    warning(value) { warnings.push(value); }
  };
  const FrozenDate = { now: () => now, parse: Date.parse };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction('github', 'context', 'core', 'Date', loadWorkflowScript())(
    github, { repo: { owner: 'owner', repo: 'repo' } }, core, FrozenDate
  );
  return { summary: summary.join('\n'), postedComments, warnings };
}

const time = value => Date.parse(value);
const pr = (number, sha, updatedAt, draft = false) => ({ number, head: { sha }, updated_at: updatedAt, draft });
const run = (sha, event, status, conclusion, createdAt, updatedAt = createdAt) => ({
  head_sha: sha, event, status, conclusion, created_at: createdAt, updated_at: updatedAt
});

test('watchdog flags exact-head PR checks running for an hour and stale failed PR checks', async () => {
  const now = time('2026-11-06T00:00:00Z');
  const result = await runWatchdog({
    now,
    prs: [
      pr(10, 'pending-sha', '2026-11-05T22:45:00Z'),
      pr(11, 'failed-sha', '2026-11-05T20:00:00Z'),
      pr(12, 'healthy-sha', '2026-11-05T20:00:00Z')
    ],
    runsBySha: {
      'pending-sha': [run('pending-sha', 'pull_request', 'in_progress', null, '2026-11-05T22:55:00Z')],
      'failed-sha': [run('failed-sha', 'pull_request', 'completed', 'failure', '2026-11-05T19:00:00Z')],
      'healthy-sha': [run('healthy-sha', 'pull_request', 'completed', 'success', '2026-11-05T23:00:00Z')]
    },
    checkpoint: { updated_at: '2026-11-05T23:30:00Z', status: 'in_progress' }
  });

  assert.match(result.summary, /PR #10: 1 running, 0 failed\/cancelled, 1 pending >=60m/);
  assert.match(result.summary, /PR #11: 0 running, 1 failed\/cancelled/);
  assert.match(result.summary, /PR #12: 0 running, 0 failed\/cancelled/);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /PR #10/);
  assert.equal(result.postedComments.length, 1);
});

test('watchdog ignores non-PR, wrong-head, draft, and recent checks without warning', async () => {
  const result = await runWatchdog({
    now: time('2026-11-06T00:00:00Z'),
    prs: [
      pr(20, 'current-sha', '2026-11-05T23:50:00Z'),
      pr(21, 'draft-sha', '2026-11-05T20:00:00Z', true)
    ],
    runsBySha: {
      'current-sha': [
        run('older-sha', 'pull_request', 'completed', 'failure', '2026-11-05T18:00:00Z'),
        run('current-sha', 'push', 'completed', 'failure', '2026-11-05T18:00:00Z'),
        run('current-sha', 'pull_request', 'in_progress', null, '2026-11-05T23:55:00Z')
      ],
      'draft-sha': [run('draft-sha', 'pull_request', 'completed', 'failure', '2026-11-05T18:00:00Z')]
    },
    checkpoint: { updated_at: '2026-11-05T23:55:00Z', status: 'in_progress' }
  });

  assert.equal(result.warnings.length, 0);
  assert.equal(result.postedComments.length, 0);
  assert.match(result.summary, /PR #20: 1 running, 0 failed\/cancelled, 0 pending >=60m/);
  assert.doesNotMatch(result.summary, /PR #21:/);
});

test('watchdog alerts on an old active checkpoint and suppresses the same recent alert', async () => {
  const now = time('2026-11-06T00:00:00Z');
  const initial = await runWatchdog({
    now,
    checkpoint: { updated_at: '2026-11-05T21:50:00Z', status: 'in_progress' }
  });
  assert.equal(initial.warnings.length, 1);
  assert.match(initial.warnings[0], /checkpoint has not advanced for 130 minutes/);
  assert.equal(initial.postedComments.length, 1);

  const signature = initial.warnings.map(value => value.replace(/\d+ minutes/g, 'N minutes')).join('|');
  const duplicate = await runWatchdog({
    now,
    checkpoint: { updated_at: '2026-11-05T21:50:00Z', status: 'in_progress' },
    comments: [{
      body: `<!-- cinelva-stall-watchdog -->\n<!-- signature:${signature} -->`,
      user: { type: 'Bot' },
      created_at: '2026-11-05T23:30:00Z'
    }]
  });
  assert.equal(duplicate.warnings.length, 0, 'a suppressed duplicate should not emit a repeated Actions warning');
  assert.match(duplicate.summary, /checkpoint has not advanced/);
  assert.equal(duplicate.postedComments.length, 0);
});
