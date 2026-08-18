import type { ProfileEffect as ProfileEffectName } from '../types'

export function ProfileEffect({effect}:{effect:ProfileEffectName}){
  if(effect==='none')return null
  return <div className={`profile-effect profile-effect--${effect}`} aria-hidden="true">{Array.from({length:12},(_,index)=><i key={index}/>)}</div>
}
