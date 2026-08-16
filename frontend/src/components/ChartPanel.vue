<script setup lang="ts">
import { CalendarHeart } from '@lucide/vue'
import type { Chart } from '../lib/types'

defineProps<{ chart: Chart | null }>()
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-2">
      <CalendarHeart :size="16" class="text-slate-500" />
      <h2 class="text-sm font-semibold text-slate-800">我的命盘</h2>
    </div>

    <template v-if="chart">
      <div class="grid grid-cols-4 gap-1.5">
        <div
          v-for="(pillar, label) in {
            年: chart.eightChar.year,
            月: chart.eightChar.month,
            日: chart.eightChar.day,
            时: chart.eightChar.time,
          }"
          :key="label"
          class="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center"
        >
          <div class="text-[10px] text-slate-400">{{ label }}柱</div>
          <div class="font-mono text-sm font-semibold text-slate-800">{{ pillar }}</div>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-1.5">
        <span class="chip">{{ chart.zodiac }}</span>
        <span class="chip">生肖 {{ chart.animal }}</span>
        <span class="chip">生命数字 {{ chart.lifeNumber }}</span>
        <span class="chip">日干五行 {{ chart.dayElement }}</span>
      </div>
      <p class="mt-3 text-[11px] leading-5 text-slate-400">出生时辰已参与时柱排盘。</p>
    </template>
    <p v-else class="text-xs leading-5 text-slate-500">填写姓名与出生日期并保存后，将在这里展示你的命盘。</p>
  </section>
</template>
