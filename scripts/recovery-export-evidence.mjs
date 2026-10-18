const ISO_INSTANT=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const SHA256=/^[a-f0-9]{64}$/;
const REQUIRED_SCOPES=new Set(['membership','research']);
const REQUIRED_ARTIFACTS=new Set(['schema','data','roles']);
const ALLOWED_ENCRYPTION=new Set(['age','AES-256-GCM']);

function instant(value,label){
 if(typeof value!=='string'||!ISO_INSTANT.test(value)||Number.isNaN(Date.parse(value)))throw Error(`${label} must be an ISO 8601 UTC instant`);
 return Date.parse(value);
}

function plainToken(value,label){
 if(typeof value!=='string'||!/^[a-z][a-z0-9_-]{1,63}$/.test(value))throw Error(`${label} must be a non-secret token`);
 return value;
}

export function validateRecoveryExportEvidence(value,{now=new Date(),maxAgeHours=36}={}){
 if(!value||value.version!==1||!Array.isArray(value.exports))throw Error('Invalid recovery export evidence manifest');
 const checkedAt=instant(now instanceof Date?now.toISOString():now,'now');
 const generatedAt=instant(value.generatedAt,'generatedAt');
 if(generatedAt>checkedAt+300000)throw Error('generatedAt cannot be in the future');
 if(!Number.isFinite(maxAgeHours)||maxAgeHours<=0)throw Error('maxAgeHours must be positive');
 if(value.storage?.offsite!==true||value.storage?.encrypted!==true)throw Error('Storage must be encrypted and off-site');
 if(!Number.isInteger(value.storage?.retentionDays)||value.storage.retentionDays<7)throw Error('Storage retention must be at least 7 days');
 plainToken(value.storage.locationClass,'storage.locationClass');

 const seen=new Set();
 const summaries=[];
 for(const entry of value.exports){
  const scope=plainToken(entry?.scope,'export.scope');
  if(!REQUIRED_SCOPES.has(scope)||seen.has(scope))throw Error(`Unexpected or duplicate export scope: ${scope}`);
  seen.add(scope);
  const exportedAt=instant(entry.exportedAt,`${scope}.exportedAt`);
  const recoveryPointAt=instant(entry.recoveryPointAt,`${scope}.recoveryPointAt`);
  if(recoveryPointAt>exportedAt)throw Error(`${scope} recovery point cannot follow export time`);
  const ageHours=(checkedAt-exportedAt)/3600000;
  if(ageHours<0||ageHours>maxAgeHours)throw Error(`${scope} export is outside the ${maxAgeHours}-hour freshness window`);
  if(entry.managedSchemasExcluded?.sort().join(',')!=='auth,extensions,storage')throw Error(`${scope} must record Supabase-managed schema exclusions`);
  if(!Array.isArray(entry.artifacts))throw Error(`${scope} artifacts are required`);
  const artifactKinds=new Set();
  for(const artifact of entry.artifacts){
   const kind=plainToken(artifact?.kind,`${scope}.artifact.kind`);
   if(!REQUIRED_ARTIFACTS.has(kind)||artifactKinds.has(kind))throw Error(`${scope} has an unexpected or duplicate artifact`);
   artifactKinds.add(kind);
   if(!Number.isInteger(artifact.bytes)||artifact.bytes<=0)throw Error(`${scope}.${kind} must be non-empty`);
   if(!SHA256.test(artifact.sha256||''))throw Error(`${scope}.${kind} requires a SHA-256 checksum`);
   if(!ALLOWED_ENCRYPTION.has(artifact.encryption))throw Error(`${scope}.${kind} requires an approved encryption method`);
  }
  if(artifactKinds.size!==REQUIRED_ARTIFACTS.size)throw Error(`${scope} must include schema, data and roles artifacts`);
  summaries.push({scope,exportedAt:entry.exportedAt,recoveryPointAt:entry.recoveryPointAt,ageHours:Number(ageHours.toFixed(2)),artifacts:artifactKinds.size});
 }
 if(seen.size!==REQUIRED_SCOPES.size)throw Error('Membership and research exports are both required');
 return {verified:true,generatedAt:value.generatedAt,checkedAt:new Date(checkedAt).toISOString(),maxAgeHours,retentionDays:value.storage.retentionDays,exports:summaries};
}
