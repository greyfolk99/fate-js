/**
 * 팩트시트(FactSheet) — 궁합 라벨링/증류 파이프라인의 **사실추출** 산출물.
 *
 * 두 사람의 원국 요약(natal-2)과 교차 관계(compatTable)를 하나로 묶어,
 * 관계 3렌즈(合·生·沖)로 조직한다. **점수는 매기지 않는다** — 점수는
 * 하류 LLM(teacher)이 매기고 ML(student)이 증류한다. 이건 그 입력이 되는
 * 정형 사실 문서다.
 *
 * 설계 원칙:
 *  - 한자 native(GLM 프롬프트가 한자 기반) + 안정 키(ML 피처 컬럼).
 *  - 렌즈는 **관계(12종)+오행보완**이 만든다. 신살·납음·궁위·십성교차는
 *    보조(auxiliary)로, 잘게 쪼갠 정밀판단이 아니라 rationale 재료로 둔다.
 *  - 관계가 없어도 facts 차원은 고정(compatTable이 present:false로 채움).
 *    텍스트 렌더는 present 만 노출한다.
 */

import { natal2 } from "../chart/natal2.js"
import type { Natal2 } from "../chart/natal2.js"
import { compatTable } from "./compat-table.js"
import type { CompatFact, CompatSubject } from "./types.js"
import type { Judgment } from "./judgments-types.js"

export const FACTSHEET_SCHEMA_VERSION = "factsheet-v1"

/** 관계 3렌즈(만나보살 확정): 合=끌림·정, 生=보완·상생, 沖=관계온도(방향X). */
export type Lens = "合" | "生" | "沖"

/** compat fact id → 렌즈 매핑. 관계 12종+오행보완만 렌즈를 만든다. */
const FACT_LENS: Record<string, Lens> = {
  // 合(끌림·정) — 서로 당기고 정드는가
  stem_hap: "合",
  branch_yukhap: "合",
  branch_samhap: "合",
  branch_banghap: "合",
  hidden_amhap: "合",
  // 生(보완·상생) — 서로 살리고 채우는가
  element_complement: "生",
  // 沖(관계온도) — 잔잔↔격정, 좋고나쁨 아님
  stem_clash: "沖",
  branch_clash: "沖",
  branch_hae: "沖",
  branch_pa: "沖",
  branch_wonjin: "沖",
  branch_hyung: "沖",
}

/** 한 사람의 원국 사실 요약 — 관계 판단(특히 生 보완)에 필요한 맥락만 추린다. */
export interface FactSheetPerson {
  /** 사주 4기둥 간지. 예: ["壬申","丁未","壬子","辛丑"]. */
  pillars: string[]
  dayMaster: { glyph: string; element: string; yinyang: string }
  /** 신강신약(유파별). 예: [{rule:"抑扶",result:"身強"}]. */
  strength: { rule: string; result: string }[]
  /** 억부 용신. 채워야 할/덜어야 할 오행. */
  yongsin: { favorable: string[]; unfavorable: string[]; johuNeeded: string[] }
  /** 오행 분포(지장간 포함) — 보완 판단의 근거. */
  elementDistribution: Record<string, number>
  /** 십성 분포(천간 기준). */
  tenGodDistribution: Record<string, number>
  /** 격국 후보. */
  gyeokguk: { basedOn: string; basis: string }[]
  /** 공망. */
  void: string[]
  /** 특수신살 코드(원국 자체). */
  specialSinsal: string[]
}

/** 한 렌즈에 묶인 교차 관계들. */
export interface LensGroup {
  lens: Lens
  /** 이 렌즈에 속하는 관계 facts 전체(차원 고정 — present:false 포함). */
  facts: CompatFact[]
  /** 성립한(present) 관계 수 합. */
  activeCount: number
  /** 성립한 엣지 총수. */
  edgeTotal: number
}

/**
 * 팩트시트 — 라벨링/증류 입력.
 * 점수 없음. 사실만. 소비자(GLM 프롬프트/ML 인풋)가 그대로 읽는다.
 */
export interface FactSheet {
  schemaVersion: string
  policyVersion: string
  subject: FactSheetPerson
  candidate: FactSheetPerson
  /** 관계 3렌즈. 항상 3개(合/生/沖) 고정 순서. */
  lenses: LensGroup[]
  /** 보조 명리판단 — rationale 재료(잘게 쓰지 않음). */
  auxiliary: {
    /** 납음 겉궁합(년주). */
    nayinOuter: Judgment
    /** 겉궁합·속궁합 분류. */
    palace: Judgment
    /** 십성 교차 읽기(서로가 서로에게 무슨 십성인가) + 배우자성 공급. */
    tenGodCross: {
      candidateToSubject: Judgment
      subjectToCandidate: Judgment
      spouseStarForSubject: Judgment
      spouseStarForCandidate: Judgment
    }
    /** 교차 신살(present 만). */
    sinsal: { candidateForSubject: Judgment[]; subjectForCandidate: Judgment[] }
  }
}

const LENS_ORDER: Lens[] = ["合", "生", "沖"]

/** compat 엣지의 오행 enum(영문) → 한자. */
const ELEMENT_HANJA: Record<string, string> = {
  wood: "木", fire: "火", earth: "土", metal: "金", water: "水",
}

/** natal-2 → 원국 요약. */
function summarize(n: Natal2): FactSheetPerson {
  return {
    pillars: n.pillars.map((p) => p.ganzhi),
    dayMaster: n.dayMaster,
    strength: n.analysis.strength.byRule,
    yongsin: {
      favorable: n.analysis.yongsin.eokbu.favorable,
      unfavorable: n.analysis.yongsin.eokbu.unfavorable,
      johuNeeded: n.analysis.yongsin.johu.needed,
    },
    elementDistribution: n.elementDistribution.withHidden,
    tenGodDistribution: n.tenGodDistribution,
    gyeokguk: n.analysis.gyeokguk.candidates,
    void: n.analysis.void,
    specialSinsal: n.specialSinsal.map((s) => s.code),
  }
}

/**
 * 두 사람의 사주로 팩트시트를 만든다.
 *
 * 원국 요약(natal-2) 두 벌 + 교차 관계(compatTable)를 3렌즈로 조직한다.
 * 종합 점수는 만들지 않는다.
 */
export function factSheet(
  subject: CompatSubject,
  candidate: CompatSubject,
): FactSheet {
  const sN = natal2(subject)
  const cN = natal2(candidate)
  const table = compatTable(subject, candidate)

  const lenses: LensGroup[] = LENS_ORDER.map((lens) => {
    const facts = table.facts.filter((f) => FACT_LENS[f.id] === lens)
    return {
      lens,
      facts,
      activeCount: facts.filter((f) => f.present).length,
      edgeTotal: facts.reduce((n, f) => n + f.count, 0),
    }
  })

  const j = table.judgments
  return {
    schemaVersion: FACTSHEET_SCHEMA_VERSION,
    policyVersion: sN.policyVersion,
    subject: summarize(sN),
    candidate: summarize(cN),
    lenses,
    auxiliary: {
      nayinOuter: j.nayin.outerReading,
      palace: j.palace,
      tenGodCross: {
        candidateToSubject: j.tenGod.candidateToSubject,
        subjectToCandidate: j.tenGod.subjectToCandidate,
        spouseStarForSubject: j.tenGod.spouseStarForSubject,
        spouseStarForCandidate: j.tenGod.spouseStarForCandidate,
      },
      sinsal: {
        candidateForSubject: j.sinsal.candidateForSubject.filter((s) => s.present),
        subjectForCandidate: j.sinsal.subjectForCandidate.filter((s) => s.present),
      },
    },
  }
}

/** 한 사람 요약을 한자 한 줄로. */
function personLine(tag: string, p: FactSheetPerson): string {
  const el = Object.entries(p.elementDistribution)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k}${n}`)
    .join(" ")
  const str = p.strength.map((s) => `${s.rule}:${s.result}`).join("/")
  const gg = p.gyeokguk.map((g) => `${g.basedOn}(${g.basis})`).join(",") || "—"
  const vd = p.void.join("") || "—"
  return (
    `【${tag}】 ${p.pillars.join(" ")} · 일간 ${p.dayMaster.glyph}${p.dayMaster.element}` +
    ` · 강약 ${str || "—"} · 용신 ${p.yongsin.favorable.join("") || "—"}` +
    ` · 오행 ${el} · 격국 ${gg} · 공망 ${vd}`
  )
}

/**
 * 팩트시트를 GLM 프롬프트용 한자 텍스트 블록으로 렌더한다.
 * 성립한 관계·신살만 노출한다(차원 고정은 구조체가 담당).
 */
export function formatFactSheet(fs: FactSheet): string {
  const lines: string[] = []
  lines.push(personLine("대상A", fs.subject))
  lines.push(personLine("대상B", fs.candidate))

  const lensName: Record<Lens, string> = {
    合: "合(끌림·정)",
    生: "生(보완·상생)",
    沖: "沖(관계온도)",
  }
  for (const g of fs.lenses) {
    const active = g.facts.filter((f) => f.present)
    if (active.length === 0) {
      lines.push(`【${lensName[g.lens]}】 (없음)`)
      continue
    }
    const parts = active.map((f) => {
      const label = f.label.replace(/\([^)]*\)/g, "") // 한글 라벨만
      // 삼합·방합의 化오행은 엣지에 실린다 — 성립 국(局)들을 모아 표기.
      const els = [...new Set(f.edges.map((e) => e.element).filter(Boolean))]
        .map((e) => ELEMENT_HANJA[e as string] ?? e)
      const suffix = els.length ? `(${els.join("")})` : ""
      return `${label}${f.count}${suffix}`
    })
    lines.push(`【${lensName[g.lens]}】 ${parts.join(" · ")}`)
  }

  const aux: string[] = []
  const nayin = fs.auxiliary.nayinOuter
  if (nayin.present) aux.push(`납음겉궁합:${nayin.category}`)
  if (fs.auxiliary.palace.present) aux.push(`겉속궁합:${fs.auxiliary.palace.category}`)
  const s2 = fs.auxiliary.sinsal.candidateForSubject.map((s) => s.label.replace(/\([^)]*\)/g, ""))
  const s1 = fs.auxiliary.sinsal.subjectForCandidate.map((s) => s.label.replace(/\([^)]*\)/g, ""))
  if (s2.length) aux.push(`신살(B→A):${s2.join("·")}`)
  if (s1.length) aux.push(`신살(A→B):${s1.join("·")}`)
  if (aux.length) lines.push(`【보조】 ${aux.join(" · ")}`)

  return lines.join("\n")
}
