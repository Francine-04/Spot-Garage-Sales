import {groupDays} from '../services/salesPeriods';
import {summaryLabel,summaryCardAccent,summaryValue} from '../theme/summaryStyles';
import SalesBarChart from './SalesBarChart';
import {PaymentBreakdown} from './PaymentMethods';
import React,{useContext} from 'react';
import {View,Text,ScrollView} from 'react-native';
import {useDatabase,reportDates} from '../state/DatabaseContext';
import {layoutWidthContext} from '../theme/designTokens';
import {liveSales} from '../services/liveSales';
import {money,DataTable} from './DatabaseWidgets';
import ExportControl from './ExportControl';
const panel={backgroundColor:'#FFFEFC',borderWidth:1,borderColor:'#E5DED7',borderRadius:10,padding:16,minWidth:0};
function Chart({title,rows,percent=false}){
 return <View style={[panel,{flex:1}]}><Text style={{fontSize:18,fontWeight:'700'}}>{title}</Text><SalesBarChart rows={rows} series={[{key:'value',label:percent?'Growth (%)':'Sales (PHP)',format:percent?v=>v.toFixed(1)+'%':money}]}/></View>;
}
export default function LiveSalesTrends({date='all',selector,period='Daily'}){
 const db=useDatabase(),width=useContext(layoutWidthContext)||900;
 const entries=db.entries.filter(e=>e.status==='saved'&&(date==='all'||e.day.startsWith(date))),data=liveSales(entries,date);
 const group=key=>{const map=new Map();entries.forEach(e=>{const k=key(e),r=map.get(k)||{label:k,cents:0,count:0};r.cents+=Math.round(e.total*100);r.count++;map.set(k,r);});return [...map.values()].map(r=>({...r,value:r.cents/100}));};
 const months=group(e=>e.day.slice(0,7)).sort((a,b)=>a.label.localeCompare(b.label));
 const hours=group(e=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Manila',hour:'2-digit',hourCycle:'h23'}).format(new Date(e.savedAt))+':00').sort((a,b)=>a.label.localeCompare(b.label));
 const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const days=group(e=>new Date(e.savedAt).toLocaleDateString('en-US',{timeZone:'Asia/Manila',weekday:'long'})).sort((a,b)=>weekdays.indexOf(a.label)-weekdays.indexOf(b.label));
 const growth=months.map((r,i)=>{const prev=months[i-1],index=x=>Number(x.slice(0,4))*12+Number(x.slice(5));return {label:r.label,value:prev&&prev.value&&index(r.label)-index(prev.label)===1?(r.value-prev.value)/prev.value*100:null};});
 const peak=[...hours].sort((a,b)=>b.value-a.value)[0],best=[...days].sort((a,b)=>b.value-a.value)[0];
 const row={flexDirection:width<1050?'column':'row',gap:12};
 return <View style={{gap:12}}>
 {!!db.manualError&&<Text>{db.manualError}</Text>}
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{[['Net Sales',money(data.sales)],['Saved Entries',data.count],['Average per Entry',money(data.average)],['Monthly Growth',growth.at(-1)?.value==null?'Unavailable':growth.at(-1).value.toFixed(1)+'%']].map(([label,value])=><View key={label} style={[panel,summaryCardAccent,{flexBasis:width>=560?'48%':'100%',flexGrow:1,minWidth:0}]}><Text style={summaryLabel}>{label}</Text><Text style={[summaryValue,{fontSize:24,marginTop:10}]}>{value}</Text></View>)}</View>
 <View style={row}><View style={{flex:2,minWidth:0}}><Chart title={`${period} Sales Trend`} rows={groupDays(data.days,period).map(d=>({label:d.day,value:d.sales}))}/></View><View style={[panel,{flex:1}]}><Text style={{fontSize:18,fontWeight:'700',marginBottom:12}}>Sales by Day of the Week</Text><DataTable columns={['Day','Net Sales','Saved Entries']} rows={days.map(d=>[d.label,money(d.value),d.count])}/></View></View>
 <View style={row}><Chart title="Sales by Time of Day" rows={hours}/><Chart title="Monthly Comparison" rows={months}/><Chart title="Sales Growth Rate" rows={growth} percent/></View>
 <PaymentBreakdown entries={entries}/><View style={panel}><Text style={{fontSize:18,fontWeight:'700',marginBottom:12}}>Key Insights</Text><View style={{flexDirection:'row',gap:20,flexWrap:'wrap'}}>{[['Peak Hour',peak?`${peak.label} has the highest recorded sales: ${money(peak.value)}.`:'Hourly activity is not available yet.'],['Strongest Day',best?`${best.label} leads with ${money(best.value)} in recorded sales.`:'Weekday activity is not available yet.'],['Monthly Changes','Growth compares consecutive recorded months. Missing periods are unavailable.']].map(([title,copy])=><View key={title} style={{flex:1,minWidth:200}}><Text style={{fontWeight:'700',color:'#704027'}}>{title}</Text><Text style={{color:'#657080',fontSize:13,lineHeight:20,marginTop:5}}>{copy}</Text></View>)}</View></View></View>;
}
