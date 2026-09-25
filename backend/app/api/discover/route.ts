import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";
const TMDB_BASE="https://api.themoviedb.org/3";
function auth(url:URL){
 const token=process.env.TMDB_READ_ACCESS_TOKEN||process.env.TMDB_API_TOKEN;
 const key=process.env.TMDB_API_KEY;
 const headers:Record<string,string>={accept:"application/json"};
 if(token)headers.Authorization=`Bearer ${token}`; else if(key)url.searchParams.set("api_key",key);
 return token||key?headers:null;
}
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,page=Math.min(Math.max(Number(p.get("page")||1),1),500);
 const url=new URL(TMDB_BASE+"/discover/movie");
 url.searchParams.set("language","ja-JP");url.searchParams.set("region","JP");url.searchParams.set("include_adult","false");url.searchParams.set("include_video","false");url.searchParams.set("page",String(page));
 const sort=p.get("sort")||"popularity.desc";url.searchParams.set("sort_by",sort);
 const genre=p.get("genre");if(genre)url.searchParams.set("with_genres",genre);
 const from=p.get("from");if(from)url.searchParams.set("primary_release_date.gte",from+"-01-01");
 const to=p.get("to");if(to)url.searchParams.set("primary_release_date.lte",to+"-12-31");
 const min=p.get("rating");if(min)url.searchParams.set("vote_average.gte",min);
 const minVotes=p.get("votes")||"100";url.searchParams.set("vote_count.gte",minVotes);
 const runtime=p.get("runtime");if(runtime)url.searchParams.set("with_runtime.lte",runtime);
 const country=p.get("country");if(country)url.searchParams.set("with_origin_country",country);
 const language=p.get("language");if(language)url.searchParams.set("with_original_language",language);
 const provider=p.get("provider");if(provider){url.searchParams.set("watch_region","JP");url.searchParams.set("with_watch_providers",provider);url.searchParams.set("with_watch_monetization_types","flatrate");}
 const cast=p.get("cast");if(cast)url.searchParams.set("with_cast",cast);
 const crew=p.get("crew");if(crew)url.searchParams.set("with_crew",crew);
 const headers=auth(url);if(!headers)return json({movies:[],error:"TMDB not configured"},{status:503});
 try{const res=await fetch(url,{headers,next:{revalidate:1800}});if(!res.ok)return json({movies:[],error:"TMDB unavailable"},{status:502});const d=await res.json();return json({movies:(d.results||[]).map((m:any)=>({id:m.id,tmdbId:m.id,title:m.title,original_title:m.original_title,overview:m.overview,date:m.release_date,year:(m.release_date||"").slice(0,4),score:m.vote_average,votes:m.vote_count,popularity:m.popularity,poster:m.poster_path?`https://image.tmdb.org/t/p/w342${m.poster_path}`:null,catalog:true,source:"tmdb"})),page:d.page,total_pages:d.total_pages,total_results:d.total_results});}catch(e){return json({movies:[],error:"discover failed"},{status:502})}
}
export async function OPTIONS(){return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS"}})}
