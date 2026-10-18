import test from 'node:test';
import assert from 'node:assert/strict';
// Dummy values prevent these tests from accessing production Supabase.
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-key';
process.env.ADMIN_USER_IDS='11111111-1111-4111-8111-111111111111';
process.env.APP_ORIGIN='http://localhost:8090';
process.env.PUBLIC_ACCESS='false';
const {adminGuard,protectRequest}=await import('../server/auth.mjs');
const {default:app}=await import('../server/index.mjs');
const {db}=await import('../server/db.mjs');
const response=()=>({statusCode:200,cookies:[],status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;},cookie(...args){this.cookies.push(args);return this;},set(){return this;}});
test('Authorization rejects missing, forged, unconfirmed and non-admin sessions',async()=>{
 for(const [cookie,user,error,expected] of [
  ['',null,null,401],['spot-session=forged',null,{},401],
  ['spot-session=valid',{id:'other',email_confirmed_at:'2026-01-01'},null,403],
  ['spot-session=valid',{id:process.env.ADMIN_USER_IDS},null,403],
  ['spot-session=valid',{id:process.env.ADMIN_USER_IDS,email_confirmed_at:'2026-01-01'},null,200]
 ]){const res=response(),req={headers:{cookie}};let called=false;await adminGuard({getUser:async()=>({data:{user},error})})(req,res,()=>{called=true;});assert.equal(res.statusCode,expected);assert.equal(called,expected===200);if(called)assert.equal(req.admin.id,process.env.ADMIN_USER_IDS);}
});
test('Write requests require the configured origin and custom header',()=>{
 for(const [origin,header,expected] of [['https://evil.example','1',403],['http://localhost:8090',null,403],['http://localhost:8090','1',200]]){
  const res=response();let called=false;protectRequest({method:'POST',get:k=>k==='origin'?origin:header},res,()=>{called=true;});assert.equal(res.statusCode,expected);assert.equal(called,expected===200);
 }
});
test('All API families reject unauthenticated access; no signup route is public',async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{for(const path of ['/api/status','/api/historical','/api/products','/api/entries','/api/manual-analytics','/api/report-preview','/api/exports','/api/auth/session'])assert.equal((await fetch(base+path)).status,401,path);
  for(const path of ['/api/products','/api/entries','/api/entries/11111111-1111-4111-8111-111111111111/reverse','/api/exports','/api/auth/signup'])assert.equal((await fetch(base+path,{method:'POST',headers:{Origin:process.env.APP_ORIGIN,'X-Spot-Garage-Request':'1','Content-Type':'application/json'},body:'{}'})).status,401,path);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('Authorized endpoints and export formats work with isolated database doubles',async()=>{
 const oldUser=db.auth.getUser,oldFrom=db.from,oldRpc=db.rpc;
 const writes=[];
 db.auth.getUser=async()=>({data:{user:{id:process.env.ADMIN_USER_IDS,email_confirmed_at:'2026-01-01'}}});
 const fixtures={monthly_sales:[{id:1,sales_year:2026,month_number:3,receipts:10,net_sales:650,pos_average_sale:65}],monthly_top_items:[],products:[{id:'coffee',name:'Coffee',category_id:'Coffee-Based',unit_price:65,active:true}],sales_entries:[{id:'11111111-1111-4111-8111-111111111111',product_name:'Coffee',category_name:'Coffee-Based',quantity:4,total_amount:260,unit_price:65,saved_at:'2026-10-14T04:00:00Z',status:'saved'}],report_exports:[]};
 db.from=table=>{let single=false,value;const chain={then(resolve){return Promise.resolve({data:single?{id:'export-test',...value}:fixtures[table],error:null,count:0}).then(resolve);}};for(const method of ['select','order','range','gte','lt','eq','limit'])chain[method]=()=>chain;chain.single=()=>{single=true;return chain;};for(const method of ['insert','update'])chain[method]=v=>{writes.push({table,method,value:v});value=v;return chain;};return chain;};
 db.rpc=async(name,args)=>{writes.push({name,args});return {data:{id:'sale-test',quantity:args.p_quantity},error:null};};
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`,headers={Cookie:'spot-session=test',Origin:process.env.APP_ORIGIN,'X-Spot-Garage-Request':'1','Content-Type':'application/json'};
 try{
  for(const path of ['/api/status','/api/historical','/api/products','/api/entries','/api/manual-analytics','/api/report-preview?type=monthly','/api/exports'])assert.equal((await fetch(base+path,{headers})).status,200,path);
  for(const [path,body] of [['/api/products',{name:'Coffee',category:'Coffee-Based',price:65}],['/api/entries',{productId:'coffee',quantity:4,paymentMethod:'Maya',idempotencyKey:process.env.ADMIN_USER_IDS}],['/api/entries/'+process.env.ADMIN_USER_IDS+'/reverse',{reason:'Test correction'}]]){const res=await fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});assert.ok(res.ok,await res.text());}
  assert.equal(writes.find(w=>w.name==='record_sale').args.p_actor,process.env.ADMIN_USER_IDS);
  for(const format of ['csv','xlsx','pdf']){const res=await fetch(base+'/api/exports',{method:'POST',headers,body:JSON.stringify({type:'monthly',format})});assert.equal(res.status,200);assert.ok((await res.arrayBuffer()).byteLength>30);}
 }finally{await new Promise(resolve=>server.close(resolve));db.auth.getUser=oldUser;db.from=oldFrom;db.rpc=oldRpc;}
});
test('Password login sets HttpOnly cookie only for approved admins',async()=>{
 const {default:express}=await import('express');const {createAuthRouter}=await import('../server/auth.mjs');
 let approved=false;const authApp=express();authApp.use(express.json());authApp.use(createAuthRouter(()=>({auth:{signInWithPassword:async()=>({data:{user:{id:approved?process.env.ADMIN_USER_IDS:'other',email_confirmed_at:'2026-01-01'},session:{access_token:'test-token',expires_at:Math.floor(Date.now()/1000)+3600}}}),signOut:async()=>({})}})));
 const server=authApp.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const url=`http://127.0.0.1:${server.address().port}/login`,options={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test@example.com',password:'test-password',remember:true})};
 try{assert.equal((await fetch(url,options)).status,401);approved=true;const res=await fetch(url,options);assert.equal(res.status,200);assert.match(res.headers.get('set-cookie'),/HttpOnly/);assert.match(res.headers.get('set-cookie'),/SameSite=Strict/);assert.ok(!(await res.text()).includes('test-token'));}finally{await new Promise(resolve=>server.close(resolve));}
});
test('Explicit public mode accepts one-click login and marks unverified audit actor',async()=>{
 process.env.PUBLIC_ACCESS='true';
 const req={headers:{}},res=response();let called=false;
 try{await adminGuard({getUser:()=>{throw Error('Public mode must not authenticate');}})(req,res,()=>{called=true;});assert.ok(called);assert.equal(req.admin.id,'public-visitor');
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 try{const result=await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`,{method:'POST',headers:{Origin:process.env.APP_ORIGIN,'X-Spot-Garage-Request':'1','Content-Type':'application/json'},body:'{}'});assert.equal(result.status,200);assert.equal((await result.json()).user.id,'public-visitor');}finally{await new Promise(resolve=>server.close(resolve));}
 }finally{process.env.PUBLIC_ACCESS='false';}
});
