const fs=require('fs');
const assert=require('assert');
assert.ok(fs.existsSync('js/screening-model-v7.js'),'shared screening model must exist');
const model=require('../js/screening-model-v7.js');
const evidence=JSON.parse(fs.readFileSync('data/screening_format_evidence.json','utf8'));
const score=(movie)=>model.scoreMovie(movie,evidence);
const by=(rows,key)=>rows.find(x=>x.key===key);

function movie(title,year,extra={}){return {title,year,genres:[],overview:'',...extra}}

let r=score(movie('The Dark Knight',2008,{id:155,genres:['Action','Crime','Drama'],overview:'Batman confronts the Joker amid chases, vehicles, explosions and city-scale action.'}));
assert.equal(by(r,'imax').score,5,'The Dark Knight IMAX must be 5 with official IMAX capture/expanded presentation evidence');
assert.ok(by(r,'standard').score>=3&&by(r,'standard').score<=4,'standard must stay 3-4');

r=score(movie('The Batman',2022,{id:414906,genres:['Crime','Mystery','Thriller'],overview:'A dark rain-soaked Gotham detective story with a major Batmobile chase, explosions, deep bass, score and night cinematography.'}));
assert.equal(by(r,'dolby_cinema').score,5,'The Batman Dolby Cinema must be 5 when official Vision+Atmos and strong picture/audio traits align');
assert.equal(by(r,'imax').score,3,'The Batman IMAX should keep large-screen/audio value but cap at 3 without verified expanded ratio');
assert.equal(by(r,'motion').score,4,'The Batman 4DX/MX4D should recognize the major Batmobile set piece and physical effects');

r=score(movie('Nomadland',2020,{id:581734,genres:['Drama'],overview:'A quiet contemplative journey through vast American landscapes, open roads, deserts and wide horizons.'}));
assert.equal(by(r,'motion').score,2,'Nomadland motion should stay low');
assert.equal(by(r,'screenx').score,4,'Nomadland ScreenX should recognize spatial breadth despite quiet pacing');

r=score(movie('THE FIRST SLAM DUNK',2022,{id:783675,genres:['Animation','Drama','Sport'],overview:'A basketball game driven by sprinting, jumping, collisions, ball impacts, crowd sound, court spacing and rapid lateral movement.'}));
assert.equal(by(r,'imax').score,3,'The First Slam Dunk IMAX should get scale/audio benefit without expanded-ratio evidence');
assert.equal(by(r,'dolby_cinema').score,4,'The First Slam Dunk Dolby should reflect strong sound and solid visuals');
assert.equal(by(r,'motion').score,4,'The First Slam Dunk motion should reflect sustained physicality');
assert.equal(by(r,'screenx').score,4,'The First Slam Dunk ScreenX should reflect court breadth and lateral movement');

r=score(movie('Quiet Romance',2025,{genres:['Romance','Drama'],overview:'Two people talk quietly in small rooms and cafes.'}));
assert.equal(by(r,'standard').score,4,'standard rises to 4 when no special format has a strong case');
for(const key of ['imax','motion','screenx']) assert.ok(by(r,key).score>=2,'special formats must not drop below 2 merely from missing evidence');

for(const rows of [r]) for(const x of rows) assert.ok(!/おすすめ|評価します|一択|最優先/.test(x.reason||''),'reasons must be descriptive, not directive');

const idx=fs.readFileSync('index.html','utf8');
const search=fs.readFileSync('search.html','utf8');
for(const html of [idx,search]){
  assert.ok(html.includes('js/screening-model-v7.js'),'both pages must use the shared model');
  assert.ok(!html.includes('formatHeroTitle'),'top-level final verdict area must be removed');
}
console.log('screening v7 benchmark suite passed');
