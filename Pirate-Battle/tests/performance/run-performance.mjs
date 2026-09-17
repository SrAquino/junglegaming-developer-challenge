import { spawn } from 'node:child_process'
import { once } from 'node:events'

const baseURL = 'http://127.0.0.1:4187'
const preview = spawn(process.execPath, [
  './node_modules/vite/bin/vite.js',
  'preview',
  '--host', '127.0.0.1',
  '--port', '4187',
  '--strictPort',
], { stdio: 'inherit' })

try {
  await waitForPreview()
  const runner = spawn(process.execPath, [
    './node_modules/@playwright/test/cli.js',
    'test',
    '--config', 'playwright.performance.config.ts',
  ], {
    env: { ...process.env, PERFORMANCE_BASE_URL: baseURL },
    stdio: 'inherit',
  })
  const [code] = await once(runner, 'exit')
  process.exitCode = code ?? 1
} finally {
  preview.kill()
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`Vite preview exited with code ${preview.exitCode}.`)
    try {
      const response = await fetch(baseURL, { signal: AbortSignal.timeout(500) })
      if (response.ok) return
    } catch {
      // The preview needs a short startup window on cold runs.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Vite preview did not become available at ${baseURL}.`)
}
