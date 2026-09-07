/**
 * UTC 캐노니컬 시간 프레임 테스트 (2026-09 재설계).
 * - 절기(월·연) = 출생 절대순간(UTC) vs 절기 UTC. 입력 로컬시각을 utcOffsetMinutes로 UTC 변환.
 * - 시주 = 로컬 진태양시. 일주 = 로컬 civil 날짜. (절기는 진태양시·일주와 프레임 분리.)
 */
import { describe, test, expect } from "vitest"
import { baziTable } from "../src/bazi-table.js"
import type { BaziTable } from "../src/types.js"

const p = (c: BaziTable) =>
  `${c.year.stem}${c.year.branch} ${c.month.stem}${c.month.branch} ${c.day.stem}${c.day.branch} ` +
  `${c.hour ? c.hour.stem + c.hour.branch : "—"}`

describe("hjseo 원판(진태양시 KST 기본)", () => {
  test("1992-08-04 01:55 KST → 壬申 丁未 壬子 辛丑", () => {
    const c = baziTable({ year: 1992, month: 8, day: 4, hour: 1, minute: 55 })
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
    const c = baziTable({ ...base, utcOffsetMinutes: 540 })
    expect(c.year.stem + c.year.branch).toBe("甲辰")
    expect(c.month.stem + c.month.branch).toBe("丁丑")
  })

  test("CST(+480)는 입춘 後 = 乙巳 戊寅 (같은 civil시각, 다른 프레임)", () => {
    const c = baziTable({ ...base, utcOffsetMinutes: 480 })
    expect(c.year.stem + c.year.branch).toBe("乙巳")
    expect(c.month.stem + c.month.branch).toBe("戊寅")
  })

  test("일주·시주는 프레임과 무관(절대순간이 아니라 로컬 날짜·시각)", () => {
    const kst = baziTable({ ...base, utcOffsetMinutes: 540 })
    const cst = baziTable({ ...base, utcOffsetMinutes: 480 })
    expect(kst.day).toEqual(cst.day)
    expect(kst.hour).toEqual(cst.hour)
  })
})

describe("timezone(IANA) 미구현 가드", () => {
  test("timezone만 주고 utcOffsetMinutes 없으면 throw(조용히 무시 금지)", () => {
    expect(() =>
      baziTable({ year: 2000, month: 1, day: 1, hour: 12, timezone: "Asia/Seoul" }),
    ).toThrow()
  })
  test("utcOffsetMinutes와 함께면 통과", () => {
    expect(() =>
      baziTable({ year: 2000, month: 1, day: 1, hour: 12, timezone: "Asia/Seoul", utcOffsetMinutes: 540 }),
    ).not.toThrow()
  })
})
