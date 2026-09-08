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

  const judgments = judgeCompat(subject, candidate, facts)

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

/**
 * 궁합 시트를 GLM 프롬프트용 한자 텍스트 블록으로 렌더한다.
 * 관계를 3렌즈(合/生/沖)로 묶고, 성립한 것만 노출한다(차원 고정은 구조체가 담당).
 * 신살·납음·궁위는 【보조】로 붙인다(rationale 재료).
 */
export function formatCompatSheet(sheet: CompatSheet): string {
  const lines: string[] = []
  for (const g of sheet.lenses) {
    const active = g.facts.filter((f) => f.present)
    if (active.length === 0) {
      lines.push(`【${LENS_NAME[g.lens]}】 (없음)`)
      continue
    }
    const parts = active.map((f) => {
      const label = f.label.replace(/\([^)]*\)/g, "") // 한글 라벨만
      const els = [...new Set(f.edges.map((e) => e.element).filter(Boolean))]
        .map((e) => ELEMENT_HANJA[e as string] ?? e)
      return `${label}${f.count}${els.length ? `(${els.join("")})` : ""}`
    })
    lines.push(`【${LENS_NAME[g.lens]}】 ${parts.join(" · ")}`)
  }

  const j = sheet.judgments
  const aux: string[] = []
  if (j.nayin.outerReading.present) aux.push(`납음겉궁합:${j.nayin.outerReading.category}`)
  if (j.palace.present) aux.push(`겉속궁합:${j.palace.category}`)
  const strip = (s: string) => s.replace(/\([^)]*\)/g, "")
  const s2 = j.sinsal.candidateForSubject.filter((s) => s.present).map((s) => strip(s.label))
  const s1 = j.sinsal.subjectForCandidate.filter((s) => s.present).map((s) => strip(s.label))
  if (s2.length) aux.push(`신살(B→A):${s2.join("·")}`)
  if (s1.length) aux.push(`신살(A→B):${s1.join("·")}`)
  if (aux.length) lines.push(`【보조】 ${aux.join(" · ")}`)

  return lines.join("\n")
}
