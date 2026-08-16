import type { Chart, Profile, Report } from './types'

// 开发环境由 vite 代理转发 /api → 127.0.0.1:3000，故使用相对路径（同源请求，无 CORS）。
const API_BASE = ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null
    throw new Error(body?.message ?? body?.error ?? `请求失败（HTTP ${response.status}）`)
  }
  return (await response.json()) as T
}

export interface ProfilePayload {
  profile: Profile | null
  chart: Chart | null
}

export async function fetchProfile(): Promise<ProfilePayload> {
  return request<ProfilePayload>('/api/profile')
}

export async function saveProfile(profile: Profile): Promise<{ profile: Profile; chart: Chart }> {
  return request<{ profile: Profile; chart: Chart }>('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
}

/** 取一段日期区间内的每日报告（含缓存），random 波动固定开启。 */
export async function fetchReports(start: string, end: string): Promise<Report[]> {
  const data = await request<{ reports: Report[] }>(`/api/reports?start=${start}&end=${end}&jitter=1`)
  return data.reports
}
