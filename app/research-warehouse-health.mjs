const iso=value=>typeof value==='string'&&!Number.isNaN(Date.parse(value))?value:null;
const roundedHours=(value,now)=>value===null?null:Number(Math.max(0,(now.getTime()-Date.parse(value))/36e5).toFixed(1));

export function researchWarehouseConnectionStatus({labUrl,labServiceKey,feed,verification,now=new Date()}={}){
 const urlConfigured=typeof labUrl==='string'&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(labUrl);
 const serviceKeyConfigured=typeof labServiceKey==='string'&&labServiceKey.length>20;
 const bindingsConfigured=urlConfigured&&serviceKeyConfigured;
 const retrievedAt=iso(feed?.retrievedAt);
 const expectedFilingIds=Array.isArray(feed?.documents)?feed.documents.filter(d=>d?.kind==='filing'&&typeof d?.id==='string').map(d=>d.id).sort():[];
 const expectedFilingObservations=expectedFilingIds.length;
 const base={bindingsConfigured,expectedEvidence:{filingObservations:expectedFilingObservations,retrievedAt,ageHours:roundedHours(retrievedAt,now)}};
 if(!bindingsConfigured)return {...base,connected:false,status:'blocked',reason:'missing_private_research_database_binding',scheduledFullSync:'blocked',fullSync:{lastAttemptStatus:null,lastSuccessfulAt:null,ageHours:null},reconciliation:{expectedFilingObservations,actualFilingObservations:null,match:false},domains:{expected:0,verified:0,identityMatch:false,allCurrent:false}};
 if(!verification?.readSucceeded)return {...base,connected:false,status:'verification_required',reason:'full_sync_not_verified',scheduledFullSync:'verification_required',fullSync:{lastAttemptStatus:verification?.lastAttemptStatus||null,lastSuccessfulAt:null,ageHours:null},reconciliation:{expectedFilingObservations,actualFilingObservations:null,match:false},domains:{expected:Array.isArray(verification?.expectedDatasetKeys)?verification.expectedDatasetKeys.length:0,verified:0,identityMatch:false,allCurrent:false}};
 const lastSuccessfulAt=iso(verification.lastSuccessfulAt);
 const fullSyncStartedAt=iso(verification.fullSyncStartedAt);
 const fullSyncCurrent=!!(lastSuccessfulAt&&retrievedAt&&Date.parse(lastSuccessfulAt)>=Date.parse(retrievedAt));
 const actualFilingIds=Array.isArray(verification.actualFilingIds)?[...verification.actualFilingIds.filter(id=>typeof id==='string')].sort():null;
 const actualFilingObservations=actualFilingIds?.length??null;
 const evidenceMatch=Array.isArray(actualFilingIds)&&actualFilingIds.length===expectedFilingIds.length&&new Set(actualFilingIds).size===actualFilingIds.length&&actualFilingIds.every((id,index)=>id===expectedFilingIds[index]);
 const expectedDatasetKeys=Array.isArray(verification.expectedDatasetKeys)?[...new Set(verification.expectedDatasetKeys.filter(key=>typeof key==='string'))].sort():[];
 const expectedDatasetCount=expectedDatasetKeys.length;
 const datasetRows=Array.isArray(verification.datasetRows)?verification.datasetRows:[];
 const actualDatasetKeys=datasetRows.map(row=>row?.dataset_key).filter(key=>typeof key==='string').sort();
 const domainIdentityMatch=expectedDatasetCount>0&&actualDatasetKeys.length===expectedDatasetCount&&new Set(actualDatasetKeys).size===actualDatasetKeys.length&&actualDatasetKeys.every((key,index)=>key===expectedDatasetKeys[index]);
 const verifiedDomains=fullSyncStartedAt?datasetRows.filter(row=>expectedDatasetKeys.includes(row?.dataset_key)&&iso(row?.updated_at)&&Date.parse(row.updated_at)>=Date.parse(fullSyncStartedAt)).length:0;
 const domainsCurrent=domainIdentityMatch&&verifiedDomains===expectedDatasetCount;
 const connected=fullSyncCurrent&&evidenceMatch&&domainsCurrent;
 let reason=null;
 if(!lastSuccessfulAt)reason='full_sync_not_verified';
 else if(!fullSyncCurrent)reason='full_sync_older_than_feed';
 else if(!evidenceMatch)reason='evidence_reconciliation_mismatch';
 else if(!domainsCurrent)reason='domain_status_not_refreshed';
 return {
  ...base,connected,status:connected?'verified':'verification_required',reason,scheduledFullSync:connected?'verified':'verification_required',
  fullSync:{lastAttemptStatus:verification.lastAttemptStatus||null,lastSuccessfulAt,ageHours:roundedHours(lastSuccessfulAt,now)},
  reconciliation:{expectedFilingObservations,actualFilingObservations,match:evidenceMatch},
  domains:{expected:expectedDatasetCount,verified:verifiedDomains,identityMatch:domainIdentityMatch,allCurrent:domainsCurrent}
 };
}

export function safeScheduledError(error){
 if(error instanceof Error&&error.message.includes('not connected'))return 'research_database_not_connected';
 return 'research_warehouse_sync_failed';
}
