const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');
test('iPhone HUD is compact safe-area aware and non-opaque',()=>{assert.match(src,/safe-area-inset-bottom/);assert.match(src,/<details class="ocean3dStatus"/);assert.match(src,/max-width:min\(72vw,260px\)/);assert.match(src,/rgba\(2,25,45,\.48\)/);assert.doesNotMatch(src,/ドラッグで見回す · ピンチで泳ぐ<\/em>/)});
test('locked milestone copy never exposes a future species',()=>{assert.match(src,/次の記念生物/);assert.match(src,/次は \?\?\?/);assert.doesNotMatch(src,/次の記念生物[^']*(カクレクマノミ|タコ|ウミガメ|サメ|イルカ|マンタ|ナポレオン|クジラ|シュモク|ジンベイ)/)});
test('earned milestone identity comes from the milestone source of truth',()=>{assert.match(src,/milestonePublicState/);assert.match(src,/latest\.label/);assert.doesNotMatch(src,/const REWARDS|カクレクマノミ|ジンベイザメ/)});
test('backdrop preserves aspect ratio instead of stretching',()=>{assert.match(src,/object-fit:cover/);assert.doesNotMatch(src,/object-fit:fill/)});
