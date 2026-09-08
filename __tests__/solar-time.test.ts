/**
 * 진태양시(眞太陽時) 보정 레이어 테스트.
 */
import { describe, test, expect, afterEach } from "vitest"
import { bazi } from "../src/bazi.js"
import { equationOfTime, solarCorrectionMinutes } from "../src/solar-time.js"
import { getSolarConfig, setSolarConfig } from "../src/config.js"

const DEFAULTS = getSolarConfig()
afterEach(() => setSolarConfig(DEFAULTS)) // 전역 설정 원복

describe("equationOfTime", () => {
  test("연중 ±16분 이내, 유한", () => {
    for (let m = 1; m <= 12; m++) {
      const e = equationOfTime(2000, m, 15)
      expect(Number.isFinite(e)).toBe(true)
      expect(Math.abs(e)).toBeLessThan(17)
    }
  })
  test("초순 8월은 태양시가 평균시보다 느림(음수, ≈ -6분)", () => {
    const e = equationOfTime(1992, 8, 4)
    expect(e).toBeLessThan(0)
    expect(e).toBeGreaterThan(-10)
  })
})

describe("solarCorrectionMinutes", () => {
  test("한국(경도 127.5, 표준 135)은 경도만으로 -30분", () => {
    const c = solarCorrectionMinutes(1992, 8, 4, 127.5, 135, false)
    expect(c).toBeCloseTo(-30, 5)
  })
  test("균시차 포함하면 -30보다 더 음수(8월초)", () => {
    const c = solarCorrectionMinutes(1992, 8, 4, 127.5, 135, true)
    expect(c).toBeLessThan(-30)
  })
})

describe("bazi 진태양시 보정", () => {
  const birth = { year: 1992, month: 8, day: 4, hour: 3, minute: 30, utcOffsetMinutes: 540 } as const

  test("03:30 경계: 보정 적용 시 시지 丑, 시주 辛丑 (기본 solar)", () => {
    const b = bazi(birth) // 전역 기본 applySolarTime=true
    expect(b.hour).toEqual({ stem: "辛", branch: "丑" })
    // 나머지 기둥은 그대로
    expect(b.year).toEqual({ stem: "壬", branch: "申" })
    expect(b.day).toEqual({ stem: "壬", branch: "子" })
  })

  test("timeBasis='standard'면 보정 없음 → 시지 寅, 시주 壬寅", () => {
    const b = bazi({ ...birth, timeBasis: "standard" })
    expect(b.hour).toEqual({ stem: "壬", branch: "寅" })
  })

  test("setSolarConfig로 전역 off 하면 표준시와 동일", () => {
    setSolarConfig({ applySolarTime: false })
    const off = bazi(birth)
    const std = bazi({ ...birth, timeBasis: "standard" })
    expect(off.hour).toEqual(std.hour)
    expect(off.hour).toEqual({ stem: "壬", branch: "寅" })
  })
})
