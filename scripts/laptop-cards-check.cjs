const{chromium}=require('@playwright/test');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:768}});
await page.goto('http://localhost:8088');await page.getByText('WELCOME BACK,',{exact:true}).waitFor();
for(const name of ['Home','Sales Performance','Sales Trends','Products & Menus','Daily Transactions','Peak & Off-Peak','Reports']){
await page.getByRole('button',{name,exact:true}).first().click();await page.waitForTimeout(650);await page.screenshot({path:'docs/screenshots/laptop-1366-'+name.replace(/[^a-z]/gi,'')+'.png'});
}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
