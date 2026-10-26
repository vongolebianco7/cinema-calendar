// Run: node tests/streaming-compare-invariants.cjs
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'streaming-compare.html'), 'utf8');
const must = (...fragments) => fragments.forEach(t => assert.ok(html.includes(t), 'missing: ' + t));
must('月額料金（税込）', '広告の有無', '同時視聴可能台数', '作成可能プロフィール数',
  '家族共有', '登録可能端末数', 'ブックマークした映画', '好きな監督の映画',
  '好きな映画賞の映画', 'サブスク乗り換え時の増減', 'billingCycle', 'yearlyFees', 'Disney+', 'Lemino', 'Prime Video', 'WOWOW');
must("const verified={", "const monthlyFees={'Netflix 広告つき':890",
  "document.getElementById('sourceDialog').showModal()", '確認中', '未集計');
assert.match(html, /現在の配信カレンダーは配信開始情報/);
assert.match(html, /ライセンス状況・プラン・地域・更新日/);
assert.doesNotMatch(html, /movies\.length\s*\/\s*services\.length/);
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(script, 'inline application script missing');
new (require('node:vm').Script)(script[1], {filename:'streaming-compare.html'});
console.log('streaming compare invariant checks passed');

// Local bookmark keys can be internal Cinelva IDs, not TMDB IDs.
// Prevent accidental cross-title matches when joining with availability snapshots.
assert.match(html, /item\\.tmdbId\\?\\?item\\.tmdb_id/);
assert.doesNotMatch(html, /\\.map\\(\\(\\[id\\]\\)\\)=>Number\\(id\\)\\)/);
