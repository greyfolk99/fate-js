import { baziVectorized, EPOCH_ORD } from "./engine.js"
import { toOrdinal } from "./date-util.js"
import { STEMS, BRANCHES } from "./constants.js"
import { getSolarConfig } from "./config.js"
import { solarCorrectionMinutes } from "./solar-time.js"
import { assertValidBirthInput } from "./validate.js"
import { resolveUtcOffsetMinutes } from "./timezone.js"
import type { Bazi, BirthInput, Pillar } from "./types.js"

/**
 * 생년월일시로 사주팔자 사주(四柱)를 계산한다.
 *
 * 시간 프레임(2026-09 재설계): 각 기둥이 다른 프레임을 쓴다.
 *  - 월·연주 = 출생 **절대순간(UTC)** vs 절기 UTC. 입력 로컬시각을 UTC오프셋으로 변환.
 *    (오프셋은 timezone(IANA) 자동 해석 또는 utcOffsetMinutes 수동 지정 — 정확히 하나, 암묵 기본값 없음.)
 *  - 시주 = 로컬 **진태양시**(경도+균시차 보정). 보정은 시주에만 적용, 절대순간·일주는 안 건드림.
 *  - 일주 = 로컬 civil 날짜 + 야자시. (진태양시로 날짜를 굴리지 않는다 — v1.)
 * 진태양시를 끄려면 input.timeBasis='standard' 또는 setSolarConfig({applySolarTime:false}).
 *
 * @param input - 날짜·시간·오프셋·보정 옵션
 * @returns 연·월·일·시 사주(四柱) 객체
 */
export function bazi(input: BirthInput & { hour: number }): Bazi & { hour: Pillar }
export function bazi(input: BirthInput): Bazi
export function bazi(input: BirthInput): Bazi {
  assertValidBirthInput(input)
  const { year, month, day, hour, minute } = input
  const hasTime = hour !== undefined
  const cfg = getSolarConfig()
  const applySolar = input.timeBasis
    ? input.timeBasis === "solar"
    : cfg.applySolarTime

  const dateOrd = toOrdinal(year, month, day) // 일주: 로컬 civil 날짜(진태양시로 안 굴림)
  const stdHour = hour ?? 0
  const stdMinute = minute ?? 0

  // ── 절기용 절대순간(UTC) ── 입력 로컬시각 − UTC오프셋. 진태양시는 절대순간을 안 바꾸므로 미적용.
  // 오프셋: utcOffsetMinutes 수동 지정 또는 timezone(IANA) 자동 해석 — XOR은 검증에서 보장됨.
  const offsetMin = input.utcOffsetMinutes !== undefined
    ? input.utcOffsetMinutes
    : resolveUtcOffsetMinutes(input.timezone as string, year, month, day, stdHour, stdMinute)
  const utcSec = (dateOrd - EPOCH_ORD) * 86400 + stdHour * 3600 + stdMinute * 60 - offsetMin * 60

  // ── 시주용 로컬 진태양시 시각 ──
  let localHour = stdHour + stdMinute / 60
  if (hasTime && applySolar) {
    const longitude = input.longitude ?? cfg.defaultLongitude
    const corr = solarCorrectionMinutes(
      year, month, day, longitude, cfg.standardMeridian, cfg.applyEot,
    )
    localHour += corr / 60
    // 시주 지지 계산용 [0,24) 정규화(일주 date는 안 굴린다).
    localHour = ((localHour % 24) + 24) % 24
  }

  const indices = baziVectorized(dateOrd, hasTime ? localHour : 0, utcSec)
  return {
    year:  { stem: STEMS[indices.year.stemIdx]!,  branch: BRANCHES[indices.year.branchIdx]! },
    month: { stem: STEMS[indices.month.stemIdx]!, branch: BRANCHES[indices.month.branchIdx]! },
    day:   { stem: STEMS[indices.day.stemIdx]!,   branch: BRANCHES[indices.day.branchIdx]! },
    hour:  hasTime
      ? { stem: STEMS[indices.hour.stemIdx]!, branch: BRANCHES[indices.hour.branchIdx]! }
      : null,
  }
}
