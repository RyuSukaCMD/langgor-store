import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from './config'

let adminClient: SupabaseClient | null = null

export const isSupabaseConfigured = Boolean(
  config.supabase.url && config.supabase.anonKey && config.supabase.serviceRoleKey,
)

/** Server-only client. The service-role key must never be exposed to src/. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.')
  }
  if (!adminClient) {
    adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'X-Client-Info': 'langgor-store-server' } },
    })
  }
  return adminClient
}

/** Isolated auth client so one request can never inherit another user's session. */
export function createSupabaseAuthClient(): SupabaseClient {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error('Supabase Auth belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY.')
  }
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'X-Client-Info': 'langgor-store-auth' } },
  })
}
