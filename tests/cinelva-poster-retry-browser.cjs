const { chromium } = require("playwright"),
  fs = require("fs"),
  assert = require("assert/strict");
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    let release;
    const reply = new Promise((r) => (release = r));
    await page.route("**/bad.jpg", (r) => r.abort());
    await page.route("**/good.png", (r) =>
      r.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1sAAAAASUVORK5CYII=",
          "base64",
        ),
      }),
    );
    await page.route("**/api/movies?*", async (r) => {
      await reply;
      await r.fulfill({
        json: {
          movies: [
            { tmdbId: 550, title: "Film", year: 2000, poster: "/good.png" },
          ],
        },
      });
    });
    await page.setContent(
      '<style>img{display:block!important}.poster{width:100px;min-height:150px}.poster img{width:100%;height:100%}.rankPoster{width:100px;aspect-ratio:2/3;background:#222}.rankPoster img{width:100%;height:100%}[data-poster-fallback]{display:block}</style><div id="poster" class="poster">ポスター未取得<img src="https://image.tmdb.org/t/p/w500/bad.jpg"></div><div class="rankCard" data-popular-id="550"><div class="rankPoster"><img src="https://image.tmdb.org/t/p/w500/bad.jpg"></div><b>Film</b></div>',
    );
    await page.addScriptTag({
      content: fs.readFileSync("js/cinelva-movie-identity.js", "utf8"),
    });
    await page.evaluate(() =>
      CinelvaMovieIdentity.hydrateCard(document.getElementById("poster"), {
        tmdbId: 550,
        title: "Film",
        poster: "/bad.jpg",
      }),
    );
    await page.waitForFunction(() => document.querySelector("#poster img")?.complete);
    assert.equal(
      await page.locator("#poster img").isVisible(),
      false,
      "the broken-image icon must disappear before a slow retry finishes",
    );
    assert.match(await page.locator("#poster").innerText(), /ポスター未取得/);
    await page.waitForFunction(() => document.querySelector(".rankCard img")?.dataset.posterFailed === "1");
    assert.equal(await page.locator(".rankCard img").isVisible(), false, "ranking cards hide failed images");
    assert.equal(await page.locator(".rankCard [data-poster-fallback]").innerText(), "画像なし", "ranking cards expose a readable fallback");
    release();
    await page.waitForFunction(
      () => document.querySelector("#poster img")?.naturalWidth > 0 && document.querySelector(".rankCard img")?.naturalWidth > 0,
    );
    assert.equal(await page.locator("#poster img").isVisible(), true);
    assert.match(await page.locator("#poster img").getAttribute("src"), /good.png$/);
    assert.equal(
      await page.locator("#poster [data-poster-fallback]").isVisible(),
      false,
    );
    assert.equal(await page.locator('#poster').innerText(),'','recovered artwork removes the stale fallback label');
    console.log(
      "Failed artwork immediately falls back under forced display CSS and recovers after one shared retry",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
