const STATUSES = new Set(['passed','acceptance_pending','not_started','review_pending']);

export function membershipReleaseReadiness(value,{billingEnabled=false}={}){
 if(!value||value.schemaVersion!==1||!/^\d{4}-\d{2}-\d{2}$/.test(value.reviewedOn||'')||!Array.isArray(value.gateSet))throw Error('Invalid membership release gate');
 const ids=new Set();
 const gates=value.gateSet.map(g=>{
  if(!g||typeof g.id!=='string'||ids.has(g.id)||!STATUSES.has(g.status)||typeof g.blocking!=='boolean'||!g.label?.en||!g.label?.['zh-hant']||!g.detail?.en||!g.detail?.['zh-hant'])throw Error('Invalid membership release gate row');
  ids.add(g.id);return g;
 });
 const blocking=gates.filter(g=>g.blocking),passed=blocking.filter(g=>g.status==='passed').length;
 const evidenceComplete=blocking.length>0&&passed===blocking.length;
 const research={releaseAllowed:Boolean(billingEnabled&&evidenceComplete),evidenceComplete,passed,total:blocking.length};
 const proEvidence=Boolean(value.pro?.advancedToolsReleased&&value.pro?.outOfSampleEvidence&&Number(value.pro?.reviewedLabels)>=Number(value.pro?.requiredReviewedLabels));
 return {schemaVersion:1,reviewedOn:value.reviewedOn,billingEnabled:Boolean(billingEnabled),gates,research,pro:{releaseAllowed:Boolean(research.releaseAllowed&&proEvidence),evidenceComplete:proEvidence,reviewedLabels:Number(value.pro?.reviewedLabels)||0,requiredReviewedLabels:Number(value.pro?.requiredReviewedLabels)||0}};
}

export function publicMembershipReleaseStatus(value,options){
 const r=membershipReleaseReadiness(value,options);
 return {reviewedOn:r.reviewedOn,billingEnabled:r.billingEnabled,research:r.research,pro:r.pro,gates:r.gates.map(g=>({id:g.id,status:g.status,label:g.label,detail:g.detail}))};
}
