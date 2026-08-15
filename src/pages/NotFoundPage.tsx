import { LazyMotion, domAnimation, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { ArrowLeft, ArrowRight, Cookie, Home, PackageSearch, SearchX, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useProducts } from '../context/ProductContext'
import './not-found.css'

const container = { hidden: {}, visible: { transition: { staggerChildren: .08, delayChildren: .18 } } }
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }

export function NotFoundPage() {
  const reduceMotion = useReducedMotion()
  const {products}=useProducts()
  const location = useLocation()
  const route = location.pathname.length > 36 ? `${location.pathname.slice(0, 36)}…` : location.pathname
  useEffect(() => {
    const previous = document.title
    document.title = 'Halaman ini tidak tersedia | Langgor Store'
    return () => { document.title = previous }
  }, [])

  return <LazyMotion features={domAnimation}>
    <main className="cookie-404">
      <div className="cookie-404__grid" />
      <m.div className="cookie-404__orb cookie-404__orb--one" animate={reduceMotion ? {} : { x:[0,30,-10,0], y:[0,-20,12,0] }} transition={{duration:11,repeat:Infinity,ease:'easeInOut'}} />
      <m.div className="cookie-404__orb cookie-404__orb--two" animate={reduceMotion ? {} : { x:[0,-25,15,0], y:[0,22,-8,0] }} transition={{duration:14,repeat:Infinity,ease:'easeInOut'}} />

      <header className="cookie-404__header">
        <Logo />
        <span><i /> VALIDATION SYSTEM ONLINE</span>
        <Link to="/" className="cookie-404__home"><Home /> Beranda</Link>
      </header>

      <div className="cookie-404__content">
        <m.section className="cookie-404__copy" initial="hidden" animate="visible" variants={container}>
          <m.div variants={item} className="cookie-404__eyebrow"><SearchX /> ERROR / PAGE NOT FOUND</m.div>
          <m.h1 variants={item}>Halaman ini tidak<br/> <em>tersedia.</em></m.h1>
          <m.p variants={item}>Alamat yang kamu buka tidak tersedia, sudah dipindahkan, atau memang tidak pernah masuk ke katalog Langgor.</m.p>
          <m.div variants={item} className="cookie-404__route"><span>REQUESTED ROUTE</span><code>{route || '/'}</code><b>404</b></m.div>
          <m.div variants={item} className="cookie-404__actions">
            <m.div whileHover={reduceMotion ? {} : { y:-3 }} whileTap={{scale:.98}}><Link className="btn btn--primary btn--lg" to="/store/cookies"><PackageSearch /> Lihat Cookie <ArrowRight /></Link></m.div>
            <m.div whileHover={reduceMotion ? {} : { x:-3 }}><Link className="cookie-404__back" to="/"><ArrowLeft /> Kembali ke beranda</Link></m.div>
          </m.div>
          <m.div variants={item} className="cookie-404__assurance"><ShieldCheck/><span><strong>Sistem tetap normal</strong><small>Hanya halaman ini yang tidak ditemukan.</small></span></m.div>
        </m.section>

        <section className="cookie-404__visual" aria-label="Ilustrasi Cookie tidak ditemukan">
          <m.div className="orbit orbit--outer" animate={reduceMotion ? {} : { rotate:360 }} transition={{duration:22,repeat:Infinity,ease:'linear'}}><i/><i/><i/></m.div>
          <m.div className="orbit orbit--inner" animate={reduceMotion ? {} : { rotate:-360 }} transition={{duration:15,repeat:Infinity,ease:'linear'}}><i/><i/></m.div>
          <m.div className="lost-cookie" initial={{opacity:0,scale:.7,rotate:-14}} animate={{opacity:1,scale:1,rotate:0}} transition={{type:'spring',stiffness:130,damping:15,delay:.2}}>
            <span className="lost-cookie__bite lost-cookie__bite--one"/><span className="lost-cookie__bite lost-cookie__bite--two"/><span className="lost-cookie__chip lost-cookie__chip--one"/><span className="lost-cookie__chip lost-cookie__chip--two"/><span className="lost-cookie__chip lost-cookie__chip--three"/>
            <Cookie />
          </m.div>
          <m.span className="crumb crumb--one" animate={reduceMotion ? {} : { y:[0,-11,0],rotate:[0,18,0] }} transition={{duration:3.2,repeat:Infinity,ease:'easeInOut'}}/>
          <m.span className="crumb crumb--two" animate={reduceMotion ? {} : { y:[0,9,0],x:[0,5,0],rotate:[0,-22,0] }} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}/>
          <m.span className="crumb crumb--three" animate={reduceMotion ? {} : { y:[0,-7,0],rotate:[0,30,0] }} transition={{duration:2.8,repeat:Infinity,ease:'easeInOut'}}/>
          <m.div className="cookie-404__scan" animate={reduceMotion ? {opacity:.45} : {y:[-105,105,-105],opacity:[0,.7,0]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}/>
          <m.div className="cookie-404__code" initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{delay:.55}}><span><i/> LOOKUP COMPLETE</span><strong>NO_MATCH_FOUND</strong><small>Ref: LGR-404-{String(route.length).padStart(2,'0')}</small></m.div>
          <div className="cookie-404__number" aria-hidden="true"><m.span initial={{opacity:0,x:-28}} animate={{opacity:1,x:0}} transition={{delay:.08}}>4</m.span><m.span initial={{opacity:0,scale:.7}} animate={{opacity:1,scale:1}} transition={{delay:.16}}>0</m.span><m.span initial={{opacity:0,x:28}} animate={{opacity:1,x:0}} transition={{delay:.24}}>4</m.span></div>
        </section>
      </div>

      <div className="cookie-404__rail"><div>{products.length?[...products,...products].map((product,index)=><span key={`${product.id}-${index}`}>{product.name.toUpperCase()} • {product.status.toUpperCase()} • {product.stock} STOK</span>):<><span>404 • PAGE NOT FOUND</span><b>KATALOG TIDAK TERSEDIA</b><span>KATALOG BELUM TERSEDIA</span></>}</div></div>
    </main>
  </LazyMotion>
}
