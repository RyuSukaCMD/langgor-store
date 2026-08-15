import type { Request, Response } from 'express'
import { app } from '../server/app'

/**
 * Single Vercel Function entry. vercel.json forwards /api/* here and places
 * the original suffix in the `path` query parameter.
 */
export default function handler(req: Request, res: Response) {
  const base = new URL(req.url || '/api', 'http://vercel.internal')
  const forwarded = base.searchParams.get('path') || ''
  base.searchParams.delete('path')
  const suffix = forwarded.replace(/^\/+/, '')
  const query = base.searchParams.toString()
  req.url = `/api${suffix ? `/${suffix}` : ''}${query ? `?${query}` : ''}`
  return app(req, res)
}
