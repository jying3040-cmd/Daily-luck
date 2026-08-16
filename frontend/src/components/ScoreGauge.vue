<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ score: number }>()

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const dash = computed(() => (CIRCUMFERENCE * props.score) / 100)
const color = computed(() => {
  if (props.score >= 90) return '#0f766e'
  if (props.score >= 78) return '#2563eb'
  if (props.score >= 65) return '#b45309'
  if (props.score >= 52) return '#64748b'
  return '#b91c1c'
})
</script>

<template>
  <div class="relative h-40 w-40">
    <svg viewBox="0 0 128 128" class="h-full w-full -rotate-90">
      <circle cx="64" cy="64" :r="RADIUS" fill="none" stroke="#e2e8f0" stroke-width="10" />
      <circle
        cx="64"
        cy="64"
        :r="RADIUS"
        fill="none"
        :stroke="color"
        stroke-width="10"
        stroke-linecap="round"
        :stroke-dasharray="`${dash} ${CIRCUMFERENCE}`"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <span class="text-4xl font-bold" :style="{ color }">{{ score }}</span>
      <span class="text-xs text-slate-500">综合运势</span>
    </div>
  </div>
</template>
