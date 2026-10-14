import {Router} from 'express';
import {rateLimit} from 'express-rate-limit';
import {createClient} from '@supabase/supabase-js';
import {db} from './db.mjs';

const publicAccess=()=>process.env.PUBLIC_ACCESS==='true';
const visitor={id:'public-visitor',email:null};
const production=()=>process.env.NODE_ENV==='production'||!!process.env.VERCEL;
const cookieName=()=>production()?'__Host-spot-session':'spot-session';
function token(req){
 const item=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName()+'='));
 try{return item?decodeURIComponent(item.slice(cookieName().length+1)):null;}catch{return null;}
}
function cookie(res,value,maxAge){res.cookie(cookieName(),value,{httpOnly:true,secure:production(),sameSite:'strict',path:'/',...(maxAge===undefined?{}:{maxAge})});}
function allowed(user){return !!user?.email_confirmed_at&&(process.env.ADMIN_USER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(user.id);}
export function protectRequest(req,res,next){
 res.set('Cache-Control','no-store');
 if(!['GET','HEAD','OPTIONS'].includes(req.method)){
  const expected=process.env.APP_ORIGIN||(!production()?'http://127.0.0.1:8090':null);
  const origin=req.get('origin');
  if(!expected)return res.status(503).json({error:'Production origin is not configured.'});
  if(origin!==expected)return res.status(403).json({error:'Cross-origin writes are not allowed.'});
  if(req.get('X-Spot-Garage-Request')!=='1')return res.status(403).json({error:'Missing request header.'});
 }
 next();
}
// A verified Supabase user AND a server-controlled UUID allowlist are required
// before any database query or RPC. Browser metadata never grants permissions.
export function adminGuard(auth=db.auth){return async(req,res,next)=>{
 if(publicAccess()){req.admin={...visitor};return next();}
 if(!(process.env.ADMIN_USER_IDS||'').trim())return res.status(503).json({error:'Administrator access is not configured.'});
 const accessToken=token(req);if(!accessToken)return res.status(401).json({error:'Sign in to continue.'});
 try{const {data,error}=await auth.getUser(accessToken);
  if(error||!data?.user){cookie(res,'',0);return res.status(401).json({error:'Your session expired. Sign in again.'});}
  if(!allowed(data.user)){cookie(res,'',0);return res.status(403).json({error:'Administrator access required.'});}
  req.admin={id:data.user.id,email:data.user.email};next();
 }catch{return res.status(503).json({error:'Unable to verify your session. Try again.'});}
};}
export const requireAdmin=adminGuard();
export function createAuthRouter(clientFactory=()=>createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})){
 const router=Router();
 router.post('/login',rateLimit({windowMs:15*60*1000,limit:10}),async(req,res)=>{
  if(publicAccess())return res.json({user:visitor,publicAccess:true});
  if(!(process.env.ADMIN_USER_IDS||'').trim())return res.status(503).json({error:'Administrator access is not configured.'});
  const {email,password,remember}=req.body||{};
  if(typeof email!=='string'||email.length>254||typeof password!=='string'||!password||password.length>1024)return res.status(400).json({error:'Enter your email and password.'});
  try{
   // Isolated client: signing in must never replace the privileged DB client's session.
   const client=clientFactory();
   const {data,error}=await client.auth.signInWithPassword({email:email.trim(),password});
   if(error||!data.session||!allowed(data.user)){if(data.session)await client.auth.signOut();cookie(res,'',0);return res.status(401).json({error:'Invalid credentials or administrator access is not enabled.'});}
   cookie(res,data.session.access_token,remember?Math.max(0,data.session.expires_at*1000-Date.now()):undefined);
   res.json({user:{id:data.user.id,email:data.user.email},expiresAt:data.session.expires_at});
  }catch{return res.status(503).json({error:'Sign-in is temporarily unavailable.'});}
 });
 router.get('/session',(req,res,next)=>publicAccess()?res.status(401).json({error:'Click Sign In to open the dashboard.'}):next(),requireAdmin,(req,res)=>res.json({user:req.admin}));
 router.post('/logout',async(req,res)=>{const accessToken=token(req);cookie(res,'',0);if(accessToken&&!publicAccess()){try{await db.auth.admin.signOut(accessToken,'local');}catch{/* Cookie is still removed. */}}res.json({ok:true});});
 // No public signup or user-management endpoint is provided.
 return router;
}
