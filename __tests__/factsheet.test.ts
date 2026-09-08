/**
 * 팩트시트(사실추출) 조립 테스트.
 * 원국 요약 두 벌 + 교차 관계 3렌즈(合/生/沖)를 점수 없이 담는지,
 * 렌즈 매핑·present-only 렌더·차원 고정이 지켜지는지 확인한다.
 */
import { describe, test, expect } from "vitest"
import { baziTable } from "../src/bazi-table.js"
import { factSheet, formatFactSheet } from "../src/compat/factsheet.js"
import type { CompatSubject } from "../src/compat/types.js"

const subj: CompatSubject = {
  bazi: baziTable({ year: 1992, month: 8, day: 4, hour: 1, minute: 55, longitude: 127, utcOffsetMinutes: 540, gender: "male" }),
  gender: "male",
}
const cand: CompatSubject = {
  bazi: baziTable({ year: 1994, month: 3, day: 15, hour: 14, minute: 20, longitude: 127, utcOffsetMinutes: 540, gender: "female" }),
  gender: "female",
}

describe("factSheet 조립", () => {
  const fs = factSheet(subj, cand)

  test("두 사람 원국 요약을 담는다(간지·일간·강약·용신·오행·격국·공망)", () => {
    expect(fs.subject.pillars).toEqual(["壬申", "丁未", "壬子", "辛丑"])
    expect(fs.subject.dayMaster.glyph).toBe("壬")
    expect(fs.subject.strength.some((s) => s.rule === "抑扶")).toBe(true)
    expect(fs.subject.yongsin.favorable.length).toBeGreaterThan(0)
    expect(Object.values(fs.subject.elementDistribution).some((n) => n > 0)).toBe(true)
    expect(fs.candidate.pillars).toEqual(["甲戌", "丁卯", "庚子", "癸未"])
  })

  test("렌즈는 항상 3개(合/生/沖) 고정 순서", () => {
    expect(fs.lenses.map((g) => g.lens)).toEqual(["合", "生", "沖"])
  })

  test("각 fact는 정확히 한 렌즈에만 들어가고 12관계 전부 커버(차원 고정)", () => {
    const ids = fs.lenses.flatMap((g) => g.facts.map((f) => f.id))
    expect(new Set(ids).size).toBe(ids.length) // 중복 없음
    // 합족 5 + 생 1 + 충족 6 = 12
    expect(ids.length).toBe(12)
    expect(fs.lenses.find((g) => g.lens === "沖")!.facts.map((f) => f.id)).toContain("branch_hyung")
    expect(fs.lenses.find((g) => g.lens === "合")!.facts.map((f) => f.id)).toContain("branch_yukhap")
    expect(fs.lenses.find((g) => g.lens === "生")!.facts.map((f) => f.id)).toEqual(["element_complement"])
  })

  test("activeCount/edgeTotal이 present·count와 일치", () => {
    for (const g of fs.lenses) {
      expect(g.activeCount).toBe(g.facts.filter((f) => f.present).length)
      expect(g.edgeTotal).toBe(g.facts.reduce((n, f) => n + f.count, 0))
    }
  })

  test("종합 점수 필드는 없다(사실추출만)", () => {
    expect(JSON.stringify(fs)).not.toMatch(/score|점수|rating/i)
  })

  test("보조 신살은 present만 남는다", () => {
    for (const s of fs.auxiliary.sinsal.candidateForSubject) expect(s.present).toBe(true)
    for (const s of fs.auxiliary.sinsal.subjectForCandidate) expect(s.present).toBe(true)
  })

  test("formatFactSheet은 한자 원국 두 줄 + 3렌즈를 낸다", () => {
    const txt = formatFactSheet(fs)
    expect(txt).toContain("【대상A】")
    expect(txt).toContain("【대상B】")
    expect(txt).toContain("合(끌림·정)")
    expect(txt).toContain("生(보완·상생)")
    expect(txt).toContain("沖(관계온도)")
    expect(txt).toContain("壬申 丁未 壬子 辛丑")
  })
})
