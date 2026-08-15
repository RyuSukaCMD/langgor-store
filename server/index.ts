import path from 'node:path'
import express from 'express'
import { createServer } from 'vite'
import { config } from './config.js'
import { app, isProd, root } from './app.js'

if (isProd) {
  app.use(express.static(path.join(root, 'dist'), { maxAge: '1y', immutable: true, index: false }))
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')))
} else {
  const vite = await createServer({ root, server: { middlewareMode: true, host: '0.0.0.0', allowedHosts: true }, appType: 'spa' })
  app.use(vite.middlewares)
}

app.listen(config.port, '0.0.0.0', () => console.log(`Langgor Store listening on http://0.0.0.0:${config.port}`))
