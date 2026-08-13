import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from './config'

let adminClient: SupabaseClient | null = null

/**
 * Server-only Supabase client. Never import this module from src/ and never
 * expose SUPABASE_SERVICE_ROLE_KEY through a VITE_ environment variable.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }
  if (!adminClient) {
    adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'X-Client-Info': 'langgor-store-server' } },
    })
  }
  return adminClient
}

export const isSupabaseConfigured = Boolean(config.supabase.url && config.supabase.serviceRoleKey)
