import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import { z } from 'zod'
import { config } from './config'
import { createRateLimiters } from './rateLimit'
import { isSupabaseConfigured } from './supabase'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const isProd = config.isProduction
const app = express()
const port = config.port
const limiters = await createRateLimiters()

app.disable('x-powered-by')
if (config.app.trustProxy) app.set('trust proxy', 1)
// Arena Live Preview renders the app in a cross-origin iframe. Frame protection is
// applied by the production reverse proxy; disabling it here keeps local/preview
// embedding functional without relaxing API authorization.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, frameguard: false }))
app.use(compression())
app.use(express.json({ limit: '256kb' }))
app.use(cookieParser())
app.use('/api', limiters.api)

const safeUser = (user: StoredUser) => ({ id:user.id, username:user.username, email:user.email, nickname:user.nickname, role:user.role, balance:user.balance, avatar:user.avatar, bio:user.bio, joinedAt:user.joinedAt, accent:user.accent, seller:false })
type Role = 'user'|'admin'
type StoredUser = { id:string; username:string; email:string; nickname:string; role:Role; balance:number; avatar:string; bio:string; joinedAt:string; accent:string; passwordHash:string; suspended?:boolean }
type AuthedRequest = Request & { user?: StoredUser; sessionId?: string }

const users: StoredUser[] = [
  { id:'u-raka', username:'raka_sore', email:'raka@langgor.store', nickname:'Raka Aditya', role:'user', balance:248500, avatar:'RA', bio:'Member aktif Langgor Store.', joinedAt:'2025-05-12', accent:'#8b5cf6', passwordHash:bcrypt.hashSync('Langgor123!',config.auth.bcryptRounds) },
  { id:'u-admin', username:'admin', email:'admin@langgor.store', nickname:'Nara Admin', role:'admin', balance:0, avatar:'NA', bio:'Menjaga validation system tetap normal.', joinedAt:'2025-01-01', accent:'#22d3ee', passwordHash:bcrypt.hashSync('Langgor123!',config.auth.bcryptRounds) }
]
const sessions = new Map<string,{userId:string;expiresAt:number}>()
const hashSession = (token:string) => crypto.createHmac('sha256',config.auth.sessionSecret).update(token).digest('hex')
const auditLogs: Array<{id:string;adminId:string;action:string;target:string;at:string;ip:string}> = []
const orders: Array<{id:string;userId:string;productId:string;price:number;status:string;paymentMethod:string;createdAt:string}> = []
const productPrices: Record<string,number> = { 'cookie-basic':6000,'cookie-premkum':12000,'cookie-ultra':25000 }

app.use((req,res,next)=>{
  if (!req.cookies[config.csrf.cookieName]) res.cookie(config.csrf.cookieName,crypto.randomBytes(24).toString('hex'),{ httpOnly:false, sameSite:config.auth.cookieSameSite, secure:config.auth.cookieSecure, maxAge:config.csrf.ttlMs })
  next()
})

app.use((req,res,next)=>{
  if (!['POST','PATCH','PUT','DELETE'].includes(req.method)) return next()
  const origin=req.get('Origin')
  if(isProd&&origin&&!config.app.allowedOrigins.has(origin))return res.status(403).json({message:'Origin permintaan tidak diizinkan.'})
  const cookie=req.cookies[config.csrf.cookieName]
  const header=req.get('X-CSRF-Token')
  const cookieBuffer=Buffer.from(String(cookie||''));const headerBuffer=Buffer.from(String(header||''))
  if (!cookie || !header || cookieBuffer.length!==headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer,headerBuffer)) return res.status(403).json({message:'Sesi keamanan kedaluwarsa. Muat ulang halaman.'})
  next()
})

function attachUser(req: AuthedRequest,_res:Response,next:NextFunction){
  const token=req.cookies[config.auth.sessionCookieName]
  if(token){const id=hashSession(String(token));const session=sessions.get(id);if(session&&session.expiresAt>Date.now()){req.sessionId=id;req.user=users.find(u=>u.id===session.userId)}else sessions.delete(id)}
  next()
}
app.use(attachUser)

function requireAuth(req:AuthedRequest,res:Response,next:NextFunction){if(!req.user)return res.status(401).json({message:'Silakan masuk untuk melanjutkan.'});if(req.user.suspended)return res.status(403).json({message:'Akun sedang ditangguhkan.'});next()}
function requireAdmin(req:AuthedRequest,res:Response,next:NextFunction){requireAuth(req,res,()=>{if(req.user?.role!=='admin')return res.status(403).json({message:'Akses admin diperlukan.'});next()})}
const parse = <T>(schema:z.ZodType<T>,body:unknown,res:Response):T|null=>{const result=schema.safeParse(body);if(!result.success){res.status(422).json({message:result.error.issues[0]?.message||'Data tidak valid.'});return null}return result.data}

const loginSchema=z.object({identifier:z.string().min(3).max(100),password:z.string().min(8).max(128),remember:z.boolean().default(false)})
const registerSchema=z.object({username:z.string().regex(/^[a-z0-9_]{4,20}$/,'Username tidak valid.'),email:z.string().email('Email tidak valid.').max(120),password:z.string().min(8,'Password minimal 8 karakter.').max(128)})

app.get('/api/health',(_req,res)=>res.json({ok:true,time:new Date().toISOString(),environment:config.env,services:{supabase:isSupabaseConfigured?'configured':'not-configured',rateLimit:config.rateLimit.store}}))
app.get('/api/auth/me',(req:AuthedRequest,res)=>res.json({user:req.user?safeUser(req.user):null}))
app.post('/api/auth/login',limiters.auth,async(req:AuthedRequest,res)=>{
  const body=parse(loginSchema,req.body,res);if(!body)return
  const user=users.find(u=>u.email.toLowerCase()===body.identifier.toLowerCase()||u.username.toLowerCase()===body.identifier.toLowerCase())
  if(!user||!await bcrypt.compare(body.password,user.passwordHash))return res.status(401).json({message:'Email/username atau password tidak cocok.'})
  if(user.suspended)return res.status(403).json({message:'Akun sedang ditangguhkan. Hubungi dukungan.'})
  const sessionId=crypto.randomBytes(32).toString('hex');const ttl=body.remember?config.auth.rememberTtlMs:config.auth.sessionTtlMs;sessions.set(hashSession(sessionId),{userId:user.id,expiresAt:Date.now()+ttl})
  res.cookie(config.auth.sessionCookieName,sessionId,{httpOnly:true,sameSite:config.auth.cookieSameSite,secure:config.auth.cookieSecure,maxAge:ttl,path:'/'}).json({user:safeUser(user)})
})
app.post('/api/auth/register',limiters.auth,async(req,res)=>{
  const body=parse(registerSchema,req.body,res);if(!body)return
  if(users.some(u=>u.username===body.username))return res.status(409).json({message:'Username sudah digunakan.'})
  if(users.some(u=>u.email.toLowerCase()===body.email.toLowerCase()))return res.status(409).json({message:'Email sudah terdaftar.'})
  const user:StoredUser={id:crypto.randomUUID(),username:body.username,email:body.email.toLowerCase(),nickname:body.username,role:'user',balance:0,avatar:body.username.slice(0,2).toUpperCase(),bio:'Baru bergabung di Langgor Store.',joinedAt:new Date().toISOString(),accent:'#8b5cf6',passwordHash:await bcrypt.hash(body.password,config.auth.bcryptRounds)}
  users.push(user);const sessionId=crypto.randomBytes(32).toString('hex');sessions.set(hashSession(sessionId),{userId:user.id,expiresAt:Date.now()+config.auth.sessionTtlMs});res.cookie(config.auth.sessionCookieName,sessionId,{httpOnly:true,sameSite:config.auth.cookieSameSite,secure:config.auth.cookieSecure,maxAge:config.auth.sessionTtlMs,path:'/'}).status(201).json({user:safeUser(user)})
})
app.post('/api/auth/logout',(req:AuthedRequest,res)=>{if(req.sessionId)sessions.delete(req.sessionId);res.clearCookie(config.auth.sessionCookieName,{path:'/'}).json({ok:true})})
app.post('/api/auth/forgot',limiters.auth,(req,res)=>{const schema=z.object({email:z.string().email()});const body=parse(schema,req.body,res);if(!body)return;res.json({ok:true,message:'Jika email terdaftar, instruksi akan dikirim.'})})

app.patch('/api/profile',requireAuth,(req:AuthedRequest,res)=>{
  const schema=z.object({nickname:z.string().min(2).max(32),username:z.string().regex(/^[a-z0-9_]{4,20}$/),bio:z.string().max(160),accent:z.enum(['#8b5cf6','#ec4899','#22d3ee','#f59e0b'])})
  const body=parse(schema,req.body,res);if(!body||!req.user)return
  if(users.some(u=>u.id!==req.user!.id&&u.username===body.username))return res.status(409).json({message:'Username sudah digunakan.'})
  Object.assign(req.user,body);res.json({user:safeUser(req.user)})
})

const imageParser=express.raw({type:['image/jpeg','image/png','image/webp'],limit:config.uploads.profileMaxBytes})
function imageMeta(buffer:Buffer):{ext:string;width:number;height:number}|null{
  if(buffer.length>24&&buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return{ext:'png',width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)}
  if(buffer.length>30&&buffer[0]===0xff&&buffer[1]===0xd8){let offset=2;while(offset+9<buffer.length){if(buffer[offset]!==0xff){offset++;continue}const marker=buffer[offset+1];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return{ext:'jpg',height:buffer.readUInt16BE(offset+5),width:buffer.readUInt16BE(offset+7)};if(marker===0xd8||marker===0xd9){offset+=2;continue}const size=buffer.readUInt16BE(offset+2);if(size<2)break;offset+=2+size}}
  if(buffer.length>30&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'){const kind=buffer.toString('ascii',12,16);if(kind==='VP8X')return{ext:'webp',width:1+buffer.readUIntLE(24,3),height:1+buffer.readUIntLE(27,3)};if(kind==='VP8 '&&buffer[23]===0x9d&&buffer[24]===0x01&&buffer[25]===0x2a)return{ext:'webp',width:buffer.readUInt16LE(26)&0x3fff,height:buffer.readUInt16LE(28)&0x3fff};if(kind==='VP8L'&&buffer[20]===0x2f){const b1=buffer[21],b2=buffer[22],b3=buffer[23],b4=buffer[24];return{ext:'webp',width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0xf)<<10)|(b3<<2)|(b2>>6))}}}
  return null
}
app.post('/api/uploads/profile',limiters.upload,requireAuth,imageParser,async(req:AuthedRequest,res)=>{
  const kind=req.query.kind==='banner'?'banner':'avatar';const buffer=req.body as Buffer
  if(!Buffer.isBuffer(buffer)||buffer.length<100)return res.status(422).json({message:'File gambar tidak valid.'})
  const meta=imageMeta(buffer);if(!meta)return res.status(422).json({message:'Format file tidak cocok dengan isi gambar.'})
  if(meta.width<config.uploads.imageMinDimension||meta.height<config.uploads.imageMinDimension)return res.status(422).json({message:`Resolusi gambar minimal ${config.uploads.imageMinDimension} × ${config.uploads.imageMinDimension} piksel.`})
  if(meta.width>config.uploads.imageMaxDimension||meta.height>config.uploads.imageMaxDimension)return res.status(422).json({message:'Dimensi gambar terlalu besar.'})
  if(kind==='banner'&&meta.width/meta.height<config.uploads.bannerMinAspectRatio)return res.status(422).json({message:`Banner perlu rasio minimal ${config.uploads.bannerMinAspectRatio}:1.`})
  const uploadDir=path.join(root,'uploads');await fs.mkdir(uploadDir,{recursive:true});const filename=`${req.user!.id}-${kind}-${crypto.randomUUID()}.${meta.ext}`;await fs.writeFile(path.join(uploadDir,filename),buffer,{flag:'wx'});res.status(201).json({url:`/media/${filename}`,width:meta.width,height:meta.height})
})
app.use('/media',express.static(path.join(root,'uploads'),{maxAge:'7d',immutable:true,fallthrough:false,dotfiles:'deny'}))

app.post('/api/orders',requireAuth,(req:AuthedRequest,res)=>{
  const schema=z.object({productId:z.string().max(80),paymentMethod:z.enum(['balance','bank','ewallet'])});const body=parse(schema,req.body,res);if(!body||!req.user)return
  const price=productPrices[body.productId];if(!price)return res.status(404).json({message:'Produk tidak ditemukan atau sudah diturunkan.'})
  if(body.paymentMethod==='balance'&&req.user.balance<price)return res.status(409).json({message:'Saldo tidak cukup. Pilih Virtual Account atau e-wallet.'})
  const order={id:`LGR-${Math.floor(10000+Math.random()*89999)}`,userId:req.user.id,productId:body.productId,price,status:'processing',paymentMethod:body.paymentMethod,createdAt:new Date().toISOString()}
  if(body.paymentMethod==='balance')req.user.balance-=price
  orders.push(order);res.status(201).json({orderId:order.id,status:order.status,amount:order.price})
})

app.post('/api/admin/action',requireAdmin,(req:AuthedRequest,res)=>{
  const schema=z.object({type:z.enum(['suspend','restore','approve','reject']),id:z.string().min(1).max(100),label:z.string().max(100)});const body=parse(schema,req.body,res);if(!body||!req.user)return
  if(body.type==='suspend'||body.type==='restore'){const target=users.find(u=>u.id===body.id);if(target)target.suspended=body.type==='suspend'}
  const ip=crypto.createHmac('sha256',config.observability.auditIpHashSecret).update(req.ip||'unknown').digest('hex');auditLogs.push({id:crypto.randomUUID(),adminId:req.user.id,action:body.type,target:body.id,at:new Date().toISOString(),ip});res.json({ok:true,auditId:auditLogs.at(-1)?.id})
})

// Error responses never expose stack traces to the browser.
app.use('/api',(req,res)=>res.status(404).json({message:'Endpoint tidak ditemukan.'}))
app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{console.error(error);res.status(500).json({message:'Server sedang bermasalah. Coba beberapa saat lagi.'})})

if(isProd){
  app.use(express.static(path.join(root,'dist'),{maxAge:'1y',immutable:true,index:false}))
  app.get('/{*splat}',(_req,res)=>res.sendFile(path.join(root,'dist','index.html')))
}else{
  const {createServer}=await import('vite')
  const vite=await createServer({root,server:{middlewareMode:true,host:'0.0.0.0',allowedHosts:true},appType:'spa'})
  app.use(vite.middlewares)
}

app.listen(port,'0.0.0.0',()=>console.log(`Langgor Store listening on http://0.0.0.0:${port}`))
