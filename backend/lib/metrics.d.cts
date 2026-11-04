export type MetricStore={increment(event:string):Promise<void>;summary():Promise<unknown[]>};
export function createMetricHandler(options:{enabled:boolean;store:MetricStore}):(request:Request)=>Promise<Response>;
export function createMetricStore(prisma:unknown):MetricStore;
