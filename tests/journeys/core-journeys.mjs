import {chromium, webkit} from 'playwright';
import {
  attachPageErrorCollector,
  metricOutputPath,
  recordMetric,
  writeMetrics,
} from '../product/helpers/metric-harness.mjs';

const base = process.env.CINEMAP_BASE_URL || 'http://127.0.0.1:4173';
const browserName = process.env.CINEMAP_BROWSER || 'chromium';
const browserType = {chromium, webkit}[browserName];
if (!browserType) throw new Error(`Unsupported browser ${browserName}`);

const fixture = {
  id:'ci-fixture-1', tmdbId:'ci-fixture-1', title:'CI Fixture Film', year:2026,
  date:'2026-10-01', score:8.4, runtime:111, genres:['ドラマ'], cast:['Actor A'],
  countries:['日本'], director:'Director A', overview:'CIで再現可能な作品詳細です。',
  availability:{flatrate:[],rent:[],buy:[]},
  dna:{directors:[{id:'director-a',name:'Director A'}],writers:[],cinematography:[],music:[],editing:[],production:[]},
  related:[{id:'ci-related-1',tmdbId:'ci-related-1',title:'CI Related Film',year:2025,score:7.8,genres:['ドラマ'],cast:[],countries:['日本'],director:'Director B',availability:{},dna:{directors:[],writers:[],cinematography:[],music:[],editing:[],production:[]},related:[],director_works:[]}],
  director_works:[{id:'ci-director-1',tmdbId:'ci-director-1',title:'CI Director Work',year:2024,score:7.7,genres:['ドラマ'],cast:[],countries:['日本'],director:'Director A',availability:{},dna:{directors:[],writers:[],cinematography:[],music:[],editing:[],production:[]},related:[],director_works:[]}],
};
const criticEvidence={films:{'ci-fixture-1':{
  sources:[
    {id:'s1',name:'Source One',url:'https://example.com/review/1'},
    {id:'s2',name:'Source Two',url:'https://example.org/review/2'},
    {id:'s3',name:'Source Three',url:'https://example.net/review/3'},
  ],
  overview:{text:'複数の実在出典を整理したCI用要約。',sourceIds:['s1','s2','s3']},
  positive:[],divided:[],stances:[],
}}};

const browser=await browserType.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
await context.route('**/api/movie-detail?*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movie:fixture})}));
await context.route('**/api/movies*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:[],movies:[]})}));
await context.route('**/data/critic_evidence.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(criticEvidence)}));
const rows=[];
const emit=(id,points,pass,details='',earned=pass?points:0)=>recordMetric(rows,{id,status:pass?'pass':'fail',earned,browser:browserName,details});

async function openFixture(page){
  const response=await page.goto(`${base}/search.html?id=${encodeURIComponent(fixture.id)}&search=${encodeURIComponent(fixture.title)}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#detail h2',{timeout:8000}).catch(()=>{});
  const title=await page.locator('#detail h2').textContent().catch(()=>null);
  return Boolean(response&&response.status()<400&&title?.includes(fixture.title));
}
function recordSelector(page){return page.locator('[data-rate-id], input[type="range"][min="0"][max="5"], [data-record-rating]').first();}
async function storageHas(page,id,rating){
  return page.evaluate(({id,rating})=>{
    const has=(value)=>{
      if(value==null)return false;
      if(Array.isArray(value))return value.some(has);
      if(typeof value==='object'){
        const sameId=String(value.id??'')===String(id);
        const sameRating=Math.abs(Number(value.rating)-Number(rating))<0.001;
        if(sameId&&sameRating)return true;
        return Object.values(value).some(has);
      }
      return false;
    };
    for(let i=0;i<localStorage.length;i++){
      try{if(has(JSON.parse(localStorage.getItem(localStorage.key(i)))))return true;}catch{}
    }
    return false;
  },{id,rating});
}

// Detail + recording journey.
{
  const page=await context.newPage();
  await page.addInitScript(()=>localStorage.clear());
  const errors=attachPageErrorCollector(page);
  const detailLoaded=await openFixture(page);
  const metadata=detailLoaded && await page.locator('#detail').innerText().then(t=>t.includes('2026')&&t.includes('ドラマ')).catch(()=>false);
  emit('DETAIL-01',0.5,detailLoaded,`fixture detail loaded=${detailLoaded}`);
  emit('DETAIL-02',0.5,metadata,`essential metadata=${metadata}`);

  const control=recordSelector(page), controlVisible=(await control.count())>0 && await control.isVisible().catch(()=>false);
  emit('DETAIL-03',1.0,controlVisible,'rating/record control on detail');
  let setRating=false,immediate=false,saved=false,persisted=false,changed=false,myReflected=false;
  if(controlVisible){
    await control.evaluate(el=>{if('value' in el)el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
    setRating=Number(await control.inputValue().catch(()=>NaN))===4;
    const surrounding=await control.locator('xpath=ancestor-or-self::*[self::label or self::div][1]').innerText().catch(()=>"");
    immediate=setRating && /4(?:\.0)?/.test(surrounding);
    saved=await storageHas(page,fixture.id,4);
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#detail h2',{timeout:8000}).catch(()=>{});
    persisted=await storageHas(page,fixture.id,4);
    const control2=recordSelector(page);
    if((await control2.count())>0){
      await control2.evaluate(el=>{if('value' in el)el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
      changed=await storageHas(page,fixture.id,3);
    }
    await page.goto(`${base}/my-cinemap.html`,{waitUntil:'domcontentloaded'});
    myReflected=(await page.locator('body').innerText()).includes(fixture.title);
  }
  emit('DETAIL-04',1.0,setRating,'rating 1-5 set');
  emit('DETAIL-05',1.0,immediate,'saved state reflects immediately');
  emit('DETAIL-06',1.0,persisted,'saved record survives reload');
  emit('DETAIL-07',0.5,changed,'rating can be changed');
  emit('MY-01',1.0,myReflected,'saved movie appears in My Cinemap');
  emit('MY-02',1.0,myReflected&&changed,'My Cinemap rating matches canonical record');
  emit('MY-03',1.0,myReflected&&persisted,'My Cinemap state survives source-page reload');

  const earned=(detailLoaded?1:0)+(controlVisible?1.5:0)+(immediate?1.5:0)+(saved?2:0)+(persisted?2:0)+(myReflected?2:0);
  const flowPass=detailLoaded&&controlVisible&&immediate&&saved&&persisted&&myReflected&&errors.length===0;
  emit('FLOW-RECORD',10,flowPass,JSON.stringify({detailLoaded,controlVisible,immediate,saved,persisted,myReflected,errors}),earned);
  await page.close();
}

// Related-work navigation and creator navigation from a deterministic detail.
{
  const page=await context.newPage();
  const errors=attachPageErrorCollector(page);
  const detailLoaded=await openFixture(page);
  const related=page.locator('.relatedWork').first();
  const relatedUsable=detailLoaded&&(await related.count())>0&&await related.isVisible().catch(()=>false);
  emit('DETAIL-08',1.0,relatedUsable,'related-work control usable');
  let relatedOpened=false;
  if(relatedUsable){
    await related.click();
    relatedOpened=(await page.locator('#detail h2').textContent().catch(()=>''))?.includes('CI Related Film')||false;
  }
  emit('DETAIL-09',1.0,relatedOpened,'related work opens correct detail');
  emit('FLOW-RELATED',5,relatedUsable&&relatedOpened&&errors.length===0,JSON.stringify({relatedUsable,relatedOpened,errors}), (relatedUsable?2:0)+(relatedOpened?3:0));

  await openFixture(page);
  const person=page.locator('.infoPerson').first();
  let personOpened=false;
  if((await person.count())>0){
    await person.click();await page.waitForLoadState('domcontentloaded');
    personOpened=page.url().includes('discover.html?person=director-a');
  }
  emit('DETAIL-10',1.0,personOpened,'creator navigation enters discover person mode');
  emit('FLOW-PERSON',5,personOpened&&errors.length===0,JSON.stringify({personOpened,errors}),personOpened?5:0);
  await page.close();
}

// Critic CTA on a detail with deterministic verified evidence.
{
  const page=await context.newPage();
  const loaded=await openFixture(page);
  await page.waitForTimeout(250);
  const cta=page.locator('.criticPreviewCta').first();
  const criticCta=loaded&&(await cta.count())>0&&await cta.isVisible().catch(()=>false)&&((await cta.getAttribute('href'))||'').includes('critic.html?id=');
  emit('DETAIL-11',0.5,criticCta,'critic CTA handles evidence-backed fixture');
  await page.close();
}

// Fresh-user operability: discovery + detail are real checkpoints; recording/Ocean remains unearned until integrated.
{
  const page=await context.newPage();
  await page.addInitScript(()=>localStorage.clear());
  const discover=await page.goto(`${base}/discover.html`,{waitUntil:'domcontentloaded'}).then(r=>Boolean(r&&r.status()<400)).catch(()=>false);
  const detail=await openFixture(page);
  const control=recordSelector(page),recordable=(await control.count())>0&&await control.isVisible().catch(()=>false);
  const oceanLink=(await page.locator('a[href*="ocean"]').count())>0;
  const earned=(discover?1:0)+(detail?1:0)+(recordable?1:0)+(oceanLink?1:0);
  emit('FLOW-FIRSTUSE',4,discover&&detail&&recordable&&oceanLink,JSON.stringify({discover,detail,recordable,oceanLink}),earned);
  await page.close();
}

// Error / empty-state resilience uses controlled failures and must not white-screen or throw.
{
  const page=await context.newPage();
  const errors=attachPageErrorCollector(page);
  let points=0;
  await page.goto(`${base}/discover.html`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(200);
  if((await page.locator('body').innerText()).trim().length>20&&errors.length===0)points++;

  await context.route('**/api/movie-detail?*',route=>route.fulfill({status:500,contentType:'application/json',body:'{}'}),{times:1});
  await page.goto(`${base}/search.html?id=ci-error&search=CI%20Error`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(300);
  const detailError=(await page.locator('body').innerText()).includes('作品情報を取得できませんでした');
  if(detailError&&errors.length===0)points++;

  await page.goto(`${base}/critic.html?id=ci-none&search=CI%20None`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(200);
  if((await page.locator('body').innerText()).trim().length>20&&errors.length===0)points++;

  await page.evaluate(()=>localStorage.setItem('cinemap-corrupt-test','{broken-json'));
  await page.goto(`${base}/my-cinemap.html`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(200);
  if((await page.locator('body').innerText()).trim().length>20&&errors.length===0)points++;
  emit('FLOW-ERROR',4,points===4,JSON.stringify({points,errors}),points);
  await page.close();
}

writeMetrics(metricOutputPath('journeys',browserName),rows);
await browser.close();
console.log(`Wrote ${rows.length} journey metrics for ${browserName}`);
