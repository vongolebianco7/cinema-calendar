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
