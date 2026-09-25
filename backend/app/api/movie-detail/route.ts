import { json, rateLimited, options } from "../../../lib/http";
export const dynamic="force-dynamic";
const BASE="https://api.themoviedb.org/3";
function auth(url:URL){const token=process.env.TMDB_READ_ACCESS_TOKEN||process.env.TMDB_API_TOKEN,key=process.env.TMDB_API_KEY;const headers:Record<string,string>={accept:"application/json"};if(token)headers.Authorization=`Bearer ${token}`;else if(key)url.searchParams.set("api_key",key);return token||key?headers:null}
export async function GET(request:Request){const limited=rateLimited(request,60);if(limited)return limited;
 const id=Number(new URL(request.url).searchParams.get("id"));if(!Number.isInteger(id)||id<1)return json({error:"invalid id"},{status:400});
 try{
  const url=new URL(BASE+`/movie/${id}`);url.searchParams.set("language","ja-JP");url.searchParams.set("append_to_response","credits,videos,watch/providers,release_dates");
  const headers=auth(url);if(!headers)return json({error:"TMDB not configured"},{status:503});
  const r=await fetch(url,{headers,next:{revalidate:86400}});if(!r.ok)return json({error:"movie not found"},{status:r.status});
  const m:any=await r.json(),jp=m["watch/providers"]?.results?.JP||{},crew=m.credits?.crew||[],cast=m.credits?.cast||[];
  const directorObj=crew.find((x:any)=>x.job==="Director"),director=directorObj?.name||"";
  const pick=(jobs:string[])=>crew.filter((x:any)=>jobs.includes(x.job)).slice(0,6).map((x:any)=>({id:x.id,name:x.name,job:x.job}));
  const dna={directors:pick(["Director"]),writers:pick(["Screenplay","Writer","Story"]),cinematography:pick(["Director of Photography","Cinematography"]),music:pick(["Original Music Composer","Music"]),editing:pick(["Editor"]),production:(m.production_companies||[]).slice(0,6).map((x:any)=>({id:x.id,name:x.name})),genres:(m.genres||[]).map((x:any)=>({id:x.id,name:x.name}))};
  let directorWorks:any[]=[];
  if(directorObj?.id){try{const cu=new URL(BASE+`/person/${directorObj.id}/movie_credits`);cu.searchParams.set("language","ja-JP");const ch=auth(cu);if(ch){const cr=await fetch(cu,{headers:ch,next:{revalidate:86400}});if(cr.ok){const cd:any=await cr.json();directorWorks=(cd.crew||[]).filter((x:any)=>x.job==="Director"&&x.id!==m.id).filter((x:any,i:number,a:any[])=>a.findIndex((y:any)=>y.id===x.id)===i).sort((a:any,b:any)=>(b.release_date||"").localeCompare(a.release_date||"")).slice(0,16).map((x:any)=>({id:x.id,tmdbId:x.id,title:x.title||x.original_title,year:(x.release_date||"").slice(0,4),poster:x.poster_path?`https://image.tmdb.org/t/p/w342${x.poster_path}`:null,score:x.vote_average,source:"tmdb",catalog:true}))}}}catch(e){console.warn("director credits unavailable",e)}}
  let related:any[]=[];try{const ru=new URL(BASE+`/movie/${id}/recommendations`);ru.searchParams.set("language","ja-JP");const rh=auth(ru);if(rh){const rr=await fetch(ru,{headers:rh,next:{revalidate:86400}});if(rr.ok){const rd:any=await rr.json();related=(rd.results||[]).slice(0,12).map((x:any)=>({id:x.id,tmdbId:x.id,title:x.title||x.original_title,year:(x.release_date||"").slice(0,4),poster:x.poster_path?`https://image.tmdb.org/t/p/w342${x.poster_path}`:null,score:x.vote_average}))}}}catch(e){console.warn("recommendations unavailable",e)}
  const vids=(m.videos?.results||[]).filter((x:any)=>x.site==="YouTube"),trailer=vids.find((x:any)=>x.type==="Trailer"&&x.official)||vids.find((x:any)=>x.type==="Trailer")||vids[0];
  const providers=(xs:any[]=[])=>[...new Set(xs.map((x:any)=>x.provider_name).filter(Boolean))];
  return json({movie:{id:m.id,tmdbId:m.id,title:m.title,original_title:m.original_title,overview:m.overview,date:m.release_date,year:(m.release_date||"").slice(0,4),runtime:m.runtime||null,genres:(m.genres||[]).map((x:any)=>x.name),countries:(m.production_countries||[]).map((x:any)=>x.name),director,director_id:directorObj?.id||null,director_works:directorWorks,dna,cast_people:cast.slice(0,12).map((x:any)=>({id:x.id,name:x.name,character:x.character})),cast:cast.slice(0,12).map((x:any)=>x.name),related,score:m.vote_average,votes:m.vote_count,poster:m.poster_path?`https://image.tmdb.org/t/p/w500${m.poster_path}`:null,backdrop:m.backdrop_path?`https://image.tmdb.org/t/p/w780${m.backdrop_path}`:null,tmdb:`https://www.themoviedb.org/movie/${m.id}`,trailer_url:trailer?`https://www.youtube.com/watch?v=${trailer.key}`:null,event:"catalog",source:"tmdb",catalog:true,availability:{flatrate:providers(jp.flatrate),rent:providers(jp.rent),buy:providers(jp.buy),source_url:jp.link||null}}});
 }catch(e){console.warn("TMDB detail unavailable",e);return json({error:"detail unavailable"},{status:502})}
}
export async function OPTIONS(request:Request){return options(request)}

