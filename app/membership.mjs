import {validateLayout} from './research-layout.mjs';
export const PLANS={free:{price:0,watch:0,saved:0},research:{price:9,watch:30,saved:5},pro:{price:19,watch:200,saved:30}};
// Billing is intentionally unavailable until product, licensing and payment acceptance gates pass.
export const BILLING_ENABLED=false;
export function effectivePlan(row,now=Date.now()){
 if(!row||!['research','pro'].includes(row.plan)||!['active','canceling'].includes(row.status))return 'free';
 const start=Date.parse(row.period_start),end=Date.parse(row.period_end);
 return Number.isFinite(start)&&Number.isFinite(end)&&start<=now&&now<end?row.plan:'free';
}
export function membershipView(row,now=Date.now()){
 const plan=effectivePlan(row,now);return {plan,limits:PLANS[plan],periodEnd:plan==='free'?null:row.period_end,cancelAtPeriodEnd:plan!=='free'&&row.status==='canceling',billingEnabled:BILLING_ENABLED};
}
export function validateResearchState(value,plan){
 const limit=PLANS[plan];if(!limit||plan==='free'||!value||!Array.isArray(value.watchlist)||!Array.isArray(value.saved)||value.watchlist.length>limit.watch||value.saved.length>limit.saved)throw Error('Plan limit exceeded');
 if(value.watchlist.some(x=>typeof x!=='string'||! /^[A-Z0-9.-]{1,12}$/.test(x))||new Set(value.watchlist).size!==value.watchlist.length)throw Error('Invalid watchlist');
 const ids=new Set();for(const s of value.saved){if(!s||typeof s.id!=='string'||! /^[a-zA-Z0-9-]{1,50}$/.test(s.id)||ids.has(s.id)||typeof s.name!=='string'||!s.name.trim()||s.name.length>80||typeof s.query!=='string'||s.query.length>80||!(s.year==='latest'||/^\d{4}$/.test(s.year))||!Array.isArray(s.metrics)||new Set(s.metrics).size!==s.metrics.length||s.metrics.some(k=>!['revenue','netIncome','operatingCashFlow'].includes(k)))throw Error('Invalid saved research');ids.add(s.id);}
 return {watchlist:[...value.watchlist],saved:value.saved.map(s=>({id:s.id,name:s.name,query:s.query,year:s.year,metrics:[...s.metrics],...(s.layout!==undefined?{layout:validateLayout(s.layout)}:{})}))};
}
