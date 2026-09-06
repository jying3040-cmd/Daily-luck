<script setup lang="ts">
const props = defineProps<{ score: number }>()

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const dash = (CIRCUMFERENCE * props.score) / 100
</script>

<template>
  <div class="relative h-40 w-40">
    <svg viewBox="0 0 128 128" class="h-full w-full -rotate-90" aria-hidden="true">
      <circle cx="64" cy="64" :r="RADIUS" fill="none" class="stroke-track" stroke-width="9" />
      <circle
        cx="64"
        cy="64"
        :r="RADIUS"
        fill="none"
        class="stroke-cinnabar"
        stroke-width="9"
        :stroke-dasharray="`${dash} ${CIRCUMFERENCE}`"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-1">
      <span class="font-display text-[40px] leading-none tabular-nums text-ink">{{ score }}</span>
      <span class="text-xs text-ink-soft">综合运势</span>
    </div>
  </div>
</template>
