import SalesPeriodContext from './SalesPeriodContext';
import ResponsiveSelect from './ResponsiveSelect';
import {groupDays} from '../services/salesPeriods';
import {summaryLabel,summaryCardAccent,summaryValue} from '../theme/summaryStyles';
import SalesBarChart from './SalesBarChart';
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
export function LiveSalesOverview({date='all',title='Sales Performance',selector,period='Daily'}){
 const db=useDatabase(),width=useContext(layoutWidthContext)||900,data=liveSales(db.entries,date),[selected,setSelected]=useState(null);
 const periodDays=groupDays(data.days,period);
 const columns=width>=560?2:1,max=Math.max(1,...data.days.map(d=>d.sales));
 return <>
 {!!db.manualError&&<Text accessibilityLiveRegion="polite">{db.manualError}</Text>}
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,marginBottom:16}}>{[['Sales Revenue',money(data.sales)],['Items Sold',data.quantity],['Saved Entries',data.count],['Average per Entry',money(data.average)]].map(([label,value])=><View key={label} style={[panel,summaryCardAccent,{marginBottom:0,flexBasis:columns===2?'48%':'100%',flexGrow:1,minWidth:0}]}><Text style={summaryLabel}>{label}</Text><Text style={[summaryValue,{fontSize:24,marginTop:10}]}>{value}</Text></View>)}</View>
 <View style={panel}><Text style={{fontSize:18,fontWeight:'600'}}>{period} Sales Performance</Text><Text style={{fontSize:12,color:'#536075',marginTop:6}}>Philippine dates. Saved entries are not POS receipts. Reversals are excluded.</Text><SalesBarChart rows={periodDays.map(d=>({...d,label:d.day}))} series={[{key:'sales',label:'Sales (PHP)',format:money}]}/></View>
 <PaymentBreakdown entries={db.entries.filter(e=>date==='all'||e.day.startsWith(date))}/><View style={panel}><Text style={{fontSize:18,fontWeight:'600',marginBottom:12}}>{period} Breakdown</Text><DataTable columns={[period==='Daily'?'Philippine Date':period==='Monthly'?'Month':'Year','Saved Entries','Items Sold','Revenue']} rows={periodDays.map(d=>[d.day,d.count,d.quantity,money(d.sales)])}/></View></>;
}
export default function SalesSource({children,date,setDate,dateOptions,SelectorComponent:Selector,title}){
 const db=useDatabase(),[period,setPeriod]=useState('Monthly'),[source,setSource]=useState(null);
 const manual=period==='Daily'||(source?source==='Saved Sales':db.entries.some(e=>e.status==='saved'));
 const LiveView=title==='Sales Trends'?LiveSalesTrends:LiveSalesOverview;
 return <SalesPeriodContext.Provider value={period}><View style={{gap:12,marginBottom:16}}><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:12}}><View style={{flexGrow:1,minWidth:220}}><Text style={{fontSize:26,fontWeight:'700',color:'#302219'}}>{title}</Text><Text style={{fontSize:13,color:'#75685E',marginTop:4}}>{manual?'Recorded sales':'Historical POS'} / {period.toLowerCase()} overview</Text></View><View style={{flexDirection:'row',alignItems:'flex-start',flexWrap:'wrap',gap:8}}><View style={{width:240,maxWidth:'100%'}}><Selector label="Date range" value={date} options={dateOptions} onChange={setDate} compact/></View><ExportControl type={manual?'activity':title==='Sales Trends'?'trends':'performance'} filters={reportDates(date)}/></View></View><View style={{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap',paddingBottom:12,borderBottomWidth:1,borderColor:'#E3D7CC'}}>{['Daily','Monthly','Yearly'].map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:period===value}} onPress={()=>setPeriod(value)} style={{minHeight:44,paddingHorizontal:14,justifyContent:'center',borderRadius:7,borderWidth:1,borderColor:'#DCC6B2',backgroundColor:period===value?'#704027':'#FFF9F2'}}><Text style={{fontSize:13,fontWeight:'600',color:period===value?'#FFF':'#704027'}}>{value} Sales</Text></Pressable>)}{period!=='Daily'&&<ResponsiveSelect label="Sales data source" value={manual?'Saved Sales':'Historical POS'} options={['Saved Sales','Historical POS']} onChange={setSource} width={170}/>}</View></View>{manual?<LiveView period={period} date={date} title={title}/>:children}</SalesPeriodContext.Provider>;
}
