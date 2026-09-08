/**
 * 용신 공급(用神 供給) 교차 — 상대 원국이 내 희신(喜神) 오행을 공급하는가.
 *
 * 억부용신 원리 = 滴天髓 衰旺篇(身強→洩剋, 身弱→生扶). 강약 참고판정 기반이라
 * 문장에 "억부 기준"임을 밝힌다. 조후 공급도 같이 본다(현 조후는 계절 기반 개략 —
 * 궁통보감 정밀표는 후속). 시트엔 "무엇이 필요한데 상대가 무엇을 주는가"라는 사실만.
 *
 * ⚠️ 순환 import 방지: analysisFacts 를 쓰므로 이 모듈은 judgeCompat(judgments.ts)이
 * 아니라 compatSheet(compatsheet.ts)에서 호출해 붙인다.
 */
import type { CompatSubject } from "./types.js"
import type { Bazi } from "../types.js"
import { analysisFacts } from "../bazi/analysis.js"
import { STEM_ELEMENTS, BRANCH_ELEMENTS, HIDDEN_STEMS } from "../constants.js"
import type { ELEMENTS, STEMS } from "../constants.js"
import { cells } from "./rules.js"
import type { Judgment } from "./judgments-types.js"

type Stem = typeof STEMS[number]

type Element = typeof ELEMENTS[number]
type PillarName = "year" | "month" | "day" | "hour"
const EL_KO: Record<Element, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" }
const PILLAR_KO: Record<PillarName, string> = { year: "년", month: "월", day: "일", hour: "시" }

/** 원국에 실재하는 오행 → 어느 기둥의 천간/지지인지. */
function chartElements(bazi: Bazi): Map<Element, string[]> {
  const m = new Map<Element, string[]>()
  const add = (e: Element, where: string) => { const a = m.get(e) ?? []; a.push(where); m.set(e, a) }
  for (const c of cells(bazi)) {
    add(STEM_ELEMENTS[c.stem], `${PILLAR_KO[c.name as PillarName]}간`)
    add(BRANCH_ELEMENTS[c.branch], `${PILLAR_KO[c.name as PillarName]}지`)
  }
  return m
}

function supplyJudgment(
  id: string, meLabel: string, partnerLabel: string, partner: Bazi,
  need: Element[], needName: string,
): Judgment {
  if (need.length === 0) {
    return {
      id, label: `${meLabel} ${needName} 공급`, category: false, present: false,
      statement: `${meLabel}은(는) ${needName} 요구가 뚜렷하지 않음(계절 중화 등).`,
      source: needName, detail: { need: [], supplied: [] },
    }
  }
  const partnerEls = chartElements(partner)
  const supplied = need.filter((e) => partnerEls.has(e))
  const present = supplied.length > 0
  const needStr = need.map((e) => EL_KO[e]).join("")
  return {
    id, label: `${meLabel} ${needName} 공급`, category: present, present,
    statement: present
      ? `${meLabel} ${needName} ${needStr}인데 ${partnerLabel} 원국에 ${supplied.map((e) => EL_KO[e]).join("")}이(가) 있어 공급.`
      : `${partnerLabel} 원국은 ${meLabel} ${needName} ${needStr}을(를) 공급하지 않음.`,
    source: needName,
    detail: { need: need.map((e) => EL_KO[e]), supplied: supplied.map((e) => EL_KO[e]) },
  }
}

/** 조후 用神(특정 천간)을 상대 원국이 천간·지장간으로 갖고 있는가 — 표 사실 교차. */
function johuSupplyJudgment(
  id: string, meLabel: string, partnerLabel: string, partner: Bazi,
  main: Stem[], sub: Stem[],
): Judgment {
  const have = new Set<Stem>()
  for (const c of cells(partner)) {
    have.add(c.stem)
    for (const hs of HIDDEN_STEMS[c.branch]) have.add(hs)
  }
  const mainHit = main.filter((s) => have.has(s))
  const subHit = sub.filter((s) => have.has(s))
  const present = mainHit.length > 0
  return {
    id, label: `${meLabel} 조후용신 공급`, category: present, present,
    statement: present
      ? `${meLabel} 조후 主用神 ${main.join("")}인데 ${partnerLabel} 원국(천간·지장간)에 ${mainHit.join("")}이(가) 있음` +
        (subHit.length ? ` (次佐 ${subHit.join("")}도 있음).` : ".")
      : `${partnerLabel} 원국은 ${meLabel} 조후 主用神 ${main.join("")}을(를) 천간·지장간으로 갖고 있지 않음` +
        (subHit.length ? ` (次佐 ${subHit.join("")}은 있음).` : "."),
    source: "조후용신(궁통보감 표)",
    detail: { main, sub, mainHit, subHit },
  }
}

export interface YongsinSupply {
  /** 후보 원국이 주체 억부용신을 공급하는가. */
  eokbuToSubject: Judgment
  /** 주체 원국이 후보 억부용신을 공급하는가. */
  eokbuToCandidate: Judgment
  /** 후보가 주체 조후용신을 공급하는가. */
  johuToSubject: Judgment
  /** 주체가 후보 조후용신을 공급하는가. */
  johuToCandidate: Judgment
}

export function yongsinSupply(subject: CompatSubject, candidate: CompatSubject): YongsinSupply {
  const a = analysisFacts(subject.bazi).yongsin
  const b = analysisFacts(candidate.bazi).yongsin
  return {
    eokbuToSubject: supplyJudgment("yongsin_eokbu_subject", "주체", "후보", candidate.bazi, a.eokbu.favorable, "억부용신"),
    eokbuToCandidate: supplyJudgment("yongsin_eokbu_candidate", "후보", "주체", subject.bazi, b.eokbu.favorable, "억부용신"),
    johuToSubject: johuSupplyJudgment("johu_subject", "주체", "후보", candidate.bazi, a.johu.main, a.johu.sub),
    johuToCandidate: johuSupplyJudgment("johu_candidate", "후보", "주체", subject.bazi, b.johu.main, b.johu.sub),
  }
}
