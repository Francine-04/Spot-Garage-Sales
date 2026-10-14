export async function api(path,body){
 const response=await fetch('/api'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Spot-Garage-Request':'1'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('The backend did not return JSON. Check the deployment API routing and server environment variables.');
 const data=await response.json();if(!response.ok){if([401,403].includes(response.status)&&!path.startsWith('/auth/')&&typeof window!=='undefined')window.dispatchEvent(new Event('spot-auth-expired'));throw new Error(data.error||'Request failed.');}if(body!==undefined&&/^\/(entries|products)/.test(path)&&typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('spot-garage-sales-updates');channel.postMessage({changed:true});channel.close();}return data;
}
export async function downloadReport(filters){
 const response=await fetch('/api/exports',{method:'POST',headers:{'Content-Type':'application/json','X-Spot-Garage-Request':'1'},body:JSON.stringify(filters)});
 if(!response.ok){const body=await response.json();throw new Error(body.error||'Export failed.');}
 const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=/filename="([^"]+)"/.exec(response.headers.get('content-disposition'))?.[1]||`SpotGarage_Report.${filters.format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const newRequestKey=()=>globalThis.crypto.randomUUID();
export function printReport(table,period){
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const win=window.open('','_blank');if(!win)throw new Error('Allow pop-ups to print this report.');
 const rows=table.totals?[...table.rows,table.totals]:table.rows;
 win.document.write('<!doctype html><html lang="en"><head><title>Spot Garage Report</title><style>body{font:12px Arial;color:#29221e;margin:28px}h1{color:#563725}table{width:100%;border-collapse:collapse}th,td{padding:9px;border-bottom:1px solid #ddd;text-align:left}th{background:#f0e1d3}thead{display:table-header-group}tr{break-inside:avoid}@page{size:landscape;margin:15mm}</style></head><body><h1>Spot Garage</h1><h2>'+escape(table.title)+'</h2><p>'+escape(period)+' | '+escape(table.source)+' | Asia/Manila</p><table><thead><tr>'+table.columns.map(c=>'<th>'+escape(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+escape(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>');win.document.close();win.focus();win.print();
}
