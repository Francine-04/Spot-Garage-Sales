const state = { date: "all", region: "all", category: "all", payment: "all", search: "" };
const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const preciseMoney = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });
const number = new Intl.NumberFormat("en-PH");
const $ = id => document.getElementById(id);
const dateGroups = { q1:[0,1,2], q2:[3,4,5], q3:[6,7,8], q4:[9,10,11] };
let chartPoints = [];
let profitPoints = [];
const demoMargins = [0.27,0.28,0.29,0.28,0.30,0.31,0.30,0.32,0.31,0.33,0.30,0.29];

function getFilteredData(){
  const term = state.search.toLowerCase().trim();
  return salesData.filter(row => {
    const inDate = state.date === "all" || dateGroups[state.date].includes(row.monthIndex);
    const searchable = `${row.month} ${row.region} ${row.category} ${row.paymentType}`.toLowerCase();
    return inDate && (state.region === "all" || row.region === state.region) && (state.category === "all" || row.category === state.category) && (state.payment === "all" || row.paymentType === state.payment) && (!term || searchable.includes(term));
  });
}
function sum(rows,key){ return rows.reduce((total,row) => total + (Number(row[key]) || 0),0); }
function group(rows,key){ return rows.reduce((map,row) => { (map[row[key]] ||= []).push(row); return map; },{}); }

function renderKPIs(rows){
  const receipts=sum(rows,"receipts"), sales=sum(rows,"netSales"), items=sum(rows,"itemsSold"), average=receipts ? sales/receipts : 0;
  const cards=[
    ["Total receipts",number.format(receipts),"▧","Transactions in selection"],
    ["Net sales",money.format(sales),"₱","Demo gross sales"],
    ["Average sale",preciseMoney.format(average),"◉","Per receipt"],
    ["Total items sold",number.format(items),"◇","Units in selection"]
  ];
  $("kpis").innerHTML=cards.map(([label,value,icon,sub])=>`<article class="kpi-card" tabindex="0"><header>${label}<span>${icon}</span></header><strong class="${value==='Not available'?'unavailable-value':''}">${value}</strong><small>${sub}</small></article>`).join("");
  $("customerTransactions").textContent=number.format(receipts);
}
function monthTotals(rows){const grouped=group(rows,"month");return months.map((month,index)=>({month,index,sales:sum(grouped[month]||[],"netSales"),receipts:sum(grouped[month]||[],"receipts")})).filter(x=>x.sales||x.receipts)}
function drawChart(rows){
  const canvas=$("salesChart"), box=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(1,box.width*dpr); canvas.height=Math.max(1,box.height*dpr);
  const ctx=canvas.getContext("2d"); ctx.scale(dpr,dpr); const w=box.width,h=box.height,p={l:58,r:18,t:18,b:42}; ctx.clearRect(0,0,w,h);
  const values=monthTotals(rows), max=Math.max(...values.map(v=>v.sales),1)*1.15;
  ctx.font="10px DM Sans";ctx.fillStyle="#766b65";ctx.strokeStyle="#e7ded6";ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=p.t+(h-p.t-p.b)*i/4;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText(money.format(max*(4-i)/4).replace("PHP","₱"),2,y+3)}
  chartPoints=[];const slot=(w-p.l-p.r)/Math.max(values.length,1);
  values.forEach((v,i)=>{const bh=(v.sales/max)*(h-p.t-p.b),x=p.l+i*slot+slot*.2,y=h-p.b-bh,bw=slot*.6;const grad=ctx.createLinearGradient(0,y,0,h-p.b);grad.addColorStop(0,"#604438");grad.addColorStop(1,"#a68169");ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(x,y,bw,bh,5);ctx.fill();ctx.fillStyle="#665b55";ctx.textAlign="center";ctx.fillText(v.month.slice(0,3),x+bw/2,h-17);chartPoints.push({x,y,w:bw,h:bh,data:v})});ctx.textAlign="start";
}
function drawProfitChart(rows){
  const canvas=$("profitChart"), box=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(1,box.width*dpr);canvas.height=Math.max(1,box.height*dpr);
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);const w=box.width,h=box.height,p={l:52,r:14,t:12,b:32};ctx.clearRect(0,0,w,h);
  const values=monthTotals(rows).map(v=>({...v,margin:demoMargins[v.index],profit:v.sales*demoMargins[v.index]}));
  const max=Math.max(...values.map(v=>v.sales),1)*1.12;
  ctx.font="9px DM Sans";ctx.strokeStyle="#e7ded6";ctx.fillStyle="#766b65";ctx.lineWidth=1;
  for(let i=0;i<=3;i++){const y=p.t+(h-p.t-p.b)*i/3;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText(money.format(max*(3-i)/3).replace("PHP","₱"),1,y+3)}
  const slot=(w-p.l-p.r)/Math.max(values.length-1,1), yFor=value=>h-p.b-(value/max)*(h-p.t-p.b);
  const line=(key,color)=>{ctx.beginPath();values.forEach((v,i)=>{const x=p.l+i*slot,y=yFor(v[key]);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=2.2;ctx.stroke();values.forEach((v,i)=>{const x=p.l+i*slot,y=yFor(v[key]);ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()})};
  line("sales","#594035");line("profit","#d5ad8d");profitPoints=[];
  values.forEach((v,i)=>{const x=p.l+i*slot;ctx.fillStyle="#665b55";ctx.textAlign="center";ctx.fillText(v.month.slice(0,3),x,h-10);profitPoints.push({x,data:v})});ctx.textAlign="start";
  const totalSales=values.reduce((a,v)=>a+v.sales,0),totalProfit=values.reduce((a,v)=>a+v.profit,0);
  $("estimatedProfit").textContent=money.format(totalProfit);$("profitMargin").textContent=`${(totalSales?totalProfit/totalSales*100:0).toFixed(1)}%`;
}
function renderProducts(rows){
  const totals=Object.entries(group(rows,"category")).map(([name,items])=>({name,sales:sum(items,"netSales"),items:sum(items,"itemsSold")})).sort((a,b)=>b.sales-a.sales);
  const max=Math.max(...totals.map(x=>x.sales),1), total=sum(rows,"netSales");
  $("productList").innerHTML=totals.length?totals.map(x=>`<div class="product-row" tabindex="0"><header><b>${x.name}</b><span>${total?((x.sales/total)*100).toFixed(1):0}%</span></header><div class="bar"><i style="width:${x.sales/max*100}%"></i></div><div class="product-detail">${money.format(x.sales)} · ${number.format(x.items)} items</div></div>`).join(""):'<div class="empty-state"><p>No matching products.</p></div>';
  document.querySelectorAll(".product-row").forEach(el=>{el.addEventListener("click",()=>el.classList.toggle("open"));el.addEventListener("keydown",e=>{if(e.key==="Enter")el.click()})});
}
function renderRegions(rows){
  const totals=Object.entries(group(rows,"region")).map(([name,items])=>({name,sales:sum(items,"netSales"),receipts:sum(items,"receipts")})).sort((a,b)=>b.sales-a.sales), total=sum(rows,"netSales");
  $("regionList").innerHTML=totals.length?totals.map((x,i)=>`<div class="region-row ${state.region===x.name?'selected':''}" data-region="${x.name}" tabindex="0"><span>${i+1}</span><div><b>${x.name}</b><small>${number.format(x.receipts)} receipts · ${total?((x.sales/total)*100).toFixed(1):0}% share</small></div><strong>${money.format(x.sales)}</strong></div>`).join(""):'<div class="empty-state"><p>No matching regions.</p></div>';
  document.querySelectorAll(".region-row").forEach(el=>{const choose=()=>{$("regionFilter").value=el.dataset.region;state.region=el.dataset.region;render()};el.addEventListener("click",choose);el.addEventListener("keydown",e=>{if(e.key==="Enter")choose()})});
}
function renderPeriods(rows){
  const totals=monthTotals(rows);if(!totals.length){$("periods").innerHTML='<div class="empty-state"><p>No matching period data.</p></div>';return}
  const peak=totals.reduce((a,b)=>b.sales>a.sales?b:a), off=totals.reduce((a,b)=>b.sales<a.sales?b:a);
  $("periods").innerHTML=`<div class="period-card"><span>↗</span><div><b>Peak period · ${peak.month}</b><small>${money.format(peak.sales)} from ${number.format(peak.receipts)} receipts</small></div></div><div class="period-card off"><span>↘</span><div><b>Off-peak period · ${off.month}</b><small>${money.format(off.sales)} from ${number.format(off.receipts)} receipts</small></div></div>`;
}
function render(){const rows=getFilteredData();renderKPIs(rows);renderProducts(rows);renderRegions(rows);renderPeriods(rows);requestAnimationFrame(()=>{drawChart(rows);drawProfitChart(rows)});$("resultCount").textContent=`${number.format(rows.length)} demo records shown`;}
function showToast(message){const toast=$("toast");toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2300)}
function resetFilters(){Object.assign(state,{date:"all",region:"all",category:"all",payment:"all",search:""});["dateFilter","regionFilter","categoryFilter","paymentFilter"].forEach(id=>$(id).value="all");$("searchInput").value="";$("clearSearch").classList.remove("visible");render();showToast("Filters reset")}
function exportCSV(){const rows=getFilteredData(),keys=["year","month","region","category","paymentType","receipts","netSales","averageSale","itemsSold"];const csv=[keys.join(","),...rows.map(row=>keys.map(k=>`"${row[k]}"`).join(","))].join("\n");const blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="spot-garage-demo-report.csv";a.click();URL.revokeObjectURL(url);showToast("Filtered CSV downloaded")}
function closeMenus(except){document.querySelectorAll(".dropdown.open").forEach(menu=>{if(menu!==except)menu.classList.remove("open")})}
function toggleMenu(button,menu){const opening=!menu.classList.contains("open");closeMenus(menu);menu.classList.toggle("open",opening);button.setAttribute("aria-expanded",opening)}
function closeSidebar(){$("mainNav").classList.remove("open");$("sidebarBackdrop").classList.remove("open");$("menuButton").setAttribute("aria-expanded","false")}

function populateFilter(id,key){[...new Set(salesData.map(row=>row[key]))].forEach(value=>$(id).add(new Option(value,value)))}
populateFilter("regionFilter","region");populateFilter("categoryFilter","category");populateFilter("paymentFilter","paymentType");
[["dateFilter","date"],["regionFilter","region"],["categoryFilter","category"],["paymentFilter","payment"]].forEach(([id,key])=>$(id).addEventListener("change",e=>{state[key]=e.target.value;render()}));
$("searchInput").addEventListener("input",e=>{state.search=e.target.value;$("clearSearch").classList.toggle("visible",!!e.target.value);render()});
$("clearSearch").addEventListener("click",()=>{$("searchInput").value="";state.search="";$("clearSearch").classList.remove("visible");render();$("searchInput").focus()});
$("resetFilters").addEventListener("click",resetFilters);$("exportReport").addEventListener("click",exportCSV);
$("menuButton").addEventListener("click",()=>{const open=$("mainNav").classList.toggle("open");$("sidebarBackdrop").classList.toggle("open",open);$("menuButton").setAttribute("aria-expanded",open)});$("sidebarBackdrop").addEventListener("click",closeSidebar);
document.querySelectorAll("[data-nav]").forEach(link=>link.addEventListener("click",()=>{const target=link.dataset.nav;document.querySelectorAll(".nav-link").forEach(x=>x.classList.toggle("active",x.dataset.nav===target));closeSidebar();if(target==="reports")showToast("Reports section opened")}));
[["profileButton","profileMenu"],["notificationsButton","notificationsMenu"],["utilityButton","utilityMenu"]].forEach(([b,m])=>$(b).addEventListener("click",e=>{e.stopPropagation();toggleMenu($(b),$(m))}));document.addEventListener("click",()=>closeMenus());
document.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.action;if(action==="export")exportCSV();else if(action==="refresh"){render();showToast("Dashboard refreshed")}else if(action==="top")scrollTo({top:0,behavior:"smooth"});else showToast(`${button.textContent.trim()} is ready for backend connection`)}));
$("salesChart").addEventListener("mousemove",e=>{const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,point=chartPoints.find(p=>x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=rect.height-42),tip=$("chartTooltip");if(point){tip.innerHTML=`<b>${point.data.month}</b><br>${money.format(point.data.sales)}<br>${number.format(point.data.receipts)} receipts`;tip.style.display="block";tip.style.left=`${Math.min(x+12,rect.width-145)}px`;tip.style.top=`${Math.max(4,y-50)}px`}else tip.style.display="none"});$("salesChart").addEventListener("mouseleave",()=>$("chartTooltip").style.display="none");
$("profitChart").addEventListener("mousemove",e=>{const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,point=profitPoints.reduce((best,p)=>!best||Math.abs(p.x-x)<Math.abs(best.x-x)?p:best,null),tip=$("profitTooltip");if(point&&Math.abs(point.x-x)<35){tip.innerHTML=`<b>${point.data.month}</b><br>Sales: ${money.format(point.data.sales)}<br>Est. profit: ${money.format(point.data.profit)}<br>Demo margin: ${(point.data.margin*100).toFixed(0)}%`;tip.style.display="block";tip.style.left=`${Math.min(x+10,rect.width-155)}px`;tip.style.top=`${Math.max(4,y-58)}px`}else tip.style.display="none"});$("profitChart").addEventListener("mouseleave",()=>$("profitTooltip").style.display="none");
let resizeTimer;addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{drawChart(getFilteredData());drawProfitChart(getFilteredData())},100)});render();
