import { json, options } from "../../../lib/http";

// Retired: live per-viewer searches do not establish what a reviewer said.
// This endpoint intentionally makes no calls to third-party services.
export async function GET(request:Request){
  return json({enabled:false,videos:[],reason:"Critic search retired; use reviewed source summaries"},
    {status:410,headers:{"Cache-Control":"public, max-age=86400"}},request);
}
export async function OPTIONS(request:Request){return options(request)}
