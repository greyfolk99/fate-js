import { describe, it, expect } from "vitest"
import { daeun, seun, bazi } from "../src/index.js"
import jieqiData from "../src/jieqi.json" with { type: "json" }

const KST = { timezone: "Asia/Seoul" as const }

describe("daeun — 방향(양남음녀 순행)", () => {
  // 1990 = 庚午년(양간) → 남자 순행, 여자 역행
  const input1990 = { year: 1990, month: 5, day: 15, hour: 10, minute: 30, ...KST }

  it("양간 연주 + 남자 = 순행, 첫 대운은 월주 다음 60갑자", () => {
    const c = bazi(input1990) // 월주 辛巳
    const d = daeun({ ...input1990, gender: "male" })
    expect(d.forward).toBe(true)
    expect(c.month.stem).toBe("辛")
    expect(c.month.branch).toBe("巳")
    expect(d.pillars[0]!.stem).toBe("壬")
    expect(d.pillars[0]!.branch).toBe("午")
  })

  it("양간 연주 + 여자 = 역행, 첫 대운은 월주 이전 60갑자", () => {
    const d = daeun({ ...input1990, gender: "female" })
    expect(d.forward).toBe(false)
    expect(d.pillars[0]!.stem).toBe("庚")
    expect(d.pillars[0]!.branch).toBe("辰")
  })

  it("음간 연주 + 여자 = 순행 (1993 癸酉년)", () => {
    const input = { year: 1993, month: 7, day: 21, hour: 8, minute: 40, ...KST }
    const d = daeun({ ...input, gender: "female" })
    expect(d.forward).toBe(true) // 癸 = 음간 + 여자
    // 월주 己未 → 첫 대운 庚申
    expect(d.pillars[0]!.stem).toBe("庚")
    expect(d.pillars[0]!.branch).toBe("申")
  })
})

describe("daeun — 대운수(경계일 ÷ 3)", () => {
  it("절기 테이블로 독립 재계산한 값과 일치한다", () => {
    const input = { year: 1993, month: 7, day: 21, hour: 8, minute: 40, ...KST }
    const d = daeun({ ...input, gender: "female" }) // 순행 → 다음 절까지
    // 출생 UTC: 1993-07-20T23:40:00Z (KST-9)
    const birth = Date.UTC(1993, 6, 20, 23, 40, 0) / 1000
    const next = jieqiData.sec.find((s) => s > birth)!
    const expectedDays = (next - birth) / 86400
    expect(d.boundaryDays).toBeCloseTo(expectedDays, 6)
    expect(d.startAge).toBeCloseTo(expectedDays / 3, 6)
  })

  it("역행은 직전 절까지의 일수를 쓴다", () => {
    const input = { year: 1990, month: 5, day: 15, hour: 10, minute: 30, ...KST }
    const d = daeun({ ...input, gender: "female" }) // 역행
    const birth = Date.UTC(1990, 4, 15, 1, 30, 0) / 1000
    const prevArr = jieqiData.sec.filter((s) => s <= birth)
    const prev = prevArr[prevArr.length - 1]!
    expect(d.boundaryDays).toBeCloseTo((birth - prev) / 86400, 6)
  })

  it("대운 나이는 10년 간격으로 는다", () => {
    const d = daeun({ year: 1993, month: 7, day: 21, hour: 8, minute: 40, ...KST, gender: "female" })
    for (let i = 1; i < d.pillars.length; i++) {
      expect(d.pillars[i]!.startAge - d.pillars[i - 1]!.startAge).toBeCloseTo(10, 9)
    }
    expect(d.pillars).toHaveLength(10)
  })

  it("시간 미상도 동작한다(00:00 기준)", () => {
    const d = daeun({ year: 1993, month: 7, day: 21, ...KST, gender: "female" })
    expect(d.startAge).toBeGreaterThan(0)
  })
})

describe("seun — 연도별 간지", () => {
  it("1984 = 甲子 기준", () => {
    const s = seun(1984, 1)
    expect(s[0]).toEqual({ year: 1984, stem: "甲", branch: "子" })
  })

  it("2026 = 丙午", () => {
    const s = seun(2026, 1)
    expect(s[0]!.stem).toBe("丙")
    expect(s[0]!.branch).toBe("午")
  })

  it("연속 5년", () => {
    const s = seun(2026, 5)
    expect(s.map((x) => x.year)).toEqual([2026, 2027, 2028, 2029, 2030])
    expect(s[1]!.stem).toBe("丁")
    expect(s[1]!.branch).toBe("未")
  })
})
