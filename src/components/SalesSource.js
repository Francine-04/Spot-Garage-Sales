import {PaymentBreakdown} from './PaymentMethods';
import LiveSalesTrends from './LiveSalesTrends';
﻿import React,{useState,useContext} from 'react';
import {View,Text,Pressable,ScrollView} from 'react-native';
import {useDatabase,reportDates} from '../state/DatabaseContext';
import {layoutWidthContext} from '../theme/designTokens';
import {liveSales} from '../services/liveSales';
import {money,DataTable,Action} from './DatabaseWidgets';
import ExportControl from './ExportControl';
const panel={backgroundColor:'#FFFEFC',borderWidth:1,borderColor:'#E5DED7',borderRadius:10,padding:16,marginBottom:12};
export function LiveSalesOverview({date='all',title='Sales Performance',selector}){
 const db=useDatabase(),width=useContext(layoutWidthContext)||900,data=liveSales(db.entries,date),[selected,setSelected]=useState(null);
 const columns=width>=1000?4:width>=560?2:1,max=Math.max(1,...data.days.map(d=>d.sales));
 return <><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:16}}><View style={{flex:1,minWidth:200}}><Text style={{fontSize:28,fontWeight:'700',color:'#211915'}}>{title}</Text><Text style={{fontSize:14,color:'#536075',marginTop:6}}>Recorded daily sales · updates automatically after every successful save</Text></View>{selector}<ExportControl type="activity" filters={reportDates(date)}/></View>
 {!!db.manualError&&<Text accessibilityLiveRegion="polite">{db.manualError}</Text>}
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{[['Sales Revenue',money(data.sales)],['Items Sold',data.quantity],['Saved Entries',data.count],['Average per Entry',money(data.average)]].map(([label,value])=><View key={label} style={[panel,{flexBasis:Math.floor((width-12*(columns-1))/columns),flexGrow:1,minWidth:0}]}><Text style={{fontSize:13,color:'#536075'}}>{label}</Text><Text style={{fontSize:24,fontWeight:'700',marginTop:8}}>{value}</Text></View>)}</View>
 <View style={panel}><Text style={{fontSize:18,fontWeight:'600'}}>Daily Sales Performance</Text><Text style={{fontSize:12,color:'#536075',marginTop:6}}>Philippine dates. Saved entries are not POS receipts. Reversals are excluded.</Text>{selected&&<Text accessibilityLiveRegion="polite" style={{marginTop:8}}>{selected.day}: {money(selected.sales)} · {selected.quantity} items</Text>}<ScrollView horizontal contentContainerStyle={{flexGrow:1}}><View style={{flexDirection:'row',flex:1,minWidth:data.days.length*72,height:205,alignItems:'flex-end',paddingTop:20}}>{data.days.map(d=><Pressable key={d.day} accessibilityRole="button" accessibilityLabel={d.day+' sales '+money(d.sales)} onPress={()=>setSelected(d)} style={{flex:1,minWidth:72,alignItems:'center',gap:8}}><View style={{width:34,height:Math.max(4,d.sales/max*135),backgroundColor:'#9B6A4C',borderTopLeftRadius:3,borderTopRightRadius:3}}/><Text style={{fontSize:12,paddingBottom:8}}>{d.day.slice(5)}</Text></Pressable>)}</View></ScrollView>{!data.days.length&&<Text style={{paddingVertical:12}}>No saved sales in this period. Choose All available months to view other dates.</Text>}</View>
 <PaymentBreakdown entries={db.entries.filter(e=>date==='all'||e.day.startsWith(date))}/><View style={panel}><Text style={{fontSize:18,fontWeight:'600',marginBottom:12}}>Daily Breakdown</Text><DataTable columns={['Philippine Date','Saved Entries','Items Sold','Revenue']} rows={data.days.map(d=>[d.day,d.count,d.quantity,money(d.sales)])}/></View></>;
}
export default function SalesSource({children,date,setDate,dateOptions,SelectorComponent:Selector,title}){
 const db=useDatabase(),[override,setOverride]=useState(null),manual=override===null?db.entries.some(e=>e.status==='saved'):override==='manual';
 const LiveView=title==='Sales Trends'?LiveSalesTrends:LiveSalesOverview;
 return <><View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:12}}><Action label={manual?'Daily Sales (selected)':'Daily Sales'} onPress={()=>setOverride('manual')}/><Action label={!manual?'Historical POS (selected)':'Historical POS'} onPress={()=>setOverride('historical')}/></View>{manual?<LiveView date={date} title={title} selector={<Selector label="Sales period" value={date} options={dateOptions} onChange={setDate} compact/>}/>:children}</>;
}
