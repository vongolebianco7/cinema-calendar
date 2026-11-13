const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { chromium, webkit } = require("playwright");
const { waitForLocalServer } = require("./helpers/local-server.cjs");

(async () => {
  const engineName = process.env.CINELVA_BROWSER === "webkit" ? "webkit" : "chromium";
  const engine = engineName === "webkit" ? webkit : chromium;
  const browser = await engine.launch();
  const listener = net.createServer();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn("python", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { stdio: "ignore" });
  const recordsKey = "cinelva-library-records-v2";
  const records = { "807": { title: "既存の鑑賞記録", year: 2020, rating: 4.3, watched: true, watchedAt: "2025-01-02" } };
  const poster = "https://image.tmdb.org/t/p/w342/seven-fixture.png";
  const movies = [
    { id: 807, tmdbId: 807, title: "セブン", original_title: "Se7en", year: 1995, poster },
    { id: 900001, tmdbId: 900001, title: "テスト作品A", year: 2024, poster },
    { id: 900002, tmdbId: 900002, title: "テスト作品B", year: 2023, poster },
    { id: 900003, tmdbId: 900003, title: "テスト作品C", year: 2022, poster },
  ];
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1sAAAAASUVORK5CYII=", "base64");
  let context;
  try {
    await waitForLocalServer(port);
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await context.addInitScript(({ recordsKey, records }) => {
      localStorage.setItem("cinemap-my-list", JSON.stringify([
        { id: 807, tmdbId: 807, title: "セブン", year: 1995, poster: "" },
      ]));
      localStorage.setItem(recordsKey, JSON.stringify(records));
    }, { recordsKey, records });
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/movies") {
        return route.fulfill({ json: { movies: movies.slice(1) } });
      }
      if (url.origin === origin && url.pathname === "/data/movies.json") {
        return route.fulfill({ json: { movies } });
      }
      if (url.hostname === "image.tmdb.org") {
        return route.fulfill({
          status: 200,
          contentType: "image/png",
          headers: { "access-control-allow-origin": "*" },
          body: image,
        });
      }
      if (url.origin === origin) return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${origin}/my-best10.html`, { waitUntil: "domcontentloaded" });
    const markPixels = await page.evaluate(() => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1254;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        resolve({ tile: context.getImageData(600, 700, 1, 1).data[3], emblem: context.getImageData(627, 627, 1, 1).data[3] });
      };
      image.onerror = reject;
      image.src = "assets/cinelva-best10-mark-transparent.png";
    }));
    assert.equal(markPixels.tile, 0, "the logo's black tile is transparent in the exported mark");
    assert.ok(markPixels.emblem > 200, "the original white logo emblem remains visible");
    await page.waitForFunction(() => {
      const img = document.querySelector("#list img");
      return img && img.complete && img.naturalWidth > 0;
    });
    assert.match(await page.locator("#list img").getAttribute("src"), /seven-fixture\.png$/, "the verified Seven poster is recovered from the local catalog");
    await page.locator("#q").fill("テスト作品");
    await page.locator("#go").click();
    await page.waitForFunction(() => document.querySelectorAll("#results .result").length === 3, null, { timeout: 5000 }).catch(() => {});
    const candidateCount = await page.locator("#results .result").count();
    assert.equal(candidateCount, 3, `expected 3 matching candidates for "${await page.locator("#q").inputValue()}"; got ${candidateCount}: ${await page.locator("#results").innerText()}`);
    for (const width of [320, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2),
        `${engine.name} ${width}px must not overflow horizontally`,
      );
      assert.equal(await page.locator("#results .result").count(), 3, "multiple candidates stay available");
      assert.equal(await page.locator("#results .result").nth(2).isVisible(), true, "the third candidate is visible and selectable");
    }
    const firstResult = page.locator("#results .result").first();
    const rowButtons = firstResult.locator("button");
    assert.equal(await rowButtons.count(), 2, "the row keeps ranking and candidate-box actions");
    const actionLabels = await rowButtons.allTextContents();
    assert.deepEqual(actionLabels.map((label) => label.trim()), ["ランキングに追加", "候補箱へ"]);
    const addButton = firstResult.getByRole("button", { name: "ランキングに追加", exact: true });
    assert.equal(await addButton.count(), 1, "ranking add action exposes its visible accessible name");
    await addButton.click({ timeout: 5000 });
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "2/10");
    await page.locator("#layout").selectOption("double");
    assert.equal(await page.locator("#layout").inputValue(), "double");
    const canvasData = await page.locator("#artCanvas").evaluate((canvas) => canvas.toDataURL());
    assert.match(canvasData, /^data:image\/png;base64,/);
    assert.ok(canvasData.length > 1000, "the populated ranking renders an exportable portrait image");
    const ratingStars = await page.evaluate(() => {
      document.getElementById("showMyRating").checked = true;
      document.getElementById("theme").value = "cinema-projector";
      drawArtwork(picks);
      return document.getElementById("artCanvas").toDataURL();
    });
    assert.match(ratingStars, /^data:image\/png;base64,/);
    assert.match(await page.locator("script[src*='my-cinemap-art.js']").getAttribute("src"), /20261114-sharp-stars-logo/);
    await page.locator("#saveToPhotos").click();
    await page.locator("#saveImageDialog[open]").waitFor();
    assert.match(await page.locator("#saveImagePreview").getAttribute("src"), /^data:image\/png;base64,/);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), recordsKey), JSON.stringify(records), "poster hydration and export do not alter canonical viewing records");
    assert.deepEqual(pageErrors, []);
    fs.mkdirSync("artifacts/my-best10", { recursive: true });
    await page.screenshot({ path: `artifacts/my-best10/${engineName}-390.png`, fullPage: true });
    console.log(`${engineName}: Seven poster recovery, multi-result editing, 320/375/390/430px layout and image-save preview passed without changing viewing records`);
  } finally {
    await context?.close();
    await browser.close();
    server.kill("SIGTERM");
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
