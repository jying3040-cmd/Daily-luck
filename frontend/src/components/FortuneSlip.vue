<script setup lang="ts">
import { computed } from 'vue'
import FortuneCat from './FortuneCat.vue'

const props = defineProps<{ today: string; seed: string }>()

/** 签语仅供娱乐，与运势分数一样按日期 + 命盘确定性选取。 */
const SLIPS = [
  { text: '静水长流，稳中自有进展。', note: '宜专注手头的事，不必东张西望。' },
  { text: '贵人不在远方，就在今日的相遇里。', note: '遇到合拍的人，主动打个招呼。' },
  { text: '今日宜慢：好饭不怕晚，好事不怕等。', note: '把节奏放慢一点，反而顺利。' },
  { text: '心里的包袱放下一半，路就好走一半。', note: '睡前把烦心事写在纸上，明早再看。' },
  { text: '天边虹霓，不如眼前一步。', note: '从最小的一件事开始做起。' },
  { text: '蓄势如弓，不必今日发满。', note: '留三分力气，给更重要的事。' },
  { text: '云开处自有光，先走起来再说。', note: '方向对了，慢一点也没关系。' },
  { text: '今日宜整理：桌面清了，心也清了。', note: '花十分钟收拾身边，运气跟着亮堂。' },
  { text: '与其观望风向，不如掌稳船桨。', note: '能控制的事，认真做好就够了。' },
  { text: '早睡一分，明日运气加一分。', note: '今晚就别熬夜啦，猫都替你着急。' },
  { text: '三分天注定，七分靠好心情。', note: '心情是自己给的，今天给自己一份。' },
  { text: '开口三分暖，一笑万事宽。', note: '今日多夸夸别人，也会被温柔以待。' },
  { text: '别急，命运的快递正在派送中。', note: '该来的都在路上，签收前先过好今天。' },
  { text: '今日的猫，会比平时更旺你。', note: '这是本签最准的一句。' },
]

function hashStr(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const slip = computed(() => SLIPS[hashStr(`${props.today}|${props.seed}`) % SLIPS.length])
</script>

<template>
  <section class="sheet relative overflow-hidden p-5">
    <div class="mb-3 flex items-center gap-2">
      <span class="seal h-5 w-5 text-[11px]" aria-hidden="true">签</span>
      <h2 class="text-sm font-semibold text-ink">锦囊 · 今日一言</h2>
    </div>
    <p class="font-display text-lg leading-8 text-ink">{{ slip.text }}</p>
    <p class="mt-2 pr-16 text-xs leading-5 text-ink-soft">解曰：{{ slip.note }}</p>
    <FortuneCat mood="rest" class="pointer-events-none absolute -bottom-1.5 right-2 w-16" />
  </section>
</template>
