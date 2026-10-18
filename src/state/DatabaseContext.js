import React,{createContext,useContext,useState,useEffect,useCallback,useRef} from 'react';
import {api} from '../services/api';
const Context=createContext(null);
const empty={rows:[],summary:{sales:0,receipts:0,average:null,high:null,low:null}};
export function DatabaseProvider({children}){
 const [historical,setHistorical]=useState(empty),[topItems,setTopItems]=useState([]),[products,setProducts]=useState([]),[entries,setEntries]=useState([]),[status,setStatus]=useState(null),[error,setError]=useState(''),[manualError,setManualError]=useState(''),[loading,setLoading]=useState(true);
 const generation=useRef(0);
 const refresh=useCallback(async()=>{
  const request=++generation.current;
  const results=await Promise.allSettled([api('/historical'),api('/status'),api('/products'),api('/entries')]);
  if(request!==generation.current)return;
  if(results[0].status==='fulfilled'){setHistorical(results[0].value.historical);setTopItems(results[0].value.topItems);setError('');}else setError(results[0].reason.message);
  if(results[1].status==='fulfilled')setStatus(results[1].value);
  if(results[2].status==='fulfilled')setProducts(results[2].value.map(p=>({...p,category:p.category_id,price:Number(p.unit_price)})));
  if(results[3].status==='fulfilled'){setEntries(results[3].value.map(e=>({...e,paymentMethod:e.payment_method||'Not recorded',itemId:e.product_id,name:e.product_name,category:e.category_name,price:Number(e.unit_price),quantity:e.quantity,total:Number(e.total_amount),savedAt:e.saved_at,day:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila'}).format(new Date(e.saved_at))})));setManualError('');}else setManualError(results[3].reason.message);
  setLoading(false);
 },[]);
 useEffect(()=>{refresh();const id=setInterval(refresh,15000);const focus=()=>refresh();const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('spot-garage-sales-updates'):null;if(channel)channel.onmessage=focus;if(typeof window!=='undefined'){window.addEventListener('focus',focus);window.addEventListener('online',focus);}return()=>{clearInterval(id);channel?.close();if(typeof window!=='undefined'){window.removeEventListener('focus',focus);window.removeEventListener('online',focus);}};},[refresh]);
 return <Context.Provider value={{historical,topItems,products,entries,status,error,manualError,loading,refresh}}>{children}</Context.Provider>;
}
export const useDatabase=()=>useContext(Context);
export function selectedHistory(historical,date){return {...historical,rows:historical.rows.filter(r=>date==='all'||r.period===date||String(r.sales_year)===date)};}
export const reportDates=date=>date==='all'?{}:date.length===4?{from:date+'-01-01',to:date+'-12-31'}:{from:date+'-01',to:new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5)),0)).toISOString().slice(0,10)};
