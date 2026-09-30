const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');

function rewards(){const source=fs.readFileSync('preview/ocean/real-fish/milestone-rewards.js','utf8');const context={window:{}};vm.runInNewContext(source,context);return context.window.CinemapOceanMilestoneRewards;}
const photo=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');

test('Ocean milestone ecosystem starts at 25, rejects seahorse, and escalates through 1500',()=>{
  const api=rewards();
  const expected=[[25,'clownfish'],[50,'sea-turtle'],[100,'ocean-sunfish'],[150,'giant-octopus'],[200,'manta-ray'],[250,'dolphin'],[300,'hammerhead-shark'],[350,'large-shark'],[400,'dugong'],[450,'minke-whale'],[500,'orca'],[600,'humpback-whale'],[700,'whale-shark'],[1000,'blue-whale'],[1500,'blue-whale']];
  for(const [at,key] of expected)assert.ok(api.rewardsForCount(at).some(r=>r.key===key),`${at} films should unlock ${key}`);
  assert.equal(api.rewardsForCount(1500).some(r=>r.key==='seahorse'),false);
});

test('approved habitat populations recur without reintroducing seahorses',()=>{
  const api=rewards();
  assert.equal(api.rewardsForCount(225).filter(r=>r.key==='clownfish').length,3);
  assert.equal(api.rewardsForCount(450).filter(r=>r.key==='sea-turtle').length,3);
  assert.equal(api.rewardsForCount(1500).filter(r=>r.key==='seahorse').length,0);
  assert.ok(api.rewardsForCount(1500).length<=1500);
});

test('commemorative creatures render through one atlas crop while ordinary body and tail layers are hidden',()=>{
  assert.match(photo,/createCreature\?\.\(reward\.key,manifest\)/);
  assert.match(photo,/querySelectorAll\(':scope > img'\)/);
  assert.match(photo,/img\.style\.display='none'/);
  assert.match(photo,/creature\.style\.width='100%'/);
});
