import { describe, it, expect } from "vitest"
import { baziVectorized } from "../src/_engine.js"
import { toOrdinal, fromOrdinal } from "../src/_dateutil.js"
import { chart } from "../src/chart.js"
import { STEMS, BRANCHES } from "../src/constants.js"

// ── toOrdinal / fromOrdinal ────────────────────────────────────────────────────
describe("toOrdinal", () => {
  it("1년 1월 1일 = 1", () => {
    expect(toOrdinal(1, 1, 1)).toBe(1)
  })

  it("1900-01-31 = 693626 (Python 기준값)", () => {
    expect(toOrdinal(1900, 1, 31)).toBe(693626)
  })

  it("1970-01-01 = 719163", () => {
    expect(toOrdinal(1970, 1, 1)).toBe(719163)
  })

  it("2000-01-01 = 730120", () => {
    expect(toOrdinal(2000, 1, 1)).toBe(730120)
  })

  it("1990-08-04 = 726683", () => {
    expect(toOrdinal(1990, 8, 4)).toBe(726683)
  })

  it("1999-12-31 = 730119", () => {
    expect(toOrdinal(1999, 12, 31)).toBe(730119)
  })

  it("2004-02-29 윤년 = 731640", () => {
    expect(toOrdinal(2004, 2, 29)).toBe(731640)
  })
})

describe("fromOrdinal", () => {
  it("1 → 0001-01-01", () => {
    expect(fromOrdinal(1)).toEqual({ year: 1, month: 1, day: 1 })
  })

  it("693626 → 1900-01-31", () => {
    expect(fromOrdinal(693626)).toEqual({ year: 1900, month: 1, day: 31 })
  })

  it("730120 → 2000-01-01", () => {
    expect(fromOrdinal(730120)).toEqual({ year: 2000, month: 1, day: 1 })
  })

  it("toOrdinal ↔ fromOrdinal 왕복 검증", () => {
    const pairs = [
      [1990, 8, 4],
      [2000, 3, 15],
      [1999, 12, 31],
      [2004, 2, 29],
    ] as const
    for (const [y, m, d] of pairs) {
      const ord = toOrdinal(y, m, d)
      expect(fromOrdinal(ord)).toEqual({ year: y, month: m, day: d })
    }
  })
})

// ── baziVectorized 정답 검증 ───────────────────────────────────────────────────
// 정답은 python-bazi/_engine.py 로 계산 (numpy searchsorted 기반)
// 확인 명령:
//   cd /Users/hjseo/apps/python-bazi && python3 -c "
//   import numpy as np; from bazi._engine import _engine; from bazi._constants import STEMS, BRANCHES; ...
//   "

describe("baziVectorized — 기준일 검증", () => {
  it("1900-01-31 00:00 → 己亥 丁丑 甲辰 甲子", () => {
    // 기준일: 甲辰日. 연주는 己亥(소한 이전이라 전년 기준)
    const ord = toOrdinal(1900, 1, 31)
    const r = baziVectorized(ord, 0)
    expect(STEMS[r.year.stemIdx]).toBe("己")
    expect(BRANCHES[r.year.branchIdx]).toBe("亥")
    expect(STEMS[r.month.stemIdx]).toBe("丁")
    expect(BRANCHES[r.month.branchIdx]).toBe("丑")
    expect(STEMS[r.day.stemIdx]).toBe("甲")
    expect(BRANCHES[r.day.branchIdx]).toBe("辰")
    expect(STEMS[r.hour.stemIdx]).toBe("甲")
    expect(BRANCHES[r.hour.branchIdx]).toBe("子")
  })
})

describe("baziVectorized — 2000-01-01 12:00", () => {
  it("己卯 丙子 戊午 戊午", () => {
    const ord = toOrdinal(2000, 1, 1)
    const r = baziVectorized(ord, 12)
    expect(STEMS[r.year.stemIdx]).toBe("己")
    expect(BRANCHES[r.year.branchIdx]).toBe("卯")
    expect(STEMS[r.month.stemIdx]).toBe("丙")
    expect(BRANCHES[r.month.branchIdx]).toBe("子")
    expect(STEMS[r.day.stemIdx]).toBe("戊")
    expect(BRANCHES[r.day.branchIdx]).toBe("午")
    expect(STEMS[r.hour.stemIdx]).toBe("戊")
    expect(BRANCHES[r.hour.branchIdx]).toBe("午")
  })
})

describe("baziVectorized — 1990-08-04 03:00", () => {
  it("庚午 癸未 辛丑 庚寅", () => {
    const ord = toOrdinal(1990, 8, 4)
    const r = baziVectorized(ord, 3)
    expect(STEMS[r.year.stemIdx]).toBe("庚")
    expect(BRANCHES[r.year.branchIdx]).toBe("午")
    expect(STEMS[r.month.stemIdx]).toBe("癸")
    expect(BRANCHES[r.month.branchIdx]).toBe("未")
    expect(STEMS[r.day.stemIdx]).toBe("辛")
    expect(BRANCHES[r.day.branchIdx]).toBe("丑")
    expect(STEMS[r.hour.stemIdx]).toBe("庚")
    expect(BRANCHES[r.hour.branchIdx]).toBe("寅")
  })
})

describe("baziVectorized — 경계: 1999-12-31 23:00 (子시, 다음날 기준)", () => {
  it("己卯 丙子 丁巳 壬子", () => {
    // 23시는 子시이므로 다음 날(2000-01-01) 일간 기준으로 시간 계산
    const ord = toOrdinal(1999, 12, 31)
    const r = baziVectorized(ord, 23)
    expect(STEMS[r.year.stemIdx]).toBe("己")
    expect(BRANCHES[r.year.branchIdx]).toBe("卯")
    expect(STEMS[r.month.stemIdx]).toBe("丙")
    expect(BRANCHES[r.month.branchIdx]).toBe("子")
    expect(STEMS[r.day.stemIdx]).toBe("丁")
    expect(BRANCHES[r.day.branchIdx]).toBe("巳")
    expect(STEMS[r.hour.stemIdx]).toBe("壬")
    expect(BRANCHES[r.hour.branchIdx]).toBe("子")
  })
})

// ── chart() 래퍼 검증 ─────────────────────────────────────────────────────────
describe("chart()", () => {
  it("2000-01-01 12시 → 己卯 丙子 戊午 戊午", () => {
    const c = chart({ year: 2000, month: 1, day: 1, hour: 12 })
    expect(c.year.stem).toBe("己")
    expect(c.year.branch).toBe("卯")
    expect(c.month.stem).toBe("丙")
    expect(c.month.branch).toBe("子")
    expect(c.day.stem).toBe("戊")
    expect(c.day.branch).toBe("午")
    expect(c.hour?.stem).toBe("戊")
    expect(c.hour?.branch).toBe("午")
  })

  it("hour 미지정 시 hour 필드는 null", () => {
    const c = chart({ year: 2000, month: 1, day: 1 })
    expect(c.hour).toBeNull()
    // 연·월·일은 정상 계산
    expect(c.year.stem).toBe("己")
    expect(c.day.stem).toBe("戊")
  })
})
