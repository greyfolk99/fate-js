import {
  cells,
  pairwiseRules,
  hyungRule,
  samhapRule,
  banghapRule,
  hiddenAmhapRule,
  elementComplementRule,
} from "./rules.js"
import { judgeCompat } from "./judgments.js"
import { yongsinSupply } from "./yongsin-supply.js"
import type { CompatSubject, CompatSheet, Lens, LensGroup } from "./types.js"

export const COMPATSHEET_SCHEMA_VERSION = "compat-sheet-v1"

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

const LENS_ORDER: Lens[] = ["合", "生", "沖"]

/**
 * 두 사주 사이의 명리 관계를 정형 포맷으로 빠짐없이 추출한다.
 *
 * 계산으로 딱 떨어지는 관계(천간합·충, 지지 육합·삼합·방합·충·형·파·해·원진,
 * 지장간 암합, 오행 보완)를 facts 에 담는다. 결정론으로 뽑히는 판단 파생값
 * (십성·납음·신살·겉속궁합 분류)은 judgments 섹션에 별도로 담는다.
 * 유파별 정량화가 필요한 값(신강신약·용신)은 여전히 제외 — 별도 처리.
 *
 * 종합 점수는 만들지 않는다(하류 LLM 의 몫). 관계가 없어도 `present:false`
 * 로 항상 한 줄 남겨 인풋 차원을 고정한다.
 */
export function compatSheet(
  subject: CompatSubject,
  candidate: CompatSubject,
): CompatSheet {
  const s = cells(subject.bazi)
  const c = cells(candidate.bazi)

  const facts = [
    ...pairwiseRules(s, c),
    hyungRule(s, c),
    samhapRule(s, c),
    banghapRule(s, c),
    hiddenAmhapRule(s, c),
    elementComplementRule(s, c),
  ]

  const judgments = {
    ...judgeCompat(subject, candidate, facts),
    yongsinSupply: yongsinSupply(subject, candidate),
  }

  const lenses: LensGroup[] = LENS_ORDER.map((lens) => {
    const group = facts.filter((f) => FACT_LENS[f.id] === lens)
    return {
      lens,
      facts: group,
      activeCount: group.filter((f) => f.present).length,
      edgeTotal: group.reduce((n, f) => n + f.count, 0),
    }
  })

  return {
    schemaVersion: COMPATSHEET_SCHEMA_VERSION,
    subject,
    candidate,
    facts,
    lenses,
    judgments,
  }
}

/** compat 엣지의 오행 enum(영문) → 한자. */
const ELEMENT_HANJA: Record<string, string> = {
  wood: "木", fire: "火", earth: "土", metal: "金", water: "水",
}

const LENS_NAME: Record<Lens, string> = {
  合: "合(끌림·정)",
  生: "生(보완·상생)",
  沖: "沖(관계온도)",
}

/** 납음 겉궁합 관계(category) → 한자. */
const NAYIN_RELATION_HANJA: Record<string, string> = {
  same: "比和", generates: "相生", controls: "相剋",
}

/** 라벨의 괄호 속 한자 코드를 뽑는다(GLM 한자 native). 예: "천간합(天干合)" → "天干合". */
function hanjaOf(label: string): string {
  const m = label.match(/\(([^)]+)\)/)
  return m ? m[1]! : label
}

/** 영문 오행 배열 → 한자 문자열. */
function elsHanja(list: unknown): string {
  if (!Array.isArray(list)) return ""
  return list.map((e) => ELEMENT_HANJA[e as string] ?? String(e)).join("")
}

/**
 * 궁합 시트를 GLM 프롬프트용 한자 텍스트 블록으로 렌더한다.
 * 관계를 3렌즈(合/生/沖)로 묶고, 성립한 것만 노출한다(차원 고정은 구조체가 담당).
 * 신살·납음·궁위는 【보조】로 붙인다(rationale 재료).
 */
export function formatCompatSheet(sheet: CompatSheet): string {
  const lines: string[] = []
  for (const g of sheet.lenses) {
    const active = g.facts.filter((f) => f.present)
    const parts = active.map((f) => {
      const name = hanjaOf(f.label) // 天干合, 六合, 五行相補 …
      // 삼합·방합의 化오행은 엣지에, 오행보완의 수수(受) 오행은 detail 에 있다.
      const edgeEls = [...new Set(f.edges.map((e) => e.element).filter(Boolean))]
        .map((e) => ELEMENT_HANJA[e as string] ?? e)
      let extra = edgeEls.length ? `(${edgeEls.join("")})` : ""
      if (!extra && f.id === "element_complement" && f.detail) {
        const a = elsHanja(f.detail.subjectReceives)
        const b = elsHanja(f.detail.candidateReceives)
        const segs = [a && `A受${a}`, b && `B受${b}`].filter(Boolean)
        if (segs.length) extra = `(${segs.join(" ")})`
      }
      // 쌍 개수(count)는 명리적 강도와 무관(위치별 조합 아티팩트) → present만, 화오행·수수오행만 부기.
      return `${name}${extra}`
    })
    // 生 렌즈는 오행보완만으론 빈약 → 배우자성(財/官)·용신 공급 신호를 덧댄다.
    if (g.lens === "生") {
      const tg = sheet.judgments.tenGod
      if (tg.spouseStarForSubject.present) parts.push("配星A←B")
      if (tg.spouseStarForCandidate.present) parts.push("配星B←A")
      const ys = sheet.judgments.yongsinSupply
      if (ys.eokbuToSubject.present) parts.push("用神A←B")
      if (ys.eokbuToCandidate.present) parts.push("用神B←A")
      if (ys.johuToSubject.present) parts.push("調候A←B")
      if (ys.johuToCandidate.present) parts.push("調候B←A")
    }
    lines.push(`【${LENS_NAME[g.lens]}】 ${parts.length ? parts.join(" · ") : "(없음)"}`)
  }

  const j = sheet.judgments
  const aux: string[] = []
  if (j.nayin.outerReading.present) {
    const cat = String(j.nayin.outerReading.category)
    aux.push(`納音겉궁합:${NAYIN_RELATION_HANJA[cat] ?? cat}`)
  }
  if (j.palace.present) {
    const d = j.palace.detail ?? {}
    aux.push(
      `궁위 겉(和${d.outerHarmony ?? 0}沖${d.outerClash ?? 0})` +
      `속(和${d.innerHarmony ?? 0}沖${d.innerClash ?? 0})`,
    )
  }
  const s2 = j.sinsal.candidateForSubject.filter((s) => s.present).map((s) => hanjaOf(s.label))
  const s1 = j.sinsal.subjectForCandidate.filter((s) => s.present).map((s) => hanjaOf(s.label))
  if (s2.length) aux.push(`神殺(B→A):${s2.join("·")}`)
  if (s1.length) aux.push(`神殺(A→B):${s1.join("·")}`)
  if (aux.length) lines.push(`【보조】 ${aux.join(" · ")}`)

  // 교차 판단 — 배우자궁 십이운성·공망·일주대조·십이신살(사실만).
  const cr = j.cross
  const cx: string[] = []
  cx.push(`배우자궁운성 B→A:${cr.spouseGungStageForSubject.detail?.stage ?? ""}`)
  cx.push(`A→B:${cr.spouseGungStageForCandidate.detail?.stage ?? ""}`)
  if (cr.voidForSubject.present) cx.push("空亡:B일지↦A공망")
  if (cr.voidForCandidate.present) cx.push("空亡:A일지↦B공망")
  if (cr.dayPillarMatch.present) cx.push(`일주:${cr.dayPillarMatch.category}`)
  cx.push(`神殺 A년지기준B일지:${cr.sinsalCrossForSubject.category}`)
  cx.push(`B년지기준A일지:${cr.sinsalCrossForCandidate.category}`)
  lines.push(`【교차】 ${cx.join(" · ")}`)

  return lines.join("\n")
}
