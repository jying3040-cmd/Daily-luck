import type { Profile } from './fortune.js'

/** API 输入校验守卫：与路由、数据库逻辑分离。 */

const BLOOD_TYPES = ['A', 'B', 'AB', 'O'] as const

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function isProfile(value: unknown): value is Partial<Profile> {
  return typeof value === 'object' && value !== null
}

export function isBirthTime(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim())
  return Boolean(match && Number(match[1]) <= 23 && Number(match[2]) <= 59)
}

export function isGender(value: unknown): value is Profile['gender'] {
  return value === 'male' || value === 'female' || value === 'unknown'
}

export function isBloodType(value: unknown): value is Profile['bloodType'] {
  return value === '' || (BLOOD_TYPES as readonly unknown[]).includes(value)
}
