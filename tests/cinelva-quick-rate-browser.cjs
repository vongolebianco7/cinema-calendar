const { waitForLocalServer } = require("./helpers/local-server.cjs");
const { chromium, webkit } = require("playwright"),
  { spawn } = require("child_process"),
  net = require("net"),
  assert = require("assert/strict");
(async () => {
  const socket = net.createServer();
  await new Promise((r) => socket.listen(0, "127.0.0.1", r));
  const port = socket.address().port;
  await new Promise((r) => socket.close(r));
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
    const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/api/movies?*", (r) =>
      r.fulfill({ json: { movies: [], external: [] } }),
    );
    await page.route("**/data/movies.json*", (r) =>
      r.fulfill({
        json: {
          movies: [
            {
              id: 111,
              tmdbId: 111,
              title: "スター・ウォーズ",
              year: 1977,
              score: 8,
              votes: 100,
            },
          ],
        },
      }),
    );
    const url = `http://127.0.0.1:${port}/search.html?search=スターウォーズ`;
    await page.goto(url);
    const eye = page.locator("#grid .cinelva-rate-button").first(),
      bookmark = page.locator("#grid .cinelva-bookmark-button").first();
    await eye.waitFor();
    assert.equal(await page.locator('#grid input[type="range"]').count(), 0);
    await bookmark.click();
    assert.equal(await bookmark.getAttribute("aria-pressed"), "true");
    assert.match(
      await page.locator("#cinelva-bookmark-toast").innerText(),
      /ブックマークしました/,
    );
    await eye.click();
    const today = await page.evaluate(() =>
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10),
    );
    assert.equal(await page.locator("#cinelvaRateDate").inputValue(), today);
    await page.locator("#cinelvaRateScore").fill("4.1");
    await page.locator("#cinelvaRatePlace").selectOption("映画館");
    await page.locator("#cinelvaRateComment").fill("よかった");
    await page.locator("#cinelvaRateSave").click();
    assert.equal(
      await page.locator(".cinelva-rate-dialog").evaluate((x) => x.open),
      false,
    );
    await page.reload();
    await eye.waitFor();
    assert.match(
      await page.locator("#grid .cinelva-rating-personal").first().innerText(),
      /4.1/,
    );
    assert.equal(await bookmark.getAttribute("aria-pressed"), "true");
    await page.evaluate(() => {
      const key = "cinelva-library-records-v2",
        data = JSON.parse(localStorage.getItem(key));
      data["900001"] = { ...data["111"], id: "900001", tmdbId: 111 };
      delete data["111"];
      localStorage.setItem(key, JSON.stringify(data));
    });
    await page.reload();
    await eye.click();
    assert.equal(
      await page.locator("#cinelvaRateComment").inputValue(),
      "よかった",
    );
    await page.locator("#cinelvaRateScore").fill("4.2");
    await page.locator("#cinelvaRateSave").click();
    let records = await page.evaluate(() => CinelvaLibraryRecords.all());
    assert.equal(records.length, 1);
    assert.equal(records[0].id, "900001");
    assert.equal(records[0].rating, 4.2);
    await eye.click();
    await page.locator("#cinelvaRateScore").fill("0");
    await page.locator("#cinelvaRateSave").click();
    assert.equal(
      (await page.evaluate(() => CinelvaLibraryRecords.all())).length,
      0,
    );
    assert.match(
      await page.locator("#grid .cinelva-rating-personal").first().innerText(),
      /未鑑賞/,
    );
    assert.equal(
      await bookmark.getAttribute("aria-pressed"),
      "true",
      "clearing rating preserves independent bookmark",
    );
    await bookmark.click();
    assert.equal(await bookmark.getAttribute("aria-pressed"), "false");
    assert.deepEqual(errors, []);
    console.log(
      "Shared review, 0.1 score, today, save/close, zero/unwatched, bookmark/toast, reload and imported-ID edit passed",
    );
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
