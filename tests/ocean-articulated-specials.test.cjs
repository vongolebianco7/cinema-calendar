const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));
const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
const population=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');

test('AI-like swimmers use continuous deformation with species-correct tail side',()=>{
  const expected={'manta-ray':'wing-flex',dolphin:'tail-flex-right',dugong:'tail-flex-right','minke-whale':'tail-flex-left',orca:'tail-flex-left','humpback-whale':'tail-flex-left','whale-shark':'tail-flex-left','blue-whale':'tail-flex-left'};
  for(const [key,profile] of Object.entries(expected)){const spec=manifest.species[key];assert.ok(spec.asset,key+' needs a direct source image');assert.equal(spec.deformation?.profile,profile,key+' needs the intended deformation profile');assert.ok(Number(spec.deformation?.amplitude)>0);assert.ok(Number(spec.deformation?.period)>0);}
  assert.match(atlas,/createDeformedCreature/);assert.match(atlas,/drawImage/);assert.match(atlas,/requestAnimationFrame/);assert.match(atlas,/spec\.deformation/);assert.match(atlas,/if\(spec\.asset&&spec\.deformation\)return createDeformedCreature/);
});

test('dolphin bends only at its right-side tail and removes baked ocean background before deformation',()=>{
  const dolphin=manifest.species.dolphin;assert.equal(dolphin.deformation.profile,'tail-flex-right');assert.ok(Number(dolphin.deformation.flexSpan)<=0.3);assert.equal(dolphin.deformation.chromaKey,true);assert.match(atlas,/createKeyedSource/);
});

test('other direct-image swimmers use automatic background isolation before deformation',()=>{
  const keys=['manta-ray','dugong','minke-whale','orca','humpback-whale','whale-shark','blue-whale'];for(const key of keys)assert.equal(manifest.species[key].deformation?.chromaKey,'auto',key+' should use automatic background isolation');assert.match(atlas,/chromaKey==='auto'/);
});

test('deformation uses overlapping vertical slices so the animal stays visually continuous',()=>{assert.match(atlas,/const slices=/);assert.match(atlas,/overlap=/);assert.match(atlas,/sliceW/);assert.match(atlas,/tailRamp/);});

test('large whales and whale shark keep their direct HQ transparent sprites',()=>{
  const expected={'minke-whale':'assets/milestone-minke-whale-hq.webp',orca:'assets/milestone-orca-hq.webp','humpback-whale':'assets/milestone-humpback-whale-hq.webp','whale-shark':'assets/milestone-whale-shark-hq.webp','blue-whale':'assets/milestone-blue-whale-hq.webp'};for(const [key,asset] of Object.entries(expected)){assert.equal(manifest.species[key].asset,asset);assert.equal(manifest.species[key].assetAspect,3)}
});

test('manta dolphin and dugong have readable iPhone size caps',()=>{assert.match(population,/'manta-ray':26/);assert.match(population,/dolphin:20/);assert.match(population,/dugong:20/);});

test('active milestone swimmers use generated directional short-step routes instead of in-place or linear motion',()=>{assert.match(swim,/function buildPulseRoute\(/);assert.match(swim,/const PULSE_ROUTE_SPAN_VW=50/);assert.match(swim,/buildPulseRoute\('milestoneForwardNatural',-PULSE_ROUTE_SPAN_VW\/2,PULSE_ROUTE_SPAN_VW\/2/);assert.match(swim,/buildPulseRoute\('milestoneReverseNatural',PULSE_ROUTE_SPAN_VW\/2,-PULSE_ROUTE_SPAN_VW\/2/);assert.doesNotMatch(swim,/node\.style\.left='50%'/);assert.doesNotMatch(swim,/animation-timing-function:linear!important/);});

test('dolphin deformation stays within the tail-most zone',()=>{const dolphin=manifest.species.dolphin;assert.ok(Number(dolphin.deformation?.flexSpan)>0);assert.ok(Number(dolphin.deformation.flexSpan)<=0.3);assert.match(atlas,/function tailRamp\(profile,u,flexSpan/);});

test('special creature strokes are tiny and unhurried without generating an unparseably huge keyframe sheet',()=>{const steps=Number(swim.match(/const PULSE_STEPS=(\d+)/)?.[1]||0),factor=Number(swim.match(/const PULSE_ROUTE_DURATION_FACTOR=(\d+)/)?.[1]||0),span=Number(swim.match(/const PULSE_ROUTE_SPAN_VW=(\d+)/)?.[1]||0);assert.ok(steps>=180&&steps<=260,`PULSE_STEPS must stay compact, got ${steps}`);assert.ok(factor>=10&&factor<=20,`route duration factor must stay unhurried, got ${factor}`);assert.ok(span/steps<=.3,`each propulsion stroke must stay <=0.3vw, got ${span/steps}vw`);assert.match(swim,/--swim-pulse-duration/);});

test('special creatures are fully opaque even when an ordinary depth node is recycled',()=>{assert.match(swim,/\[data-commemorative\]\{opacity:1!important\}/);assert.match(swim,/node\.style\.opacity='1'/);for(const spec of Object.values(manifest.species)){if(spec.deformation)assert.equal(spec.deformation.opaqueBody,true);}});

test('dolphin dugong and generated hammerhead swim head-first',()=>{assert.match(swim,/dolphin:\{[^}]*direction:'reverse'/);assert.match(swim,/dugong:\{[^}]*direction:'reverse'/);assert.match(swim,/'hammerhead-shark':\{[^}]*direction:'reverse'/);assert.equal(manifest.species['hammerhead-shark'].deformation.profile,'tail-flex-right');});

test('sharks use direct generated HQ assets with moving tails',()=>{for(const key of ['hammerhead-shark','large-shark']){const spec=manifest.species[key];assert.ok(spec.asset);assert.match(spec.asset,/hq/);assert.match(spec.deformation?.profile||'',/tail-flex-/);assert.ok(Number(spec.deformation?.flexSpan)>0&&Number(spec.deformation?.flexSpan)<=.4);assert.ok(fs.existsSync('preview/ocean/real-fish/'+spec.asset),spec.asset+' must exist');}});

test('turtle flippers and octopus tentacles use cleaned direct assets and dedicated motion profiles',()=>{for(const key of ['sea-turtle','giant-octopus']){const spec=manifest.species[key];assert.match(spec.asset,/assets\/milestone-.*-hq\.webp/);assert.ok(fs.existsSync('preview/ocean/real-fish/'+spec.asset),spec.asset+' must exist');}assert.equal(manifest.species['sea-turtle'].deformation?.profile,'flipper-flex');assert.equal(manifest.species['giant-octopus'].deformation?.profile,'tentacle-wave');assert.ok(Number(manifest.species['giant-octopus'].presentationScale)>=2);assert.match(atlas,/flipper-flex/);assert.match(atlas,/tentacle-wave/);});

test('low quality vector/render ordinary fish are replaced at runtime with photo assets',()=>{assert.match(swim,/ORDINARY_ASSET_UPGRADES/);for(const bad of ['species-blue-tang.svg','species-damselfish.svg','species-firefish.svg','species-lyretail-anthias.svg','species-six-line-wrasse.svg','species-threadfin-butterflyfish.svg','species-filefish.webp','species-stingray.webp'])assert.match(swim,new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.match(swim,/upgradeOrdinaryAssets/);assert.match(swim,/data-asset-upgraded/);});

test('keyed milestone bodies are hardened to opaque alpha after background removal',()=>{assert.match(atlas,/opaqueBody/);assert.match(atlas,/data\[i\+3\]=data\[i\+3\]>28\?255:0/);});

test('deformed milestone creatures share one scheduler and pause when offscreen or hidden',()=>{
  assert.match(atlas,/const deformationRegistry=new Set\(\)/);
  assert.match(atlas,/function ensureDeformationScheduler\(/);
  assert.match(atlas,/function schedulerTick\(/);
  assert.match(atlas,/IntersectionObserver/);
  assert.match(atlas,/document\.hidden/);
  assert.match(atlas,/entry\.visible/);
  const rafCalls=(atlas.match(/requestAnimationFrame\(/g)||[]).length;
  assert.ok(rafCalls<=2,`milestone deformation should use a shared RAF, found ${rafCalls}`);
});

test('deformation canvas resolution and slice work are capped for iPhone performance',()=>{
  assert.match(atlas,/DEFORMATION_DPR_CAP=1\.25/);
  assert.match(atlas,/DEFORMATION_WIDTH_CAP=520/);
  assert.match(atlas,/function ensureCanvasResolution\(/);
  assert.match(atlas,/function sliceCountForWidth\(/);
  assert.doesNotMatch(atlas,/canvas\.width=600;canvas\.height=240/);
});

test('pass-through megafauna are staggered across offscreen base columns and wider vertical lanes',()=>{
  assert.match(swim,/const PASS_THROUGH_BASE_X=\[-60,-20,20,60,100,140\]/);
  assert.match(swim,/const PASS_THROUGH_LANES=\[-20,-7,7,20\]/);
  assert.match(swim,/baseX=PASS_THROUGH_BASE_X\[/);
  assert.match(swim,/node\.style\.left=baseX\+'%'/);
});
