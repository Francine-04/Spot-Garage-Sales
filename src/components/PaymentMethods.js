import React from 'react';
import {View,Text,Image} from 'react-native';
import ResponsiveSelect from './ResponsiveSelect';
import {money} from './DatabaseWidgets';
export const paymentIcons={Cash:require('../../assets/images/cash logo.png'),GCash:require('../../assets/images/gcash.png'),Maya:require('../../assets/images/maya.jpg'),Card:require('../../assets/images/card.png'),GoTyme:require('../../assets/images/go tyme.jpg'),MariBank:require('../../assets/images/maribank.png')};
export function PaymentPicker({value,onChange}){return <View style={{flexDirection:'row',alignItems:'center',gap:6}}>{paymentIcons[value]&&<Image source={paymentIcons[value]} accessibilityLabel={value} resizeMode="contain" style={{width:24,height:24}}/>}<ResponsiveSelect label="Payment method" value={value} options={Object.keys(paymentIcons)} onChange={onChange} width={125}/></View>;}
export function PaymentBreakdown({entries}){
 const rows=entries.filter(e=>e.status==='saved');const total=rows.reduce((sum,e)=>sum+Math.round(e.total*100),0);
 const methods=[...Object.keys(paymentIcons),...(rows.some(e=>!e.paymentMethod||e.paymentMethod==='Not recorded')?['Not recorded']:[])];
 return <View style={{backgroundColor:'#FFFDFA',borderWidth:1,borderColor:'#E5DED7',borderRadius:10,padding:16,gap:10,marginBottom:12}}><Text style={{fontSize:17,fontWeight:'700'}}>Payment Method Breakdown</Text>{methods.map(method=>{const amount=rows.filter(e=>(e.paymentMethod||'Not recorded')===method).reduce((sum,e)=>sum+Math.round(e.total*100),0);return <View key={method} style={{flexDirection:'row',alignItems:'center',gap:9,minHeight:30}}>{paymentIcons[method]&&<Image source={paymentIcons[method]} accessibilityLabel={method} resizeMode="contain" style={{width:26,height:26}}/>}<Text style={{flex:1,fontSize:13}}>{method}</Text><Text style={{fontSize:13}}>{money(amount/100)}</Text><Text style={{width:48,textAlign:'right',fontSize:12,color:'#657080'}}>{total?(amount/total*100).toFixed(1):'0'}%</Text></View>;})}</View>;
}
