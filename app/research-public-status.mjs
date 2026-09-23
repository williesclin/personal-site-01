export function researchPublicStatus(feed,readiness){
 const documents=Array.isArray(feed?.documents)?feed.documents:[];
 const filings=documents.filter(d=>d?.kind==='filing');
 const issuers=new Set(filings.flatMap(d=>Array.isArray(d?.symbols)?d.symbols:[]).filter(Boolean));
 const minimumReviewed=Number(readiness?.requiredGates?.minimumReviewed)||null;
 return {
  retrievedAt:typeof feed?.retrievedAt==='string'?feed.retrievedAt:null,
  filingObservations:filings.length,
  observedIssuers:issuers.size,
  backfillObservations:filings.filter(d=>d?.backfill===true).length,
  newsStatus:feed?.newsStatus==='connected'?'connected':'rights_review',
  socialStatus:feed?.socialStatus==='connected'?'connected':'not_connected',
  ai:{
   evaluatedAt:typeof readiness?.evaluatedAt==='string'?readiness.evaluatedAt:null,
   status:readiness?.status==='ready'?'ready':'blocked',
   releaseAllowed:readiness?.releaseAllowed===true,
   observedDocuments:Number(readiness?.observedDocuments)||0,
   reviewedLabels:Number(readiness?.reviewedLabels)||0,
   minimumReviewed
  }
 };
}
