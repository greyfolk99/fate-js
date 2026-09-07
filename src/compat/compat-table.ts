import {
  cells,
  pairwiseRules,
  hyungRule,
  samhapRule,
  banghapRule,
  hiddenAmhapRule,
  elementComplementRule,
  renderEdge,
} from "./rules.js"
import { judgeCompat } from "./judgments.js"
import type { CompatSubject, CompatTable } from "./types.js"

export const COMPAT_SCHEMA_VERSION = "compat-v1"

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
export function compatTable(
  subject: CompatSubject,
  candidate: CompatSubject,
): CompatTable {
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

  return {
    schemaVersion: COMPAT_SCHEMA_VERSION,
    subject,
    candidate,
    facts,
    judgments,
  }
}

/**
 * CompatTable 을 LLM 프롬프트에 넣을 정형 텍스트 블록으로 렌더한다.
 * 성립한 관계는 엣지별로, 없는 관계는 하단에 모아 표시한다.
 */
export function formatCompatTable(table: CompatTable): string {
  const lines: string[] = []
  const absent: string[] = []
  for (const f of table.facts) {
    if (!f.present) {
      absent.push(f.label)
      continue
    }
    const tag = f.polarity === "harmony" ? "＋" : f.polarity === "clash" ? "－" : "·"
    if (f.edges.length > 0) {
      lines.push(`${tag} ${f.label} (${f.count}건)`)
      for (const e of f.edges) lines.push(`    ${renderEdge(f.label, e)}`)
    } else {
      lines.push(`${tag} ${f.label} — ${f.statement}`)
    }
  }
  if (absent.length > 0) {
    lines.push(`· 없는 관계: ${absent.join(", ")}`)
  }
  return lines.join("\n")
}
