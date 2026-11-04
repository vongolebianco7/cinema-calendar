export type FeedbackData={kind:string;body:string;email:string|null};
export type FeedbackStore={metrics?():Promise<unknown[]|null>;submit(data:FeedbackData,key:string):Promise<boolean>;list(status?:string,cursor?:string):Promise<unknown[]>;update(id:string,status:string):Promise<boolean>};
export function createHandler(options:{store:FeedbackStore;adminToken?:string;rateSecret?:string;origins:string[]}):(request:Request)=>Promise<Response>;
