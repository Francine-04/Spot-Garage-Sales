const {chromium}=require('@playwright/test');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto('http://localhost:8088');
await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();
await page.getByRole('button',{name:'Reports',exact:true}).click();
await page.getByRole('button',{name:'All Categories',exact:true}).click();
await page.getByRole('button',{name:'Burgers',exact:true}).click();
await page.getByRole('button',{name:'Burgers',exact:true}).first().waitFor();
await page.setViewportSize({width:844,height:390});
await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();
await page.getByRole('button',{name:'Products & Menus',exact:true}).click();
await page.getByRole('button',{name:'+ Add Menu Item',exact:true}).click();
await page.getByRole('textbox',{name:'Menu item name'}).fill('Keyboard test');
await page.getByRole('button',{name:'Cancel',exact:true}).click();
await page.evaluate(()=>navigator.serviceWorker.ready);
await page.reload();
await page.context().setOffline(true);
await page.goto('http://localhost:8088/?offline-check=1');
await page.getByText("You're offline",{exact:true}).waitFor();
console.log('PASS: responsive dropdown, rotation, menu modal, service-worker offline fallback');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

