const { chromium } = require("playwright"),
  { spawn } = require("child_process"),
  net = require("net"),
  { waitForLocalServer } = require("./helpers/local-server.cjs"),
  assert = require("assert/strict");
(async () => {
  const l = net.createServer();
  await new Promise((r) => l.listen(0, "127.0.0.1", r));
  const port = l.address().port;
  await new Promise((r) => l.close(r));
  const server = spawn(
    "python",
    ["-m", "http.server", String(port), "--bind", "127.0.0.1"],
    { stdio: "ignore" },
  );
  let browser;
  try {
    await waitForLocalServer(port);
    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 375, height: 844 },
    });
    await page.route("**/api/movies?*", () => {});
    await page.route("**/data/movies.json*", (r) =>
      r.fulfill({
        json: {
          movies: [{ id: 111, tmdbId: 111, title: "Local Film", year: 2000 }],
        },
      }),
    );
    await page.goto(`http://127.0.0.1:${port}/search.html?search=Local`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator("#grid .title").first().waitFor({ timeout: 2000 });
    assert.equal(
      await page.locator("#grid .title").first().innerText(),
      "Local Film",
    );
    await page.locator("#grid .cinelva-rate-button").first().click();
    assert.equal(
      await page.locator("#cinelvaRateTitle").innerText(),
      "Local Film",
    );
    await page.route("**/api/movie-detail?*", () => {});
    await page.route("**/data/critic_evidence.json*", r => r.fulfill({json:{films:{111:{title:"Local Critic Film",year:2000,overview:"Local evidence"}}}}));
    await page.goto(`http://127.0.0.1:${port}/critic.html?id=111`, {waitUntil:"domcontentloaded"});
    await page.locator("#app h1").waitFor({timeout:2000});
    assert.equal(await page.locator("#app h1").innerText(),"Local Critic Film");
    await page.locator("#app .cinelva-rate-button").click();
    assert.equal(await page.locator("#cinelvaRateTitle").innerText(),"Local Critic Film");
    await page.route("**/api/people?*", r=>r.fulfill({json:{people:[]},headers:{"access-control-allow-origin":"*"}}));
    const films=Array.from({length:45},(_,i)=>({id:10000+i,tmdbId:10000+i,title:'スター・ウォーズ 検証映画'+(i+1),year:'2000',catalog:true}));
    await page.route("**/api/movies?*",r=>r.fulfill({json:{movies:[],external:films,external_search:{truncated:false,incomplete:false}},headers:{"access-control-allow-origin":"*"}}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
    await page.locator('.gSearch').fill('スターウォーズ');
    await page.waitForFunction(()=>document.querySelectorAll('.cinelva-search-suggestions [role="option"]').length===45);
    assert.equal(await page.locator('.cinelva-search-suggestions [role="option"]').count(),45);
    await page.locator('.gSearch').press('Enter');
    await page.waitForURL(/search.html\?search=/);
    await page.waitForFunction(()=>document.querySelectorAll('#grid .card').length===45);
    assert.equal(await page.locator('#grid .card').count(),45);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    console.log('Common-header candidates and submitted title search retain all45 resolved films at375px');
    await page.route('**/js/cinelva-film-medium.js*',async route=>{await new Promise(resolve=>setTimeout(resolve,300));await route.continue();});
    await page.route('**/api/movie-detail?*',route=>route.fulfill({json:{movie:{id:111,tmdbId:111,title:'Medium policy fixture',director:'Fixture Director',director_works:[{id:1,title:'TV series special',genre_ids:[10770],year:2020},{id:2,title:'Animation film',genre_ids:[16],year:2021},{id:3,title:'Drama theatrical film',genre_ids:[18],year:2022}]}},headers:{'access-control-allow-origin':'*'}}));
    await page.goto(`http://127.0.0.1:${port}/search.html?id=111`,{waitUntil:'domcontentloaded'});
    await page.locator('#detail .works').waitFor();
    assert.ok((await page.locator('#detail .works').innerText()).includes('Animation film'));
    assert.ok((await page.locator('#detail .works').innerText()).includes('Drama theatrical film'));
    assert.ok(!(await page.locator('#detail .works').innerText()).includes('TV series special'));

    console.log(
      "Local search results and review controls remain available while remote search hangs",
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
