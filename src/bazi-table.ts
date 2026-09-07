import { baziVectorized } from "./engine.js"
import { toOrdinal } from "./date-util.js"
import { STEMS, BRANCHES } from "./constants.js"
import { getSolarConfig } from "./config.js"
import { solarCorrectionMinutes } from "./solar-time.js"
import { assertValidBirthInput } from "./validate.js"
import type { BaziTable, BirthInput } from "./types.js"

/**
 * 생년월일시로 사주팔자 사주(四柱)를 계산한다.
 *
 * 시각이 주어지면 기본으로 진태양시(眞太陽時) 보정을 적용한다(전역 설정 getSolarConfig).
 * 보정 = 경도 지방시 + 균시차. 보정 결과가 자정을 넘으면 날짜(→일주·월주·연주)까지 함께 이동한다.
 * 보정을 끄려면 input.timeBasis='standard' 또는 setSolarConfig({applySolarTime:false}).
 *
 * @param input - 날짜·시간 및 보정 옵션
 * @returns 연·월·일·시 사주(四柱) 객체
 */
export function baziTable(input: BirthInput): BaziTable {
  assertValidBirthInput(input)
  const { year, month, day, hour, minute } = input
  const hasTime = hour !== undefined
  const cfg = getSolarConfig()
  const applySolar = input.timeBasis
    ? input.timeBasis === "solar"
    : cfg.applySolarTime

  let dateOrd = toOrdinal(year, month, day)
  let decimalHour = (hour ?? 0) + (minute ?? 0) / 60

  if (hasTime && applySolar) {
    const longitude = input.longitude ?? cfg.defaultLongitude
    const corr = solarCorrectionMinutes(
      year, month, day, longitude, cfg.standardMeridian, cfg.applyEot,
    )
    decimalHour += corr / 60
    // 보정으로 자정을 넘으면 날짜 이동(태양일 기준).
    while (decimalHour < 0) { decimalHour += 24; dateOrd -= 1 }
    while (decimalHour >= 24) { decimalHour -= 24; dateOrd += 1 }
  }

  const indices = baziVectorized(dateOrd, hasTime ? decimalHour : 0)
  return {
    year:  { stem: STEMS[indices.year.stemIdx]!,  branch: BRANCHES[indices.year.branchIdx]! },
    month: { stem: STEMS[indices.month.stemIdx]!, branch: BRANCHES[indices.month.branchIdx]! },
    day:   { stem: STEMS[indices.day.stemIdx]!,   branch: BRANCHES[indices.day.branchIdx]! },
    hour:  hasTime
      ? { stem: STEMS[indices.hour.stemIdx]!, branch: BRANCHES[indices.hour.branchIdx]! }
      : null,
  }
}
