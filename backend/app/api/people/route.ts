import { isFilmMedium, filmMediumMetadata } from "../../../../js/cinelva-film-medium.js";
import { json, rateLimited, options } from "../../../lib/http";
export const dynamic="force-dynamic";const B="https://api.themoviedb.org/3";
function auth(u:URL){const t=process.env.TMDB_READ_ACCESS_TOKEN||process.env.TMDB_API_TOKEN,k=process.env.TMDB_API_KEY,h:Record<string,string>={accept:"application/json"};if(t)h.Authorization=`Bearer ${t}`;else if(k)u.searchParams.set("api_key",k);return t||k?h:null}
export async function GET(req:Request){const limited=rateLimited(req,90);if(limited)return limited;const params=new URL(req.url).searchParams;
 if(params.get("profile")==="1"){
  const id=Number(params.get("id"));if(!Number.isSafeInteger(id)||id<1)return json({error:"invalid person id"},{status:400});
  const u=new URL(B+`/person/${id}`);u.searchParams.set("language","ja-JP");u.searchParams.set("append_to_response","movie_credits");const h=auth(u);if(!h)return json({error:"TMDB not configured"},{status:503});
  try{const r=await fetch(u,{headers:h,next:{revalidate:86400}});if(!r.ok)return json({error:"person unavailable"},{status:r.status});const d=await r.json();if(Number(d.id)!==id||!d.movie_credits||!Array.isArray(d.movie_credits.cast)||!Array.isArray(d.movie_credits.crew))return json({error:"credits unavailable"},{status:502});
   const films=(rows:any[],director=false)=>{const seen=new Set<number>();return rows.filter(x=>{const mid=Number(x.id);if(!isFilmMedium(x)||!Number.isSafeInteger(mid)||mid<1||x.adult||director&&x.job!=="Director"||seen.has(mid))return false;seen.add(mid);return true;}).map(x=>({...filmMediumMetadata(x),id:x.id,title:x.title||x.original_title,original_title:x.original_title,release_date:x.release_date||"",poster_path:x.poster_path||null,job:director?"Director":null,character:x.character||null,score:x.vote_average||0}));};
   return json({person:{id:d.id,name:d.name,profile_path:d.profile_path||null,birthday:d.birthday||null,place_of_birth:d.place_of_birth||null,biography_ja:d.biography||"",source_url:`https://www.themoviedb.org/person/${id}`},credits:{director:films(d.movie_credits.crew,true),cast:films(d.movie_credits.cast)},coverage:{source:"tmdb_movie_credits",truncated:false}});
  }catch{return json({error:"person unavailable"},{status:502})}
 }
 if(params.get("role")==="director"){
  const id=Number(params.get("id"));if(!Number.isInteger(id)||id<1)return json({error:"invalid person id"},{status:400});
  const u=new URL(B+`/person/${id}/movie_credits`);u.searchParams.set("language","ja-JP");const h=auth(u);if(!h)return json({error:"TMDB not configured"},{status:503});
  try{const r=await fetch(u,{headers:h,next:{revalidate:86400}});if(!r.ok)throw 0;const d=await r.json();const ids=[...new Set((d.crew||[]).filter((x:any)=>x.job==="Director"&&isFilmMedium(x)).map((x:any)=>Number(x.id)).filter((x:number)=>Number.isInteger(x)&&x>0))];return json({ids})}catch{return json({error:"director credits unavailable"},{status:502})}
 }
 const q=(params.get("q")||"").normalize("NFKC").trim().slice(0,100);if(q.length<2)return json({people:[]});
 const normalize=(value:string)=>String(value||"").normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,"");
 const search=async(query:string)=>{const u=new URL(B+"/search/person");u.searchParams.set("query",query);u.searchParams.set("language","ja-JP");u.searchParams.set("include_adult","false");const h=auth(u);if(!h)return [];const r=await fetch(u,{headers:h,next:{revalidate:3600}});if(!r.ok)throw Error("person search unavailable");return (await r.json()).results||[];};
 try{let rows=await search(q);const key=normalize(q);
  // TMDB requires Japanese name separators. A bounded prefix lookup recovers
  // omitted separators while full normalized-name matching excludes other people.
  if(!rows.length&&key.length>2&&/^[ァ-ヶー]+$/.test(key)){rows=(await search(key.slice(0,2))).filter((x:any)=>normalize(x.name).includes(key)||normalize(x.original_name).includes(key));}
  return json({people:rows.slice(0,8).map((x:any)=>({id:x.id,name:x.name,department:x.known_for_department,profile_path:x.profile_path||null,known_for:(x.known_for||[]).filter(isFilmMedium).map((m:any)=>m.title||m.name).filter(Boolean).slice(0,3)}))});
 }catch{return json({people:[]},{status:502})}}
export async function OPTIONS(request:Request){return options(request)}
