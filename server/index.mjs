import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {createAuthRouter,requireAdmin,protectRequest} from './auth.mjs';
import {db,result,allRows} from './db.mjs';
import {validateDates,historicalAnalytics,manualAnalytics,exportTable,manilaDay} from './analytics.mjs';
import {formats,generateReport} from './exports.mjs';
const app=express();
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'data:','blob:'],fontSrc:["'self'",'data:'],connectSrc:["'self'"],upgradeInsecureRequests:process.env.NODE_ENV==='production'?[]:null}}}));
app.use('/api',protectRequest);
app.use('/api',rateLimit({windowMs:60000,limit:180,standardHeaders:'draft-8',legacyHeaders:false}));app.use(express.json({limit:'32kb'}));
app.use('/api/auth',createAuthRouter());
app.use('/api',requireAdmin);
const actor=req=>req.admin.id;
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
const dates=req=>validateDates(req.query.from,req.query.to);
const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s||'');
async function history(from,to){const records=await allRows('monthly_sales',q=>q.order('sales_year').order('month_number'));return historicalAnalytics(records,from,to);}
async function manualRows(from,to){return allRows('sales_entries',q=>{q=q.order('saved_at',{ascending:false}).order('id');if(from)q=q.gte('saved_at',from+'T00:00:00+08:00');if(to)q=q.lt('saved_at',new Date(Date.parse(to+'T00:00:00+08:00')+86400000).toISOString());return q;});}
async function snapshot(from,to){const historical=await history(from,to);const ids=new Set(historical.rows.map(r=>r.id));const topItems=(await allRows('monthly_top_items',q=>q.order('id'))).filter(r=>ids.has(r.monthly_sales_id)).map(r=>({...r,period:historical.rows.find(m=>m.id===r.monthly_sales_id).period}));return {historical,topItems};}
async function buildReport(type,from,to,category,productId,search,sort){
 const historicalTypes=['monthly','performance','trends','top-items','peak'];
 const snap=historicalTypes.includes(type)?await snapshot(from,to):{historical:{rows:[],summary:{}},topItems:[]};
 snap.entries=['daily','products','categories','activity'].includes(type)?await manualRows(from,to):[];
 if(category)snap.entries=snap.entries.filter(e=>e.category_name===category);if(productId)snap.entries=snap.entries.filter(e=>e.product_id===productId);
 if(search)snap.entries=snap.entries.filter(e=>(e.product_name+' '+e.category_name+' '+manilaDay(new Date(e.saved_at))).toLowerCase().includes(String(search).toLowerCase()));if(sort==='Oldest first')snap.entries.reverse();
 snap.products=type==='menu'?await allRows('products',q=>q.order('name')):[];
 return exportTable(type,snap);
}
app.get('/api/report-preview',wrap(async(req,res)=>{const {from,to}=dates(req);res.json(await buildReport(req.query.type,from,to,req.query.category,req.query.productId,req.query.search,req.query.sort));}));
app.get('/api/status',wrap(async(req,res)=>{const h=await history();const {error}=await db.from('products').select('id').limit(1);res.json({businessName:'Spot Garage',historicalMonths:h.rows.length,latestHistoricalUpdate:h.rows.map(r=>r.created_at).sort().at(-1)||null,manualReady:!error,manualMessage:error?'Menu and daily-sales migration awaiting approval/application.':null,source:'Supabase',today:manilaDay()});}));
app.get('/api/historical',wrap(async(req,res)=>{const {from,to}=dates(req);res.json(await snapshot(from,to));}));
app.get('/api/products',wrap(async(req,res)=>res.json(await allRows('products',q=>q.order('category_id').order('name')))));
app.post('/api/products',wrap(async(req,res)=>{const {name,category,price}=req.body;if(typeof name!=='string'||!name.trim()||name.length>100||typeof category!=='string'||!Number.isFinite(price)||price<0||price>1000000||Math.round(price*100)!==price*100)throw new Error('Enter a valid name, existing category and price with at most two decimals.');res.status(201).json(await result(db.from('products').insert({id:randomUUID(),name:name.trim(),category_id:category,unit_price:price}).select().single()));}));
app.get('/api/entries',wrap(async(req,res)=>{const {from,to}=dates(req);const rows=await manualRows(from,to);res.json(rows);}));
app.post('/api/entries',rateLimit({windowMs:60000,limit:120}),wrap(async(req,res)=>{const {productId,quantity,idempotencyKey}=req.body;if(!Number.isInteger(quantity)||quantity<1||quantity>100000||typeof productId!=='string'||productId.length>200||!uuid(idempotencyKey))throw new Error('A product, positive whole quantity (up to 100,000) and UUID request key are required.');const entry=await result(db.rpc('record_sale',{p_product_id:productId,p_quantity:quantity,p_idempotency_key:idempotencyKey,p_actor:actor(req)}));res.status(201).json(entry);}));
app.post('/api/entries/:id/reverse',wrap(async(req,res)=>{if(!uuid(req.params.id)||typeof req.body.reason!=='string'||req.body.reason.trim().length<5||req.body.reason.length>500)throw new Error('Select a sale and provide a correction reason (5–500 characters).');res.json(await result(db.rpc('reverse_sale',{p_entry_id:req.params.id,p_reason:req.body.reason,p_actor:actor(req)})));}));
app.get('/api/manual-analytics',wrap(async(req,res)=>{const {from,to}=dates(req);res.json(manualAnalytics(await manualRows(from,to)));}));
app.get('/api/exports',wrap(async(req,res)=>{const page=Math.max(0,Number(req.query.page)||0),{from,to}=dates(req);let q=db.from('report_exports').select('*',{count:'exact'}).order('created_at',{ascending:false}).order('id').range(page*20,page*20+19);if(req.query.type)q=q.eq('report_type',req.query.type);if(from)q=q.gte('created_at',from+'T00:00:00+08:00');if(to)q=q.lt('created_at',new Date(Date.parse(to+'T00:00:00+08:00')+86400000).toISOString());const {data,error,count}=await q;if(error)throw error;res.json({rows:data,count,page});}));
app.post('/api/exports',wrap(async(req,res)=>{
 const {type,format,category,productId,search,sort}=req.body,{from,to}=validateDates(req.body.from,req.body.to);if(!formats[format])throw new Error('Choose CSV, XLSX or PDF.');
 const table=await buildReport(type,from,to,category,productId,search,sort);if(!table.rows.length)throw new Error('No matching records to export.');
 const fileName=`SpotGarage_${type}_${from||'all'}_${to||'available'}_${Date.now()}.${format}`;
 const record=await result(db.from('report_exports').insert({report_type:type,report_title:table.title,file_format:format,date_from:from,date_to:to,filters:{category,productId,search,sort},data_source:table.source,file_name:fileName}).select().single());
 try{const bytes=await generateReport(table,format,`${from||'All available'} to ${to||'latest'}`);if(bytes.length>4_000_000)throw new Error('Report exceeds the download limit. Choose a shorter date range.');await result(db.from('report_exports').update({status:'completed',completed_at:new Date().toISOString(),file_size_bytes:bytes.length}).eq('id',record.id));res.set({'Content-Type':formats[format],'Content-Disposition':`attachment; filename="${fileName}"`,'X-Report-Id':record.id}).send(bytes);}
 catch(error){await db.from('report_exports').update({status:'failed',error_message:'Report generation or completion tracking failed.'}).eq('id',record.id);throw error;}
}));
app.use('/api',(req,res)=>res.status(404).json({error:'Unknown API route.'}));
app.use(express.static(path.resolve('dist')));app.get('/{*path}',(req,res)=>res.sendFile(path.resolve('dist/index.html')));
app.use((error,req,res,next)=>{console.error('API failure:',error.code||error.name);const denied=['42501','PGRST301','PGRST302','PGRST303','401','403'].includes(String(error.code));
 if(denied)return res.status(503).json({error:'Supabase rejected the server connection. Check that Vercel SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY belong to the same project and use the server service-role key, then redeploy.',code:String(error.code)});
 const missing=['42P01','PGRST205','PGRST202'].includes(error.code);res.status(missing?503:400).json({code:error.code||'REQUEST_FAILED',error:missing?'Database migration is not applied yet. Existing historical records remain available.':error.code?'Database operation failed. No success was confirmed.':error.message});});
export default app;
