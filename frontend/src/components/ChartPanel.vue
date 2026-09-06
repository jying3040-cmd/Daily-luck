<script setup lang="ts">
import type { Chart } from '../lib/types'

defineProps<{ chart: Chart | null }>()

const ELEMENT_LABEL: Record<string, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
}
</script>

<template>
  <section class="sheet p-5">
    <h2 class="mb-4 border-b border-hairline pb-3 text-sm font-semibold text-ink">我的命盘</h2>

    <template v-if="chart">
      <div class="grid grid-cols-4 divide-x divide-hairline rounded-[4px] border border-hairline bg-paper/60">
        <div
          v-for="(pillar, label) in {
            年: chart.eightChar.year,
            月: chart.eightChar.month,
            日: chart.eightChar.day,
            时: chart.eightChar.time,
          }"
          :key="label"
          class="flex flex-col items-center gap-3 py-4"
        >
          <span class="text-[11px] text-ink-faint">{{ label }}柱</span>
          <span class="font-display text-2xl leading-none text-ink [writing-mode:vertical-rl]">{{ pillar }}</span>
        </div>
      </div>

      <dl class="mt-4 grid grid-cols-2 gap-x-5 text-xs">
        <div class="flex items-baseline justify-between border-b border-hairline/70 py-1.5">
          <dt class="text-ink-faint">生肖</dt>
          <dd class="text-ink">{{ chart.animal }}</dd>
        </div>
        <div class="flex items-baseline justify-between border-b border-hairline/70 py-1.5">
          <dt class="text-ink-faint">星座</dt>
          <dd class="text-ink">{{ chart.zodiac }}</dd>
        </div>
        <div class="flex items-baseline justify-between border-b border-hairline/70 py-1.5">
          <dt class="text-ink-faint">生命数字</dt>
          <dd class="tabular-nums text-ink">{{ chart.lifeNumber }}</dd>
        </div>
        <div class="flex items-baseline justify-between border-b border-hairline/70 py-1.5">
          <dt class="text-ink-faint">日干五行</dt>
          <dd class="text-ink">{{ ELEMENT_LABEL[chart.dayElement] ?? chart.dayElement }}</dd>
        </div>
      </dl>

      <p class="mt-3 text-[11px] leading-5 text-ink-faint">出生时辰已参与时柱排盘。</p>
    </template>
    <p v-else class="text-xs leading-5 text-ink-soft">填写姓名与出生日期并保存后，将在这里展示你的命盘。</p>
  </section>
</template>
