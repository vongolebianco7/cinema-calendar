import { json, rateLimited, options } from "../../../lib/http";
export const dynamic="force-dynamic";const B="https://api.themoviedb.org/3";
function auth(u:URL){const t=process.env.TMDB_READ_ACCESS_TOKEN||process.env.TMDB_API_TOKEN,k=process.env.TMDB_API_KEY,h:Record<string,string>={accept:"application/json"};if(t)h.Authorization=`Bearer ${t}`;else if(k)u.searchParams.set("api_key",k);return t||k?h:null}
export async function GET(req:Request){const limited=rateLimited(req,90);if(limited)return limited;const params=new URL(req.url).searchParams;
 if(params.get("role")==="director"){
  const id=Number(params.get("id"));if(!Number.isInteger(id)||id<1)return json({error:"invalid person id"},{status:400});
  const u=new URL(B+`/person/${id}/movie_credits`);u.searchParams.set("language","ja-JP");const h=auth(u);if(!h)return json({error:"TMDB not configured"},{status:503});
  try{const r=await fetch(u,{headers:h,next:{revalidate:86400}});if(!r.ok)throw 0;const d=await r.json();const ids=[...new Set((d.crew||[]).filter((x:any)=>x.job==="Director").map((x:any)=>Number(x.id)).filter((x:number)=>Number.isInteger(x)&&x>0))];return json({ids})}catch{return json({error:"director credits unavailable"},{status:502})}
 }
 const q=params.get("q")?.trim()||"";if(q.length<2)return json({people:[]});const u=new URL(B+"/search/person");u.searchParams.set("query",q);u.searchParams.set("language","ja-JP");u.searchParams.set("include_adult","false");const h=auth(u);if(!h)return json({people:[]});try{const r=await fetch(u,{headers:h,next:{revalidate:3600}});if(!r.ok)throw 0;const d=await r.json();return json({people:(d.results||[]).slice(0,8).map((x:any)=>({id:x.id,name:x.name,department:x.known_for_department,known_for:(x.known_for||[]).map((m:any)=>m.title||m.name).filter(Boolean).slice(0,3)}))})}catch{return json({people:[]},{status:502})}}
export async function OPTIONS(request:Request){return options(request)}
