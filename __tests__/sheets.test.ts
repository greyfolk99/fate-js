/**
 * 시트(팩트 기반) 테스트 — baziSheet(개인 원국+분석) · compatSheet(궁합).
 * 렌즈 매핑·차원 고정·present-only·점수부재를 확인한다.
 */
import { describe, test, expect } from "vitest"
import { bazi } from "../src/bazi.js"
import { baziSheet, formatBaziSheet } from "../src/bazi/bazisheet.js"
import { compatSheet, formatCompatSheet } from "../src/compat/compatsheet.js"
import { twelveStage } from "../src/bazi/constants.js"
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

  test("관계는 present(있다)로만 — 쌍 개수(count) 숫자를 붙이지 않는다", () => {
    // 명리적으로 쌍 개수는 위치별 조합 아티팩트라 강도와 무관 → 存在만 준다.
    // (【보조】의 궁위 집계 '和1沖0'은 위치 신호라 예외 — 렌즈 라인만 검사.)
    const lensLines = formatCompatSheet(cs)
      .split("\n")
      .filter((l) => !l.startsWith("【보조】"))
      .join("\n")
    expect(lensLines).toContain("暗合") // 있으면 이름만
    expect(lensLines).not.toMatch(/合\d|沖\d|刑\d|怨嗔\d|害\d|破\d/) // 관계명 뒤 숫자 금지
  })
})

describe("compatSheet 교차 판단(cross) — 사실만", () => {
  const cs = compatSheet(A, B)
  const cr = cs.judgments.cross

  test("교차 7종이 모두 존재한다", () => {
    for (const k of [
      "spouseGungStageForSubject", "spouseGungStageForCandidate",
      "voidForSubject", "voidForCandidate", "dayPillarMatch",
      "sinsalCrossForSubject", "sinsalCrossForCandidate",
    ] as const) {
      expect(cr[k]).toBeTruthy()
      expect(typeof cr[k].statement).toBe("string")
    }
  })

  test("배우자궁 십이운성 = 상대 일간을 내 일지에 놓은 운성(결정론 일치)", () => {
    // 상대(후보 B) 일간을 주체 A 일지에 놓은 십이운성과 정확히 일치해야 한다.
    expect(cr.spouseGungStageForSubject.category)
      .toBe(twelveStage(B.bazi.day.stem, A.bazi.day.branch))
    expect(cr.spouseGungStageForCandidate.category)
      .toBe(twelveStage(A.bazi.day.stem, B.bazi.day.branch))
  })

  test("일주 대조 — 동일 일주는 '동일일주'로 잡힌다", () => {
    const self = compatSheet(A, A).judgments.cross.dayPillarMatch
    expect(self.category).toBe("동일일주")
    expect(self.present).toBe(true)
    // 서로 다른 일주면 '무' 또는 부분일치
    expect(["동일일주", "천간동", "일지동", "무"]).toContain(cr.dayPillarMatch.category)
  })

  test("십이신살 교차 — 일지 신살명이 category(신살 문자열)", () => {
    expect(typeof cr.sinsalCrossForSubject.category).toBe("string")
    expect(cr.sinsalCrossForSubject.category as string).toMatch(/殺/)
    expect(cr.sinsalCrossForSubject.present).toBe(true)
  })

  test("공망 교차 present 는 boolean(적중 여부)", () => {
    expect(typeof cr.voidForSubject.present).toBe("boolean")
  })

  test("시트에 【교차】 줄이 사실로 렌더된다(점수·등급 없음)", () => {
    const txt = formatCompatSheet(cs)
    expect(txt).toContain("【교차】")
    expect(txt).toContain("배우자궁운성")
    expect(txt).not.toMatch(/score|점수|weight|가중|통속|folk/i)
  })
})

describe("compatSheet 용신 공급(yongsinSupply) — 억부용신·조후 크로스", () => {
  const cs = compatSheet(A, B)
  const ys = cs.judgments.yongsinSupply

  test("억부용신·조후 공급 4종이 존재하고 present 는 boolean", () => {
    for (const k of ["eokbuToSubject", "eokbuToCandidate", "johuToSubject", "johuToCandidate"] as const) {
      expect(typeof ys[k].present).toBe("boolean")
      expect(ys[k].statement).toBeTruthy()
    }
  })

  test("공급 판정은 상대 원국 오행 ∩ 내 억부 희신(사실)", () => {
    // present 면 detail.supplied 가 비어있지 않아야 한다(사실 일관성).
    if (ys.eokbuToSubject.present) {
      expect((ys.eokbuToSubject.detail!.supplied as string[]).length).toBeGreaterThan(0)
    }
  })

  test("生 렌즈에 用神 공급 신호가 사실로 붙는다", () => {
    const line = formatCompatSheet(cs).split("\n").find((l) => l.includes("生(보완"))!
    // 用神 공급이 성립하면 用神A←B / 用神B←A 표기가 나온다(성립 시에만).
    if (ys.eokbuToSubject.present) expect(line).toContain("用神A←B")
  })
})
