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

const emptyDna={directors:[],writers:[],cinematography:[],music:[],editing:[],production:[]};
const fixture = {
  id:'ci-fixture-1', tmdbId:'ci-fixture-1', title:'CI Fixture Film', year:2026,
  date:'2026-10-01', score:8.4, runtime:111, genres:['ドラマ'], cast:['Actor A'],
  countries:['日本'], director:'Director A', overview:'CIで再現可能な作品詳細です。',
  availability:{flatrate:[],rent:[],buy:[]},
  dna:{...emptyDna,directors:[{id:'director-a',name:'Director A'}]},
  related:[{id:'ci-related-1',tmdbId:'ci-related-1',title:'CI Related Film',year:2025,score:7.8,genres:['ドラマ'],cast:[],countries:['日本'],director:'Director B',availability:{},dna:emptyDna,related:[],director_works:[]}],
  director_works:[{id:'ci-director-1',tmdbId:'ci-director-1',title:'CI Director Work',year:2024,score:7.7,genres:['ドラマ'],cast:[],countries:['日本'],director:'Director A',availability:{},dna:emptyDna,related:[],director_works:[]}],
};
const criticEvidence={films:{
  'ci-fixture-1':{
    title:'CI Fixture Film',year:2026,
    sources:[
      {id:'s1',name:'Source One',url:'https://example.com/review/1'},
      {id:'s2',name:'Source Two',url:'https://example.org/review/2'},
      {id:'s3',name:'Source Three',url:'https://example.net/review/3'},
    ],
    overview:{text:'複数の実在出典を整理したCI用要約。',sourceIds:['s1','s2','s3']},
    positive:[],divided:[],stances:[],
  },
  'ci-sparse':{
    title:'CI Sparse Film',year:2026,
    sources:[{id:'s4',name:'Sparse Source',url:'https://example.com/review/sparse'}],
    positive:[],divided:[],stances:[],
  },
}};

const browser=await browserType.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
await context.route('**/api/movie-detail?*',async route=>{
  const url=new URL(route.request().url()),id=url.searchParams.get('id')||fixture.id;
  if(id==='ci-error-500')return route.fulfill({status:500,contentType:'application/json',body:'{}'});
  if(id==='ci-error-timeout')return route.abort('timedout');
  let movie={...fixture,id,tmdbId:id,title:id==='ci-minimal'?'CI Minimal Film':fixture.title};
  if(id==='ci-minimal')movie={...movie,poster:null,availability:{},related:[],overview:'',cast:[]};
  if(id==='ci-no-related')movie={...movie,title:'CI No Related Film',related:[]};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movie})});
});
await context.route('**/api/movies*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:[],movies:[]})}));
await context.route('**/data/critic_evidence.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(criticEvidence)}));
const rows=[];
const emit=(id,points,pass,details='',earned=pass?points:0)=>recordMetric(rows,{id,status:pass?'pass':'fail',earned,browser:browserName,details});

async function openFixture(page,id=fixture.id,title=fixture.title){
  const response=await page.goto(`${base}/search.html?id=${encodeURIComponent(id)}&search=${encodeURIComponent(title)}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#detail h2',{timeout:8000}).catch(()=>{});
  const rendered=await page.locator('#detail h2').textContent().catch(()=>null);
  return Boolean(response&&response.status()<400&&rendered);
}
function recordSelector(page){return page.locator('[data-rate-id], input[type="range"][min="0"][max="5"], [data-record-rating]').first();}
async function storageHas(page,id,rating){
  return page.evaluate(({id,rating})=>{
    const has=value=>{
      if(value==null)return false;
      if(Array.isArray(value))return value.some(has);
      if(typeof value==='object'){
        if(String(value.id??'')===String(id)&&Math.abs(Number(value.rating)-Number(rating))<.001)return true;
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
async function bodyText(page){return (await page.locator('body').innerText().catch(()=>''))||'';}

// Detail + recording journey.
{
  const page=await context.newPage();await page.addInitScript(()=>localStorage.clear());
  const errors=attachPageErrorCollector(page),detailLoaded=await openFixture(page);
  const metadata=detailLoaded&&await page.locator('#detail').innerText().then(t=>t.includes('2026')&&t.includes('ドラマ')).catch(()=>false);
  emit('DETAIL-01',.5,detailLoaded,`fixture detail loaded=${detailLoaded}`);emit('DETAIL-02',.5,metadata,`essential metadata=${metadata}`);
  const control=recordSelector(page),controlVisible=(await control.count())>0&&await control.isVisible().catch(()=>false);
  emit('DETAIL-03',1,controlVisible,'rating/record control on detail');
  let setRating=false,immediate=false,saved=false,persisted=false,changed=false,myReflected=false;
  if(controlVisible){
    await control.evaluate(el=>{if('value'in el)el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
    setRating=Number(await control.inputValue().catch(()=>NaN))===4;
    const surrounding=await control.locator('xpath=ancestor-or-self::*[self::label or self::div][1]').innerText().catch(()=>"");immediate=setRating&&/4(?:\.0)?/.test(surrounding);
    saved=await storageHas(page,fixture.id,4);await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#detail h2',{timeout:8000}).catch(()=>{});persisted=await storageHas(page,fixture.id,4);
    const control2=recordSelector(page);if((await control2.count())>0){await control2.evaluate(el=>{if('value'in el)el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});changed=await storageHas(page,fixture.id,3);}
    await page.goto(`${base}/my-cinemap.html`,{waitUntil:'domcontentloaded'});myReflected=(await bodyText(page)).includes(fixture.title);
  }
  emit('DETAIL-04',1,setRating,'rating 1-5 set');emit('DETAIL-05',1,immediate,'saved state reflects immediately');emit('DETAIL-06',1,persisted,'saved record survives reload');emit('DETAIL-07',.5,changed,'rating can be changed');
  emit('MY-01',1,myReflected,'saved movie appears in My Cinemap');emit('MY-02',1,myReflected&&changed,'My Cinemap rating matches canonical record');emit('MY-03',1,myReflected&&persisted,'My Cinemap state survives source-page reload');
  const earned=(detailLoaded?1:0)+(controlVisible?1.5:0)+(immediate?1.5:0)+(saved?2:0)+(persisted?2:0)+(myReflected?2:0),flowPass=detailLoaded&&controlVisible&&immediate&&saved&&persisted&&myReflected&&errors.length===0;
  emit('FLOW-RECORD',10,flowPass,JSON.stringify({detailLoaded,controlVisible,immediate,saved,persisted,myReflected,errors}),earned);await page.close();
}

// Related-work and creator navigation.
{
  const page=await context.newPage(),errors=attachPageErrorCollector(page),detailLoaded=await openFixture(page),related=page.locator('.relatedWork').first();
  const relatedUsable=detailLoaded&&(await related.count())>0&&await related.isVisible().catch(()=>false);emit('DETAIL-08',1,relatedUsable,'related-work control usable');
  let relatedOpened=false;if(relatedUsable){await related.click();relatedOpened=((await page.locator('#detail h2').textContent().catch(()=>''))||'').includes('CI Related Film');}
  emit('DETAIL-09',1,relatedOpened,'related work opens correct detail');emit('FLOW-RELATED',5,relatedUsable&&relatedOpened&&errors.length===0,JSON.stringify({relatedUsable,relatedOpened,errors}),(relatedUsable?2:0)+(relatedOpened?3:0));
  await openFixture(page);const person=page.locator('.infoPerson').first();let personOpened=false;if((await person.count())>0){await person.click();await page.waitForLoadState('domcontentloaded');personOpened=page.url().includes('discover.html?person=director-a');}
  emit('DETAIL-10',1,personOpened,'creator navigation enters discover person mode');emit('FLOW-PERSON',5,personOpened&&errors.length===0,JSON.stringify({personOpened,errors}),personOpened?5:0);await page.close();
}

// Evidence-backed critic CTA on detail.
{
  const page=await context.newPage(),loaded=await openFixture(page);await page.waitForTimeout(250);const cta=page.locator('.criticPreviewCta').first();
  const criticCta=loaded&&(await cta.count())>0&&await cta.isVisible().catch(()=>false)&&((await cta.getAttribute('href'))||'').includes('critic.html?id=');emit('DETAIL-11',.5,criticCta,'critic CTA handles evidence-backed fixture');await page.close();
}

// Critic -> verified source + sparse-evidence truthfulness.
{
  const page=await context.newPage(),errors=attachPageErrorCollector(page);
  await page.goto(`${base}/critic.html?id=ci-fixture-1&search=CI%20Fixture%20Film`,{waitUntil:'domcontentloaded'});await page.waitForSelector('h1',{timeout:5000}).catch(()=>{});
  const richLoaded=((await page.locator('h1').textContent().catch(()=>''))||'').includes('CI Fixture Film');
  const unlock=page.locator('#unlock');let unlocked=false;if((await unlock.count())>0){await unlock.click();unlocked=await page.locator('#evidence').isVisible().catch(()=>false);}else unlocked=await page.locator('#evidence').isVisible().catch(()=>false);
  const links=page.locator('.sources a'),linkCount=await links.count(),firstHref=linkCount?await links.first().getAttribute('href'):'';const sourceCorrect=linkCount>=3&&firstHref==='https://example.com/review/1';
  emit('CRIT-02',.5,sourceCorrect,'verified critic source links are usable');
  await page.goto(`${base}/critic.html?id=ci-sparse&search=CI%20Sparse%20Film`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(150);const sparseText=await bodyText(page),sparseHonest=sparseText.includes('まだ掲載していません')&&!sparseText.includes('賛否の傾向');
  emit('CRIT-04',.5,sparseHonest,'sparse evidence explicitly stays insufficient');
  const earned=(richLoaded?1:0)+(unlocked?1:0)+(sourceCorrect?2:0)+(sparseHonest?1:0),pass=earned===5&&errors.length===0;emit('FLOW-CRITIC',5,pass,JSON.stringify({richLoaded,unlocked,sourceCorrect,sparseHonest,errors}),earned);await page.close();
}

// Fresh-user operability.
{
  const page=await context.newPage();await page.addInitScript(()=>localStorage.clear());const discover=await page.goto(`${base}/discover.html`,{waitUntil:'domcontentloaded'}).then(r=>Boolean(r&&r.status()<400)).catch(()=>false),detail=await openFixture(page);
  const control=recordSelector(page),recordable=(await control.count())>0&&await control.isVisible().catch(()=>false),oceanLink=(await page.locator('a[href*="ocean"]').count())>0,earned=(discover?1:0)+(detail?1:0)+(recordable?1:0)+(oceanLink?1:0);
  emit('FLOW-FIRSTUSE',4,discover&&detail&&recordable&&oceanLink,JSON.stringify({discover,detail,recordable,oceanLink}),earned);await page.close();
}

// Eight independent error/empty-state cases, 0.5 point each.
{
  const checks=[];
  async function scenario(url,predicate,setup){
    const page=await context.newPage();if(setup)await page.addInitScript(setup);const errors=attachPageErrorCollector(page);let ok=false;
    try{await page.goto(`${base}/${url}`,{waitUntil:'domcontentloaded',timeout:10000});await page.waitForTimeout(180);ok=Boolean(await predicate(page))&&errors.length===0;}catch{ok=false;}await page.close();checks.push(ok);return ok;
  }
  await scenario('discover.html',async p=>(await bodyText(p)).trim().length>20);
  await scenario('search.html?id=ci-minimal&search=CI%20Minimal%20Film',async p=>(await bodyText(p)).includes('CI Minimal Film'));
  await scenario('search.html?id=ci-minimal&search=CI%20Minimal%20Film',async p=>(await bodyText(p)).includes('配信情報を確認できていません'));
  await scenario('search.html?id=ci-no-related&search=CI%20No%20Related%20Film',async p=>(await bodyText(p)).includes('関連作品の情報はまだありません'));
  await scenario('critic.html?id=ci-none&search=CI%20None',async p=>(await bodyText(p)).includes('まだ掲載していません'));
  await scenario('my-cinemap.html',async p=>(await bodyText(p)).trim().length>20,()=>localStorage.setItem('cinemap-corrupt-test','{broken-json'));
  await scenario('search.html?id=ci-error-500&search=CI%20Error',async p=>(await bodyText(p)).includes('作品情報を取得できませんでした'));
  await scenario('search.html?id=ci-error-timeout&search=CI%20Timeout',async p=>(await bodyText(p)).includes('作品情報を取得できませんでした'));
  const earned=checks.filter(Boolean).length*.5;emit('FLOW-ERROR',4,earned===4,JSON.stringify({checks}),earned);
}

writeMetrics(metricOutputPath('journeys',browserName),rows);await browser.close();console.log(`Wrote ${rows.length} journey metrics for ${browserName}`);
