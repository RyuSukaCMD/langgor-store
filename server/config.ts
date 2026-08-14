import 'dotenv/config'
import { z } from 'zod'

const optionalUrl = z.preprocess(v => v === '' ? undefined : v, z.string().url().optional())
const optionalString = z.preprocess(v => v === '' ? undefined : v, z.string().optional())
const bool = (fallback: boolean) => z.preprocess(v => v === undefined || v === '' ? fallback : v, z.enum(['true','false']).transform(v => v === 'true'))
const positiveInt = (fallback: number) => z.preprocess(v => v === undefined || v === '' ? fallback : v, z.coerce.number().int().positive())

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: positiveInt(5173),
  TRUST_PROXY: bool(false),
  LOG_LEVEL: z.enum(['debug','info','warn','error']).default('info'),

  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_JWT_SECRET: optionalString,
  SUPABASE_STORAGE_BUCKET: z.string().default('langgor-media'),
  DATABASE_URL: optionalString,
  DIRECT_URL: optionalString,

  RATE_LIMIT_STORE: z.enum(['memory','redis']).default('memory'),
  REDIS_URL: optionalString,
  RATE_LIMIT_WINDOW_MS: positiveInt(900_000),
  RATE_LIMIT_MAX: positiveInt(300),
  AUTH_RATE_LIMIT_WINDOW_MS: positiveInt(900_000),
  AUTH_RATE_LIMIT_MAX: positiveInt(20),
  UPLOAD_RATE_LIMIT_WINDOW_MS: positiveInt(3_600_000),
  UPLOAD_RATE_LIMIT_MAX: positiveInt(30),

  PROFILE_UPLOAD_MAX_BYTES: positiveInt(5_242_880),
  IMAGE_MAX_DIMENSION: positiveInt(6000),
  IMAGE_MIN_DIMENSION: positiveInt(128),
  BANNER_MIN_ASPECT_RATIO: z.preprocess(v => v === undefined || v === '' ? 2.5 : v, z.coerce.number().positive()),

  DELIVERY_ENCRYPTION_KEY: optionalString,
  KMS_KEY_ID: optionalString,
  KMS_REGION: z.string().default('ap-southeast-1'),
  PAYMENT_PROVIDER: z.enum(['sandbox','midtrans','xendit']).default('sandbox'),
  MIDTRANS_SERVER_KEY: optionalString,
  MIDTRANS_CLIENT_KEY: optionalString,
  MIDTRANS_IS_PRODUCTION: bool(false),
  MIDTRANS_WEBHOOK_SECRET: optionalString,
  XENDIT_SECRET_KEY: optionalString,
  XENDIT_WEBHOOK_TOKEN: optionalString,
  ORDER_EXPIRY_MINUTES: positiveInt(60),
  PAYMENT_WEBHOOK_TOLERANCE_SECONDS: positiveInt(300),
  EMAIL_PROVIDER: z.enum(['console','resend']).default('resend'),
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().default('Langgor Store <no-reply@langgor.store>'),
  SUPPORT_EMAIL: z.string().email().default('halo@langgor.store'),
  SENTRY_DSN: optionalUrl,
  SENTRY_ENVIRONMENT: z.string().default('development'),
  AUDIT_IP_HASH_SECRET: z.string().min(32),
  BOOTSTRAP_ADMIN_EMAIL: z.preprocess(v => v === '' ? undefined : v, z.string().email().optional()),
}).superRefine((env, ctx) => {
  if (env.RATE_LIMIT_STORE === 'redis' && !env.REDIS_URL) ctx.addIssue({ code:'custom', path:['REDIS_URL'], message:'REDIS_URL is required when RATE_LIMIT_STORE=redis.' })
  if (env.PAYMENT_PROVIDER === 'midtrans' && !env.MIDTRANS_SERVER_KEY) ctx.addIssue({ code:'custom', path:['MIDTRANS_SERVER_KEY'], message:'MIDTRANS_SERVER_KEY is required for Midtrans.' })
  if (env.PAYMENT_PROVIDER === 'xendit' && !env.XENDIT_SECRET_KEY) ctx.addIssue({ code:'custom', path:['XENDIT_SECRET_KEY'], message:'XENDIT_SECRET_KEY is required for Xendit.' })
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const detail = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${detail}`)
}
const env = parsed.data

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  app: { trustProxy: env.TRUST_PROXY || Boolean(process.env.VERCEL), logLevel: env.LOG_LEVEL },
  supabase: { url: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY, jwtSecret: env.SUPABASE_JWT_SECRET, storageBucket: env.SUPABASE_STORAGE_BUCKET },
  database: { url: env.DATABASE_URL, directUrl: env.DIRECT_URL },
  rateLimit: { store: env.RATE_LIMIT_STORE, redisUrl: env.REDIS_URL, apiWindowMs: env.RATE_LIMIT_WINDOW_MS, apiMax: env.RATE_LIMIT_MAX, authWindowMs: env.AUTH_RATE_LIMIT_WINDOW_MS, authMax: env.AUTH_RATE_LIMIT_MAX, uploadWindowMs: env.UPLOAD_RATE_LIMIT_WINDOW_MS, uploadMax: env.UPLOAD_RATE_LIMIT_MAX },
  uploads: { profileMaxBytes: env.PROFILE_UPLOAD_MAX_BYTES, imageMaxDimension: env.IMAGE_MAX_DIMENSION, imageMinDimension: env.IMAGE_MIN_DIMENSION, bannerMinAspectRatio: env.BANNER_MIN_ASPECT_RATIO },
  delivery: { encryptionKey: env.DELIVERY_ENCRYPTION_KEY, kmsKeyId: env.KMS_KEY_ID, kmsRegion: env.KMS_REGION },
  payment: { provider: env.PAYMENT_PROVIDER, midtransServerKey: env.MIDTRANS_SERVER_KEY, midtransClientKey: env.MIDTRANS_CLIENT_KEY, midtransProduction: env.MIDTRANS_IS_PRODUCTION, midtransWebhookSecret: env.MIDTRANS_WEBHOOK_SECRET, xenditSecretKey: env.XENDIT_SECRET_KEY, xenditWebhookToken: env.XENDIT_WEBHOOK_TOKEN, orderExpiryMinutes: env.ORDER_EXPIRY_MINUTES, webhookToleranceSeconds: env.PAYMENT_WEBHOOK_TOLERANCE_SECONDS },
  email: { provider: env.EMAIL_PROVIDER, resendApiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM, support: env.SUPPORT_EMAIL },
  observability: { sentryDsn: env.SENTRY_DSN, sentryEnvironment: env.SENTRY_ENVIRONMENT, auditIpHashSecret: env.AUDIT_IP_HASH_SECRET },
} as const

if (config.isProduction && config.rateLimit.store === 'memory') console.warn('[config] RATE_LIMIT_STORE=memory is not suitable for multiple production instances.')
