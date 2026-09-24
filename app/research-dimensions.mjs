export const DIMENSIONS={
 revenue:{en:'Revenue',zh:'營收',unit:'USD'}, netIncome:{en:'Net income',zh:'淨利',unit:'USD'},
 operatingCashFlow:{en:'Operating cash flow',zh:'營業現金流',unit:'USD'}, grossProfit:{en:'Gross profit',zh:'毛利',unit:'USD'},
 operatingIncome:{en:'Operating income',zh:'營業利益',unit:'USD'},researchDevelopment:{en:'R&D expense',zh:'研發費用',unit:'USD'},
 capitalExpenditure:{en:'Cash paid for PP&E',zh:'購置不動產廠房設備現金支出',unit:'USD'},
 freeCashFlow:{en:'Cash flow less PP&E (proxy)',zh:'營業現金流減設備支出（代理值）',unit:'USD'},
 revenueGrowth:{en:'Revenue growth',zh:'營收年增率',unit:'%'},
 netMargin:{en:'Net margin',zh:'淨利率',unit:'%'},grossMargin:{en:'Gross margin',zh:'毛利率',unit:'%'},
 operatingMargin:{en:'Operating margin',zh:'營業利益率',unit:'%'},cashFlowMargin:{en:'Operating cash flow / revenue',zh:'營業現金流／營收',unit:'%'},
 researchIntensity:{en:'R&D / revenue',zh:'研發費用／營收',unit:'%'}
};
export function dimensionValue(row,key,previous){
 if(!row||!DIMENSIONS[key])return null;
 const v=k=>Number.isFinite(row[k]?.value)?row[k].value:null,rev=v('revenue');
 if(key==='freeCashFlow'){const cash=v('operatingCashFlow'),capex=v('capitalExpenditure');return cash!==null&&capex!==null?cash-capex:null;}
 if(key==='revenueGrowth'){const p=previous?.revenue?.value,adjacent=Math.abs((Date.parse(row.start)-Date.parse(previous?.end))/86400000-1)<2;return adjacent&&rev!==null&&rev>=0&&p>0?(rev/p-1)*100:null;}
 const ratios={netMargin:'netIncome',grossMargin:'grossProfit',operatingMargin:'operatingIncome',cashFlowMargin:'operatingCashFlow',researchIntensity:'researchDevelopment'};
 if(ratios[key]){const n=v(ratios[key]);return n!==null&&rev>0?n/rev*100:null;}
 return v(key);
}
export function chartRows(companies,key,year='latest'){
 return companies.map(c=>{const i=year==='latest'?0:c.years.findIndex(r=>r.end.startsWith(year)),r=c.years[i];return {symbol:c.symbol,start:r?.start||null,end:r?.end||null,value:dimensionValue(r,key,c.years[i+1])};});
}

// A scatter observation exists only when both values refer to the same row.
// Keep missing rows in the accessible table, but never let them set either axis.
export function scatterRows(companies,primary,secondary,year='latest'){
 const vertical=chartRows(companies,secondary,year);
 const rows=chartRows(companies,primary,year).map((r,i)=>({...r,other:vertical[i].value}));
 return {rows,valid:rows.filter(r=>Number.isFinite(r.value)&&Number.isFinite(r.other))};
}
