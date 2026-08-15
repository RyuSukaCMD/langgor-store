import { useEffect, useState } from 'react'

type AvatarProps={src?:string|null;initials:string;className?:string;label?:string}

export function Avatar({src,initials,className='',label}:AvatarProps){
  const [failed,setFailed]=useState(false)
  useEffect(()=>setFailed(false),[src])
  const showImage=Boolean(src)&&!failed
  return <span className={`avatar ${className}`} role="img" aria-label={label||'Foto profil'}>{showImage?<img src={src||''} alt="" onError={()=>setFailed(true)}/>:<span className="avatar__initials">{initials}</span>}</span>
}
