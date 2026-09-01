import { describe, it, expect } from "vitest"
import {
  STEMS,
  BRANCHES,
  ELEMENTS,
  STEM_INDEX,
  BRANCH_INDEX,
  ELEMENT_INDEX,
  STEM_ELEMENTS,
  BRANCH_ELEMENTS,
  HIDDEN_STEMS,
  STEM_COMBINATIONS,
  BRANCH_LIUHE,
  BRANCH_CLASH,
  BRANCH_HARM,
  GENERATES,
  CONTROLS,
  CONTROLLED_BY,
} from "../src/constants.js"

describe("STEMS", () => {
  it("has 10 elements", () => {
    expect(STEMS).toHaveLength(10)
  })

  it("starts with 甲 and ends with 癸", () => {
    expect(STEMS[0]).toBe("甲")
    expect(STEMS[9]).toBe("癸")
  })
})

describe("BRANCHES", () => {
  it("has 12 elements", () => {
    expect(BRANCHES).toHaveLength(12)
  })

  it("starts with 子 and ends with 亥", () => {
    expect(BRANCHES[0]).toBe("子")
    expect(BRANCHES[11]).toBe("亥")
  })
})

describe("ELEMENTS", () => {
  it("has 5 elements", () => {
    expect(ELEMENTS).toHaveLength(5)
  })

  it("contains wood fire earth metal water in order", () => {
    expect(ELEMENTS).toEqual(["wood", "fire", "earth", "metal", "water"])
  })
})

describe("STEM_INDEX", () => {
  it("甲 === 0", () => {
    expect(STEM_INDEX["甲"]).toBe(0)
  })

  it("癸 === 9", () => {
    expect(STEM_INDEX["癸"]).toBe(9)
  })

  it("maps all 10 stems", () => {
    expect(Object.keys(STEM_INDEX)).toHaveLength(10)
  })
})

describe("BRANCH_INDEX", () => {
  it("子 === 0", () => {
    expect(BRANCH_INDEX["子"]).toBe(0)
  })

  it("亥 === 11", () => {
    expect(BRANCH_INDEX["亥"]).toBe(11)
  })

  it("maps all 12 branches", () => {
    expect(Object.keys(BRANCH_INDEX)).toHaveLength(12)
  })
})

describe("ELEMENT_INDEX", () => {
  it("wood === 0", () => {
    expect(ELEMENT_INDEX["wood"]).toBe(0)
  })

  it("water === 4", () => {
    expect(ELEMENT_INDEX["water"]).toBe(4)
  })
})

describe("STEM_ELEMENTS", () => {
  it("甲 is wood", () => {
    expect(STEM_ELEMENTS["甲"]).toBe("wood")
  })

  it("丙 is fire", () => {
    expect(STEM_ELEMENTS["丙"]).toBe("fire")
  })

  it("壬 is water", () => {
    expect(STEM_ELEMENTS["壬"]).toBe("water")
  })

  it("covers all 10 stems", () => {
    expect(Object.keys(STEM_ELEMENTS)).toHaveLength(10)
  })
})

describe("BRANCH_ELEMENTS", () => {
  it("子 is water", () => {
    expect(BRANCH_ELEMENTS["子"]).toBe("water")
  })

  it("寅 is wood", () => {
    expect(BRANCH_ELEMENTS["寅"]).toBe("wood")
  })

  it("午 is fire", () => {
    expect(BRANCH_ELEMENTS["午"]).toBe("fire")
  })

  it("covers all 12 branches", () => {
    expect(Object.keys(BRANCH_ELEMENTS)).toHaveLength(12)
  })
})

describe("HIDDEN_STEMS", () => {
  it("子 contains 癸", () => {
    expect(HIDDEN_STEMS["子"]).toContain("癸")
  })

  it("子 has exactly 1 hidden stem", () => {
    expect(HIDDEN_STEMS["子"]).toHaveLength(1)
  })

  it("丑 has 3 hidden stems (己 癸 辛)", () => {
    expect(HIDDEN_STEMS["丑"]).toHaveLength(3)
    expect(HIDDEN_STEMS["丑"]).toContain("己")
    expect(HIDDEN_STEMS["丑"]).toContain("癸")
    expect(HIDDEN_STEMS["丑"]).toContain("辛")
  })

  it("covers all 12 branches", () => {
    expect(Object.keys(HIDDEN_STEMS)).toHaveLength(12)
  })
})

describe("STEM_COMBINATIONS", () => {
  it("has 5 pairs", () => {
    expect(STEM_COMBINATIONS).toHaveLength(5)
  })

  it("contains 甲-己 pair", () => {
    const found = STEM_COMBINATIONS.some(
      (s) => s.has("甲") && s.has("己"),
    )
    expect(found).toBe(true)
  })

  it("contains 戊-癸 pair", () => {
    const found = STEM_COMBINATIONS.some(
      (s) => s.has("戊") && s.has("癸"),
    )
    expect(found).toBe(true)
  })
})

describe("BRANCH_LIUHE", () => {
  it("has 6 pairs", () => {
    expect(BRANCH_LIUHE).toHaveLength(6)
  })

  it("contains 子-丑 pair", () => {
    const found = BRANCH_LIUHE.some((s) => s.has("子") && s.has("丑"))
    expect(found).toBe(true)
  })
})

describe("BRANCH_CLASH", () => {
  it("has 6 pairs", () => {
    expect(BRANCH_CLASH).toHaveLength(6)
  })

  it("contains 子-午 clash", () => {
    const found = BRANCH_CLASH.some((s) => s.has("子") && s.has("午"))
    expect(found).toBe(true)
  })

  it("contains 巳-亥 clash", () => {
    const found = BRANCH_CLASH.some((s) => s.has("巳") && s.has("亥"))
    expect(found).toBe(true)
  })
})

describe("BRANCH_HARM", () => {
  it("has 6 pairs", () => {
    expect(BRANCH_HARM).toHaveLength(6)
  })

  it("contains 子-未 harm", () => {
    const found = BRANCH_HARM.some((s) => s.has("子") && s.has("未"))
    expect(found).toBe(true)
  })
})

describe("GENERATES (상생)", () => {
  it("wood generates fire", () => {
    expect(GENERATES["wood"]).toBe("fire")
  })

  it("fire generates earth", () => {
    expect(GENERATES["fire"]).toBe("earth")
  })

  it("earth generates metal", () => {
    expect(GENERATES["earth"]).toBe("metal")
  })

  it("metal generates water", () => {
    expect(GENERATES["metal"]).toBe("water")
  })

  it("water generates wood", () => {
    expect(GENERATES["water"]).toBe("wood")
  })
})

describe("CONTROLS (상극)", () => {
  it("wood controls earth", () => {
    expect(CONTROLS["wood"]).toBe("earth")
  })

  it("fire controls metal", () => {
    expect(CONTROLS["fire"]).toBe("metal")
  })

  it("covers all 5 elements", () => {
    expect(Object.keys(CONTROLS)).toHaveLength(5)
  })
})

describe("CONTROLLED_BY (피극)", () => {
  it("earth is controlled by wood", () => {
    expect(CONTROLLED_BY["earth"]).toBe("wood")
  })

  it("metal is controlled by fire", () => {
    expect(CONTROLLED_BY["metal"]).toBe("fire")
  })

  it("is the inverse of CONTROLS", () => {
    for (const [controller, controlled] of Object.entries(CONTROLS)) {
      expect(CONTROLLED_BY[controlled as keyof typeof CONTROLLED_BY]).toBe(controller)
    }
  })
})
