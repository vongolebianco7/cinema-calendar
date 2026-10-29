'use strict';
// Standalone diagnostic, never contacts production APIs or modifies real records.
// Run in both commits with the SAME machine/browser/data before comparing speed.
const fs=require('node:fs'),net=require('node:net');
const {spawn,execFileSync}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
const engine=process.env.CINELVA_BROWSER||'chromium';
(async()=>{
 const {assessRequestedPerformance}=await import('./product/helpers/performance-budget.mjs');
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));
 const port=probe.address().port;await new Promise(r=>probe.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 const report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),engine,node:process.version,platform:process.platform,viewport:{width:390,height:844},scope:'Local static server, synthetic local records, external requests blocked. Search means record filtering; cached means repeat tab. rAF cadence is not physical display/GPU FPS. No whole-service or physical iPhone claim.',cases:[]};
 let browser;
 try{
  await waitForLocalServer(port);browser=await require('playwright')[engine].launch();report.browser=browser.version();
  for(const count of [0,1000]){
   const context=await browser.newContext({viewport:report.viewport});
   await context.route('**/*',route=>new URL(route.request().url()).origin===`http://127.0.0.1:${port}`?route.continue():route.fulfill({status:503,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{}'}));
   await context.addInitScript(size=>{
    const records={};for(let i=0;i<size;i++)records[String(9000000+i)]={id:String(9000000+i),_localRecord:true,title:'性能検証 '+String(i).padStart(4,'0'),rating:4,watchedAt:'2026-06-15',year:2000+i%20,genres:['ドラマ'],countries:['日本']};
    localStorage.setItem('cinelva-library-records-v2',JSON.stringify(records));localStorage.setItem('cinelva-theme-v1','light');
   },count);
   const page=await context.newPage(),row={count,route:'/my-cinelva/',values:{},errors:[]};report.cases.push(row);
   page.on('pageerror',e=>row.errors.push(e.message));
   try{
    await page.goto(`http://127.0.0.1:${port}/my-cinelva/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(size=>window.CinelvaLibraryRecords?.all().length===size&&document.getElementById('csLifetime')?.textContent===String(size),count,{timeout:15000});
    row.values.initial_ms=await page.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now();});
    const switchTab=tab=>page.evaluate(async name=>{
     const start=performance.now();document.querySelector(`[data-tab="${name}"]`).click();
     if(document.getElementById(name+'View').hidden)throw Error('tab did not become visible');
     await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-start;
    },tab);
    row.values.tab_ms=await switchTab('records');
    await switchTab('watchlist');row.values.cached_ms=await switchTab('records');
    row.values.search_ms=await page.evaluate(async size=>{
     const start=performance.now(),input=document.getElementById('recordSearch');input.value=size?'性能検証 0999':'一致しない作品';input.dispatchEvent(new Event('input',{bubbles:true}));
     await new Promise((resolve,reject)=>{const deadline=performance.now()+5000;function check(){const list=document.getElementById('recordList');if(size?list.children.length===1&&list.textContent.includes('性能検証 0999'):list.querySelector('.empty'))return resolve();if(performance.now()>deadline)return reject(Error('record filter timeout'));requestAnimationFrame(check);}check();});
     await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-start;
    },count);
    // Restore full list before scrolling; a one-card filter is not scroll evidence.
    await page.evaluate(()=>{const el=document.getElementById('recordSearch');el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));});
    if(count){
     await page.locator('#recordList .cinelva-rate-button').first().waitFor();
     row.values.review_ms=await page.evaluate(async()=>{const start=performance.now();document.querySelector('#recordList .cinelva-rate-button').click();if(!document.querySelector('.cinelva-rate-dialog[open]'))throw Error('review did not open');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-start;});
     await page.evaluate(()=>document.querySelector('.cinelva-rate-dialog').close());
     row.scroll_cadence_fps=await page.evaluate(()=>new Promise(resolve=>{let first,last,frames=0;function tick(now){first??=now;last=now;frames++;window.scrollBy(0,30);if(now-first<1000)requestAnimationFrame(tick);else resolve((frames-1)*1000/(last-first));}requestAnimationFrame(tick);}));
    }
   }catch(error){row.errors.push(error.message);}
   row.assessment=assessRequestedPerformance(row.values);await context.close();
  }
 }catch(error){report.error=error.message;process.exitCode=1;}
 finally{
  await browser?.close();server.kill();fs.mkdirSync('artifacts/requested-performance',{recursive:true});
  fs.writeFileSync(`artifacts/requested-performance/${engine}.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 }
 if(report.cases.some(row=>row.errors.length))process.exitCode=1;
 // A diagnostic report exposes misses; it does not silently redefine the older
 // release gate. Enable strict acceptance only once every metric is measured.
 if(process.env.CINELVA_STRICT_PERFORMANCE==='1'&&report.cases.some(row=>Object.values(row.assessment).some(metric=>metric.status!=='pass')))process.exitCode=1;
})();
