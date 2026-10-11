import { buildApp } from './app.js'
import { execFile } from 'node:child_process'

const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 3000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

const app = await buildApp()

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().finally(() => process.exit(0))
  })
}

await app.listen({ port, host })

const isPackaged = Boolean((process as NodeJS.Process & { pkg?: unknown }).pkg)
if (isPackaged && process.platform === 'win32' && process.env.DAILY_LUCK_NO_BROWSER !== '1') {
  execFile(
    'cmd.exe',
    ['/d', '/c', 'start', '', `http://127.0.0.1:${port}`],
    { windowsHide: true },
    (error) => {
      if (error) app.log.error({ err: error }, '无法自动打开浏览器，请访问 http://127.0.0.1:%d', port)
    },
  )
}
