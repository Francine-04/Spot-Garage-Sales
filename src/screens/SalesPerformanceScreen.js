import {useContext} from 'react';
import SalesPeriodContext from '../components/SalesPeriodContext';
import {groupHistory} from '../services/salesPeriods';
import SalesBarChart from '../components/SalesBarChart';
import SalesSource from '../components/SalesSource';
import {useDatabase,selectedHistory,reportDates} from '../state/DatabaseContext';
import ExportControl from '../components/ExportControl';
import React, { useState } from "react";

import { Image, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";



const DEMO_MONTHLY = [

  { month: "January", receipts: 124, sales: 22510, average: 182, change: null },

  { month: "February", receipts: 98, sales: 18240, average: 186, change: -18.9 },

  { month: "March", receipts: 132, sales: 26300, average: 199, change: 44.2 },

  { month: "April", receipts: 165, sales: 32450, average: 197, change: 23.4 },

  { month: "May", receipts: 210, sales: 41320, average: 197, change: 27.3 },

  { month: "June", receipts: 245, sales: 46780, average: 191, change: 13.2 },

  { month: "July", receipts: 286, sales: 48250, average: 169, change: 3.1 },

  { month: "August", receipts: 268, sales: 42180, average: 157, change: -12.6 },

  { month: "September", receipts: 240, sales: 38540, average: 161, change: -8.6 },

  { month: "October", receipts: 320, sales: 68520, average: 214, change: 77.8 },

  { month: "November", receipts: 348, sales: 76215, average: 219, change: 11.2 },

  { month: "December", receipts: 402, sales: 82430, average: 205, change: 8.2 }

];

const DEMO_SUMMARY = { netSales: 258430, receipts: 1243, average: 208, growth: 12.5 };



function MiniChart({data,type='bars'}){return <SalesBarChart height={100} rows={data.map(x=>({key:x.period,label:x.period,value:type==='average'?(x.receipts?x.sales/x.receipts:null):type==='change'?x.change:x.receipts}))} series={[{key:'value',label:type==='change'?'Change (%)':type==='average'?'Average (PHP)':'Receipts',format:type==='change'?v=>v.toFixed(1)+'%':undefined}]}/>;}

function HistoricalScreen({monthly,receipts,netSales,average,date,setDate,dateOptions,navigate,width,styles:s,colors:C,CardComponent:Card,SelectorComponent:Selector,formatMoney:money}) {

  const [selected,setSelected]=useState(null),compact=width<850;

  const availableWidth=Math.max(320,width-(compact?32:52));

  const [plotWidth,setPlotWidth]=useState(0);
  const [kpiWidth,setKpiWidth]=useState(0);
  const performanceChartWidth=plotWidth||(compact?availableWidth-34:((availableWidth-10)*2/3)-34);

  

  const db=useDatabase();
  const period=useContext(SalesPeriodContext);
  const rows=groupHistory(selectedHistory(db.historical,date).rows,period);
  const summary={netSales:rows.reduce((a,r)=>a+r.sales,0),receipts:rows.reduce((a,r)=>a+r.receipts,0)};
  summary.average=summary.receipts?summary.netSales/summary.receipts:0;

  const monthColumnWidth=Math.max(48,performanceChartWidth/Math.max(1,rows.length));
  const maxSales=Math.max(...rows.map(x=>x.sales),1),maxReceipts=Math.max(...rows.map(x=>x.receipts),1);

  const high=rows.length?rows.reduce((a,b)=>b.sales>a.sales?b:a):null,low=rows.length?rows.reduce((a,b)=>b.sales<a.sales?b:a):null,most=rows.length?rows.reduce((a,b)=>b.receipts>a.receipts?b:a):null;

  const exportData=()=>{if(Platform.OS!=="web")return;const csv=["Month,Receipts,Net Sales,Average Sale,Change",...rows.map(x=>`${x.month},${x.receipts},${x.sales},${x.average.toFixed(2)},${x.change?.toFixed(1)||""}`)].join("\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="spot-garage-sales-performance.csv";a.click();URL.revokeObjectURL(a.href)};

  const kpis=[["Net Sales",money(summary.netSales),"cash-multiple",null],["Total Receipts",summary.receipts.toLocaleString(),"receipt-text-outline",null],["Recalculated Average",summary.receipts?money(summary.average):"Unavailable","cart-outline",null],[period==='Yearly'?"Latest YoY":"Latest MoM",rows.at(-1)?.change==null?"Unavailable":rows.at(-1).change.toFixed(1)+"%","percent-outline",null]];

  return <>
  <View onLayout={e=>setKpiWidth(e.nativeEvent.layout.width)} style={[s.performanceKpis,{gap:12,marginBottom:12}]}>{kpis.map(([label,value,icon,delta])=><Card key={label} style={[s.performanceKpi,{flexGrow:1,flexShrink:0,flexBasis:width>=560?'48%':'100%',minWidth:0,marginBottom:0}]}><View style={s.performanceKpiIcon}><MaterialCommunityIcons name={icon} size={29} color={C.brown}/></View><View style={{flex:1}}><Text style={s.performanceKpiLabel}>{label}</Text><Text style={s.performanceKpiValue}>{value}</Text>{delta!=null&&<Text style={[s.performanceDelta,{color:delta<0?C.red:"#149151"}]}>{delta>=0?"↑":"↓"} {Math.abs(delta).toFixed(1)}% <Text style={s.performanceCompare}> vs. previous period</Text></Text>}</View></Card>)}</View>

  <View style={[s.performanceMain,compact&&{flexDirection:"column"}]}><Card style={s.performanceChartCard}><Text style={s.performancePanelTitle}>{period} Sales Performance</Text><SalesBarChart rows={rows.map(r=>({...r,key:r.period,label:r.period}))} selectedKey={selected?.period} onSelect={setSelected} series={[{key:'sales',label:'Net Sales (PHP)',format:money},{key:'receipts',label:'Receipts'}]}/></Card>

  <Card style={s.breakdownCard}><Text style={s.performancePanelTitle}>{period} Breakdown</Text><ScrollView style={s.breakdownScroll} nestedScrollEnabled showsVerticalScrollIndicator><ScrollView horizontal contentContainerStyle={{flexGrow:1}} showsHorizontalScrollIndicator={false}><View style={s.table}><View style={[s.tableRow,s.tableHead]}>{["Month","Receipts","Net Sales","POS / Calc. Avg.","% Change"].map(x=><Text key={x} style={s.tableHeadText}>{x}</Text>)}</View>{rows.map(x=><Pressable key={x.month} style={s.tableRow} onPress={()=>setSelected(x)}><Text style={s.tableCell}>{x.month}</Text><Text style={s.tableCell}>{x.receipts.toLocaleString()}</Text><Text style={s.tableCell}>{money(x.sales)}</Text><Text style={s.tableCell}>{x.posAverage==null?"?":money(x.posAverage)} / {x.average==null?"?":money(x.average)}</Text><Text style={[s.tableCell,{color:x.change==null?C.muted:x.change<0?"#D54A4A":"#149151"}]}>{x.change==null?"—":`${x.change>0?"+":""}${x.change.toFixed(1)}%`}</Text></Pressable>)}</View></ScrollView></ScrollView></Card></View>

  <View style={s.smallCharts}>{[["Total Receipts","receipts"],["Average Sale","average"],["Percentage Change","change"]].map(([title,type])=><Card key={title} style={s.smallChartCard}><Text style={s.smallChartTitle}>{title}</Text><MiniChart data={rows} type={type} s={s} C={C}/></Card>)}</View>

  <View style={[s.performanceBottom,compact&&{flexDirection:"column"}]}><Card style={s.highlightsCard}><Text style={s.performancePanelTitle}>{period} Highlights</Text><View style={s.highlightRow}>{[["Highest Sales",high,money(high?.sales),"trending-up","#DDF2DE"],["Lowest Sales",low,money(low?.sales),"trending-down","#FBE3E1"],["Most Receipts",most,most?.receipts?.toLocaleString(),"receipt-text-outline","#F1E6DA"]].map(([label,row,value,icon,bg])=><View key={label} style={[s.highlightItem,{backgroundColor:bg}]}><MaterialCommunityIcons name={icon} size={23} color={C.brown}/><View><Text style={s.highlightLabel}>{label}</Text><Text style={s.highlightValue}>{value||"—"}</Text><Text style={s.highlightMonth}>{row?row.month+" "+row.sales_year:"Unavailable"}</Text></View></View>)}</View></Card><Card style={s.takeawayCard}><Image source={require("../../assets/images/cafe-motorcycle.png")} accessibilityLabel="Spot Garage cafe and motorcycle illustration" resizeMode="contain" style={s.takeawayArt}/><View style={s.takeawayIcon}><MaterialCommunityIcons name="lightbulb-outline" size={28} color={C.brown}/></View><View style={s.takeawayCopy}><Text style={s.takeawayTitle}>Key Takeaway</Text><Text style={s.takeawayText}>Sales increased by 12.5% compared to the previous period, with December as the highest-performing month. Consider preparing more inventory and staffing for peak months (Oct – Dec).</Text></View></Card></View></>;

}




export default function SalesPerformanceScreen(props){return <SalesSource {...props} title="Sales Performance"><HistoricalScreen {...props}/></SalesSource>;}
