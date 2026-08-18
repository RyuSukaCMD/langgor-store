import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Product } from '../types'

export function StockTicker({products}:{products:Product[]}){
  const available=useMemo(()=>products.filter(product=>product.stock>0&&product.status!=='sold'),[products])
  const items=useMemo(()=>available.length?['Cookie Stock!',...available.map(product=>`${product.name} : ${product.stock}`),'Beli sekarang!']:['Saat ini belum ada stock yang tersedia. Mohon menunggu hingga ada stock baru!'],[available])
  const containerRef=useRef<HTMLDivElement>(null)
  const sequenceRef=useRef<HTMLDivElement>(null)
  const [copies,setCopies]=useState(2)
  const [duration,setDuration]=useState(24)
  const [ready,setReady]=useState(false)

  useLayoutEffect(()=>{
    const container=containerRef.current
    const sequence=sequenceRef.current
    if(!container||!sequence)return
    const measure=()=>{
      const sequenceWidth=sequence.getBoundingClientRect().width
      if(!sequenceWidth)return
      const needed=Math.max(2,Math.ceil(container.clientWidth/sequenceWidth)+1)
      setCopies(current=>current===needed?current:needed)
      setDuration(Math.max(16,(sequenceWidth*needed)/52))
      setReady(true)
    }
    measure()
    if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure)}
    const observer=new ResizeObserver(measure);observer.observe(container)
    return()=>observer.disconnect()
  },[items])

  const renderStrip=(stripIndex:number)=>Array.from({length:copies},(_,index)=><div className="live-rail__sequence" ref={stripIndex===0&&index===0?sequenceRef:undefined} key={`${stripIndex}-${index}`}>{items.map((item,itemIndex)=><span key={itemIndex}>{item}</span>)}</div>)
  return <div className="live-rail" ref={containerRef} role="status" aria-label={items.join(' · ')}><div className={`live-rail__track ${ready?'is-ready':''}`} style={{'--ticker-duration':`${duration}s`} as CSSProperties}><div className="live-rail__strip" aria-hidden="true">{renderStrip(0)}</div><div className="live-rail__strip" aria-hidden="true">{renderStrip(1)}</div></div></div>
}
