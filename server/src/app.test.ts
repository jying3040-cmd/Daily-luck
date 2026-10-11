import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app.js'
import { isDateKey } from './validate.js'

const tempDir = mkdtempSync(join(tmpdir(), 'daily-fortune-'))
const databaseFile = join(tempDir, 'test.db')
let app: FastifyInstance

before(async () => {
  app = await buildApp({
    databaseFile,
    encryptionKey: Buffer.alloc(32, 7),
    logger: false,
    serveFrontend: false,
  })
})

after(async () => {
  await app.close()
  rmSync(tempDir, { recursive: true, force: true })
})

test('date validation rejects impossible calendar dates', () => {
  assert.equal(isDateKey('2024-02-29'), true)
  assert.equal(isDateKey('2023-02-29'), false)
  assert.equal(isDateKey('2024-13-01'), false)
})

test('profile API validates and round-trips encrypted fields', async () => {
  const invalid = await app.inject({
    method: 'PUT',
    url: '/api/profile',
    payload: { birthDate: '2023-02-29', birthTime: '25:00' },
  })
  assert.equal(invalid.statusCode, 400)

  const profile = {
    name: '测试用户',
    birthDate: '1990-08-16',
    birthTime: '12:30',
    gender: 'unknown',
    bloodType: 'A',
    phoneTail: '1234',
  }
  const saved = await app.inject({ method: 'PUT', url: '/api/profile', payload: profile })
  assert.equal(saved.statusCode, 200)
  assert.deepEqual(saved.json().profile, profile)

  const loaded = await app.inject({ method: 'GET', url: '/api/profile' })
  assert.equal(loaded.statusCode, 200)
  assert.deepEqual(loaded.json().profile, profile)
})

test('report API rejects invalid ranges and caches both jitter modes', async () => {
  const backwards = await app.inject({ method: 'GET', url: '/api/reports?start=2026-08-17&end=2026-08-16' })
  assert.equal(backwards.statusCode, 400)

  const jittered = await app.inject({ method: 'GET', url: '/api/reports?start=2026-08-16&end=2026-08-16&jitter=1' })
  const stable = await app.inject({ method: 'GET', url: '/api/reports?start=2026-08-16&end=2026-08-16&jitter=0' })
  assert.equal(jittered.statusCode, 200)
  assert.equal(stable.statusCode, 200)

  await app.close()
  const db = new DatabaseSync(databaseFile, { readOnly: true })
  const row = db.prepare('SELECT COUNT(*) AS count FROM daily_reports WHERE date = ?').get('2026-08-16') as { count: number }
  db.close()
  assert.equal(row.count, 2)

  app = await buildApp({
    databaseFile,
    encryptionKey: Buffer.alloc(32, 7),
    logger: false,
    serveFrontend: false,
  })
})
