/* Film medium is independent of story genre and of the person's credit role. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CinelvaFilmMedium=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const fields=['type','media_type','mediaType','format','work_type','workType'];
 const classificationFields=[...fields,'genre_ids','genres','genre_names','is_tv','isTV','is_episode','isEpisode','is_series','isSeries','number_of_episodes','number_of_seasons','first_air_date','episode_number','season_number','release_dates','theatrical_release_verified','theatrical_release_source'];
 const normal=value=>String(value??'').normalize('NFKC').trim().toLowerCase().replace(/[\s_-]+/g,' ');
 const seriesType=value=>/^(?:tv|television|tv series|television series|series|tv drama|tv anime|anime series|tv animation|テレビ|テレビドラマ|テレビアニメ|連続ドラマ|連続テレビドラマ|episode|tv episode|season|miniseries|mini series|テレビシリーズ|エピソード)$/.test(normal(value));
 const televisionMovie=value=>/^(?:tv movie|television movie|tv film|telefilm|tv special|television special|テレビ映画|テレビムービー|テレビスペシャル|テレビドラマ|テレビアニメ)$/.test(normal(value));
 function hasTheatricalRelease(work){
  if(work?.theatrical_release_verified===true&&/^https:\/\//.test(String(work.theatrical_release_source||'')))return true;
  return (work?.release_dates?.results||[]).some(country=>(country.release_dates||[]).some(release=>[2,3].includes(Number(release.type))&&/^\d{4}-\d{2}-\d{2}/.test(String(release.release_date||''))));
 }
 function isFilmMedium(work){
  if(!work||typeof work!=='object')return false;
  if(fields.some(key=>seriesType(work[key])))return false;
  if(['is_tv','isTV','is_episode','isEpisode','is_series','isSeries'].some(key=>work[key]===true))return false;
  if(['number_of_episodes','number_of_seasons','episode_number','season_number'].some(key=>work[key]!=null&&Number.isFinite(Number(work[key])))||work.first_air_date)return false;
  const genres=[...(Array.isArray(work.genre_ids)?work.genre_ids:[]),...(Array.isArray(work.genres)?work.genres:[]),...(Array.isArray(work.genre_names)?work.genre_names:[])];
  const tvMovie=fields.some(key=>televisionMovie(work[key]))||genres.some(genre=>Number(typeof genre==='object'?genre?.id:genre)===10770||televisionMovie(typeof genre==='object'?genre?.name:genre));
  return !tvMovie||hasTheatricalRelease(work);
 }
 function filmMediumMetadata(work){const result={};for(const key of classificationFields)if(work&&Object.prototype.hasOwnProperty.call(work,key))result[key]=work[key];return result;}
 // A viewing record may update rating/title but cannot erase catalog medium evidence.
 function mergeFilmMetadata(catalog,record){return {...catalog,...record,...filmMediumMetadata(catalog)};}
 return {isFilmMedium,hasTheatricalRelease,filmMediumMetadata,mergeFilmMetadata};
});
