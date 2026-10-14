import React,{useState} from 'react';
import {View,Text,Pressable,Platform} from 'react-native';
import ResponsiveSelect from './ResponsiveSelect';
import {downloadReport} from '../services/api';
export default function ExportControl({type,filters={},onComplete}){
 const [format,setFormat]=useState('CSV'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const run=async()=>{if(Platform.OS!=='web'){setMessage('Exports are available in the web dashboard.');return;}setBusy(true);setMessage('');try{await downloadReport({type,format:format.toLowerCase(),...filters});setMessage('Report downloaded.');onComplete?.();}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 return <View style={{maxWidth:'100%',gap:6}}><View style={{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'}}><ResponsiveSelect label="Export format" value={format} options={['CSV','XLSX','PDF']} onChange={setFormat} width={105}/><Pressable accessibilityRole="button" disabled={busy} onPress={run} style={{minHeight:44,justifyContent:'center',paddingHorizontal:18,borderRadius:6,backgroundColor:'#704027',opacity:busy?.6:1}}><Text style={{color:'#fff'}}>{busy?'Generating…':'Export'}</Text></Pressable></View>{!!message&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,maxWidth:340,color:'#60402F'}}>{message}</Text>}</View>;
}
