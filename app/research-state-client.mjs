import {validateResearchState} from './membership.mjs';

// A lost POST response is ambiguous: the server may already have committed it.
// Do not replay or follow it with another whole-state write before a fresh GET.
export function createResearchStateClient(request = (...args) => fetch(...args)) {
 let ready = false, busy = false;
 async function run(method, payload) {
  if (busy || (method === 'POST' && !ready)) throw Error('Research state needs reconciliation');
  busy = true;
  ready = false;
  try {
   const response = await request('/api/research-state', {
    method, credentials: 'same-origin', cache: 'no-store',
    ...(method === 'POST' ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)} : {})
   });
   if (!response.ok) throw Error('Research state unavailable');
   const data = await response.json();
   // A downgraded account must still be able to read retained records. Current
   // plan write limits remain enforced independently by the worker and RLS.
   const state = validateResearchState(data.state, 'pro');
   ready = true;
   return state;
  } finally { busy = false; }
 }
 return {load: () => run('GET'), save: state => run('POST', state)};
}
