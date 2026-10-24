import { json, rateLimited, options } from "../../../lib/http";
const BASE="https://api.themoviedb.org/3";
// Approved non-commercial TMDB API. Ten details per page; upstream data is
// shared through Next's daily fetch cache. No DB, scraping or currency conversion.
export async function GET(request:Request){
 const limited=rateLimited(request,30);if(limited)return limited;
 const p=new URL(request.url).searchParams,year=p.get("year"),page=Number(p.get("page")||1),now=new Date();
 if((year&&(!/^\d{4}$/.test(year)||Number(year)<1888||Number(year)>now.getUTCFullYear()))||!Number.isInteger(page)||page<1||page>8)return json({error:"invalid filter"},{status:400});
 const token=process.env.TMDB_READ_ACCESS_TOKEN||process.env.TMDB_API_TOKEN,key=process.env.TMDB_API_KEY;
 if(!token&&!key)return json({error:"TMDB not configured"},{status:503});
 const headers:Record<string,string>={accept:"application/json"};if(token)headers.Authorization=`Bearer ${token}`;
 async function read(path:string,params:Record<string,string>={}){const u=new URL(BASE+path);u.searchParams.set("language","ja-JP");for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);if(!token&&key)u.searchParams.set("api_key",key);const r=await fetch(u,{headers,next:{revalidate:86400},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error("TMDB unavailable");return r.json()}
 try{
  const params:Record<string,string>={sort_by:"revenue.desc",include_adult:"false",include_video:"false",page:String(Math.ceil(page/2))};if(year)params.primary_release_year=year;
  const d=await read("/discover/movie",params),candidates=(d.results||[]).slice(page%2?0:10,page%2?10:20);
  const settled=await Promise.all(candidates.map(async(m:any,i:number)=>{if(!Number.isInteger(m.id)||m.id<1)return null;try{const x=await read(`/movie/${m.id}`);if(x.id!==m.id||!Number.isFinite(x.revenue)||x.revenue<=0)return null;return {id:x.id,tmdbId:x.id,title:x.title||x.original_title,original_title:x.original_title,release_date:x.release_date||"",year:(x.release_date||"").slice(0,4),revenue:x.revenue,currency:"USD",displayRank:(page-1)*10+i+1,poster:x.poster_path?`https://image.tmdb.org/t/p/w342${x.poster_path}`:null,score:x.vote_average,votes:x.vote_count,source:"tmdb",source_url:`https://www.themoviedb.org/movie/${x.id}`}}catch{return null}}));
  return json({movies:settled.filter(Boolean),market:"worldwide",currency:"USD",year:year||null,year_basis:"primary_release_year",metric:"lifetime_theatrical_revenue",partial:settled.some(x=>!x),page,has_more:page<8&&(page%2?(d.results||[]).length>10:Math.ceil(page/2)<Number(d.total_pages||0)),checked_at:now.toISOString(),source:"TMDB"});
 }catch{return json({movies:[],error:"Worldwide box office unavailable"},{status:502})}
}
export async function OPTIONS(request:Request){return options(request)}
