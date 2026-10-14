const {chromium,firefox,webkit}=require('@playwright/test');
(async()=>{
const engine=process.env.BROWSER||'edge';
const browser=await (engine==='firefox'?firefox:engine==='webkit'?webkit:chromium).launch({...(engine==='edge'?{channel:'msedge'}:engine==='chrome'?{channel:'chrome'}:{}),headless:true});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const sizes=[[320,568],[375,667],[390,844],[430,932],[768,1024],[820,1180],[1024,768],[1280,800],[1366,768],[1440,900],[1536,864],[1920,1080],[2560,1440]];
for(const [width,height] of sizes){
await page.setViewportSize({width,height});await page.goto('http://localhost:8088');await page.getByText('WELCOME BACK,',{exact:true}).waitFor();
for(const name of ['Home','Sales Performance','Sales Trends','Products & Menus','Daily Transactions','Peak & Off-Peak','Reports']){
if(width<1280)await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();
await page.getByRole('button',{name,exact:true}).first().click();
await page.waitForTimeout(350);
const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
if(overflow.scroll>width+1)throw Error('Page overflow '+width+' '+name+' '+JSON.stringify(overflow));
}
console.log('CHECKED',width,height);
}
await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:8088');
await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();await page.getByRole('button',{name:'Products & Menus',exact:true}).click();
const input=page.getByRole('textbox',{name:'New quantity sold for Varoom Classic',exact:true});
for(const quantity of ['5','5','3']){await input.fill(quantity);await page.getByRole('button',{name:'Save Sale',exact:true}).first().click();await page.waitForTimeout(50);if(await input.inputValue()!=='0')throw Error('Input not reset');}
await page.getByText('Total sold today: 13',{exact:true}).waitFor();
await page.screenshot({path:'docs/screenshots/responsive-products-mobile.png',fullPage:true});
await page.reload();await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();await page.getByRole('button',{name:'Products & Menus',exact:true}).click();await page.getByText('Total sold today: 13',{exact:true}).waitFor();
await page.getByRole('textbox',{name:'Search menu items',exact:true}).fill('Americano');
if(await page.getByRole('textbox',{name:'New quantity sold for Varoom Classic',exact:true}).count())throw Error('Search did not filter');
await page.getByRole('button',{name:'Clear search'}).count().then(async count=>{if(count)await page.getByRole('button',{name:'Clear search'}).click();else await page.getByLabel('Clear search').click();});
await page.getByRole('textbox',{name:'New quantity sold for Varoom Classic',exact:true}).waitFor();
await page.context().setOffline(true);await input.fill('2');
if(!await page.getByRole('button',{name:'Save Sale',exact:true}).first().isDisabled())throw Error('Offline save enabled');
if(errors.length)throw Error(errors.join('\n'));console.log('PASS additive mobile saves, input reset, reload persistence, search, offline block, no runtime errors');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
