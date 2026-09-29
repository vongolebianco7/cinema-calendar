import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'preview/ocean/assets/ocean-assets.manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];
const warnings = [];
const seen = new Set();

for (const category of manifest.requiredCategories || []) {
  if (!manifest.assetRules?.[category]) failures.push(`missing rule for ${category}`);
}

for (const asset of manifest.assets || []) {
  if (!asset.id || seen.has(asset.id)) failures.push(`invalid/duplicate id: ${asset.id}`);
  seen.add(asset.id);
  const rule = manifest.assetRules?.[asset.category];
  if (!rule) { failures.push(`${asset.id}: unknown category`); continue; }
  if (!asset.file || !asset.license || !asset.sourceUrl) failures.push(`${asset.id}: provenance incomplete`);
  if (asset.runtimeRemote === true) failures.push(`${asset.id}: runtime remote access forbidden`);
  const ext = path.extname(asset.file || '').slice(1).toLowerCase();
  if (!rule.format.includes(ext)) failures.push(`${asset.id}: format ${ext} not allowed`);
  if (asset.alpha !== rule.alpha) failures.push(`${asset.id}: alpha mismatch`);
  if (rule.atlas && asset.atlas !== true) failures.push(`${asset.id}: atlas required`);
  const [w,h] = asset.nativeSize || [0,0];
  if (!w || !h || Math.max(w,h) > rule.maxEdge) failures.push(`${asset.id}: native size outside budget`);
  const [rw,rh] = asset.displaySize?.max || [0,0];
  const dpr = manifest.viewport?.maxDpr || 2;
  if (!rw || !rh) failures.push(`${asset.id}: display size missing`);
  else {
    const needW = rw*dpr, needH = rh*dpr;
    if (w < needW || h < needH) failures.push(`${asset.id}: insufficient resolution at DPR ${dpr}`);
    if (w > needW*3 || h > needH*3) warnings.push(`${asset.id}: excessive native resolution`);
  }
}

const decoded = (manifest.assets || []).reduce((sum,a)=>sum+((a.nativeSize?.[0]||0)*(a.nativeSize?.[1]||0)*4),0);
if (decoded > manifest.budgets.decodedImageBytesMax) failures.push(`decoded image estimate ${decoded} exceeds budget`);
const report = {ok: failures.length===0, assets:(manifest.assets||[]).length, decodedImageBytesEstimate:decoded, failures, warnings};
fs.mkdirSync(path.join(root,'artifacts/ocean-quality'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/ocean-quality/assets.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if (!report.ok) process.exit(1);
