/* Shared movie identity. Local/event IDs are never implicitly TMDB IDs. */
(function (root) {
  "use strict";
  const byId = new Map(),
    aliases = new Map(),
    pending = new Map(),
    bound = new WeakSet();
  const CACHE_KEY = "cinelva-poster-registry-v1",
    BAD_KEY = "cinelva-broken-posters-v1",
    MAX_CACHE = 3000;
  const norm = (s) =>
    String(s || "")
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  const year = (m) =>
    Number(
      m?.release_year || m?.year || String(m?.release_date || "").slice(0, 4),
    ) || 0;
  const positive = (v) =>
    Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : 0;
  function id(m) {
    const link = String(m?.tmdb || m?.tmdb_url || "").match(
      /^https:\/\/(?:www\.)?themoviedb\.org\/movie\/(\d+)(?:[/?#-]|$)/,
    );
    const explicit =
      m?.tmdb_id ?? m?.tmdbId ?? m?.tmdbID ?? m?.tmdb?.id ?? link?.[1];
    const tmdbShaped =
      m?.poster_path &&
      m?.release_date &&
      (m?.vote_average !== undefined || m?.vote_count !== undefined);
    return positive(explicit ?? (tmdbShaped ? m?.id : 0));
  }
  function normalizePoster(value) {
    let v = typeof value === "string" ? value.trim() : "";
    if (!v || /[<>"'\s]/.test(v)) return "";
    if (v.startsWith("//")) v = "https:" + v;
    if (/^\/(?!\/)[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(v))
      v = "https://image.tmdb.org/t/p/w500" + v;
    if (/^(?:w\d+|original)\/[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(v))
      v = "https://image.tmdb.org/t/p/" + v;
    try {
      const u = new URL(v);
      if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
        return "";
      if (u.hostname === "image.tmdb.org") {
        if (
          !/^\/t\/p\/(w\d+|original)\/[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(
            u.pathname,
          )
        )
          return "";
        u.protocol = "https:";
        u.pathname = u.pathname.replace(
          /\/t\/p\/(w\d+|original)\//,
          "/t/p/w500/",
        );
        u.search = "";
      }
      return u.href;
    } catch {
      return "";
    }
  }
  let stored = {},
    broken = [];
  try {
    stored = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") || {};
  } catch {}
  try {
    broken = JSON.parse(localStorage.getItem(BAD_KEY) || "[]");
  } catch {}
  const badPosters = new Set(
    Array.isArray(broken) ? broken.map(normalizePoster).filter(Boolean) : [],
  );
  if (!stored || typeof stored !== "object" || Array.isArray(stored))
    stored = {};
  stored = Object.fromEntries(
    Object.entries(stored)
      .filter(([key]) => positive(key))
      .map(([key, url]) => [key, normalizePoster(url)])
      .filter(([, url]) => url && !badPosters.has(url)),
  );
  function save() {
    try {
      stored = Object.fromEntries(Object.entries(stored).slice(-MAX_CACHE));
      localStorage.setItem(CACHE_KEY, JSON.stringify(stored));
      localStorage.setItem(
        BAD_KEY,
        JSON.stringify([...badPosters].slice(-500)),
      );
    } catch {}
  }
  const poster = (m) =>
    [
      m?.poster,
      m?.poster_url,
      m?.posterUrl,
      m?.poster_path,
      m?.posterPath,
      m?.posterURL,
      m?.images?.poster,
      m?.images?.poster_path,
    ]
      .map(normalizePoster)
      .find((v) => v && !badPosters.has(v)) || "";
  function ingest(m) {
    const key = id(m);
    if (!key) return null;
    const prev = byId.get(key) || {};
    const next = {
      ...prev,
      ...m,
      id: key,
      tmdbId: key,
      title: m.title || prev.title || "",
      year: year(m) || year(prev),
      poster: poster(prev) || poster(m) || stored[key] || "",
    };
    byId.set(key, next);
    if (next.poster) {
      stored[key] = next.poster;
      save();
    }
    for (const title of [next.title, next.original_title, m.film_title]) {
      const n = norm(title);
      if (!n || !next.year) continue;
      const k = n + "|" + next.year;
      if (!aliases.has(k)) aliases.set(k, new Set());
      aliases.get(k).add(key);
    }
    return next;
  }
  function ingestMany(rows) {
    for (const m of rows || []) ingest(m);
  }
  function resolve(q) {
    const key = id(q);
    if (key)
      return (
        byId.get(key) ||
        (stored[key] ? { id: key, tmdbId: key, poster: stored[key] } : null)
      );
    const n = norm(q?.film_title || q?.title || q?.original_title),
      y = year(q);
    if (!n || !y) return null;
    const hits = aliases.get(n + "|" + y);
    return hits?.size === 1 ? byId.get([...hits][0]) : null;
  }
  // The existing /api/movies contract returns TMDB numeric IDs; database IDs are strings.
  function fromApi(m) {
    return {
      ...m,
      tmdbId: id(m) || (typeof m?.id === "number" ? positive(m.id) : 0),
    };
  }
  async function fetchOne(q) {
    const cached = resolve(q);
    if (cached?.poster && !badPosters.has(cached.poster)) return cached;
    const wanted = id(q),
      y = year(q),
      title = q?.film_title || q?.title || "";
    if ((!title && !wanted) || (!wanted && !y)) return cached || null;
    const key = wanted || norm(title) + "|" + y;
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      try {
        if(wanted && !title){const r=await fetch('https://backend-one-gray-94.vercel.app/api/movie-detail?'+new URLSearchParams({id:String(wanted)}));if(!r.ok)return cached||null;const data=await r.json(),movie=fromApi(data.movie||{});return id(movie)===wanted?ingest(movie):cached||null;}
        const r = await fetch(
          "https://backend-one-gray-94.vercel.app/api/movies?" +
            new URLSearchParams({ q: title, limit: "30" }),
        );
        if (!r.ok) return cached;
        const d = await r.json(),
          rows = [
            ...(d.movies || []),
            ...(d.external || []),
            ...(d.results || []),
          ].map(fromApi);
        const matches = rows.filter((m) =>
          wanted
            ? id(m) === wanted
            : year(m) === y &&
              [m.title, m.original_title, m.originalTitle].some(
                (t) => norm(t) === norm(title),
              ),
        );
        if (new Set(matches.map(id).filter(Boolean)).size !== 1)
          return cached || null;
        const match = matches.find((m) => poster(m));
        return match ? ingest(match) : cached || null;
      } catch {
        return cached || null;
      }
    })();
    pending.set(key, task);
    try {
      return await task;
    } finally {
      pending.delete(key);
    }
  }
  function posterFor(m) {
    const key = id(m),
      known = resolve(m);
    if (known?.poster && !badPosters.has(known.poster)) return known.poster;
    const direct = poster(m);
    if (direct && key) return ingest(m)?.poster || direct;
    return direct;
  }
  function reportBroken(m, url) {
    const broken = normalizePoster(url || poster(m));
    if (!broken) return;
    badPosters.add(broken);
    for (const [key, p] of Object.entries(stored))
      if (p === broken) delete stored[key];
    for (const [key, entry] of byId)
      if (entry.poster === broken) byId.set(key, { ...entry, poster: "" });
    save();
  }
  function hydratePoster(image, m) {
    if (!image || !m || bound.has(image)) return;
    bound.add(image);
    image.onerror = null;
    const parent = image.parentElement;
    let fallback = parent?.querySelector("[data-poster-fallback]");
    const show = () => {
      image.hidden = false;
      image.style.removeProperty("display");
      parent?.classList.remove("posterMissing");
      if (fallback) fallback.hidden = true;
      image.dataset.posterFailed = "";
    };
    const fail = () => {
      image.hidden = true;
      image.style.setProperty("display", "none", "important");
      image.dataset.posterFailed = "1";
      if (parent && !fallback) {
        fallback = document.createElement("span");
        fallback.dataset.posterFallback = "";
        fallback.textContent = "ポスター未取得";
        parent.append(fallback);
      }
      if (fallback) fallback.hidden = false;
    };
    image.addEventListener("load", show);
    image.addEventListener("error", async () => {
      fail();
      reportBroken(m, image.currentSrc || image.src);
      if (image.dataset.posterRetry === "1") {
        fail();
        return;
      }
      image.dataset.posterRetry = "1";
      const next = await fetchOne({
        ...m,
        poster: "",
        poster_url: "",
        posterUrl: "",
        poster_path: "",
        posterPath: "",
        posterURL: "",
        images: null,
      });
      if (next?.poster && image.isConnected) {
        image.src = next.poster;
      } else fail();
    });
    const url = posterFor(m);
    if (url && normalizePoster(image.getAttribute("src")) !== url) image.src = url;
    if (image.complete && image.naturalWidth > 0) show();
    else if (image.complete && image.getAttribute("src"))
      image.dispatchEvent(new Event("error"));
  }
  function hydrateCard(container, m) {
    if (!container || !m) return;
    const apply = (url) => {
      if (!url || !container.isConnected) return;
      let image = container.querySelector("img");
      if (!image) {
        image = document.createElement("img");
        image.loading = "lazy";
        image.alt = "";
        container.appendChild(image);
      }
      hydratePoster(image, m);
      if (normalizePoster(image.getAttribute("src")) !== url) image.src = url;
    };
    const direct = posterFor(m);
    if (direct) {
      apply(direct);
      return;
    }
    if (container.dataset.cinelvaPosterPending === "1") return;
    container.dataset.cinelvaPosterPending = "1";
    const run = async () => {
      try {
        const next = await fetchOne(m);
        if (next?.poster) apply(next.poster);
      } finally {
        delete container.dataset.cinelvaPosterPending;
      }
    };
    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer.disconnect();
            run();
          }
        },
        { rootMargin: "240px" },
      );
      observer.observe(container);
    } else run();
  }
  // Bind existing renderers, including cards inserted by filters, dialogs and pagination.
  const mounted = new WeakMap();
  function bindPosters(scope = document) {
    let recordsById;
    const selector =
      ".poster,.streamMoviePoster,.tvMoviePoster,.presetCardPoster,.want-watch-poster,.awardPoster,.outdoorFilmItem,.filmCard,.boxPoster";
    const containers = [
      ...(scope.matches?.(selector) ? [scope] : []),
      ...(scope.querySelectorAll?.(selector) || []),
    ];
    for (const container of containers) {
      const card =
        container.closest(
          "[data-mi],[data-i],[data-popular-id],[data-id],[data-record-card],[data-box-film],.want-watch-item,.outdoorFilmEntry,.outdoorFilmWrap,.rankCard,.award-film-unit",
        ) || container;
      let movie = null;
      if (card.dataset.mi !== undefined)
        movie = root.CinelvaRatingResolve?.(card.dataset.mi, "calendar");
      else if (card.dataset.i !== undefined)
        movie = root.CinelvaRatingResolve?.(card.dataset.i, "search");
      if (!movie && card.dataset.recordCard) {
        recordsById =
          recordsById ||
          new Map(
            (root.CinelvaLibraryRecords?.all() || []).map((r) => [
              String(r.id),
              r,
            ]),
          );
        const record = recordsById.get(card.dataset.recordCard);
        if (record)
          movie = {
            ...record,
            tmdbId: record.tmdbId ?? record.tmdb_id ?? record.id,
          };
      }
      const link = card.matches('a[href*="search.html"]')
        ? card
        : card.querySelector('a[href*="search.html"]');
      let linkId = 0,
        title = "";
      if (link) {
        const u = new URL(link.href, location.href);
        linkId = positive(u.searchParams.get("id"));
        title = u.searchParams.get("search") || "";
      }
      const explicit =
        positive(
          card.dataset.popularId || card.dataset.id || card.dataset.boxId,
        ) || linkId;
      movie = movie || {
        tmdbId: explicit,
        title:
          title ||
          card.querySelector(".title,.streamMovieTitle,.tvMovieTitle,strong,b")
            ?.textContent ||
          card.dataset.boxFilm ||
          "",
        year: card.dataset.boxYear,
      };
      const signature = [id(movie), movie.title, year(movie)].join("|");
      if (mounted.get(container) === signature) continue;
      mounted.set(container, signature);
      const image = container.querySelector("img");
      if (image) {
        const direct = normalizePoster(image.getAttribute("src"));
        if (direct) movie = { ...movie, poster: posterFor(movie) || direct };
        hydratePoster(image, movie);
      } else if (id(movie) || year(movie)) hydrateCard(container, movie);
    }
  }
  if (
    typeof document !== "undefined" &&
    typeof MutationObserver !== "undefined"
  ) {
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        bindPosters();
      });
    };
    const start = () => {
      bindPosters();
      new MutationObserver((records) => {
        if (records.some((r) => r.addedNodes.length)) schedule();
      }).observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }

  root.CinelvaMovieIdentity = {
    id,
    year,
    fromApi,
    normalizePoster,
    ingest,
    ingestMany,
    resolve,
    fetchOne,
    posterFor,
    hydratePoster,
    hydrateCard,
    reportBroken,
    stats: () => ({
      movies: byId.size,
      posters: Object.keys(stored).length,
      aliases: aliases.size,
    }),
  };
})(window);
