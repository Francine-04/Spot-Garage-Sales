import {db,result} from '../server/db.mjs';
import {historicalAnalytics,exportTable} from '../server/analytics.mjs';
import {generateReport} from '../server/exports.mjs';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const sales=await result(db.from('monthly_sales').select('*').order('month_number'));
const topItems=await result(db.from('monthly_top_items').select('*').order('id'));
assert.equal(sales.length,6);assert.ok(sales.every(r=>r.sales_year===2026));assert.deepEqual(sales.map(r=>r.month_number),[3,4,5,6,7,8]);
const historical=historicalAnalytics(sales);assert.equal(historical.summary.sales,604880);assert.equal(historical.summary.receipts,3281);assert.equal(topItems.length,6);
const table=exportTable('monthly',{historical,topItems,products:[],entries:[]});for(const format of ['csv','xlsx','pdf']){const data=await generateReport(table,format,'March–August 2026');assert.ok(data.length>100);}
await writeFile('docs/backend/historical-baseline.json',JSON.stringify({sales,topItems},null,2));
console.log('PASS live Supabase read-only verification: 6 months, 6 top items, PHP 604880, 3281 receipts; CSV/XLSX/PDF generated from actual rows. No writes.');
