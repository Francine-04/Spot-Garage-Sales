import {PaymentBreakdown} from '../components/PaymentMethods';
import {useDatabase,reportDates,selectedHistory} from '../state/DatabaseContext';
import {DataTable,money} from '../components/DatabaseWidgets';
import ExportControl from '../components/ExportControl';
import {useResponsiveStyles} from '../hooks/useResponsiveStyles';
import Filter from '../components/ResponsiveSelect';

import React, { useMemo, useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";



const hours=[

  ["6 AM",280,9],["7 AM",230,8],["8 AM",210,7],["9 AM",180,6],["10 AM",250,8],["11 AM",320,11],

  ["12 PM",520,16],["1 PM",740,21],["2 PM",850,22],["3 PM",930,25],["4 PM",1080,27],["5 PM",1020,31],

  ["6 PM",1250,38],["7 PM",1180,35],["8 PM",920,28],["9 PM",610,20],["10 PM",480,14]

].map(([label,sales,transactions])=>({label,sales,transactions}));

const days=[["Monday",1020,28],["Tuesday",980,26],["Wednesday",1420,38],["Thursday",1650,44],["Friday",2450,68],["Saturday",2120,59],["Sunday",1980,52]].map(([label,sales,transactions])=>({label,sales,transactions}));

const categories=["All Categories","Coffee-Based","Milk-Based","Fruit Soda","Burgers","Snacks","Rice Meals"];

const peso=n=>`\u20B1${Math.round(n||0).toLocaleString("en-PH")}`;



function Panel({children,style}) { const styles=useResponsiveStyles(baseStyles); return <View style={[styles.panel,style]}>{children}</View>; }





function TrendChart({title,subtitle,data,selected,onSelect}) { const styles=useResponsiveStyles(baseStyles); const maxSales=Math.max(...data.map(x=>x.sales)),maxTransactions=Math.max(...data.map(x=>x.transactions));

  return <Panel style={styles.chartPanel}><View style={styles.panelHeader}><View style={{flex:1,minWidth:0,maxWidth:"100%"}}><Text style={styles.panelTitle}>{title}</Text><Text style={styles.panelSubtitle}>{subtitle}</Text></View><View style={styles.legend}><View style={[styles.legendDot,{backgroundColor:"#6C351B"}]}/><Text style={styles.legendText}>Net Sales (₱)</Text><View style={[styles.legendDot,{backgroundColor:"#DFC2A7"}]}/><Text style={styles.legendText}>Entries</Text></View></View><Text accessibilityLiveRegion="polite" style={{fontSize:12,color:"#526075",paddingVertical:6}}>{data.find(x=>x.label===selected)?selected+": "+peso(data.find(x=>x.label===selected).sales)+" sales, "+data.find(x=>x.label===selected).transactions+" transactions":"Tap a period for values"}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}><View style={[styles.chart,{minWidth:data.length>10?760:520}]}>{data.map(x=><Pressable accessibilityRole="button" accessibilityLabel={x.label+": sales "+peso(x.sales)+", "+x.transactions+" transactions"} key={x.label} onPress={()=>onSelect(x.label)} style={styles.chartCol}><View style={styles.plot}><View style={[styles.chartBar,{height:Math.max(8,x.sales/maxSales*150),backgroundColor:selected===x.label?"#B78561":"#DFC4AB"}]}/><View style={[styles.chartDot,{bottom:Math.max(4,x.transactions/maxTransactions*140)}]}/></View><Text style={[styles.axis,selected===x.label&&styles.axisSelected]}>{x.label.replace("day","")}</Text></Pressable>)}</View></ScrollView></Panel>;

}



function Ranking({title,rows,type,peak=true}) { const styles=useResponsiveStyles(baseStyles); return <Panel style={styles.rankPanel}><View style={styles.rankTitleRow}><View style={styles.rankTitleLeft}><View style={styles.rankIcon}><MaterialCommunityIcons name={type==="hour"?"clock-outline":"calendar-month-outline"} size={20} color="#67351E"/></View><Text style={styles.rankTitle}>{title}</Text></View><Pressable><Text style={styles.viewAll}>View All →</Text></Pressable></View><View style={[styles.rankRow,styles.rankHead]}><Text style={styles.rankNo}>Rank</Text><Text style={styles.rankName}>{type==="hour"?"Time":"Day"}</Text><Text style={styles.rankSales}>Total Sales (₱)</Text><Text style={styles.rankTransactions}>Entries</Text></View>{rows.map((x,i)=><View key={x.label} style={styles.rankRow}><View style={styles.rankNo}><Text style={[styles.rankCircle,{backgroundColor:i===0?(peak?"#6C361E":"#A77759"):"#E8D6C7",color:i===0?"#FFF":"#60412F"}]}>{i+1}</Text></View><Text style={styles.rankName}>{x.label}</Text><Text style={styles.rankSales}>{peso(x.sales)}</Text><Text style={styles.rankTransactions}>{x.transactions}</Text></View>)}</Panel>;

}



export default function PeakOffPeakScreen({navigate,width,date,setDate,dateOptions,SelectorComponent:Selector}) { const styles=useResponsiveStyles(baseStyles); const [dayFilter,setDayFilter]=useState("All Days"),[category,setCategory]=useState("All Categories"),[selectedHour,setSelectedHour]=useState("6 PM"),[selectedDay,setSelectedDay]=useState("Friday");

  const compact=width<900;

  const db=useDatabase();
  const historical=selectedHistory(db.historical,date);
  const monthlyAverage=historical.rows.length?historical.rows.reduce((sum,row)=>sum+row.sales,0)/historical.rows.length:0;
  const range=reportDates(date),entries=db.entries.filter(e=>e.status==='saved'&&(!range.from||e.day>=range.from)&&(!range.to||e.day<=range.to)&&(category==='All Categories'||e.category===category)&&(dayFilter==='All Days'||new Date(e.savedAt).toLocaleDateString('en-US',{timeZone:'Asia/Manila',weekday:'long'})===dayFilter));
  const groupEntries=key=>{const groups={};entries.forEach(e=>{const label=key(e);const r=groups[label]||(groups[label]={label,sales:0,transactions:0});r.sales+=e.total;r.transactions++;});return Object.values(groups);};
  const hourly=groupEntries(e=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Manila',hour:'2-digit',hourCycle:'h23'}).format(new Date(e.savedAt))+':00').sort((a,b)=>a.label.localeCompare(b.label));
  const daily=groupEntries(e=>new Date(e.savedAt).toLocaleDateString('en-US',{timeZone:'Asia/Manila',weekday:'long'}));
  const peakHour=[...hourly].sort((a,b)=>b.sales-a.sales)[0]||{label:"Unavailable",sales:0},slowHour=[...hourly].sort((a,b)=>a.sales-b.sales)[0]||{label:"Unavailable",sales:0},peakDay=[...daily].sort((a,b)=>b.sales-a.sales)[0]||{label:"Unavailable",sales:0},slowDay=[...daily].sort((a,b)=>a.sales-b.sales)[0]||{label:"Unavailable",sales:0};

  const topHours=[...hourly].sort((a,b)=>b.sales-a.sales).slice(0,5),offHours=[...hourly].sort((a,b)=>a.sales-b.sales).slice(0,5),topDays=[...daily].sort((a,b)=>b.sales-a.sales).slice(0,5),offDays=[...daily].sort((a,b)=>a.sales-b.sales).slice(0,5);

  return <><View style={[styles.head,compact&&styles.headStack]}><View style={{maxWidth:"100%",flexShrink:1}}><View style={styles.titleRow}><Text style={styles.title}>Peak & Off-Peak</Text><Text style={styles.demoBadge}>DAILY SALES</Text></View><Text style={styles.subtitle}>Identify your busiest and slowest periods to plan inventory, staffing, and promotions.</Text></View><View style={styles.filters}><Selector label="Available period" value={date} options={dateOptions} onChange={setDate} compact/><Filter value={dayFilter} options={["All Days",...days.map(x=>x.label)]} onChange={setDayFilter} width={155}/><Filter value={category} options={["All Categories",...new Set(db.products.map(p=>p.category))]} onChange={setCategory} width={190}/></View></View>

  <Panel>
    <View style={styles.panelHeader}><Text style={styles.panelTitle}>Historical Monthly Performance</Text><ExportControl type="peak" filters={reportDates(date)}/></View>
    {!!db.error&&<Text style={styles.subtitle}>{db.error}</Text>}
    <DataTable columns={['Month','Receipts','Net Sales','Average Sale','Period']} rows={historical.rows.map(row=>[
      `${row.month} ${row.sales_year}`,row.receipts.toLocaleString('en-PH'),money(row.sales),money(row.average),
      row.sales>=monthlyAverage*1.05?'Peak':row.sales<=monthlyAverage*0.9?'Off-peak':'Normal'
    ])} empty={db.loading?'Loading monthly sales...':'No monthly sales available for this period.'}/>
  </Panel>

  {!!db.manualError&&<Text style={styles.subtitle}>{db.manualError}</Text>}<ExportControl type="activity" filters={{...reportDates(date),category:category==='All Categories'?undefined:category}}/>
  <View style={styles.kpis}>{[["Busiest Hour",peakHour.label,`Total Sales: ${peso(peakHour.sales)}`,"chart-bar"],["Slowest Hour",slowHour.label,`Total Sales: ${peso(slowHour.sales)}`,"clock-outline"],["Busiest Day",peakDay.label,`Total Sales: ${peso(peakDay.sales)}`,"calendar-month-outline"],["Slowest Day",slowDay.label,`Total Sales: ${peso(slowDay.sales)}`,"calendar-month-outline"]].map(([label,value,detail,icon])=><Panel key={label} style={styles.kpi}><View style={styles.kpiIcon}><MaterialCommunityIcons name={icon} size={28} color="#66351F"/></View><View style={{flex:1,minWidth:0}}><Text style={styles.kpiLabel}>{label}</Text><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiDetail}>{detail}</Text></View></Panel>)}</View>

  <View style={[styles.charts,compact&&styles.stack]}><TrendChart title="Sales by Hour of the Day" subtitle="Manual sales totals and saved entries by Philippine hour." data={hourly} selected={selectedHour} onSelect={setSelectedHour}/><TrendChart title="Sales by Day of the Week" subtitle="Manual sales totals and saved entries by weekday." data={daily} selected={selectedDay} onSelect={setSelectedDay}/></View>

  <View style={styles.rankings}><Ranking title="Top 5 Peak Hours" rows={topHours} type="hour"/><Ranking title="Top 5 Off-Peak Hours" rows={offHours} type="hour" peak={false}/><Ranking title="Top 5 Peak Days" rows={topDays} type="day"/><Ranking title="Top 5 Off-Peak Days" rows={offDays} type="day" peak={false}/></View>

  <PaymentBreakdown compactGrid entries={entries}/><Panel style={styles.insights}><View style={styles.insightLead}><View style={styles.insightMainIcon}><MaterialCommunityIcons name="lightbulb-outline" size={29} color="#67351E"/></View><Text style={styles.insightsTitle}>Key Insights</Text></View><View style={styles.insight}><MaterialCommunityIcons name="arrow-top-right" size={38} color="#714022"/><View style={{flex:1,minWidth:0}}><Text style={styles.insightTitle}>Peak Period</Text><Text style={styles.insightText}>{entries.length?`Highest recorded hour: ${peakHour.label}. Highest recorded weekday: ${peakDay.label}.`:"Hourly and daily activity is unavailable until manual sales are recorded."}</Text></View></View><View style={styles.insight}><MaterialCommunityIcons name="arrow-bottom-right" size={38} color="#CB452F"/><View style={{flex:1,minWidth:0}}><Text style={styles.insightTitle}>Off-Peak Period</Text><Text style={styles.insightText}>Only hours and weekdays with saved entries are ranked. Missing records are not assumed to mean zero sales.</Text></View></View><View style={styles.insight}><MaterialCommunityIcons name="calendar-month-outline" size={35} color="#67351E"/><View style={{flex:1,minWidth:0}}><Text style={styles.insightTitle}>Recommendation</Text><Text style={styles.insightText}>These totals describe recorded manual activity, not historical POS hourly sales or receipt counts.</Text></View></View></Panel></>;

}



const baseStyles=StyleSheet.create({

  head:{position:"relative",zIndex:100,flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",gap:20,marginBottom:16},headStack:{flexDirection:"column",alignItems:"stretch"},breadcrumb:{flexDirection:"row",alignItems:"center",gap:5,marginBottom:8},muted:{fontSize:11,color:"#637082"},breadcrumbCurrent:{fontSize:11,fontWeight:"700",color:"#211713"},titleRow:{flexDirection:"row",alignItems:"center",gap:10,flexWrap:"wrap"},title:{fontSize:30,fontWeight:"900",color:"#181310"},demoBadge:{fontSize:8,fontWeight:"900",letterSpacing:1,color:"#65402D",backgroundColor:"#F0E0D1",paddingHorizontal:9,paddingVertical:5,borderRadius:10},subtitle:{fontSize:13,color:"#657286",marginTop:3},filters:{position:"relative",zIndex:120,flexDirection:"row",alignItems:"center",gap:14,flexWrap:"wrap"},filterWrap:{maxWidth:"100%",position:"relative",zIndex:130},filter:{height:44,borderWidth:1,borderColor:"#E1DAD3",borderRadius:8,backgroundColor:"#FFF",flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:13},filterText:{fontSize:10,flex:1},filterMenu:{position:"absolute",top:47,elevation:20,left:0,right:0,maxHeight:260,borderWidth:1,borderColor:"#DDD4CC",borderRadius:7,backgroundColor:"#FFF",zIndex:999,shadowColor:"#000",shadowOpacity:.14,shadowRadius:8},filterOption:{minHeight:35,justifyContent:"center",paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:"#EFE9E3"},filterOptionText:{fontSize:9},panel:{maxWidth:"100%",borderWidth:1,borderColor:"#E5DED7",borderRadius:10,backgroundColor:"#FFF",padding:15,marginBottom:10},kpis:{position:"relative",zIndex:1,flexDirection:"row",flexWrap:"wrap",gap:12},kpi:{flex:1,minWidth:225,minHeight:108,flexDirection:"row",alignItems:"center",gap:16},kpiIcon:{width:56,height:56,borderRadius:28,backgroundColor:"#F1DDCA",alignItems:"center",justifyContent:"center"},kpiLabel:{fontSize:10,color:"#1E1815"},kpiValue:{fontSize:22,fontWeight:"900",marginTop:5},kpiDetail:{fontSize:11,color:"#657084",marginTop:5},charts:{width:"100%",flexDirection:"row",gap:12},stack:{flexDirection:"column",alignItems:"stretch"},chartPanel:{flex:1,minWidth:0},panelHeader:{flexWrap:"wrap",flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",gap:10},panelTitle:{fontSize:15,fontWeight:"900",color:"#1B1512"},panelSubtitle:{fontSize:9,color:"#697588",marginTop:3},legend:{flexDirection:"row",alignItems:"center",gap:6},legendDot:{width:9,height:9,borderRadius:5,marginLeft:8},legendText:{fontSize:9,color:"#526075"},chartScroll:{flexGrow:1},chart:{height:215,flex:1,flexDirection:"row",alignItems:"flex-end",paddingTop:25},chartCol:{flex:1,minWidth:42,height:190,alignItems:"center",justifyContent:"flex-end"},plot:{height:158,width:"75%",maxWidth:48,alignItems:"center",justifyContent:"flex-end",borderBottomWidth:1,borderBottomColor:"#E5DED7"},chartBar:{width:"68%",maxWidth:31,borderTopLeftRadius:2,borderTopRightRadius:2},chartDot:{position:"absolute",width:8,height:8,borderRadius:4,backgroundColor:"#6A341B"},axis:{fontSize:8,color:"#667286",marginTop:6},axisSelected:{fontWeight:"900",color:"#5B2C18"},rankings:{width:"100%",flexDirection:"row",flexWrap:"wrap",gap:10},rankPanel:{flex:1,minWidth:250,padding:0,overflow:"hidden"},rankTitleRow:{height:45,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:10},rankTitleLeft:{flexDirection:"row",alignItems:"center",gap:9},rankIcon:{width:32,height:32,borderRadius:16,backgroundColor:"#F0DDCB",alignItems:"center",justifyContent:"center"},rankTitle:{fontSize:11,fontWeight:"900"},viewAll:{fontSize:8,color:"#67351E"},rankRow:{height:29,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#EEE8E2",paddingHorizontal:9},rankHead:{backgroundColor:"#F6F2EE"},rankNo:{width:44,fontSize:8,color:"#303A48"},rankCircle:{width:18,height:18,borderRadius:9,textAlign:"center",lineHeight:18,fontSize:8},rankName:{flex:1,fontSize:9,color:"#536075"},rankSales:{width:90,fontSize:9,textAlign:"center",color:"#536075"},rankTransactions:{width:72,fontSize:9,textAlign:"center",color:"#536075"},insights:{flexWrap:"wrap",width:"100%",minHeight:120,flexDirection:"row",alignItems:"center",gap:22},insightLead:{minWidth:190,flexDirection:"row",alignItems:"center",gap:14},insightMainIcon:{width:58,height:58,borderRadius:29,backgroundColor:"#F1DDCA",alignItems:"center",justifyContent:"center"},insightsTitle:{fontSize:15,fontWeight:"900"},insight:{flex:1,minWidth:220,flexDirection:"row",alignItems:"center",gap:13,borderLeftWidth:1,borderLeftColor:"#E5DCD4",paddingLeft:22},insightTitle:{fontSize:10,fontWeight:"800",color:"#55301F"},insightText:{fontSize:9,lineHeight:14,color:"#647083",maxWidth:250,marginTop:4}

});

