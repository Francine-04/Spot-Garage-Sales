import {useDatabase} from '../state/DatabaseContext';
import {useContext, useState} from 'react';
import {layoutWidthContext} from '../theme/designTokens';
import React from "react";

import { Image, Pressable, Text, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";



export default function HomeScreen({width,date,setDate,navigate,dateOptions,styles:s,colors:C,cards:homeCards,SelectorComponent:Selector}) {

  const database=useDatabase();
  const parentWidth=useContext(layoutWidthContext)||width;
  const [gridWidth,setGridWidth]=useState(0);
  const available=gridWidth||parentWidth;
  const desktop=available>=760, tablet=available>=620;
  const columns=available>=1320?6:available>=900?3:available>=460?2:1;

  return <>

    <View style={[s.homeHero,desktop&&s.homeHeroDesktop]}>

      <Image source={require("../../assets/images/home-hero-background.jpg")} accessibilityLabel="Spot Garage café entrance with motorcycle" resizeMode="cover" style={{position:"absolute",top:0,bottom:0,right:0,width:desktop?"52%":"100%",height:"100%"}}/>

      <View style={{position:"absolute",top:0,bottom:0,left:0,width:desktop?"48%":"100%",backgroundColor:desktop?"#F0E7DC":"rgba(248,243,236,.84)"}}/>

      <View style={[s.homeHeroCopy,desktop&&s.homeHeroCopyDesktop]}>

        <Text style={s.homeOverline}>WELCOME BACK,</Text><Text style={[s.homeHeroTitle,desktop&&s.homeHeroTitleDesktop]}>Spot Garage!</Text>

        <Text style={s.homeHeroSubtitle}>Let’s continue exploring your sales insights.</Text>

        <Pressable style={s.heroButton} onPress={()=>navigate("top-sales")}><Text style={s.heroButtonText}>View Sales Performance</Text><MaterialCommunityIcons name="arrow-right" size={19} color="#FFF"/></Pressable>

        <View style={s.homeDate}><Selector label="Reporting period" value={date} options={dateOptions} onChange={setDate} compact/></View>

      </View>

    </View>

    <View style={{paddingVertical:12,gap:4}}><Text style={s.detail}>{database.loading?"Connecting to Supabase?":`${database.status?.historicalMonths||0} historical months available ? ${database.entries.filter(e=>e.status==="saved").length} manual sales entries`}</Text><Text style={s.detail}>{database.status?.latestHistoricalUpdate?"Historical import updated: "+new Date(database.status.latestHistoricalUpdate).toLocaleString("en-PH",{timeZone:"Asia/Manila"})+" (PHT)":"No successful database update available."}</Text>{!!database.manualError&&<Text style={s.detail}>{database.manualError}</Text>}</View><View style={s.homeCardsGrid} onLayout={event=>setGridWidth(event.nativeEvent.layout.width)}>{homeCards.map(p=><Pressable accessibilityRole="button" key={p.id} onPress={()=>navigate(p.id)} style={[s.homeNavCard,{flexBasis:Math.floor((available-12*(columns-1))/columns),flexGrow:1,minWidth:0}]}>

      {p.image?(p.cropFromTop?<View style={s.homeCardImageFrame}><Image source={p.image} accessibilityLabel={`${p.label} visual`} resizeMode="contain" style={s.menuCropImage}/></View>:<Image source={p.image} accessibilityLabel={`${p.label} visual`} resizeMode="cover" style={s.homeCardImage}/>):<View style={s.homeCardBlank}/>} 

      <View style={s.homeCardIcon}><MaterialCommunityIcons name={p.icon} size={24} color={C.brown}/></View>

      <View style={s.homeCardBody}><Text style={s.homeCardTitle}>{p.label}</Text><Text style={s.homeCardText}>{p.description}</Text></View>

      <View style={s.homeArrow}><MaterialCommunityIcons name="chevron-right" size={21} color={C.brown}/></View>

    </Pressable>)}</View>

    <View style={[s.homeBanner,!tablet&&{flexWrap:"wrap"}]}><View style={s.bannerIcon}><MaterialCommunityIcons name="lightbulb-on-outline" size={25} color={C.brown}/></View><View style={{flex:1}}><Text style={s.bannerTitle}>Turn your sales data into smarter decisions.</Text><Text style={s.detail}>Explore available data, identify opportunities, and plan for a stronger Spot Garage.</Text></View><Image source={require("../../assets/images/cafe-motorcycle.png")} accessibilityLabel="Vintage motorcycle and café illustration" resizeMode="contain" style={[s.homeBannerImage,!tablet&&{width:"100%"}]}/></View>

  </>;

}



