<script setup lang="ts">
import { computed } from 'vue'
import { Check, Loader2 } from '@lucide/vue'
import type { Profile } from '../lib/types'

const props = defineProps<{
  modelValue: Profile
  saving: boolean
  savedAt: Date | null
  dirty: boolean
  saveError: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Profile]
  save: [value: Profile]
}>()

function update<K extends keyof Profile>(key: K, value: Profile[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function setPhoneTail(event: Event) {
  const input = event.target as HTMLInputElement
  update('phoneTail', input.value.replace(/\D/g, '').slice(0, 4))
}

const savedLabel = computed(() =>
  props.savedAt
    ? props.savedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '',
)

const genders = [
  { key: 'unknown', label: '保密' },
  { key: 'male', label: '男' },
  { key: 'female', label: '女' },
] as const

const bloodTypes = [
  { key: '', label: '未知' },
  { key: 'A', label: 'A 型' },
  { key: 'B', label: 'B 型' },
  { key: 'AB', label: 'AB 型' },
  { key: 'O', label: 'O 型' },
] as const
</script>

<template>
  <section class="sheet p-5">
    <h2 class="mb-4 border-b border-hairline pb-3 text-sm font-semibold text-ink">个人资料</h2>

    <div class="space-y-4">
      <label class="block">
        <span class="mb-1.5 block text-xs font-medium text-ink-soft">姓名</span>
        <input
          :value="modelValue.name"
          type="text"
          name="name"
          autocomplete="name"
          maxlength="30"
          class="field"
          @input="update('name', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-medium text-ink-soft">出生日期</span>
        <input
          :value="modelValue.birthDate"
          type="date"
          name="birthdate"
          autocomplete="bday"
          class="field"
          @input="update('birthDate', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-medium text-ink-soft">出生时辰</span>
        <input
          :value="modelValue.birthTime"
          type="time"
          name="birthtime"
          class="field"
          @input="update('birthTime', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-medium text-ink-soft">手机尾号</span>
        <input
          :value="modelValue.phoneTail"
          type="text"
          name="phone-tail"
          inputmode="numeric"
          autocomplete="off"
          maxlength="4"
          placeholder="如 6789"
          spellcheck="false"
          class="field"
          @input="setPhoneTail"
        />
      </label>

      <fieldset>
        <legend class="mb-1.5 text-xs font-medium text-ink-soft">血型</legend>
        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="blood in bloodTypes"
            :key="blood.key || 'none'"
            type="button"
            class="segment"
            :class="modelValue.bloodType === blood.key ? 'segment-active' : ''"
            :aria-pressed="modelValue.bloodType === blood.key"
            @click="update('bloodType', blood.key)"
          >
            {{ blood.label }}
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-1.5 text-xs font-medium text-ink-soft">性别</legend>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="gender in genders"
            :key="gender.key"
            type="button"
            class="segment"
            :class="modelValue.gender === gender.key ? 'segment-active' : ''"
            :aria-pressed="modelValue.gender === gender.key"
            @click="update('gender', gender.key)"
          >
            {{ gender.label }}
          </button>
        </div>
      </fieldset>

      <div class="border-t border-hairline pt-4">
        <button
          type="button"
          :disabled="saving"
          class="flex w-full items-center justify-center gap-2 rounded-[4px] bg-ink px-4 py-2.5 text-sm font-semibold text-sheet transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          @click="emit('save', modelValue)"
        >
          <Loader2 v-if="saving" :size="15" class="animate-spin" aria-hidden="true" />
          {{ saving ? '保存中…' : '保存资料' }}
        </button>

        <div aria-live="polite" class="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span v-if="saveError" class="text-cinnabar">{{ saveError }}</span>
          <span v-else-if="dirty" class="text-ink-soft">有未保存的修改</span>
          <span v-else-if="savedLabel" class="flex items-center gap-1 text-ink-soft">
            <Check :size="13" aria-hidden="true" />
            已保存 <span class="tabular-nums">{{ savedLabel }}</span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
