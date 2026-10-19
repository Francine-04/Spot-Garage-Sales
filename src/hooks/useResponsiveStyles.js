import {summaryLabel,summaryCardAccent,summaryValue} from '../theme/summaryStyles';
import {Platform, StyleSheet, useWindowDimensions} from 'react-native';
import {useContext, useMemo} from 'react';
import {layoutWidthContext, tokens} from '../theme/designTokens';

const sections = new Set(['section','sectionTitle','panelTitle','performancePanelTitle','smallChartTitle','sideTitle','menuTitle','summaryTitle','rankTitle','insightsTitle','takeawayTitle']);
const headings = new Set(['title','pageTitle','performanceTitle']);
const panels = new Set(['weekPanel','trendPanel','salesPanel','categoryPanel','chartPanel','summaryPanel','smallPanel','rankPanel','transactionsPanel','performanceChartCard','breakdownCard']);
const kpis = new Set(['kpi','kpiCard','performanceKpi']);
const rows = new Set(['dayRow','rankRow','simpleRow','paymentRow','summaryRow','tableRow','detailRow']);
const buttons = new Set(['button','exportButton','exportMain','exportSmall','addButton','addMenuButton','submitButton','periodButton','saveButton']);

export function useResponsiveStyles(base, measuredWidth) {
  const viewport = useWindowDimensions();
  const parentWidth = useContext(layoutWidthContext);
  const width = measuredWidth || parentWidth || viewport.width;
  return useMemo(() => {
    const mobile = width < 680;
    const shortDesktop=width>=900&&viewport.height<=820;
    const padding=mobile?13:shortDesktop?16:18;
    const columns = width >= 560 ? 2 : 1;
    return Object.fromEntries(Object.entries(base).map(([key,value]) => {
      const next = {...StyleSheet.flatten(value)};
      if (typeof next.fontSize === 'number') {
        next.fontFamily=Platform.OS==='web'?'Inter, system-ui, sans-serif':'System';
        next.fontSize = Math.max(next.fontSize, /axis|Axis/.test(key) ? tokens.type.axis : /badge|Badge|kicker|Overline/.test(key) ? 11 : tokens.type.supporting);
        if (sections.has(key)) Object.assign(next,{fontSize:mobile?17:tokens.type.section,fontWeight:'600'});
        if (headings.has(key)) Object.assign(next,{fontSize:mobile?tokens.type.pageMobile:tokens.type.page,lineHeight:mobile?30:34,fontWeight:'700'});
        if (/kpiValue|performanceKpiValue/.test(key)) next.fontSize=mobile?22:tokens.type.kpi;
        if (/subtitle|Subtitle|Description|homeCardText/.test(key)) next.fontSize=tokens.type.body;
        if (/Cell|cell\d|rankName|rankSales|rankTransactions|productText|payText|detail\d/.test(key)) next.fontSize=tokens.type.table;
        if (typeof next.lineHeight==='number') next.lineHeight=Math.max(next.lineHeight,Math.ceil(next.fontSize*1.4));
      }
      if (key==='panel'||key==='card') Object.assign(next,{padding:next.padding===undefined?0:padding,borderRadius:tokens.radius.card});
      if (/Grid$|Kpis$|^kpis$|^smallCharts$|^rankings$/.test(key)) Object.assign(next,{gap:tokens.space.control,alignItems:'stretch'});
      if (['performanceMain','performanceBottom','primaryGrid','charts'].includes(key)) Object.assign(next,{gap:tokens.space.control,alignItems:'stretch',minWidth:0});
      if (key==='homeCardBody') next.flexGrow=1;
      if (sections.has(key)) Object.assign(next,{flexShrink:1,minWidth:0});
      if (['kpiCopy','performanceKpiCopy'].includes(key)) Object.assign(next,{flex:1,minWidth:0});
      if (['search','quantityBox','dropdown'].includes(key)) Object.assign(next,{minHeight:44,height:44});
      if (['simpleRow','paymentRow','summaryRow'].includes(key)) Object.assign(next,{paddingHorizontal:10});
      if (/^detail[0-8]$/.test(key)) next.paddingHorizontal=8;
      if (['smallChartCard','smallPanel'].includes(key)) {
        const count=width>=900?3:width>=640?2:1;
        Object.assign(next,{flex:undefined,flexBasis:count===3?'31%':count===2?'48%':'100%',flexGrow:1,minWidth:0});
      }
      if (kpis.has(key)) Object.assign(next,{flex:undefined,flexBasis:columns===2?'48%':'100%',flexGrow:1,flexShrink:0,minWidth:0,minHeight:shortDesktop?96:104,padding:mobile?13:16,gap:10});
      if (['kpiIcon','performanceKpiIcon'].includes(key)) Object.assign(next,{width:42,height:42,borderRadius:21});
      if (/kpiValue|performanceKpiValue|summaryValue|^value$/.test(key)) Object.assign(next,{fontVariant:['tabular-nums'],flexShrink:1});
      if (shortDesktop&&['head','pageHead','performanceHead'].includes(key)) next.gap=12;
      if (['performanceChartCard','breakdownCard'].includes(key)) Object.assign(next,{height:undefined,minHeight:330});
      if(key==='breakdownScroll') Object.assign(next,{maxHeight:280});
      if (key==='homeNavCard') Object.assign(next,{minHeight:0});
      if (shortDesktop&&['homeHero','homeHeroDesktop'].includes(key)) next.minHeight=260;
      if (shortDesktop&&['homeHeroCopy','homeHeroCopyDesktop'].includes(key)) Object.assign(next,{padding:20,paddingTop:20,paddingLeft:24});
      if (shortDesktop&&key==='homeHeroTitleDesktop') Object.assign(next,{fontSize:34,lineHeight:40});
      if (shortDesktop&&key==='homeHeroSubtitle') Object.assign(next,{fontSize:15,lineHeight:21,marginTop:8});
      if (shortDesktop&&['heroButton','homeDate'].includes(key)) next.marginTop=12;
      if (shortDesktop&&['homeCardImage','homeCardImageFrame','homeCardBlank'].includes(key)) next.height=76;
      if (shortDesktop&&key==='homeCardIcon') Object.assign(next,{top:52,width:40,height:40,borderRadius:20});
      if (key==='homeCardTitle') next.fontSize=16;
      if (shortDesktop&&key==='homeCardBody') Object.assign(next,{paddingTop:20,paddingBottom:40});
      if (shortDesktop&&key==='homeBanner') Object.assign(next,{minHeight:70,marginTop:14,padding:12});
      if (rows.has(key)) Object.assign(next,{height:undefined,minHeight:42,paddingVertical:8});
      if (buttons.has(key)) Object.assign(next,{height:44,minHeight:44,borderRadius:tokens.radius.control,paddingHorizontal:16,alignItems:'center',justifyContent:'center',flexShrink:0});
      if (['panelHeader','panelHead','performancePanelTitleRow','tableTools','detailTools','toolRight','detailedHead'].includes(key)) Object.assign(next,{maxWidth:'100%',flexWrap:'wrap',gap:12});
      if (['headActions','actions','filters','performanceActions'].includes(key)) Object.assign(next,{maxWidth:'100%',flexWrap:'wrap',alignItems:'flex-start',gap:10});
      if (['head','pageHead','performanceHead'].includes(key)) Object.assign(next,{marginBottom:shortDesktop?14:20,flexWrap:'wrap',maxWidth:'100%'});
      if (shortDesktop&&key==='dayRow') Object.assign(next,{minHeight:34,paddingVertical:5});
      if (key==='rankPanel') {
        const count=width>=760?2:1;
        Object.assign(next,{flex:undefined,flexBasis:count===2?'48%':'100%',flexGrow:1,flexShrink:0,minWidth:0,marginBottom:0});
      }
      if (key==='rankRow') Object.assign(next,{gap:8,paddingHorizontal:12,minHeight:42});
      if (key==='rankNo') Object.assign(next,{width:32,flexShrink:0});
      if (key==='rankName') Object.assign(next,{flex:1,minWidth:0});
      if (key==='rankSales') Object.assign(next,{width:undefined,flex:1,minWidth:72,paddingHorizontal:4});
      if (key==='rankTransactions') Object.assign(next,{width:undefined,flex:1,minWidth:82,textAlign:'right',paddingLeft:4});
      if (key==='rankHead') Object.assign(next,{minHeight:48});
      if (key==='rankTitle') Object.assign(next,{fontSize:16,flexShrink:1});
      if (key==='rankTitleLeft') Object.assign(next,{flex:1,minWidth:0});
      if (key==='rankTitleRow') Object.assign(next,{height:undefined,minHeight:52,gap:8,paddingVertical:8});
      if (key==='summaryPanel') {
        const count=width>=1700?3:width>=1000?2:1;
        Object.assign(next,{flex:undefined,flexBasis:count===3?'31%':count===2?'48%':'100%',flexGrow:1,minWidth:0});
      }
      if (['priceCell','totalCell','daySales','amount','payAmount','rankSales','detail5','detail6'].includes(key)) next.textAlign='right';
      if (mobile&&panels.has(key)) Object.assign(next,{width:'100%',minWidth:0,flex:undefined});
      if (mobile&&key==='takeawayCopy') next.paddingRight=0;
      if(kpis.has(key)) Object.assign(next,summaryCardAccent);
      if(['kpiLabel','performanceKpiLabel'].includes(key)) Object.assign(next,summaryLabel);
      if(['kpiValue','performanceKpiValue'].includes(key)) Object.assign(next,summaryValue);
      if(['head','pageHead','performanceHead'].includes(key)) Object.assign(next,{flexDirection:'column',alignItems:'stretch',gap:14});
      if(['actions','filters','performanceActions','headActions'].includes(key)) Object.assign(next,{justifyContent:'flex-start',alignItems:'flex-start'});
      if(['kpis','kpiGrid','performanceKpis','smallCharts','secondaryGrid','rankings'].includes(key)) Object.assign(next,{gap:12,marginBottom:16});
      if(kpis.has(key)||['smallChartCard','smallPanel'].includes(key)) next.marginBottom=0;
      if(['tableTools','detailedHead'].includes(key)) Object.assign(next,{alignItems:'flex-start',justifyContent:'flex-start',paddingVertical:12});
      if(key==='rankTitleRow') Object.assign(next,{flexWrap:'wrap'});
      if(['performanceChartCard','breakdownCard'].includes(key)&&width>=900) Object.assign(next,{flex:1,minWidth:0,minHeight:320});
      if(kpis.has(key)) Object.assign(next,{minHeight:88,padding:14});
      if(['head','pageHead'].includes(key)&&width>=1000) Object.assign(next,{flexDirection:'row',alignItems:'center',justifyContent:'space-between'});
      if(key==='panelSubtitle') Object.assign(next,{lineHeight:18});
      if(key==='rankHead') next.backgroundColor='#F5EFE8';
      return [key,next];
    }));
  },[base,width,viewport.height]);
}
