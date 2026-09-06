<script setup lang="ts">
import { computed } from 'vue'
import type { Report } from '../lib/types'

const props = defineProps<{ trend: Report[]; today: string }>()

const WIDTH = 560
const HEIGHT = 200
const PAD_LEFT = 44
const PAD_RIGHT = 24
const PAD_TOP = 22
const PAD_BOTTOM = 30
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM

const points = computed(() => {
  const count = Math.max(props.trend.length - 1, 1)
  return props.trend.map((report, index) => {
    const x = PAD_LEFT + (index * (WIDTH - PAD_LEFT - PAD_RIGHT)) / count
    const y = PAD_TOP + ((100 - report.total) * PLOT_HEIGHT) / 100
    return { x, y, report, index, isToday: report.date === props.today }
  })
})

const linePath = computed(() =>
  points.value.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '),
)

const areaPath = computed(() => {
  if (points.value.length === 0) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  const bottom = HEIGHT - PAD_BOTTOM
  return `${linePath.value} L ${last.x.toFixed(1)} ${bottom} L ${first.x.toFixed(1)} ${bottom} Z`
})

function yFor(value: number): number {
  return PAD_TOP + ((100 - value) * PLOT_HEIGHT) / 100
}

const gridLines = [100, 75, 50, 25]
</script>

<template>
  <div class="overflow-hidden">
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="h-auto w-full" role="img" aria-label="7 日运势趋势">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b3352c" stop-opacity="0.09" />
          <stop offset="100%" stop-color="#b3352c" stop-opacity="0.01" />
        </linearGradient>
      </defs>

      <g v-for="value in gridLines" :key="value">
        <line
          :x1="PAD_LEFT"
          :x2="WIDTH - PAD_RIGHT"
          :y1="yFor(value)"
          :y2="yFor(value)"
          class="stroke-hairline"
          stroke-dasharray="2 4"
        />
        <text :x="PAD_LEFT - 8" :y="yFor(value) + 3" text-anchor="end" font-size="10" class="fill-ink-faint tabular-nums">
          {{ value }}
        </text>
      </g>

      <path :d="areaPath" fill="url(#trendFill)" />
      <path :d="linePath" fill="none" class="stroke-ink" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

      <g v-for="point in points" :key="point.report.date">
        <circle
          :cx="point.x"
          :cy="point.y"
          :r="point.isToday ? 5 : 3.5"
          :fill="point.isToday ? '#b3352c' : '#fffdf8'"
          :class="point.isToday ? 'stroke-cinnabar' : 'stroke-ink'"
          stroke-width="1.5"
        />
        <text
          :x="point.x"
          :y="point.y - 10"
          text-anchor="middle"
          font-size="11"
          font-weight="600"
          :fill="point.isToday ? '#b3352c' : '#2a2723'"
          class="tabular-nums"
        >
          {{ point.report.total }}
        </text>
        <text :x="point.x" :y="HEIGHT - 8" text-anchor="middle" font-size="10" class="fill-ink-soft tabular-nums">
          {{ point.report.date.slice(5) }}
        </text>
      </g>

      <text
        v-if="points.length"
        :x="points.find((point) => point.isToday)?.x ?? points[points.length - 1].x"
        :y="HEIGHT - 22"
        text-anchor="middle"
        font-size="10"
        font-weight="600"
        class="fill-cinnabar"
      >
        今日
      </text>
    </svg>
  </div>
</template>
