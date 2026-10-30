'use strict';
const {buildDemoRecords}=require('./cinelva-demo-fixture.cjs');

function shouldIncludeDemo(env=process.env){
 if(env.VERCEL_ENV==='production')return false;
 if(env.VERCEL_ENV==='preview')return true;
 if(env.CF_PAGES_BRANCH)return env.CF_PAGES_BRANCH!==(env.CF_PAGES_PRODUCTION_BRANCH||'main');
 return env.GITHUB_EVENT_NAME==='pull_request';
}
function safeJson(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
function storageScript(records){
 const seed=safeJson(records);
 return `<meta name="robots" content="noindex,nofollow"><script data-cinelva-demo-storage>(function(){'use strict';\n`+
 `const seed=${seed};const rows=Object.fromEntries(seed.map(row=>[String(row.id),row]));\n`+
 `const defaults=new Map([['cinelva-library-records-v2',JSON.stringify(rows)],['cinemap-viewing-records-v1','{}'],['cinelva-library-deleted-legacy-v1','[]'],['cinelva-want-to-watch-v1','{}'],['cinelva-theme-v1','dark']]);\n`+
 `const makeStorage=()=>{const values=new Map(defaults);return {getItem:key=>values.has(String(key))?values.get(String(key)):null,setItem:(key,value)=>values.set(String(key),String(value)),removeItem:key=>values.delete(String(key)),clear:()=>values.clear(),key:index=>[...values.keys()][index]??null,get length(){return values.size}}};\n`+
 `const local=makeStorage(),session=makeStorage();Object.defineProperty(window,'localStorage',{configurable:false,enumerable:true,get:()=>local});Object.defineProperty(window,'sessionStorage',{configurable:false,enumerable:true,get:()=>session});\n`+
 `window.CinelvaDemo={reset(){location.reload()},records(){return JSON.parse(local.getItem('cinelva-library-records-v2')||'{}')}};const networkFetch=window.fetch?.bind(window);if(networkFetch)window.fetch=(input,init)=>{let target;try{target=new URL(typeof input==='string'?input:input.url,location.href)}catch{return Promise.reject(new TypeError('Invalid demo request'))}if(target.origin===location.origin)return networkFetch(input,init);return Promise.resolve(new Response('{"error":"demo_api_disabled"}',{status:503,headers:{'Content-Type':'application/json'}}))};document.documentElement.dataset.cinelvaDemo='true';\n`+
 `document.addEventListener('DOMContentLoaded',()=>{const bar=document.createElement('aside');bar.setAttribute('aria-label','デモ表示');bar.style.cssText='position:sticky;top:0;z-index:10000;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:calc(7px + env(safe-area-inset-top)) 10px 7px;background:#4b3420;color:#fff;font:600 12px/1.4 system-ui';const label=document.createElement('strong');label.textContent='DEMO / サンプルデータ — 架空の鑑賞履歴';const reset=document.createElement('button');reset.type='button';reset.textContent='サンプルをリセット';reset.style.cssText='border:1px solid #e3d1a5;border-radius:6px;background:#2f2417;color:#fff;padding:5px 8px;font:inherit';reset.addEventListener('click',()=>window.CinelvaDemo.reset());const normal=document.createElement('a');normal.href='../my-cinelva/';normal.textContent='通常表示';normal.style.cssText='color:#fff;text-decoration:underline';bar.append(label,reset,normal);document.body.prepend(bar)});\n`+
 `})();</script>`;
}
function createDemoPage(source,records){
 if(typeof source!=='string'||!source.includes('<head>')||!source.includes('<title>My Cinelva')||!source.includes('<body'))throw new Error('Current My Cinelva source cannot be transformed safely');
 let html=source.replace('<html lang="ja" data-theme="light">','<html lang="ja" data-theme="dark" data-cinelva-demo-build="preview">');
 html=html.replace('<head>',`<head>\n  ${storageScript(records)}`);
 html=html.replace('<title>My Cinelva — 鑑賞記録と映画の世界</title>','<title>My Cinelva DEMO — サンプルデータ</title>');
 if(!html.includes('noindex,nofollow')||!html.includes('DEMO / サンプルデータ'))throw new Error('Demo safety marker was not installed');
 return html;
}
function buildDemoPageFromRoot(root,outputDirectory,{today='2026-10-30'}={}){
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(root,'my-cinelva','index.html'),'utf8');
 const {records}=buildDemoRecords({root,today});
 const target=path.join(outputDirectory,'my-cinelva-demo');fs.mkdirSync(target,{recursive:true});
 fs.writeFileSync(path.join(target,'index.html'),createDemoPage(source,records));
 return {path:path.join(target,'index.html'),records:records.length};
}
module.exports={shouldIncludeDemo,createDemoPage,buildDemoPageFromRoot,storageScript};
