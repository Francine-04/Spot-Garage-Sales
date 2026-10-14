import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const code=await readFile('src/services/liveSales.js','utf8');const {liveSales}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const entries=[{status:'saved',day:'2026-10-14',quantity:5,total:325},{status:'saved',day:'2026-10-14',quantity:3,total:195},{status:'reversed',day:'2026-10-14',quantity:5,total:325}];
assert.equal(liveSales(entries).sales,520);assert.equal(liveSales(entries).quantity,8);assert.equal(liveSales(entries).count,2);assert.equal(liveSales(entries,'2026-03').sales,0);assert.equal(liveSales(entries,'2026').sales,520);console.log('PASS date filtering, reversal exclusion and additive daily aggregation.');
