import { json, rateLimited, options } from "../../../lib/http";
export const dynamic="force-dynamic";

const YT="https://www.googleapis.com/youtube/v3/search";

export async function GET(request:Request){
  const reply=(data:unknown,init:ResponseInit={})=>json(data,{...init,headers:{...(init.headers||{}),"Cache-Control":"private, no-store, max-age=0"}},request);
  const limited=rateLimited(request,30);
  if(limited)return limited;
  const u=new URL(request.url);
  const title=(u.searchParams.get("title")||"").trim().slice(0,120);
  const topic=(u.searchParams.get("topic")||"").trim().slice(0,120);
  const kind=(u.searchParams.get("kind")||"").trim().toUpperCase().slice(0,24);
  if(!title)return reply({error:"title required"},{status:400});
  const key=process.env.YOUTUBE_API_KEY;
  const enabled=process.env.YOUTUBE_CRITIC_ENABLED==="true";
  if(!enabled||!key)return reply({enabled:false,videos:[],reason:"YouTube critic discovery is not enabled"});

  try{
    const lensTerms:Record<string,string>={
      IMAGE:"映像 撮影",
      STORY:"脚本 構成",
      PERFORMANCE:"演技 人物",
      SOUND:"音楽 音響",
      AUTHOR:"監督 演出",
      HISTORY:"映画史 ジャンル",
      THEME:"テーマ 解釈"
    };
    const lens=lensTerms[kind]||topic;
    const q=[title,"映画","考察",lens].filter(Boolean).join(" ");
    const y=new URL(YT);
    y.searchParams.set("part","snippet");
    y.searchParams.set("type","video");
    y.searchParams.set("maxResults","6");
    y.searchParams.set("order","relevance");
    y.searchParams.set("relevanceLanguage","ja");
    y.searchParams.set("regionCode","JP");
    y.searchParams.set("safeSearch","moderate");
    y.searchParams.set("fields","items(id/videoId,snippet(title,channelTitle,publishedAt,thumbnails/medium/url,thumbnails/default/url))");
    y.searchParams.set("q",q);
    y.searchParams.set("key",key);
    const r=await fetch(y,{cache:"no-store"});
    if(!r.ok)return reply({enabled:true,videos:[],error:"YouTube API unavailable"},{status:502});
    const d:any=await r.json();
    const videos=(d.items||[]).map((x:any)=>({
      videoId:x.id?.videoId,
      title:x.snippet?.title||"",
      channelTitle:x.snippet?.channelTitle||"",
      publishedAt:x.snippet?.publishedAt||"",
      thumbnail:x.snippet?.thumbnails?.medium?.url||x.snippet?.thumbnails?.default?.url||null,
      url:x.id?.videoId?`https://www.youtube.com/watch?v=${x.id.videoId}`:null
    })).filter((x:any)=>x.videoId&&x.title);
    return reply({enabled:true,query:q,videos,source:"YouTube Data API v3"});
  }catch(e){
    console.warn("youtube critic search unavailable",e);
    return json({enabled:true,videos:[],error:"YouTube API unavailable"},{status:502});
  }
}
export async function OPTIONS(request:Request){return options(request)}
