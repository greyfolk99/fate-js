/**
 * 1인 원국(原局) FactSheet — 사주 여덟 글자에서 결정론으로 나오는 명리
 * 요소를 전부 구조화해 뽑는다. 해석 문장(prose)이 아니라 사실(fact)만 담아
 * 뒤에 LLM 라벨·궁합(compatSheet) 재료로 쓴다.
 *
 * 1단계: 기둥별 십성·지장간·십이운성·십이신살·납음·공망·오행분포·
 *        원국 내부 관계(합충형파해)·원국 신살(길흉신).
 * 2단계(예정): 신강신약·격국·용신·대운.
 */

import {
  STEM_ELEMENTS,
  BRANCH_ELEMENTS,
  STEM_YINYANG,
  STEM_INDEX,
  BRANCH_INDEX,
  BRANCHES,
  HIDDEN_STEMS,
  STEM_COMBINATIONS,
  BRANCH_LIUHE,
  BRANCH_CLASH,
  BRANCH_HARM,
} from "../constants.js"
import type { STEMS, ELEMENTS as ELEMENTS_T } from "../constants.js"
import type { Bazi } from "../types.js"
import {
  STEM_CLASH,
  BRANCH_PA,
  BRANCH_WONJIN,
  BRANCH_SAMHAP,
  BRANCH_BANGHAP,
  BRANCH_HYUNG,
} from "../compat/constants.js"
import {
  CHEONEUL_BY_STEM,
  MUNCHANG_BY_STEM,
  HONGYEOM_BY_STEM,
  YANGIN_BY_STEM,
  BAEKHO_PILLARS,
  GWAEGANG_PILLARS,
  GWIMUN_PAIRS,
} from "../compat/judgments-constants.js"
import { cells } from "../compat/rules.js"
import { tenGod, tenGodDistribution, nayinOf } from "../compat/judgments.js"
import type { TenGod, TenGodCount } from "../compat/judgments-types.js"
import type { CompatSubject, PillarName, Polarity } from "../compat/types.js"
import { twelveStage, twelveSinsal } from "./constants.js"
import { analyzeNatal } from "./analysis.js"
import type { NatalAnalysis } from "./analysis.js"

type Stem = typeof STEMS[number]
type Branch = typeof BRANCHES[number]
type Element = typeof ELEMENTS_T[number]

export const BAZIANALYSIS_SCHEMA_VERSION = "bazi-analysis"

// ── 출력 타입 ───────────────────────────────────────────────────────

export interface HiddenStemInfo {
  glyph: Stem
  element: Element
  yinyang: "yang" | "yin"
  tenGod: TenGod
  /** 정기(正氣)=주기 · 중기(中氣) · 여기(餘氣). */
  role: string
}

export interface NatalStem {
  glyph: Stem
  element: Element
  yinyang: "yang" | "yin"
  /** 일간(자신)은 null. */
  tenGod: TenGod | null
}

export interface NatalBranch {
  glyph: Branch
  element: Element
  yinyang: "yang" | "yin"
  /** 지지 본기(주기) 기준 십성. */
  tenGod: TenGod
  hiddenStems: HiddenStemInfo[]
  /** 십이운성(장생~양). */
  twelveStage: string
  /** 십이신살 — 년지 기준. */
  sinsalFromYear: string
  /** 십이신살 — 일지 기준. */
  sinsalFromDay: string
  /** 공망(空亡) 여부. */
  isVoid: boolean
}

export interface NatalPillar {
  name: PillarName
  stem: NatalStem
  branch: NatalBranch
  ganzhi: string
  nayin: { name: string; element: Element } | null
}

export interface ElementCount {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}

export interface NatalRelation {
  id: string
  label: string
  polarity: Polarity
  pillars: PillarName[]
  glyphs: string[]
  element?: Element
}

export interface BaziSinsal {
  id: string
  label: string
  present: boolean
  pillars: PillarName[]
  basis: string
}

export interface BaziAnalysis {
  schemaVersion: string
  bazi: Bazi
  gender?: "male" | "female"
  dayMaster: { glyph: Stem; element: Element; yinyang: "yang" | "yin" }
  pillars: NatalPillar[]
  voidBranches: Branch[]
  tenGodDistribution: TenGodCount
  elementDistribution: {
    /** 천간 4 + 지지 본기 4 (시 미상이면 각 3). */
    simple: ElementCount
    /** 지장간 전부를 각 1로 가중. */
    withHidden: ElementCount
  }
  sinsal: BaziSinsal[]
  internalRelations: NatalRelation[]
  /** 2단계 — 신강신약·격국·용신(사실 시트, 점수·최종판정 없음). */
  analysis: NatalAnalysis
  policy: Record<string, string>
}

// ── 헬퍼 ────────────────────────────────────────────────────────────

function branchYinYang(b: Branch): "yang" | "yin" {
  return BRANCH_INDEX[b] % 2 === 0 ? "yang" : "yin"
}

function emptyElementCount(): ElementCount {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
}

/** 지장간 배열 → 역할 라벨(정기·중기·여기). 첫 원소가 주기(정기). */
function hiddenRole(count: number, idx: number): string {
  if (count === 1) return "정기(正氣)"
  if (count === 2) return idx === 0 ? "정기(正氣)" : "여기(餘氣)"
  // 3개: 정기·중기·여기.
  return ["정기(正氣)", "중기(中氣)", "여기(餘氣)"][idx]!
}

/** 순중공망(旬中空亡) — 일주 기준 공망 2지. */
function voidBranchesOf(bazi: Bazi): Branch[] {
  const si = STEM_INDEX[bazi.day.stem]
  const bi = BRANCH_INDEX[bazi.day.branch]
  const base = (bi - si + 12) % 12
  return [
    BRANCHES[(base + 10) % 12]!,
    BRANCHES[(base + 11) % 12]!,
  ]
}

// ── 원국 신살(길흉신) ───────────────────────────────────────────────

/** 일간 기준 단일/복수 지지 신살 — 원국 어느 기둥에 있는지. */
function stemSinsal(
  id: string,
  label: string,
  targets: readonly Branch[],
  bazi: Bazi,
  basis: string,
): BaziSinsal {
  const pillars: PillarName[] = []
  for (const c of cells(bazi)) {
    if (targets.includes(c.branch)) pillars.push(c.name)
  }
  return { id, label, present: pillars.length > 0, pillars, basis }
}

/** 특정 간지(주) 자체가 신살(백호·괴강)인지 — 원국 각 기둥. */
function pillarSinsal(
  id: string,
  label: string,
  set: ReadonlySet<string>,
  bazi: Bazi,
): BaziSinsal {
  const pillars: PillarName[] = []
  for (const c of cells(bazi)) {
    if (set.has(c.stem + c.branch)) pillars.push(c.name)
  }
  return { id, label, present: pillars.length > 0, pillars, basis: "간지(주) 자체" }
}

/** 원국 내 귀문관살 — 두 지지가 귀문 쌍을 이루는가. */
function gwimunSinsal(bazi: Bazi): BaziSinsal {
  const cs = cells(bazi)
  const pillars = new Set<PillarName>()
  for (let i = 0; i < cs.length; i++) {
    for (let j = i + 1; j < cs.length; j++) {
      const paired = GWIMUN_PAIRS.some(
        (s) => s.has(cs[i]!.branch) && s.has(cs[j]!.branch),
      )
      if (paired) {
        pillars.add(cs[i]!.name)
        pillars.add(cs[j]!.name)
      }
    }
  }
  return {
    id: "gwimun",
    label: "귀문관살(鬼門關殺)",
    present: pillars.size > 0,
    pillars: [...pillars],
    basis: "원국 내 지지 쌍",
  }
}

function baziSinsal(bazi: Bazi): BaziSinsal[] {
  const dm = bazi.day.stem
  // 양인살은 양간(甲丙戊庚壬)일 때만 판정(다수설). 음간 일간은 미인정 →
  // 참조할 지지 없이 present:false. (음인陰刃 소수설 값은 미적용.)
  const yanginTargets: readonly Branch[] =
    STEM_YINYANG[dm] === "yang" ? [YANGIN_BY_STEM[dm]] : []
  return [
    stemSinsal("cheoneul", "천을귀인(天乙貴人)", CHEONEUL_BY_STEM[dm], bazi, "일간 기준"),
    stemSinsal("munchang", "문창귀인(文昌貴人)", [MUNCHANG_BY_STEM[dm]], bazi, "일간 기준"),
    stemSinsal("hongyeom", "홍염살(紅艶殺)", [HONGYEOM_BY_STEM[dm]], bazi, "일간 기준"),
    stemSinsal("yangin", "양인살(羊刃)", yanginTargets, bazi, "일간 기준(양간 정설 — 음간 미포함)"),
    pillarSinsal("baekho", "백호살(白虎大殺)", BAEKHO_PILLARS, bazi),
    pillarSinsal("gwaegang", "괴강살(魁罡)", GWAEGANG_PILLARS, bazi),
    gwimunSinsal(bazi),
  ]
}

// ── 원국 내부 관계(합충형파해) ──────────────────────────────────────

function pairedInSets<T>(
  sets: ReadonlyArray<ReadonlySet<T>>,
  x: T,
  y: T,
): boolean {
  if (x === y) return false
  return sets.some((s) => s.has(x) && s.has(y))
}

/** 형(刑) 쌍(자형 포함) → 명칭 룩업. */
const HYUNG_PAIRS: Map<string, string> = (() => {
  const m = new Map<string, string>()
  for (const rule of BRANCH_HYUNG) {
    const b = rule.branches
    for (let i = 0; i < b.length; i++) {
      for (let j = i + 1; j < b.length; j++) {
        m.set([b[i], b[j]].sort().join(""), rule.name)
      }
    }
    if (rule.kind === "jahyung" && b[0]) m.set(b[0] + b[0], rule.name)
  }
  return m
})()

function internalRelations(bazi: Bazi): NatalRelation[] {
  const cs = cells(bazi)
  const out: NatalRelation[] = []

  // 두 기둥 쌍(pairwise) 관계.
  const pairSpecs: {
    id: string; label: string; polarity: Polarity
    accessor: "stem" | "branch"; sets: ReadonlyArray<ReadonlySet<string>>
  }[] = [
    { id: "stem_hap", label: "천간합(天干合)", polarity: "harmony", accessor: "stem", sets: STEM_COMBINATIONS },
    { id: "stem_clash", label: "천간충(天干沖)", polarity: "clash", accessor: "stem", sets: STEM_CLASH },
    { id: "branch_yukhap", label: "지지 육합(六合)", polarity: "harmony", accessor: "branch", sets: BRANCH_LIUHE },
    { id: "branch_clash", label: "지지충(六沖)", polarity: "clash", accessor: "branch", sets: BRANCH_CLASH },
    { id: "branch_hae", label: "지지해(六害)", polarity: "clash", accessor: "branch", sets: BRANCH_HARM },
    { id: "branch_pa", label: "지지파(六破)", polarity: "clash", accessor: "branch", sets: BRANCH_PA },
    { id: "branch_wonjin", label: "원진(怨嗔)", polarity: "clash", accessor: "branch", sets: BRANCH_WONJIN },
  ]

  for (let i = 0; i < cs.length; i++) {
    for (let j = i + 1; j < cs.length; j++) {
      const a = cs[i]!, b = cs[j]!
      for (const spec of pairSpecs) {
        const ga = spec.accessor === "stem" ? a.stem : a.branch
        const gb = spec.accessor === "stem" ? b.stem : b.branch
        if (pairedInSets(spec.sets, ga, gb)) {
          out.push({
            id: spec.id, label: spec.label, polarity: spec.polarity,
            pillars: [a.name, b.name], glyphs: [ga, gb],
          })
        }
      }
      // 형(刑).
      const hy = HYUNG_PAIRS.get([a.branch, b.branch].sort().join(""))
      if (hy) {
        out.push({
          id: "branch_hyung", label: `형(刑)·${hy}`, polarity: "clash",
          pillars: [a.name, b.name], glyphs: [a.branch, b.branch],
        })
      }
    }
  }

  // 국(局) 관계 — 삼합·방합. 왕지 포함 2종 이상이면 성립(3종=완성, 2종=반합).
  for (const [groups, id, label] of [
    [BRANCH_SAMHAP, "branch_samhap", "삼합(三合)"],
    [BRANCH_BANGHAP, "branch_banghap", "방합(方合)"],
  ] as const) {
    for (const g of groups) {
      const memberCells = cs.filter((c) => g.branches.includes(c.branch))
      const distinct = new Set(memberCells.map((c) => c.branch))
      if (distinct.size < 2 || !distinct.has(g.king)) continue
      out.push({
        id: distinct.size >= 3 ? id : `${id}_ban`,
        label: distinct.size >= 3 ? label : `${label} 반합(半合)`,
        polarity: "harmony",
        pillars: memberCells.map((c) => c.name),
        glyphs: [...distinct],
        element: g.element,
      })
    }
  }

  return out
}

// ── 오행 분포 ───────────────────────────────────────────────────────

function elementDistribution(bazi: Bazi): {
  simple: ElementCount; withHidden: ElementCount
} {
  const simple = emptyElementCount()
  const withHidden = emptyElementCount()
  for (const c of cells(bazi)) {
    simple[STEM_ELEMENTS[c.stem]]++
    simple[BRANCH_ELEMENTS[c.branch]]++
    withHidden[STEM_ELEMENTS[c.stem]]++
    for (const hs of HIDDEN_STEMS[c.branch]) withHidden[STEM_ELEMENTS[hs]]++
  }
  return { simple, withHidden }
}

// ── 메인 ────────────────────────────────────────────────────────────

/**
 * 사주 한 벌의 1인 원국 FactSheet 를 만든다.
 */
export function analyze(subject: CompatSubject): BaziAnalysis {
  const bazi = subject.bazi
  const dm = bazi.day.stem
  const yearBranch = bazi.year.branch
  const dayBranch = bazi.day.branch
  const voids = voidBranchesOf(bazi)

  const pillars: NatalPillar[] = cells(bazi).map((c) => {
    const isDayStem = c.name === "day"
    const hidden: HiddenStemInfo[] = HIDDEN_STEMS[c.branch].map((hs, idx) => ({
      glyph: hs,
      element: STEM_ELEMENTS[hs],
      yinyang: STEM_YINYANG[hs],
      tenGod: tenGod(dm, hs),
      role: hiddenRole(HIDDEN_STEMS[c.branch].length, idx),
    }))
    const branchMain = HIDDEN_STEMS[c.branch][0]!
    return {
      name: c.name,
      stem: {
        glyph: c.stem,
        element: STEM_ELEMENTS[c.stem],
        yinyang: STEM_YINYANG[c.stem],
        tenGod: isDayStem ? null : tenGod(dm, c.stem),
      },
      branch: {
        glyph: c.branch,
        element: BRANCH_ELEMENTS[c.branch],
        yinyang: branchYinYang(c.branch),
        tenGod: tenGod(dm, branchMain),
        hiddenStems: hidden,
        twelveStage: twelveStage(dm, c.branch),
        sinsalFromYear: twelveSinsal(yearBranch, c.branch),
        sinsalFromDay: twelveSinsal(dayBranch, c.branch),
        isVoid: voids.includes(c.branch),
      },
      ganzhi: c.stem + c.branch,
      nayin: nayinOf(c.stem, c.branch),
    }
  })

  return {
    schemaVersion: BAZIANALYSIS_SCHEMA_VERSION,
    bazi,
    ...(subject.gender ? { gender: subject.gender } : {}),
    dayMaster: {
      glyph: dm,
      element: STEM_ELEMENTS[dm],
      yinyang: STEM_YINYANG[dm],
    },
    pillars,
    voidBranches: voids,
    tenGodDistribution: tenGodDistribution(bazi),
    elementDistribution: elementDistribution(bazi),
    sinsal: baziSinsal(bazi),
    internalRelations: internalRelations(bazi),
    analysis: analyzeNatal(bazi),
    policy: {
      화토동법: "戊·己는 丙·丁과 같은 십이운성(다수설)",
      십이신살기준: "년지·일지 병기(sinsalFromYear·sinsalFromDay)",
      양인: "양간(甲丙戊庚壬) 정설 — 음간은 미포함",
      공망: "일주 순중공망(旬中空亡)",
      지장간가중: "withHidden은 지장간 전부 각 1로 집계",
      신강신약: "득령·득지·득세 사실만 — 점수·최종판정 없음(다수설 참고라벨)",
      격국: "월지 투출 우선, 없으면 월령 본기 — 단정 없이 후보만",
      용신: "억부(참고판정 기준)+조후(계절 한난 개략) 후보만",
    },
  }
}
