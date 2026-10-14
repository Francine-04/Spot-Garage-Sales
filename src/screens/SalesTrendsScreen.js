import SalesSource from '../components/SalesSource';
import {useDatabase,selectedHistory,reportDates} from '../state/DatabaseContext';
import ExportControl from '../components/ExportControl';
import {useResponsiveStyles} from '../hooks/useResponsiveStyles';
import React, { useState } from "react";

import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";



const monthly = [

  ["January",22510,124,-12],["February",18240,98,-9],["March",26300,132,18],

  ["April",32450,165,44],["May",41320,210,19],["June",46780,245,5],

  ["July",48250,286,-23],["August",42180,268,-8],["September",38540,240,8],

  ["October",68520,320,22],["November",76215,348,-5],["December",82430,402,-28]

].map(([month,sales,transactions,growth])=>({month,sales,transactions,growth}));



const weekdays = [

  ["Monday",32450,152],["Tuesday",34210,168],["Wednesday",38760,182],

  ["Thursday",42150,201],["Friday",56320,268],["Saturday",48620,245],["Sunday",46180,227]

].map(([day,sales,transactions])=>({day,sales,transactions}));



const times = [["6 AM",1200],["9 AM",6200],["12 PM",15100],["3 PM",12100],["6 PM",35600],["9 PM",16400]];

const previousYear = [18000,22000,25000,31000,33000,35000,38000,40000,42000,45000,50000,54000];

const peso = value => `\u20B1${Math.round(value).toLocaleString("en-PH")}`;



function Panel({children,style}) { const styles=useResponsiveStyles(baseStyles); return <View style={[styles.panel,style]}>{children}</View>; }



function KpiCard({label,value,change,icon}) { const styles=useResponsiveStyles(baseStyles); return <Panel style={styles.kpiCard}><View style={styles.kpiIcon}><MaterialCommunityIcons name={icon} size={29} color="#5B2B18"/></View><View style={styles.kpiCopy}><Text style={styles.kpiLabel}>{label}</Text><Text style={styles.kpiValue}>{value}</Text></View></Panel>;

}



function MonthlyTrend({chartWidth,monthly}) { const styles=useResponsiveStyles(baseStyles); const [selected,setSelected]=useState(6);

  const maxSales=Math.max(...monthly.map(x=>x.sales)),maxTransactions=Math.max(...monthly.map(x=>x.transactions));

  const [plotWidth,setPlotWidth]=useState(0);
  const columnWidth=Math.max(48,(plotWidth||chartWidth)/Math.max(1,monthly.length));

  return <Panel style={styles.trendPanel}><View style={styles.panelHeader}><View style={{flex:1,minWidth:0,maxWidth:"100%"}}><Text style={styles.panelTitle}>Sales Trend</Text><Text style={styles.panelSubtitle}>Monthly net sales and transactions for the selected period.</Text></View><View style={styles.legend}><View style={[styles.dot,{backgroundColor:"#E1BE9E"}]}/><Text style={styles.legendText}>Net Sales (₱)</Text><View style={[styles.dot,{backgroundColor:"#662A12"}]}/><Text style={styles.legendText}>Transactions</Text><View style={styles.periodButton}><Text style={styles.periodText}>Monthly</Text><MaterialCommunityIcons name="chevron-down" size={17}/></View></View></View><ScrollView horizontal showsHorizontalScrollIndicator={false} onLayout={event=>setPlotWidth(event.nativeEvent.layout.width)} contentContainerStyle={styles.chartScroller}><View style={[styles.mainChart,{width:Math.max(576,plotWidth||chartWidth)}]}>{monthly.map((item,index)=><Pressable accessibilityRole="button" key={item.month} onPress={()=>setSelected(index)} style={[styles.monthCol,{width:columnWidth}]}>{selected===index&&<View style={styles.tooltip}><Text style={styles.tooltipMonth}>{item.month.slice(0,3)} {item.sales_year}</Text><Text style={styles.tooltipLine}>● Net Sales     {peso(item.sales)}</Text><Text style={[styles.tooltipLine,{color:"#A77B5D"}]}>● Transactions   {item.transactions}</Text></View>}<View style={styles.mainPlot}><View style={[styles.salesBar,{height:Math.max(10,item.sales/maxSales*155)}]}/><View style={[styles.lineDot,{bottom:Math.max(6,item.transactions/maxTransactions*140)}]}/></View><Text style={styles.axisLabel}>{item.month.slice(0,3)}</Text></Pressable>)}</View></ScrollView></Panel>;

}



function WeekdayTable() { const styles=useResponsiveStyles(baseStyles); const max=Math.max(...weekdays.map(x=>x.sales));

  return <Panel style={styles.weekPanel}><Text style={styles.panelTitle}>Sales by Day of the Week</Text><View style={[styles.dayRow,styles.dayHeader]}><Text style={styles.dayName}>Day</Text><Text style={styles.daySales}>Net Sales (₱)</Text><Text style={styles.dayTransactions}>Transactions</Text></View>{weekdays.map(x=><View key={x.day} style={styles.dayRow}><Text style={styles.dayName}>{x.day}</Text><View style={styles.dayBarCell}><View style={[styles.dayBar,{width:`${x.sales/max*100}%`,backgroundColor:x.day==="Friday"?"#6A2B13":"#D9B595"}]}/></View><Text style={styles.daySales}>{peso(x.sales)}</Text><Text style={styles.dayTransactions}>{x.transactions}</Text></View>)}</Panel>;

}



function TimeChart() { const styles=useResponsiveStyles(baseStyles); const max=Math.max(...times.map(x=>x[1]));

  return <Panel style={styles.smallPanel}><Text style={styles.panelTitle}>Sales by Time of Day</Text><View style={styles.timeChart}>{times.map(([label,value])=><View key={label} style={styles.timeCol}><View style={styles.timePlot}><View style={[styles.timeStem,{height:value/max*90}]}/><View style={[styles.timeDot,{bottom:value/max*90-4}]}/></View><Text style={styles.smallAxis}>{label}</Text></View>)}</View></Panel>;

}



function ComparisonChart() { const styles=useResponsiveStyles(baseStyles); const max=Math.max(...monthly.map(x=>x.sales));

  return <Panel style={styles.smallPanel}><View style={styles.panelHeader}><Text style={styles.panelTitle}>Monthly Comparison</Text><View style={styles.legend}><View style={[styles.dot,{backgroundColor:"#DFC1A5"}]}/><Text style={styles.legendText}>2023</Text><View style={[styles.dot,{backgroundColor:"#6B2D15"}]}/><Text style={styles.legendText}>2024</Text></View></View><View style={styles.comparisonChart}>{monthly.map((x,i)=><View key={x.month} style={styles.compareCol}><View style={styles.comparePlot}><View style={[styles.compareBar,{height:previousYear[i]/max*92,backgroundColor:"#DFC1A5"}]}/><View style={[styles.compareBar,{height:x.sales/max*92,backgroundColor:"#6B2D15"}]}/></View><Text style={styles.smallAxis}>{x.month.slice(0,1)}</Text></View>)}</View></Panel>;

}



function GrowthChart({monthly}) { const styles=useResponsiveStyles(baseStyles); const max=Math.max(...monthly.map(x=>Math.abs(x.growth)));

  return <Panel style={styles.smallPanel}><Text style={styles.panelTitle}>Sales Growth Rate</Text><View style={styles.growthChart}>{monthly.map(x=><View key={x.month} style={styles.growthCol}><View style={styles.growthPlot}><View style={[styles.growthBar,{height:Math.max(3,Math.abs(x.growth)/max*68),backgroundColor:x.growth<0?"#E56B70":"#4FA36D",top:x.growth<0?42:undefined,bottom:x.growth<0?undefined:42}]}/></View><Text style={styles.smallAxis}>{x.month.slice(0,1)}</Text></View>)}</View></Panel>;

}



function HistoricalScreen({date,setDate,dateOptions,navigate,width,SelectorComponent:Selector}) { const styles=useResponsiveStyles(baseStyles); const compact=width<880;
 const db=useDatabase(); const monthly=selectedHistory(db.historical,date).rows.map(r=>({...r,transactions:r.receipts,growth:r.change})); const net=monthly.reduce((a,r)=>a+r.sales,0),receipts=monthly.reduce((a,r)=>a+r.receipts,0);

  const availableWidth=Math.max(320,width-(compact?32:52));

  const trendChartWidth=compact?availableWidth-34:((availableWidth-10)*2/3)-34;

  const exportData=()=>{if(Platform.OS!=="web")return;const csv=["Month,Net Sales,Transactions,Growth",...monthly.map(x=>`${x.month},${x.sales},${x.transactions},${x.growth}`)].join("\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="spot-garage-sales-trends-demo.csv";a.click();URL.revokeObjectURL(a.href)};

  return <><View style={[styles.pageHead,compact&&styles.pageHeadCompact]}><View style={{maxWidth:"100%",flexShrink:1}}><View style={styles.titleRow}><Text style={styles.pageTitle}>Sales Trends</Text><Text style={styles.demoBadge}>HISTORICAL POS</Text></View><Text style={styles.pageSubtitle}>Analyze your sales patterns over time to identify opportunities and plan ahead.</Text></View><View style={styles.actions}><View style={styles.dateSelector}><Selector label="Date range" value={date} options={dateOptions} onChange={setDate} compact/></View><ExportControl type="trends" filters={reportDates(date)}/></View></View>

  <View style={styles.kpiGrid}><KpiCard label="Net Sales" value={peso(net)} change="12.5" icon="cash-multiple"/><KpiCard label="Total Receipts" value={receipts.toLocaleString()} change="8.2" icon="receipt-text-outline"/><KpiCard label="Average Sale" value={receipts?peso(net/receipts):"Unavailable"} change="4.6" icon="cart-outline"/><KpiCard label="Sales Growth" value={monthly.at(-1)?.change==null?"Unavailable":monthly.at(-1).change.toFixed(1)+"%"} change="12.5" icon="percent-outline"/></View>

  <View style={[styles.primaryGrid,compact&&styles.stack]}><MonthlyTrend monthly={monthly} chartWidth={trendChartWidth}/><Panel style={styles.weekPanel}><Text style={styles.panelTitle}>Daily historical trends</Text><Text style={styles.panelSubtitle}>Not available from monthly POS data. Daily activity is available on Peak &amp; Off-Peak after manual sales are recorded.</Text></Panel></View>

  <View style={styles.secondaryGrid}><Panel style={styles.smallPanel}><Text style={styles.panelTitle}>Hourly historical sales</Text><Text style={styles.panelSubtitle}>Not available from current POS data.</Text></Panel><Panel style={styles.smallPanel}><Text style={styles.panelTitle}>Year-over-year comparison</Text><Text style={styles.panelSubtitle}>A matching previous-year dataset is not available.</Text></Panel><GrowthChart monthly={monthly}/></View>

  <Panel style={styles.insights}><View style={styles.insightLead}><View style={styles.insightIcon}><MaterialCommunityIcons name="lightbulb-outline" size={27} color="#66311B"/></View><Text style={styles.insightsTitle}>Key Insights</Text></View>{[["trending-up","Monthly coverage",`${monthly.length} available monthly records selected.`],["clock-outline","Comparison method","Changes compare consecutive calendar months; missing periods are not filled."],["calendar-month-outline","Separate sources","Manual entries are shown separately from historical POS receipts."]].map(([icon,title,text])=><View key={title} style={styles.insightItem}><MaterialCommunityIcons name={icon} size={27} color="#66311B"/><View style={{flex:1,minWidth:0}}><Text style={styles.insightTitle}>{title}</Text><Text style={styles.insightText}>{text}</Text></View></View>)}</Panel></>;

}



const baseStyles=StyleSheet.create({

  pageHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",gap:20,marginBottom:16},pageHeadCompact:{flexDirection:"column",alignItems:"stretch"},breadcrumb:{flexDirection:"row",alignItems:"center",gap:5,marginBottom:8},breadcrumbCurrent:{fontSize:12,fontWeight:"700",color:"#211915"},muted:{fontSize:11,color:"#6F6A66"},titleRow:{flexDirection:"row",alignItems:"center",gap:10,flexWrap:"wrap"},pageTitle:{fontSize:31,lineHeight:36,fontWeight:"900",color:"#181311"},demoBadge:{fontSize:8,fontWeight:"900",letterSpacing:1,color:"#60402F",backgroundColor:"#F0E2D5",paddingHorizontal:9,paddingVertical:5,borderRadius:10},pageSubtitle:{fontSize:13,color:"#59616B",marginTop:2},actions:{flexDirection:"row",gap:12,alignItems:"center",flexWrap:"wrap"},dateSelector:{width:310,maxWidth:"100%"},exportButton:{height:44,flexDirection:"row",alignItems:"center",gap:8,borderRadius:8,backgroundColor:"#704126",paddingHorizontal:22},exportText:{fontSize:12,fontWeight:"700",color:"#FFF"},panel:{maxWidth:"100%",borderWidth:1,borderColor:"#E5DED7",borderRadius:12,backgroundColor:"#FFFEFC",padding:16,marginBottom:10},kpiGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},kpiCard:{flex:1,minWidth:225,minHeight:118,flexDirection:"row",alignItems:"center",gap:13},kpiIcon:{width:58,height:58,borderRadius:29,backgroundColor:"#F3DFCC",alignItems:"center",justifyContent:"center"},kpiCopy:{flex:1},kpiLabel:{fontSize:11,color:"#211915"},kpiValue:{fontSize:23,fontWeight:"900",color:"#171210",marginTop:6},kpiChange:{fontSize:10,fontWeight:"700",color:"#0B9B50",marginTop:8},primaryGrid:{width:"100%",flexDirection:"row",gap:10},stack:{flexDirection:"column",alignItems:"stretch"},trendPanel:{flex:2,minWidth:0},weekPanel:{flex:1,minWidth:0},panelHeader:{flexWrap:"wrap",flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",gap:10},panelTitle:{fontSize:15,fontWeight:"900",color:"#181311"},panelSubtitle:{fontSize:10,color:"#69717B",marginTop:3},legend:{flexDirection:"row",alignItems:"center",gap:6,flexWrap:"wrap"},dot:{width:9,height:9,borderRadius:5,marginLeft:6},legendText:{fontSize:9,color:"#2B2521"},periodButton:{height:32,minWidth:105,borderWidth:1,borderColor:"#E0D8D0",borderRadius:7,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:11,marginLeft:8},periodText:{fontSize:9},chartScroller:{flexGrow:1},mainChart:{height:215,flexDirection:"row",alignItems:"flex-end",paddingTop:40},monthCol:{height:190,alignItems:"center",justifyContent:"flex-end"},mainPlot:{height:155,width:"74%",maxWidth:54,alignItems:"center",justifyContent:"flex-end",borderBottomWidth:1,borderBottomColor:"#E5DED7"},salesBar:{width:"72%",maxWidth:36,backgroundColor:"#E4C5A9",borderTopLeftRadius:2,borderTopRightRadius:2},lineDot:{position:"absolute",width:8,height:8,borderRadius:4,backgroundColor:"#682B14"},axisLabel:{fontSize:8,color:"#657080",marginTop:6},tooltip:{position:"absolute",zIndex:4,top:0,minWidth:135,borderWidth:1,borderColor:"#E5DED7",borderRadius:8,backgroundColor:"#FFF",padding:9},tooltipMonth:{fontSize:9,fontWeight:"800",marginBottom:5},tooltipLine:{fontSize:8,color:"#682B14",marginTop:3},dayRow:{height:28,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#EEE8E2"},dayHeader:{backgroundColor:"#F5F1ED"},dayName:{width:82,fontSize:9,color:"#4E5968",paddingLeft:5},dayBarCell:{flex:1,height:12},dayBar:{height:12,borderRadius:3},daySales:{width:87,fontSize:9,textAlign:"right",color:"#4E5968"},dayTransactions:{width:72,fontSize:9,textAlign:"center",color:"#4E5968"},secondaryGrid:{width:"100%",flexDirection:"row",flexWrap:"wrap",gap:10},smallPanel:{flex:1,minWidth:260},timeChart:{height:125,flexDirection:"row",alignItems:"flex-end",marginTop:8},timeCol:{flex:1,alignItems:"center"},timePlot:{height:98,width:"100%",alignItems:"center",justifyContent:"flex-end",borderBottomWidth:1,borderBottomColor:"#DDD7D1"},timeStem:{width:2,backgroundColor:"#6B2C14"},timeDot:{position:"absolute",width:7,height:7,borderRadius:4,backgroundColor:"#6B2C14"},smallAxis:{fontSize:7,color:"#69717B",marginTop:4},comparisonChart:{height:125,flexDirection:"row",alignItems:"flex-end",marginTop:8},compareCol:{flex:1,alignItems:"center"},comparePlot:{height:98,flexDirection:"row",alignItems:"flex-end",gap:2},compareBar:{width:6,borderTopLeftRadius:2,borderTopRightRadius:2},growthChart:{height:125,flexDirection:"row",alignItems:"flex-end",marginTop:8},growthCol:{flex:1,alignItems:"center"},growthPlot:{height:98,width:"100%",borderBottomWidth:1,borderBottomColor:"#DDD7D1"},growthBar:{position:"absolute",left:"28%",width:"45%",maxWidth:14},insights:{flexWrap:"wrap",width:"100%",minHeight:115,flexDirection:"row",alignItems:"center",gap:22,overflow:"hidden"},insightLead:{flexDirection:"row",alignItems:"center",gap:13,minWidth:190},insightIcon:{width:58,height:58,borderRadius:29,backgroundColor:"#F2DFCC",alignItems:"center",justifyContent:"center"},insightsTitle:{fontSize:14,fontWeight:"900",color:"#251A15"},insightItem:{flex:1,minWidth:200,flexDirection:"row",alignItems:"center",gap:12,borderLeftWidth:1,borderLeftColor:"#E4D8CE",paddingLeft:18},insightTitle:{fontSize:10,fontWeight:"800",color:"#362218"},insightText:{fontSize:9,lineHeight:14,color:"#68707A",maxWidth:210,marginTop:4}

});


export default function SalesTrendsScreen(props){return <SalesSource {...props} title="Sales Trends"><HistoricalScreen {...props}/></SalesSource>;}
