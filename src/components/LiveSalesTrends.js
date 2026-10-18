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
 const max=Math.max(1,...rows.map(r=>Math.abs(r.value||0)));
 return <View style={[panel,{flex:1}]}><Text style={{fontSize:18,fontWeight:'700',marginBottom:12}}>{title}</Text>{rows.length?<ScrollView horizontal contentContainerStyle={{flexGrow:1}}><View style={{flex:1,minWidth:rows.length*70,flexDirection:'row',height:220,alignItems:'flex-end'}}>{rows.map(r=><View key={r.label} style={{flex:1,minWidth:70,alignItems:'center',gap:6}}><Text style={{fontSize:11,color:'#536075'}}>{r.value==null?'—':percent?r.value.toFixed(1)+'%':money(r.value)}</Text><View style={{height:150,width:'100%',justifyContent:'flex-end',alignItems:'center',borderBottomWidth:1,borderColor:'#DDD4CB'}}><View style={{width:26,height:r.value==null?0:Math.max(2,Math.abs(r.value)/max*140),backgroundColor:r.value<0?'#CE6666':'#A87957',borderRadius:3}}/></View><Text style={{fontSize:11,marginBottom:6}}>{r.label}</Text></View>)}</View></ScrollView>:<Text style={{paddingVertical:30,color:'#657080'}}>No saved sales in this period.</Text>}</View>;
}
export default function LiveSalesTrends({date='all',selector}){
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
 return <View style={{gap:12}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}><View><Text style={{fontSize:28,fontWeight:'700'}}>Sales Trends</Text><Text style={{fontSize:14,color:'#657080',marginTop:5}}>Analyze sales patterns over time to identify opportunities and plan ahead.</Text></View>{selector}<ExportControl type="activity" filters={reportDates(date)}/></View>
 {!!db.manualError&&<Text>{db.manualError}</Text>}
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{[['Net Sales',money(data.sales)],['Saved Entries',data.count],['Average per Entry',money(data.average)],['Monthly Growth',growth.at(-1)?.value==null?'Unavailable':growth.at(-1).value.toFixed(1)+'%']].map(([label,value])=><View key={label} style={[panel,{flex:1,minWidth:180}]}><Text style={{color:'#657080',fontSize:13}}>{label}</Text><Text style={{fontSize:24,fontWeight:'700',marginTop:10}}>{value}</Text></View>)}</View>
 <View style={row}><View style={{flex:2,minWidth:0}}><Chart title="Sales Trend" rows={data.days.map(d=>({label:d.day.slice(5),value:d.sales}))}/></View><View style={[panel,{flex:1}]}><Text style={{fontSize:18,fontWeight:'700',marginBottom:12}}>Sales by Day of the Week</Text><DataTable columns={['Day','Net Sales','Saved Entries']} rows={days.map(d=>[d.label,money(d.value),d.count])}/></View></View>
 <View style={row}><Chart title="Sales by Time of Day" rows={hours}/><Chart title="Monthly Comparison" rows={months}/><Chart title="Sales Growth Rate" rows={growth} percent/></View>
 <PaymentBreakdown entries={entries}/><View style={panel}><Text style={{fontSize:18,fontWeight:'700',marginBottom:12}}>Key Insights</Text><View style={{flexDirection:'row',gap:20,flexWrap:'wrap'}}>{[['Peak Hour',peak?`${peak.label} has the highest recorded sales: ${money(peak.value)}.`:'Hourly activity is not available yet.'],['Strongest Day',best?`${best.label} leads with ${money(best.value)} in recorded sales.`:'Weekday activity is not available yet.'],['Monthly Changes','Growth compares consecutive recorded months. Missing periods are unavailable.']].map(([title,copy])=><View key={title} style={{flex:1,minWidth:200}}><Text style={{fontWeight:'700',color:'#704027'}}>{title}</Text><Text style={{color:'#657080',fontSize:13,lineHeight:20,marginTop:5}}>{copy}</Text></View>)}</View></View></View>;
}
