export default async function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  const checks: Record<string, string> = {}
  for (const [name, loader] of [
    ['config', () => import('../server/config.js')],
    ['supabase', () => import('../server/supabase.js')],
    ['rateLimit', () => import('../server/rateLimit.js')],
    ['app', () => import('../server/app.js')],
  ] as const) {
    try {
      await loader()
      checks[name] = 'ok'
    } catch (error) {
      checks[name] = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      break
    }
  }
  response.status(200).json({ checks })
}
