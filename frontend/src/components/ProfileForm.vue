<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Check, Clock, Droplets, Loader2, Phone, Save, User } from '@lucide/vue'
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
  <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-2">
      <User :size="16" class="text-slate-500" />
      <h2 class="text-sm font-semibold text-slate-800">个人资料</h2>
    </div>

    <div class="space-y-4">
      <label class="block">
        <span class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <User :size="13" />
          姓名
        </span>
        <input
          :value="modelValue.name"
          type="text"
          maxlength="30"
          class="field"
          @input="update('name', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <CalendarDays :size="13" />
          出生日期
        </span>
        <input
          :value="modelValue.birthDate"
          type="date"
          class="field"
          @input="update('birthDate', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Clock :size="13" />
          出生时辰
        </span>
        <input
          :value="modelValue.birthTime"
          type="time"
          class="field"
          @input="update('birthTime', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Phone :size="13" />
          手机尾号
        </span>
        <input
          :value="modelValue.phoneTail"
          type="text"
          inputmode="numeric"
          maxlength="4"
          placeholder="4 位"
          class="field"
          @input="setPhoneTail"
        />
      </label>

      <div>
        <span class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Droplets :size="13" />
          血型
        </span>
        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="blood in bloodTypes"
            :key="blood.key || 'none'"
            type="button"
            class="segment"
            :class="modelValue.bloodType === blood.key ? 'segment-active' : ''"
            @click="update('bloodType', blood.key)"
          >
            {{ blood.label }}
          </button>
        </div>
      </div>

      <div>
        <span class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">性别</span>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="gender in genders"
            :key="gender.key"
            type="button"
            class="segment"
            :class="modelValue.gender === gender.key ? 'segment-active' : ''"
            @click="update('gender', gender.key)"
          >
            {{ gender.label }}
          </button>
        </div>
      </div>

      <div class="pt-1">
        <button
          type="button"
          :disabled="saving"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          @click="emit('save', modelValue)"
        >
          <Loader2 v-if="saving" :size="15" class="animate-spin" />
          <Save v-else :size="15" />
          {{ saving ? '保存中…' : '保存资料' }}
        </button>

        <div class="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span v-if="saveError" class="text-rose-600">{{ saveError }}</span>
          <span v-else-if="dirty" class="text-amber-600">有未保存的修改</span>
          <span v-else-if="savedLabel" class="flex items-center gap-1 text-emerald-600">
            <Check :size="13" />
            已保存 {{ savedLabel }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
