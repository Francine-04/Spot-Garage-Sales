const {chromium}=require('@playwright/test');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let rows=[];
 // Intercept writes: this UI synchronization test never creates business records.
 await page.route('**/api/entries',async route=>{if(route.request().method()==='POST'){const body=route.request().postDataJSON();const entry={id:crypto.randomUUID(),product_id:body.productId,product_name:'Varoom Classic',category_name:'Coffee-Based',quantity:body.quantity,unit_price:65,total_amount:body.quantity*65,saved_at:new Date().toISOString(),status:'saved'};rows.unshift(entry);return route.fulfill({json:entry,status:201});}return route.fulfill({json:rows});});
 await page.goto('http://127.0.0.1:8090',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Products & Menus',exact:true}).click();
 const input=page.getByRole('textbox',{name:'New quantity sold for Varoom Classic',exact:true});await input.fill('5');
 const row=input.locator('xpath=../../..');await row.getByRole('button',{name:'Save',exact:true}).click();await page.waitForTimeout(500);assert.equal(await input.inputValue(),'0');
 for(const name of ['Sales Performance','Sales Trends','Reports']){await page.getByRole('button',{name,exact:true}).first().click();await page.getByText('Sales Revenue',{exact:true}).waitFor();await page.getByText(/325\.00/).first().waitFor();}
 await page.getByRole('button',{name:'Sales Performance',exact:true}).click();await page.getByRole('button',{name:'Historical POS',exact:true}).click();await page.getByText(/604,880/).first().waitFor();
 await page.getByRole('button',{name:'Daily Sales',exact:true}).click();await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile overflow');assert.deepEqual(errors,[]);await browser.close();console.log('PASS save automatically updates daily KPIs, charts and reports; historical totals unchanged; mobile fits. Test writes intercepted.');
})().catch(e=>{console.error(e);process.exit(1)});
