const { chromium, request } = require("playwright"),
  { spawn } = require("child_process"),
  { waitForLocalServer } = require("./helpers/local-server.cjs"),
  net = require("net"),
  fs = require("fs");
(async () => {
  const l = net.createServer();
  await new Promise((r) => l.listen(0, "127.0.0.1", r));
  const port = l.address().port;
  await new Promise((r) => l.close(r));
  let server;
  if (!process.env.CINELVA_TEST_BASE) {
    server = spawn(
      "python",
      ["-m", "http.server", String(port), "--bind", "127.0.0.1"],
      { stdio: "ignore" },
    );
    await waitForLocalServer(port);
  }
  const base = process.env.CINELVA_TEST_BASE || `http://127.0.0.1:${port}`,
    browser = await chromium.launch(),
    report = {
      base,
      image_transport: process.env.CINELVA_TEST_PROXY
        ? "actual CDN bytes through configured environment proxy"
        : "browser network",
      api_mode: process.env.CINELVA_OFFLINE_API ? "offline fallback" : "live",
      generated_at: new Date().toISOString(),
      results: [],
    };
  fs.mkdirSync("artifacts/final-quality", { recursive: true });
  const cdn = process.env.CINELVA_TEST_PROXY
    ? await request.newContext({
        proxy: { server: process.env.HTTPS_PROXY },
        ignoreHTTPSErrors: true,
      })
    : null;
  const sampleMovie=JSON.parse(fs.readFileSync('data/revival_screenings.json','utf8')).screenings.find(m=>m.tmdbId===587);
  const cdnCache = new Map();
  try {
    for (const width of [375, 390, 768])
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width, height: 844 },
        });
        if (cdn)
          await context.route("https://image.tmdb.org/**", async (route) => {
            try {
              const url = route.request().url();
              if (!cdnCache.has(url))
                cdnCache.set(
                  url,
                  cdn
                    .get(url, { timeout: 15000 })
                    .then(async (response) => ({
                      status: response.status(),
                      headers: response.headers(),
                      body: await response.body(),
                    })),
                );
              await route.fulfill(await cdnCache.get(url));
            } catch {
              await route.abort();
            }
          });
        if (process.env.CINELVA_OFFLINE_API)
          await context.route(
            "https://backend-one-gray-94.vercel.app/**",
            (route) => route.abort(),
          );
        await context.addInitScript(
          (t) => localStorage.setItem("cinelva-theme-v1", t),
          theme,
        );
        await context.addInitScript(m=>localStorage.setItem('cinelva-library-records-v2',JSON.stringify({[m.tmdbId]:{...m,id:String(m.tmdbId),watched:true,rating:4.1,watchedAt:'2026-10-20'}})),sampleMovie);
        const page = await context.newPage();
        for (const path of [
          "index.html",
          "discover.html",
          "search.html?search=もののけ姫",
          "rankings.html?axis=boxoffice",
          "my-cinelva/",
          "events.html",
          "experience.html",
          "revivals.html",
          "agent.html",
          "critic.html?id=128",
        ]) {
          const errors = [],
            failures = [];
          const onError = (e) => errors.push(e.message),
            onFailure = (r) => {
              if (r.resourceType() === "image")
                failures.push({ url: r.url(), error: r.failure()?.errorText });
            };
          page.on("pageerror", onError);
          page.on("requestfailed", onFailure);
          try {
            await page.goto(base + "/" + path, {
              waitUntil: "domcontentloaded",
            });
            await page
              .locator("main,.wrap")
              .first()
              .waitFor({ state: "attached" });
            if(path==='events.html')await page.locator('.filmPoster').first().scrollIntoViewIfNeeded().catch(()=>{});
            if(path==='my-cinelva/')await page.locator('[data-tab="records"]').click();
            if(path==='experience.html'){
              // Replay a captured canonical API record; artwork still loads actual CDN bytes.
              await page.route('**/api/movies?*',r=>r.fulfill({json:{movies:[sampleMovie],external:[]}}));
              await page.locator('#formatFilm').fill(sampleMovie.title);
              await page.locator('[data-candidate-index="0"]').first().click();
            }
            await page.waitForTimeout(2000);
            await page
              .waitForFunction(
                () =>
                  [
                    ...document.querySelectorAll(
                      ".poster img,.streamMoviePoster img,.tvMoviePoster img,.presetCardPoster img,.filmPoster,img.poster,img.selectedMoviePoster,[data-box-poster]",
                    ),
                  ]
                    .filter((i) => {
                      const r = i.getBoundingClientRect();
                      return r.top < innerHeight + 240 && r.bottom > 0;
                    })
                    .slice(0, 12)
                    .every((i) => i.complete),
                null,
                { polling: 200, timeout: 15000 },
              )
              .catch(() => {});
            const samples = await page
              .locator(
                ".poster img,.streamMoviePoster img,.tvMoviePoster img,.presetCardPoster img,.want-watch-poster img,.filmPoster,img.poster,img.selectedMoviePoster,[data-box-poster]",
              )
              .evaluateAll((images) =>
                images
                  .filter((i) => {
                    const r = i.getBoundingClientRect();
                    return r.top < innerHeight + 240 && r.bottom > 0;
                  })
                  .slice(0, 12)
                  .map((i) => ({
                    title:
                      i
                        .closest(
                          "article,.card,.rankCard,.awardCard,.presetCard,.filmCard,.hero",
                        )
                        ?.querySelector(
                          ".title,.presetCardTitle,.streamMovieTitle,.tvMovieTitle,strong,b,h1,.filmTitle",
                        )?.textContent || i.alt,
                    src: i.currentSrc || i.src,
                    complete: i.complete,
                    loaded: i.complete && i.naturalWidth > 0,
                    hidden: i.hidden || getComputedStyle(i).display === "none",
                  })),
              );
            report.results.push({
              path,
              final_url: page.url(),
              width,
              theme,
              samples,
              errors,
              failures,
              overflow: await page.evaluate(
                () => document.documentElement.scrollWidth > innerWidth,
              ),
            });
            if (
              width === 390 &&
              theme === "light" &&
              (path.startsWith("search") || path.startsWith("rankings"))
            )
              await page.screenshot({
                path:
                  "artifacts/final-quality/" + path.split(".")[0] + "-390.png",
              });
          } catch (e) {
            report.results.push({ path, width, theme, error: e.message });
          } finally {
            page.off("pageerror", onError);
            page.off("requestfailed", onFailure);
          }
        }
        await context.close();
      }
  } finally {
    await cdn?.dispose();
    await browser.close();
    server?.kill();
    fs.writeFileSync(
      "artifacts/final-quality/poster-sample.json",
      JSON.stringify(report, null, 2),
    );
    const samples = report.results.flatMap((r) => r.samples || []);
    console.log(
      JSON.stringify({
        page_loads: report.results.length,
        sampled_images: samples.length,
        loaded: samples.filter((x) => x.loaded).length,
        failed: samples.filter((x) => x.complete && !x.loaded).length,
        pending: samples.filter((x) => !x.complete).length,
        page_errors: report.results.reduce(
          (n, r) => n + (r.errors?.length || 0),
          0,
        ),
        overflow: report.results.filter((r) => r.overflow).length,
      }),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
