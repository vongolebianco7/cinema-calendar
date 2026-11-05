const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('now-playing source-status race retries from latest main and recollects data',()=>{
 const workflow=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/update-now-playing.yml'),'utf8');
 const marker='- name: Publish validated snapshot without a database dependency';
 const start=workflow.indexOf(marker);
 assert.notEqual(start,-1,'snapshot publishing step exists');
 const next=workflow.indexOf('\n      - name:',start+marker.length);
 const step=workflow.slice(start,next<0?undefined:next);
 assert.match(step,/for attempt in 1 2 3/,'publishing has a bounded retry count');
 assert.match(step,/git fetch origin main[\s\S]*git rebase origin\/main/,'each attempt rebases onto latest main');
 assert.match(step,/conflicts="\$\(git diff --name-only --diff-filter=U\)"[\s\S]*git rebase --abort/,'conflicts are inspected before recovery');
 assert.match(step,/if \[\[ "\$conflicts" != "data\/source-status\.json" \]\]/,'only the shared source-status snapshot is retried');
 assert.match(step,/git reset --hard origin\/main[\s\S]*python scripts\/update_now_playing\.py[\s\S]*node scripts\/source-status\.cjs/,'a retry starts from main and recollects before rebuilding status');
 assert.match(step,/git push origin HEAD:main/,'validated snapshots publish with a fast-forward push');
 assert.doesNotMatch(step,/git push --force|git pull --rebase/,'recovery never force-pushes or reuses a stale pull');
});
