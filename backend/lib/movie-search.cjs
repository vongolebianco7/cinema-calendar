'use strict';
const compact = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
// Only recover spellings actually present in a known title; never guess a
// franchise translation or issue every possible punctuation combination.
async function searchMovies({query, titles = [], fetchPage, maxRequests = 12, maxVariants = 6}) {
 const pending = [], queries = new Set(), found = new Map();
 let truncated = false, incomplete = false, requests = 0;
 let probed = false;
 const add = value => {
  const text = String(value || '').normalize('NFKC').trim();
  const key = text.toLocaleLowerCase();
  if (!text || queries.has(key)) return;
  if (queries.size >= maxVariants) { truncated = true; return; }
  queries.add(key); pending.push({query:text,page:1});
 };
 const term = compact(query);
 const pattern = term ? new RegExp([...term].map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[\\s\\p{P}\\p{S}]*'),'iu') : null;
 const learn = movies => {
  for (const movie of movies) {
   const localized = movie.title || '';
   const original = movie.original_title || movie.originalTitle || '';
   for (const title of [localized, original]) {
    const match = pattern && String(title).normalize('NFKC').match(pattern);
    if (match) add(match[0]);
   }
   // The original title is a verified equivalent only for an exact title hit.
   if (term && compact(localized) === term) add(original);
   if (term && compact(original) === term) add(localized);
  }
 };
 add(query); learn(titles);
 while (pending.length && requests < maxRequests) {
  const next = pending.shift(); requests++;
  try {
   const body = await fetchPage(next.query,next.page);
   if (!body || !Array.isArray(body.results)) throw Error('Invalid movie search response');
   const normalizedMatches = body.results.filter(movie => movie &&
    [movie.title, movie.original_title, movie.originalTitle].some(title => compact(title).includes(term)));
   if (next.probe) {
    // Discovery results provide spelling evidence only. Broad prefix hits must
    // never appear in the final results or trigger broad-result pagination.
    learn(normalizedMatches);
   } else {
    for (const movie of body.results) if (movie && movie.id != null) found.set(String(movie.id),movie);
    learn(body.results);
    // A single bounded Japanese prefix lookup discovers missing separators
    // when neither the catalog nor the direct search supplies title evidence.
    if (!probed && next.page === 1 && queries.size === 1 && !normalizedMatches.length &&
        [...term].length >= 4 && /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(term)) {
     const length = /^[\p{Script=Katakana}ー]+$/u.test(term) ? 2 : 3;
     const prefix = [...term].slice(0,length).join('');
     probed = true;
     pending.push({query:prefix,page:1,probe:true});
    }
    const total = Number(body.total_pages);
    if (Number.isFinite(total) && total > next.page) pending.push({...next,page:next.page+1});
   }
  } catch { incomplete = true; }
 }
 if (pending.length) truncated = true;
 return {results:[...found.values()],truncated,incomplete,requests};
}
module.exports = {searchMovies};
