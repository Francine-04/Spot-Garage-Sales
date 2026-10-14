import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {MaterialCommunityIcons as Icon} from '@expo/vector-icons';

export default function SignInScreen({onSignIn}) {
  const {width,height}=useWindowDimensions();
  const mobile=width<760;
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[visible,setVisible]=useState(false),[remember,setRemember]=useState(false),[notice,setNotice]=useState('');
  return <ScrollView contentContainerStyle={[s.page,{padding:mobile?16:Math.min(48,width*.035),minHeight:height}]} keyboardShouldPersistTaps="handled">
    <View style={[s.card,{flexDirection:mobile?'column':'row',minHeight:mobile?0:Math.min(740,height-72)}]}>
      <View style={[s.hero,{minHeight:mobile?245:580,padding:mobile?28:48}]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>{[180,230,280].map(size=><View key={'top'+size} style={{position:'absolute',width:size,height:size,borderRadius:size/2,borderWidth:2,borderColor:'#9B7552',opacity:.5,top:-size/2,left:-size/2}}/>)}{[220,280,340].map(size=><View key={'bottom'+size} style={{position:'absolute',width:size,height:size,borderRadius:size/2,borderWidth:2,borderColor:'#9B7552',opacity:.5,bottom:-size/2,right:-size/2}}/>)}</View>
        <View style={s.brand}><Icon name="coffee-outline" size={mobile?40:52} color="#F5DFC3"/><View style={s.brandLine}/><View><Text style={[s.brandName,{fontSize:mobile?21:27}]}>SPOT GARAGE</Text><Text style={s.brandSub}>RETRO CAFE</Text></View></View>
        <View style={{marginVertical:mobile?30:65}}><View style={{width:52,height:4,borderRadius:2,backgroundColor:"#D9B18A",marginBottom:24}}/><Text style={[s.welcome,{fontSize:mobile?38:52}]}>Welcome Back.</Text><Text style={s.heroCopy}>{"Your cafe's performance, all in one place."}</Text></View>
        {!mobile&&<View style={s.heroFooter}><Icon name="chart-bar" size={30} color="#F5DFC3"/><Text style={s.heroFooterText}>SALES ANALYTICS DASHBOARD</Text></View>}
      </View>
      <View style={[s.form,{padding:mobile?24:Math.min(58,width*.04)}]}>
        <Text style={[s.title,{fontSize:mobile?30:40}]}>Admin Sign In</Text>
        <Text style={s.subtitle}>Enter your credentials to access the dashboard.</Text>
        <View style={{gap:22,marginTop:mobile?28:42}}>
          <View style={s.field}><Text style={s.label}>Email Address</Text><View style={s.inputWrap}><Icon name="email-outline" size={23} color="#746C64"/><TextInput accessibilityLabel="Email Address" placeholder="admin@spotgarage.com" placeholderTextColor="#9A938D" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={s.input} onSubmitEditing={onSignIn}/></View></View>
          <View style={s.field}><Text style={s.label}>Password</Text><View style={s.inputWrap}><Icon name="lock-outline" size={23} color="#746C64"/><TextInput accessibilityLabel="Password" placeholder="Enter password" placeholderTextColor="#9A938D" secureTextEntry={!visible} value={password} onChangeText={setPassword} autoCapitalize="none" style={s.input} onSubmitEditing={onSignIn}/><Pressable accessibilityRole="button" accessibilityLabel={visible?'Hide password':'Show password'} onPress={()=>setVisible(!visible)} style={s.eye}><Icon name={visible?'eye-outline':'eye-off-outline'} size={22} color="#746C64"/></Pressable></View></View>
        </View>
        <View style={s.options}><Pressable accessibilityRole="checkbox" accessibilityState={{checked:remember}} onPress={()=>setRemember(!remember)} style={s.remember}><Icon name={remember?'checkbox-marked':'checkbox-blank-outline'} size={23} color="#805638"/><Text style={s.optionText}>Remember me</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>setNotice('Password reset is not connected yet. Click Sign In to open the dashboard.')} style={{minHeight:44,justifyContent:'center'}}><Text style={[s.optionText,{color:'#704027'}]}>Forgot password?</Text></Pressable></View>
        {!!notice&&<Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel="Sign In" onPress={onSignIn} style={({pressed})=>[s.submit,{opacity:pressed?.85:1}]}><Text style={s.submitText}>Sign In</Text><Icon name="arrow-right" size={24} color="#FFF"/></Pressable>
        <View style={s.footer}><View style={s.divider}/><Icon name="lock-outline" size={19} color="#91857A"/><View style={s.divider}/></View><Text style={s.footerText}>Spot Garage Sales Analytics</Text>
      </View>
    </View>
  </ScrollView>;
}
const s=StyleSheet.create({
  page:{backgroundColor:'#F3EAE0',flexGrow:1,alignItems:'center',justifyContent:'center'},
  card:{width:'100%',maxWidth:1320,borderRadius:20,overflow:'hidden',backgroundColor:'#FFFCF8'},
  hero:{flex:1,justifyContent:'center',position:'relative',backgroundColor:'#50331F',overflow:'hidden'},
  brand:{flexDirection:'row',alignItems:'center',gap:18},brandLine:{width:1,height:65,backgroundColor:'#E9D4B7'},brandName:{fontWeight:'700',letterSpacing:4,color:'#FFF9F0'},brandSub:{fontSize:14,letterSpacing:5,color:'#F5DFC3',marginTop:9},
  welcome:{fontFamily:'Georgia',fontWeight:'700',color:'#FFF9F0'},heroCopy:{maxWidth:360,fontSize:21,lineHeight:31,color:'#F3E6D4',marginTop:16},heroFooter:{flexDirection:'row',alignItems:'center',gap:16},heroFooterText:{fontSize:11,letterSpacing:3,color:'#FFF5E8',flexShrink:1},
  form:{flex:1,justifyContent:'center'},title:{fontWeight:'700',color:'#241B13'},subtitle:{fontSize:16,lineHeight:25,color:'#918980',marginTop:10},field:{gap:10},label:{fontSize:16,color:'#241E19'},inputWrap:{flexDirection:'row',alignItems:'center',gap:14,borderWidth:1,borderColor:'#DDD4CA',borderRadius:8,minHeight:54,paddingLeft:16,paddingRight:8},input:{flex:1,minWidth:0,fontSize:16,color:'#34271F',paddingVertical:12},eye:{width:44,height:44,alignItems:'center',justifyContent:'center'},options:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:8,marginVertical:20},remember:{flexDirection:'row',alignItems:'center',gap:8,minHeight:44},optionText:{fontSize:14},submit:{minHeight:58,borderRadius:8,backgroundColor:'#875B3D',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:22},submitText:{fontSize:19,fontWeight:'600',color:'#FFF'},footer:{flexDirection:'row',alignItems:'center',gap:18,marginTop:36},divider:{height:1,backgroundColor:'#DFD5CB',flex:1},footerText:{textAlign:'center',fontSize:12,color:'#918980',marginTop:12},notice:{fontSize:13,color:'#704027',lineHeight:20,marginBottom:14}
});

