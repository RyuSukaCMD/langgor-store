import rateLimit, { type Store } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { createClient, type RedisClientType } from 'redis'
import { config } from './config.js'

let redis: RedisClientType | null = null

async function store(prefix: string): Promise<Store | undefined> {
  if (config.rateLimit.store !== 'redis' || !config.rateLimit.redisUrl) return undefined
  if (!redis) {
    redis = createClient({ url: config.rateLimit.redisUrl })
    redis.on('error', error => console.error('[redis]', error instanceof Error ? error.message : error))
    await redis.connect()
  }
  return new RedisStore({ prefix, sendCommand: (...args: string[]) => redis!.sendCommand(args) })
}

export async function createRateLimiters() {
  let apiStore: Store | undefined
  let authStore: Store | undefined
  let uploadStore: Store | undefined
  try {
    ;[apiStore, authStore, uploadStore] = await Promise.all([
      store('langgor:rl:api:'), store('langgor:rl:auth:'), store('langgor:rl:upload:'),
    ])
  } catch (error) {
    console.error('[rate-limit] Redis unavailable, using isolated memory limits:', error instanceof Error ? error.message : error)
    if (redis?.isOpen) await redis.disconnect()
    redis = null
  }
  return {
    api: rateLimit({ windowMs: config.rateLimit.apiWindowMs, limit: config.rateLimit.apiMax, store: apiStore, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Terlalu banyak permintaan. Coba lagi sebentar.' } }),
    auth: rateLimit({ windowMs: config.rateLimit.authWindowMs, limit: config.rateLimit.authMax, store: authStore, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Terlalu banyak percobaan. Tunggu beberapa menit.' } }),
    upload: rateLimit({ windowMs: config.rateLimit.uploadWindowMs, limit: config.rateLimit.uploadMax, store: uploadStore, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Batas upload tercapai. Coba lagi nanti.' } }),
  }
}

export async function closeRateLimitStore() {
  if (redis?.isOpen) await redis.quit()
}
