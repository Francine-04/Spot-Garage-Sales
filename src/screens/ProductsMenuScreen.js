import {useRef} from 'react';
import {useDatabase} from '../state/DatabaseContext';
import {api,newRequestKey} from '../services/api';
import ExportControl from '../components/ExportControl';
import {useContext} from 'react';
import {layoutWidthContext, tokens} from '../theme/designTokens';
import {useResponsiveStyles} from '../hooks/useResponsiveStyles';
import React, {useEffect,useState} from 'react';

import {Modal,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';

import {MaterialCommunityIcons as Icon} from '@expo/vector-icons';

import {menuItems,menuGroups,categoryIcons} from '../data/menuData';

import {manilaDay,manilaTime} from '../services/menuEntriesRepository';



const peso=n=>'\u20B1'+n.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});

const label=day=>new Date(day+'T12:00:00+08:00').toLocaleDateString('en-PH',{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric'});

function Button({title,onPress,disabled}) {return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:.4}]}><Text style={{color:'#FFF',fontSize:13}}>{title}</Text></Pressable>;}

export default function ProductsMenuScreen({navigate,width,viewportHeight=900}) {

 const db=useDatabase(); const saving=useRef(new Set()),requests=useRef({}); const [busy,setBusy]=useState({});
 const batchLock=useRef(false);
 const [batchBusy,setBatchBusy]=useState(false),[clearConfirm,setClearConfirm]=useState(null);
 const [offline,setOffline]=useState(typeof navigator!=='undefined'&&navigator.onLine===false);

 useEffect(()=>{if(typeof window==='undefined')return;const sync=()=>setOffline(!navigator.onLine);window.addEventListener('online',sync);window.addEventListener('offline',sync);return()=>{window.removeEventListener('online',sync);window.removeEventListener('offline',sync);};},[]);

 const [entries,setEntries]=useState([]),[drafts,setDrafts]=useState({}),[category,setCategory]=useState('All Items'),[search,setSearch]=useState(''),[day,setDay]=useState(manilaDay()),[message,setMessage]=useState(''),[history,setHistory]=useState(null);

 const [items,setItems]=useState([]),[adding,setAdding]=useState(false),[name,setName]=useState(''),[price,setPrice]=useState(''),[newCategory,setNewCategory]=useState('Coffee-Based'),[error,setError]=useState('');

 useEffect(()=>{setEntries(db.entries);setItems(db.products.filter(p=>p.active));setDay(manilaDay());},[db.entries,db.products]);

 const availableWidth=useContext(layoutWidthContext)||width;
 const s=useResponsiveStyles(baseStyles,availableWidth);
 const today=entries.filter(e=>e.day===day&&e.status==='saved'),compact=availableWidth<1064,mobile=availableWidth<680;
 const [helpOpen,setHelpOpen]=useState(false);
 const railWidth=availableWidth<1200?292:320;

 const filtered=items.filter(i=>(category==='All Items'||i.category===category)&&(i.name+' '+i.category).toLowerCase().includes(search.toLowerCase().trim()));

 const total=today.reduce((a,e)=>({qty:a.qty+e.quantity,sales:a.sales+e.total}),{qty:0,sales:0});

 const update=(id,value)=>{if(!batchLock.current&&!saving.current.has(id))setDrafts(d=>({...d,[id]:value}));};
 const pending=items.reduce((sum,item)=>sum+Number(drafts[item.id]||0)*item.price,0);

 const save=async item=>{if(saving.current.has(item.id))return;const quantity=Number(drafts[item.id]||0);if(!Number.isInteger(quantity)||quantity<=0||quantity>100000){setMessage('Enter a whole quantity from 1 to 100,000.');return;}if(offline){setMessage('Connect before saving.');return;}saving.current.add(item.id);setBusy(v=>({...v,[item.id]:true}));try{let request=requests.current[item.id];if(!request||request.quantity!==quantity)request=requests.current[item.id]={quantity,key:newRequestKey()};const entry=await api('/entries',{productId:item.id,quantity,idempotencyKey:request.key});setDrafts(d=>({...d,[item.id]:'0'}));delete requests.current[item.id];setMessage(item.name+': '+entry.quantity+' saved at '+manilaTime(entry.saved_at)+' (Philippine time).');if(!batchLock.current)await db.refresh();return true;}catch(e){setMessage('Not confirmed: '+e.message+' Retry the same quantity to safely check this save.');}finally{saving.current.delete(item.id);setBusy(v=>({...v,[item.id]:false}));}};

 const saveAll=async()=>{
  if(batchLock.current||saving.current.size)return;
  const selected=items.filter(item=>Number(drafts[item.id])>0);
  if(!selected.length)return;
  if(selected.some(item=>!Number.isInteger(Number(drafts[item.id]))||Number(drafts[item.id])>100000)){setMessage('Enter whole quantities from 1 to 100,000.');return;}
  batchLock.current=true;setBatchBusy(true);let count=0;
  try{for(const item of selected){if(!await save(item))break;count++;}if(count===selected.length)setMessage(`Saved all ${count} menu items for today.`);}finally{await db.refresh();batchLock.current=false;setBatchBusy(false);}
 };
 const clearToday=async()=>{
  if(batchLock.current||!clearConfirm)return;
  batchLock.current=true;setBatchBusy(true);let count=0;
  try{for(const entry of clearConfirm){await api('/entries/'+entry.id+'/reverse',{reason:'Admin confirmed clearing today from Products and Menu'});count++;}setDrafts({});setClearConfirm(null);setMessage("Today's saved orders cleared. Sales totals have been updated.");}
  catch(e){setMessage(`Cleared ${count} entries. ${e.message} You can retry safely.`);}
  finally{await db.refresh();batchLock.current=false;setBatchBusy(false);}
 };

 const add=async()=>{if(!name.trim()||!price.trim()){setError('Enter a name and price.');return;}try{await api('/products',{name:name.trim(),category:newCategory,price:Number(price)});await db.refresh();setAdding(false);setName('');setPrice('');setError('');setMessage('Menu item saved to Supabase.');}catch(e){setError(e.message);}};

 const [panelWidth,setPanelWidth]=useState(0);
 const panelHeight=mobile?Math.max(380,Math.min(620,viewportHeight*.70)):Math.max(420,Math.min(650,viewportHeight-280));
 const tableWidth=Math.max(780,panelWidth-2); 
 const col=i=>({width:['26%','12%','12%','16%','26%','8%'][i],paddingHorizontal:i===5?4:12});

 const records=history==='all'?today:today.filter(e=>e.itemId===history?.id);

 return <View style={{gap:12,width:'100%'}}>

 <View style={s.heading}><View style={{flex:1,minWidth:240}}><Text style={s.title}>Products & Menu</Text><Text style={s.subtitle}>Manage menu items, view prices, and enter new quantities sold.</Text></View><View style={s.date}><Icon name="calendar-month" size={22} color="#704027"/><Text>{label(day)} (Today)</Text></View><Button title="+ Add Menu Item" onPress={()=>{setAdding(true);setError('');}}/></View>

 {!!db.manualError&&<Text style={s.message}>{db.manualError}</Text>}<View style={{flexDirection:'row',alignItems:'center',gap:10,flexWrap:'wrap'}}><ExportControl type="products" filters={{from:day,to:day}}/><Button title={batchBusy?'Please wait...':'Save All for Today'} disabled={batchBusy||Object.values(busy).some(Boolean)||!pending||offline||!!db.manualError} onPress={saveAll}/><Button title="Clear Today" disabled={batchBusy||Object.values(busy).some(Boolean)||!today.length||offline||!!db.manualError} onPress={()=>setClearConfirm([...today])}/>{pending>0&&<Text style={s.tiny}>Unsaved revenue: {peso(pending)}</Text>}</View>{offline&&<Text accessibilityLiveRegion="polite" style={s.message}>Offline: connect to the internet before saving sales. Your unsaved quantity remains in the input.</Text>}

{!!message&&<Text accessibilityLiveRegion="polite" style={s.message}>{message}</Text>} <View style={s.tabs}><ScrollView horizontal contentContainerStyle={{gap:6}}>{['All Items',...menuGroups.map(([n])=>n)].map(n=><Pressable accessibilityRole="tab" accessibilityState={{selected:category===n}} key={n} style={[s.tab,category===n&&s.active]} onPress={()=>setCategory(n)}><Icon name={categoryIcons[n]||'view-grid-outline'} size={21} color="#704027"/><Text style={s.text}>{n}</Text></Pressable>)}</ScrollView></View>

 <View style={[s.layout,compact&&{flexDirection:'column'}]}>

 <View onLayout={event=>setPanelWidth(event.nativeEvent.layout.width)} style={[s.panel,{height:panelHeight,flex:compact?undefined:1,width:compact?'100%':undefined}]}>

 <View style={s.toolbar}><Text style={s.section}>Menu Items (Daily Sales Entry)</Text><View style={s.search}><Icon name="magnify" size={19}/><TextInput accessibilityLabel="Search menu items" placeholder="Search menu items..." value={search} onChangeText={setSearch} style={{flex:1,fontSize:12}}/>{!!search&&<Pressable accessibilityLabel="Clear search" onPress={()=>setSearch('')}><Icon name="close" size={18}/></Pressable>}</View></View>

{mobile?<ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{flex:1}}>{filtered.map(item=>{const rows=today.filter(e=>e.itemId===item.id),value=drafts[item.id]||'0';return <View key={item.id} style={{padding:14,borderBottomWidth:1,borderColor:'#E8DDD2',gap:10}}>

<Text style={{fontSize:17,fontWeight:'700',color:'#29384D'}}>{item.name}</Text><Text style={s.text}>{item.category} · Unit price: {peso(item.price)}</Text>

<Text style={s.bold}>Total sold today: {rows.reduce((a,e)=>a+e.quantity,0)+Number(value)}</Text><Text style={s.bold}>Total sales today: {peso(rows.reduce((a,e)=>a+e.total,0)+Number(value)*item.price)}{Number(value)>0?' (includes unsaved)':''}</Text>

<Text style={s.text}>New quantity sold</Text><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><View style={[s.quantity,{minWidth:145,maxWidth:180,height:48}]}><Pressable accessibilityRole="button" accessibilityLabel={'Decrease '+item.name} style={{width:44,alignItems:'center',justifyContent:'center'}} onPress={()=>update(item.id,String(Math.max(0,Number(value)-1)))}><Text>-</Text></Pressable><TextInput accessibilityLabel={'New quantity sold for '+item.name} keyboardType="number-pad" style={[s.input,{fontSize:16}]} value={String(value)} onChangeText={v=>update(item.id,v.replace(/\D/g,''))}/><Pressable accessibilityRole="button" accessibilityLabel={'Increase '+item.name} style={{width:44,alignItems:'center',justifyContent:'center'}} onPress={()=>update(item.id,String(Number(value)+1))}><Text>+</Text></Pressable></View></View>

<Button title="Save Sale" disabled={batchBusy||!Number(value)||offline||!!busy[item.id]||!!db.manualError} onPress={()=>save(item)}/>

<Pressable accessibilityRole="button" accessibilityLabel={'View saved entries for '+item.name} onPress={()=>setHistory(item)} style={{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={s.bold}>Saved entries ({rows.length})</Text><Icon name="chevron-right" size={20}/></Pressable>

</View>})}{!filtered.length&&<Text style={s.empty}>No matching menu items.</Text>}</ScrollView>:<> <ScrollView horizontal style={{flex:1}} contentContainerStyle={{width:tableWidth}}><View style={{width:tableWidth,flex:1}}>

 <View style={[s.row,s.tableHead]}>{['Menu Item','Price','Sold Today','Revenue','New Quantity','History'].map((t,i)=><Text key={t} style={[s.text,col(i),{fontWeight:'600',textAlign:i>0&&i<4?'right':'left'}]}>{t}</Text>)}</View>

 <ScrollView nestedScrollEnabled style={{flex:1}}>{filtered.map((item,index)=>{const rows=today.filter(e=>e.itemId===item.id),qty=rows.reduce((a,e)=>a+e.quantity,0),sales=rows.reduce((a,e)=>a+e.total,0),value=drafts[item.id]||'0';return <View key={item.id} style={s.row}>

 <View style={[s.inline,col(0)]}><View style={s.icon}><Icon name={categoryIcons[item.category]||'food'} size={22} color="#704027"/></View><View style={{flex:1,gap:4}}><Text style={s.text}>{item.name}</Text><Text style={s.tiny}>{item.category}</Text></View></View>
<Text style={[s.text,col(1),{textAlign:'right'}]}>{peso(item.price)}</Text><Text style={[s.bold,col(2),{textAlign:'right'}]}>{qty+Number(value)}</Text><Text style={[s.bold,col(3),{textAlign:'right'}]}>{peso(sales+Number(value)*item.price)}{Number(value)>0&&<Text style={s.tiny}>{'\nIncludes unsaved'}</Text>}</Text>
<View style={[s.inline,col(4)]}><View style={s.quantity}><Pressable accessibilityRole="button" accessibilityLabel={'Decrease '+item.name} style={s.step} onPress={()=>update(item.id,String(Math.max(0,Number(value)-1)))}><Text>-</Text></Pressable><TextInput accessibilityLabel={'New quantity sold for '+item.name} keyboardType="number-pad" value={String(value)} onChangeText={t=>update(item.id,t.replace(/\D/g,''))} style={s.input}/><Pressable accessibilityRole="button" accessibilityLabel={'Increase '+item.name} style={s.step} onPress={()=>update(item.id,String(Number(value)+1))}><Text>+</Text></Pressable></View><Button title="Save" disabled={batchBusy||!Number(value)||offline||!!busy[item.id]||!!db.manualError} onPress={()=>save(item)}/></View>
<Pressable accessibilityRole="button" accessibilityLabel={'View entries for '+item.name} onPress={()=>setHistory(item)} style={[col(5),{minHeight:44,justifyContent:'center',alignItems:'center'}]}><Icon name="history" size={22} color="#704027"/><Text style={s.tiny}>{rows.length}</Text></Pressable>

 </View>;})}{!filtered.length&&<Text style={s.empty}>No matching menu items.</Text>}</ScrollView></View></ScrollView></>}

 <Text style={s.footer}>{filtered.length} of {items.length} menu items · Scroll inside this table for more</Text></View>

 <ScrollView nestedScrollEnabled style={{width:compact?'100%':railWidth,height:compact?undefined:panelHeight,flexGrow:0}} contentContainerStyle={{gap:10,paddingBottom:2}}>

 <View style={s.card}><Text style={s.section}>Today's Summary</Text><Text style={s.muted}>{label(day)} · Philippine time</Text><View style={s.grid}>{[['cart-outline','Total Items Sold',total.qty],['cash-multiple','Total Sales',peso(total.sales)],['receipt','Menu Items',items.length],['view-grid-outline','Categories',new Set(items.map(i=>i.category)).size]].map(([icon,title,v])=><View key={title} style={s.stat}><Icon name={icon} size={23} color="#704027"/><View style={{flex:1}}><Text style={s.tiny}>{title}</Text><Text style={s.value}>{v}</Text></View></View>)}</View></View>

 <View style={s.card}><View style={s.between}><Text style={s.section}>Recent Saved Entries</Text><Pressable onPress={()=>setHistory('all')}><Text style={s.link}>View All →</Text></Pressable></View><View style={[s.mini,s.tableHead]}><Text style={s.tiny}>Time (PHT)</Text><Text style={s.tiny}>Menu Item</Text><Text style={s.tiny}>Qty / Total</Text></View><ScrollView nestedScrollEnabled style={{maxHeight:Math.max(130,viewportHeight-685)}}>{today.slice(0,20).map(e=><View key={e.id} style={s.recent}><Text style={[s.tiny,{width:83}]}>{manilaTime(e.savedAt)}</Text><Text style={[s.tiny,{flex:1}]}>{e.name}</Text><View><Text style={[s.tiny,{textAlign:'right'}]}>+{e.quantity}</Text><Text style={s.tiny}>{peso(e.total)}</Text></View></View>)}{!today.length&&<Text style={s.empty}>No saved entries today.</Text>}</ScrollView></View>

 <View style={s.card}><Pressable accessibilityRole="button" accessibilityState={{expanded:helpOpen}} onPress={()=>setHelpOpen(!helpOpen)} style={{minHeight:44,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}><Text style={s.section}>How It Works</Text><Icon name={helpOpen?"chevron-up":"chevron-down"} size={22}/></Pressable>{helpOpen&&['Enter only the new quantity sold and click Save.','Philippine date and time are recorded automatically.','Each save adds to the daily total and resets the input to 0.'].map((t,i)=><Text key={t} style={s.instruction}>{i+1}. {t}</Text>)}<Text style={s.tiny}>Saved securely to Supabase.</Text></View></ScrollView></View>

 

 <Modal transparent visible={!!clearConfirm} onRequestClose={()=>{if(!batchBusy)setClearConfirm(null);}}><View style={s.backdrop}><View style={s.modal}><Text style={s.section}>Clear today's orders?</Text><Text style={s.text}>Are you sure you want to clear {clearConfirm?.length||0} saved entries for {label(day)}? These sales will be removed from today's totals and reports. An audit record is retained. Other days and the menu are unchanged.</Text><View style={s.between}><Button title="Cancel" disabled={batchBusy} onPress={()=>setClearConfirm(null)}/><Button title={batchBusy?'Clearing...':'Yes, Clear Today'} disabled={batchBusy} onPress={clearToday}/></View></View></View></Modal>
 <Modal transparent visible={!!history} onRequestClose={()=>setHistory(null)} animationType="fade"><View style={s.backdrop}><ScrollView keyboardShouldPersistTaps="handled" style={{width:"100%",maxWidth:580,maxHeight:"90%"}} contentContainerStyle={s.modal}><View style={s.between}><Text style={s.section}>{history==='all'?'All Saved Entries':history?.name}</Text><Button title="Close" onPress={()=>setHistory(null)}/></View><Text style={s.muted}>{label(day)} · Asia/Manila</Text><ScrollView style={{maxHeight:420}}>{records.map(e=><View key={e.id} style={s.history}><Text style={s.text}>{manilaTime(e.savedAt)} · {e.name}</Text><Text style={s.bold}>Qty added: {e.quantity} · {peso(e.total)}</Text></View>)}{!records.length&&<Text style={s.empty}>No saved entries today.</Text>}</ScrollView></ScrollView></View></Modal>

 <Modal transparent visible={adding} onRequestClose={()=>setAdding(false)}><View style={s.backdrop}><ScrollView keyboardShouldPersistTaps="handled" style={{width:"100%",maxWidth:580,maxHeight:"90%"}} contentContainerStyle={s.modal}><Text style={s.section}>Add Menu Item</Text><Text style={s.muted}>New menu items are stored in Supabase.</Text><TextInput accessibilityLabel="Menu item name" placeholder="Menu item name" value={name} onChangeText={setName} style={s.form}/><TextInput accessibilityLabel="Menu price" placeholder="Price in pesos" keyboardType="decimal-pad" value={price} onChangeText={setPrice} style={s.form}/><View style={{flexDirection:'row',flexWrap:'wrap',gap:5}}>{menuGroups.map(([n])=><Pressable key={n} onPress={()=>setNewCategory(n)} style={[s.tab,newCategory===n&&s.active]}><Text style={s.text}>{n}</Text></Pressable>)}</View>{!!error&&<Text style={s.message}>{error}</Text>}<View style={s.between}><Button title="Cancel" onPress={()=>setAdding(false)}/><Button title="Add Menu Item" onPress={add}/></View></ScrollView></View></Modal>

 </View>;

}

const baseStyles=StyleSheet.create({

 heading:{flexDirection:'row',alignItems:'center',gap:14,flexWrap:'wrap'},title:{fontSize:28,fontWeight:'800',color:'#152033',marginTop:9},subtitle:{fontSize:14,color:'#5C6D85',marginTop:4},muted:{fontSize:11,color:'#6B788A'},text:{fontSize:13,color:'#29384D'},bold:{fontSize:14,fontWeight:'700',color:'#172238'},date:{flexDirection:'row',alignItems:'center',gap:12,padding:13,backgroundColor:'#FFF',borderRadius:6,borderWidth:1,borderColor:'#E8DFD5'},button:{minHeight:44,backgroundColor:'#704027',borderRadius:5,paddingHorizontal:15,justifyContent:'center',alignItems:'center'},tabs:{padding:7,backgroundColor:'#FFFDFA',borderWidth:1,borderColor:'#EAE2D8',borderRadius:7},tab:{flexDirection:'row',alignItems:'center',gap:8,padding:11,borderWidth:1,borderColor:'#EAE2D8',borderRadius:5},active:{backgroundColor:'#ECD3BD',borderBottomWidth:3,borderBottomColor:'#704027'},layout:{flexDirection:'row',alignItems:'flex-start',gap:12},panel:{minWidth:0,backgroundColor:'#FFFDFA',borderWidth:1,borderColor:'#E9E0D7',borderRadius:8,overflow:'hidden'},toolbar:{padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'},section:{fontSize:18,fontWeight:'700',color:'#172238'},search:{flex:1,minWidth:180,maxWidth:340,height:44,borderWidth:1,borderColor:'#E3D9CF',borderRadius:5,paddingHorizontal:8,flexDirection:'row',alignItems:'center',gap:6},row:{minHeight:68,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderColor:'#EEE7DF'},tableHead:{minHeight:42,backgroundColor:'#F4F0EB'},inline:{flexDirection:'row',alignItems:'center',gap:7},icon:{width:35,height:40,alignItems:'center',justifyContent:'center',backgroundColor:'#F0DECB',borderRadius:6},badge:{fontSize:10,color:'#704027',padding:6,backgroundColor:'#F5EADF',borderRadius:4},quantity:{flexDirection:'row',height:44,borderWidth:1,borderColor:'#E3D7CD',borderRadius:5,flex:1,minWidth:100,maxWidth:120},step:{width:32,alignItems:'center',justifyContent:'center'},input:{minWidth:23,flex:1,textAlign:'center',fontSize:12},mini:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:4,paddingVertical:4},tiny:{fontSize:12,color:'#5B6D85',lineHeight:15},footer:{padding:12,fontSize:11,color:'#68798E',borderTopWidth:1,borderColor:'#EAE0D5'},rail:{width:320,gap:10},card:{backgroundColor:'#FFFDFA',borderWidth:1,borderColor:'#EAE2D8',borderRadius:10,padding:16,gap:10},grid:{flexDirection:'row',flexWrap:'wrap',gap:6},stat:{flexBasis:'46%',flexGrow:1,minWidth:120,minHeight:70,padding:8,borderWidth:1,borderColor:'#F0E7DE',borderRadius:6,flexDirection:'row',alignItems:'center',gap:7},value:{fontSize:20,fontWeight:'700',color:'#162135',marginTop:4},between:{flexWrap:'wrap',flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},link:{fontSize:11,color:'#704027'},recent:{minHeight:38,flexDirection:'row',alignItems:'center',gap:5,borderBottomWidth:1,borderColor:'#EEE6DD'},empty:{padding:14,fontSize:12,lineHeight:18,textAlign:'center',color:'#748095'},instruction:{fontSize:11,lineHeight:17,color:'#5B6D85'},message:{padding:10,backgroundColor:'#F4E7DA',borderRadius:5,color:'#704027',fontSize:12},backdrop:{flex:1,backgroundColor:'rgba(30,20,15,.4)',justifyContent:'center',alignItems:'center',padding:20},modal:{width:'100%',maxWidth:580,maxHeight:'90%',backgroundColor:'#FFFDFA',padding:20,borderRadius:12,gap:14},history:{paddingVertical:12,borderBottomWidth:1,borderColor:'#EAE0D6',gap:5},form:{borderWidth:1,borderColor:'#DED0C5',borderRadius:5,padding:12,fontSize:14}

});


const s=baseStyles;
