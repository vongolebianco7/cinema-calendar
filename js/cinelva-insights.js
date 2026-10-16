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
  ['ドキュメンタリー', 'ヒューマン'],
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
    const id = Number(item?.id);
    const name = String(item?.name ?? item ?? '').trim();
    if (FORMAT_NAMES.has(id) || /^(animation|アニメーション|アニメ)$/i.test(name)) formats.add('アニメーション');
    if (id === 99 || /^(documentary|ドキュメンタリー)$/i.test(name)) workForms.add('ドキュメンタリー');
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
  const genreIndex = Math.max(0, GENRE_TAXONOMY.indexOf(genre));
  const latitude = COUNTRY_LATITUDE.get(country);
  const rating = Number(record?.rating);
  return {
    id: String(record?.id ?? record?.tmdbId ?? ''), record,
    year, country, genre, format: classified.formats[0] || '形式不明',
    coordinates: {
      x: year === null ? 0.03 : 0.12 + clamp((year - 1900) / 130, 0, 1) * 0.88,
      y: latitude === undefined ? 0.5 : clamp(0.5 + latitude / 180, 0, 1),
      z: genreIndex / (GENRE_TAXONOMY.length - 1),
    },
    size: Number.isFinite(rating) ? Math.round((0.75 + rating * 0.155) * 100) / 100 : 0.75,
  };
}

function awardOrganizations(awards) {
  return [...new Set((Array.isArray(awards) ? awards : []).map(item => item?.organization).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'));
}

function buildAwardHeatmap(records, awards) {
  const watched = (Array.isArray(records) ? records : []).filter(record => record && record.id != null);
  const rows = Array.isArray(awards) ? awards : [];
  const organizations = awardOrganizations(rows);
  const decades = [...new Set(rows.map(item => Math.floor(Number(item?.year) / 10) * 10).filter(Number.isFinite))].sort((a, b) => a - b);
  const cells = Object.create(null);
  const matches = new Set();
  for (const award of rows) {
    const year = Number(award?.year);
    if (!award?.organization || !Number.isFinite(year)) continue;
    const decade = Math.floor(year / 10) * 10;
    if (!cells[award.organization + ':' + decade]) cells[award.organization + ':' + decade] = { organization: award.organization, decade, count: 0, films: [], coverage: 'partial', completionRate: null, sourceCount: 0 };
    const coveredCell = cells[award.organization + ':' + decade];
    coveredCell.sourceCount += 1;
    const awardTitle = normalizedText(award.title);
    if (!awardTitle) continue;
    for (const record of watched) {
      const names = [record.title, record.originalTitle, record.original_title].map(normalizedText).filter(Boolean);
      if (!names.includes(awardTitle)) continue;
      const key = award.organization + ':' + decade + ':' + String(record.id);
      if (matches.has(key)) continue;
      matches.add(key);
      coveredCell.films.push(record);
    }
  }
  for (const cell of Object.values(cells)) {
    cell.films.sort((a, b) => String(a.title).localeCompare(String(b.title), 'ja'));
    cell.count = cell.films.length;
  }
  return { organizations, decades, cells, coverage: 'partial' };
}

const api = { GENRE_TAXONOMY, classifyGenres, pointForRecord, awardOrganizations, buildAwardHeatmap };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof globalThis !== 'undefined') globalThis.CinelvaInsights = api;
