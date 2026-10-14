export function liveSales(entries,date='all') {
 const rows=entries.filter(e=>e.status==='saved'&&(date==='all'||e.day.startsWith(date)));
 const groups=new Map();
 for(const e of rows){const key=e.day;const g=groups.get(key)||{day:key,quantity:0,cents:0,count:0};g.quantity+=e.quantity;g.cents+=Math.round(e.total*100);g.count++;groups.set(key,g);}
 const days=[...groups.values()].sort((a,b)=>a.day.localeCompare(b.day)).map(g=>({...g,sales:g.cents/100}));
 const sales=days.reduce((a,d)=>a+d.cents,0)/100,quantity=rows.reduce((a,e)=>a+e.quantity,0);
 return {sales,quantity,count:rows.length,average:rows.length?sales/rows.length:null,days};
}
