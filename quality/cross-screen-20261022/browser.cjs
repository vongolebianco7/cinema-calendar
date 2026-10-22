const {chromium,webkit}=require('playwright');
const fs=require('fs');
(async()=>{
 const engine=process.env.CINELVA_BROWSER||'chromium'; const browser=await ({chromium,webkit}[engine]).launch();
 const out={engine,scope:'local static source; external APIs blocked; remote poster health not tested',results:[]};
 fs.mkdirSync('audit-output',{recursive:true});
 for(const theme of ['light','dark']){
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
 await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const p=await ctx.newPage();
 async function sample(label){
 const result=await p.evaluate(()=>{
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const style=e=>{const s=getComputedStyle(e);let a=e,bg='';while(a){const c=getComputedStyle(a).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent'){bg=c;break}a=a.parentElement}return {text:e.textContent.trim().slice(0,70),class:e.className.baseVal??e.className,color:s.color,background:bg,opacity:s.opacity}};
 return {title:document.title,month:document.querySelector('#month')?.textContent,eyeButtons:[...document.querySelectorAll('.cinelva-rating-actions button')].filter(visible).slice(0,8).map(style),bars:[...document.querySelectorAll('.festivalSpan')].filter(visible).map(style),images:document.images.length,emptyPosterLabels:[...document.querySelectorAll('[data-poster-fallback],.calMissing,.filmPlaceholder,.outdoorFilmPlaceholder')].filter(visible).length,overflow:document.documentElement.scrollWidth>innerWidth+2,chips:[...document.querySelectorAll('#chips button')].map(e=>({text:e.textContent,active:e.classList.contains('active')}))};
 });out.results.push({theme,label,...result});
 if(label.includes('festival')||label==='rankings.html'||label==='events.html')await p.screenshot({path:`audit-output/${engine}-${theme}-${label.replace(/[^a-z0-9]/gi,'-')}.png`});
 }
 const manifest=JSON.parse(fs.readFileSync('quality/route-manifest.json'));
 for(const path of manifest.routes.map(r=>r.path)){
 await p.goto('http://127.0.0.1:8765/'+path,{waitUntil:'domcontentloaded'});await p.waitForTimeout(650);await sample(path);
 }
 await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1000);
 for(const mode of ['streaming','tv','festival','events']){
 await p.evaluate(m=>{view=new Date(2026,9,1);setMode(m)},mode);await p.waitForTimeout(350);
 for(let month=10;month<=12;month++){
 await sample(`${mode}-${month}`);if(month<12){await p.locator('#next').click();await p.waitForTimeout(150)}
 }
 }
 await ctx.close();
 }
 await browser.close();fs.writeFileSync(`audit-output/${engine}.json`,JSON.stringify(out,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
