import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
if (!input) throw new Error('usage: node evaluate-performance.mjs metrics.json');
const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'preview/ocean/assets/ocean-assets.manifest.json'),'utf8'));
const metrics=JSON.parse(fs.readFileSync(input,'utf8'));
const b=manifest.budgets;
const failures=[], warnings=[];
for (const state of [0,30,100,300,500]) {
  const m=metrics.states?.[state];
  if (!m) { failures.push(`state ${state}: missing`); continue; }
  if (m.medianFps < b.medianFpsFail) failures.push(`state ${state}: fps ${m.medianFps} < ${b.medianFpsFail}`);
  else if (m.medianFps < b.medianFpsPass) warnings.push(`state ${state}: fps ${m.medianFps} needs improvement`);
  if (m.readyMs > b.readyMsMax) failures.push(`state ${state}: ready ${m.readyMs}ms`);
  if (m.blank || m.jsErrors > 0 || m.contextLosses > 0) failures.push(`state ${state}: stability failure`);
}
const baseline=metrics.baseline;
if (baseline && metrics.states?.[100]) {
  const cur=metrics.states[100];
  const fpsDrop=((baseline.medianFps-cur.medianFps)/baseline.medianFps)*100;
  if (fpsDrop>b.fpsRegressionPercentMax) failures.push(`fps regression ${fpsDrop.toFixed(1)}%`);
}
const report={ok:failures.length===0,failures,warnings,states:metrics.states};
fs.mkdirSync(path.join(root,'artifacts/ocean-quality'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/ocean-quality/performance.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(!report.ok)process.exit(1);
