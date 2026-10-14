import React from 'react';
import {View,Text,Pressable,ScrollView} from 'react-native';
import {useDatabase} from '../state/DatabaseContext';
import {money} from './DatabaseWidgets';

export default function GlobalSearchResults({query,pages,onSelect,onClose}){
 const db=useDatabase();
 const terms=query.toLowerCase().trim().split(/\s+/);
 const matches=values=>terms.every(term=>values.join(' ').toLowerCase().includes(term));
 const groups=[
  ['Pages',pages.map(p=>({id:p.id,title:p.label,detail:p.description||'Open page',target:p.id}))],
  ['Menu items',db.products.map(p=>({id:p.id,title:p.name,detail:`${p.category} · ${money(p.price)} · ${p.active?'Active':'Inactive'}`,target:'products'}))],
  ['Saved sales',db.entries.filter(e=>e.status==='saved').map(e=>({id:e.id,title:e.name,detail:`${e.category} · ${e.day} · Qty ${e.quantity} · ${money(e.total)} · ${new Date(e.savedAt).toLocaleTimeString('en-PH',{timeZone:'Asia/Manila'})}`,target:'transactions'}))],
  ['Monthly sales',db.historical.rows.map(r=>({id:r.period,title:`${r.month} ${r.sales_year}`,detail:`${r.period} · ${money(r.sales)} · ${r.receipts} receipts`,target:'top-sales'}))],
  ['Historical top items',db.topItems.map(r=>({id:r.id,title:r.product_name,detail:`${r.period} · ${r.units_sold} units · ${money(r.item_sales)}`,target:'reports'}))]
 ].map(([label,rows])=>[label,rows.filter(r=>matches([r.title,r.detail,label]))]);
 const count=groups.reduce((n,[,rows])=>n+rows.length,0);
 return <View style={{backgroundColor:'#FFFDFA',borderBottomWidth:1,borderColor:'#DED5CC',paddingHorizontal:16,paddingVertical:8}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text accessibilityLiveRegion="polite" style={{fontSize:13,color:'#756C67'}}>{count} results for “{query}”</Text><Pressable accessibilityRole="button" accessibilityLabel="Close search results" onPress={onClose} style={{minHeight:44,justifyContent:'center',paddingHorizontal:12}}><Text style={{color:'#704027'}}>Close</Text></Pressable></View>
  <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight:280}}>{groups.map(([label,rows])=>rows.length>0&&<View key={label}><Text style={{fontWeight:'700',color:'#704027',paddingVertical:8}}>{label} ({rows.length})</Text>{rows.map(r=><Pressable key={r.id} accessibilityRole="button" onPress={()=>onSelect(r.target)} style={({pressed})=>({minHeight:52,padding:10,borderRadius:6,backgroundColor:pressed?'#F1E7DD':'transparent',borderBottomWidth:1,borderColor:'#EEE7DF'})}><Text style={{fontSize:14,fontWeight:'600',color:'#251B17'}}>{r.title}</Text><Text style={{fontSize:12,color:'#657080',marginTop:4}}>{r.detail}</Text></Pressable>)}</View>)}{!count&&<Text style={{paddingVertical:16,color:'#657080'}}>No matches. Try a page, product, category, date, price, or sales amount.</Text>}</ScrollView>
 </View>;
}
