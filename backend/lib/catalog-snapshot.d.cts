export function readWithSnapshot(read:()=>Promise<any>,snapshot:()=>any):Promise<any>;
export function calendarSnapshot():any;
export function movieSnapshot(query?:string,limit?:number):any;
export function tvSnapshot():any;
export function theaterSnapshot(query?:string,prefecture?:string):any;
export function releaseSnapshot(from:string,to:string,service?:string):any;
