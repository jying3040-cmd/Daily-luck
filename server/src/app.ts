import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify'
import { existsSync } from 'node:fs'
import { Solar } from 'lunar-typescript'
import { createTextCipher, getDefaultCipher } from './crypto.js'
import { openDatabase, openProfileStore, openReportCache } from './db.js'
import { buildChart, buildReport, dateKey, shiftDate, type Chart, type Profile, type Report } from './fortune.js'
import { DB_FILE, FRONTEND_DIST } from './paths.js'
import { isBirthTime, isBloodType, isDateKey, isGender, isProfile } from './validate.js'

export interface AppOptions {
  databaseFile?: string
  encryptionKey?: Buffer
  logger?: boolean | FastifyBaseLogger
  serveFrontend?: boolean
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

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const db = openDatabase(options.databaseFile ?? DB_FILE)
  const textCipher = options.encryptionKey
    ? createTextCipher(options.encryptionKey)
    : getDefaultCipher()
  const profileStore = openProfileStore(db, textCipher)
  const reportCache = openReportCache(db)
  const app = Fastify({ logger: options.logger ?? true })

  app.addHook('onClose', async () => db.close())

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
    const profile = profileStore.load()
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
    profileStore.save(profile)
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
    const profile = profileStore.load()
    if (!profile) {
      return reply.code(404).send({ error: 'NO_PROFILE', message: '尚未保存个人档案' })
    }
    const reports: Report[] = []
    for (const reportDate of rangeDates(start, end)) {
      const cached = reportCache.get(reportDate, jitter)
      if (cached) {
        reports.push(cached)
        continue
      }
      const report = buildReport(reportDate, profile, jitter)
      reportCache.put(reportDate, jitter, report)
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
