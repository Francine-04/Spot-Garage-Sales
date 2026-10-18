import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {randomUUID} from 'node:crypto';
import {exportTable} from '../server/analytics.mjs';
test('Payment persistence, idempotency, existing records, validation and reversals',async()=>{
 const pg=new PGlite();try{
 await pg.exec('create role anon;create role authenticated;create role service_role;');
 for(const file of ['20261014000100_menu_sales_reports.sql','20261014000200_seed_existing_menu.sql'])await pg.exec(await readFile('supabase/migrations/'+file,'utf8'));
 await pg.query('select public.record_sale($1,1,$2,$3)',['Coffee-Based-Varoom Classic',randomUUID(),'test']);
 await pg.exec(await readFile('supabase/migrations/20261018000100_sale_payment_method.sql','utf8'));
 assert.equal((await pg.query('select payment_method from public.sales_entries')).rows[0].payment_method,null);
 const key=randomUUID(),args=['Coffee-Based-Varoom Classic',4,key,'test','Maya'];
 const save=values=>pg.query('select (public.record_sale($1,$2,$3,$4,$5)).*',values);
 const entry=(await save(args)).rows[0];assert.equal(entry.payment_method,'Maya');assert.equal(Number(entry.total_amount),260);assert.equal((await save(args)).rows[0].id,entry.id);
 await assert.rejects(save([...args.slice(0,4),'Cash']));await assert.rejects(save([...args.slice(0,2),randomUUID(),'test','Invalid']));
 const report=exportTable('payments',{entries:[entry],historical:{},products:[],topItems:[]});assert.deepEqual(report.rows,[['Maya',1,260,100]]);
 await pg.query('select public.reverse_sale($1,$2,$3)',[entry.id,'Test correction','test']);const reversed=(await pg.query('select * from public.sales_entries where id=$1',[entry.id])).rows;
 assert.equal(exportTable('payments',{entries:reversed}).rows.length,0);
 }finally{await pg.close();}
});
