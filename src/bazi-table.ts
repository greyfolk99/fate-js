import { baziVectorized } from "./engine.js"
import { toOrdinal } from "./date-util.js"
import { STEMS, BRANCHES } from "./constants.js"
import type { BaziTable, BirthInput } from "./types.js"

/**
 * 생년월일시로 사주팔자 사주(四柱)를 계산한다.
 *
 * @param input - 날짜·시간 및 보정 옵션
 * @returns 연·월·일·시 사주(四柱) 객체
 */
export function baziTable(input: BirthInput): BaziTable {
  const { year, month, day, hour } = input
  // timeBasis='solar' 진태양시는 TODO (longitude 보정 필요)
  const dateOrd = toOrdinal(year, month, day)
  const h = hour ?? 0
  const indices = baziVectorized(dateOrd, h)
  return {
    year:  { stem: STEMS[indices.year.stemIdx]!,  branch: BRANCHES[indices.year.branchIdx]! },
    month: { stem: STEMS[indices.month.stemIdx]!, branch: BRANCHES[indices.month.branchIdx]! },
    day:   { stem: STEMS[indices.day.stemIdx]!,   branch: BRANCHES[indices.day.branchIdx]! },
    hour:  hour !== undefined
      ? { stem: STEMS[indices.hour.stemIdx]!, branch: BRANCHES[indices.hour.branchIdx]! }
      : null,
  }
}
