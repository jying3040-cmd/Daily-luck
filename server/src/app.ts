import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify'
import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Solar } from 'lunar-typescript'
import { createTextCipher, getDefaultCipher, type TextCipher } from './crypto.js'
import { buildChart, buildReport, dateKey, shiftDate, type Chart, type Profile, type Report } from './fortune.js'
import { DB_FILE, FRONTEND_DIST } from './paths.js'

export interface AppOptions {
  databaseFile?: string
  encryptionKey?: Buffer
  logger?: boolean | FastifyBaseLogger
  serveFrontend?: boolean
}

interface ProfileRow {
  name_enc: string
  iv_name: string
  birth_date: string
  birth_time: string
  gender: Profile['gender']
  blood_type: Profile['bloodType']
  phone_tail_enc: string
  iv_phone: string
}

const BLOOD_TYPES = ['A', 'B', 'AB', 'O'] as const

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isProfile(value: unknown): value is Partial<Profile> {
  return typeof value === 'object' && value !== null
}

function isBirthTime(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim())
  return Boolean(match && Number(match[1]) <= 23 && Number(match[2]) <= 59)
}

function isGender(value: unknown): value is Profile['gender'] {
  return value === 'male' || value === 'female' || value === 'unknown'
}

function isBloodType(value: unknown): value is Profile['bloodType'] {
  return value === '' || (BLOOD_TYPES as readonly unknown[]).includes(value)
}

function rangeDates(start: string, end: string): string[] {
  const dates: string[] = []
  let current = start
  while (current <= end) {
    dates.push(current)
    current = shiftDate(current, 1)
  }
  return dates
}

function initializeDatabase(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      date TEXT NOT NULL,
      jitter INTEGER NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (date, jitter)
    );
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name_enc TEXT NOT NULL,
      iv_name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL DEFAULT 'unknown',
      blood_type TEXT NOT NULL DEFAULT '',
      phone_tail_enc TEXT NOT NULL DEFAULT '',
      iv_phone TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const primaryKey = db
    .prepare('PRAGMA table_info(daily_reports)')
    .all()
    .map((column) => column as { name: string; pk: number })
    .filter((column) => column.pk > 0)
    .sort((a, b) => a.pk - b.pk)
    .map((column) => column.name)

  if (primaryKey.join(',') === 'date,jitter') return

  db.exec(`
    BEGIN;
    ALTER TABLE daily_reports RENAME TO daily_reports_legacy;
    CREATE TABLE daily_reports (
      date TEXT NOT NULL,
      jitter INTEGER NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (date, jitter)
    );
    INSERT OR REPLACE INTO daily_reports (date, jitter, payload, created_at)
      SELECT date, jitter, payload, created_at FROM daily_reports_legacy;
    DROP TABLE daily_reports_legacy;
    COMMIT;
  `)
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const databaseFile = options.databaseFile ?? DB_FILE
  if (databaseFile !== ':memory:') mkdirSync(dirname(databaseFile), { recursive: true })

  const db = new DatabaseSync(databaseFile)
  initializeDatabase(db)
  const textCipher: TextCipher = options.encryptionKey
    ? createTextCipher(options.encryptionKey)
    : getDefaultCipher()
  const app = Fastify({ logger: options.logger ?? true })

  app.addHook('onClose', async () => db.close())

  function loadProfile(): Profile | null {
    const row = db.prepare('SELECT * FROM profile WHERE id = 1').get() as ProfileRow | undefined
    if (!row) return null
    return {
      name: textCipher.decrypt(row.name_enc, row.iv_name),
      birthDate: row.birth_date,
      birthTime: row.birth_time,
      gender: row.gender,
      bloodType: row.blood_type,
      phoneTail: textCipher.decrypt(row.phone_tail_enc, row.iv_phone),
    }
  }

  function saveProfile(profile: Profile): void {
    const encryptedName = textCipher.encrypt(profile.name)
    const encryptedPhone = textCipher.encrypt(profile.phoneTail)
    db.prepare(`
      INSERT INTO profile (
        id, name_enc, iv_name, birth_date, birth_time, gender, blood_type, phone_tail_enc, iv_phone, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name_enc = excluded.name_enc,
        iv_name = excluded.iv_name,
        birth_date = excluded.birth_date,
        birth_time = excluded.birth_time,
        gender = excluded.gender,
        blood_type = excluded.blood_type,
        phone_tail_enc = excluded.phone_tail_enc,
        iv_phone = excluded.iv_phone,
        updated_at = excluded.updated_at
    `).run(
      encryptedName.value,
      encryptedName.iv,
      profile.birthDate,
      profile.birthTime,
      profile.gender,
      profile.bloodType,
      encryptedPhone.value,
      encryptedPhone.iv,
    )
    db.exec('DELETE FROM daily_reports')
  }

  app.get('/health', async () => ({ ok: true, service: 'daily-fortune-server' }))

  app.get('/api/today', async () => {
    const solar = Solar.fromDate(new Date())
    const lunar = solar.getLunar()
    const eightChar = lunar.getEightChar()
    return {
      date: solar.toYmd(),
      lunar: lunar.toString(),
      eightChar: {
        year: eightChar.getYear(),
        month: eightChar.getMonth(),
        day: eightChar.getDay(),
        time: eightChar.getTime(),
      },
      message: '排盘引擎可用',
    }
  })

  app.get('/api/profile', async () => {
    const profile = loadProfile()
    const chart: Chart | null = profile ? buildChart(profile) : null
    return { profile, chart }
  })

  app.put('/api/profile', async (request, reply) => {
    const body = isProfile(request.body) ? request.body : {}
    if (!isDateKey(body.birthDate) || body.birthDate < '1900-01-01' || body.birthDate > dateKey(new Date())) {
      return reply.code(400).send({ error: '出生日期必须是真实日期，范围为 1900-01-01 至今天' })
    }
    if (body.birthTime !== undefined && !isBirthTime(body.birthTime)) {
      return reply.code(400).send({ error: '出生时辰必须是 HH:mm（00:00 至 23:59）' })
    }
    if (body.phoneTail !== undefined && (typeof body.phoneTail !== 'string' || !/^\d{0,4}$/.test(body.phoneTail))) {
      return reply.code(400).send({ error: '手机尾号只能填写最多 4 位数字' })
    }
    const profile: Profile = {
      name: typeof body.name === 'string' ? body.name.trim().slice(0, 30) : '',
      birthDate: body.birthDate,
      birthTime: body.birthTime?.trim() ?? '12:00',
      gender: isGender(body.gender) ? body.gender : 'unknown',
      bloodType: isBloodType(body.bloodType) ? body.bloodType : '',
      phoneTail: body.phoneTail ?? '',
    }
    saveProfile(profile)
    return { profile, chart: buildChart(profile) }
  })

  app.get('/api/reports', async (request, reply) => {
    const query = request.query as { start?: string; end?: string; jitter?: string }
    const start = query.start ?? dateKey(new Date())
    const end = query.end ?? start
    if (!isDateKey(start) || !isDateKey(end)) {
      return reply.code(400).send({ error: 'start/end 必须是真实的 YYYY-MM-DD 日期' })
    }
    if (start > end) return reply.code(400).send({ error: 'start 不能晚于 end' })
    const dayCount = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1
    if (dayCount > 366) return reply.code(400).send({ error: '单次最多查询 366 天' })

    const jitter = query.jitter !== '0' && query.jitter !== 'false'
    const jitterFlag = jitter ? 1 : 0
    const profile = loadProfile()
    if (!profile) {
      return reply.code(404).send({ error: 'NO_PROFILE', message: '尚未保存个人档案' })
    }
    const reports: Report[] = []
    const select = db.prepare('SELECT payload FROM daily_reports WHERE date = ? AND jitter = ?')
    const upsert = db.prepare(`
      INSERT INTO daily_reports (date, jitter, payload) VALUES (?, ?, ?)
      ON CONFLICT(date, jitter) DO UPDATE SET payload = excluded.payload
    `)
    for (const reportDate of rangeDates(start, end)) {
      const row = select.get(reportDate, jitterFlag) as { payload: string } | undefined
      if (row) {
        reports.push(JSON.parse(row.payload) as Report)
        continue
      }
      const report = buildReport(reportDate, profile, jitter)
      upsert.run(reportDate, jitterFlag, JSON.stringify(report))
      reports.push(report)
    }
    return { reports }
  })

  if (options.serveFrontend !== false && existsSync(FRONTEND_DIST)) {
    await app.register(fastifyStatic, {
      root: FRONTEND_DIST,
      index: false,
      maxAge: '30d',
      immutable: true,
    })
    app.get('/', async (_request, reply) => reply.sendFile('index.html', { maxAge: 0, immutable: false }))
  }

  return app
}
