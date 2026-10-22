'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
const {assertTextContrast}=require('./helpers/text-contrast.cjs');
const engine=process.env.CINELVA_BROWSER||'chromium';
(async()=>{
 const server=spawn('python',['-m','http.server','8768','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
 await waitForLocalServer(8768);browser=await require('playwright')[engine].launch();
 fs.mkdirSync('artifacts/calendar-cross-screen',{recursive:true});
 for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await context.newPage();
 for(const route of ['index.html','rankings.html','revivals.html','events.html']){
 await page.goto('http://127.0.0.1:8768/'+route,{waitUntil:'domcontentloaded'});
 await page.locator('.cinelva-rating-actions .cinelva-rate-button').first().waitFor();
 const measured=await assertTextContrast(page,['.cinelva-rating-actions .cinelva-rate-button','.cinelva-rating-controls .rating-value'],`${engine} ${theme} ${route}`);
 assert.ok(measured.some(x=>x.selector.includes('rate-button')),'real rendered eye controls required');
 await page.screenshot({path:`artifacts/calendar-cross-screen/${engine}-${theme}-${route}.png`,fullPage:true});
 }
 await page.goto('http://127.0.0.1:8768/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>festivalEvents.length>0);
 await page.evaluate(()=>loadOutdoorEvents());
 await page.waitForFunction(()=>outdoorEvents.length>0);
 for(const mode of ['festival','events'])for(const month of [9,10,11]){
 await page.evaluate(({mode,month})=>{view=new Date(2026,month,1);setMode(mode)},{mode,month});
 const measured=await assertTextContrast(page,['.festivalSpan'],`${engine} ${theme} ${mode} ${month+1}`);
 if(mode==='festival'&&month<11||mode==='events'&&month!==10)assert.ok(measured.length,`${theme} ${mode} ${month+1}: real festival/event bars required`);
 await page.screenshot({path:`artifacts/calendar-cross-screen/${engine}-${theme}-${mode}-${month+1}.png`,fullPage:true});
 }
 await context.close();
 }
 console.log(`${engine}: real shared-review and calendar-bar theme regressions passed`);
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
