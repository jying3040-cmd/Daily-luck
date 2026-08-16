/** 与服务端约定一致的类型。 */

export interface Profile {
  name: string
  birthDate: string
  birthTime: string
  gender: 'male' | 'female' | 'unknown'
  bloodType: 'A' | 'B' | 'AB' | 'O' | ''
  phoneTail: string
}

export type CategoryKey = 'career' | 'wealth' | 'love' | 'health' | 'social'

/** 基础排盘（出生命盘） */
export interface Chart {
  eightChar: { year: string; month: string; day: string; time: string }
  zodiac: string
  animal: string
  lifeNumber: number
  dayElement: string
}

export interface CategoryScore {
  key: CategoryKey
  label: string
  score: number
  advice: string
}

export interface Lucky {
  color: string
  colorHex: string
  number: number
  direction: string
  noble: string
}

export interface Report {
  date: string
  weekday: string
  lunarDate: string
  /** 今日八字四柱 */
  todayEightChar: { year: string; month: string; day: string; time: string }
  animal: string
  zodiac: string
  lifeNumber: number
  total: number
  level: string
  advice: string
  categories: CategoryScore[]
  yi: string[]
  ji: string[]
  lucky: Lucky
  chongAnimal: string
}
