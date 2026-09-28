import assert from 'node:assert/strict';
import { creatureProfile, ecosystemMaturity } from '../preview/ocean/renderer/src/creature-profiles.js';
import { selectQuality, maturityCaps } from '../preview/ocean/renderer/src/quality.js';

const fixtures=[0,10,30,100].map(count=>ecosystemMaturity(count));
assert.deepEqual(fixtures.map(x=>x.stage),['empty','young','growing','mature']);
assert.ok(fixtures.every((x,i,a)=>i===0||x.richness>=a[i-1].richness),'richness must grow monotonically');
assert.deepEqual(ecosystemMaturity(100),ecosystemMaturity(100),'same records must be deterministic');
const profiles=Array.from({length:18},(_,i)=>creatureProfile(i));
for(const key of ['silhouette','scaleBand','depthBand','speed','turnRadius','grouping','rarity'])assert.ok(profiles.every(p=>key in p),`missing ${key}`);
assert.ok(new Set(profiles.map(p=>p.silhouette)).size>=5,'mature ecosystem needs silhouette diversity');
assert.ok(new Set(profiles.map(p=>p.scaleBand)).size>=3,'mature ecosystem needs scale diversity');
const q=selectQuality({width:390,dpr:3,cores:6});
const young=maturityCaps(q,10),mature=maturityCaps(q,100);
assert.ok(mature.life>young.life&&mature.habitat>young.habitat,'maturity caps must grow');
assert.ok(mature.life<=q.maxLife&&mature.habitat<=q.maxHabitat,'iPhone caps must be bounded');
console.log('Ocean Phase 3 maturity contract passed');
