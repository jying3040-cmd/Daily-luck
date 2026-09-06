<script setup lang="ts">
/** 招财猫吉祥物：invite 招手 / cheer 双爪庆祝 / rest 打盹。纯内联 SVG，无外部资源。 */
withDefaults(defineProps<{ mood?: 'invite' | 'cheer' | 'rest' }>(), { mood: 'invite' })
</script>

<template>
  <svg viewBox="0 0 150 130" role="img" :aria-label="`招财猫（${mood === 'cheer' ? '开心' : mood === 'rest' ? '打盹' : '招手'}）`">
    <!-- 尾巴 -->
    <path
      d="M112 106 q20 3 19 -13 q-1 -9 -10 -9"
      fill="none" stroke="#2a2723" stroke-width="5" stroke-linecap="round"
    />

    <!-- 举起的左爪（招手/庆祝时挥动） -->
    <g
      v-if="mood !== 'rest'"
      class="cat-paw"
      style="transform-box: fill-box; transform-origin: 80% 100%"
    >
      <path d="M48 60 q-17 -1 -23 -19" fill="none" stroke="#2a2723" stroke-width="6" stroke-linecap="round" />
      <ellipse cx="23" cy="35" rx="10.5" ry="12.5" fill="#fffdf8" stroke="#2a2723" stroke-width="2.5" transform="rotate(-18 23 35)" />
      <path d="M18 40 q4 -2.5 8 -1" fill="none" stroke="#2a2723" stroke-width="1.6" stroke-linecap="round" />
      <path v-if="mood === 'invite'" d="M8 24 q5 -5 11 -4 M10 32 q5 -4 10 -3.5" fill="none" stroke="#b3352c" stroke-width="1.8" stroke-linecap="round" />
    </g>

    <!-- 庆祝时的右爪 -->
    <g v-if="mood === 'cheer'" style="transform-box: fill-box; transform-origin: 20% 100%">
      <path d="M102 60 q17 -1 23 -19" fill="none" stroke="#2a2723" stroke-width="6" stroke-linecap="round" />
      <ellipse cx="127" cy="35" rx="10.5" ry="12.5" fill="#fffdf8" stroke="#2a2723" stroke-width="2.5" transform="rotate(18 127 35)" />
    </g>

    <!-- 打盹时的搭爪 -->
    <ellipse v-if="mood === 'rest'" cx="30" cy="98" rx="9" ry="12" fill="#fffdf8" stroke="#2a2723" stroke-width="2.5" transform="rotate(-14 30 98)" />

    <!-- 身体 -->
    <ellipse cx="75" cy="99" rx="33" ry="21" fill="#fffdf8" stroke="#2a2723" stroke-width="2.5" />
    <ellipse cx="63" cy="115" rx="9" ry="6" fill="#fffdf8" stroke="#2a2723" stroke-width="2" />
    <ellipse cx="87" cy="115" rx="9" ry="6" fill="#fffdf8" stroke="#2a2723" stroke-width="2" />

    <!-- 头 -->
    <ellipse cx="75" cy="54" rx="37" ry="30" fill="#fffdf8" stroke="#2a2723" stroke-width="2.5" />

    <!-- 耳朵 -->
    <path d="M47 36 q-4 -16 5 -19 q9 -3 16 11" fill="#fffdf8" stroke="#2a2723" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M52 30 q-1 -8 4 -9 q5 -1 9 6" fill="#b3352c" opacity="0.55" />
    <path d="M103 36 q4 -16 -5 -19 q-9 -3 -16 11" fill="#fffdf8" stroke="#2a2723" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M98 30 q1 -8 -4 -9 q-5 -1 -9 6" fill="#b3352c" opacity="0.55" />

    <!-- 项圈与铃铛 -->
    <path d="M52 76 q23 11 46 0 l-1.5 7 q-21.5 10 -43 0 z" fill="#b3352c" />
    <circle cx="75" cy="87" r="5.5" fill="#d9a514" stroke="#2a2723" stroke-width="2" />
    <path d="M75 84.5 v5 M72 87 h6" stroke="#2a2723" stroke-width="1.2" />

    <!-- 脸 -->
    <g v-if="mood === 'rest'">
      <path d="M55 53 h9 M86 53 h9" fill="none" stroke="#2a2723" stroke-width="2.5" stroke-linecap="round" />
    </g>
    <g v-else>
      <path d="M56 53 q4.5 -7 9 0 M85 53 q4.5 -7 9 0" fill="none" stroke="#2a2723" stroke-width="2.5" stroke-linecap="round" />
    </g>
    <circle cx="48" cy="62" r="4.5" fill="#b3352c" opacity="0.2" />
    <circle cx="102" cy="62" r="4.5" fill="#b3352c" opacity="0.2" />
    <path d="M70 60.5 q2.5 3.2 5 0 q2.5 3.2 5 0" fill="none" stroke="#2a2723" stroke-width="1.8" stroke-linecap="round" />
    <path d="M38 56 l-11 -3 M38 62 l-11 2 M112 56 l11 -3 M112 62 l11 2" stroke="#2a2723" stroke-width="1.5" stroke-linecap="round" opacity="0.75" />

    <!-- 打盹的 Z z -->
    <text v-if="mood === 'rest'" x="120" y="30" font-size="13" font-weight="700" fill="#a29a89">z</text>
    <text v-if="mood === 'rest'" x="130" y="20" font-size="10" font-weight="700" fill="#a29a89">z</text>

    <!-- 开心的星星 -->
    <g v-if="mood === 'cheer'" fill="#b3352c">
      <path d="M22 14 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8 z" />
      <path d="M138 20 l1.4 3.2 3.2 1.4 -3.2 1.4 -1.4 3.2 -1.4 -3.2 -3.2 -1.4 3.2 -1.4 z" opacity="0.8" />
    </g>
  </svg>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .cat-paw {
    animation: cat-wave 2.8s ease-in-out 2;
  }
  @keyframes cat-wave {
    0%,
    100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(9deg);
    }
  }
}
</style>
