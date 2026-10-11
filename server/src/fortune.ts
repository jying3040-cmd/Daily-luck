import { Solar } from 'lunar-typescript'
import {
  BLOOD_BOOST,
  BLOOD_ELEMENT,
  CATEGORY_GUIDANCE,
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  CHONG,
  CONTROLS,
  ELEMENT_BOOST,
  ELEMENT_LABEL,
  GAN_ELEMENT,
  GENERATES,
  NOBLE_ANIMALS,
  NUMBER_COLORS,
  SAN_HE_GROUPS,
  SIX_HARM,
  ZODIAC_BOUNDARIES,
  ZODIAC_ELEMENT,
  ZODIAC_ELEMENT_LABEL,
} from './fortune-tables.js'

export interface Profile {
  name: string
  birthDate: string
  /** 出生时辰 HH:mm */
  birthTime: string
  gender: 'male' | 'female' | 'unknown'
  bloodType: 'A' | 'B' | 'AB' | 'O' | ''
  phoneTail: string
}

/** 基础排盘：用于「我的资料」页展示。 */
export interface Chart {
  /** 出生八字四柱 */
  eightChar: { year: string; month: string; day: string; time: string }
  /** 星座，如 狮子座 */
  zodiac: string
  /** 生肖 */
  animal: string
  /** 生命数字 */
  lifeNumber: number
  /** 日干五行 */
  dayElement: string
}

export type CategoryKey = 'career' | 'wealth' | 'love' | 'health' | 'social'

export interface CategoryScore {
  key: CategoryKey
  label: string
  score: number
  advice: string
}

export interface Lucky {
  color: string
  colorHex: string
  number: number
  direction: string
  noble: string
}

export interface Report {
  date: string
  weekday: string
  lunarDate: string
  /** 今日八字四柱 */
  todayEightChar: { year: string; month: string; day: string; time: string }
  animal: string
  zodiac: string
  lifeNumber: number
  total: number
  level: string
  advice: string
  categories: CategoryScore[]
  yi: string[]
  ji: string[]
  lucky: Lucky
  chongAnimal: string
}

export function todayKey(): string {
  return dateKey(new Date())
}

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDate(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number)
  return dateKey(new Date(year, month - 1, day + days))
}

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function reduceDigits(n: number): number {
  let value = n
  while (value >= 10) {
    value = String(value)
      .split('')
      .reduce((sum, c) => sum + Number(c), 0)
  }
  return value
}

function lifeNumberOf(key: string): number {
  const digits = key.replace(/-/g, '')
  const sum = digits.split('').reduce((total, c) => total + Number(c), 0)
  return reduceDigits(sum)
}

/** 从出生时辰字符串解析小时，无效时默认 12 时。 */
function birthHourOf(profile: Profile): number {
  const match = /^(\d{1,2})/.exec(profile.birthTime.trim())
  if (!match) return 12
  const hour = Number(match[1])
  return hour >= 0 && hour <= 23 ? hour : 12
}

/** 按出生日期 + 时辰构建排盘太阳历。 */
function birthSolarOf(profile: Profile) {
  const [by, bm, bd] = profile.birthDate.split('-').map(Number)
  return Solar.fromYmdHms(by, bm, bd, birthHourOf(profile), 0, 0)
}

/** 基础排盘：八字、星座、生肖、生命数字、日干五行。 */
export function buildChart(profile: Profile): Chart {
  const solar = birthSolarOf(profile)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()
  const dayGan = eightChar.getDayGan()
  return {
    eightChar: {
      year: eightChar.getYear(),
      month: eightChar.getMonth(),
      day: eightChar.getDay(),
      time: eightChar.getTime(),
    },
    zodiac: zodiacOf(solar.getMonth(), solar.getDay()),
    animal: lunar.getShengxiao(),
    lifeNumber: lifeNumberOf(profile.birthDate),
    dayElement: GAN_ELEMENT[dayGan] ?? '未知',
  }
}

function zodiacOf(month: number, day: number): string {
  const value = month * 100 + day
  if (value < 120 || value >= 1222) return '摩羯座'
  for (let i = ZODIAC_BOUNDARIES.length - 1; i >= 0; i--) {
    if (value >= ZODIAC_BOUNDARIES[i].start) return ZODIAC_BOUNDARIES[i].sign
  }
  return '摩羯座'
}

function zhiRelation(dayZhi: string, birthZhi: string): '合' | '冲' | '同' | '三合' | null {
  if (dayZhi === birthZhi) return '同'
  if (SIX_HARM[dayZhi] === birthZhi) return '合'
  if (CHONG[dayZhi] === birthZhi) return '冲'
  if (SAN_HE_GROUPS.some((group) => group.includes(dayZhi) && group.includes(birthZhi))) return '三合'
  return null
}

function levelOf(score: number): string {
  if (score >= 90) return '上吉'
  if (score >= 78) return '吉'
  if (score >= 65) return '中吉'
  if (score >= 52) return '平'
  if (score >= 40) return '慎'
  return '避'
}

function categoryAdvice(key: CategoryKey, score: number, notes: string[]): string {
  const band = score >= 78 ? 'high' : score >= 60 ? 'steady' : 'low'
  const guidance = CATEGORY_GUIDANCE[key][band]
  const noteText = notes.length ? `${notes.join('；')}。` : ''
  return `${CATEGORY_LABELS[key]}指数 ${score} 分。${noteText}${guidance}`
}

export function buildReport(key: string, profile: Profile, jitter: boolean): Report {
  const [year, month, day] = key.split('-').map(Number)
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()
  const dayGan = lunar.getDayGan()
  const dayZhi = lunar.getDayZhi()

  const birthSolar = profile.birthDate ? birthSolarOf(profile) : solar
  const birthLunar = birthSolar.getLunar()
  const birthEightChar = birthLunar.getEightChar()
  const birthZodiac = zodiacOf(birthSolar.getMonth(), birthSolar.getDay())
  const birthAnimal = birthLunar.getShengxiao()
  const lifeNumber = profile.birthDate ? lifeNumberOf(profile.birthDate) : 5
  const dayNumber = reduceDigits(day)
  const chongAnimal = lunar.getDayChongShengXiao()

  const notes: Record<CategoryKey, string[]> = {
    career: [],
    wealth: [],
    love: [],
    health: [],
    social: [],
  }
  const deltas: Record<CategoryKey, number> = {
    career: 0,
    wealth: 0,
    love: 0,
    health: 0,
    social: 0,
  }

  const apply = (category: CategoryKey, delta: number, note?: string) => {
    deltas[category] += delta
    if (note) notes[category].push(note)
  }

  const birthDayGan = birthEightChar.getDayGan()
  const birthDayZhi = birthEightChar.getDayZhi()
  const relation = zhiRelation(dayZhi, birthDayZhi)
  if (relation === '合') {
    apply('social', 6, `今日日支${dayZhi}与命主日支${birthDayZhi}六合，人际磁场顺畅`)
    apply('love', 4, '六合引动情缘，适合表达与约定')
  } else if (relation === '冲') {
    apply('health', -6, `今日日支${dayZhi}冲命主日支${birthDayZhi}，注意休息与意外`)
    apply('career', -3, '冲克扰事，重要决定宜缓')
  } else if (relation === '同') {
    apply('career', 3, '今日日支与命主日支相同，节奏更稳')
    apply('social', 4, '同气相助，今日沟通更顺')
  } else if (relation === '三合') {
    apply('wealth', 4, '日支与命主日支三合，合作与财运有助')
    apply('social', 3, '三合聚气，易得助力')
  }

  const dayElement = GAN_ELEMENT[dayGan]
  const birthElement = GAN_ELEMENT[birthDayGan]
  if (dayElement && birthElement) {
    if (dayElement === birthElement) {
      apply('social', 3, '今日天干与命主天干同五行，思路一致')
    } else if (GENERATES[dayElement] === birthElement) {
      apply('career', 5, `${dayGan}日${ELEMENT_LABEL[dayElement]}生命主${ELEMENT_LABEL[birthElement]}，事业有生机`)
      apply('wealth', 3, '相生之气流入财宫')
    } else if (GENERATES[birthElement] === dayElement) {
      apply('social', 3, `命主${ELEMENT_LABEL[birthElement]}生今日之${ELEMENT_LABEL[dayElement]}，宜分享协作`)
    } else if (CONTROLS[dayElement] === birthElement) {
      apply('health', -3, `${dayGan}日五行克制命主，留意身体`)
      apply('love', -2, '克气扰心，沟通少带情绪')
    } else if (CONTROLS[birthElement] === dayElement) {
      apply('wealth', 4, '命主五行制衡今日之气，财路清晰')
    }
  }

  const zodiacRng = mulberry32(hashString(`${key}:zodiac:${birthZodiac}`))
  const element = ZODIAC_ELEMENT[birthZodiac]
  const boost = ELEMENT_BOOST[element]
  apply(boost, 4, `${birthZodiac}属${ZODIAC_ELEMENT_LABEL[element]}，${CATEGORY_LABELS[boost]}自带加成`)
  if (zodiacRng() > 0.5) apply('love', 3, '星象缓和，感情表达更自然')
  if (zodiacRng() > 0.72) apply('social', 3, '直觉敏锐，适合交流新想法')

  const noble = NOBLE_ANIMALS[dayGan] ?? []
  if (chongAnimal === birthAnimal) {
    apply('health', -6, `今日冲${chongAnimal}，恰逢命主生肖，健康与人际多留意`)
    apply('social', -2, '冲煞影响气场，宜少争执')
  }
  if (noble.includes(birthAnimal)) {
    apply('social', 4, `${dayGan}日天乙贵人在${noble.join('、')}，命主属${birthAnimal}可得助力`)
  }
  const animalRng = mulberry32(hashString(`${key}:animal:${birthAnimal}`))
  if (animalRng() > 0.6 && chongAnimal !== birthAnimal) {
    apply('health', 2, '今日生肖气场平稳，作息宜规律')
  }

  if (profile.bloodType) {
    const bloodRng = mulberry32(hashString(`${key}:blood:${profile.bloodType}`))
    const bloodElement = BLOOD_ELEMENT[profile.bloodType]
    const bloodBoost = BLOOD_BOOST[bloodElement]
    apply(bloodBoost, 3 + Math.floor(bloodRng() * 3), `${profile.bloodType}型今日${CATEGORY_LABELS[bloodBoost]}状态回升`)
    if (bloodRng() > 0.45) apply('social', 2, '今日社交姿态更从容')
  }

  if (profile.birthDate) {
    if (lifeNumber === dayNumber) {
      apply('wealth', 6, `生命数字${lifeNumber}与今日${dayNumber}同频，财运呼应`)
      apply('social', 3, '数字共振，表达更清晰')
    } else if (Math.abs(lifeNumber - dayNumber) <= 2) {
      apply('wealth', 3, `生命数字${lifeNumber}与今日${dayNumber}相邻，顺势加分`)
    } else if (Math.abs(lifeNumber - dayNumber) >= 5) {
      apply('health', -2, `生命数字${lifeNumber}与今日${dayNumber}落差较大，节奏放慢`)
    }
    const tail = profile.phoneTail.replace(/\D/g, '')
    if (tail.length === 4) {
      const tailNumber = reduceDigits(tail.split('').reduce((total, c) => total + Number(c), 0))
      if (tailNumber === lifeNumber) {
        apply('wealth', 4, '手机尾号能量与生命数字一致，财气增强')
      } else if (tailNumber === dayNumber) {
        apply('social', 2, '尾号与今日数字同频，沟通更顺')
      }
    }
  }

  if (profile.name.trim()) {
    const nameRng = mulberry32(hashString(`${key}:name:${profile.name.trim()}:${profile.gender}`))
    const length = [...profile.name.trim()].length
    apply('social', (length % 3) + 1, `姓名${length}字，今日人际气场活跃`)
    if (nameRng() > 0.5) apply('social', 2, '姓名音律与今日气场相合，交流更顺')
  }

  const categories: CategoryScore[] = CATEGORY_KEYS.map((categoryKey) => {
    const rng = mulberry32(hashString(`${key}:base:${categoryKey}:${profile.birthDate || 'empty'}:${profile.name}`))
    let score = 56 + Math.floor(rng() * 26) + deltas[categoryKey]
    score = Math.max(18, Math.min(99, Math.round(score)))
    return {
      key: categoryKey,
      label: CATEGORY_LABELS[categoryKey],
      score,
      advice: categoryAdvice(categoryKey, score, notes[categoryKey]),
    }
  })

  let total = categories.reduce((sum, category) => sum + category.score, 0) / categories.length
  if (jitter) {
    const rng = mulberry32(hashString(`${key}:jitter:${profile.name}:${profile.birthDate}`))
    total += Math.round((rng() * 2 - 1) * 4)
  }
  total = Math.max(8, Math.min(100, Math.round(total)))

  const yi = lunar.getDayYi().slice(0, 5)
  const jiAll = lunar.getDayJi()
  const ji = jiAll.length ? jiAll.slice(0, 5) : ['诸事不宜']

  const luckyColor = NUMBER_COLORS[lifeNumber] ?? NUMBER_COLORS[5]
  const lucky: Lucky = {
    color: luckyColor.name,
    colorHex: luckyColor.hex,
    number: reduceDigits(lifeNumber + dayNumber),
    direction: lunar.getDayPositionCaiDesc() || '正北',
    noble: (NOBLE_ANIMALS[dayGan] ?? ['牛', '羊']).join('、'),
  }

  const sorted = [...categories].sort((a, b) => b.score - a.score)
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]
  const firstYi = yi[0] ?? '稳中求进'
  const firstJi = jiAll[0] === '诸事不宜' ? '今日诸事不宜，重要安排宜缓行' : `忌${ji[0] ?? '冒进'}`
  let advice = `宜${firstYi}，${firstJi}。${top.label}状态最好，适合推进与${top.label}相关的事；${bottom.label}稍作收敛，稳一点更好。`
  if (chongAnimal === birthAnimal) advice += `今日冲${chongAnimal}，出行与健康多加留意。`

  const weekday = new Date(year, month - 1, day).toLocaleDateString('zh-CN', { weekday: 'long' })

  return {
    date: key,
    weekday,
    lunarDate: lunar.toString(),
    todayEightChar: {
      year: eightChar.getYear(),
      month: eightChar.getMonth(),
      day: eightChar.getDay(),
      time: eightChar.getTime(),
    },
    animal: birthAnimal,
    zodiac: birthZodiac,
    lifeNumber,
    total,
    level: levelOf(total),
    advice,
    categories,
    yi,
    ji,
    lucky,
    chongAnimal,
  }
}
