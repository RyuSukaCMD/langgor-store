import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const isProd = process.env.NODE_ENV === 'production'
const app = express()
const port = Number(process.env.PORT || 5173)

app.disable('x-powered-by')
// Arena Live Preview renders the app in a cross-origin iframe. Frame protection is
// applied by the production reverse proxy; disabling it here keeps local/preview
// embedding functional without relaxing API authorization.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, frameguard: false }))
app.use(compression())
app.use(express.json({ limit: '256kb' }))
app.use(cookieParser())

const safeUser = (user: StoredUser) => ({ id:user.id, username:user.username, email:user.email, nickname:user.nickname, role:user.role, balance:user.balance, avatar:user.avatar, bio:user.bio, joinedAt:user.joinedAt, accent:user.accent, seller:user.role==='seller'||user.role==='admin' })
type Role = 'user'|'seller'|'admin'
type StoredUser = { id:string; username:string; email:string; nickname:string; role:Role; balance:number; avatar:string; bio:string; joinedAt:string; accent:string; passwordHash:string; suspended?:boolean }
type AuthedRequest = Request & { user?: StoredUser; sessionId?: string }

const users: StoredUser[] = [
  { id:'u-raka', username:'raka_sore', email:'raka@langgor.store', nickname:'Raka Aditya', role:'seller', balance:248500, avatar:'RA', bio:'Suka produk digital yang ringkas dan kerja dari sudut kota.', joinedAt:'2025-05-12', accent:'#8b5cf6', passwordHash:bcrypt.hashSync('Langgor123!',10) },
  { id:'u-admin', username:'admin', email:'admin@langgor.store', nickname:'Nara Admin', role:'admin', balance:0, avatar:'NA', bio:'Menjaga Langgor tetap aman.', joinedAt:'2025-01-01', accent:'#22d3ee', passwordHash:bcrypt.hashSync('Langgor123!',10) }
]
const sessions = new Map<string,{userId:string;expiresAt:number}>()
const auditLogs: Array<{id:string;adminId:string;action:string;target:string;at:string;ip:string}> = []
const orders: Array<{id:string;userId:string;productId:string;price:number;status:string;paymentMethod:string;createdAt:string}> = []
const productPrices: Record<string,number> = { 'cookie-stream-plus':29000,'cookie-design-pro':19000,'cookie-music-wave':14000,'cookie-vpn-guard':35000,'account-game-valor-87':1250000,'account-creator-42k':3750000,'account-dev-tools':685000,'account-game-farm':420000 }
const sellerOwnership = new Map<string,string>(Object.keys(productPrices).map(id=>[id,'u-raka']))

app.use((req,res,next)=>{
  if (!req.cookies.langgor_csrf) res.cookie('langgor_csrf',crypto.randomBytes(24).toString('hex'),{ httpOnly:false, sameSite:'lax', secure:isProd, maxAge:24*60*60*1000 })
  next()
})

app.use((req,res,next)=>{
  if (!['POST','PATCH','PUT','DELETE'].includes(req.method)) return next()
  const cookie=req.cookies.langgor_csrf
  const header=req.get('X-CSRF-Token')
  const cookieBuffer=Buffer.from(String(cookie||''));const headerBuffer=Buffer.from(String(header||''))
  if (!cookie || !header || cookieBuffer.length!==headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer,headerBuffer)) return res.status(403).json({message:'Sesi keamanan kedaluwarsa. Muat ulang halaman.'})
  next()
})

function attachUser(req: AuthedRequest,_res:Response,next:NextFunction){
  const id=req.cookies.langgor_session
  if(id){const session=sessions.get(id);if(session&&session.expiresAt>Date.now()){req.sessionId=id;req.user=users.find(u=>u.id===session.userId)}else sessions.delete(id)}
  next()
}
app.use(attachUser)

function requireAuth(req:AuthedRequest,res:Response,next:NextFunction){if(!req.user)return res.status(401).json({message:'Silakan masuk untuk melanjutkan.'});if(req.user.suspended)return res.status(403).json({message:'Akun sedang ditangguhkan.'});next()}
function requireSeller(req:AuthedRequest,res:Response,next:NextFunction){requireAuth(req,res,()=>{if(!req.user||!['seller','admin'].includes(req.user.role))return res.status(403).json({message:'Fitur ini hanya untuk seller.'});next()})}
function requireAdmin(req:AuthedRequest,res:Response,next:NextFunction){requireAuth(req,res,()=>{if(req.user?.role!=='admin')return res.status(403).json({message:'Akses admin diperlukan.'});next()})}
const parse = <T>(schema:z.ZodType<T>,body:unknown,res:Response):T|null=>{const result=schema.safeParse(body);if(!result.success){res.status(422).json({message:result.error.issues[0]?.message||'Data tidak valid.'});return null}return result.data}

const authLimit=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:true,legacyHeaders:false,message:{message:'Terlalu banyak percobaan. Tunggu beberapa menit.'}})
const loginSchema=z.object({identifier:z.string().min(3).max(100),password:z.string().min(8).max(128),remember:z.boolean().default(false)})
const registerSchema=z.object({username:z.string().regex(/^[a-z0-9_]{4,20}$/,'Username tidak valid.'),email:z.string().email('Email tidak valid.').max(120),password:z.string().min(8,'Password minimal 8 karakter.').max(128)})

app.get('/api/health',(_req,res)=>res.json({ok:true,time:new Date().toISOString()}))
app.get('/api/auth/me',(req:AuthedRequest,res)=>{if(!req.user)return res.status(401).json({message:'Belum masuk.'});res.json({user:safeUser(req.user)})})
app.post('/api/auth/login',authLimit,async(req:AuthedRequest,res)=>{
  const body=parse(loginSchema,req.body,res);if(!body)return
  const user=users.find(u=>u.email.toLowerCase()===body.identifier.toLowerCase()||u.username.toLowerCase()===body.identifier.toLowerCase())
  if(!user||!await bcrypt.compare(body.password,user.passwordHash))return res.status(401).json({message:'Email/username atau password tidak cocok.'})
  if(user.suspended)return res.status(403).json({message:'Akun sedang ditangguhkan. Hubungi dukungan.'})
  const sessionId=crypto.randomBytes(32).toString('hex');const ttl=body.remember?30*86400000:12*3600000;sessions.set(sessionId,{userId:user.id,expiresAt:Date.now()+ttl})
  res.cookie('langgor_session',sessionId,{httpOnly:true,sameSite:'lax',secure:isProd,maxAge:ttl,path:'/'}).json({user:safeUser(user)})
})
app.post('/api/auth/register',authLimit,async(req,res)=>{
  const body=parse(registerSchema,req.body,res);if(!body)return
  if(users.some(u=>u.username===body.username))return res.status(409).json({message:'Username sudah digunakan.'})
  if(users.some(u=>u.email.toLowerCase()===body.email.toLowerCase()))return res.status(409).json({message:'Email sudah terdaftar.'})
  const user:StoredUser={id:crypto.randomUUID(),username:body.username,email:body.email.toLowerCase(),nickname:body.username,role:'user',balance:0,avatar:body.username.slice(0,2).toUpperCase(),bio:'Baru bergabung di Langgor Store.',joinedAt:new Date().toISOString(),accent:'#8b5cf6',passwordHash:await bcrypt.hash(body.password,12)}
  users.push(user);const sessionId=crypto.randomBytes(32).toString('hex');sessions.set(sessionId,{userId:user.id,expiresAt:Date.now()+12*3600000});res.cookie('langgor_session',sessionId,{httpOnly:true,sameSite:'lax',secure:isProd,maxAge:12*3600000,path:'/'}).status(201).json({user:safeUser(user)})
})
app.post('/api/auth/logout',(req:AuthedRequest,res)=>{if(req.sessionId)sessions.delete(req.sessionId);res.clearCookie('langgor_session',{path:'/'}).json({ok:true})})
app.post('/api/auth/forgot',authLimit,(req,res)=>{const schema=z.object({email:z.string().email()});const body=parse(schema,req.body,res);if(!body)return;res.json({ok:true,message:'Jika email terdaftar, instruksi akan dikirim.'})})

app.patch('/api/profile',requireAuth,(req:AuthedRequest,res)=>{
  const schema=z.object({nickname:z.string().min(2).max(32),username:z.string().regex(/^[a-z0-9_]{4,20}$/),bio:z.string().max(160),accent:z.enum(['#8b5cf6','#ec4899','#22d3ee','#f59e0b'])})
  const body=parse(schema,req.body,res);if(!body||!req.user)return
  if(users.some(u=>u.id!==req.user!.id&&u.username===body.username))return res.status(409).json({message:'Username sudah digunakan.'})
  Object.assign(req.user,body);res.json({user:safeUser(req.user)})
})

const imageParser=express.raw({type:['image/jpeg','image/png','image/webp'],limit:'5mb'})
function imageMeta(buffer:Buffer):{ext:string;width:number;height:number}|null{
  if(buffer.length>24&&buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return{ext:'png',width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)}
  if(buffer.length>30&&buffer[0]===0xff&&buffer[1]===0xd8){let offset=2;while(offset+9<buffer.length){if(buffer[offset]!==0xff){offset++;continue}const marker=buffer[offset+1];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return{ext:'jpg',height:buffer.readUInt16BE(offset+5),width:buffer.readUInt16BE(offset+7)};if(marker===0xd8||marker===0xd9){offset+=2;continue}const size=buffer.readUInt16BE(offset+2);if(size<2)break;offset+=2+size}}
  if(buffer.length>30&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'){const kind=buffer.toString('ascii',12,16);if(kind==='VP8X')return{ext:'webp',width:1+buffer.readUIntLE(24,3),height:1+buffer.readUIntLE(27,3)};if(kind==='VP8 '&&buffer[23]===0x9d&&buffer[24]===0x01&&buffer[25]===0x2a)return{ext:'webp',width:buffer.readUInt16LE(26)&0x3fff,height:buffer.readUInt16LE(28)&0x3fff};if(kind==='VP8L'&&buffer[20]===0x2f){const b1=buffer[21],b2=buffer[22],b3=buffer[23],b4=buffer[24];return{ext:'webp',width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0xf)<<10)|(b3<<2)|(b2>>6))}}}
  return null
}
app.post('/api/uploads/profile',requireAuth,imageParser,async(req:AuthedRequest,res)=>{
  const kind=req.query.kind==='banner'?'banner':'avatar';const buffer=req.body as Buffer
  if(!Buffer.isBuffer(buffer)||buffer.length<100)return res.status(422).json({message:'File gambar tidak valid.'})
  const meta=imageMeta(buffer);if(!meta)return res.status(422).json({message:'Format file tidak cocok dengan isi gambar.'})
  if(meta.width<128||meta.height<128)return res.status(422).json({message:'Resolusi gambar minimal 128 × 128 piksel.'})
  if(meta.width>6000||meta.height>6000)return res.status(422).json({message:'Dimensi gambar terlalu besar.'})
  if(kind==='banner'&&meta.width/meta.height<2.5)return res.status(422).json({message:'Banner perlu rasio minimal 2.5:1.'})
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

const listingSchema=z.object({kind:z.enum(['cookie','account']),name:z.string().min(6).max(80),category:z.string().min(2).max(40),description:z.string().min(30).max(400),price:z.number().int().min(1000).max(100000000),stock:z.number().int().min(1).max(999),specs:z.array(z.string().min(2).max(80)).min(1).max(12)})
app.post('/api/seller/listings',requireSeller,(req:AuthedRequest,res)=>{const body=parse(listingSchema,req.body,res);if(!body||!req.user)return;const id=crypto.randomUUID();sellerOwnership.set(id,req.user.id);res.status(201).json({id,status:'pending',...body})})
app.delete('/api/seller/listings/:id',requireSeller,(req:AuthedRequest,res)=>{const id=String(req.params.id);const owner=sellerOwnership.get(id);if(!owner)return res.status(404).json({message:'Listing tidak ditemukan.'});if(owner!==req.user?.id&&req.user?.role!=='admin')return res.status(403).json({message:'Kamu hanya dapat mengubah listing milikmu.'});sellerOwnership.delete(id);res.json({ok:true})})

app.post('/api/admin/action',requireAdmin,(req:AuthedRequest,res)=>{
  const schema=z.object({type:z.enum(['suspend','restore','approve','reject']),id:z.string().min(1).max(100),label:z.string().max(100)});const body=parse(schema,req.body,res);if(!body||!req.user)return
  if(body.type==='suspend'||body.type==='restore'){const target=users.find(u=>u.id===body.id);if(target)target.suspended=body.type==='suspend'}
  auditLogs.push({id:crypto.randomUUID(),adminId:req.user.id,action:body.type,target:body.id,at:new Date().toISOString(),ip:req.ip||'unknown'});res.json({ok:true,auditId:auditLogs.at(-1)?.id})
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
