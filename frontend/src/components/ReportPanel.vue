<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from '@lucide/vue'
import ScoreGauge from './ScoreGauge.vue'
import TrendChart from './TrendChart.vue'
import FortuneCat from './FortuneCat.vue'
import CloudDivider from './CloudDivider.vue'
import type { Report } from '../lib/types'

const props = defineProps<{
  report: Report | null
  trend: Report[]
  loading: boolean
  error: string
  today: string
  hasProfile: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

/** 吉类等级用朱砂印，平/慎/避用墨印。 */
const levelTone = computed(() =>
  ['上吉', '吉', '中吉'].includes(props.report?.level ?? '') ? 'bg-cinnabar' : 'bg-ink',
)

/** 招财猫按运势高低给出不同姿态。 */
const catMood = computed(() => {
  const total = props.report?.total ?? 0
  if (total >= 75) return 'cheer' as const
  if (total >= 55) return 'invite' as const
  return 'rest' as const
})
</script>

<template>
  <section class="space-y-5">
    <div v-if="!hasProfile" class="sheet p-8">
      <div class="relative mx-auto max-w-xs">
        <div class="bubble mb-4 text-center">
          <p class="text-sm leading-6 text-ink">先在左侧写下你的生辰，我来帮你排盘～</p>
        </div>
        <FortuneCat mood="invite" class="mx-auto w-36" />
      </div>
      <p class="mt-4 text-center text-xs leading-5 text-ink-faint">
        资料仅保存在本机，不会上传到任何服务器。
      </p>
    </div>

    <div v-else-if="loading && !report" class="sheet flex items-center justify-center gap-2 p-10 text-sm text-ink-soft">
      <Loader2 :size="16" class="animate-spin" aria-hidden="true" />
      正在生成今日运势…
    </div>

    <div v-else-if="error && !report" class="sheet border-cinnabar/40 p-6 text-center">
      <p class="text-sm font-medium text-cinnabar">无法连接本地服务：{{ error }}</p>
      <p class="mt-1 text-xs text-ink-soft">请确认后端已启动（npm run dev 或 npm start），然后重试。</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2 text-xs font-medium text-sheet transition-colors hover:bg-black"
        @click="emit('retry')"
      >
        重试
      </button>
    </div>

    <template v-else-if="report">
      <div class="sheet p-5">
        <div class="flex items-start justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <p class="text-xs tabular-nums text-ink-soft">{{ report.date }} {{ report.weekday }}（{{ report.lunarDate }}）</p>
            <h2 class="mt-1.5 font-display text-2xl text-ink">今日运势</h2>
            <p class="mt-1 text-xs text-ink-soft">
              属{{ report.animal }} {{ report.zodiac }} 生命数字 {{ report.lifeNumber }}
            </p>
          </div>
          <span class="seal mt-1 h-9 px-2 text-sm" :class="levelTone" style="transform: rotate(-2deg)">{{ report.level }}</span>
        </div>

        <div class="grid grid-cols-2 divide-x divide-hairline sm:grid-cols-4">
          <div v-for="(pillar, label) in {
            年柱: report.todayEightChar.year,
            月柱: report.todayEightChar.month,
            日柱: report.todayEightChar.day,
            时柱: report.todayEightChar.time,
          }"
            :key="label"
            class="px-3 py-2.5 first:pl-0"
          >
            <div class="text-[11px] text-ink-faint">{{ label }}</div>
            <div class="font-display text-base text-ink">{{ pillar }}</div>
          </div>
        </div>
      </div>

      <div class="sheet grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div class="flex flex-col items-center border-b border-hairline p-6 lg:border-b-0 lg:border-r">
          <ScoreGauge :score="report.total" />
          <div class="bubble mt-4 w-full">
            <p class="text-sm leading-6 text-ink">{{ report.advice }}</p>
          </div>
          <FortuneCat :mood="catMood" class="mt-3 w-28" />
        </div>

        <div class="p-5">
          <h3 class="mb-1 text-sm font-semibold text-ink">分类指数</h3>
          <div class="divide-y divide-hairline/80">
            <div v-for="category in report.categories" :key="category.key" class="py-3">
              <div class="flex items-baseline justify-between">
                <span class="text-sm font-medium text-ink">{{ category.label }}</span>
                <span class="font-display text-lg tabular-nums text-ink">{{ category.score }}</span>
              </div>
              <div class="mt-2 h-1.5 overflow-hidden bg-track">
                <div
                  class="h-full w-full origin-left bg-cinnabar transition-transform duration-500 motion-reduce:transition-none"
                  :style="{ transform: `scaleX(${category.score / 100})` }"
                />
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-soft">{{ category.advice }}</p>
            </div>
          </div>
        </div>
      </div>

      <section class="sheet">
        <div class="grid grid-cols-2 divide-x divide-hairline sm:grid-cols-4">
          <div class="p-4">
            <p class="rule-label">幸运色</p>
            <div class="mt-2 flex items-center gap-2">
              <span class="h-4 w-4 shrink-0 rounded-[2px] border border-black/10" :style="{ backgroundColor: report.lucky.colorHex }" aria-hidden="true" />
              <span class="truncate text-sm font-semibold text-ink">{{ report.lucky.color }}</span>
            </div>
          </div>
          <div class="p-4">
            <p class="rule-label">幸运数字</p>
            <p class="mt-1 font-display text-2xl leading-7 tabular-nums text-ink">{{ report.lucky.number }}</p>
          </div>
          <div class="p-4">
            <p class="rule-label">幸运方位</p>
            <p class="mt-1 text-sm font-semibold text-ink">{{ report.lucky.direction }}</p>
          </div>
          <div class="p-4">
            <p class="rule-label">贵人属相</p>
            <p class="mt-1 truncate text-sm font-semibold text-ink">{{ report.lucky.noble }}</p>
          </div>
        </div>
      </section>

      <div class="flex items-center gap-3" aria-hidden="true">
        <span class="h-px flex-1 bg-hairline"></span>
        <CloudDivider class="h-6 w-auto" />
        <span class="h-px flex-1 bg-hairline"></span>
      </div>

      <section class="cloud-edge grid divide-y divide-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div class="bg-cinnabar/[0.05] p-4">
          <h3 class="font-display text-xl text-cinnabar">宜</h3>
          <p class="mt-2 text-sm leading-7 text-ink">{{ report.yi.join('、') }}</p>
        </div>
        <div class="bg-ink/[0.045] p-4">
          <h3 class="font-display text-xl text-ink">忌</h3>
          <p class="mt-2 text-sm leading-7 text-ink">{{ report.ji.join('、') }}</p>
        </div>
      </section>

      <div class="flex items-center gap-3" aria-hidden="true">
        <span class="h-px flex-1 bg-hairline"></span>
        <CloudDivider class="h-6 w-auto" />
        <span class="h-px flex-1 bg-hairline"></span>
      </div>

      <section class="sheet p-5">
        <h3 class="mb-3 text-sm font-semibold text-ink">7 日趋势</h3>
        <TrendChart :trend="trend" :today="today" />
      </section>
    </template>
  </section>
</template>
