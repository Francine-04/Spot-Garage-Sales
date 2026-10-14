import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
export const formats={csv:'text/csv; charset=utf-8',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pdf:'application/pdf'};
const safeText=value=>typeof value==='string'&&/^[\s]*[=+@-]/.test(value)?"'"+value:value;
export async function generateReport(table,format,period){
 const {title,columns,rows,totals}=table;const data=totals?[...rows,totals]:rows;
 if(format==='csv')return Buffer.from('\ufeff'+[columns,...data].map(row=>row.map(v=>'"'+String(safeText(v??'')).replaceAll('"','""')+'"').join(',')).join('\r\n'),'utf8');
 if(format==='xlsx'){
  const w=new ExcelJS.Workbook();w.creator='Spot Garage';const s=w.addWorksheet('Report');
  s.addRow(['Spot Garage']);s.addRow([title]);s.addRow([period]);s.addRow([`Source: ${table.source} · Currency: PHP · Timezone: Asia/Manila`]);s.addRow([]);s.addRow(columns);data.forEach(r=>s.addRow(r.map(v=>v??null)));
  s.views=[{state:'frozen',ySplit:6}];s.autoFilter={from:{row:6,column:1},to:{row:6,column:columns.length}};
  s.columns.forEach((c,i)=>{c.width=Math.min(42,Math.max(16,columns[i].length+2));if(/PHP/.test(columns[i]))c.numFmt='"₱"#,##0.00';});
  [1,2,6].forEach(r=>{s.getRow(r).font={bold:true,size:r===1?18:12,color:{argb:'FF563725'}};s.getRow(r).height=26;});
  s.getRow(6).eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF0E1D3'}};});
  if(totals)s.lastRow.font={bold:true};s.eachRow(r=>r.alignment={vertical:'middle',wrapText:true});
  return Buffer.from(await w.xlsx.writeBuffer());
 }
 if(format==='pdf')return new Promise((resolve,reject)=>{
  const doc=new PDFDocument({size:'A4',layout:columns.length>5?'landscape':'portrait',margin:32,bufferPages:true});const chunks=[];doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
  const width=doc.page.width-64,cw=width/columns.length;let y;
  function heading(){doc.font('Helvetica-Bold').fontSize(16).fillColor('#563725').text('Spot Garage',32,30);doc.fontSize(12).text(title,32,54,{width});doc.font('Helvetica').fontSize(9).text(period+' | '+table.source+' | PHP | Asia/Manila',32,78,{width});y=110;draw(columns,true);}
  function draw(row,head=false){const cells=row.map(v=>v==null?'—':String(v));doc.font(head?'Helvetica-Bold':'Helvetica').fontSize(8);const h=Math.max(26,...cells.map(v=>doc.heightOfString(v,{width:cw-12})+12));if(y+h>doc.page.height-48){doc.addPage();heading();}
   if(head)doc.rect(32,y,width,h).fill('#F0E1D3');cells.forEach((v,i)=>doc.fillColor('#252525').text(v,38+i*cw,y+6,{width:cw-12}));doc.moveTo(32,y+h).lineTo(32+width,y+h).strokeColor('#DDD3CA').stroke();y+=h;
  }
  heading();data.forEach(r=>draw(r));const range=doc.bufferedPageRange();for(let i=range.start;i<range.start+range.count;i++){doc.switchToPage(i);doc.fontSize(8).text(`Page ${i+1} of ${range.count}`,32,doc.page.height-30,{lineBreak:false});}doc.end();
 });
 throw new Error('Unsupported format.');
}
