'use strict';

const GENRE_TAXONOMY = [
  'サスペンス・ミステリー', '犯罪', 'アクション', 'SF', 'ファンタジー', 'ホラー',
  '恋愛', 'コメディ', 'アドベンチャー', '歴史・時代劇', '戦争', '青春・成長',
  '家族', '音楽・ミュージカル', 'ヒューマン',
];
const GENRE_ALIASES = new Map([
  [28, 'アクション'], [12, 'アドベンチャー'], [35, 'コメディ'], [80, '犯罪'],
  [10751, '家族'], [14, 'ファンタジー'], [36, '歴史・時代劇'], [27, 'ホラー'],
  [10402, '音楽・ミュージカル'], [9648, 'サスペンス・ミステリー'],
  [10749, '恋愛'], [878, 'SF'], [53, 'サスペンス・ミステリー'], [10752, '戦争'],
]);
const ALIASES_BY_NAME = new Map([
  ['action', 'アクション'], ['adventure', 'アドベンチャー'], ['comedy', 'コメディ'],
  ['crime', '犯罪'], ['family', '家族'], ['fantasy', 'ファンタジー'],
  ['history', '歴史・時代劇'], ['horror', 'ホラー'], ['music', '音楽・ミュージカル'],
  ['mystery', 'サスペンス・ミステリー'], ['romance', '恋愛'],
  ['science fiction', 'SF'], ['sci-fi', 'SF'], ['sf', 'SF'], ['thriller', 'サスペンス・ミステリー'],
  ['サイエンスフィクション', 'SF'], ['スリラー', 'サスペンス・ミステリー'], ['犯罪', '犯罪'],
  ['アクション', 'アクション'], ['アドベンチャー', 'アドベンチャー'], ['コメディ', 'コメディ'],
  ['ファンタジー', 'ファンタジー'], ['ホラー', 'ホラー'], ['恋愛', '恋愛'], ['ロマンス', '恋愛'],
  ['ファミリー', '家族'], ['ファミリー映画', '家族'], ['戦争', '戦争'], ['音楽', '音楽・ミュージカル'],
  ['ヒストリー', '歴史・時代劇'], ['歴史', '歴史・時代劇'], ['ミュージカル', '音楽・ミュージカル'],
  ['war', '戦争'], ['サスペンス', 'サスペンス・ミステリー'], ['ミステリー', 'サスペンス・ミステリー'],
  ['サイエンスフィクション', 'SF'], ['スリラー', 'サスペンス・ミステリー'], ['犯罪', '犯罪'],
  ['アクション', 'アクション'], ['アドベンチャー', 'アドベンチャー'], ['コメディ', 'コメディ'],
  ['ファンタジー', 'ファンタジー'], ['ホラー', 'ホラー'], ['恋愛', '恋愛'], ['ロマンス', '恋愛'],
  ['ファミリー', '家族'], ['ファミリー映画', '家族'], ['戦争', '戦争'], ['音楽', '音楽・ミュージカル'],
  ['ヒストリー', '歴史・時代劇'], ['歴史', '歴史・時代劇'], ['ミュージカル', '音楽・ミュージカル'],
  ['時代劇', '歴史・時代劇'], ['青春', '青春・成長'], ['成長', '青春・成長'],
  ['音楽', '音楽・ミュージカル'], ['ミュージカル', '音楽・ミュージカル'],
  ['ヒューマンドラマ', 'ヒューマン'], ['人間ドラマ', 'ヒューマン'],
]);
const FORMAT_NAMES = new Map([[16, 'アニメーション']]);
const COUNTRY_LATITUDE = new Map([
  ['日本', 36.2], ['Japan', 36.2], ['JP', 36.2], ['United States of America', 39.8], ['United States', 39.8], ['アメリカ', 39.8],
  ['United Kingdom', 54.0], ['イギリス', 54.0], ['France', 46.2], ['フランス', 46.2],
  ['Germany', 51.2], ['ドイツ', 51.2], ['South Korea', 36.5], ['韓国', 36.5],
  ['China', 35.9], ['中国', 35.9], ['India', 20.6], ['インド', 20.6],
  ['Italy', 41.9], ['イタリア', 41.9], ['Spain', 40.5], ['スペイン', 40.5],
  ['Canada', 56.1], ['カナダ', 56.1], ['Australia', -25.3], ['オーストラリア', -25.3],
]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalizedText = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');

function classifyGenres(genres) {
  const items = Array.isArray(genres) ? genres : [];
  const found = new Set(), formats = new Set(), workForms = new Set();
  for (const item of items) {
    const id = Number(item?.id ?? (typeof item === 'number' || /^\d+$/.test(String(item)) ? item : NaN));
    const name = String(item?.name ?? item ?? '').trim();
    if (FORMAT_NAMES.has(id) || /^(animation|アニメーション|アニメ)$/i.test(name)) formats.add('アニメーション');
    if (id === 99 || /^(documentary|ドキュメンタリー)$/i.test(name)) workForms.add('ドキュメンタリー');
    if (/^(stop[ -]?motion|ストップモーション)$/i.test(name)) formats.add('ストップモーション');
    if (/^(live[ -]?action|実写)$/i.test(name)) formats.add('実写');
    if (/^(fiction|フィクション)$/i.test(name)) workForms.add('フィクション');
    if (GENRE_TAXONOMY.includes(name)) found.add(name);
    const canonical = GENRE_ALIASES.get(id) || ALIASES_BY_NAME.get(name.toLocaleLowerCase()) || ALIASES_BY_NAME.get(name);
    if (canonical) found.add(canonical);
  }
  return { genres: GENRE_TAXONOMY.filter(name => found.has(name)), formats: [...formats], workForms: [...workForms] };
}

function pointForRecord(record) {
  const year = Number(record?.year) || Number(String(record?.releaseDate || '').slice(0, 4)) || null;
  const country = (Array.isArray(record?.countries) ? record.countries : [record?.region]).find(Boolean) || '国不明';
  const classified = classifyGenres(record?.genres || []);
  const genre = classified.genres[0] || '分類なし';
  const genreIndex = GENRE_TAXONOMY.indexOf(genre);
  const latitude = COUNTRY_LATITUDE.get(country);
  const rating = record?.rating == null ? NaN : Number(record.rating);
  return {
    id: String(record?.id ?? record?.tmdbId ?? ''), record,
    year, country, genre, latitude: latitude ?? null, format: classified.formats[0] || '形式不明',
    coordinates: {
      x: year === null ? 0.03 : 0.12 + clamp((year - 1900) / 130, 0, 1) * 0.88,
      y: latitude === undefined ? 0.03 : clamp(0.5 + latitude / 180, 0, 1),
      z: (genreIndex + 1) / GENRE_TAXONOMY.length,
    },
    size: Number.isFinite(rating) ? Math.round((0.75 + rating * 0.155) * 100) / 100 : 0.75,
  };
}

// Director filmographies use TMDB IDs while imported viewing records may carry
// a distinct local ID. Match explicit TMDB identities first, then legacy IDs.
// Never treat an unwatched marker as a viewing record.
function directorViewingRecord(records, work) {
  const target = work?.tmdb_id ?? work?.tmdbId ?? work?.id;
  if (target == null || String(target) === '') return null;
  const watched = (Array.isArray(records) ? records : []).filter(item => item && item.watched !== false);
  const byTmdb = watched.find(item => item.tmdbId != null && String(item.tmdbId) === String(target));
  if (byTmdb) return byTmdb;
  return watched.find(item => item.id != null && String(item.id) === String(target) &&
    (item.tmdbId == null || String(item.tmdbId) === String(target))) || null;
}

function awardOrganizations(awards) {
  return [...new Set((Array.isArray(awards) ? awards : []).map(item => item?.organization).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'));
}

function buildAwardHeatmap(records, awards, coverage = {}) {
  const watched = (Array.isArray(records) ? records : []).filter(record => record && record.id != null && record.watched !== false);
  const rows = Array.isArray(awards) ? awards : [];
  const organizations = awardOrganizations(rows);
  const decades = [...new Set(rows.map(item => Math.floor(Number(item?.year) / 10) * 10).filter(Number.isFinite))].sort((a, b) => a - b);
  const cells = Object.create(null);
  for (const award of rows) {
    const year = Number(award?.year);
    if (!award?.organization || !Number.isInteger(year) || year < 1895 || !award.title) continue;
    const decade = Math.floor(year / 10) * 10, key = award.organization + ':' + decade;
    const cell = cells[key] ||= { organization: award.organization, decade, count: 0, films: [], entries: [], coverage: 'partial', completionRate: null, sourceCount: 0 };
    cell.sourceCount++;
    const movieId = award.tmdb_id ?? award.tmdbId;
    const title = award.film_title || award.title;
    let record = movieId != null ? watched.find(item => String(item.tmdbId ?? item.id) === String(movieId)) : null;
    if (movieId == null && award.match_status !== 'ambiguous') {
      const candidates = watched.filter(item => {
        const releaseYear = Number(item.year), expected = Number(award.release_year);
        const sameYear = expected ? releaseYear === expected : releaseYear > 0 && releaseYear <= year && releaseYear >= year - 2;
        return sameYear && [item.title,item.originalTitle,item.original_title].map(normalizedText).includes(normalizedText(title));
      });
      if (new Set(candidates.map(item => String(item.id))).size === 1) record = candidates[0];
    }
    const id = movieId != null ? String(movieId) : record ? String(record.id) : null;
    const workKey = id ? 'tmdb:' + id : award.work_id || `${award.organization}:${year}:${normalizedText(title)}`;
    let entry = cell.entries.find(item => item.workKey === workKey);
    if (!entry) {
      entry = { workKey, id, title: record?.title || award.display_title || title, year: award.release_year || record?.year || null, watched: Boolean(record), record: record || null, categories: [], sources: [], awardYears: [] };
      cell.entries.push(entry);
    }
    if (award.category && !entry.categories.includes(award.category)) entry.categories.push(award.category);
    if (/^https:\/\//.test(award.source || '') && !entry.sources.includes(award.source)) entry.sources.push(award.source);
    if (!entry.awardYears.includes(year)) entry.awardYears.push(year);
  }
  for (const [key,cell] of Object.entries(cells)) {
    cell.entries.sort((a,b) => a.title.localeCompare(b.title,'ja'));
    cell.films = cell.entries.filter(entry => entry.watched).map(entry => entry.record);
    cell.count = cell.films.length;
    if (coverage[key]?.complete === true && cell.entries.length && cell.entries.every(entry => entry.id != null)) {
      cell.coverage = 'complete'; cell.total = cell.entries.length; cell.completionRate = cell.count / cell.total;
    }
  }
  return { organizations, decades, cells, coverage: Object.values(cells).every(cell => cell.coverage === 'complete') ? 'complete' : 'partial' };
}

const api = { GENRE_TAXONOMY, classifyGenres, pointForRecord, directorViewingRecord, awardOrganizations, buildAwardHeatmap };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof globalThis !== 'undefined') globalThis.CinelvaInsights = api;
