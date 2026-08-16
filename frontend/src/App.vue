<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Sparkles } from '@lucide/vue'
import ProfileForm from './components/ProfileForm.vue'
import ChartPanel from './components/ChartPanel.vue'
import ReportPanel from './components/ReportPanel.vue'
import { fetchProfile, fetchReports, saveProfile } from './lib/api'
import type { Chart, Profile, Report } from './lib/types'

const today = dateKey(new Date())
const todayLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()),
)

const EMPTY_PROFILE: Profile = { name: '', birthDate: '', birthTime: '12:00', gender: 'unknown', bloodType: '', phoneTail: '' }

const profile = ref<Profile>({ ...EMPTY_PROFILE })
const chart = ref<Chart | null>(null)
const reports = ref<Report[]>([])
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const savedAt = ref<Date | null>(null)
const saveError = ref('')

const hasProfile = computed(() => chart.value !== null)
const report = computed(() => reports.value.find((item) => item.date === today) ?? null)

/** 最近一次成功保存的档案快照，用于判断是否还有未保存的修改。 */
const savedSnapshot = ref(JSON.stringify(EMPTY_PROFILE))
const dirty = computed(() => JSON.stringify(profile.value) !== savedSnapshot.value)

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDate(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number)
  return dateKey(new Date(year, month - 1, day + days))
}

async function loadTrend() {
  if (!hasProfile.value) {
    reports.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    reports.value = await fetchReports(shiftDate(today, -3), shiftDate(today, 3))
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

/** 保存按钮触发：校验 → 保存 → 刷新命盘与报告，并记录保存时间。 */
async function handleSave(value: Profile) {
  if (!value.birthDate) {
    saveError.value = '请先填写出生日期'
    return
  }
  saving.value = true
  saveError.value = ''
  try {
    const result = await saveProfile(value)
    profile.value = result.profile
    chart.value = result.chart
    savedSnapshot.value = JSON.stringify(result.profile)
    savedAt.value = new Date()
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : String(err)
    return
  } finally {
    saving.value = false
  }
  await loadTrend()
}

onMounted(async () => {
  try {
    const result = await fetchProfile()
    if (result.profile && result.chart) {
      profile.value = result.profile
      chart.value = result.chart
      savedSnapshot.value = JSON.stringify(result.profile)
      savedAt.value = new Date()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
  await loadTrend()
})
</script>

<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f7fafb]/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div class="flex items-center gap-2.5">
          <div class="grid h-9 w-9 place-items-center rounded-lg bg-[#182230] text-amber-300 shadow-sm">
            <Sparkles :size="18" />
          </div>
          <div>
            <h1 class="text-[15px] font-bold text-slate-900">每日运势</h1>
            <p class="text-[11px] text-slate-500">个人本地版</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <span class="hidden sm:inline">{{ todayLabel }}</span>
          <span class="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
            仅供娱乐参考
          </span>
        </div>
      </div>
    </header>

    <main class="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
      <aside class="space-y-5">
        <ProfileForm
          v-model="profile"
          :saving="saving"
          :saved-at="savedAt"
          :dirty="dirty"
          :save-error="saveError"
          @save="handleSave"
        />
        <ChartPanel :chart="chart" />
      </aside>
      <ReportPanel :report="report" :trend="reports" :loading="loading" :error="error" :today="today" :has-profile="hasProfile" @retry="loadTrend" />
    </main>

    <footer class="mx-auto max-w-6xl px-4 pb-8 pt-2 text-xs text-slate-400 sm:px-6">
      数据仅保存在本机 SQLite，服务只监听 127.0.0.1。
    </footer>
  </div>
</template>
