// Local-only regression checks: export dimensions, bounds, and share activation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let draws=[],pending=[],shared=false;
const values={format:'portrait',layout:'editorial',theme:'',title:'2026年 私のベスト映画',sub:'心に残った10本。'};
const ctx={font:'',textAlign:'left',save(){},restore(){},fillRect(){},measureText(s){return {width:Array.from(s).length*(parseFloat(this.font.match(/(\d+(?:\.\d+)?)px/)?.[1])||24)*.65}},fillText(text,x,y){draws.push({text:String(text),x,y,font:this.font})}};
const canvas={width:0,height:0,getContext:()=>ctx,setAttribute(){},toBlob(cb){pending.push(()=>cb(new Blob(['png'],{type:'image/png'})))}};
const elements={artCanvas:canvas,share:{disabled:false},msg:{textContent:''}};
Object.keys(values).forEach(k=>elements[k]={value:values[k]});
const sandbox={document:{getElementById:id=>elements[id]},File:class File extends Blob{constructor(parts,name,opts){super(parts,opts);this.name=name}},window:{addEventListener(){}},navigator:{canShare:()=>true,share:()=>{shared=true;return Promise.resolve()}},URL,Blob,console};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('js/my-cinemap-art.js','utf8'),sandbox);
const movies=Array.from({length:10},(_,i)=>({title:'作品'+i+' 日本語のとても長い映画タイトルと追加の文字'.repeat(3),year:2000+i}));
for(const format of ['portrait','square','landscape'])for(const layout of ['editorial','ranking','minimal'])for(const count of [0,1,5,10]){
 elements.format.value=format;elements.layout.value=layout;draws=[];sandbox.drawArtwork(movies.slice(0,count));
 assert.equal(canvas.width,1600);assert.equal(canvas.height,{portrait:2000,square:1600,landscape:1000}[format]);
 assert.ok(draws.every(d=>Number.isFinite(d.x)&&Number.isFinite(d.y)&&d.y>=0&&d.y+parseFloat(d.font.match(/(\d+(?:\.\d+)?)px/)[1])<canvas.height),format+' '+layout+' vertical bounds');
 assert.equal(draws.filter(d=>/^\d{2}$/.test(d.text)).length,count);
 pending.splice(0).forEach(f=>f());assert.equal(elements.share.disabled,false);
}
// A pending older encode must not overwrite the newest preview's file.
sandbox.drawArtwork(movies);sandbox.drawArtwork(movies.slice(0,1));pending.shift()();assert.equal(elements.share.disabled,true);pending.shift()();assert.equal(elements.share.disabled,false);
sandbox.shareArtwork();assert.equal(shared,true,'share is invoked synchronously inside the click handler');
console.log('My Cinemap: 36 format/layout/count combinations and share preparation passed.');
