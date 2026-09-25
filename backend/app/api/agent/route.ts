import { json, rateLimited, options } from "../../../lib/http";

export const dynamic="force-dynamic";
const OPENAI="https://api.openai.com/v1/responses";
const B="https://api.themoviedb.org/3";
function tmdb(u:URL){const t=process.env.TMDB_READ_ACCESS_TOKEN||process.env.TMDB_API_TOKEN,k=process.env.TMDB_API_KEY,h:Record<string,string>={accept:"application/json"};if(t)h.Authorization=`Bearer ${t}`;else if(k)u.searchParams.set("api_key",k);return t||k?h:null}
async function searchMovies(q:string){const u=new URL(B+"/search/movie");u.searchParams.set("query",q.slice(0,80));u.searchParams.set("language","ja-JP");u.searchParams.set("region","JP");u.searchParams.set("include_adult","false");const h=tmdb(u);if(!h)return [];const r=await fetch(u,{headers:h,next:{revalidate:3600}});if(!r.ok)return [];const d=await r.json();return (d.results||[]).slice(0,8).map((m:any)=>({id:m.id,title:m.title,year:(m.release_date||"").slice(0,4),score:m.vote_average,votes:m.vote_count,overview:(m.overview||"").slice(0,500)}))}
async function detail(id:number){if(!Number.isInteger(id)||id<1)return null;const u=new URL(B+`/movie/${id}`);u.searchParams.set("language","ja-JP");u.searchParams.set("append_to_response","credits,watch/providers");const h=tmdb(u);if(!h)return null;const r=await fetch(u,{headers:h,next:{revalidate:86400}});if(!r.ok)return null;const m:any=await r.json(),jp=m["watch/providers"]?.results?.JP||{};return{id:m.id,title:m.title,year:(m.release_date||"").slice(0,4),runtime:m.runtime,genres:(m.genres||[]).map((x:any)=>x.name),score:m.vote_average,votes:m.vote_count,director:(m.credits?.crew||[]).find((x:any)=>x.job==="Director")?.name||"",cast:(m.credits?.cast||[]).slice(0,6).map((x:any)=>x.name),streaming:(jp.flatrate||[]).map((x:any)=>x.provider_name),overview:(m.overview||"").slice(0,800)}}
const tools=[{type:"function",name:"search_movies",description:"映画タイトルやキーワードから作品候補を検索する",parameters:{type:"object",properties:{query:{type:"string"}},required:["query"],additionalProperties:false},strict:true},{type:"function",name:"get_movie_detail",description:"TMDB IDから作品詳細、監督、出演者、日本の定額配信情報を確認する",parameters:{type:"object",properties:{id:{type:"integer"}},required:["id"],additionalProperties:false},strict:true}];
export async function POST(request:Request){
 const limited=rateLimited(request,12);if(limited)return limited;
 const key=process.env.OPENAI_API_KEY;if(!key)return json({error:"AI agent is not configured"},{status:503},request);
 let body:any;try{body=await request.json()}catch{return json({error:"invalid json"},{status:400},request)}
 const message=String(body?.message||"").trim();if(!message||message.length>500)return json({error:"message must be 1-500 characters"},{status:400},request);
 const headers={Authorization:`Bearer ${key}`,"Content-Type":"application/json"};
 let input:any[]=[{role:"user",content:message}],response:any;
 for(let step=0;step<4;step++){
  const r=await fetch(OPENAI,{method:"POST",headers,body:JSON.stringify({model:"gpt-5.6-luna",instructions:"あなたはCINEMAPの映画コンシェルジュ。日本語で簡潔に答える。推薦は必ずツールで作品を確認し、確認できた事実だけを使う。配信状況は取得データにある場合だけ断定する。作品名には公開年を添える。最大5作品。",input,tools,max_output_tokens:900})});
  if(!r.ok){console.warn("OpenAI unavailable",r.status);return json({error:"AI unavailable"},{status:502},request)}
  response=await r.json();const calls=(response.output||[]).filter((x:any)=>x.type==="function_call");
  if(!calls.length)break;
  input=[...input,...(response.output||[])];
  for(const c of calls){let a:any={};try{a=JSON.parse(c.arguments||"{}")}catch{};let out:any=c.name==="search_movies"?await searchMovies(String(a.query||"")):c.name==="get_movie_detail"?await detail(Number(a.id)):null;input.push({type:"function_call_output",call_id:c.call_id,output:JSON.stringify(out)})}
 }
 const text=(response?.output||[]).filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).filter((x:any)=>x.type==="output_text").map((x:any)=>x.text).join("\n").trim();
 return json({answer:text||"回答を生成できませんでした。"},{headers:{"Cache-Control":"no-store"}},request);
}
export async function OPTIONS(request:Request){return options(request)}
