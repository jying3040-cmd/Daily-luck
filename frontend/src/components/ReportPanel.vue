<script setup lang="ts">
import { computed } from 'vue'
import { Check, Loader2, Sparkles, TrendingUp, X } from '@lucide/vue'
import ScoreGauge from './ScoreGauge.vue'
import TrendChart from './TrendChart.vue'
import type { CategoryKey, Report } from '../lib/types'

const props = defineProps<{
  report: Report | null
  trend: Report[]
  loading: boolean
  error: string
  today: string
  hasProfile: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

const LEVEL_STYLE: Record<string, string> = {
  上吉: 'border-teal-200 bg-teal-50 text-teal-700',
  吉: 'border-sky-200 bg-sky-50 text-sky-700',
  中吉: 'border-amber-200 bg-amber-50 text-amber-700',
  平: 'border-slate-200 bg-slate-100 text-slate-600',
  慎: 'border-orange-200 bg-orange-50 text-orange-700',
  避: 'border-rose-200 bg-rose-50 text-rose-700',
}

const CATEGORY_STYLE: Record<CategoryKey, { bar: string; text: string }> = {
  career: { bar: '#c2410c', text: 'text-orange-700' },
  wealth: { bar: '#b8860b', text: 'text-amber-700' },
  love: { bar: '#db2777', text: 'text-pink-700' },
  health: { bar: '#0f766e', text: 'text-teal-700' },
  social: { bar: '#2563eb', text: 'text-blue-700' },
}

const levelClass = computed(() => LEVEL_STYLE[props.report?.level ?? ''] ?? LEVEL_STYLE['平'])
</script>

<template>
  <section class="space-y-5">
    <div
      v-if="!hasProfile"
      class="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
        <Sparkles :size="22" />
      </div>
      <h2 class="mt-4 text-lg font-bold text-slate-800">开始你的每日运势</h2>
      <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        请先在上方填写姓名与出生日期（出生时辰可选），保存后即可生成今日运势报告与七日趋势。资料仅保存在本机。
      </p>
    </div>

    <div
      v-else-if="loading && !report"
      class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-10 text-sm text-slate-500 shadow-sm"
    >
      <Loader2 :size="16" class="animate-spin" />
      正在生成今日运势
    </div>

    <div v-else-if="error && !report" class="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
      <p class="text-sm font-medium text-rose-700">无法连接本地服务：{{ error }}</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white"
        @click="emit('retry')"
      >
        <Loader2 :size="14" />
        重试
      </button>
    </div>

    <template v-else-if="report">
      <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 text-sm text-slate-500">
              <span>{{ report.date }}</span>
              <span>{{ report.weekday }}</span>
            </div>
            <h2 class="mt-1 text-xl font-bold text-slate-900">今日运势</h2>
            <p class="mt-1 text-xs text-slate-500">{{ report.lunarDate }}</p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span class="chip">{{ report.animal }}</span>
            <span class="chip">{{ report.zodiac }}</span>
            <span class="chip">生命数字 {{ report.lifeNumber }}</span>
            <span class="chip" :class="levelClass">{{ report.level }}</span>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span
            v-for="(pillar, label) in {
              年柱: report.todayEightChar.year,
              月柱: report.todayEightChar.month,
              日柱: report.todayEightChar.day,
              时柱: report.todayEightChar.time,
            }"
            :key="label"
            class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600"
          >
            <span class="mr-1 text-slate-400">{{ label }}</span>{{ pillar }}
          </span>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div class="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <ScoreGauge :score="report.total" />
          <p class="mt-5 text-center text-sm leading-6 text-slate-600">{{ report.advice }}</p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 class="mb-4 text-sm font-semibold text-slate-800">分类指数</h3>
          <div class="space-y-3">
            <div
              v-for="category in report.categories"
              :key="category.key"
              class="rounded-lg border border-slate-100 bg-slate-50/70 p-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold" :class="CATEGORY_STYLE[category.key].text">
                  {{ category.label }}
                </span>
                <span class="text-sm font-bold text-slate-700">{{ category.score }}</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{ width: `${category.score}%`, backgroundColor: CATEGORY_STYLE[category.key].bar }"
                />
              </div>
              <p class="mt-2 text-xs leading-5 text-slate-600">{{ category.advice }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="lucky-tile">
          <span class="lucky-label">幸运色</span>
          <div class="flex items-center gap-2">
            <span class="h-5 w-5 shrink-0 rounded-full border border-black/10" :style="{ backgroundColor: report.lucky.colorHex }" />
            <span class="truncate text-sm font-semibold text-slate-800">{{ report.lucky.color }}</span>
          </div>
        </div>
        <div class="lucky-tile">
          <span class="lucky-label">幸运数字</span>
          <span class="text-2xl font-bold text-slate-800">{{ report.lucky.number }}</span>
        </div>
        <div class="lucky-tile">
          <span class="lucky-label">幸运方位</span>
          <span class="text-sm font-semibold text-slate-800">{{ report.lucky.direction }}</span>
        </div>
        <div class="lucky-tile">
          <span class="lucky-label">贵人属相</span>
          <span class="truncate text-sm font-semibold text-slate-800">{{ report.lucky.noble }}</span>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
          <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Check :size="15" />
            宜
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="item in report.yi"
              :key="item"
              class="rounded-md bg-white px-2 py-1 text-xs text-emerald-800 shadow-sm"
            >
              {{ item }}
            </span>
          </div>
        </div>
        <div class="rounded-lg border border-rose-100 bg-rose-50/60 p-4">
          <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-800">
            <X :size="15" />
            忌
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="item in report.ji"
              :key="item"
              class="rounded-md bg-white px-2 py-1 text-xs text-rose-800 shadow-sm"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-2">
          <TrendingUp :size="16" class="text-slate-500" />
          <h3 class="text-sm font-semibold text-slate-800">7 日趋势</h3>
        </div>
        <TrendChart :trend="trend" :today="today" />
      </div>
    </template>
  </section>
</template>
