import assert from 'node:assert/strict';
const base='http://127.0.0.1:8090';
const status=await (await fetch(base+'/api/status')).json();assert.equal(status.manualReady,true);
for(const format of ['csv','xlsx','pdf']){
 const response=await fetch(base+'/api/exports',{method:'POST',headers:{'Content-Type':'application/json','X-Spot-Garage-Request':'1'},body:JSON.stringify({type:'monthly',format,from:'2026-03-01',to:'2026-08-31'})});
 if(!response.ok)throw Error(await response.text());const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length>100);if(format==='csv')assert.match(bytes.toString(),/604880/);if(format==='pdf')assert.equal(bytes.subarray(0,4).toString(),'%PDF');if(format==='xlsx')assert.equal(bytes.subarray(0,2).toString(),'PK');
 console.log('PASS live '+format+' export with history ID '+response.headers.get('x-report-id'));
}
const history=await (await fetch(base+'/api/exports?type=monthly')).json();assert.ok(history.rows.slice(0,3).every(r=>r.status==='completed'));
console.log('PASS export history records completed. No sales created.');
