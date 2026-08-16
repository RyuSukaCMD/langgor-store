import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { MaintenanceStatus } from '../types'

const initialStatus:MaintenanceStatus={enabled:false,reason:'',estimatedEndAt:null,updatedAt:null}
type MaintenanceUpdate={enabled:boolean;reason:string;estimatedEndAt:string|null}
type MaintenanceContextValue={maintenance:MaintenanceStatus;loading:boolean;refreshMaintenance:()=>Promise<MaintenanceStatus>;updateMaintenance:(update:MaintenanceUpdate)=>Promise<MaintenanceStatus>}
const MaintenanceContext=createContext<MaintenanceContextValue|null>(null)

export function MaintenanceProvider({children}:{children:ReactNode}){
  const [maintenance,setMaintenance]=useState(initialStatus)
  const [loading,setLoading]=useState(true)
  const refreshMaintenance=useCallback(async()=>{const result=await api<{maintenance:MaintenanceStatus}>('/maintenance');setMaintenance(result.maintenance);return result.maintenance},[])
  const updateMaintenance=useCallback(async(update:MaintenanceUpdate)=>{const result=await api<{maintenance:MaintenanceStatus}>('/admin/maintenance',{method:'PATCH',body:JSON.stringify(update)});setMaintenance(result.maintenance);return result.maintenance},[])
  useEffect(()=>{
    let active=true
    const refresh=()=>refreshMaintenance().catch(()=>initialStatus).finally(()=>{if(active)setLoading(false)})
    void refresh()
    const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh()},30_000)
    const onVisible=()=>{if(document.visibilityState==='visible')void refresh()}
    document.addEventListener('visibilitychange',onVisible)
    return()=>{active=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',onVisible)}
  },[refreshMaintenance])
  return <MaintenanceContext.Provider value={{maintenance,loading,refreshMaintenance,updateMaintenance}}>{children}</MaintenanceContext.Provider>
}

export function useMaintenance(){const value=useContext(MaintenanceContext);if(!value)throw new Error('useMaintenance must be used inside MaintenanceProvider');return value}
