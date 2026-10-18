import React,{useState} from 'react';
import {View,Text,Image} from 'react-native';
import ResponsiveSelect from './ResponsiveSelect';
import {money} from './DatabaseWidgets';
export const paymentIcons={Cash:require('../../assets/images/cash logo.png'),GCash:require('../../assets/images/gcash.png'),Maya:require('../../assets/images/maya.jpg'),Card:require('../../assets/images/card.png'),GoTyme:require('../../assets/images/go tyme.jpg'),MariBank:require('../../assets/images/maribank.png')};
export function PaymentPicker({value,onChange}){return <View style={{flexDirection:'row',alignItems:'center',gap:6}}>{paymentIcons[value]&&<Image source={paymentIcons[value]} accessibilityLabel={value} resizeMode="contain" style={{width:24,height:24}}/>}<ResponsiveSelect label="Payment method" value={value} options={Object.keys(paymentIcons)} onChange={onChange} width={125}/></View>;}
export function PaymentBreakdown({entries,compactGrid=false}){
 const [gridWidth,setGridWidth]=useState(0);
 const rows=entries.filter(e=>e.status==='saved');const total=rows.reduce((sum,e)=>sum+Math.round(e.total*100),0);
 const methods=[...Object.keys(paymentIcons),...(rows.some(e=>!e.paymentMethod||e.paymentMethod==='Not recorded')?['Not recorded']:[])];
 if(compactGrid){
  const columns=gridWidth>=700?3:gridWidth>=340?2:1;
  const amounts=Object.fromEntries(methods.map(method=>[method,rows.filter(e=>(e.paymentMethod||'Not recorded')===method).reduce((sum,e)=>sum+Math.round(e.total*100),0)]));
  const percentage=amount=>total?(amount/total*100).toFixed(1):'0.0';
  return <View style={{backgroundColor:'#FFFDFA',borderWidth:1,borderColor:'#E5DED7',borderRadius:10,padding:12,marginBottom:12}}>
   <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'baseline',justifyContent:'space-between',gap:6,marginBottom:10}}>
    <Text style={{fontSize:17,fontWeight:'700',color:'#422D22'}}>Payment Method Breakdown</Text>
    <Text style={{fontSize:12,color:'#75685E'}}>Recorded sales: {money(total/100)}</Text>
   </View>
   <View onLayout={event=>setGridWidth(event.nativeEvent.layout.width)} style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
    {Object.keys(paymentIcons).map(method=><View key={method} style={{width:gridWidth?(gridWidth-8*(columns-1))/columns:'100%',minWidth:0,backgroundColor:'#F7F1E9',borderWidth:1,borderColor:'#E8DCCF',borderRadius:8,padding:12,gap:9}}>
     <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
      <View style={{width:32,height:32,borderRadius:6,backgroundColor:'#FFFDFC',alignItems:'center',justifyContent:'center'}}><Image source={paymentIcons[method]} accessibilityLabel={method} resizeMode="contain" style={{width:25,height:25}}/></View>
      <Text style={{fontSize:13,fontWeight:'600',color:'#422D22',flex:1}}>{method}</Text>
     </View>
     <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',flexWrap:'wrap',gap:4}}>
      <Text style={{fontSize:18,fontWeight:'700',color:'#563725'}}>{money(amounts[method]/100)}</Text>
      <Text style={{fontSize:12,color:'#75685E'}}>{percentage(amounts[method])}%</Text>
     </View>
    </View>)}
   </View>
   <Text style={{fontSize:11,color:'#75685E',marginTop:8}}>Saved transactions only. Historical POS sales are excluded.{amounts['Not recorded']?` Unspecified payment: ${money(amounts['Not recorded']/100)} (${percentage(amounts['Not recorded'])}%).`:''}</Text>
  </View>;
 }
 return <View style={{backgroundColor:'#FFFDFA',borderWidth:1,borderColor:'#E5DED7',borderRadius:10,padding:16,gap:10,marginBottom:12}}><Text style={{fontSize:17,fontWeight:'700'}}>Payment Method Breakdown</Text>{methods.map(method=>{const amount=rows.filter(e=>(e.paymentMethod||'Not recorded')===method).reduce((sum,e)=>sum+Math.round(e.total*100),0);return <View key={method} style={{flexDirection:'row',alignItems:'center',gap:9,minHeight:30}}>{paymentIcons[method]&&<Image source={paymentIcons[method]} accessibilityLabel={method} resizeMode="contain" style={{width:26,height:26}}/>}<Text style={{flex:1,fontSize:13}}>{method}</Text><Text style={{fontSize:13}}>{money(amount/100)}</Text><Text style={{width:48,textAlign:'right',fontSize:12,color:'#657080'}}>{total?(amount/total*100).toFixed(1):'0'}%</Text></View>;})}</View>;
}
