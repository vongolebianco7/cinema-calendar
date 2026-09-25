import { json, rateLimited, options } from "../../../lib/http";
export const dynamic="force-dynamic";
const B="https://api.themoviedb.org/3";
function auth(u:URL){const t=process.env.TMDB_READ_ACCESS_TOKEN||process.env.TMDB_API_TOKEN,k=process.env.TMDB_API_KEY,h:Record<string,string>={accept:"application/json"};if(t)h.Authorization=`Bearer ${t}`;else if(k)u.searchParams.set("api_key",k);return t||k?h:null}
const genres:Record<string,string>={"SF":"878","ＳＦ":"878","サイエンスフィクション":"878","ドラマ":"18","アクション":"28","コメディ":"35","ホラー":"27","ミステリー":"9648","スリラー":"53","アニメ":"16","アニメーション":"16","ファンタジー":"14","恋愛":"10749","ロマンス":"10749","ドキュメンタリー":"99","戦争":"10752","西部劇":"37","犯罪":"80","音楽":"10402"};
const providers:Record<string,string>={"Netflix":"8","ネットフリックス":"8","Prime Video":"9","Amazon Prime":"9","アマプラ":"9","Disney+":"337","ディズニープラス":"337","U-NEXT":"84","ユーネクスト":"84","Hulu":"15","Apple TV+":"350"};
function yearRange(q:string){let m=q.match(/(19|20)(\d)0年代/);if(m){const y=Number(m[1]+m[2]+"0");return[y,y+9]}m=q.match(/(19|20)\d{2}/);if(m){const y=Number(m[0]);return[y,y]}return null}
function runtime(q:string){const m=q.match(/(\d{1,3})\s*(分|minutes?|min)/i);if(m)return Number(m[1]);const h=q.match(/(\d(?:\.\d)?)\s*時間/);return h?Math.round(Number(h[1])*60):null}
async function tmdbJson(u:URL){const h=auth(u);if(!h)return null;const r=await fetch(u,{headers:h,next:{revalidate:1800}});return r.ok?r.json():null}
async function search(q:string){const u=new URL(B+"/search/movie");u.searchParams.set("query",q);u.searchParams.set("language","ja-JP");u.searchParams.set("region","JP");u.searchParams.set("include_adult","false");return tmdbJson(u)}
async function recommend(id:number){const u=new URL(B+`/movie/${id}/recommendations`);u.searchParams.set("language","ja-JP");return tmdbJson(u)}
async function discover(q:string){const u=new URL(B+"/discover/movie");u.searchParams.set("language","ja-JP");u.searchParams.set("region","JP");u.searchParams.set("include_adult","false");u.searchParams.set("sort_by",/評価|高評価/.test(q)?"vote_average.desc":"popularity.desc");u.searchParams.set("vote_count.gte","300");for(const [n,id] of Object.entries(genres))if(q.includes(n)){u.searchParams.set("with_genres",id);break}for(const [n,id] of Object.entries(providers))if(q.toLowerCase().includes(n.toLowerCase())){u.searchParams.set("watch_region","JP");u.searchParams.set("with_watch_providers",id);u.searchParams.set("with_watch_monetization_types","flatrate");break}const yr=yearRange(q);if(yr){u.searchParams.set("primary_release_date.gte",yr[0]+"-01-01");u.searchParams.set("primary_release_date.lte",yr[1]+"-12-31")}const rt=runtime(q);if(rt)u.searchParams.set("with_runtime.lte",String(rt));return tmdbJson(u)}
function movieLine(m:any,i:number){const y=(m.release_date||"").slice(0,4),score=Number(m.vote_average||0).toFixed(1);return `${i+1}. ${m.title}${y?" ("+y+")":""} — ★${score}\n   ${(m.overview||"あらすじ情報なし").slice(0,100)}`}
export async function POST(request:Request){const limited=rateLimited(request,30);if(limited)return limited;let b:any;try{b=await request.json()}catch{return json({error:"invalid json"},{status:400},request)}const q=String(b?.message||"").trim();if(!q||q.length>300)return json({error:"message must be 1-300 characters"},{status:400},request);
 let results:any[]=[];let lead="条件から探しました。";
 const like=q.match(/(.+?)(?:が好き|に似た|みたいな|っぽい)/);if(like){const s=await search(like[1].replace(/[「」『』]/g,"").trim());const base=s?.results?.[0];if(base){const rec=await recommend(base.id);results=rec?.results||[];lead=`「${base.title}」を起点に関連作品を探しました。`}}
 if(!results.length){const d=await discover(q);results=d?.results||[]}
 results=results.filter((m:any)=>m.title&&!m.adult).slice(0,5);
 if(!results.length)return json({answer:"条件に合う作品を見つけられませんでした。条件を少し広げてみてください。",movies:[]},{headers:{"Cache-Control":"no-store"}},request);
 const answer=lead+"\n\n"+results.map(movieLine).join("\n\n")+"\n\n※評価・配信状況などは取得時点のTMDBデータを使用しています。";
 return json({answer,movies:results.map((m:any)=>({id:m.id,title:m.title,year:(m.release_date||"").slice(0,4),poster:m.poster_path?`https://image.tmdb.org/t/p/w342${m.poster_path}`:null}))},{headers:{"Cache-Control":"no-store"}},request)}
export async function OPTIONS(request:Request){return options(request)}
