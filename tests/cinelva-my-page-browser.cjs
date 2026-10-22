const { assertTextContrast } = require("./helpers/text-contrast.cjs");
const { waitForLocalServer } = require("./helpers/local-server.cjs");
const { chromium, webkit } = require("playwright"),
  { spawn } = require("child_process"),
  net = require("net"),
  fs = require("fs"),
  assert = require("assert/strict");
(async () => {
  const listener = net.createServer();
  await new Promise((r) => listener.listen(0, "127.0.0.1", r));
  const port = listener.address().port;
  await new Promise((r) => listener.close(r));
  const server = spawn(
    "python",
    ["-m", "http.server", String(port), "--bind", "127.0.0.1"],
    { stdio: "ignore" },
  );
  let browser;
  try {
    await waitForLocalServer(port);
    browser = await (
      process.env.CINELVA_BROWSER === "webkit" ? webkit : chromium
    ).launch();
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      acceptDownloads: true,
    });
    await context.route("https://backend-one-gray-94.vercel.app/**", (r) =>
      r.abort(),
    );
    const directors = JSON.parse(
      fs.readFileSync("data/directors-mobile.json"),
    ).directors;
    const director = Object.values(directors).find((d) =>
        d.name_status === 'transliterated' && d.original_name &&
        d.works?.some((w) => w.runtime >= 30),
      ),
      film = director?.works.find((w) => w.runtime >= 30);
    assert.ok(director && film, 'browser journey must use the generated director projection with name provenance');
    await context.addInitScript(
      ({ film, director }) => {
        if (!localStorage.getItem("cinelva-library-records-v2"))
          localStorage.setItem(
            "cinelva-library-records-v2",
            JSON.stringify({
              900003: {
                ...film,
                id: "900003",
                tmdbId: film.id,
                director: director.name,
                rating: 4.5,
                genres: ['SF'], countries: ['日本'], viewingMethod: '映画館',
                watchedAt: "2026-04-12",
              },
              900001: {
                id: "900001",
                tmdbId: 11,
                title: "スター・ウォーズ",
                original_title: "Star Wars",
                year: 1977,
                rating: 3.5,
                watchedAt: "2025-04-15",
              },
            }),
          );
      },
      { film, director },
    );
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const base = `http://127.0.0.1:${port}`;
    await page.goto(base + "/my-cinelva/");
    await page.waitForFunction(
      () => document.getElementById("csLifetime")?.textContent === "2",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.evaluate(() => {
      localStorage.setItem(
        "cinelva-want-to-watch-v1",
        JSON.stringify({ 11: { id: 11, title: "保存作品" } }),
      );
      dispatchEvent(new CustomEvent("cinelva-bookmarks-updated"));
    });
    assert.equal(await page.locator("#watchlistView").isVisible(), false);
    await page.locator('[data-tab="watchlist"]').click();
    assert.match(await page.locator("#wantWatchList").innerText(), /保存作品/);
    assert.equal(
      await page.locator("#wantWatchList .cinelva-bookmark-button").count(),
      1,
    );
    await page.locator("#wantWatchList .cinelva-bookmark-button").click();
    assert.match(
      await page.locator("#wantWatchList").innerText(),
      /見たい映画はまだありません/,
    );
    await page.locator('[data-tab="summary"]').click();
    await page.locator("#csPeriod").selectOption("2026");
    for (const kind of ['csGenres', 'csCountries', 'csDecades', 'csMethods']) {
      const legend = page.locator('#' + kind + ' [data-summary-breakdown]').first();
      await legend.click();
      assert.equal(await page.locator('#summaryBreakdownFilms [data-record-card]').count(), 1);
      assert.equal(await page.locator('#summaryBreakdownFilms [data-record-card]').getAttribute('data-record-card'), '900003');
      assert.ok(await page.locator('#summaryBreakdownFilms .cinelva-record-title').getAttribute('href'));
      await page.locator('#summaryBreakdownFilms .cinelva-rate-button').click();
      await page.locator('.cinelva-rate-dialog[open]').waitFor();
      await page.locator('#cinelvaRateClose').first().click();
      await page.locator('#summaryBreakdownFilms').getByRole('button', {name: '一覧を閉じる'}).click();
      assert.equal(await legend.evaluate(el => document.activeElement === el), true);
    }
    await page.locator('#csMethods [data-summary-breakdown]').first().click();
    await page.locator('#csPeriod').selectOption('all');
    assert.equal(await page.locator('#summaryBreakdownFilms').count(), 0);
    await page.locator('#csPeriod').selectOption('2026');
    const columns = await page
      .locator("#yearHeatmap")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
    assert.equal(columns, 3);
    assert.equal(await page.locator("#yearHeatmap>.cy-month").count(), 12);
    assert.equal(await page.locator("#yearHeatmap .cy-medal").count(), 0);
    await page.locator("#csPeriod").selectOption("all");
    await page.locator("#yearHeatmap>.cy-year-card").first().waitFor();
    assert.ok((await page.locator("#yearHeatmap>.cy-year-card").count()) >= 2);
    await page.locator('[data-tab="awards"]').click();
    assert.match(await page.locator("#awardMatrix").innerText(), /年代/);
    await page.locator('[data-tab="directors"]').click();
    await page.locator(".director-pick").filter({hasText:director.name}).first().click();
    const profileText = await page.locator("#directorFilmography .director-profile").innerText();
    assert.ok(profileText.includes("原名：" + director.original_name), "generated mobile data must retain the original name");
    assert.ok(profileText.includes("日本語名は原名からのカタカナ表記です。"), "editorial kana must remain explicitly labeled");
    fs.mkdirSync("artifacts/route-audit/director-provenance", {recursive:true});
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      await page.locator('#directorFilmography .director-profile').screenshot({path:`artifacts/route-audit/director-provenance/${process.env.CINELVA_BROWSER||'chromium'}-${theme}-profile-390.png`});
      await page.screenshot({path:`artifacts/route-audit/director-provenance/${process.env.CINELVA_BROWSER||'chromium'}-${theme}-full-390.png`,fullPage:true});
      await assertTextContrast(page, [
        '.director-sort-bar label', '.director-achievement span',
        '#directorFilmography .director-profile h3', '#directorFilmography .director-profile p',
        '#directorFilmography .director-progress', '#directorFilmography .director-biography summary',
        '#directorFilmography .director-film-year', '#directorFilmography .director-film-title',
        '#directorFilmography .director-film-rating', '#directorFilmography .director-film-pending',
        '#directorFilmography .director-coverage-note', '#directorFilmography .director-coverage-note a',
      ], `active director ${theme} 390px`);
    }
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
    await page
      .locator("#directorFilmography .director-film-tile")
      .first()
      .waitFor();
    assert.ok(
      (await page
        .locator("#directorFilmography .cinelva-rate-button")
        .count()) > 0,
    );
    await page.locator('[data-tab="records"]').click();
    await page.locator("#recordList .cinelva-rate-button").first().waitFor();
    assert.equal(
      await page.locator("#recordList [data-record-card]").count(),
      2,
    );
    for (const query of [
      "スターウォーズ",
      "スター　ウォーズ",
      "ＳＴＡＲ ＷＡＲＳ",
    ]) {
      await page.locator("#recordSearch").fill(query);
      assert.equal(
        await page.locator("#recordList [data-record-card]").count(),
        1,
      );
    }
    await page.locator("#recordSearch").fill("");
    await page
      .locator('#recordList [data-record-card="900003"] .cinelva-rate-button')
      .click();
    await page.locator("#cinelvaRateScore").fill("4.2");
    await page.locator("#cinelvaRatePlace").selectOption("配信・サブスク");
    await page.locator("#cinelvaRateComment").fill("保存した感想");
    await page.locator("#cinelvaRateSave").click();
    await page.reload();
    await page.locator('[data-tab="records"]').click();
    await page
      .locator('#recordList [data-record-card="900003"] .cinelva-rate-button')
      .click();
    assert.equal(
      await page.locator("#cinelvaRateComment").inputValue(),
      "保存した感想",
    );
    assert.equal(
      await page.locator("#cinelvaRateDate").inputValue(),
      "2026-04-12",
    );
    await page.locator("#cinelvaRateClose").click();
    await page.locator(".recordUtilities summary").click();
    const download = page.waitForEvent("download");
    await page.locator("#exportRecords").click();
    const backup = fs.readFileSync(await (await download).path());
    const before = await page.evaluate(() =>
      localStorage.getItem("cinelva-library-records-v2"),
    );
    await page
      .locator("#importFile")
      .setInputFiles({
        name: "bad.json",
        mimeType: "application/json",
        buffer: Buffer.from('{"records":[{"id":1,"title":"bad","rating":8}]}'),
      });
    await page.waitForFunction(() =>
      document.getElementById("status").textContent.includes("復元できません"),
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("cinelva-library-records-v2"),
      ),
      before,
    );
    await page.locator('#recordList [data-record-card="900003"] .cinelva-rate-button').click();
    await page.locator("#cinelvaRateScore").fill("0");
    await page.locator("#cinelvaRateSave").click();
    assert.equal(await page.evaluate(()=>CinelvaLibraryRecords.all().some(r=>r.id==="900003")),false);
    page.once("dialog", (d) => d.accept());
    await page
      .locator("#importFile")
      .setInputFiles({
        name: "records.json",
        mimeType: "application/json",
        buffer: backup,
      });
    await page.waitForFunction(() => CinelvaLibraryRecords.all().length === 2);
    await page.goto(base + "/my-cinemap.html");
    await page.locator("#save").waitFor();
    assert.ok(await page.locator("#art").evaluate((c) => c.width > 0));
    const art = page.waitForEvent("download");
    await page.locator("#save").click();
    assert.match((await art).suggestedFilename(), /cinelva-.*\.png/);
    const dense = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await dense.route("https://backend-one-gray-94.vercel.app/**", (r) =>
      r.abort(),
    );
    await dense.addInitScript(() => {
      localStorage.setItem(
        "cinelva-library-records-v2",
        JSON.stringify(
          Object.fromEntries(
            Array.from({ length: 1000 }, (_, i) => [
              String(8000000 + i),
              {
                id: String(8000000 + i),
                title: "Film " + i,
                year: 2000,
                rating: 4,
                watchedAt: "2026-01-01",
              },
            ]),
          ),
        ),
      );
    });
    const dp = await dense.newPage();
    dp.on("pageerror", (e) => console.error("dense error", e.message));
    await dp.goto(base + "/my-cinelva/");
    await dp
      .waitForFunction(
        () =>
          document.getElementById("csLifetime")?.textContent === "1,000" ||
          document.getElementById("csLifetime")?.textContent === "1000",
        null,
        { polling: 100, timeout: 60000 },
      )
      .catch(async (e) => {
        console.error(
          await dp.evaluate(() => ({
            count: CinelvaLibraryRecords.all().length,
            lifetime: document.getElementById("csLifetime")?.textContent,
            status: document.getElementById("status")?.textContent,
          })),
        );
        throw e;
      });
    assert.equal(await dp.locator('#csPrisms,#csCrowns,.cs-prism,.cs-crown').count(),0,
      'retired lifetime reward decorations must stay removed at1000 records');
    await dp.locator('[data-tab="records"]').click();
    assert.equal(
      await dp.locator("#recordList [data-record-card]").count(),
      1000,
    );
    assert.ok(
      await dp.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await dense.close();
    const empty=await browser.newContext({viewport:{width:390,height:844}});
    await empty.route('https://backend-one-gray-94.vercel.app/**',r=>r.abort());
    const ep=await empty.newPage();
    await ep.goto(base+'/my-cinelva/');
    await ep.waitForFunction(()=>document.querySelectorAll('#yearHeatmap .cy-month').length===12);
    assert.equal(await ep.locator('#csYears').isVisible(),false,'no empty year graph should reserve space');
    assert.ok(await ep.locator('#summaryView .cs-top').evaluate(el=>el.getBoundingClientRect().height<190),
      'zero-record lifetime and year counts must remain compact');
    fs.mkdirSync('artifacts/route-audit/summary-empty',{recursive:true});
    await ep.screenshot({path:`artifacts/route-audit/summary-empty/${process.env.CINELVA_BROWSER||'chromium'}-390.png`});
    await empty.close();
    assert.deepEqual(errors, []);
    console.log(
      "My Cinelva summary, 3x4 blue calendar, all-time years, awards, directors, shared review, bookmarks, search variants, persistence, backup/restore, PNG export and 1000 records passed",
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
