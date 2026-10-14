import { Platform } from 'react-native';
if (Platform.OS === 'web' && typeof document !== 'undefined') {
 document.documentElement.lang='en';
 const link=(rel,href)=>{const element=document.createElement('link');element.rel=rel;element.href=href;document.head.appendChild(element);};
 link('manifest','/manifest.webmanifest');link('apple-touch-icon','/spot-garage-logo.jpg');
 const theme=document.createElement('meta');theme.name='theme-color';theme.content='#37261F';document.head.appendChild(theme);
 const style=document.createElement('style');
 style.textContent=`
 html,body,#root{width:100%;min-height:100%;margin:0}
 body{min-height:100dvh}
 :focus-visible{outline:3px solid #97622f!important;outline-offset:3px!important}
 input{min-width:0}
 [role=button],[role=tab]{cursor:pointer}
 @media(hover:hover){[role=button]:not([aria-disabled=true]):hover,[role=tab]:hover{filter:brightness(.97)}}
 [role=button]:not([aria-disabled=true]):active{filter:brightness(.92)}
 [aria-disabled=true]{cursor:default}
 @media(max-width:679px){input,select,textarea{font-size:16px!important}}
 @supports(padding:max(0px)){body{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}}
 `;
 document.head.appendChild(style);
 if (!__DEV__ && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(error=>console.warn('Offline fallback unavailable',error));
}

