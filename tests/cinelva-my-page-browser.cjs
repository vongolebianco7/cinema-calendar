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
        d.works?.some((w) => w.runtime >= 30),
      ),
      film = director.works.find((w) => w.runtime >= 30);
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
    const columns = await page
      .locator("#yearHeatmap")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
    assert.equal(columns, 4);
    assert.equal(await page.locator("#yearHeatmap>.cy-month").count(), 12);
    assert.equal(await page.locator("#yearHeatmap .cy-medal").count(), 0);
    await page.locator("#csPeriod").selectOption("all");
    await page.locator("#yearHeatmap>.cy-year-card").first().waitFor();
    assert.ok((await page.locator("#yearHeatmap>.cy-year-card").count()) >= 2);
    await page.locator('[data-tab="awards"]').click();
    assert.match(await page.locator("#awardMatrix").innerText(), /年代/);
    await page.locator('[data-tab="directors"]').click();
    await page.locator(".director-pick").first().click();
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
    await page.locator("#cinelvaRatePlace").selectOption("配信");
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
    page.once("dialog", (d) => d.accept());
    await page.locator('#recordList [data-delete="900003"]').click();
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
    assert.deepEqual(errors, []);
    console.log(
      "My Cinelva summary, 4x3 blue calendar, all-time years, awards, directors, shared review, bookmarks, search variants, persistence, backup/restore, PNG export and 1000 records passed",
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
