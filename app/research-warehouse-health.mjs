const iso=value=>typeof value==='string'&&!Number.isNaN(Date.parse(value))?value:null;

export function researchWarehouseConnectionStatus({labUrl,labServiceKey,feed,now=new Date()}={}){
 const urlConfigured=typeof labUrl==='string'&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(labUrl);
 const serviceKeyConfigured=typeof labServiceKey==='string'&&labServiceKey.length>20;
 const connected=urlConfigured&&serviceKeyConfigured;
 const retrievedAt=iso(feed?.retrievedAt);
 const ageHours=retrievedAt?Math.max(0,(now.getTime()-Date.parse(retrievedAt))/36e5):null;
 return {
  connected,
  status:connected?'configured':'blocked',
  reason:connected?null:'missing_private_research_database_binding',
  scheduledFullSync:connected?'enabled':'blocked',
  expectedEvidence:{
   filingObservations:Array.isArray(feed?.documents)?feed.documents.filter(d=>d?.kind==='filing').length:0,
   retrievedAt,
   ageHours:ageHours===null?null:Number(ageHours.toFixed(1))
  }
 };
}

export function safeScheduledError(error){
 if(error instanceof Error&&error.message.includes('not connected'))return 'research_database_not_connected';
 return 'research_warehouse_sync_failed';
}
