import { useEffect, useState } from 'react'

type NavigatorHints=Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}}

const detectLowPower=()=>{
  if(typeof window==='undefined')return false
  const hints=navigator as NavigatorHints
  const limitedCpu=Boolean(hints.hardwareConcurrency&&hints.hardwareConcurrency<=4)
  const limitedMemory=Boolean(hints.deviceMemory&&hints.deviceMemory<=4)
  const saveData=Boolean(hints.connection?.saveData)
  const slowUpdate=window.matchMedia('(update: slow)').matches
  const compactTouch=window.matchMedia('(max-width: 760px) and (pointer: coarse)').matches
  return limitedCpu||limitedMemory||saveData||slowUpdate||compactTouch
}

export function useLowPowerMode(){
  const [lowPower,setLowPower]=useState(detectLowPower)
  useEffect(()=>{const media=window.matchMedia('(max-width: 760px) and (pointer: coarse), (update: slow)');const update=()=>setLowPower(detectLowPower());media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
  return lowPower
}
