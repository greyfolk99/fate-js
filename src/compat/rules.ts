import {
  STEM_COMBINATIONS,
  BRANCH_LIUHE,
  BRANCH_CLASH,
  BRANCH_HARM,
  STEM_ELEMENTS,
  BRANCH_ELEMENTS,
  HIDDEN_STEMS,
  ELEMENTS,
} from "../constants.js"
import type { STEMS, BRANCHES } from "../constants.js"
import type { BaziTable } from "../types.js"
import {
  STEM_CLASH,
  BRANCH_PA,
  BRANCH_WONJIN,
  BRANCH_SAMHAP,
  BRANCH_BANGHAP,
  BRANCH_HYUNG,
  type BranchGroup,
} from "./constants.js"
import type {
  CompatEdge,
  CompatFact,
  PillarName,
  Polarity,
} from "./types.js"

type Stem = typeof STEMS[number]
type Branch = typeof BRANCHES[number]
type Element = typeof ELEMENTS[number]

/** 궁(宮)의 한글 약칭 — 문장 렌더용. */
const PILLAR_KO: Record<PillarName, string> = {
  year: "년",
  month: "월",
  day: "일",
  hour: "시",
}

/** 오행 한글 표기. */
const ELEMENT_KO: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
}

interface Cell {
  name: PillarName
  stem: Stem
  branch: Branch
}

/** 사주 4주(시 미상이면 3주)를 순회 가능한 셀 배열로 편다. */
export function cells(bazi: BaziTable): Cell[] {
  const out: Cell[] = [
    { name: "year", stem: bazi.year.stem, branch: bazi.year.branch },
    { name: "month", stem: bazi.month.stem, branch: bazi.month.branch },
    { name: "day", stem: bazi.day.stem, branch: bazi.day.branch },
  ]
  if (bazi.hour) {
    out.push({ name: "hour", stem: bazi.hour.stem, branch: bazi.hour.branch })
  }
  return out
}

/** x, y 가 sets 중 한 집합에 함께 들어가는가 (서로 다른 두 글자일 때만). */
function pairedInSets<T>(
  sets: ReadonlyArray<ReadonlySet<T>>,
  x: T,
  y: T,
): boolean {
  if (x === y) return false
  return sets.some((s) => s.has(x) && s.has(y))
}

/** 관여한 모든 기둥(양쪽 사주)의 합집합. */
function pillarsOf(edges: CompatEdge[]): PillarName[] {
  const set = new Set<PillarName>()
  for (const e of edges) {
    set.add(e.subject.pillar)
    set.add(e.object.pillar)
  }
  return [...set]
}

/** 일지↔일지 엣지가 있으면 "속궁합" 문구를 덧붙인다. */
function palaceNote(edges: CompatEdge[]): string {
  const dayDay = edges.some(
    (e) => e.subject.pillar === "day" && e.object.pillar === "day",
  )
  if (dayDay) return " 일지(배우자궁)에서 만나 속궁합에 해당한다."
  const anyDay = edges.some(
    (e) => e.subject.pillar === "day" || e.object.pillar === "day",
  )
  if (anyDay) return " 배우자궁이 관여한다."
  return ""
}

interface PairRuleSpec {
  id: string
  label: string
  polarity: Polarity
  source: string
  accessor: "stem" | "branch"
  sets: ReadonlyArray<ReadonlySet<string>>
  absent: string
}

/**
 * "두 글자 쌍" 형태의 교차 룰(육합·충·해·파·원진·천간합·천간충)을 일반화.
 * 주체 각 기둥 × 후보 각 기둥을 스캔해 성립하는 엣지를 모은다.
 */
function pairRule(
  subject: Cell[],
  candidate: Cell[],
  spec: PairRuleSpec,
): CompatFact {
  const edges: CompatEdge[] = []
  for (const s of subject) {
    for (const c of candidate) {
      const sg = spec.accessor === "stem" ? s.stem : s.branch
      const cg = spec.accessor === "stem" ? c.stem : c.branch
      if (pairedInSets(spec.sets, sg, cg)) {
        edges.push({
          subject: { glyph: sg, pillar: s.name },
          object: { glyph: cg, pillar: c.name },
        })
      }
    }
  }
  const present = edges.length > 0
  return {
    id: spec.id,
    category: spec.accessor,
    label: spec.label,
    present,
    polarity: spec.polarity,
    count: edges.length,
    edges,
    pillars: pillarsOf(edges),
    statement: present
      ? `${spec.label} ${edges.length}건.` + palaceNote(edges)
      : spec.absent,
    source: spec.source,
  }
}

// ── 개별 pairwise 룰 스펙 ──────────────────────────────────────────

const PAIR_SPECS: PairRuleSpec[] = [
  {
    id: "stem_hap",
    label: "천간합(天干合)",
    polarity: "harmony",
    source: "명리약언·자평진전(천간합)",
    accessor: "stem",
    sets: STEM_COMBINATIONS,
    absent: "천간합 없음.",
  },
  {
    id: "stem_clash",
    label: "천간충(天干沖)",
    polarity: "clash",
    source: "명리 통설(천간칠충)",
    accessor: "stem",
    sets: STEM_CLASH,
    absent: "천간충 없음.",
  },
  {
    id: "branch_yukhap",
    label: "지지 육합(六合)",
    polarity: "harmony",
    source: "협기변방서(육합)",
    accessor: "branch",
    sets: BRANCH_LIUHE,
    absent: "지지 육합 없음.",
  },
  {
    id: "branch_clash",
    label: "지지충(六沖)",
    polarity: "clash",
    source: "자평진전(육충)",
    accessor: "branch",
    sets: BRANCH_CLASH,
    absent: "지지충 없음.",
  },
  {
    id: "branch_hae",
    label: "지지해(六害)",
    polarity: "clash",
    source: "명리 통설(육해)",
    accessor: "branch",
    sets: BRANCH_HARM,
    absent: "지지해 없음.",
  },
  {
    id: "branch_pa",
    label: "지지파(六破)",
    polarity: "clash",
    source: "명리 통설(육파)",
    accessor: "branch",
    sets: BRANCH_PA,
    absent: "지지파 없음.",
  },
  {
    id: "branch_wonjin",
    label: "원진(怨嗔)",
    polarity: "clash",
    source: "궁합 통설(원진)",
    accessor: "branch",
    sets: BRANCH_WONJIN,
    absent: "원진 없음.",
  },
]

/** pairwise 교차 룰 전체 실행. */
export function pairwiseRules(subject: Cell[], candidate: Cell[]): CompatFact[] {
  return PAIR_SPECS.map((spec) => pairRule(subject, candidate, spec))
}

// ── 형(刑) — 삼형은 pairwise 로 분해, 자형은 동일 글자 쌍 ───────────

/** 형이 성립하는 지지 쌍 → 전통 명칭. key = 정렬된 두 지지. */
const HYUNG_PAIRS: Map<string, string> = (() => {
  const m = new Map<string, string>()
  for (const rule of BRANCH_HYUNG) {
    const b = rule.branches
    for (let i = 0; i < b.length; i++) {
      for (let j = i + 1; j < b.length; j++) {
        const key = [b[i], b[j]].sort().join("")
        m.set(key, rule.name)
      }
    }
    const first = b[0]
    if (rule.kind === "jahyung" && first) {
      m.set(first + first, rule.name)
    }
  }
  return m
})()

export function hyungRule(subject: Cell[], candidate: Cell[]): CompatFact {
  const edges: CompatEdge[] = []
  for (const s of subject) {
    for (const c of candidate) {
      const key = [s.branch, c.branch].sort().join("")
      if (HYUNG_PAIRS.has(key)) {
        edges.push({
          subject: { glyph: s.branch, pillar: s.name },
          object: { glyph: c.branch, pillar: c.name },
        })
      }
    }
  }
  const present = edges.length > 0
  return {
    id: "branch_hyung",
    category: "branch",
    label: "형(刑)",
    present,
    polarity: "clash",
    count: edges.length,
    edges,
    pillars: pillarsOf(edges),
    statement: present
      ? `형 ${edges.length}건.` + palaceNote(edges)
      : "형 없음.",
    source: "자평진전·삼명통회(형)",
  }
}

// ── 삼합·방합 — 두 사주 지지 풀에서 국(局) 성립 판정 ────────────────

function groupRule(
  subject: Cell[],
  candidate: Cell[],
  groups: readonly BranchGroup[],
  id: string,
  label: string,
  source: string,
): CompatFact {
  const edges: CompatEdge[] = []
  for (const g of groups) {
    const memberSet = new Set<Branch>(g.branches)
    const subjMembers = subject.filter((s) => memberSet.has(s.branch))
    const candMembers = candidate.filter((c) => memberSet.has(c.branch))
    // 궁합(교차) 국은 양쪽이 각각 기여해야 성립.
    if (subjMembers.length === 0 || candMembers.length === 0) continue
    const distinct = new Set<Branch>([
      ...subjMembers.map((s) => s.branch),
      ...candMembers.map((c) => c.branch),
    ])
    // 왕지 포함 2종 이상(반합) 또는 3종(완성)일 때만 인정.
    if (distinct.size < 2 || !distinct.has(g.king)) continue
    for (const s of subjMembers) {
      for (const c of candMembers) {
        if (s.branch === c.branch) continue
        edges.push({
          subject: { glyph: s.branch, pillar: s.name },
          object: { glyph: c.branch, pillar: c.name },
          element: g.element,
        })
      }
    }
  }
  const present = edges.length > 0
  return {
    id,
    category: "branch",
    label,
    present,
    polarity: "harmony",
    count: edges.length,
    edges,
    pillars: pillarsOf(edges),
    statement: present
      ? `${label} 성립 — 두 사주 지지가 모여 오행 국을 이룬다.` +
        palaceNote(edges)
      : `${label} 없음.`,
    source,
  }
}

export function samhapRule(subject: Cell[], candidate: Cell[]): CompatFact {
  return groupRule(
    subject,
    candidate,
    BRANCH_SAMHAP,
    "branch_samhap",
    "삼합·반합(三合)",
    "연해자평(삼합)",
  )
}

export function banghapRule(subject: Cell[], candidate: Cell[]): CompatFact {
  return groupRule(
    subject,
    candidate,
    BRANCH_BANGHAP,
    "branch_banghap",
    "방합(方合)",
    "명리 통설(방합)",
  )
}

// ── 지장간 암합(暗合) — 지지 속 천간끼리의 은밀한 합 ─────────────────

export function hiddenAmhapRule(
  subject: Cell[],
  candidate: Cell[],
): CompatFact {
  const edges: CompatEdge[] = []
  for (const s of subject) {
    for (const c of candidate) {
      for (const hs of HIDDEN_STEMS[s.branch]) {
        for (const hc of HIDDEN_STEMS[c.branch]) {
          if (pairedInSets(STEM_COMBINATIONS, hs, hc)) {
            edges.push({
              subject: { glyph: hs, pillar: s.name },
              object: { glyph: hc, pillar: c.name },
            })
          }
        }
      }
    }
  }
  const present = edges.length > 0
  return {
    id: "hidden_amhap",
    category: "hidden",
    label: "지장간 암합(暗合)",
    present,
    polarity: "harmony",
    count: edges.length,
    edges,
    pillars: pillarsOf(edges),
    statement: present
      ? `지장간 암합 ${edges.length}건 — 겉으로 드러나지 않는 은근한 합.` +
        palaceNote(edges)
      : "지장간 암합 없음.",
    source: "명리 통설(암합)",
  }
}

// ── 오행 보완 — 한쪽에 없는 오행을 상대가 지녀 채우는 관계 ───────────

function elementsPresent(cs: Cell[]): Set<Element> {
  const set = new Set<Element>()
  for (const c of cs) {
    set.add(STEM_ELEMENTS[c.stem])
    set.add(BRANCH_ELEMENTS[c.branch])
  }
  return set
}

export function elementComplementRule(
  subject: Cell[],
  candidate: Cell[],
): CompatFact {
  const subjEl = elementsPresent(subject)
  const candEl = elementsPresent(candidate)
  const subjectReceives = ELEMENTS.filter((e) => !subjEl.has(e) && candEl.has(e))
  const candidateReceives = ELEMENTS.filter(
    (e) => !candEl.has(e) && subjEl.has(e),
  )
  const present = subjectReceives.length > 0 || candidateReceives.length > 0

  const parts: string[] = []
  if (subjectReceives.length) {
    parts.push(
      `주체에 없는 ${subjectReceives.map((e) => ELEMENT_KO[e]).join("·")}을(를) 후보가 지녀 채운다`,
    )
  }
  if (candidateReceives.length) {
    parts.push(
      `후보에 없는 ${candidateReceives.map((e) => ELEMENT_KO[e]).join("·")}을(를) 주체가 지녀 채운다`,
    )
  }

  return {
    id: "element_complement",
    category: "element",
    label: "오행 보완(五行相補)",
    present,
    polarity: "harmony",
    count: subjectReceives.length + candidateReceives.length,
    edges: [],
    pillars: [],
    statement: present
      ? parts.join("; ") + "."
      : "서로 없는 오행을 채워주는 관계 없음.",
    source: "오행 상보(통설)",
    detail: {
      subjectReceives,
      candidateReceives,
    },
  }
}

// ── 정형 텍스트 렌더 — LLM 프롬프트에 그대로 넣을 블록 ───────────────

/** 엣지 하나를 `壬(일간) —관계— 丙(년간)` 형태로 렌더. */
export function renderEdge(label: string, edge: CompatEdge): string {
  const s = `${edge.subject.glyph}(${PILLAR_KO[edge.subject.pillar]})`
  const o = `${edge.object.glyph}(${PILLAR_KO[edge.object.pillar]})`
  const el = edge.element ? ` ⇒ ${ELEMENT_KO[edge.element]}` : ""
  return `${s} —${label}— ${o}${el}`
}
