/**
 * 용신 공급(用神 供給) 교차 — 상대 원국이 내 희신을 "얼마나·어떻게" 공급하는가.
 *
 * ⚠️ boolean(공급 유/무)은 무작위 쌍에서 거의 항상 참(억부 99%·조후 74% 실측)이라
 * 분산 0 = 시트에 넣어도 teacher 가 변별 못 함. 그래서 등급 있는 사실로 담는다:
 *  - 커버 수: 희신 오행 중 상대 원국(천간+지지 본기)에 실재하는 오행들.
 *  - 투출(透出): 그중 상대 "천간 4자"에 드러난 오행/천간 — 명리에서 투출은
 *    지장간 암장과 격이 다른 canonical 개념(자평 격국론 전반). 실측 변별력:
 *    조후主 투출 34%, 억부 투출수 0/1/2/3+ = 8/45/43/4%.
 * 억부용신 원리 = 滴天髓 衰旺篇. 점수·판정 없음 — "무엇 중 무엇이 공급되고
 * 무엇이 투출인가"라는 사실만.
 *
 * ⚠️ 순환 import 방지: analysisFacts 를 쓰므로 judgeCompat 이 아니라
 * compatSheet(compatsheet.ts)에서 호출해 붙인다.
 */
import type { CompatSubject } from "./types.js"
import type { Bazi } from "../types.js"
import { analysisFacts } from "../bazi/analysis.js"
import { STEM_ELEMENTS, BRANCH_ELEMENTS, HIDDEN_STEMS } from "../constants.js"
import type { ELEMENTS, STEMS } from "../constants.js"
import type { Judgment } from "./judgments-types.js"

type Element = typeof ELEMENTS[number]
type Stem = typeof STEMS[number]
const EL_KO: Record<Element, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" }

/** 상대 원국의 오행 — visible=천간 4자(투출), grounded=천간+지지 본기. */
function partnerElements(partner: Bazi) {
  const cells = [partner.year, partner.month, partner.day, partner.hour].filter(
    (p): p is NonNullable<typeof p> => p != null,
  )
  const visible = new Set<Element>(cells.map((c) => STEM_ELEMENTS[c.stem]))
  const grounded = new Set<Element>([...visible, ...cells.map((c) => BRANCH_ELEMENTS[c.branch])])
  const visibleStems = new Set<Stem>(cells.map((c) => c.stem))
  const allStems = new Set<Stem>(visibleStems)
  for (const c of cells) for (const hs of HIDDEN_STEMS[c.branch]) allStems.add(hs)
  return { visible, grounded, visibleStems, allStems }
}

/** 억부 희신 커버·투출 — "희신 X중 Y공급(Z는 투출)" 사실. */
function eokbuSupplyJudgment(
  id: string, meLabel: string, partnerLabel: string, partner: Bazi, favorable: Element[],
): Judgment {
  const p = partnerElements(partner)
  const covered = favorable.filter((e) => p.grounded.has(e))
  const revealed = favorable.filter((e) => p.visible.has(e))
  const present = covered.length > 0
  const favStr = favorable.map((e) => EL_KO[e]).join("")
  const covStr = covered.map((e) => EL_KO[e]).join("")
  const revStr = revealed.map((e) => EL_KO[e]).join("")
  return {
    id, label: `${meLabel} 억부용신 공급`, category: `${covered.length}/${favorable.length}`, present,
    statement: present
      ? `${meLabel} 억부 희신 ${favStr} 중 ${partnerLabel} 원국이 ${covStr}을(를) 공급` +
        (revealed.length ? ` — ${revStr}은(는) 천간 투출.` : " — 투출 없음(지지·본기).")
      : `${partnerLabel} 원국은 ${meLabel} 억부 희신 ${favStr}을(를) 공급하지 않음.`,
    source: "억부용신 공급",
    detail: {
      favorable: favorable.map((e) => EL_KO[e]),
      covered: covered.map((e) => EL_KO[e]),
      revealed: revealed.map((e) => EL_KO[e]),
    },
  }
}

/** 조후 用神(특정 천간) 공급 — 투출(천간)인가 암장(지장간)인가 구분. */
function johuSupplyJudgment(
  id: string, meLabel: string, partnerLabel: string, partner: Bazi, main: Stem[], sub: Stem[],
): Judgment {
  const p = partnerElements(partner)
  const mainRevealed = main.filter((s) => p.visibleStems.has(s))
  const mainHidden = main.filter((s) => !p.visibleStems.has(s) && p.allStems.has(s))
  const subHit = sub.filter((s) => p.allStems.has(s))
  const present = mainRevealed.length > 0 || mainHidden.length > 0
  return {
    id, label: `${meLabel} 조후용신 공급`, category: mainRevealed.length > 0 ? "투출" : present ? "암장" : false,
    present,
    statement: present
      ? `${meLabel} 조후 主用神 ${main.join("")} 중 ` +
        [
          mainRevealed.length ? `${mainRevealed.join("")}이(가) ${partnerLabel} 천간에 투출` : "",
          mainHidden.length ? `${mainHidden.join("")}은(는) 지장간에만 암장` : "",
        ].filter(Boolean).join(", ") +
        (subHit.length ? ` (次佐 ${subHit.join("")}도 있음).` : ".")
      : `${partnerLabel} 원국은 ${meLabel} 조후 主用神 ${main.join("")}을(를) 갖고 있지 않음.`,
    source: "조후용신 공급(궁통보감 표)",
    detail: { main, sub, mainRevealed, mainHidden, subHit },
  }
}

export interface YongsinSupply {
  /** 후보 원국이 주체 억부용신을 공급하는가(커버·투출). */
  eokbuToSubject: Judgment
  /** 주체 원국이 후보 억부용신을 공급하는가. */
  eokbuToCandidate: Judgment
  /** 후보가 주체 조후용신을 공급하는가(투출/암장). */
  johuToSubject: Judgment
  /** 주체가 후보 조후용신을 공급하는가. */
  johuToCandidate: Judgment
}

export function yongsinSupply(subject: CompatSubject, candidate: CompatSubject): YongsinSupply {
  const a = analysisFacts(subject.bazi).yongsin
  const b = analysisFacts(candidate.bazi).yongsin
  return {
    eokbuToSubject: eokbuSupplyJudgment("yongsin_eokbu_subject", "주체", "후보", candidate.bazi, a.eokbu.favorable),
    eokbuToCandidate: eokbuSupplyJudgment("yongsin_eokbu_candidate", "후보", "주체", subject.bazi, b.eokbu.favorable),
    johuToSubject: johuSupplyJudgment("johu_subject", "주체", "후보", candidate.bazi, a.johu.main, a.johu.sub),
    johuToCandidate: johuSupplyJudgment("johu_candidate", "후보", "주체", subject.bazi, b.johu.main, b.johu.sub),
  }
}
