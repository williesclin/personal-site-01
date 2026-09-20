// Educational scenario engine. No live feed, fitted model, odds, wagering or settlement.
export const SPORTS_STATUS=Object.freeze({mode:'education',liveData:false,odds:false,trainedModel:false});
export function footballScenario(home,away){
 if(![home,away].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=6))throw Error('Expected goals must be between 0 and 6');
 const pmf=x=>{const a=[Math.exp(-x)];for(let k=1;k<=40;k++)a.push(a[k-1]*x/k);return a};
 const h=pmf(home),a=pmf(away);let win=0,draw=0,loss=0,total=0;const scores=[];
 for(let i=0;i<h.length;i++)for(let j=0;j<a.length;j++){const p=h[i]*a[j];total+=p;if(i>j)win+=p;else if(i===j)draw+=p;else loss+=p;scores.push({home:i,away:j,p});}
 return {win:win/total,draw:draw/total,loss:loss/total,coverage:total,scores:scores.sort((a,b)=>b.p-a.p||a.home-b.home||a.away-b.away).slice(0,6)};
}
