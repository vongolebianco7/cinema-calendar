'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const workflow=fs.readFileSync('.github/workflows/completeness-scorecard.yml','utf8');

test('Phase A scorecard failures expose their comparison details in the job log',()=>{
 const step=workflow.slice(workflow.indexOf('- name: Enforce Phase A comparison'));
 assert.match(step,/if: github\.event_name == 'pull_request' && steps\.phase_a\.outcome == 'failure'/);
 assert.match(step,/cat artifacts\/completeness\/score\.md/);
 assert.match(step,/run: \|[\s\S]*cat artifacts\/completeness\/score\.md[\s\S]*exit 1/);
});
