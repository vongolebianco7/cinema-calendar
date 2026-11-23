/* Real PostgreSQL semantics in an isolated WASM instance. No production database. */
const assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID}=require('node:crypto');
const{PGlite}=require('@electric-sql/pglite'),{createFeedbackStore}=require('../backend/lib/feedback-store.cjs');
(async()=>{const db=new PGlite();try{
await db.exec(fs.readFileSync('backend/prisma/changes/585-feedback.sql','utf8'));
const sql=(parts,values)=>parts.reduce((s,p,i)=>s+(i?'$'+i:'')+p,'');
const savedIds=[];const feedback={
 findMany:async({where,take})=>(await db.query('SELECT "id","kind","body","status","createdAt" FROM "Feedback" WHERE ($1::text IS NULL OR "status"=$1) ORDER BY "createdAt" DESC,"id" DESC LIMIT $2',[where?.status??null,take??50])).rows,
 updateMany:async({where,data})=>({count:(await db.query('UPDATE "Feedback" SET "status"=$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 RETURNING "id"',[where.id,data.status])).rows.length})
};
const adapter={$transaction:fn=>db.transaction(tx=>fn({$queryRaw:async(parts,...values)=>(await tx.query(sql(parts,values),values)).rows,
feedback:{
 create:({data})=>{const id=randomUUID();savedIds.push(id);return tx.query('INSERT INTO "Feedback" ("id","kind","body","email") VALUES ($1,$2,$3,$4)',[id,data.kind,data.body,data.email]);}
},
feedbackRateBucket:{deleteMany:({where})=>tx.query('DELETE FROM "FeedbackRateBucket" WHERE "expiresAt"<$1',[where.expiresAt.lt])}}))};
adapter.feedback=feedback;const store=createFeedbackStore(adapter),data={kind:'bug',body:'a <script> remains inert text',email:null};
const results=await Promise.all(Array.from({length:8},()=>store.submit(data,'same-ip')));assert.equal(results.filter(Boolean).length,3);
assert.equal((await db.query('SELECT count(*)::int AS n FROM "Feedback"')).rows[0].n,3);
assert.equal((await db.query('SELECT "count" FROM "FeedbackRateBucket" WHERE "key" LIKE $1',['global:%'])).rows[0].count,3,'rejected IP attempts roll back global counter');
const firstId=savedIds[0];assert.equal((await store.list('new')).some(row=>row.id===firstId),true);
assert.equal(await store.update(firstId,'done'),true);
assert.equal((await store.list('done')).some(row=>row.id===firstId),true,'updated status is persisted in PostgreSQL and visible to a fresh filtered read');
assert.equal((await store.list('new')).some(row=>row.id===firstId),false);
assert.equal(await store.update('missing-feedback-id','done'),false);
await assert.rejects(()=>store.submit({...data,kind:'invalid'},'invalid-ip'));
assert.equal((await db.query('SELECT count(*)::int AS n FROM "Feedback"')).rows[0].n,3);
const more=await Promise.all(Array.from({length:120},(_,i)=>store.submit(data,'other-ip-'+i)));assert.equal(more.filter(Boolean).length,97);
assert.equal((await db.query('SELECT count(*)::int AS n FROM "Feedback"')).rows[0].n,100);

const {createMetricStore}=require('../backend/lib/metrics.cjs');
const metricStore=createMetricStore({$executeRaw:async(parts,...values)=>db.query(sql(parts,values),values),$queryRaw:async(parts,...values)=>(await db.query(sql(parts,values),values)).rows});
await metricStore.increment('search');assert.equal((await metricStore.summary())[0].count,1);
await db.query('UPDATE "FeatureMetric" SET "count"=9999');
await Promise.all(Array.from({length:8},()=>metricStore.increment('search')));assert.equal((await metricStore.summary())[0].count,10000,'daily metric counter saturates without overflow');
await assert.rejects(()=>metricStore.increment('unknown'));
console.log('PostgreSQL atomic concurrent IP/global caps, rollback, persisted feedback status and additive schema passed');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
