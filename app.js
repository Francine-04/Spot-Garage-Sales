import {api} from './src/services/api';
import GlobalSearchResults from './src/components/GlobalSearchResults';
import SignInScreen from './src/screens/SignInScreen';
import {DatabaseProvider,useDatabase,reportDates} from './src/state/DatabaseContext';
import {layoutWidthContext, tokens, contentPadding} from './src/theme/designTokens';
import {useResponsiveStyles} from './src/hooks/useResponsiveStyles';
import React, { Suspense, useEffect, useMemo, useState } from "react";

import {

  ActivityIndicator, Image, Modal, Platform, Pressable, SafeAreaView,

  ScrollView, StatusBar, StyleSheet, Text, TextInput,

  TouchableWithoutFeedback, useWindowDimensions, View

} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { categories, months, payments, regions } from "./src/data/salesData";

import { getSalesRecords } from "./src/services/salesRepository";

import { HomeScreen, SalesPerformanceScreen, SalesTrendsScreen, ProductsMenuScreen, DailyTransactionsScreen, PeakOffPeakScreen, ReportsScreen } from "./src/screens";



const C = { ink:"#251B17", brown:"#51392F", deep:"#37261F", tan:"#C7A184", pale:"#F0DDC9", cream:"#F7F2EA", paper:"#FFFDF9", line:"#DED5CC", muted:"#756C67", green:"#315F4B", red:"#A94F40" };

const font = Platform.select({ web:"Inter, system-ui, sans-serif", default:"System" });

const dateGroups = { q1:[0,1,2], q2:[3,4,5], q3:[6,7,8], q4:[9,10,11] };

const money = n => `\u20B1${Math.round(n || 0).toLocaleString("en-PH")}`;

const preciseMoney = n => `\u20B1${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits:2, maximumFractionDigits:2 })}`;

const sum = (rows,key) => rows.reduce((total,row)=>total+(Number(row[key])||0),0);

const group = (rows,key) => rows.reduce((map,row)=>{(map[row[key]] ||= []).push(row);return map},{});



const pages = [

  {id:"home",label:"Home",icon:"home-outline",description:"Your analytics workspace."},

  {id:"top-sales",label:"Sales Performance",icon:"chart-bar",description:"Check total sales, receipts, average sale, and leading categories."},

  {id:"sales-trends",label:"Sales Trends",icon:"chart-line",description:"Analyze monthly sales and receipt trends."},

  {id:"products",label:"Products & Menus",icon:"silverware-fork-knife",description:"Check product performance, quantities sold, and revenue by category."},

  {id:"transactions",label:"Daily Transactions",icon:"receipt-text-outline",description:"Review transaction summaries represented by the current dataset."},

  {id:"profitability",label:"Profitability",icon:"cash-multiple",description:"View costs, profit, and margins when cost data becomes available."},

  {id:"peak",label:"Peak & Off-Peak",icon:"calendar-clock-outline",description:"Discover the busiest and slowest periods in the selected data."},

  {id:"customers",label:"Customer Analysis",icon:"account-group-outline",description:"Explore customer segments when customer records are connected."},

  {id:"forecast",label:"Sales Forecast",icon:"trending-up",description:"Estimate future sales when sufficient historical data is connected."},

  {id:"insights",label:"Business Insights",icon:"lightbulb-outline",description:"Review data-backed findings from the current selection."},

  {id:"reports",label:"Reports",icon:"file-chart-outline",description:"Review summaries and export-ready reporting information."}

];

const sidebarPages = pages.filter(p=>["home","top-sales","sales-trends","products","transactions","peak","reports"].includes(p.id));

const homeCards = [

  {...pages.find(p=>p.id==="top-sales"),image:require("./assets/images/sales-performance.jpg")},

  {...pages.find(p=>p.id==="sales-trends"),image:require("./assets/images/sales-trend.jpg")},

  {...pages.find(p=>p.id==="products"),image:require("./assets/images/products-menu-card.jpg")},

  {...pages.find(p=>p.id==="transactions"),image:require("./assets/images/daily transaction.jpg")},

  {...pages.find(p=>p.id==="peak"),image:require("./assets/images/peak and off peak.jpg")},

  {...pages.find(p=>p.id==="reports"),image:require("./assets/images/reports.jpg")}

];



function Selector({label,value,options,onChange,compact=false}) {

  const [open,setOpen]=useState(false); const selected=options.find(x=>x.value===value)?.label;

  return <>

    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${selected}`} style={[s.selector,compact&&s.selectorCompact]} onPress={()=>setOpen(true)}>

      <View style={s.selectorIcon}><MaterialCommunityIcons name="calendar-range" size={19} color={C.brown}/></View>

      <View style={s.selectorCopy}><Text style={s.filterLabel}>{label}</Text><Text style={s.selectorValue}>{selected}</Text></View>

      <MaterialCommunityIcons name="chevron-down" size={20} color={C.ink}/>

    </Pressable>

    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>

      <TouchableWithoutFeedback onPress={()=>setOpen(false)}><View style={s.shade}>

        <TouchableWithoutFeedback><View style={s.optionSheet}><Text style={s.optionTitle}>{label}</Text><ScrollView>{options.map(x=><Pressable key={x.value} style={[s.optionRow,value===x.value&&s.optionActive]} onPress={()=>{onChange(x.value);setOpen(false)}}><Text style={s.optionText}>{x.label}</Text>{value===x.value&&<MaterialCommunityIcons name="check" size={20} color={C.brown}/>}</Pressable>)}</ScrollView></View></TouchableWithoutFeedback>

      </View></TouchableWithoutFeedback>

    </Modal>

  </>;

}



function SideContent({active,navigate}) {

  return <View style={s.sideInner}>

    <Image source={require("./assets/images/spot-garage-logo.jpg")} accessibilityLabel="Spot Garage logo" style={s.logo}/>

    <ScrollView contentContainerStyle={s.sideNav} showsVerticalScrollIndicator={false}>{sidebarPages.map(p=><Pressable key={p.id} accessibilityLabel={p.label} accessibilityRole="button" accessibilityState={{selected:active===p.id}} style={[s.sideLink,active===p.id&&s.sideActive]} onPress={()=>navigate(p.id)}><MaterialCommunityIcons name={p.icon} size={20} color="#F8EEE7"/><Text style={s.sideText}>{p.label}</Text></Pressable>)}</ScrollView>

    <View style={s.sideFoot}><Image source={require("./assets/images/motorcycle-transparent.png")} accessibilityLabel="Vintage motorcycle illustration" resizeMode="contain" style={s.sideMotor}/><View style={s.checker}>{Array.from({length:16},(_,i)=><View key={i} style={[s.check,{backgroundColor:(i+Math.floor(i/8))%2?C.tan:C.deep}]}/>)}</View></View>

  </View>;

}

function Drawer({visible,active,close,navigate}) { return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}><View style={s.drawerLayer}><Pressable style={s.drawerBackdrop} onPress={close}/><SafeAreaView style={s.drawer}><SideContent active={active} navigate={navigate}/></SafeAreaView></View></Modal>; }

function Card({children,style}) { return <View style={[s.card,style]}>{children}</View>; }

function Title({kicker,title,right}) { return <View style={s.panelHead}><View><Text style={s.kicker}>{kicker}</Text><Text style={s.panelTitle}>{title}</Text></View>{right}</View>; }

function EmptyState({icon,title,text}) { return <View style={s.empty}><View style={s.emptyIcon}><MaterialCommunityIcons name={icon} size={27} color={C.tan}/></View><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyText}>{text}</Text></View>; }



function SalesBars({data}) {

  const [selected,setSelected]=useState(null), max=Math.max(...data.map(x=>x.sales),1);

  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chart}>{data.map(x=><Pressable key={x.month} style={s.barCol} onPress={()=>setSelected(selected?.month===x.month?null:x)}>{selected?.month===x.month&&<View style={s.tooltip}><Text style={s.tooltipMain}>{money(x.sales)}</Text><Text style={s.tooltipSub}>{x.receipts.toLocaleString()} receipts</Text></View>}<View style={s.barTrack}><View style={[s.bar,{height:Math.max(7,x.sales/max*170)}]}/></View><Text style={s.axis}>{x.month.slice(0,3)}</Text></Pressable>)}</ScrollView>;

}



function ProductList({items,total}) { const [expanded,setExpanded]=useState(null),max=items[0]?.sales||1; return <View>{items.map(x=><Pressable key={x.name} style={s.productRow} onPress={()=>setExpanded(expanded===x.name?null:x.name)}><View style={s.between}><Text style={s.rowTitle}>{x.name}</Text><Text style={s.rowValue}>{total?(x.sales/total*100).toFixed(1):0}%</Text></View><View style={s.progress}><View style={[s.progressFill,{width:`${x.sales/max*100}%`}]}/></View>{expanded===x.name&&<Text style={s.detail}>{money(x.sales)} · {x.items.toLocaleString()} items</Text>}</Pressable>)}</View>; }



function AnalyticsPage({page,monthly,products,regionsData,receipts,netSales,items,average,peak,off,setRegion,navigate,filtered}) {

  const heading=<View style={s.pageHeading}><Pressable style={s.backButton} onPress={()=>navigate("home")}><MaterialCommunityIcons name="arrow-left" size={20} color={C.brown}/></Pressable><View><Text style={s.kicker}>ANALYTICS</Text><Text style={s.pageTitle}>{page.label}</Text><Text style={s.pageSubtitle}>{page.description}</Text></View></View>;

  let body;

  if(page.id==="top-sales") body=<View style={s.twoCol}><Card style={s.flexPanel}><Title kicker="TOP CATEGORIES" title="Sales leaders"/><ProductList items={products} total={netSales}/></Card><Card style={s.flexPanel}><Title kicker="BEST PERIOD" title={peak?.month||"Unavailable"}/>{peak&&<><Text style={s.featureValue}>{money(peak.sales)}</Text><Text style={s.detail}>{peak.receipts.toLocaleString()} receipts in the filtered dataset</Text></>}</Card></View>;

  else if(page.id==="sales-trends") body=<Card><Title kicker="PERFORMANCE" title="Monthly sales trend" right={<Text style={s.demoBadge}>DEMO DATA</Text>}/><SalesBars data={monthly}/></Card>;

  else if(page.id==="products") body=<Card><Title kicker="PRODUCT MIX" title="Products & menus"/><ProductList items={products} total={netSales}/></Card>;

  else if(page.id==="transactions") body=<><View style={s.kpiGrid}>{[["Receipts",receipts.toLocaleString(),"receipt-text-outline"],["Net sales",money(netSales),"cash-multiple"],["Average sale",preciseMoney(average),"basket-outline"],["Items sold",items.toLocaleString(),"package-variant-closed"]].map(([l,v,i])=><Card key={l} style={s.kpi}><MaterialCommunityIcons name={i} size={23} color={C.brown}/><Text style={s.kpiLabel}>{l}</Text><Text style={s.kpiValue}>{v}</Text></Card>)}</View><Card><Text style={s.note}>The current mock data is aggregated. Connect receipt-level records to browse individual transactions.</Text></Card></>;

  else if(page.id==="profitability") body=<Card><EmptyState icon="cash-remove" title="Profitability data unavailable" text="The current dataset does not include cost of goods, expenses, or verified profit. Connect those fields to calculate profit and margin."/></Card>;

  else if(page.id==="peak") body=<View style={s.twoCol}><Card style={[s.flexPanel,s.periodPeak]}><MaterialCommunityIcons name="trending-up" size={30} color={C.green}/><Text style={s.periodLabel}>PEAK PERIOD</Text><Text style={s.featureTitle}>{peak?.month||"Unavailable"}</Text>{peak&&<Text style={s.detail}>{money(peak.sales)} · {peak.receipts.toLocaleString()} receipts</Text>}</Card><Card style={[s.flexPanel,s.periodOff]}><MaterialCommunityIcons name="trending-down" size={30} color={C.red}/><Text style={s.periodLabel}>OFF-PEAK PERIOD</Text><Text style={s.featureTitle}>{off?.month||"Unavailable"}</Text>{off&&<Text style={s.detail}>{money(off.sales)} · {off.receipts.toLocaleString()} receipts</Text>}</Card></View>;

  else if(page.id==="customers") body=<Card><EmptyState icon="account-search-outline" title="Customer data unavailable" text="Customer identities, loyalty activity, and segments are not included in the current dataset."/></Card>;

  else if(page.id==="forecast") body=<Card><EmptyState icon="chart-timeline-variant-shimmer" title="Forecast unavailable" text="A reliable forecast requires sufficient dated historical data and an agreed forecasting method."/></Card>;

  else if(page.id==="insights") body=<View style={s.twoCol}><Card style={s.flexPanel}><Title kicker="OBSERVATION" title="Highest sales period"/><Text style={s.featureTitle}>{peak?.month||"Unavailable"}</Text><Text style={s.detail}>{peak?`${money(peak.sales)} in the current selection`:"No matching rows"}</Text></Card><Card style={s.flexPanel}><Title kicker="OBSERVATION" title="Leading category"/><Text style={s.featureTitle}>{products[0]?.name||"Unavailable"}</Text><Text style={s.detail}>Derived from the currently filtered demo records.</Text></Card></View>;

  else if(page.id==="reports") body=<Card><Title kicker="REPORT SUMMARY" title="Current selection"/><Text style={s.reportLine}>{filtered.length.toLocaleString()} records · {receipts.toLocaleString()} receipts · {money(netSales)} net sales</Text><Text style={s.note}>Report export can be connected after you choose a database and file format.</Text></Card>;

  else body=<Card><Title kicker="REGIONS" title="Regional performance"/>{regionsData.map((x,i)=><Pressable key={x.name} style={s.regionRow} onPress={()=>setRegion(x.name)}><View style={s.rank}><Text style={s.rankText}>{i+1}</Text></View><View style={{flex:1}}><Text style={s.rowTitle}>{x.name}</Text><Text style={s.detail}>{x.receipts.toLocaleString()} receipts</Text></View><Text style={s.rowValue}>{money(x.sales)}</Text></Pressable>)}</Card>;

  return <>{heading}{body}</>;

}



export default function App(){
 const [user,setUser]=useState(null),[checking,setChecking]=useState(true),[authError,setAuthError]=useState('');
 useEffect(()=>{let live=true;api('/auth/session').then(result=>{if(live)setUser(result.user);}).catch(()=>{}).finally(()=>{if(live)setChecking(false);});const expire=()=>setUser(null);if(typeof window!=='undefined')window.addEventListener('spot-auth-expired',expire);return()=>{live=false;if(typeof window!=='undefined')window.removeEventListener('spot-auth-expired',expire);};},[]);
 const logout=async()=>{try{await api('/auth/logout',{});setUser(null);setAuthError('');}catch(error){setAuthError('Logout failed. Please retry: '+error.message);}};
 if(checking)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:C.cream}}><ActivityIndicator color={C.brown}/><Text>Checking session...</Text></View>;
 return user?<DatabaseProvider>{!!authError&&<Text accessibilityLiveRegion="polite">{authError}</Text>}<AppShell onLogout={logout}/></DatabaseProvider>:<SignInScreen onSignIn={setUser}/>;
}
function AppShell({onLogout}) {
 const database=useDatabase();

  const {width,height}=useWindowDimensions(), desktop=width>=1280;

  const [collapsed,setCollapsed]=useState(false);
  const [measuredWidth,setMeasuredWidth]=useState(width);
  const padding=contentPadding(measuredWidth);
  const usableWidth=Math.min(measuredWidth,tokens.size.contentMax)-padding*2;
  const s=useResponsiveStyles(baseStyles,usableWidth);

  const [records,setRecords]=useState([]),[loading,setLoading]=useState(true),[active,setActive]=useState("home"),[drawer,setDrawer]=useState(false),[menu,setMenu]=useState(null);

  const [search,setSearch]=useState(""),[date,setDate]=useState("all"),[region,setRegion]=useState("all"),[category,setCategory]=useState("all"),[payment,setPayment]=useState("all");

  useEffect(()=>{setRecords([]);setLoading(false);},[]);

  const filtered=useMemo(()=>records.filter(row=>{const term=search.trim().toLowerCase(),text=`${row.month} ${row.region} ${row.category} ${row.paymentType}`.toLowerCase();return(date==="all"||dateGroups[date].includes(row.monthIndex))&&(region==="all"||row.region===region)&&(category==="all"||row.category===category)&&(payment==="all"||row.paymentType===payment)&&(!term||text.includes(term))}),[records,search,date,region,category,payment]);

  const monthly=useMemo(()=>{const g=group(filtered,"month");return months.map((month,index)=>({month,index,sales:sum(g[month]||[],"netSales"),receipts:sum(g[month]||[],"receipts")})).filter(x=>x.sales||x.receipts)},[filtered]);

  const products=useMemo(()=>Object.entries(group(filtered,"category")).map(([name,rows])=>({name,sales:sum(rows,"netSales"),items:sum(rows,"itemsSold")})).sort((a,b)=>b.sales-a.sales),[filtered]);

  const regionsData=useMemo(()=>Object.entries(group(filtered,"region")).map(([name,rows])=>({name,sales:sum(rows,"netSales"),receipts:sum(rows,"receipts")})).sort((a,b)=>b.sales-a.sales),[filtered]);

  const receipts=sum(filtered,"receipts"),netSales=sum(filtered,"netSales"),items=sum(filtered,"itemsSold"),average=receipts?netSales/receipts:0;

  const peak=monthly.length?monthly.reduce((a,b)=>b.sales>a.sales?b:a):null,off=monthly.length?monthly.reduce((a,b)=>b.sales<a.sales?b:a):null;

  const availablePeriods=[...new Set([...database.historical.rows.map(r=>r.period),...database.entries.map(e=>e.day.slice(0,7))])].sort();
  const options={date:[{value:"all",label:"All available months"},...Array.from(new Set(availablePeriods.map(p=>p.slice(0,4)))).map(year=>({value:year,label:year})),...availablePeriods.map(period=>({value:period,label:new Date(period+"-01T12:00:00Z").toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"})}))],region:[{value:"all",label:"All regions"},...regions.map(x=>({value:x,label:x}))],category:[{value:"all",label:"All products"},...categories.map(x=>({value:x,label:x}))],payment:[{value:"all",label:"All payment types"},...payments.map(x=>({value:x,label:x}))]};

  const navigate=id=>{setActive(id);setDrawer(false)}; const page=pages.find(x=>x.id===active)||pages[0];

  if(loading)return <SafeAreaView style={s.loading}><ActivityIndicator size="large" color={C.brown}/><Text style={s.detail}>Loading dashboard…</Text></SafeAreaView>;

  return <SafeAreaView style={s.safe}><StatusBar barStyle="dark-content" backgroundColor={C.paper}/><View style={s.appShell}>

    {desktop&&!collapsed&&<View style={s.desktopSide}><SideContent active={active} navigate={navigate}/></View>}

    <View style={s.main} onLayout={event=>setMeasuredWidth(event.nativeEvent.layout.width)}>

      <View style={s.header}><Pressable accessibilityLabel="Toggle navigation" accessibilityRole="button" style={s.iconButton} onPress={()=>desktop?setCollapsed(!collapsed):setDrawer(true)}><MaterialCommunityIcons name="menu" size={24} color={C.ink}/></Pressable><View style={[s.search,width<600&&{display:"none"},!desktop&&{maxWidth:300}]}><MaterialCommunityIcons name="magnify" size={20} color={C.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="Search anything…" placeholderTextColor="#968D87" accessibilityLabel="Search dashboard" style={s.searchInput}/>{!!search&&<Pressable onPress={()=>setSearch("")}><MaterialCommunityIcons name="close-circle" size={18} color={C.muted}/></Pressable>}</View>{width<600&&<Text style={{flex:1,fontSize:15,fontWeight:"700",color:C.ink}}>Spot Garage</Text>}<View style={s.headerActions}><Pressable accessibilityLabel="Settings" style={s.iconButton} onPress={()=>setMenu("settings")}><MaterialCommunityIcons name="tune-variant" size={21} color={C.ink}/></Pressable><Pressable accessibilityLabel="Notifications" style={s.iconButton} onPress={()=>setMenu("notifications")}><MaterialCommunityIcons name="bell-outline" size={21} color={C.ink}/><View style={s.alert}/></Pressable><Pressable accessibilityLabel="Admin profile" accessibilityRole="button" accessibilityState={{expanded:menu==="profile"}} style={s.profileButton} onPress={()=>setMenu("profile")}><View style={s.avatar}><Text style={s.avatarText}>SG</Text></View>{width>=700&&<><View><Text style={s.profileName}>Admin</Text><Text style={s.profileEmail}>Spot Garage Manager</Text></View><MaterialCommunityIcons name="chevron-down" size={19} color={C.ink}/></>}</Pressable></View></View>

      {width<600&&<View style={{padding:8,backgroundColor:C.paper}}><TextInput accessibilityLabel="Search dashboard" value={search} onChangeText={setSearch} placeholder="Search dashboard..." style={[s.searchInput,{minHeight:44,paddingHorizontal:12,borderWidth:1,borderColor:C.line,borderRadius:8}]}/></View>}
      {!!search.trim()&&<GlobalSearchResults query={search} pages={sidebarPages} onClose={()=>setSearch("")} onSelect={id=>{navigate(id);setSearch("");}}/>}

      <ScrollView style={s.screen} contentContainerStyle={[s.content,{padding,paddingBottom:24}]} keyboardShouldPersistTaps="handled">

        <layoutWidthContext.Provider value={usableWidth}><View accessibilityLabel="Breadcrumb" style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12,minHeight:32}}><Pressable accessibilityRole="button" accessibilityLabel="Go to Dashboard" onPress={()=>navigate('home')} style={{minHeight:44,justifyContent:'center'}}><Text style={{fontFamily:font,fontSize:12,color:'#637082'}}>Dashboard</Text></Pressable><MaterialCommunityIcons name="chevron-right" size={16} color={C.ink}/><Text style={{fontFamily:font,fontSize:12,fontWeight:'700',color:C.ink,flexShrink:1}}>{page.label}</Text></View>{!!database.error&&<Text accessibilityLiveRegion="polite" style={{padding:12,color:C.red}}>{database.error}</Text>}<Suspense fallback={<View accessibilityLiveRegion="polite" style={{padding:24}}><ActivityIndicator color={C.brown}/><Text>Loading screen...</Text></View>}>{active==="home"?<HomeScreen width={Math.min(measuredWidth,tokens.size.contentMax)} date={date} setDate={setDate} navigate={navigate} dateOptions={options.date} styles={s} colors={C} cards={homeCards} SelectorComponent={Selector}/>:active==="top-sales"?<SalesPerformanceScreen monthly={monthly} receipts={receipts} netSales={netSales} average={average} date={date} setDate={setDate} dateOptions={options.date} navigate={navigate} width={Math.min(measuredWidth,tokens.size.contentMax)} styles={s} colors={C} CardComponent={Card} SelectorComponent={Selector} formatMoney={money}/>:active==="sales-trends"?<SalesTrendsScreen date={date} setDate={setDate} dateOptions={options.date} navigate={navigate} width={Math.min(measuredWidth,tokens.size.contentMax)} SelectorComponent={Selector}/>:active==="products"?<ProductsMenuScreen navigate={navigate} width={Math.min(measuredWidth,tokens.size.contentMax)} viewportHeight={height}/>:active==="transactions"?<DailyTransactionsScreen navigate={navigate} width={Math.min(measuredWidth,tokens.size.contentMax)}/>:active==="peak"?<PeakOffPeakScreen date={date} setDate={setDate} dateOptions={options.date} SelectorComponent={Selector} navigate={navigate} width={Math.min(measuredWidth,tokens.size.contentMax)}/>:active==="reports"?<ReportsScreen date={date} setDate={setDate} dateOptions={options.date} SelectorComponent={Selector} navigate={navigate} width={Math.min(measuredWidth,tokens.size.contentMax)}/>:<><View style={s.filterStrip}><Selector label="Date range" value={date} options={options.date} onChange={setDate}/><Selector label="Region" value={region} options={options.region} onChange={setRegion}/><Selector label="Product" value={category} options={options.category} onChange={setCategory}/><Selector label="Payment" value={payment} options={options.payment} onChange={setPayment}/></View><AnalyticsPage page={page} monthly={monthly} products={products} regionsData={regionsData} receipts={receipts} netSales={netSales} items={items} average={average} peak={peak} off={off} setRegion={setRegion} navigate={navigate} filtered={filtered}/></>}</Suspense></layoutWidthContext.Provider>

      </ScrollView>

    </View>

  </View>

  {!desktop&&<Drawer visible={drawer} active={active} close={()=>setDrawer(false)} navigate={navigate}/>}

  <Modal visible={!!menu} transparent animationType="fade" onRequestClose={()=>setMenu(null)}><TouchableWithoutFeedback onPress={()=>setMenu(null)}><View style={[s.shade,menu==="profile"&&{justifyContent:"flex-start",alignItems:"flex-end",paddingTop:tokens.size.header+8,paddingRight:16,backgroundColor:"rgba(38,27,23,.18)"}]}><TouchableWithoutFeedback><View style={[s.infoMenu,menu==="profile"&&{maxWidth:280,padding:10,shadowColor:"#251B17",shadowOpacity:.18,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:12}]}>{menu==="profile"?<><View style={{flexDirection:"row",alignItems:"center",gap:12,padding:12,marginBottom:8}}><View style={[s.avatar,{width:48,height:48,borderRadius:24}]}><Text style={[s.avatarText,{fontSize:14}]}>SG</Text></View><View><Text style={[s.profileName,{fontSize:17}]}>Admin</Text><Text style={[s.profileEmail,{fontSize:12}]}>Spot Garage Manager</Text></View></View>{[["Profile","account-outline","profileDetails"],["Account Settings","cog-outline","settings"],["Logout","logout","logout"]].map(([label,icon,target])=><Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={()=>{if(target==="logout"){setMenu(null);onLogout();}else setMenu(target);}} style={({pressed})=>({minHeight:48,flexDirection:"row",alignItems:"center",gap:16,paddingHorizontal:16,borderRadius:8,backgroundColor:pressed||target==="profileDetails"?"#F1E7DD":"transparent",...(target==="logout"?{borderTopWidth:1,borderTopColor:C.line,marginTop:8,paddingTop:8}: {})})}><MaterialCommunityIcons name={icon} size={23} color={target==="logout"?"#B7472B":C.brown}/><Text style={{fontFamily:font,fontSize:15,color:target==="logout"?"#B7472B":C.ink}}>{label}</Text></Pressable>)}</>:menu==="profileDetails"?<><Text style={s.menuTitle}>Admin Profile</Text><Text style={s.menuText}>Admin</Text><Text style={s.menuText}>Spot Garage Manager</Text><Pressable accessibilityRole="button" onPress={()=>setMenu("profile")} style={s.menuRow}><Text style={s.optionText}>Back</Text></Pressable></>:menu==="notifications"?<><Text style={s.menuTitle}>Notifications</Text><Text style={s.menuText}>Dashboard is using the configured demo repository.</Text><Text style={s.menuText}>Unavailable metrics are clearly marked.</Text></>:<><Text style={s.menuTitle}>Quick settings</Text><Pressable style={s.menuRow} onPress={()=>{setDate("all");setRegion("all");setCategory("all");setPayment("all");setMenu(null)}}><Text style={s.optionText}>Reset analytics filters</Text></Pressable></>}</View></TouchableWithoutFeedback></View></TouchableWithoutFeedback></Modal>

  </SafeAreaView>;

}



const baseStyles=StyleSheet.create({

  safe:{flex:1,backgroundColor:C.cream,fontFamily:font},loading:{flex:1,alignItems:"center",justifyContent:"center",gap:12,backgroundColor:C.cream},appShell:{flex:1,flexDirection:"row"},main:{flex:1,minWidth:0},screen:{flex:1},content:{width:"100%",maxWidth:tokens.size.contentMax,boxSizing:"border-box",alignSelf:"center",padding:26,paddingBottom:40},

  desktopSide:{width:tokens.size.sidebar,backgroundColor:C.deep},sideInner:{flex:1,backgroundColor:C.deep},logo:{width:76,height:76,borderRadius:38,alignSelf:"center",marginTop:24,marginBottom:24,borderWidth:2,borderColor:"#D6C5B8"},sideNav:{paddingHorizontal:13,paddingBottom:18,gap:4},sideLink:{minHeight:48,borderRadius:9,flexDirection:"row",alignItems:"center",gap:13,paddingHorizontal:13},sideActive:{backgroundColor:"rgba(190,151,126,.48)"},sideText:{fontFamily:font,color:"#FFF",fontSize:13,fontWeight:"600"},sideFoot:{marginTop:"auto",alignItems:"center",overflow:"hidden"},sideMotor:{width:"100%",height:120,marginBottom:-20,opacity:.72},tagline:{fontFamily:font,color:"#D2C0B4",fontSize:8,lineHeight:14,letterSpacing:1.5,textAlign:"center"},tagLine:{width:50,height:1,backgroundColor:C.tan,marginVertical:15},checker:{height:50,width:"100%",flexDirection:"row",flexWrap:"wrap"},check:{width:"12.5%",height:25},

  drawerLayer:{flex:1,flexDirection:"row"},drawerBackdrop:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(20,14,11,.52)"},drawer:{width:260,height:"100%",backgroundColor:C.deep},

  header:{height:tokens.size.header,flexDirection:"row",alignItems:"center",paddingHorizontal:14,gap:9,backgroundColor:C.paper,borderBottomWidth:1,borderBottomColor:C.line},headerActions:{marginLeft:"auto",flexShrink:0,flexDirection:"row",alignItems:"center",gap:6},iconButton:{width:44,height:44,borderRadius:21,borderWidth:1,borderColor:C.line,backgroundColor:"#FFF",alignItems:"center",justifyContent:"center"},alert:{position:"absolute",right:3,top:2,width:8,height:8,borderRadius:4,backgroundColor:C.red},search:{flex:1,flexShrink:1,maxWidth:430,minWidth:0,height:46,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:12,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:"#FFF"},searchInput:{fontFamily:font,flex:1,minWidth:0,fontSize:13,color:C.ink,outlineStyle:"none"},profileButton:{minHeight:44,flexShrink:0,flexDirection:"row",alignItems:"center",gap:9,paddingLeft:2},avatar:{width:40,height:40,borderRadius:20,backgroundColor:C.brown,alignItems:"center",justifyContent:"center"},avatarText:{fontFamily:font,color:"#FFF",fontWeight:"800",fontSize:11},profileName:{fontFamily:font,fontSize:12,fontWeight:"800",color:C.ink},profileEmail:{fontFamily:font,fontSize:9,color:C.muted,marginTop:2},

  hero:{borderRadius:20,overflow:"hidden",backgroundColor:"#F8F1E7",borderWidth:1,borderColor:"#E7DDD2",padding:24,gap:18},heroDesktop:{minHeight:325,flexDirection:"row",alignItems:"center",padding:36},heroCopy:{zIndex:2},heroCopyDesktop:{width:"43%"},welcomeOverline:{fontFamily:font,fontSize:11,fontWeight:"800",letterSpacing:1.6,color:C.tan},heroTitle:{fontFamily:font,fontSize:38,lineHeight:42,fontWeight:"900",color:C.ink,marginTop:5},heroTitleDesktop:{fontSize:52,lineHeight:56},heroSubtitle:{fontFamily:font,fontSize:17,fontWeight:"600",color:C.ink,marginTop:12},heroBody:{fontFamily:font,fontSize:12,lineHeight:19,color:C.muted,marginTop:7,maxWidth:490},heroSelector:{marginTop:22,maxWidth:360},heroArt:{width:"100%",height:190},heroArtDesktop:{width:"57%",height:280},cafeMotor:{width:"100%",height:"100%"},

  homeHero:{minHeight:340,borderRadius:18,overflow:"hidden",justifyContent:"flex-end",borderWidth:1,borderColor:C.line,backgroundColor:"#D7C3B1"},homeHeroDesktop:{minHeight:360,justifyContent:"center"},heroBackgroundPhoto:{position:"absolute",left:0,width:"100%",aspectRatio:1350/2048},heroWash:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(248,243,236,.72)"},heroWashDesktop:{right:"42%",backgroundColor:"rgba(248,243,236,.80)"},homeHeroCopy:{zIndex:2,padding:25,paddingTop:32},homeHeroCopyDesktop:{width:"48%",padding:38,paddingLeft:42},homeOverline:{fontFamily:font,fontSize:11,fontWeight:"700",letterSpacing:2.2,color:C.muted},homeHeroTitle:{fontFamily:font,fontSize:32,lineHeight:38,fontWeight:"900",color:C.ink,marginTop:7},homeHeroTitleDesktop:{fontSize:44,lineHeight:50},homeHeroSubtitle:{fontFamily:font,fontSize:17,lineHeight:24,color:C.ink,maxWidth:380,marginTop:13},heroButton:{alignSelf:"flex-start",height:47,minWidth:230,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:14,borderRadius:24,backgroundColor:C.deep,paddingHorizontal:21,marginTop:19},heroButtonText:{fontFamily:font,color:"#FFF",fontSize:13,fontWeight:"600"},homeDate:{width:"100%",maxWidth:370,marginTop:20},

  selector:{minHeight:58,flexGrow:1,minWidth:210,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:12,borderRadius:11,borderWidth:1,borderColor:C.line,backgroundColor:C.paper},selectorCompact:{minHeight:56,minWidth:0},selectorIcon:{width:34,height:34,borderRadius:17,backgroundColor:"#F1E3D5",alignItems:"center",justifyContent:"center"},selectorCopy:{flex:1},filterLabel:{fontFamily:font,fontSize:9,color:C.muted},selectorValue:{fontFamily:font,fontSize:12,fontWeight:"600",color:C.ink,marginTop:3},filterStrip:{flexDirection:"row",flexWrap:"wrap",gap:10,marginBottom:18},

  exploreHead:{marginTop:25,marginBottom:15},exploreTitle:{fontFamily:font,fontSize:23,fontWeight:"900",color:C.ink},exploreSub:{fontFamily:font,fontSize:12,color:C.muted,marginTop:4},analyticsGrid:{flexDirection:"row",flexWrap:"wrap",gap:12},analyticsCard:{minHeight:215,borderRadius:14,borderWidth:1,borderColor:C.line,backgroundColor:C.paper,padding:18},analyticsIcon:{width:54,height:54,borderRadius:27,backgroundColor:"#F0DDC9",alignItems:"center",justifyContent:"center"},analyticsTitle:{fontFamily:font,fontSize:15,fontWeight:"800",color:C.ink,marginTop:15},analyticsDescription:{fontFamily:font,fontSize:11,lineHeight:17,color:C.muted,marginTop:8,paddingRight:8},cardArrow:{position:"absolute",right:15,bottom:14},bottomBanner:{minHeight:86,flexDirection:"row",alignItems:"center",gap:14,marginTop:26,borderRadius:14,borderWidth:1,borderColor:C.line,backgroundColor:"#F4EADF",padding:16,overflow:"hidden"},bannerIcon:{width:46,height:46,borderRadius:23,backgroundColor:"#EBCFB4",alignItems:"center",justifyContent:"center"},bannerTitle:{fontFamily:font,fontSize:13,fontWeight:"800",color:C.ink},bannerMotor:{width:110,height:58},

  homeCardsGrid:{flexDirection:"row",flexWrap:"wrap",gap:12,marginTop:14},homeNavCard:{minHeight:260,borderRadius:13,borderWidth:1,borderColor:C.line,backgroundColor:C.paper,overflow:"hidden"},homeCardImage:{width:"100%",height:135},homeCardImageFrame:{width:"100%",height:135,overflow:"hidden",backgroundColor:"#FBF5E5"},menuCropImage:{position:"absolute",top:-20,left:0,width:"100%",aspectRatio:1061/1500},homeCardBlank:{width:"100%",height:135,backgroundColor:"#F2ECE5"},homeCardIcon:{position:"absolute",top:108,left:14,width:50,height:50,borderRadius:25,backgroundColor:"#F2E2D2",borderWidth:3,borderColor:C.paper,alignItems:"center",justifyContent:"center"},homeCardBody:{paddingHorizontal:15,paddingTop:27,paddingBottom:42},homeCardTitle:{fontFamily:font,fontSize:13,fontWeight:"800",color:C.ink},homeCardText:{fontFamily:font,fontSize:10,lineHeight:16,color:C.muted,marginTop:6},homeArrow:{position:"absolute",right:12,bottom:11,width:36,height:36,borderRadius:18,backgroundColor:"#F1E4D7",alignItems:"center",justifyContent:"center"},homeBanner:{minHeight:98,flexDirection:"row",alignItems:"center",gap:14,marginTop:20,borderRadius:14,borderWidth:1,borderColor:C.line,backgroundColor:"#F5ECE2",padding:16,overflow:"hidden"},homeBannerImage:{width:180,height:64,opacity:.48},

  pageHeading:{flexDirection:"row",alignItems:"flex-start",gap:13,marginBottom:20},backButton:{width:40,height:40,borderRadius:20,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},pageTitle:{fontFamily:font,fontSize:27,fontWeight:"900",color:C.ink,marginTop:3},pageSubtitle:{fontFamily:font,fontSize:12,color:C.muted,marginTop:5,maxWidth:650},kicker:{fontFamily:font,fontSize:9,fontWeight:"800",letterSpacing:1.5,color:C.tan},card:{borderRadius:16,borderWidth:1,borderColor:C.line,backgroundColor:C.paper,padding:20,marginBottom:12},panelHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:15},panelTitle:{fontFamily:font,fontSize:18,fontWeight:"800",color:C.ink,marginTop:3},demoBadge:{fontFamily:font,fontSize:8,fontWeight:"800",color:C.brown,backgroundColor:"#F0E2D5",paddingHorizontal:9,paddingVertical:6,borderRadius:12},

  twoCol:{flexDirection:"row",flexWrap:"wrap",gap:12},flexPanel:{flex:1,minWidth:280},kpiGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},kpi:{width:"23.8%",minWidth:150,minHeight:135},kpiLabel:{fontFamily:font,fontSize:10,color:C.muted,marginTop:14},kpiValue:{fontFamily:font,fontSize:23,fontWeight:"900",color:C.ink,marginTop:5},chart:{height:235,alignItems:"flex-end",paddingHorizontal:4,paddingTop:42},barCol:{width:64,height:195,alignItems:"center",justifyContent:"flex-end"},barTrack:{height:172,width:37,justifyContent:"flex-end"},bar:{width:37,borderRadius:5,backgroundColor:C.brown},axis:{fontFamily:font,fontSize:9,color:C.muted,marginTop:7},tooltip:{position:"absolute",top:0,zIndex:3,minWidth:94,backgroundColor:C.deep,borderRadius:8,padding:7,alignItems:"center"},tooltipMain:{fontFamily:font,fontSize:9,fontWeight:"800",color:"#FFF"},tooltipSub:{fontFamily:font,fontSize:8,color:"#E8DCD4",marginTop:2},

  productRow:{paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.line},between:{flexDirection:"row",justifyContent:"space-between"},rowTitle:{fontFamily:font,fontSize:12,fontWeight:"700",color:C.ink},rowValue:{fontFamily:font,fontSize:11,fontWeight:"700",color:C.ink},progress:{height:7,borderRadius:5,backgroundColor:"#EEE8E1",overflow:"hidden",marginTop:8},progressFill:{height:7,borderRadius:5,backgroundColor:C.tan},detail:{fontFamily:font,fontSize:10,lineHeight:16,color:C.muted,marginTop:6},featureValue:{fontFamily:font,fontSize:35,fontWeight:"900",color:C.ink,marginVertical:10},featureTitle:{fontFamily:font,fontSize:26,fontWeight:"900",color:C.ink,marginTop:7},periodLabel:{fontFamily:font,fontSize:9,fontWeight:"800",letterSpacing:1.2,color:C.muted,marginTop:15},periodPeak:{backgroundColor:"#F0F4EE"},periodOff:{backgroundColor:"#F8EDE7"},

  regionRow:{flexDirection:"row",alignItems:"center",gap:10,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line},rank:{width:32,height:32,borderRadius:16,backgroundColor:"#EEDFD1",alignItems:"center",justifyContent:"center"},rankText:{fontFamily:font,fontSize:11,fontWeight:"800",color:C.brown},empty:{alignItems:"center",paddingVertical:40,paddingHorizontal:18},emptyIcon:{width:64,height:64,borderRadius:32,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center",backgroundColor:C.cream},emptyTitle:{fontFamily:font,fontSize:17,fontWeight:"800",color:C.ink,marginTop:15},emptyText:{fontFamily:font,fontSize:11,lineHeight:18,color:C.muted,textAlign:"center",maxWidth:510,marginTop:7},note:{fontFamily:font,fontSize:10,lineHeight:16,color:C.muted},reportLine:{fontFamily:font,fontSize:17,fontWeight:"800",color:C.ink,marginBottom:8},

  shade:{flex:1,backgroundColor:"rgba(38,27,23,.48)",alignItems:"center",justifyContent:"center",padding:20},optionSheet:{maxHeight:"90%",width:"100%",maxWidth:440,borderRadius:18,backgroundColor:C.paper,padding:12},optionTitle:{fontFamily:font,fontSize:17,fontWeight:"800",padding:10,color:C.ink},optionRow:{minHeight:48,borderRadius:10,paddingHorizontal:12,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},optionActive:{backgroundColor:C.cream},optionText:{fontFamily:font,fontSize:13,color:C.ink},infoMenu:{width:"100%",maxWidth:360,borderRadius:18,backgroundColor:C.paper,padding:18},menuTitle:{fontFamily:font,fontSize:18,fontWeight:"800",color:C.ink,marginBottom:10},menuText:{fontFamily:font,fontSize:11,lineHeight:18,color:C.muted,paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.line},menuRow:{paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.line},

  performanceHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",gap:20,marginBottom:18},performanceHeadCompact:{flexDirection:"column",alignItems:"stretch"},breadcrumb:{flexDirection:"row",alignItems:"center",gap:5,marginBottom:8},breadcrumbMuted:{fontFamily:font,fontSize:11,color:C.muted},breadcrumbCurrent:{fontFamily:font,fontSize:11,fontWeight:"700",color:C.ink},performanceTitleRow:{flexDirection:"row",alignItems:"center",gap:10,flexWrap:"wrap"},performanceTitle:{fontFamily:font,fontSize:31,lineHeight:35,fontWeight:"900",color:C.ink},demoDataBadge:{fontFamily:font,fontSize:8,fontWeight:"900",letterSpacing:1,color:C.brown,backgroundColor:"#F0E2D5",paddingHorizontal:9,paddingVertical:5,borderRadius:10},performanceSubtitle:{fontFamily:font,fontSize:13,color:C.muted,marginTop:3},performanceActions:{flexDirection:"row",alignItems:"center",gap:12,flexWrap:"wrap"},performanceDate:{width:310,maxWidth:"100%"},exportButton:{height:44,flexDirection:"row",alignItems:"center",gap:8,borderRadius:8,backgroundColor:"#704126",paddingHorizontal:21},exportText:{fontFamily:font,fontSize:12,fontWeight:"700",color:"#FFF"},performanceKpis:{flexDirection:"row",flexWrap:"wrap",gap:10},performanceKpi:{flex:1,minWidth:225,minHeight:120,marginBottom:10,flexDirection:"row",alignItems:"center",gap:13,padding:16},performanceKpiIcon:{width:58,height:58,borderRadius:29,backgroundColor:"#F1DFCC",alignItems:"center",justifyContent:"center"},performanceKpiLabel:{fontFamily:font,fontSize:11,color:C.ink},performanceKpiValue:{fontFamily:font,fontSize:23,fontWeight:"900",color:C.ink,marginTop:6},performanceDelta:{fontFamily:font,fontSize:10,fontWeight:"700",marginTop:8},performanceCompare:{color:C.muted,fontWeight:"400"},performanceMain:{width:"100%",flexDirection:"row",alignItems:"stretch",gap:10},performanceChartCard:{flex:2,minWidth:0,height:290,padding:16},breakdownCard:{flex:1,minWidth:0,height:290,padding:14},breakdownScroll:{flex:1,marginTop:8},performancePanelTitleRow:{flexWrap:"wrap",flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},performancePanelTitle:{fontFamily:font,fontSize:15,fontWeight:"900",color:C.ink},legend:{flexDirection:"row",alignItems:"center",gap:6},legendDot:{width:9,height:9,borderRadius:5,marginLeft:7},legendText:{fontFamily:font,fontSize:9,color:C.ink},performanceChartScroll:{flexGrow:1},comboChart:{height:215,flexDirection:"row",alignItems:"flex-end",paddingTop:35},comboCol:{height:190,alignItems:"center",justifyContent:"flex-end"},comboPlot:{height:155,width:"74%",maxWidth:54,alignItems:"center",justifyContent:"flex-end"},receiptBar:{width:"72%",maxWidth:36,backgroundColor:"#E6CDB6",borderTopLeftRadius:3,borderTopRightRadius:3},salesDot:{position:"absolute",width:9,height:9,borderRadius:5,backgroundColor:"#67260F",borderWidth:2,borderColor:C.paper},comboAxis:{fontFamily:font,fontSize:9,color:C.muted,marginTop:7},performanceTooltip:{position:"absolute",top:0,zIndex:5,minWidth:125,borderRadius:8,backgroundColor:C.deep,padding:9},table:{width:"100%",minWidth:465},tableRow:{height:29,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#ECE5DE"},tableHead:{backgroundColor:"#F4F0EB"},tableHeadText:{flex:1,minWidth:93,fontFamily:font,fontSize:9,fontWeight:"800",color:C.ink,paddingHorizontal:7},tableCell:{flex:1,minWidth:93,fontFamily:font,fontSize:9,color:C.ink,paddingHorizontal:7},smallCharts:{width:"100%",flexDirection:"row",flexWrap:"wrap",gap:10},smallChartCard:{flex:1,minWidth:240,padding:15},smallChartTitle:{fontFamily:font,fontSize:13,fontWeight:"900",color:C.ink},miniChart:{height:110,flexDirection:"row",alignItems:"flex-end",marginTop:8},miniCol:{flex:1,alignItems:"center"},miniPlot:{height:82,width:"100%",alignItems:"center",justifyContent:"flex-end",borderBottomWidth:1,borderBottomColor:C.line},miniZero:{position:"absolute",top:41,left:0,right:0,height:1,backgroundColor:"#CFC6BE"},miniBar:{position:"absolute",width:"55%",maxWidth:18,borderTopLeftRadius:2,borderTopRightRadius:2},miniDot:{position:"absolute",width:7,height:7,borderRadius:4,backgroundColor:"#6A2D16"},miniTooltip:{position:"absolute",top:-30,zIndex:5,minWidth:64,alignItems:"center",backgroundColor:C.deep,borderRadius:6,paddingHorizontal:6,paddingVertical:4},miniTooltipText:{fontFamily:font,fontSize:7,color:"#EADFD8"},miniTooltipValue:{fontFamily:font,fontSize:8,fontWeight:"800",color:"#FFF",marginTop:1},miniAxis:{fontFamily:font,fontSize:7,color:C.muted,marginTop:4},performanceBottom:{width:"100%",flexDirection:"row",gap:10},highlightsCard:{flex:1.05},takeawayCard:{flex:1,flexDirection:"row",alignItems:"center",gap:14,backgroundColor:"#FBF6F0",overflow:"hidden"},takeawayArt:{position:"absolute",right:-15,bottom:-18,width:285,height:120,opacity:.18},takeawayCopy:{flex:1,zIndex:1,paddingRight:0},highlightRow:{flexDirection:"row",flexWrap:"wrap",gap:9,marginTop:10},highlightItem:{flex:1,minWidth:145,borderRadius:10,padding:10,flexDirection:"row",alignItems:"center",gap:9},highlightLabel:{fontFamily:font,fontSize:9,fontWeight:"700",color:C.ink},highlightValue:{fontFamily:font,fontSize:16,fontWeight:"900",color:C.ink,marginTop:3},highlightMonth:{fontFamily:font,fontSize:8,color:C.muted,marginTop:3},takeawayIcon:{zIndex:1,width:53,height:53,borderRadius:27,backgroundColor:"#F2DDC9",alignItems:"center",justifyContent:"center"},takeawayTitle:{fontFamily:font,fontSize:15,fontWeight:"900",color:C.ink},takeawayText:{fontFamily:font,fontSize:10,lineHeight:16,color:C.muted,marginTop:7}

});




const s=baseStyles;
