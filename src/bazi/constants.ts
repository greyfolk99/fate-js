/**
 * 1인 원국(原局) 파생 상수 — 십이운성(十二運星)·십이신살(十二神殺).
 * 문헌 대조로 검증한 값만 담는다. 유파가 갈리는 항목은 주석에 남긴다.
 */

import {
  STEMS,
  BRANCHES,
  BRANCH_INDEX,
  STEM_YINYANG,
} from "../constants.js"
import { BRANCH_SAMHAP } from "../match/constants.js"

type Stem = typeof STEMS[number]
type Branch = typeof BRANCHES[number]

// ── 십이운성(十二運星) ─────────────────────────────────────────────
//
// 일간(日干) 기준, 각 지지의 포태법(胞胎法) 단계.
// 양간(甲丙戊庚壬)은 장생지에서 순행(順行), 음간(乙丁己辛癸)은 역행(逆行).
// 화토동법(火土同法) 다수설 — 戊는 丙, 己는 丁과 같은 장생지를 쓴다.

/** 십이운성 12단계 — 장생지에서 진행 순서. */
export const TWELVE_STAGES: readonly string[] = [
  "장생(長生)", "목욕(沐浴)", "관대(冠帶)", "임관(臨官)",
  "제왕(帝旺)", "쇠(衰)", "병(病)", "사(死)",
  "묘(墓)", "절(絕)", "태(胎)", "양(養)",
]

/**
 * 일간별 장생지(長生地).
 * 甲亥·乙午·丙寅·丁酉·戊寅·己酉·庚巳·辛子·壬申·癸卯 (화토동법).
 * 검증: 연해자평·자평진전 십이운성표 만장일치(화토동법 기준).
 */
export const JANGSAENG_BY_STEM: Record<Stem, Branch> = {
  "甲": "亥", "乙": "午",
  "丙": "寅", "丁": "酉",
  "戊": "寅", "己": "酉",
  "庚": "巳", "辛": "子",
  "壬": "申", "癸": "卯",
}

/**
 * 일간 기준 지지 하나의 십이운성 단계를 구한다.
 * 양간 순행(+), 음간 역행(-).
 */
export function twelveStage(dayStem: Stem, branch: Branch): string {
  const jang = BRANCH_INDEX[JANGSAENG_BY_STEM[dayStem]]
  const b = BRANCH_INDEX[branch]
  const forward = STEM_YINYANG[dayStem] === "yang"
  const idx = forward
    ? (b - jang + 12) % 12
    : (jang - b + 12) % 12
  return TWELVE_STAGES[idx]!
}

// ── 십이신살(十二神殺) ─────────────────────────────────────────────
//
// 기준지(년지 또는 일지)가 속한 삼합국(三合局)을 기준으로, 각 지지에
// 배정되는 12신살. 지살=국의 장생지, 장성=왕지(旺支), 화개=묘지(墓地).
// 겁살은 장생지 바로 앞(절지). 순서: 겁살→재살→천살→지살→…→화개.
//
// 유파: 12신살은 전통적으로 년지(年支) 기준이 다수설이나, 현대는 일지(日支)
// 기준도 널리 쓴다. 여기선 양쪽 다 계산해 basis 로 밝힌다.

/** 십이신살 12종 — 겁살부터 순서(지지 순환과 1:1 대응). */
export const TWELVE_SINSAL: readonly string[] = [
  "겁살(劫殺)", "재살(災殺)", "천살(天殺)", "지살(地殺)",
  "년살(年殺)", "월살(月殺)", "망신살(亡神殺)", "장성살(將星殺)",
  "반안살(攀鞍殺)", "역마살(驛馬殺)", "육해살(六害殺)", "화개살(華蓋殺)",
]

/** 지지 → 자신이 속한 삼합국의 장생지(長生地). */
const JANGSAENG_OF_GROUP: Record<Branch, Branch> = (() => {
  // 삼합국 오행별 장생지: 水국(申子辰)→申, 木국(亥卯未)→亥,
  // 火국(寅午戌)→寅, 金국(巳酉丑)→巳.
  const startByElement: Record<string, Branch> = {
    water: "申", wood: "亥", fire: "寅", metal: "巳",
  }
  const out = {} as Record<Branch, Branch>
  for (const g of BRANCH_SAMHAP) {
    const start = startByElement[g.element]!
    for (const b of g.branches) out[b] = start
  }
  return out
})()

/**
 * 기준지 `ref` 를 기준으로 지지 `branch` 가 갖는 십이신살 명칭.
 * 지살(index 3) = 국의 장생지에 놓이도록 정렬한다.
 */
export function twelveSinsal(ref: Branch, branch: Branch): string {
  const jang = BRANCH_INDEX[JANGSAENG_OF_GROUP[ref]] // 지살 자리
  const start = (jang - 3 + 12) % 12 // 겁살 자리
  const idx = (BRANCH_INDEX[branch] - start + 12) % 12
  return TWELVE_SINSAL[idx]!
}
