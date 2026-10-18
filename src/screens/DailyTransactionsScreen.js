import {PaymentBreakdown} from '../components/PaymentMethods';
import {useDatabase} from '../state/DatabaseContext';
import {api} from '../services/api';
import ExportControl from '../components/ExportControl';
import {DataTable,DateRange,Action} from '../components/DatabaseWidgets';
import {manilaDay,manilaTime} from '../services/menuEntriesRepository';
import {useResponsiveStyles} from '../hooks/useResponsiveStyles';
import ResponsiveSelect from '../components/ResponsiveSelect';

import React, { useEffect, useMemo, useState } from "react";

import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";



const initialRows = [

  ["10:42 AM","Spanish Latte","Coffee-Based",2,85,"Cash"],

  ["10:42 AM","Classic Burger","Burgers",1,149,"GCash"],

  ["10:37 AM","Flavored Fries","Snacks",1,85,"Cash"],

  ["10:35 AM","Varoom Classic","Coffee-Based",1,65,"Cash"],

  ["10:28 AM","Matcha","Milk-Based",1,85,"Maya"],

  ["10:25 AM","Strawberry Soda","Fruit Soda",2,59,"GCash"],

  ["10:21 AM","Chicken Fillet","Rice Meals",1,129,"Cash"],

  ["10:18 AM","Americano","Coffee-Based",1,75,"Card"],

  ["10:15 AM","Mango Milk","Milk-Based",2,85,"GCash"],

  ["10:12 AM","Cheese Burger","Burgers",1,169,"Cash"]

].map(([time,item,category,qty,price,payment],i)=>({id:i+1,time,item,category,qty,price,payment}));



const menuItems=[

  ["Spanish Latte","Coffee-Based",85],["Classic Burger","Burgers",149],["Flavored Fries","Snacks",85],

  ["Varoom Classic","Coffee-Based",65],["Matcha","Milk-Based",85],["Strawberry Soda","Fruit Soda",59],

  ["Chicken Fillet","Rice Meals",129],["Americano","Coffee-Based",75],["Mango Milk","Milk-Based",85],["Cheese Burger","Burgers",169]

];

const payments=["Cash","GCash","Maya","Card"];

const paymentColors={Cash:"#704025",GCash:"#4F8ED8",Maya:"#58A968",Card:"#DE6B70"};

const paymentPales={Cash:"#F2E5D8",GCash:"#DCEBFF",Maya:"#DDF2E3",Card:"#FBE0E0"};

const peso=n=>`\u20B1${Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;



function Panel({children,style}) { const styles=useResponsiveStyles(baseStyles); return <View style={[styles.panel,style]}>{children}</View>; }

function Dropdown({label,value,options,onChange,required}) { const styles=useResponsiveStyles(baseStyles); return <View style={{flex:1,minWidth:0,gap:6}}><Text style={{fontSize:12}}>{label}{required?' *':''}</Text><ResponsiveSelect label={label} value={value} options={options} onChange={onChange} width="100%"/></View>;}



export default function DailyTransactionsScreen({navigate,width}) {
 const styles=useResponsiveStyles(baseStyles),db=useDatabase();
 const [from,setFrom]=useState(manilaDay()),[to,setTo]=useState(manilaDay()),[search,setSearch]=useState(''),[product,setProduct]=useState('All Products'),[sort,setSort]=useState('Newest first'),[selected,setSelected]=useState(null),[reason,setReason]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const rows=db.entries.filter(e=>e.status==='saved'&&(!from||e.day>=from)&&(!to||e.day<=to)&&(product==='All Products'||e.name===product)&&(!search.trim()||`${e.name} ${e.category} ${e.day}`.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>sort==='Newest first'?b.savedAt.localeCompare(a.savedAt):a.savedAt.localeCompare(b.savedAt));
 const saved=rows.filter(e=>e.status==='saved'),sales=saved.reduce((a,e)=>a+e.total,0),quantity=saved.reduce((a,e)=>a+e.quantity,0);
 useEffect(()=>{if(selected&&!db.entries.some(e=>e.id===selected.id&&e.status==='saved')){setSelected(null);setReason('');}},[db.entries,selected]);
 const reverse=async()=>{if(busy||!selected)return;setBusy(true);try{await api('/entries/'+selected.id+'/reverse',{reason});await db.refresh();setSelected(null);setReason('');setMessage('Entry reversed; original record and audit trail preserved.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 return <><View style={styles.head}><View><Text style={styles.title}>Daily Transactions</Text><Text style={styles.subtitle}>Saved manual sales entries - not customer receipts</Text></View><Action label="Add Transaction" onPress={()=>navigate('products')}/></View>
 <DateRange {...{from,to,setFrom,setTo}}/>{!!db.manualError&&<Text style={styles.subtitle}>{db.manualError}</Text>}{!!message&&<Text accessibilityLiveRegion="polite">{message}</Text>}
 <View style={styles.kpiGrid}>{[['Saved Entries',saved.length,'receipt-text-outline'],['Total Sales',peso(sales),'cash-multiple'],['Items Sold',quantity,'cart-outline'],['Average Entry',saved.length?peso(sales/saved.length):'Unavailable','receipt']].map(([label,value,icon])=><Panel key={label} style={styles.kpi}><View style={styles.kpiIcon}><MaterialCommunityIcons name={icon} size={27} color="#63341F"/></View><View style={{flex:1}}><Text style={styles.kpiLabel}>{label}</Text><Text style={styles.kpiValue}>{value}</Text></View></Panel>)}</View>
 <View style={[styles.mainGrid,width<1050&&styles.mainStack]}><Panel style={styles.transactionsPanel}><View style={styles.tableTools}><View style={styles.search}><TextInput accessibilityLabel="Search transactions" placeholder="Search transactions..." value={search} onChangeText={setSearch} style={styles.searchInput}/>{!!search&&<Action label="Clear" onPress={()=>setSearch('')}/>}</View><ResponsiveSelect label="Product filter" value={product} options={['All Products',...db.products.map(p=>p.name)]} onChange={setProduct}/><ResponsiveSelect label="Sort entries" value={sort} options={['Newest first','Oldest first']} onChange={setSort}/><ExportControl type="daily" filters={{from:from||null,to:to||null,search,sort,productId:db.products.find(p=>p.name===product)?.id}}/></View>
 <DataTable columns={['Saved at (PHT)','Menu item','Quantity','Unit price','Total','Payment Method','Status','Actions']} rows={rows.map(e=>[e.day+' '+manilaTime(e.savedAt),e.name,e.quantity,peso(e.price),peso(e.total),e.paymentMethod,e.status,<Action label="View Details" onPress={()=>setSelected(e)}/>])}/></Panel>
 <View style={[styles.rightRail,width<1050&&{width:"100%"}]}><Panel style={styles.detailPanel}><Text style={styles.panelTitle}>Transaction Details</Text>{selected?<View style={{gap:12,marginTop:12}}><Text>{selected.name}</Text><Text>{selected.day} {manilaTime(selected.savedAt)} PHT</Text><Text>{selected.quantity} x {peso(selected.price)} = {peso(selected.total)}</Text><Text>Status: {selected.status}</Text><Text>Payment method: {selected.paymentMethod}</Text>{selected.status==='saved'&&<><Text>Correction: reverse this entry, then save a replacement if needed.</Text><TextInput accessibilityLabel="Reversal reason" placeholder="Reason (at least 5 characters)" value={reason} onChangeText={setReason} multiline style={{minHeight:66,borderWidth:1,borderColor:'#DFD3C8',padding:10}}/><Action label={busy?'Reversing...':'Confirm Reversal'} disabled={busy||reason.trim().length<5} onPress={reverse}/></>}</View>:<Text style={styles.emptyDetailText}>Select an entry to view details. Original entries are never deleted.</Text>}</Panel><PaymentBreakdown entries={rows}/></View></View></>;
}

const baseStyles=StyleSheet.create({

  head:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",gap:14,marginBottom:12},headStack:{flexDirection:"column",alignItems:"stretch"},breadcrumb:{flexDirection:"row",alignItems:"center",gap:5,marginBottom:8},muted:{fontSize:10,color:"#718096"},breadcrumbCurrent:{fontSize:11,fontWeight:"700",color:"#181311"},titleRow:{flexDirection:"row",alignItems:"center",gap:10,flexWrap:"wrap"},title:{fontSize:31,fontWeight:"900",color:"#181311"},demoBadge:{fontSize:8,fontWeight:"900",letterSpacing:1,color:"#65402D",backgroundColor:"#F0E0D1",paddingHorizontal:9,paddingVertical:5,borderRadius:10},subtitle:{fontSize:12,color:"#667386",marginTop:2},headActions:{flexDirection:"row",alignItems:"center",gap:14,flexWrap:"wrap"},dateButton:{width:335,maxWidth:"100%",height:45,borderWidth:1,borderColor:"#E0D8D0",borderRadius:8,backgroundColor:"#FFF",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:15},dateText:{flex:1,fontSize:11,fontWeight:"700"},addButton:{height:45,borderRadius:7,backgroundColor:"#744126",flexDirection:"row",alignItems:"center",gap:8,paddingHorizontal:20},addText:{fontSize:11,color:"#FFF"},panel:{maxWidth:"100%",borderWidth:1,borderColor:"#E5DDD6",borderRadius:10,backgroundColor:"#FFF",padding:14,marginBottom:10},kpiGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},kpi:{flex:1,minWidth:220,minHeight:96,flexDirection:"row",alignItems:"center",gap:14},kpiIcon:{width:49,height:49,borderRadius:25,backgroundColor:"#F2DFCC",alignItems:"center",justifyContent:"center"},kpiLabel:{fontSize:10,color:"#1C1714"},kpiValue:{fontSize:20,fontWeight:"900",marginTop:7},kpiChange:{fontSize:10,fontWeight:"700",color:"#0A9B51",marginTop:8},mainGrid:{width:"100%",flexDirection:"row",gap:10,alignItems:"flex-start"},mainStack:{flexDirection:"column",alignItems:"stretch"},transactionsPanel:{width:"100%",flex:1,minWidth:0,padding:0,overflow:"hidden"},tableTools:{flexWrap:"wrap",padding:8,minHeight:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10,borderBottomWidth:1,borderBottomColor:"#E7E0DA",paddingRight:12},tabs:{paddingLeft:8},tab:{height:43,minWidth:70,paddingHorizontal:13,alignItems:"center",justifyContent:"center",borderBottomWidth:3,borderBottomColor:"transparent"},activeTab:{borderBottomColor:"#6A351F"},tabText:{fontSize:10,color:"#526075"},activeTabText:{fontWeight:"800",color:"#231A15"},toolRight:{flexWrap:"wrap",flexDirection:"row",alignItems:"center",gap:10},search:{maxWidth:"100%",width:205,height:39,flexDirection:"row",alignItems:"center",gap:7,borderWidth:1,borderColor:"#E4DDD7",borderRadius:7,paddingHorizontal:10},searchInput:{flex:1,fontSize:9,outlineStyle:"none"},exportButton:{height:39,flexDirection:"row",alignItems:"center",gap:8,borderWidth:1,borderColor:"#E4DDD7",borderRadius:7,paddingHorizontal:12},exportText:{fontSize:10},table:{minWidth:895},row:{minHeight:42,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#ECE6E0",paddingHorizontal:8},selectedRow:{backgroundColor:"#FBF0E5"},tableHead:{minHeight:34,backgroundColor:"#F6F3EF"},cell0:{flex:.35,minWidth:34,fontSize:9,color:"#3C4858"},cell1:{flex:.8,minWidth:78,fontSize:9,color:"#3C4858"},cell2:{flex:1.65,minWidth:165,fontSize:9,color:"#3C4858"},cell2Wrap:{flex:1.65,minWidth:165,flexDirection:"row",alignItems:"center",gap:9},productIcon:{width:33,height:33,borderRadius:6,backgroundColor:"#F0E0D1",alignItems:"center",justifyContent:"center"},itemText:{fontSize:9,color:"#344054"},cell3:{flex:1.1,minWidth:110,fontSize:9,color:"#526075"},cell4:{flex:.5,minWidth:50,fontSize:9,textAlign:"center"},cell5:{flex:1,minWidth:100,fontSize:9,textAlign:"center"},cell6:{flex:.9,minWidth:90,fontSize:9,textAlign:"center"},cell7:{flex:1.05,minWidth:105,alignItems:"center"},cell8:{flex:.4,minWidth:40,alignItems:"center"},paymentBadge:{fontSize:9,fontWeight:"700",paddingHorizontal:9,paddingVertical:5,borderRadius:5},empty:{padding:35,textAlign:"center",color:"#777"},tableFooter:{flexWrap:"wrap",minHeight:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:13,gap:10},footerText:{fontSize:9,color:"#536071"},pages:{flexDirection:"row",alignItems:"center",gap:13},pageButton:{width:31,height:31,borderWidth:1,borderColor:"#E3DDD7",borderRadius:6,alignItems:"center",justifyContent:"center"},pageNumber:{width:29,height:29,alignItems:"center",justifyContent:"center",borderRadius:5},currentPage:{backgroundColor:"#6E3B23"},currentPageText:{color:"#FFF"},rightRail:{width:310},rightRailWide:{width:"100%",flexDirection:"column",flexWrap:"wrap",gap:10},detailPanel:{minHeight:145},panelTitleRow:{flexDirection:"row",alignItems:"center",gap:12},panelTitle:{fontSize:14,fontWeight:"900",color:"#1C1512"},emptyDetail:{flex:1,alignItems:"center",justifyContent:"center",paddingTop:28},emptyDetailText:{fontSize:10,color:"#778494",marginTop:8},detailBody:{alignItems:"center",paddingTop:18},detailItem:{fontSize:14,fontWeight:"800"},detailLine:{fontSize:10,color:"#687385",marginTop:5},detailTotal:{fontSize:20,fontWeight:"900",marginVertical:8},quickPanel:{position:"relative",zIndex:50,minHeight:215},quickFields:{flexDirection:"row",gap:12,marginTop:15},field:{position:"relative",flex:1,minWidth:0,marginTop:10,zIndex:100},fieldLabel:{fontSize:9,color:"#4F5A6B",marginBottom:6},required:{color:"#B43D32"},dropdown:{height:38,borderWidth:1,borderColor:"#DDD6D0",borderRadius:6,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:10},dropdownText:{fontSize:9,flex:1},placeholder:{color:"#8490A0"},dropdownMenu:{position:"absolute",top:58,elevation:20,left:0,right:0,zIndex:10,maxHeight:180,borderWidth:1,borderColor:"#DDD6D0",borderRadius:6,backgroundColor:"#FFF",zIndex:999,shadowColor:"#000",shadowOpacity:.15,shadowRadius:8},option:{minHeight:35,justifyContent:"center",paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:"#EEE8E3"},optionText:{fontSize:9},quantityField:{width:100,marginTop:10},quantityBox:{height:38,borderWidth:1,borderColor:"#DDD6D0",borderRadius:6,flexDirection:"row",alignItems:"center",paddingHorizontal:8},quantityInput:{flex:1,fontSize:10,outlineStyle:"none"},submitButton:{height:40,alignItems:"center",justifyContent:"center",borderRadius:6,backgroundColor:"#743F24",marginTop:12},disabled:{opacity:.45},submitText:{fontSize:11,color:"#FFF",fontWeight:"700"},paymentPanel:{minHeight:175},paymentBody:{flexWrap:"wrap",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:18,marginTop:12},donut:{width:105,height:105,borderRadius:53,alignItems:"center",justifyContent:"center",backgroundColor:"#704025"},donutHole:{width:64,height:64,borderRadius:32,backgroundColor:"#FFF",alignItems:"center",justifyContent:"center"},donutValue:{fontSize:11,fontWeight:"900"},donutLabel:{fontSize:8,color:"#667386",marginTop:3},paymentLegend:{flex:1},legendRow:{height:27,flexDirection:"row",alignItems:"center",gap:7},legendDot:{width:10,height:10,borderRadius:5},legendName:{flex:1,fontSize:9,color:"#425066"},legendPercent:{fontSize:9,color:"#425066"}

});

