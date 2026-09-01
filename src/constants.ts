/** 사주팔자 도메인 상수 — python-bazi/_constants.py 의 TypeScript 포트. */

export const STEMS = [
  "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸",
] as const

export const BRANCHES = [
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
] as const

export const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const

export const STEM_INDEX = Object.fromEntries(
  STEMS.map((s, i) => [s, i]),
) as Record<typeof STEMS[number], number>

export const BRANCH_INDEX = Object.fromEntries(
  BRANCHES.map((b, i) => [b, i]),
) as Record<typeof BRANCHES[number], number>

export const ELEMENT_INDEX = Object.fromEntries(
  ELEMENTS.map((e, i) => [e, i]),
) as Record<typeof ELEMENTS[number], number>

export const STEM_ELEMENTS: Record<typeof STEMS[number], typeof ELEMENTS[number]> = {
  "甲": "wood", "乙": "wood",
  "丙": "fire", "丁": "fire",
  "戊": "earth", "己": "earth",
  "庚": "metal", "辛": "metal",
  "壬": "water", "癸": "water",
}

export const BRANCH_ELEMENTS: Record<typeof BRANCHES[number], typeof ELEMENTS[number]> = {
  "子": "water", "丑": "earth", "寅": "wood", "卯": "wood",
  "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
}

/**
 * 지장간(地藏干) — 각 지지에 숨어 있는 천간.
 * 첫 번째 원소가 주기(主氣).
 */
export const HIDDEN_STEMS: Record<typeof BRANCHES[number], readonly (typeof STEMS[number])[]> = {
  "子": ["癸"],
  "丑": ["己", "癸", "辛"],
  "寅": ["甲", "丙", "戊"],
  "卯": ["乙"],
  "辰": ["戊", "乙", "癸"],
  "巳": ["丙", "戊", "庚"],
  "午": ["丁", "己"],
  "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"],
  "酉": ["辛"],
  "戌": ["戊", "辛", "丁"],
  "亥": ["壬", "甲"],
}

/**
 * 천간합(天干合) — 합이 되는 천간 쌍.
 * Set<string> 배열로 표현 (frozenset 대응).
 */
export const STEM_COMBINATIONS: ReadonlyArray<Readonly<Set<typeof STEMS[number]>>> = [
  new Set(["甲", "己"] as const),
  new Set(["乙", "庚"] as const),
  new Set(["丙", "辛"] as const),
  new Set(["丁", "壬"] as const),
  new Set(["戊", "癸"] as const),
]

/**
 * 지지육합(地支六合) — 합이 되는 지지 쌍.
 */
export const BRANCH_LIUHE: ReadonlyArray<Readonly<Set<typeof BRANCHES[number]>>> = [
  new Set(["子", "丑"] as const),
  new Set(["寅", "亥"] as const),
  new Set(["卯", "戌"] as const),
  new Set(["辰", "酉"] as const),
  new Set(["巳", "申"] as const),
  new Set(["午", "未"] as const),
]

/**
 * 지지충(地支冲) — 충이 되는 지지 쌍.
 */
export const BRANCH_CLASH: ReadonlyArray<Readonly<Set<typeof BRANCHES[number]>>> = [
  new Set(["子", "午"] as const),
  new Set(["丑", "未"] as const),
  new Set(["寅", "申"] as const),
  new Set(["卯", "酉"] as const),
  new Set(["辰", "戌"] as const),
  new Set(["巳", "亥"] as const),
]

/**
 * 지지해(地支害) — 해가 되는 지지 쌍.
 */
export const BRANCH_HARM: ReadonlyArray<Readonly<Set<typeof BRANCHES[number]>>> = [
  new Set(["子", "未"] as const),
  new Set(["丑", "午"] as const),
  new Set(["寅", "巳"] as const),
  new Set(["卯", "辰"] as const),
  new Set(["申", "亥"] as const),
  new Set(["酉", "戌"] as const),
]

/** 오행 상생(相生) — A generates B. */
export const GENERATES: Record<typeof ELEMENTS[number], typeof ELEMENTS[number]> = {
  "wood": "fire",
  "fire": "earth",
  "earth": "metal",
  "metal": "water",
  "water": "wood",
}

/** 오행 상극(相克) — A controls B. */
export const CONTROLS: Record<typeof ELEMENTS[number], typeof ELEMENTS[number]> = {
  "wood": "earth",
  "earth": "water",
  "water": "fire",
  "fire": "metal",
  "metal": "wood",
}

/** 오행 상극(被克) — A is controlled by B. */
export const CONTROLLED_BY: Record<typeof ELEMENTS[number], typeof ELEMENTS[number]> = {
  "earth": "wood",
  "water": "earth",
  "fire": "water",
  "metal": "fire",
  "wood": "metal",
}
