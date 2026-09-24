import {PLANS} from './membership.mjs';
// A transport failure must never become a Free entitlement.
export async function readMemberAccess(response, now=Date.now()) {
 if(response.status===401||response.status===403)return {status:'guest',access:null};
 if(!response.ok)throw Error('Membership unavailable');
 const data=await response.json();
 if(!data||!Object.hasOwn(PLANS,data.plan)||data.billingEnabled!==false)throw Error('Invalid membership response');
 if(data.plan!=='free'&&(!Number.isFinite(Date.parse(data.periodEnd))||Date.parse(data.periodEnd)<=now))throw Error('Membership needs refresh');
 return {status:'ready',access:{...data,limits:PLANS[data.plan]}};
}
export const WORKSPACE_VIEWS=['dashboard','account','analysis','equities','news','sports','planner','records','lab','admin'];
export const AUTH_VIEWS=['login','signup','reset'];
export const workspaceDestination=(hash,fallback='dashboard')=>WORKSPACE_VIEWS.includes(hash)?hash:fallback;
export const isWorkspaceHash=hash=>[...WORKSPACE_VIEWS,...AUTH_VIEWS].includes(hash.replace(/^#/,''));
