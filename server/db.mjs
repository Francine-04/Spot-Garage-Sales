import 'dotenv/config';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
config({path:'.env.server',quiet:true});
if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Configure .env.server before starting the API.');
export const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
export async function result(query){const {data,error}=await query;if(error)throw Object.assign(new Error(error.message),{code:error.code});return data;}
export async function allRows(table,apply=q=>q){
 const rows=[];
 for(let offset=0;;offset+=1000){const batch=await result(apply(db.from(table).select('*')).range(offset,offset+999));rows.push(...batch);if(batch.length<1000)return rows;if(rows.length>=100000)throw new Error('Report exceeds 100,000 records. Choose a shorter date range.');}
}
