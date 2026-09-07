import { describe, it, expect } from "vitest"
import { compatTable, tenGod, nayinOf } from "../src/compat/index.js"
import type { BaziTable, Pillar, Stem, Branch } from "../src/index.js"
import type { CompatSubject } from "../src/compat/index.js"

// ── 조립기 (compat.test.ts 와 동일 패턴) ────────────────────────────

const p = (stem: string, branch: string): Pillar => ({
  stem: stem as Stem,
  branch: branch as Branch,
})

function bz(
  year: [string, string],
  month: [string, string],
  day: [string, string],
  hour: [string, string] | null = null,
): BaziTable {
  return {
    year: p(...year),
    month: p(...month),
    day: p(...day),
    hour: hour ? p(...hour) : null,
  }
}

// ── 십성(十星) 판정 ─────────────────────────────────────────────────

describe("십성 tenGod", () => {
  it("甲 일간 기준 10천간 전부 정확", () => {
    expect(tenGod("甲", "甲")).toBe("비견") // 같은 오행·같은 음양
    expect(tenGod("甲", "乙")).toBe("겁재") // 같은 오행·다른 음양
    expect(tenGod("甲", "丙")).toBe("식신") // 내가 생·같은 음양
    expect(tenGod("甲", "丁")).toBe("상관") // 내가 생·다른 음양
    expect(tenGod("甲", "戊")).toBe("편재") // 내가 극·같은 음양
    expect(tenGod("甲", "己")).toBe("정재") // 내가 극·다른 음양(스펙 앵커)
    expect(tenGod("甲", "庚")).toBe("편관") // 나를 극·같은 음양
    expect(tenGod("甲", "辛")).toBe("정관") // 나를 극·다른 음양
    expect(tenGod("甲", "壬")).toBe("편인") // 나를 생·같은 음양
    expect(tenGod("甲", "癸")).toBe("정인") // 나를 생·다른 음양
  })

  it("음간 일간(己)도 대칭적으로 판정", () => {
    // 己=earth/yin. 甲=wood/yang: wood 가 earth 극 → 나를 극, 음양 다름 → 정관.
    expect(tenGod("己", "甲")).toBe("정관")
    // 乙=wood/yin: 나를 극, 음양 같음 → 편관.
    expect(tenGod("己", "乙")).toBe("편관")
  })
})

describe("십성 분포·교차", () => {
  it("분포는 일간 자신을 빼고 나머지 천간을 집계", () => {
    const a = bz(["丙", "寅"], ["戊", "戌"], ["甲", "子"], ["庚", "午"])
    const t = compatTable({ bazi: a }, { bazi: a })
    const d = t.judgments.tenGod.subjectDistribution
    // 일간 甲 제외: 丙=식신, 戊=편재, 庚=편관.
    expect(d["식신"]).toBe(1)
    expect(d["편재"]).toBe(1)
    expect(d["편관"]).toBe(1)
    expect(d["비견"]).toBe(0)
  })

  it("교차 읽기: 후보 일간이 주체에게 무슨 십성인가", () => {
    const subj = bz(["戊", "戌"], ["戊", "戌"], ["甲", "子"]) // 주체 일간 甲
    const cand = bz(["戊", "戌"], ["戊", "戌"], ["己", "丑"]) // 후보 일간 己
    const t = compatTable({ bazi: subj }, { bazi: cand })
    expect(t.judgments.tenGod.candidateToSubject.category).toBe("정재")
  })
})

describe("배우자성(재/관) 공급", () => {
  it("남명 주체의 배우자성=재성을 후보가 공급하면 present", () => {
    // 주체 일간 甲(남). 재성=戊(편재)/己(정재). 후보에 己 천간 → 공급.
    const subj: CompatSubject = {
      bazi: bz(["戊", "戌"], ["戊", "戌"], ["甲", "子"]),
      gender: "male",
    }
    const cand: CompatSubject = { bazi: bz(["己", "丑"], ["戊", "戌"], ["乙", "亥"]) }
    const t = compatTable(subj, cand)
    expect(t.judgments.tenGod.spouseStarForSubject.present).toBe(true)
  })

  it("gender 미제공이면 배우자성 판정 보류(present:false)", () => {
    const subj: CompatSubject = { bazi: bz(["戊", "戌"], ["戊", "戌"], ["甲", "子"]) }
    const cand: CompatSubject = { bazi: bz(["己", "丑"], ["戊", "戌"], ["己", "丑"]) }
    const t = compatTable(subj, cand)
    expect(t.judgments.tenGod.spouseStarForSubject.present).toBe(false)
  })
})

// ── 납음(納音) ──────────────────────────────────────────────────────

describe("납음 nayin", () => {
  it("알려진 앵커 간지", () => {
    expect(nayinOf("甲", "子")).toEqual({ name: "海中金", element: "metal" })
    expect(nayinOf("丙", "寅")).toEqual({ name: "爐中火", element: "fire" })
    expect(nayinOf("戊", "辰")).toEqual({ name: "大林木", element: "wood" })
    expect(nayinOf("壬", "申")).toEqual({ name: "劍鋒金", element: "metal" })
    expect(nayinOf("癸", "亥")).toEqual({ name: "大海水", element: "water" })
  })

  it("겉궁합: 년주 납음오행 상생/상극/비화", () => {
    // 주체 년주 甲子=海中金(metal), 후보 년주 甲子=海中金(metal) → 비화.
    const same = compatTable(
      { bazi: bz(["甲", "子"], ["戊", "戌"], ["戊", "戌"]) },
      { bazi: bz(["甲", "子"], ["戊", "戌"], ["戊", "戌"]) },
    )
    expect(same.judgments.nayin.outerReading.category).toBe("same")

    // 주체 甲子=metal, 후보 戊辰=大林木(wood): metal 이 wood 극 → 상극.
    const ctrl = compatTable(
      { bazi: bz(["甲", "子"], ["戊", "戌"], ["戊", "戌"]) },
      { bazi: bz(["戊", "辰"], ["戊", "戌"], ["戊", "戌"]) },
    )
    expect(ctrl.judgments.nayin.outerReading.category).toBe("controls")

    // 주체 甲子=metal, 후보 丙子=澗下水(water): metal 이 water 생 → 상생.
    const gen = compatTable(
      { bazi: bz(["甲", "子"], ["戊", "戌"], ["戊", "戌"]) },
      { bazi: bz(["丙", "子"], ["戊", "戌"], ["戊", "戌"]) },
    )
    expect(gen.judgments.nayin.outerReading.category).toBe("generates")
  })
})

// ── 신살(神殺) ──────────────────────────────────────────────────────

describe("신살 sinsal (교차)", () => {
  it("도화살: 주체 일지 午(寅午戌) → 도화 卯를 후보가 지님", () => {
    const subj = bz(["戊", "戌"], ["戊", "戌"], ["甲", "午"]) // 일지 午
    const cand = bz(["戊", "戌"], ["戊", "戌"], ["乙", "卯"]) // 일지 卯
    const t = compatTable({ bazi: subj }, { bazi: cand })
    const dohwa = t.judgments.sinsal.candidateForSubject.find(
      (j) => j.id === "dohwa",
    )!
    expect(dohwa.present).toBe(true)
    expect(dohwa.detail?.target).toBe("卯")
  })

  it("역마살: 주체 일지 子(申子辰) → 역마 寅을 후보가 지님", () => {
    const subj = bz(["戊", "戌"], ["戊", "戌"], ["甲", "子"])
    const cand = bz(["戊", "戌"], ["戊", "戌"], ["丙", "寅"])
    const t = compatTable({ bazi: subj }, { bazi: cand })
    const yeokma = t.judgments.sinsal.candidateForSubject.find(
      (j) => j.id === "yeokma",
    )!
    expect(yeokma.present).toBe(true)
    expect(yeokma.detail?.target).toBe("寅")
  })

  it("천을귀인: 주체 일간 甲 → 丑·未를 후보가 지님", () => {
    const subj = bz(["戊", "戌"], ["戊", "戌"], ["甲", "子"])
    const cand = bz(["戊", "戌"], ["戊", "未"], ["乙", "丑"])
    const t = compatTable({ bazi: subj }, { bazi: cand })
    const cheoneul = t.judgments.sinsal.candidateForSubject.find(
      (j) => j.id === "cheoneul",
    )!
    expect(cheoneul.present).toBe(true)
    // 후보 월지 未, 일지 丑 둘 다 걸린다.
    expect((cheoneul.detail?.pillars as string[]).length).toBeGreaterThanOrEqual(2)
  })

  it("백호살: 후보 일주가 甲辰이면 백호 성립", () => {
    const subj = bz(["戊", "戌"], ["戊", "戌"], ["丙", "子"])
    const cand = bz(["戊", "戌"], ["戊", "戌"], ["甲", "辰"])
    const t = compatTable({ bazi: subj }, { bazi: cand })
    const baekho = t.judgments.sinsal.candidateForSubject.find(
      (j) => j.id === "baekho",
    )!
    expect(baekho.present).toBe(true)
  })

  it("괴강살: 후보 일주 庚辰 성립, 甲辰(이설)은 미성립", () => {
    // 필러 기둥은 신살에 안 걸리는 유효 간지(丙寅·丁卯)로.
    const subj = bz(["丙", "寅"], ["丁", "卯"], ["丙", "子"])
    const gyaegang = compatTable(
      { bazi: subj },
      { bazi: bz(["丙", "寅"], ["丁", "卯"], ["庚", "辰"]) },
    ).judgments.sinsal.candidateForSubject.find((j) => j.id === "gwaegang")!
    expect(gyaegang.present).toBe(true)

    // 甲辰은 정설 괴강 4주에 없음(백호로는 걸리므로 괴강 판정만 확인).
    const notGyaegang = compatTable(
      { bazi: subj },
      { bazi: bz(["丙", "寅"], ["丁", "卯"], ["甲", "辰"]) },
    ).judgments.sinsal.candidateForSubject.find((j) => j.id === "gwaegang")!
    expect(notGyaegang.present).toBe(false)
  })

  it("귀문관살: 주체 일지 子 ↔ 후보 酉 성립(子未 원진과 구분)", () => {
    const subj = bz(["戊", "戌"], ["戊", "戌"], ["甲", "子"])
    const cand = bz(["戊", "戌"], ["戊", "戌"], ["辛", "酉"])
    const t = compatTable({ bazi: subj }, { bazi: cand })
    const gwimun = t.judgments.sinsal.candidateForSubject.find(
      (j) => j.id === "gwimun",
    )!
    expect(gwimun.present).toBe(true)
  })
})

// ── 겉궁합/속궁합 분류 ──────────────────────────────────────────────

describe("겉궁합·속궁합 palace", () => {
  it("연주 충돌(겉)·일지 화합(속)을 위치별로 집계", () => {
    // 연주끼리 충(子↔午), 일지끼리 육합(子↔丑).
    const subj = bz(["戊", "子"], ["戊", "戌"], ["甲", "子"])
    const cand = bz(["戊", "午"], ["戊", "戌"], ["乙", "丑"])
    const t = compatTable({ bazi: subj }, { bazi: cand })
    const palace = t.judgments.palace
    expect(palace.detail?.outerClash as number).toBeGreaterThanOrEqual(1)
    expect(palace.detail?.innerHarmony as number).toBeGreaterThanOrEqual(1)
  })
})

// ── 스키마 불변식 ───────────────────────────────────────────────────

describe("judgments 스키마", () => {
  it("compatTable 에 judgments 섹션이 붙고 12관계와 분리된다", () => {
    const t = compatTable(
      { bazi: bz(["甲", "子"], ["甲", "子"], ["甲", "子"]) },
      { bazi: bz(["己", "丑"], ["己", "丑"], ["己", "丑"]) },
    )
    expect(t.judgments).toBeDefined()
    expect(t.judgments.tenGod).toBeDefined()
    expect(t.judgments.nayin).toBeDefined()
    expect(t.judgments.sinsal).toBeDefined()
    expect(t.judgments.palace).toBeDefined()
    // facts(12관계)는 그대로 유지.
    expect(t.facts.length).toBeGreaterThanOrEqual(12)
  })

  it("십성 분포는 10종 컬럼을 항상 채운다(차원 고정)", () => {
    const t = compatTable(
      { bazi: bz(["甲", "子"], ["甲", "子"], ["甲", "子"]) },
      { bazi: bz(["甲", "子"], ["甲", "子"], ["甲", "子"]) },
    )
    const keys = Object.keys(t.judgments.tenGod.subjectDistribution)
    for (const g of [
      "비견", "겁재", "식신", "상관", "편재",
      "정재", "편관", "정관", "편인", "정인",
    ]) {
      expect(keys).toContain(g)
    }
  })
})
