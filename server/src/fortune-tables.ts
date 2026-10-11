import type { CategoryKey } from './fortune.js'

/**
 * 排盘与文案使用的常量查找表。
 * 与算法逻辑分离，便于审阅规则数据（见 fortune.ts）。
 */

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  career: '事业',
  wealth: '财运',
  love: '感情',
  health: '健康',
  social: '人际',
}

export const CATEGORY_KEYS: CategoryKey[] = ['career', 'wealth', 'love', 'health', 'social']

export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

export const GAN_ELEMENT: Record<string, FiveElement> = {
  甲: 'wood',
  乙: 'wood',
  丙: 'fire',
  丁: 'fire',
  戊: 'earth',
  己: 'earth',
  庚: 'metal',
  辛: 'metal',
  壬: 'water',
  癸: 'water',
}

export const ELEMENT_LABEL: Record<FiveElement, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
}

export const GENERATES: Record<FiveElement, FiveElement> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

export const CONTROLS: Record<FiveElement, FiveElement> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
}

export const SIX_HARM: Record<string, string> = {
  子: '丑',
  丑: '子',
  寅: '亥',
  亥: '寅',
  卯: '戌',
  戌: '卯',
  辰: '酉',
  酉: '辰',
  巳: '申',
  申: '巳',
  午: '未',
  未: '午',
}

export const CHONG: Record<string, string> = {
  子: '午',
  午: '子',
  丑: '未',
  未: '丑',
  寅: '申',
  申: '寅',
  卯: '酉',
  酉: '卯',
  辰: '戌',
  戌: '辰',
  巳: '亥',
  亥: '巳',
}

export const SAN_HE_GROUPS = [
  ['申', '子', '辰'],
  ['寅', '午', '戌'],
  ['巳', '酉', '丑'],
  ['亥', '卯', '未'],
]

export const NOBLE_ANIMALS: Record<string, string[]> = {
  甲: ['牛', '羊'],
  戊: ['牛', '羊'],
  庚: ['牛', '羊'],
  乙: ['鼠', '猴'],
  己: ['鼠', '猴'],
  丙: ['猪', '鸡'],
  丁: ['猪', '鸡'],
  壬: ['兔', '蛇'],
  癸: ['兔', '蛇'],
  辛: ['虎', '马'],
}

export const ZODIAC_BOUNDARIES = [
  { start: 120, sign: '水瓶座' },
  { start: 219, sign: '双鱼座' },
  { start: 321, sign: '白羊座' },
  { start: 420, sign: '金牛座' },
  { start: 521, sign: '双子座' },
  { start: 622, sign: '巨蟹座' },
  { start: 723, sign: '狮子座' },
  { start: 823, sign: '处女座' },
  { start: 923, sign: '天秤座' },
  { start: 1024, sign: '天蝎座' },
  { start: 1123, sign: '射手座' },
  { start: 1222, sign: '摩羯座' },
]

export const ZODIAC_ELEMENT: Record<string, 'fire' | 'earth' | 'air' | 'water'> = {
  白羊座: 'fire',
  狮子座: 'fire',
  射手座: 'fire',
  金牛座: 'earth',
  处女座: 'earth',
  摩羯座: 'earth',
  双子座: 'air',
  天秤座: 'air',
  水瓶座: 'air',
  巨蟹座: 'water',
  天蝎座: 'water',
  双鱼座: 'water',
}

export const ZODIAC_ELEMENT_LABEL: Record<'fire' | 'earth' | 'air' | 'water', string> = {
  fire: '火象',
  earth: '土象',
  air: '风象',
  water: '水象',
}

export const ELEMENT_BOOST: Record<string, CategoryKey> = {
  fire: 'career',
  earth: 'health',
  air: 'social',
  water: 'love',
}

export const BLOOD_ELEMENT: Record<string, FiveElement> = {
  A: 'earth',
  B: 'fire',
  AB: 'water',
  O: 'metal',
}

export const BLOOD_BOOST: Record<FiveElement, CategoryKey> = {
  wood: 'career',
  fire: 'love',
  earth: 'health',
  metal: 'wealth',
  water: 'love',
}

export const NUMBER_COLORS: Record<number, { name: string; hex: string }> = {
  1: { name: '黛蓝', hex: '#33507a' },
  2: { name: '黛蓝', hex: '#33507a' },
  3: { name: '青碧', hex: '#0f766e' },
  4: { name: '青碧', hex: '#0f766e' },
  5: { name: '绛红', hex: '#b43a2b' },
  6: { name: '绛红', hex: '#b43a2b' },
  7: { name: '鎏金', hex: '#b8860b' },
  8: { name: '鎏金', hex: '#b8860b' },
  9: { name: '琥珀', hex: '#b96a2d' },
}

export const CATEGORY_GUIDANCE: Record<CategoryKey, { high: string; steady: string; low: string }> = {
  career: {
    high: '适合主动汇报、约谈与推进关键事项，重要机会可以大胆接。',
    steady: '宜稳扎稳打，把今天的任务做完比多做更重要。',
    low: '不宜做重大决定，重要事项留到状态回升后再谈。',
  },
  wealth: {
    high: '适合记账、规划与小额尝试，守住预算会有收获。',
    steady: '财运平稳，理性消费、避免跟风即可。',
    low: '避免冲动消费与高风险投入，今天管好钱包。',
  },
  love: {
    high: '适合表达、陪伴与修复关系，直接说会比猜更好。',
    steady: '感情宜顺其自然，多倾听、少评判。',
    low: '少猜疑、少翻旧账，沟通尽量简短直接。',
  },
  health: {
    high: '适合规律作息、轻运动和清淡饮食。',
    steady: '注意劳逸结合，久坐记得起身活动。',
    low: '减少熬夜和疲劳，身体信号要当真。',
  },
  social: {
    high: '适合聚会、求助与拓展人脉，容易遇到愿意帮忙的人。',
    steady: '人际平稳，真诚往来即可，不必刻意表现。',
    low: '减少无谓应酬，重要关系一对一沟通。',
  },
}
