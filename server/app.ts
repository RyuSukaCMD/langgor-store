import crypto from 'node:crypto'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import { z } from 'zod'
import { config, configurationIssues } from './config.js'
import { createRateLimiters } from './rateLimit.js'
import { createSupabaseAuthClient, getSupabaseAdmin, isSupabaseConfigured } from './supabase.js'
import type { Notification, Order, Product, User } from '../src/types.js'

export const isProd = config.isProduction
export const root = process.cwd()
export const app = express()
const limitersPromise = createRateLimiters()
const withLimiter=(name:'api'|'auth'|'upload')=>async(req:Request,res:Response,next:NextFunction)=>{try{const limiters=await limitersPromise;return limiters[name](req,res,next)}catch(error){next(error)}}

type AppUser = User & { status:'active'|'suspended'|'deleted' }
type AuthedRequest = Request & { user?:AppUser;accessToken?:string }

app.disable('x-powered-by')
if(config.app.trustProxy)app.set('trust proxy',1)
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false,frameguard:false}))
app.use(compression())
app.use(express.json({limit:'256kb'}))
app.use(cookieParser())
// Vercel rewrites /api/* to /api/index?path=*. Restore the API route before dispatch.
app.use((req,_res,next)=>{if(req.path==='/api/index'){const current=new URL(req.url,'http://vercel.internal');const forwarded=current.searchParams.get('path')||'';current.searchParams.delete('path');const suffix=forwarded.replace(/^\/+/, '');const query=current.searchParams.toString();req.url=`/api${suffix?`/${suffix}`:''}${query?`?${query}`:''}`}next()})
app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store, max-age=0');next()})
app.use('/api',withLimiter('api'))

const ACCESS_COOKIE='langgor_access'
const REFRESH_COOKIE='langgor_refresh'
const CSRF_COOKIE='langgor_csrf'
const ONE_DAY_MS=86_400_000
const REMEMBER_MS=30*ONE_DAY_MS
const firstForwarded=(value:string|undefined)=>value?.split(',')[0]?.trim()
const requestProtocol=(req:Request)=>firstForwarded(req.get('x-forwarded-proto'))||req.protocol||'http'
const requestHost=(req:Request)=>firstForwarded(req.get('x-forwarded-host'))||req.get('host')||'localhost'
const requestOrigin=(req:Request)=>`${requestProtocol(req)}://${requestHost(req)}`
const isSecureRequest=(req:Request)=>requestProtocol(req)==='https'
const authCookieOptions=(req:Request)=>({httpOnly:true,sameSite:'lax' as const,secure:isSecureRequest(req),path:'/'})
const setAuthCookies=(req:Request,res:Response,session:{access_token:string;refresh_token:string;expires_in?:number},remember=true)=>{
  res.cookie(ACCESS_COOKIE,session.access_token,{...authCookieOptions(req),maxAge:(session.expires_in||3600)*1000})
  res.cookie(REFRESH_COOKIE,session.refresh_token,{...authCookieOptions(req),maxAge:remember?REMEMBER_MS:undefined})
}
const clearAuthCookies=(res:Response)=>{res.clearCookie(ACCESS_COOKIE,{path:'/'});res.clearCookie(REFRESH_COOKIE,{path:'/'})}
const supabaseUnavailable=(res:Response)=>res.status(503).json({message:'Layanan belum siap. Hubungi pengelola.'})
const requireSupabase=(_req:Request,res:Response,next:NextFunction)=>isSupabaseConfigured?next():supabaseUnavailable(res)
const parse=<T>(schema:z.ZodType<T>,body:unknown,res:Response):T|null=>{const result=schema.safeParse(body);if(!result.success){res.status(422).json({message:result.error.issues[0]?.message||'Data tidak valid.'});return null}return result.data}

const profileFromRelation=(value:unknown)=>Array.isArray(value)?value[0]||{}:(value||{}) as Record<string,unknown>
const loadAppUser=async(authUser:{id:string;email?:string|null}):Promise<AppUser>=>{
  const db=getSupabaseAdmin();const {data,error}=await db.from('users').select('id,username,email,role,status,balance,created_at,profiles(nickname,bio,avatar_url,banner_url,accent)').eq('id',authUser.id).single()
  if(error||!data)throw new Error('Profil pengguna belum tersedia.')
  const row=data as any;const profile=profileFromRelation(row.profiles) as any;const nickname=String(profile.nickname||row.username);const initials=nickname.split(/\s+/).map((part:string)=>part[0]).slice(0,2).join('').toUpperCase()
  return{id:String(row.id),username:String(row.username),email:String(row.email||authUser.email||''),nickname,role:row.role,balance:Number(row.balance),avatar:initials,bio:String(profile.bio||''),joinedAt:String(row.created_at),accent:String(profile.accent||'#8b5cf6'),avatarUrl:profile.avatar_url||undefined,bannerUrl:profile.banner_url||undefined,status:row.status}
}

app.use((req,res,next)=>{if(!req.cookies[CSRF_COOKIE])res.cookie(CSRF_COOKIE,crypto.randomBytes(24).toString('hex'),{httpOnly:false,sameSite:'lax',secure:isSecureRequest(req),path:'/',maxAge:ONE_DAY_MS});next()})
app.use((req,res,next)=>{if(!['POST','PATCH','PUT','DELETE'].includes(req.method))return next();const origin=req.get('Origin');if(origin){try{if(new URL(origin).origin!==new URL(requestOrigin(req)).origin)return res.status(403).json({message:'Origin permintaan tidak diizinkan.'})}catch{return res.status(403).json({message:'Origin permintaan tidak valid.'})}}const cookie=String(req.cookies[CSRF_COOKIE]||'');const header=String(req.get('X-CSRF-Token')||'');const a=Buffer.from(cookie);const b=Buffer.from(header);if(!cookie||!header||a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(403).json({message:'Sesi keamanan kedaluwarsa. Muat ulang halaman.'});next()})

app.use(async(req:AuthedRequest,res,next)=>{
  if(!isSupabaseConfigured)return next()
  let access=String(req.cookies[ACCESS_COOKIE]||'');const refresh=String(req.cookies[REFRESH_COOKIE]||'')
  if(!access&&!refresh)return next()
  try{
    const admin=getSupabaseAdmin();let authResult=access?await admin.auth.getUser(access):null
    if((!authResult||authResult.error)&&refresh){const auth=createSupabaseAuthClient();const refreshed=await auth.auth.refreshSession({refresh_token:refresh});if(refreshed.data.session){setAuthCookies(req,res,refreshed.data.session,true);access=refreshed.data.session.access_token;authResult=await admin.auth.getUser(access)}}
    const authUser=authResult?.data.user;if(authUser){req.accessToken=access;req.user=await loadAppUser(authUser)}
  }catch(error){console.error('[auth]',error instanceof Error?error.message:error);clearAuthCookies(res)}
  next()
})

const requireAuth=(req:AuthedRequest,res:Response,next:NextFunction)=>{if(!req.user)return res.status(401).json({message:'Silakan masuk untuk melanjutkan.'});if(req.user.status!=='active')return res.status(403).json({message:'Akun tidak aktif. Hubungi dukungan.'});next()}
const requireAdmin=(req:AuthedRequest,res:Response,next:NextFunction)=>{if(!req.user)return res.status(401).json({message:'Silakan masuk untuk melanjutkan.'});if(req.user.status!=='active'||req.user.role!=='admin')return res.status(403).json({message:'Akses admin diperlukan.'});next()}

const mapProduct=(row:any):Product=>({id:String(row.id),name:String(row.name),kind:'cookie',category:String(row.category),description:String(row.description),price:Number(row.price),stock:Number(row.stock),status:row.status,seller:{name:String(row.publisher_name),username:String(row.publisher_username),verified:Boolean(row.publisher_verified),rating:Number(row.rating)},rating:Number(row.rating),sold:Number(row.sold),createdAt:String(row.created_at),specs:Array.isArray(row.specs)?row.specs:[],icon:String(row.icon),accent:row.accent,imageUrl:row.image_url||undefined})
const productColumns='*'
const relativeTime=(date:string)=>{const seconds=Math.max(1,Math.floor((Date.now()-new Date(date).getTime())/1000));if(seconds<60)return`${seconds} detik`;if(seconds<3600)return`${Math.floor(seconds/60)} menit`;if(seconds<86400)return`${Math.floor(seconds/3600)} jam`;return`${Math.floor(seconds/86400)} hari`}
const mapOrder=(row:any):Order=>{const snapshot=row.product_snapshot||{};return{id:String(row.display_id),productId:String(row.product_id),productName:String(snapshot.name||'Produk'),productIcon:String(snapshot.icon||'C'),date:new Date(row.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}),createdAt:String(row.created_at),price:Number(row.total),status:row.status}}
const audit=async(req:AuthedRequest,action:string,targetType:string,targetId:string,before?:unknown,after?:unknown)=>{if(!req.user)return;const hashSecret=config.observability.auditIpHashSecret||config.supabase.serviceRoleKey;if(!hashSecret)throw new Error('Pencatatan aktivitas belum siap.');const ipHash=crypto.createHmac('sha256',hashSecret).update(req.ip||'unknown').digest('hex');await getSupabaseAdmin().from('admin_actions').insert({admin_id:req.user.id,action,target_type:targetType,target_id:targetId,before_state:before||null,after_state:after||null,ip_hash:ipHash})}

const loginSchema=z.object({identifier:z.string().min(3).max(120),password:z.string().min(8).max(128),remember:z.boolean().default(false)})
const registerSchema=z.object({username:z.string().regex(/^[a-z0-9_]{4,20}$/,'Username tidak valid.'),email:z.string().email('Email tidak valid.').max(120),password:z.string().min(8,'Password minimal 8 karakter.').max(128)})
const productInputSchema=z.object({name:z.string().min(4).max(80),category:z.string().min(2).max(40),description:z.string().min(20).max(400),price:z.number().int().min(1000).max(100000000),stock:z.number().int().min(0).max(999999),status:z.enum(['ready','limited','sold']),specs:z.array(z.string().min(2).max(80)).min(1).max(12),icon:z.string().min(1).max(2),accent:z.enum(['violet','pink','cyan','amber'])})
const userAdminUpdateSchema=z.object({role:z.enum(['user','moderator','admin']).optional(),status:z.enum(['active','suspended']).optional()}).refine(value=>Object.keys(value).length>0,'Tidak ada perubahan.')

app.get('/api/health',(_req,res)=>res.json({ok:true,time:new Date().toISOString(),environment:config.env,services:{supabase:isSupabaseConfigured?'configured':'not-configured',rateLimit:config.rateLimit.store},configurationIssues}))
app.get('/api/products',async(_req,res)=>{if(!isSupabaseConfigured)return res.json({products:[],configured:false,message:'Katalog belum dapat digunakan.'});const {data,error}=await getSupabaseAdmin().from('products').select(productColumns).order('created_at',{ascending:true});if(error)return res.status(500).json({message:'Katalog gagal dimuat.'});res.json({products:(data||[]).map(mapProduct),configured:true})})
app.get('/api/users/:username/public',requireSupabase,async(req,res)=>{const {data,error}=await getSupabaseAdmin().from('users').select('username,created_at,profiles(nickname,bio,avatar_url,banner_url,accent)').eq('username',String(req.params.username).toLowerCase()).eq('status','active').maybeSingle();if(error||!data)return res.status(404).json({message:'Profil tidak ditemukan.'});const profile=profileFromRelation((data as any).profiles) as any;res.json({profile:{username:data.username,nickname:profile.nickname||data.username,bio:profile.bio||'',avatarUrl:profile.avatar_url||null,bannerUrl:profile.banner_url||null,accent:profile.accent||null,joinedAt:data.created_at}})})

app.get('/api/auth/me',(req:AuthedRequest,res)=>res.json({user:req.user||null}))
app.post('/api/auth/login',requireSupabase,withLimiter('auth'),async(req,res)=>{const body=parse(loginSchema,req.body,res);if(!body)return;const db=getSupabaseAdmin();let email=body.identifier;if(!email.includes('@')){const lookup=await db.from('users').select('email').eq('username',email.toLowerCase()).maybeSingle();if(lookup.error||!lookup.data)return res.status(401).json({message:'Email/username atau password tidak cocok.'});email=String(lookup.data.email)}const auth=createSupabaseAuthClient();const result=await auth.auth.signInWithPassword({email,password:body.password});if(result.error||!result.data.session||!result.data.user)return res.status(401).json({message:'Email/username atau password tidak cocok.'});const user=await loadAppUser(result.data.user);if(user.status!=='active')return res.status(403).json({message:'Akun tidak aktif. Hubungi dukungan.'});setAuthCookies(req,res,result.data.session,body.remember);res.json({user})})
app.post('/api/auth/register',requireSupabase,withLimiter('auth'),async(req,res)=>{const body=parse(registerSchema,req.body,res);if(!body)return;const db=getSupabaseAdmin();const existing=await db.from('users').select('id').eq('username',body.username).maybeSingle();if(existing.data)return res.status(409).json({message:'Username sudah digunakan.'});const auth=createSupabaseAuthClient();const result=await auth.auth.signUp({email:body.email,password:body.password,options:{data:{username:body.username,nickname:body.username}}});if(result.error)return res.status(422).json({message:result.error.message});if(!result.data.user)return res.status(500).json({message:'Akun belum dapat dibuat.'});if(!result.data.session)return res.status(202).json({user:null,requiresEmailConfirmation:true,email:body.email});setAuthCookies(req,res,result.data.session,false);const user=await loadAppUser(result.data.user);res.status(201).json({user,requiresEmailConfirmation:false,email:body.email})})
app.post('/api/auth/verify-email',requireSupabase,withLimiter('auth'),async(req,res)=>{const body=parse(z.object({email:z.string().email(),token:z.string().regex(/^\d{6}$/,'Kode OTP harus berisi 6 angka.')}),req.body,res);if(!body)return;const auth=createSupabaseAuthClient();const result=await auth.auth.verifyOtp({email:body.email,token:body.token,type:'signup'});if(result.error||!result.data.session||!result.data.user)return res.status(422).json({message:result.error?.message||'Kode OTP tidak valid atau sudah kedaluwarsa.'});setAuthCookies(req,res,result.data.session,true);const user=await loadAppUser(result.data.user);res.json({user})})
app.post('/api/auth/resend-otp',requireSupabase,withLimiter('auth'),async(req,res)=>{const body=parse(z.object({email:z.string().email()}),req.body,res);if(!body)return;const result=await createSupabaseAuthClient().auth.resend({type:'signup',email:body.email});if(result.error)return res.status(429).json({message:result.error.message});res.json({ok:true,message:'Kode OTP baru telah dikirim.'})})
app.post('/api/auth/logout',(_req,res)=>{clearAuthCookies(res);res.json({ok:true})})
app.post('/api/auth/forgot',requireSupabase,withLimiter('auth'),async(req,res)=>{const body=parse(z.object({email:z.string().email()}),req.body,res);if(!body)return;const redirectTo=`${requestOrigin(req)}/reset-password`;await createSupabaseAuthClient().auth.resetPasswordForEmail(body.email,{redirectTo});res.json({ok:true,message:'Jika email terdaftar, instruksi akan dikirim.'})})
app.post('/api/auth/reset',requireSupabase,withLimiter('auth'),async(req,res)=>{const body=parse(z.object({accessToken:z.string().min(20),password:z.string().min(8).max(128)}),req.body,res);if(!body)return;const db=getSupabaseAdmin();const authUser=await db.auth.getUser(body.accessToken);if(authUser.error||!authUser.data.user)return res.status(401).json({message:'Tautan pemulihan tidak valid atau sudah kedaluwarsa.'});const update=await db.auth.admin.updateUserById(authUser.data.user.id,{password:body.password});if(update.error)return res.status(422).json({message:update.error.message});res.json({ok:true})})

app.patch('/api/profile',requireSupabase,requireAuth,async(req:AuthedRequest,res)=>{
  const body=parse(z.object({nickname:z.string().min(2).max(32),username:z.string().regex(/^[a-z0-9_]{4,20}$/),bio:z.string().max(160),accent:z.enum(['#8b5cf6','#ec4899','#22d3ee','#f59e0b'])}),req.body,res);if(!body||!req.user)return
  const db=getSupabaseAdmin();const before=await db.from('users').select('username').eq('id',req.user.id).maybeSingle();if(before.error||!before.data)return res.status(404).json({message:'Profil tidak ditemukan.'})
  const userUpdate=await db.from('users').update({username:body.username}).eq('id',req.user.id);if(userUpdate.error)return res.status(userUpdate.error.code==='23505'?409:500).json({message:userUpdate.error.code==='23505'?'Username sudah digunakan.':'Profil belum disimpan.'})
  const profileUpdate=await db.from('profiles').upsert({user_id:req.user.id,nickname:body.nickname,bio:body.bio,accent:body.accent},{onConflict:'user_id'});if(profileUpdate.error){if(before.data.username!==body.username)await db.from('users').update({username:before.data.username}).eq('id',req.user.id);return res.status(500).json({message:'Profil belum disimpan.'})}
  const avatar=body.nickname.split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase();res.json({user:{...req.user,username:body.username,nickname:body.nickname,bio:body.bio,accent:body.accent,avatar}})
})

const imageParser=express.raw({type:['image/jpeg','image/png','image/webp'],limit:config.uploads.profileMaxBytes})
function imageMeta(buffer:Buffer):{ext:string;width:number;height:number}|null{
  if(buffer.length>24&&buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return{ext:'png',width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)}
  if(buffer.length>30&&buffer[0]===0xff&&buffer[1]===0xd8){let offset=2;while(offset+9<buffer.length){if(buffer[offset]!==0xff){offset++;continue}const marker=buffer[offset+1];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return{ext:'jpg',height:buffer.readUInt16BE(offset+5),width:buffer.readUInt16BE(offset+7)};if(marker===0xd8||marker===0xd9){offset+=2;continue}const size=buffer.readUInt16BE(offset+2);if(size<2)break;offset+=2+size}}
  if(buffer.length>30&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'){const kind=buffer.toString('ascii',12,16);if(kind==='VP8X')return{ext:'webp',width:1+buffer.readUIntLE(24,3),height:1+buffer.readUIntLE(27,3)};if(kind==='VP8 '&&buffer[23]===0x9d&&buffer[24]===0x01&&buffer[25]===0x2a)return{ext:'webp',width:buffer.readUInt16LE(26)&0x3fff,height:buffer.readUInt16LE(28)&0x3fff};if(kind==='VP8L'&&buffer[20]===0x2f){const b1=buffer[21],b2=buffer[22],b3=buffer[23],b4=buffer[24];return{ext:'webp',width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0xf)<<10)|(b3<<2)|(b2>>6))}}}
  return null
}
const storagePathFromUrl=(url:string|undefined)=>{if(!url)return null;const marker=`/storage/v1/object/public/${config.supabase.storageBucket}/`;const index=url.indexOf(marker);return index>=0?decodeURIComponent(url.slice(index+marker.length)):null}
async function replaceStoredImage(options:{table:'profiles'|'products';idColumn:'user_id'|'id';id:string;pathColumn:string;urlColumn:string;prefix:string;buffer:Buffer;contentType:string;ext:string}){
  const db=getSupabaseAdmin();const previous=await db.from(options.table).select(`${options.pathColumn},${options.urlColumn}`).eq(options.idColumn,options.id).maybeSingle()
  let row:Record<string,string|null>;let storesPath=true
  if(!previous.error&&previous.data)row=previous.data as unknown as Record<string,string|null>
  else if(!previous.error)throw new Error(options.table==='products'?'Produk tidak ditemukan.':'Record media tidak ditemukan.')
  else if(options.table==='profiles'){const legacy=await db.from('profiles').select(options.urlColumn).eq(options.idColumn,options.id).maybeSingle();if(legacy.error||!legacy.data)throw new Error('Record media tidak ditemukan.');row=legacy.data as unknown as Record<string,string|null>;storesPath=false}
  else throw new Error('Pembaruan media belum diterapkan.')
  const oldPath=row[options.pathColumn]||storagePathFromUrl(row[options.urlColumn]||undefined)
  const newPath=`${options.prefix}/${crypto.randomUUID()}.${options.ext}`;const upload=await db.storage.from(config.supabase.storageBucket).upload(newPath,options.buffer,{contentType:options.contentType,upsert:false});if(upload.error){console.error('[storage] upload failed:',upload.error.message);throw new Error('Gambar belum dapat diunggah. Coba lagi.')}
  const publicUrl=db.storage.from(config.supabase.storageBucket).getPublicUrl(newPath).data.publicUrl;const patch:Record<string,string>={[options.urlColumn]:publicUrl};if(storesPath)patch[options.pathColumn]=newPath
  const update=await db.from(options.table).update(patch).eq(options.idColumn,options.id).select(options.idColumn).maybeSingle();if(update.error||!update.data){await db.storage.from(config.supabase.storageBucket).remove([newPath]);if(update.error)console.error('[media] update failed:',update.error.message);throw new Error('Gambar belum dapat disimpan. Coba lagi.')}
  if(oldPath&&oldPath!==newPath){const removed=await db.storage.from(config.supabase.storageBucket).remove([oldPath]);if(removed.error)console.error('[storage] old image cleanup failed:',removed.error.message)}
  return{url:publicUrl,path:newPath}
}
app.post('/api/uploads/profile',requireSupabase,withLimiter('upload'),requireAuth,imageParser,async(req:AuthedRequest,res)=>{
  const kind=req.query.kind==='banner'?'banner':'avatar';const buffer=req.body as Buffer
  if(!req.user||!Buffer.isBuffer(buffer)||buffer.length<100)return res.status(422).json({message:'File gambar tidak valid.'})
  if(kind==='avatar'&&buffer.length>2*1024*1024)return res.status(413).json({message:'Ukuran avatar maksimal 2MB.'})
  const meta=imageMeta(buffer);if(!meta)return res.status(422).json({message:'Format file tidak cocok dengan isi gambar.'})
  if(meta.width<config.uploads.imageMinDimension||meta.height<config.uploads.imageMinDimension)return res.status(422).json({message:`Resolusi minimal ${config.uploads.imageMinDimension} × ${config.uploads.imageMinDimension} piksel.`})
  if(meta.width>config.uploads.imageMaxDimension||meta.height>config.uploads.imageMaxDimension)return res.status(422).json({message:'Dimensi gambar terlalu besar.'})
  if(kind==='banner'&&meta.width/meta.height<config.uploads.bannerMinAspectRatio)return res.status(422).json({message:`Banner perlu rasio minimal ${config.uploads.bannerMinAspectRatio}:1.`})
  try{const stored=await replaceStoredImage({table:'profiles',idColumn:'user_id',id:req.user.id,pathColumn:kind==='banner'?'banner_path':'avatar_path',urlColumn:kind==='banner'?'banner_url':'avatar_url',prefix:`profiles/${req.user.id}`,buffer,contentType:meta.ext==='jpg'?'image/jpeg':`image/${meta.ext}`,ext:meta.ext});res.status(201).json({...stored,width:meta.width,height:meta.height})}catch(error){res.status(500).json({message:error instanceof Error?error.message:'Gambar gagal diunggah.'})}
})

app.get('/api/orders',requireSupabase,requireAuth,async(req:AuthedRequest,res)=>{const {data,error}=await getSupabaseAdmin().from('orders').select('display_id,product_id,product_snapshot,total,status,created_at').eq('buyer_id',req.user!.id).order('created_at',{ascending:false});if(error)return res.status(500).json({message:'Riwayat pembelian gagal dimuat.'});res.json({orders:(data||[]).map(mapOrder)})})
app.post('/api/orders',requireSupabase,requireAuth,async(req:AuthedRequest,res)=>{const body=parse(z.object({productId:z.string().max(80),paymentMethod:z.enum(['balance','bank','ewallet'])}),req.body,res);if(!body||!req.user)return;const result=await getSupabaseAdmin().rpc('create_order_admin',{p_buyer_id:req.user.id,p_product_id:body.productId,p_payment_method:body.paymentMethod});if(result.error)return res.status(409).json({message:result.error.message});const order=Array.isArray(result.data)?result.data[0]:result.data;res.status(201).json({orderId:order.display_id,status:order.status,amount:Number(order.total)})})

app.get('/api/notifications',requireSupabase,requireAuth,async(req:AuthedRequest,res)=>{const {data,error}=await getSupabaseAdmin().from('notifications').select('id,type,title,body,read_at,created_at').eq('user_id',req.user!.id).order('created_at',{ascending:false}).limit(30);if(error)return res.status(500).json({message:'Notifikasi gagal dimuat.'});const notifications:Notification[]=(data||[]).map((row:any)=>({id:String(row.id),type:row.type,title:String(row.title),message:String(row.body),time:relativeTime(row.created_at),createdAt:String(row.created_at),read:Boolean(row.read_at)}));res.json({notifications})})
app.patch('/api/notifications/:id/read',requireSupabase,requireAuth,async(req:AuthedRequest,res)=>{await getSupabaseAdmin().from('notifications').update({read_at:new Date().toISOString()}).eq('id',String(req.params.id)).eq('user_id',req.user!.id);res.json({ok:true})})
app.post('/api/notifications/read-all',requireSupabase,requireAuth,async(req:AuthedRequest,res)=>{await getSupabaseAdmin().from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',req.user!.id).is('read_at',null);res.json({ok:true})})

app.get('/api/admin/users',requireSupabase,requireAdmin,async(_req,res)=>{const {data,error}=await getSupabaseAdmin().from('users').select('id,username,email,role,status,balance,created_at,profiles(nickname,avatar_url)').order('created_at',{ascending:false});if(error)return res.status(500).json({message:'Pengguna gagal dimuat.'});res.json({users:(data||[]).map((row:any)=>{const profile=profileFromRelation(row.profiles) as any;const nickname=String(profile.nickname||row.username);return{id:String(row.id),username:String(row.username),email:String(row.email),nickname,role:row.role,status:row.status,balance:Number(row.balance),joinedAt:String(row.created_at),avatar:nickname.slice(0,2).toUpperCase(),avatarUrl:profile.avatar_url||undefined}})})})
app.patch('/api/admin/users/:id',requireSupabase,requireAdmin,async(req:AuthedRequest,res)=>{const body=parse(userAdminUpdateSchema,req.body,res);if(!body||!req.user)return;const id=String(req.params.id);if(id===req.user.id&&(body.status==='suspended'||(body.role&&body.role!=='admin')))return res.status(422).json({message:'Admin tidak dapat menangguhkan atau menurunkan role akun sendiri.'});const db=getSupabaseAdmin();const before=await db.from('users').select('role,status').eq('id',id).maybeSingle();if(!before.data)return res.status(404).json({message:'Pengguna tidak ditemukan.'});const update=await db.from('users').update(body).eq('id',id).select('id,role,status').single();if(update.error)return res.status(500).json({message:'Pengguna belum diperbarui.'});await audit(req,'user.update','user',id,before.data,update.data);res.json({user:update.data})})

app.get('/api/admin/orders',requireSupabase,requireAdmin,async(_req,res)=>{const {data,error}=await getSupabaseAdmin().from('orders').select('display_id,product_id,product_snapshot,total,status,created_at').order('created_at',{ascending:false}).limit(100);if(error)return res.status(500).json({message:'Transaksi gagal dimuat.'});res.json({orders:(data||[]).map(mapOrder)})})
app.post('/api/admin/products',requireSupabase,requireAdmin,async(req:AuthedRequest,res)=>{const body=parse(productInputSchema,req.body,res);if(!body||!req.user)return;const base=body.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,52)||'cookie';const id=`${base}-${crypto.randomBytes(2).toString('hex')}`;const payload={id,...body,publisher_name:req.user.nickname,publisher_username:req.user.username,publisher_verified:req.user.role==='admin'};const result=await getSupabaseAdmin().from('products').insert(payload).select(productColumns).single();if(result.error)return res.status(422).json({message:result.error.message});await audit(req,'product.create','product',id,null,result.data);res.status(201).json({product:mapProduct(result.data)})})
app.patch('/api/admin/products/:id',requireSupabase,requireAdmin,async(req:AuthedRequest,res)=>{const body=parse(productInputSchema.partial().refine(value=>Object.keys(value).length>0,'Tidak ada perubahan.'),req.body,res);if(!body)return;const id=String(req.params.id);const db=getSupabaseAdmin();const before=await db.from('products').select(productColumns).eq('id',id).maybeSingle();if(!before.data)return res.status(404).json({message:'Produk tidak ditemukan.'});const result=await db.from('products').update(body).eq('id',id).select(productColumns).single();if(result.error)return res.status(422).json({message:result.error.message});await audit(req,'product.update','product',id,before.data,result.data);res.json({product:mapProduct(result.data)})})
app.post('/api/admin/products/:id/image',requireSupabase,withLimiter('upload'),requireAdmin,imageParser,async(req:AuthedRequest,res)=>{
  const id=String(req.params.id);const buffer=req.body as Buffer;if(!Buffer.isBuffer(buffer)||buffer.length<100)return res.status(422).json({message:'File gambar tidak valid.'});const meta=imageMeta(buffer);if(!meta)return res.status(422).json({message:'Format gambar tidak valid.'});if(meta.width<config.uploads.imageMinDimension||meta.height<config.uploads.imageMinDimension)return res.status(422).json({message:`Resolusi minimal ${config.uploads.imageMinDimension} × ${config.uploads.imageMinDimension} piksel.`});if(meta.width>config.uploads.imageMaxDimension||meta.height>config.uploads.imageMaxDimension)return res.status(422).json({message:'Dimensi gambar terlalu besar.'});try{const stored=await replaceStoredImage({table:'products',idColumn:'id',id,pathColumn:'image_path',urlColumn:'image_url',prefix:`products/${id}`,buffer,contentType:meta.ext==='jpg'?'image/jpeg':`image/${meta.ext}`,ext:meta.ext});await audit(req,'product.image.update','product',id);res.status(201).json({...stored,width:meta.width,height:meta.height})}catch(error){const message=error instanceof Error?error.message:'Gambar produk gagal diunggah.';res.status(message==='Produk tidak ditemukan.'?404:500).json({message})}
})
app.delete('/api/admin/products/:id/image',requireSupabase,requireAdmin,async(req:AuthedRequest,res)=>{const id=String(req.params.id);const db=getSupabaseAdmin();const current=await db.from('products').select('image_path,image_url').eq('id',id).maybeSingle();if(current.error)return res.status(500).json({message:'Pembaruan media belum diterapkan.'});if(!current.data)return res.status(404).json({message:'Produk tidak ditemukan.'});const oldPath=current.data.image_path||storagePathFromUrl(current.data.image_url||undefined);const update=await db.from('products').update({image_path:null,image_url:null}).eq('id',id);if(update.error)return res.status(500).json({message:'Gambar produk belum dapat dihapus.'});if(oldPath){const removed=await db.storage.from(config.supabase.storageBucket).remove([oldPath]);if(removed.error)console.error('[storage] product image cleanup failed:',removed.error.message)}await audit(req,'product.image.delete','product',id);res.json({ok:true})})
app.delete('/api/admin/products/:id',requireSupabase,requireAdmin,async(req:AuthedRequest,res)=>{const id=String(req.params.id);const db=getSupabaseAdmin();const before=await db.from('products').select(productColumns).eq('id',id).maybeSingle();if(!before.data)return res.status(404).json({message:'Produk tidak ditemukan.'});const result=await db.from('products').delete().eq('id',id);if(result.error)return res.status(409).json({message:'Produk masih digunakan transaksi dan tidak dapat dihapus.'});const mediaPath=before.data.image_path||storagePathFromUrl(before.data.image_url||undefined);if(mediaPath){const removed=await db.storage.from(config.supabase.storageBucket).remove([mediaPath]);if(removed.error)console.error('[storage] deleted product cleanup failed:',removed.error.message)}await audit(req,'product.delete','product',id,before.data,null);res.json({ok:true})})

app.use('/api',(_req,res)=>res.status(404).json({message:'Endpoint tidak ditemukan.'}))
app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{const issue=error as {type?:string};if(issue?.type==='entity.too.large')return res.status(413).json({message:'Ukuran file melebihi batas 5MB.'});console.error(error);res.status(500).json({message:'Layanan sedang bermasalah. Coba beberapa saat lagi.'})})
