const statuses=new Set(['passed','blocked','not_tested']);

export function recoveryReadiness(value){
 if(!value||!Number.isInteger(value.version)||!/^\d{4}-\d{2}-\d{2}$/.test(value.reviewedOn||'')||!Array.isArray(value.gates)||!value.gates.length)throw Error('Invalid recovery readiness manifest');
 const ids=new Set();
 for(const gate of value.gates){
  if(!gate||typeof gate.id!=='string'||ids.has(gate.id)||!statuses.has(gate.status))throw Error('Invalid recovery readiness gate');
  if(!gate.label?.en||!gate.label?.['zh-hant']||!gate.detail?.en||!gate.detail?.['zh-hant'])throw Error('Recovery readiness gates must be bilingual');
  ids.add(gate.id);
 }
 const passed=value.gates.filter(gate=>gate.status==='passed').length;
 return {reviewedOn:value.reviewedOn,ready:passed===value.gates.length,passed,total:value.gates.length,gates:value.gates};
}

export function publicRecoveryReadiness(value){
 const status=recoveryReadiness(value);
 return {...status,gates:status.gates.map(({id,status,label,detail})=>({id,status,label,detail}))};
}
