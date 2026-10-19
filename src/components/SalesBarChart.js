import React,{useState} from 'react';
import {View,Text,Pressable,ScrollView} from 'react-native';
const colors=['#986747','#D5B594'];
const valid=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
const number=v=>Number(v).toLocaleString('en-PH',{maximumFractionDigits:2});
export default function SalesBarChart({rows,series,selectedKey,onSelect,height=150}){
 const [selected,setSelected]=useState(null);
 const active=rows.find(r=>String(r.key??r.label)===String(selectedKey??selected));
 const signed=rows.some(r=>series.some(s=>valid(r[s.key])&&Number(r[s.key])<0));
 const scales=series.map(s=>Math.max(1,...rows.map(r=>valid(r[s.key])?Math.abs(Number(r[s.key])):0)));
 const baseline=signed?height/2:height;
 const range=signed?height/2:height;
 const format=(s,v)=>!valid(v)?'Unavailable':s.format?s.format(Number(v)):number(v);
 const select=r=>{setSelected(String(r.key??r.label));onSelect?.(r);};
 return <View style={{minWidth:0,marginTop:10}}>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,marginBottom:6}}>{series.map((s,i)=><View key={s.key} style={{flexDirection:'row',alignItems:'center',gap:5}}><View style={{width:9,height:9,backgroundColor:colors[i%colors.length],borderRadius:2}}/><Text style={{fontSize:11,color:'#67574B'}}>{s.label} (scale {signed?'-':''}{number(scales[i])}{signed?' to '+number(scales[i]):' max'})</Text></View>)}</View>
  <Text accessibilityLiveRegion="polite" style={{minHeight:38,fontSize:12,lineHeight:18,color:'#563725',paddingBottom:6}}>{active?`${active.label}: ${series.map(s=>`${s.label} ${format(s,active[s.key])}`).join(' | ')}`:'Select a bar to view exact values.'}</Text>
  {!rows.length?<Text style={{paddingVertical:24,color:'#657080'}}>No recorded data for this period.</Text>:<ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{flexGrow:1}}>
   <View style={{flex:1,minWidth:rows.length*72,position:'relative'}}>
    {[0,.5,1].map(f=><View key={f} pointerEvents="none" style={{position:'absolute',top:f*height,left:0,right:0,borderTopWidth:1,borderColor:f*height===baseline?'#A69382':'#EDE5DD'}}/>)}
    <View style={{flexDirection:'row'}}>{rows.map((r,index)=>{const key=String(r.key??r.label),chosen=active===r;return <Pressable key={key+'-'+index} accessibilityRole="button" accessibilityLabel={`${r.label}: ${series.map(s=>s.label+' '+format(s,r[s.key])).join(', ')}`} accessibilityState={{selected:chosen}} onPress={()=>select(r)} onHoverIn={()=>select(r)} onFocus={()=>select(r)} style={{flex:1,minWidth:72,alignItems:'center',backgroundColor:chosen?'rgba(213,181,148,.12)':'transparent'}}>
     <View style={{height,width:'100%',flexDirection:'row',justifyContent:'center',gap:4}}>{series.map((s,i)=>{const value=valid(r[s.key])?Number(r[s.key]):null,h=value===null?0:Math.abs(value)/scales[i]*range;return <View key={s.key} style={{width:series.length>1?19:30,height,position:'relative'}}><View style={{position:'absolute',top:value<0?baseline:baseline-h,height:h,width:'100%',backgroundColor:value<0?'#C45F59':colors[i%colors.length],borderTopLeftRadius:2,borderTopRightRadius:2}}/></View>;})}</View>
     <Text style={{fontSize:11,color:'#657080',textAlign:'center',paddingHorizontal:4,paddingTop:8,paddingBottom:6,minHeight:38}}>{r.label}</Text>
    </Pressable>;})}</View>
   </View>
  </ScrollView>}
  {signed&&<Text style={{fontSize:11,color:'#75685E',marginTop:3}}>Zero is the middle line. Negative values extend below zero.</Text>}
 </View>;
}
