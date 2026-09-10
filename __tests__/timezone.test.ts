/**
 * UTC 캐노니컬 시간 프레임 테스트 (2026-09 재설계).
 * - 절기(월·연) = 출생 절대순간(UTC) vs 절기 UTC. 입력 로컬시각을 utcOffsetMinutes로 UTC 변환.
 * - 시주 = 로컬 진태양시. 일주 = 로컬 civil 날짜. (절기는 진태양시·일주와 프레임 분리.)
 */
import { describe, test, expect } from "vitest"
import { bazi } from "../src/bazi.js"
import { resolveUtcOffsetMinutes } from "../src/timezone.js"
import type { Bazi, BirthInput } from "../src/types.js"

const p = (c: Bazi) =>
  `${c.year.stem}${c.year.branch} ${c.month.stem}${c.month.branch} ${c.day.stem}${c.day.branch} ` +
  `${c.hour ? c.hour.stem + c.hour.branch : "—"}`

describe("hjseo 원판(진태양시 KST 기본)", () => {
  test("1992-08-04 01:55 KST → 壬申 丁未 壬子 辛丑", () => {
    const c = bazi({ year: 1992, month: 8, day: 4, hour: 1, minute: 55, utcOffsetMinutes: 540 })
    expect(p(c)).toBe("壬申 丁未 壬子 辛丑")
  })
})

describe("절기 경계: KST vs CST 프레임 분기 (입춘 2025)", () => {
  // 입춘 2025 = UTC 2025-02-03 14:10 → KST 벽시계 23:10, CST 벽시계 22:10.
  // civil 22:30에 태어난 사람:
  //  - KST(+540): 절대순간 13:30 UTC < 입춘 → 입춘 前 (甲辰년 丑月) ← 한국 출생자의 실제(정답)
  //  - CST(+480): 절대순간 14:30 UTC > 입춘 → 입춘 後 (乙巳년 寅月) ← 구엔진이 KST에 잘못 주던 값
  const base = { year: 2025, month: 2, day: 3, hour: 22, minute: 30, timeBasis: "standard" } as const

  test("KST(+540)는 입춘 前 = 甲辰 丁丑 (천문학적 정답)", () => {
    const c = bazi({ ...base, utcOffsetMinutes: 540 })
    expect(c.year.stem + c.year.branch).toBe("甲辰")
    expect(c.month.stem + c.month.branch).toBe("丁丑")
  })

  test("CST(+480)는 입춘 後 = 乙巳 戊寅 (같은 civil시각, 다른 프레임)", () => {
    const c = bazi({ ...base, utcOffsetMinutes: 480 })
    expect(c.year.stem + c.year.branch).toBe("乙巳")
    expect(c.month.stem + c.month.branch).toBe("戊寅")
  })

  test("일주·시주는 프레임과 무관(절대순간이 아니라 로컬 날짜·시각)", () => {
    const kst = bazi({ ...base, utcOffsetMinutes: 540 })
    const cst = bazi({ ...base, utcOffsetMinutes: 480 })
    expect(kst.day).toEqual(cst.day)
    expect(kst.hour).toEqual(cst.hour)
  })
})

describe("타임존 지정 — timezone(IANA) 또는 utcOffsetMinutes, 최소 하나", () => {
  test("둘 다 생략하면 throw(암묵 타임존 기본값 금지)", () => {
    // @ts-expect-error 타임존 지정(timezone 또는 utcOffsetMinutes)은 필수.
    expect(() => bazi({ year: 2000, month: 1, day: 1, hour: 12 })).toThrow()
  })
  test("둘 다 주면 utcOffsetMinutes 우선(수동 명시 > 자동 해석)", () => {
    // 1956 서울은 tzdata상 +510이지만, 수동 540을 같이 주면 540으로 계산돼야 한다.
    const both = bazi({ year: 1956, month: 3, day: 5, hour: 23, timezone: "Asia/Seoul", utcOffsetMinutes: 540, timeBasis: "standard" })
    const manual = bazi({ year: 1956, month: 3, day: 5, hour: 23, utcOffsetMinutes: 540, timeBasis: "standard" })
    expect(both).toEqual(manual)
    const auto = bazi({ year: 1956, month: 3, day: 5, hour: 23, timezone: "Asia/Seoul", timeBasis: "standard" })
    expect(both.month).not.toEqual(auto.month) // 이 시각은 510/540이 월주를 가른다
  })
  test("잘못된 IANA 이름은 RangeError", () => {
    expect(() => bazi({ year: 2000, month: 1, day: 1, hour: 12, timezone: "Asia/Nowhere" })).toThrow(RangeError)
    expect(() => bazi({ year: 2000, month: 1, day: 1, hour: 12, timezone: "" })).toThrow(RangeError)
  })
  test("timezone 'Asia/Seoul' = utcOffsetMinutes 540 (현대, 동일 사주)", () => {
    const byTz = bazi({ year: 2000, month: 6, day: 15, hour: 12, timezone: "Asia/Seoul", timeBasis: "standard" })
    const byOffset = bazi({ year: 2000, month: 6, day: 15, hour: 12, utcOffsetMinutes: 540, timeBasis: "standard" })
    expect(byTz).toEqual(byOffset)
  })
  test("역사 표준시 자동: 서울 1954~61은 +8:30(510분)으로 해석", () => {
    const byTz = bazi({ year: 1956, month: 4, day: 10, hour: 6, timezone: "Asia/Seoul", timeBasis: "standard" })
    const byOffset = bazi({ year: 1956, month: 4, day: 10, hour: 6, utcOffsetMinutes: 510, timeBasis: "standard" })
    expect(byTz).toEqual(byOffset)
    // (오프셋은 절기 절대순간에만 작용 — 값 자체(510)는 아래 리졸버 직접 테스트가 고정)
  })
  test("역사 오프셋이 실제로 사주를 가른다 — 1956-03-05 23:00 서울(경칩 경계)", () => {
    const byTz = bazi({ year: 1956, month: 3, day: 5, hour: 23, timezone: "Asia/Seoul", timeBasis: "standard" })
    expect(byTz.month).toEqual({ stem: "辛", branch: "卯" }) // +8:30(510) 정답 — 경칩 지남
    const naive = bazi({ year: 1956, month: 3, day: 5, hour: 23, utcOffsetMinutes: 540, timeBasis: "standard" })
    expect(naive.month).toEqual({ stem: "庚", branch: "寅" }) // KST=540으로 잘못 넣으면 월주가 다르다
  })
  test("서머타임 자동: 서울 1988-07은 +10시간(600분)으로 해석", () => {
    const byTz = bazi({ year: 1988, month: 7, day: 1, hour: 12, timezone: "Asia/Seoul", timeBasis: "standard" })
    const byOffset = bazi({ year: 1988, month: 7, day: 1, hour: 12, utcOffsetMinutes: 600, timeBasis: "standard" })
    expect(byTz).toEqual(byOffset)
  })
  test("resolveUtcOffsetMinutes 직접 호출 — 서울·뉴욕 알려진 값", () => {
    expect(resolveUtcOffsetMinutes("Asia/Seoul", 2000, 6, 1, 12, 0)).toBe(540)
    expect(resolveUtcOffsetMinutes("Asia/Seoul", 1954, 6, 1, 12, 0)).toBe(510)
    expect(resolveUtcOffsetMinutes("Asia/Seoul", 1988, 7, 1, 12, 0)).toBe(600)
    expect(resolveUtcOffsetMinutes("America/New_York", 2000, 1, 15, 12, 0)).toBe(-300) // EST
    expect(resolveUtcOffsetMinutes("America/New_York", 2000, 7, 15, 12, 0)).toBe(-240) // EDT
  })
})
