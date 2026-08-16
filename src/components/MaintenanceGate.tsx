import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMaintenance } from '../context/MaintenanceContext'
import { MaintenancePage } from '../pages/MaintenancePage'

export function MaintenanceGate({children,staffAuth}:{children:ReactNode;staffAuth:Record<string,ReactNode>}){
  const {user,loading:authLoading}=useAuth()
  const {maintenance,loading:maintenanceLoading}=useMaintenance()
  const location=useLocation()
  if(authLoading||maintenanceLoading)return <div className="route-loader"><LoaderCircle className="spin"/><span>Menyiapkan Langgor…</span></div>
  const bypass=user?.role==='admin'||user?.role==='moderator'
  if(maintenance.enabled&&!bypass){const authPage=staffAuth[location.pathname];if(authPage)return <>{authPage}</>;return <MaintenancePage/>}
  return <>{children}</>
}
