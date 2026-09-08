/**
 * 시트(팩트 기반) 테스트 — baziSheet(개인 원국+분석) · compatSheet(궁합).
 * 렌즈 매핑·차원 고정·present-only·점수부재를 확인한다.
 */
import { describe, test, expect } from "vitest"
import { bazi } from "../src/bazi.js"
import { baziSheet, formatBaziSheet } from "../src/bazi/bazisheet.js"
import { compatSheet, formatCompatSheet } from "../src/compat/compatsheet.js"
import type { CompatSubject } from "../src/compat/types.js"

const A: CompatSubject = {
  bazi: bazi({ year: 1992, month: 8, day: 4, hour: 1, minute: 55, longitude: 127, utcOffsetMinutes: 540, gender: "male" }),
  gender: "male",
}
const B: CompatSubject = {
  bazi: bazi({ year: 1994, month: 3, day: 15, hour: 14, minute: 20, longitude: 127, utcOffsetMinutes: 540, gender: "female" }),
  gender: "female",
}

describe("baziSheet (개인 원국+분석)", () => {
  const s = baziSheet(A)

  test("원국+분석을 담는다(간지·일간·강약·용신·격국·공망)", () => {
    expect(s.schemaVersion).toBe("bazi-sheet")
    expect(s.pillars.map((p) => p.ganzhi)).toEqual(["壬申", "丁未", "壬子", "辛丑"])
    expect(s.dayMaster.glyph).toBe("壬")
    expect(s.analysis.strength.byRule.some((r) => r.rule === "抑扶")).toBe(true)
    expect(s.analysis.yongsin.eokbu.favorable.length).toBeGreaterThan(0)
    expect(s.analysis.void.length).toBeGreaterThan(0)
  })

  test("formatBaziSheet은 한자 한 줄 요약", () => {
    const line = formatBaziSheet(s, "대상A")
    expect(line).toContain("【대상A】")
    expect(line).toContain("壬申 丁未 壬子 辛丑")
    expect(line).toContain("일간 壬水")
  })
})

describe("compatSheet (궁합)", () => {
  const cs = compatSheet(A, B)

  test("렌즈는 항상 3개(合/生/沖) 고정 순서", () => {
    expect(cs.lenses.map((g) => g.lens)).toEqual(["合", "生", "沖"])
  })

  test("관계 12종이 정확히 한 렌즈씩(차원 고정)", () => {
    const ids = cs.lenses.flatMap((g) => g.facts.map((f) => f.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(12)
    expect(cs.lenses.find((g) => g.lens === "生")!.facts.map((f) => f.id)).toEqual(["element_complement"])
    expect(cs.lenses.find((g) => g.lens === "沖")!.facts.map((f) => f.id)).toContain("branch_hyung")
    expect(cs.lenses.find((g) => g.lens === "合")!.facts.map((f) => f.id)).toContain("branch_yukhap")
  })

  test("lenses는 facts 를 묶은 뷰 — 전체 fact 수와 일치", () => {
    const lensFacts = cs.lenses.reduce((n, g) => n + g.facts.length, 0)
    expect(lensFacts).toBe(cs.facts.length)
    for (const g of cs.lenses) {
      expect(g.activeCount).toBe(g.facts.filter((f) => f.present).length)
      expect(g.edgeTotal).toBe(g.facts.reduce((n, f) => n + f.count, 0))
    }
  })

  test("종합 점수 필드는 없다(사실추출만)", () => {
    expect(JSON.stringify(cs)).not.toMatch(/"score"|"rating"|점수/i)
  })

  test("formatCompatSheet은 3렌즈를 한자로 낸다", () => {
    const txt = formatCompatSheet(cs)
    expect(txt).toContain("合(끌림·정)")
    expect(txt).toContain("生(보완·상생)")
    expect(txt).toContain("沖(관계온도)")
  })
})
