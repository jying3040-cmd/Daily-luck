import { Solar } from 'lunar-typescript'
import { DatabaseSync } from 'node:sqlite'
import Fastify from 'fastify'

const results: string[] = []

function check(name: string, ok: boolean, detail = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`)
  if (!ok) process.exitCode = 1
}

try {
  const solar = Solar.fromDate(new Date())
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()
  check(
    'lunar-typescript',
    true,
    `${solar.toYmd()} -> ${lunar.toString()} | 八字 ${eightChar.getYear()} ${eightChar.getMonth()} ${eightChar.getDay()} ${eightChar.getTime()}`,
  )
} catch (error) {
  check('lunar-typescript', false, String(error))
}

try {
  const db = new DatabaseSync(':memory:')
  db.exec('CREATE TABLE probe (id INTEGER PRIMARY KEY, value TEXT)')
  const insert = db.prepare('INSERT INTO probe (value) VALUES (?)')
  insert.run('每日运势')
  const row = db.prepare('SELECT value FROM probe WHERE id = 1').get() as {
    value: string
  }
  check('node:sqlite', row.value === '每日运势', row.value)
} catch (error) {
  check('node:sqlite', false, String(error))
}

try {
  const app = Fastify()
  app.get('/health', async () => ({ ok: true }))
  await app.listen({ port: 0, host: '127.0.0.1' })
  const address = app.server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  const response = await fetch(`http://127.0.0.1:${port}/health`)
  const body = (await response.json()) as { ok: boolean }
  check('fastify', response.ok && body.ok === true, `HTTP ${response.status}`)
  await app.close()
} catch (error) {
  check('fastify', false, String(error))
}

console.log(results.join('\n'))
console.log(process.exitCode === 1 ? 'VERIFY FAILED' : 'VERIFY OK')
