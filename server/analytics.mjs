export const manilaDay=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const cents=n=>Math.round(Number(n)*100);
export const money=n=>cents(n)/100;
export function validateDates(from,to){
 for(const value of [from,to])if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))throw new Error('Use a valid YYYY-MM-DD date.');
 if(from&&to&&from>to)throw new Error('Start date must precede end date.');
 return {from:from||null,to:to||null};
}
export function historicalAnalytics(records,from,to){
 const sorted=[...records].sort((a,b)=>a.sales_year-b.sales_year||a.month_number-b.month_number);
 const rows=sorted.map((r,i)=>{const prev=sorted[i-1],consecutive=prev&&(r.sales_year*12+r.month_number)-(prev.sales_year*12+prev.month_number)===1;
 const period=`${r.sales_year}-${String(r.month_number).padStart(2,'0')}`;
 return {...r,period,month:new Date(`${period}-01T00:00:00Z`).toLocaleDateString('en-US',{month:'long',timeZone:'UTC'}),sales:Number(r.net_sales),average:r.receipts?Number(r.net_sales)/r.receipts:null,posAverage:r.pos_average_sale===null?null:Number(r.pos_average_sale),change:consecutive&&Number(prev.net_sales)!==0?(Number(r.net_sales)-Number(prev.net_sales))/Number(prev.net_sales)*100:null};
 }).filter(r=>(!from||r.period>=from.slice(0,7))&&(!to||r.period<=to.slice(0,7)));
 const sales=rows.reduce((a,r)=>a+cents(r.sales),0)/100,receipts=rows.reduce((a,r)=>a+r.receipts,0);
 const high=rows.length?rows.reduce((a,b)=>b.sales>a.sales?b:a):null,low=rows.length?rows.reduce((a,b)=>b.sales<a.sales?b:a):null;
 return {rows,summary:{sales,receipts,average:receipts?sales/receipts:null,high,low},source:'historical_pos',method:'Monthly summaries; filters select whole months. MoM uses only the immediately preceding calendar month. POS average is retained separately from net sales / receipts.'};
}
export function manualAnalytics(entries){
 const active=entries.filter(e=>e.status==='saved');const aggregate=key=>{
  const groups=new Map();for(const e of active){const k=key(e);const g=groups.get(k)||{label:k,quantity:0,salesCents:0,entries:0};g.quantity+=e.quantity;g.salesCents+=cents(e.total_amount);g.entries++;groups.set(k,g);}
  return [...groups.values()].map(g=>({...g,sales:g.salesCents/100}));
 };
 const byDay=aggregate(e=>manilaDay(new Date(e.saved_at))).sort((a,b)=>a.label.localeCompare(b.label));
 const byHour=aggregate(e=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Manila',hour:'2-digit',hourCycle:'h23'}).format(new Date(e.saved_at))+':00').sort((a,b)=>a.label.localeCompare(b.label));
 return {sales:active.reduce((s,e)=>s+cents(e.total_amount),0)/100,quantity:active.reduce((s,e)=>s+e.quantity,0),entryCount:active.length,byDay,byHour,byProduct:aggregate(e=>e.product_name).sort((a,b)=>b.sales-a.sales),byCategory:aggregate(e=>e.category_name),byPayment:aggregate(e=>e.payment_method||'Not recorded'),method:'Totals of saved manual entries grouped in Asia/Manila. Reversed entries excluded. Only periods with records are ranked; missing hours/days are not assumed to be zero. Entries are not POS receipts.'};
}
export function exportTable(type,snapshot){
 const {historical,topItems,entries,products}=snapshot;const manual=manualAnalytics(entries);
 if(['monthly','performance','trends'].includes(type))return {source:'historical_pos',title:'Monthly POS Sales',columns:['Period','Receipts','Net sales (PHP)','POS average (PHP)','Recalculated average (PHP)','MoM (%)'],rows:historical.rows.map(r=>[r.period,r.receipts,r.sales,r.posAverage,r.average===null?null:money(r.average),r.change===null?null:Math.round(r.change*100)/100]),totals:['Total',historical.summary.receipts,historical.summary.sales,null,historical.summary.average===null?null:money(historical.summary.average),null]};
 if(type==='top-items')return {source:'historical_pos',title:'Historical Monthly Top Items (partial product coverage)',columns:['Period','Product','Units sold','Item sales (PHP)'],rows:topItems.map(t=>[t.period,t.product_name,t.units_sold,Number(t.item_sales)])};
 if(type==='payments'){const groups=new Map();for(const e of entries.filter(e=>e.status==='saved')){const name=e.payment_method||'Not recorded',r=groups.get(name)||{count:0,cents:0};r.count++;r.cents+=cents(e.total_amount);groups.set(name,r);}return {source:'manual_sales',title:'Sales by Payment Method',columns:['Payment Method','Saved Entries','Revenue (PHP)','Share (%)'],rows:[...groups].map(([name,r])=>[name,r.count,r.cents/100,manual.sales?Math.round(r.cents/manual.sales*100)/100:0]),totals:['Total',manual.entryCount,manual.sales,manual.sales?100:0]};}
 if(type==='menu')return {source:'menu',title:'Menu Prices',columns:['Product','Category','Price (PHP)','Active'],rows:products.map(p=>[p.name,p.category_id,Number(p.unit_price),p.active?'Yes':'No'])};
 if(type==='daily')return {source:'manual_sales',title:'Manual Sales Entry History',columns:['Saved at (Asia/Manila)','Product','Category','Quantity','Unit price (PHP)','Amount (PHP)','Payment Method','Status'],rows:entries.filter(e=>e.status==='saved').map(e=>[new Date(e.saved_at).toLocaleString('en-GB',{timeZone:'Asia/Manila',hour12:false}),e.product_name,e.category_name,e.quantity,Number(e.unit_price),Number(e.total_amount),e.payment_method||'Not recorded',e.status]),totals:['Saved entries only','','',manual.quantity,'',manual.sales,'','Reversals excluded']};
 if(['products','categories'].includes(type)){const groups=type==='products'?manual.byProduct:manual.byCategory;return {source:'manual_sales',title:`Manual Sales by ${type}`,columns:[type==='products'?'Product':'Category','Quantity','Revenue (PHP)','Saved entries'],rows:groups.map(g=>[g.label,g.quantity,g.sales,g.entries]),totals:['Total',manual.quantity,manual.sales,manual.entryCount]};}
 if(type==='peak')return {source:'historical_pos',title:'Monthly Peak and Off-Peak',columns:['Period','Net sales (PHP)','Relative to selected monthly average'],rows:historical.rows.map(r=>[r.period,r.sales,r.sales>=historical.summary.sales/historical.rows.length*1.05?'Peak':r.sales<=historical.summary.sales/historical.rows.length*.9?'Off-peak':'Normal'])};
 if(type==='activity')return {source:'manual_sales',title:'Manual Daily Sales Activity',columns:['Philippine date','Quantity','Revenue (PHP)','Saved entries'],rows:manual.byDay.map(g=>[g.label,g.quantity,g.sales,g.entries])};
 throw new Error('Unsupported report type.');
}
