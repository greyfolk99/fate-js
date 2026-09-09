import { describe, it, expect } from "vitest"
import { compatSheet } from "../src/compat/index.js"
import type { Bazi, Pillar, Stem, Branch } from "../src/index.js"
import type { CompatFact } from "../src/compat/index.js"

// ── 테스트용 사주 조립기 ────────────────────────────────────────────
// 사주 계산은 별도 테스트에서 검증되므로, 여기선 룰 로직만 보려고
// 원하는 간지를 직접 꽂아 Bazi 을 만든다.

const p = (stem: string, branch: string): Pillar => ({
  stem: stem as Stem,
  branch: branch as Branch,
})

function bz(
  year: [string, string],
  month: [string, string],
  day: [string, string],
  hour: [string, string] | null = null,
): Bazi {
  return {
    year: p(...year),
    month: p(...month),
    day: p(...day),
    hour: hour ? p(...hour) : null,
  }
}

const NEUTRAL = bz(["戊", "戌"], ["戊", "戌"], ["戊", "戌"], ["戊", "戌"])

function fact(a: Bazi, b: Bazi, id: string): CompatFact {
  const table = compatSheet({ bazi: a }, { bazi: b })
  const f = table.facts.find((x) => x.id === id)
  if (!f) throw new Error(`fact ${id} 없음`)
  return f
}

// ── 스키마 불변식 ───────────────────────────────────────────────────

describe("compatSheet 스키마", () => {
  it("관계가 없어도 모든 룰이 present:false 로 항상 포함 (차원 고정)", () => {
    const table = compatSheet({ bazi: NEUTRAL }, { bazi: NEUTRAL })
    const ids = table.facts.map((f) => f.id)
    for (const id of [
      "stem_hap",
      "stem_clash",
      "branch_yukhap",
      "branch_clash",
      "branch_hae",
      "branch_pa",
      "branch_wonjin",
      "branch_hyung",
      "branch_samhap",
      "branch_banghap",
      "hidden_amhap",
      "element_complement",
    ]) {
      expect(ids).toContain(id)
    }
  })

  it("schemaVersion 이 붙는다", () => {
    const table = compatSheet({ bazi: NEUTRAL }, { bazi: NEUTRAL })
    expect(table.schemaVersion).toBe("compat-sheet-v2")
  })

  it("종합 점수(value 같은 스칼라)를 만들지 않는다 — 관계·개수만", () => {
    const a = bz(["甲", "子"], ["甲", "子"], ["甲", "子"], ["甲", "子"])
    const b = bz(["己", "丑"], ["己", "丑"], ["己", "丑"], ["己", "丑"])
    const table = compatSheet({ bazi: a }, { bazi: b })
    for (const f of table.facts) {
      expect(f).not.toHaveProperty("value")
      expect(f.count).toBe(f.present ? f.count : 0)
      expect(f.count).toBe(f.edges.length || f.count) // edges 없는 룰은 count 별도
    }
  })

  it("성립한 엣지는 주체·후보 글자와 궁을 담는다 (정형 포맷)", () => {
    const table = compatSheet(
      { bazi: bz(["戊", "戌"], ["戊", "戌"], ["戊", "子"]) },
      { bazi: bz(["戊", "戌"], ["戊", "戌"], ["戊", "丑"]) },
    )
    const yukhap = table.facts.find((f) => f.id === "branch_yukhap")!
    expect(yukhap.edges[0]).toMatchObject({
      subject: { glyph: "子", pillar: "day" },
      object: { glyph: "丑", pillar: "day" },
    })
  })
})

// ── 천간 관계 ───────────────────────────────────────────────────────

describe("천간", () => {
  it("甲 ↔ 己 = 천간합", () => {
    const f = fact(
      bz(["戊", "戌"], ["戊", "戌"], ["甲", "戌"]),
      bz(["戊", "戌"], ["戊", "戌"], ["己", "戌"]),
      "stem_hap",
    )
    expect(f.present).toBe(true)
    expect(f.polarity).toBe("harmony")
    expect(f.pillars).toContain("day")
  })

  it("甲 ↔ 庚 = 천간충", () => {
    const f = fact(
      bz(["甲", "戌"], ["戊", "戌"], ["戊", "戌"]),
      bz(["庚", "戌"], ["戊", "戌"], ["戊", "戌"]),
      "stem_clash",
    )
    expect(f.present).toBe(true)
    expect(f.polarity).toBe("clash")
  })

  it("戊 ↔ 己 는 천간충 아님", () => {
    const f = fact(NEUTRAL, bz(["己", "戌"], ["己", "戌"], ["己", "戌"]), "stem_clash")
    expect(f.present).toBe(false)
    expect(f.count).toBe(0)
  })
})

// ── 지지 관계 ───────────────────────────────────────────────────────

describe("지지", () => {
  it("子 ↔ 丑 = 육합, 일지끼리면 속궁합 문구", () => {
    const f = fact(
      bz(["戊", "戌"], ["戊", "戌"], ["戊", "子"]),
      bz(["戊", "戌"], ["戊", "戌"], ["戊", "丑"]),
      "branch_yukhap",
    )
    expect(f.present).toBe(true)
    expect(f.pillars).toContain("day")
    expect(f.statement).toContain("속궁합")
  })

  it("子 ↔ 午 = 충", () => {
    const f = fact(
      bz(["戊", "子"], ["戊", "戌"], ["戊", "戌"]),
      bz(["戊", "午"], ["戊", "戌"], ["戊", "戌"]),
      "branch_clash",
    )
    expect(f.present).toBe(true)
    expect(f.polarity).toBe("clash")
  })

  it("子 ↔ 未 = 원진", () => {
    const f = fact(
      bz(["戊", "子"], ["戊", "戌"], ["戊", "戌"]),
      bz(["戊", "未"], ["戊", "戌"], ["戊", "戌"]),
      "branch_wonjin",
    )
    expect(f.present).toBe(true)
  })

  it("寅 ↔ 巳 = 형 (삼형 분해) — 무은지형 detail", () => {
    const f = fact(
      bz(["戊", "寅"], ["戊", "戌"], ["戊", "戌"]),
      bz(["戊", "巳"], ["戊", "戌"], ["戊", "戌"]),
      "branch_hyung",
    )
    expect(f.present).toBe(true)
    expect(f.polarity).toBe("clash")
    // 형 종류(한자 코드)가 detail 로 보존된다 — 寅巳申은 무은지형.
    expect(f.detail?.hyung).toEqual(["無恩之刑"])
  })

  it("辰 ↔ 辰 = 자형 — detail 로 무은지형과 구분", () => {
    const f = fact(
      bz(["戊", "辰"], ["甲", "寅"], ["甲", "寅"]),
      bz(["戊", "辰"], ["甲", "寅"], ["甲", "寅"]),
      "branch_hyung",
    )
    expect(f.present).toBe(true)
    // 辰辰은 자형 — 寅巳(무은지형)과 다른 코드여야 한다.
    expect(f.detail?.hyung).toEqual(["辰辰自刑"])
    expect(f.detail?.hyung).not.toContain("無恩之刑")
  })
})

// ── 국(局) ──────────────────────────────────────────────────────────

describe("삼합·방합", () => {
  it("子(주체) ↔ 辰(후보) = 반합 (왕지 子 포함)", () => {
    const f = fact(
      bz(["戊", "子"], ["甲", "寅"], ["甲", "寅"]),
      bz(["戊", "辰"], ["甲", "寅"], ["甲", "寅"]),
      "branch_samhap",
    )
    expect(f.present).toBe(true)
    expect(f.polarity).toBe("harmony")
    expect(f.edges[0]?.element).toBe("water")
  })

  it("辰(주체) ↔ 申(후보) 은 왕지(子) 없어 반합 불성립", () => {
    const f = fact(
      bz(["戊", "辰"], ["甲", "寅"], ["甲", "寅"]),
      bz(["戊", "申"], ["甲", "寅"], ["甲", "寅"]),
      "branch_samhap",
    )
    expect(f.present).toBe(false)
  })

  it("寅卯(주체) ↔ 辰(후보) = 방합 木 (왕지 卯 포함)", () => {
    const f = fact(
      bz(["戊", "寅"], ["戊", "卯"], ["甲", "午"]),
      bz(["戊", "辰"], ["甲", "午"], ["甲", "午"]),
      "branch_banghap",
    )
    expect(f.present).toBe(true)
    expect(f.edges[0]?.element).toBe("wood")
  })

  it("주체 申子辰(완성) ↔ 후보 중복 子 = 새 삼합 기여 아님(불성립)", () => {
    // 주체가 이미 申子辰 국을 갖췄고, 후보는 주체가 가진 子를 되풀이할 뿐.
    // 중복 글자는 궁합 기여가 아니므로 삼합으로 세면 안 된다.
    const f = fact(
      bz(["戊", "申"], ["戊", "子"], ["甲", "辰"]),
      bz(["戊", "子"], ["甲", "寅"], ["甲", "寅"]),
      "branch_samhap",
    )
    expect(f.present).toBe(false)
    expect(f.count).toBe(0)
  })

  it("주체 申子(반합) ↔ 후보 辰(주체에 없음) = 삼합 완성 기여", () => {
    // 후보 辰은 주체에 없는 새 국 멤버 → 진짜 완성 기여로 성립.
    const f = fact(
      bz(["戊", "申"], ["戊", "子"], ["甲", "卯"]),
      bz(["戊", "辰"], ["甲", "卯"], ["甲", "卯"]),
      "branch_samhap",
    )
    expect(f.present).toBe(true)
    expect(f.edges[0]?.element).toBe("water")
    expect(f.count).toBeGreaterThanOrEqual(1)
  })
})

// ── 지장간 암합 · 오행 보완 ─────────────────────────────────────────

describe("파생 룰", () => {
  it("子(癸) ↔ 巳(丙戊庚) = 지장간 암합 (戊癸)", () => {
    const f = fact(
      bz(["甲", "子"], ["甲", "午"], ["甲", "午"]),
      bz(["甲", "巳"], ["甲", "午"], ["甲", "午"]),
      "hidden_amhap",
    )
    expect(f.present).toBe(true)
    expect(f.category).toBe("hidden")
  })

  it("목 편중 ↔ 금·수 = 오행 보완 성립", () => {
    const woodHeavy = bz(["甲", "寅"], ["乙", "卯"], ["甲", "寅"], ["乙", "卯"])
    const metalWater = bz(["庚", "申"], ["壬", "子"], ["辛", "酉"], ["癸", "亥"])
    const f = fact(woodHeavy, metalWater, "element_complement")
    expect(f.present).toBe(true)
    expect(f.detail?.subjectReceives).toBeDefined()
  })
})
