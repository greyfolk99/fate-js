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
    // 명리적으로 쌍 개수는 위치별 조합 아티팩트라 강도와 무관 → 存在+궁위만 준다.
    // (【보조】의 궁위 집계 '和1沖0'은 위치 신호라 예외 — 렌즈 라인만 검사.)
    const lensLines = formatCompatSheet(cs)
      .split("\n")
      .filter((l) => !l.startsWith("【보조】"))
      .join("\n")
    expect(lensLines).toContain("暗合")
    expect(lensLines).not.toMatch(/合\d|沖\d|刑\d|怨嗔\d|害\d|破\d/) // 관계명 뒤 숫자 금지
  })

  test("합·충 엣지는 궁위를 그대로 찍는다 — [A日子-B日丑] 표기", () => {
    const txt = formatCompatSheet(cs)
    const pillarHanja = { year: "年", month: "月", day: "日", hour: "時" } as const
    for (const f of cs.facts) {
      if (!f.present || f.id === "element_complement") continue
      const e = f.edges[0]!
      const expected = `A${pillarHanja[e.subject.pillar]}${e.subject.glyph}-B${pillarHanja[e.object.pillar]}${e.object.glyph}`
      expect(txt).toContain(expected)
    }
  })

  test("삼합·방합은 국별 관여 글자 종수(三字/二字)를 부기한다", () => {
    const txt = formatCompatSheet(cs)
    for (const id of ["branch_samhap", "branch_banghap"]) {
      const f = cs.facts.find((x) => x.id === id)!
      if (!f.present) continue
      expect(txt).toMatch(/[三方]合\([木火土金水]·[三二]字\)\[/)
    }
  })

  test("형은 성립한 형 종류(한자 코드)를 부기한다 — 삼형계는 三字/二字까지", () => {
    const f = cs.facts.find((x) => x.id === "branch_hyung")!
    if (!f.present) return
    const kinds = f.detail?.hyung as string[]
    const printed = formatCompatSheet(cs).match(/刑\(([^[]*)\)\[/)?.[1] ?? ""
    // 종류 이름은 전부 나오고, 삼형계(無恩·持勢)에는 글자수 부기가 붙는다.
    for (const k of kinds) expect(printed).toContain(k)
    for (const k of kinds) {
      if (k === "無恩之刑" || k === "持勢之刑") expect(printed).toMatch(new RegExp(`${k}\\((三|二)字\\)`))
    }
  })

  test("【교차】에 일간 생극비(相生·相剋·比和) 사실이 찍힌다", () => {
    const txt = formatCompatSheet(cs)
    expect(txt).toMatch(/【교차】 日干:(比和\(.·.\)|[AB].[生剋][AB].)/)
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

describe("조후용신표(JOHU_TABLE) — 궁통보감 edition-lock 수렴본", () => {
  test("120셀 완전(10일간×12월지), main 비어있지 않음", async () => {
    const { JOHU_TABLE } = await import("../src/bazi/johu-table.js")
    const stems = Object.keys(JOHU_TABLE)
    expect(stems.length).toBe(10)
    for (const s of stems) {
      const months = Object.keys(JOHU_TABLE[s as keyof typeof JOHU_TABLE])
      expect(months.length).toBe(12)
      for (const m of months) {
        expect(JOHU_TABLE[s as keyof typeof JOHU_TABLE][m as never].main.length).toBeGreaterThan(0)
      }
    }
  })

  test("원문 검증 스팟체크 — 甲子=丁·丙子=壬·庚子=丁·癸子=丙(해동)", async () => {
    const { JOHU_TABLE } = await import("../src/bazi/johu-table.js")
    expect(JOHU_TABLE["甲"]["子"].main).toEqual(["丁"])
    expect(JOHU_TABLE["丙"]["子"].main).toEqual(["壬"])
    expect(JOHU_TABLE["庚"]["子"].main).toEqual(["丁"])
    expect(JOHU_TABLE["癸"]["子"].main).toEqual(["丙"])
  })

  test("baziSheet.johu 가 표를 반영하고 formatBaziSheet에 조후가 나온다", () => {
    const s = baziSheet(A) // 壬일간 未월
    expect(s.analysis.yongsin.johu.main.length).toBeGreaterThan(0)
    expect(formatBaziSheet(s, "A")).toContain("조후 ")
  })
})

describe("compatSheet 합충 병존 — 같은 글자의 합·충 동시 성립(사실만)", () => {
  const cs = compatSheet(A, B)
  const ov = cs.judgments.hapChungOverlap

  test("병존 judgment 가 존재하고 present 는 boolean", () => {
    expect(typeof ov.present).toBe("boolean")
    expect(ov.statement).toBeTruthy()
  })

  test("present 면 detail.cells 에 글자별 합·충 내역이 있다", () => {
    if (ov.present) {
      const cells = ov.detail!.cells as string[]
      expect(cells.length).toBeGreaterThan(0)
      // "A時丑(六合+六沖…)" 형태 — 엣지 궁위 표기와 같은 문법, 합군과 충군이 + 로 병기
      expect(cells[0]).toMatch(/^[AB][年月日時].\(.+\+.+\)$/)
    }
  })

  test("해소 판정(길흉·해소됨)은 내리지 않는다", () => {
    expect(ov.statement).not.toMatch(/해소됨|무력화|길|흉/)
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

  test("공급은 등급 사실 — 커버 오행·투출 구분이 detail 에 있다", () => {
    // present 면 covered 가 비어있지 않고, revealed ⊆ covered (투출은 커버의 부분집합).
    if (ys.eokbuToSubject.present) {
      const d = ys.eokbuToSubject.detail as { covered: string[]; revealed: string[] }
      expect(d.covered.length).toBeGreaterThan(0)
      for (const r of d.revealed) expect(d.covered).toContain(r)
    }
    // 조후는 투출(透)/암장(藏) 구분이 category 로 나온다.
    if (ys.johuToSubject.present) {
      expect(["투출", "암장"]).toContain(ys.johuToSubject.category)
    }
  })

  test("生 렌즈에 用神 공급 신호가 사실로 붙는다", () => {
    const line = formatCompatSheet(cs).split("\n").find((l) => l.includes("生(보완"))!
    // 用神 공급이 성립하면 用神A←B / 用神B←A 표기가 나온다(성립 시에만).
    if (ys.eokbuToSubject.present) expect(line).toContain("用神A←B")
  })

  test("해로움(거울면) — 기신 유입은 희신 공급과 오행이 겹치지 않는다", () => {
    for (const k of ["harmToSubject", "harmToCandidate"] as const) {
      const d = ys[k].detail as { unfavorable: string[]; covered: string[]; revealed: string[]; keuk: string[] }
      // revealed ⊆ covered ⊆ unfavorable, 그리고 기신은 희신과 서로소.
      for (const r of d.revealed) expect(d.covered).toContain(r)
      for (const c of d.covered) expect(d.unfavorable).toContain(c)
      const fav = (ys[k === "harmToSubject" ? "eokbuToSubject" : "eokbuToCandidate"].detail as { favorable: string[] }).favorable
      for (const u of d.unfavorable) expect(fav).not.toContain(u)
      // 剋 표기는 "천간剋오행" 형식.
      for (const s of d.keuk) expect(s).toMatch(/^[甲乙丙丁戊己庚辛壬癸]剋[木火土金水]$/)
    }
  })

  test("忌神·剋用神 줄은 기본 꺼짐, includeHarm 옵션에서만 찍힌다", () => {
    // 발화율 99%라 기본 시트에서 v2.1 보완 일관성을 91→65%로 무너뜨림(실측) — 옵션 분리.
    const off = formatCompatSheet(cs).split("\n").find((l) => l.includes("生(보완"))!
    const on = formatCompatSheet(cs, { includeHarm: true }).split("\n").find((l) => l.includes("生(보완"))!
    for (const tag of ["忌神A←B", "忌神B←A", "剋用神A←B", "剋用神B←A"]) {
      expect(off).not.toContain(tag)
      expect(on).toContain(tag)
    }
  })
})

describe("배우자성(配星) 등급 사실 — 유무가 아니라 투/장·궁 안착·正偏", () => {
  const cs = compatSheet(A, B)
  const tg = cs.judgments.tenGod

  test("등급 detail 불변식: 투·장 기둥은 서로소이고 공급 기둥의 부분집합", () => {
    for (const k of ["spouseStarForSubject", "spouseStarForCandidate"] as const) {
      const d = tg[k].detail as {
        supplyPillars: string[]; revealedPillars: string[]; hiddenPillars: string[]
        daySeat: string | null; jeong: number; pyeon: number
      }
      if (!tg[k].present) continue
      for (const p of d.revealedPillars) expect(d.supplyPillars).toContain(p)
      for (const p of d.hiddenPillars) expect(d.supplyPillars).toContain(p)
      for (const p of d.revealedPillars) expect(d.hiddenPillars).not.toContain(p)
      // 배우자궁 안착이면 상대 일주가 공급 기둥에 있어야 한다.
      if (d.daySeat) expect(d.supplyPillars).toContain("day")
      expect(d.jeong + d.pyeon).toBeGreaterThan(0)
    }
  })

  test("시트에 配星 등급 표기가 항상 찍힌다(없으면 無)", () => {
    const line = formatCompatSheet(cs).split("\n").find((l) => l.includes("生(보완"))!
    expect(line).toMatch(/配星A←B\((無|[^)]*正\d+偏\d+[^)]*)\)/)
    expect(line).toMatch(/配星B←A\((無|[^)]*正\d+偏\d+[^)]*)\)/)
  })

  test("調候 표기 — 主 투/장에 더해 次佐(佐)가 유실되지 않는다", () => {
    const ys = cs.judgments.yongsinSupply
    const line = formatCompatSheet(cs).split("\n").find((l) => l.includes("生(보완"))!
    for (const [jd, tag] of [[ys.johuToSubject, "調候A←B"], [ys.johuToCandidate, "調候B←A"]] as const) {
      const d = jd.detail as { mainRevealed: string[]; mainHidden: string[]; subHit: string[] }
      // 主가 없으면 無 토큰은 유지하고(앵커 호환), 次佐는 덧붙는다.
      if (!jd.present && d.subHit.length) {
        expect(line).toContain(`${tag}(無·佐${d.subHit.join("")})`)
      }
      if (!jd.present && !d.subHit.length) expect(line).toContain(`${tag}(無)`)
    }
  })
})

describe("쟁합·투합(jaenghap) — 같은 종류 합 다중 성립(사실만)", () => {
  const cs = compatSheet(A, B)

  test("쟁합 판정은 렌즈 엣지 집계와 일치한다", () => {
    const counts = new Map<string, number>()
    for (const f of cs.facts) {
      if (!f.present || !["stem_hap", "branch_yukhap"].includes(f.id)) continue
      const name = f.label.match(/\(([^)]+)\)/)?.[1] ?? f.label
      for (const e of f.edges) {
        for (const [who, end] of [["A", e.subject], ["B", e.object]] as const) {
          const k = `${who}:${end.pillar}:${end.glyph}:${name}`
          counts.set(k, (counts.get(k) ?? 0) + 1)
        }
      }
    }
    const expected = [...counts.values()].filter((n) => n >= 2).length
    const cells = (cs.judgments.jaenghap.detail?.cells as string[]) ?? []
    expect(cells.length).toBe(expected)
    expect(cs.judgments.jaenghap.present).toBe(expected > 0)
    for (const c of cells) expect(c).toMatch(/^[AB][年月日時].\(.+×\d+\)$/)
  })

  test("쟁합 성립 시 【쟁합】 줄이 찍힌다", () => {
    const txt = formatCompatSheet(cs)
    expect(txt.includes("【쟁합】")).toBe(cs.judgments.jaenghap.present)
  })
})
