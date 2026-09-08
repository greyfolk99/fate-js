/**
 * 궁합 교차 판단 — 두 사주의 일간·일지·년지·일주를 맞대어 나오는 결정론 사실.
 *
 * 원칙: "무엇이 있어서/없어서 무엇이다" 형태의 사실만 담는다. 점수·해석·가중·
 * 정통/통속 등급은 넣지 않는다(그건 하류 LLM/ML 의 몫). 각 규칙의 문헌 출처·
 * 유파는 아래 주석으로만 남기고, 시트 데이터에는 사실만 싣는다.
 */
import type { Bazi } from "../types.js"
import { BRANCHES, STEM_INDEX, BRANCH_INDEX } from "../constants.js"
import { twelveStage, twelveSinsal } from "../bazi/constants.js"
import type { Judgment } from "./judgments-types.js"

type PillarName = "year" | "month" | "day" | "hour"
const PILLAR_KO: Record<PillarName, string> = { year: "년", month: "월", day: "일", hour: "시" }

/** 순중공망(旬中空亡) — 일주 기준 공망 2지. 계산: 淵海子平·三命通會·命理約言(만장일치). */
function voidBranches(bazi: Bazi) {
  const base = (BRANCH_INDEX[bazi.day.branch] - STEM_INDEX[bazi.day.stem] + 12) % 12
  return [BRANCHES[(base + 10) % 12]!, BRANCHES[(base + 11) % 12]!]
}

// ── 배우자궁 십이운성 교차 ──────────────────────────────────────────
// 상대 일간을 내 일지(=배우자궁)에 놓아 십이운성을 읽는다.
// 십이운성 계산=화토동법 만장일치(연해자평·자평진전). 배우자궁=일지는 자평진전
// "坐下財官" 근거(다수설). "배우자궁 12운성으로 궁합 본다"는 적용법은 원전 근거
// 부재=현대 통용 — 시트엔 사실(운성 단계)만 싣고 길흉 해석은 LLM 몫.
function spouseGungStage(
  id: string, meLabel: string, partnerLabel: string, me: Bazi, partner: Bazi,
): Judgment {
  const stage = twelveStage(partner.day.stem, me.day.branch)
  return {
    id,
    label: `${meLabel} 배우자궁 십이운성`,
    category: stage,
    present: true,
    statement: `${partnerLabel} 일간 ${partner.day.stem}이(가) ${meLabel} 일지 ${me.day.branch}(배우자궁)에서 십이운성 ${stage}.`,
    source: "십이운성(화토동법)",
    detail: { partnerDayStem: partner.day.stem, myDayBranch: me.day.branch, stage },
  }
}

// ── 공망 교차 ──────────────────────────────────────────────────────
// 상대 일지가 내 순중공망 2지에 드는가. 계산은 만장일치, 궁합 통변은 현대 통용.
function voidCross(
  id: string, meLabel: string, partnerLabel: string, me: Bazi, partner: Bazi,
): Judgment {
  const voids = voidBranches(me)
  const hit = voids.includes(partner.day.branch)
  return {
    id,
    label: `${meLabel} 공망 교차`,
    category: hit,
    present: hit,
    statement: hit
      ? `${meLabel} 순중공망 ${voids.join("·")}에 ${partnerLabel} 일지 ${partner.day.branch}이(가) 듦.`
      : `${partnerLabel} 일지 ${partner.day.branch}은(는) ${meLabel} 순중공망(${voids.join("·")})에 들지 않음.`,
    source: "순중공망(旬中空亡)",
    detail: { voids, hit },
  }
}

// ── 일주 대조 ──────────────────────────────────────────────────────
// 두 일주의 천간·지지 일치 여부. 순수 문자 비교. "동일일주/천간지동" 궁합 적용법
// 자체는 원전 근거 부재=현대 통용 — 시트엔 일치 사실만.
function dayPillarMatch(id: string, a: Bazi, b: Bazi): Judgment {
  const aStem = a.day.stem, aBr = a.day.branch, bStem = b.day.stem, bBr = b.day.branch
  const sameStem = aStem === bStem, sameBranch = aBr === bBr
  const category = sameStem && sameBranch ? "동일일주"
    : sameStem ? "천간동" : sameBranch ? "일지동" : "무"
  const statement = category === "동일일주" ? `두 일주가 ${aStem}${aBr}로 동일.`
    : category === "천간동" ? `두 일간이 ${aStem}로 같고 일지(${aBr}/${bBr})는 다름.`
    : category === "일지동" ? `두 일지가 ${aBr}로 같고 일간(${aStem}/${bStem})은 다름.`
    : `두 일주 천간·지지 모두 다름(${aStem}${aBr}/${bStem}${bBr}).`
  return {
    id, label: "일주 대조", category, present: category !== "무",
    statement, source: "일주 대조", detail: { sameStem, sameBranch },
  }
}

// ── 십이신살 교차(년지 삼합국 기준) ─────────────────────────────────
// 상대의 각 지지가 내 년지 삼합국 기준 어떤 12신살에 놓이는가.
// 매핑=삼합국 기반(三命通會 卷三 諸神煞). 기준=년지(원전 다수설); 일지 기준은 현대 통용.
// 12개 전부가 길흉이 아니므로(지살·장성·반안 등 중립·길신 포함) 길흉 판정은 넣지 않고
// "어느 지지가 어느 신살"이라는 매핑 사실만 싣는다.
function sinsalCross(
  id: string, meLabel: string, partnerLabel: string, me: Bazi, partner: Bazi,
): Judgment {
  const ref = me.year.branch
  // 시주(hour)는 생시 미상 시 null — 있을 때만 포함한다.
  const cells: { pillar: PillarName; branch: typeof partner.day.branch }[] = [
    { pillar: "year", branch: partner.year.branch },
    { pillar: "month", branch: partner.month.branch },
    { pillar: "day", branch: partner.day.branch },
  ]
  if (partner.hour) cells.push({ pillar: "hour", branch: partner.hour.branch })
  const map = cells.map((c) => ({
    pillar: c.pillar, branch: c.branch, sinsal: twelveSinsal(ref, c.branch),
  }))
  const dayEntry = map.find((m) => m.pillar === "day")!
  return {
    id,
    label: `${meLabel} 년지 기준 ${partnerLabel} 십이신살 교차`,
    category: dayEntry.sinsal,
    present: true,
    statement: `${meLabel} 년지 ${ref} 삼합국 기준 ${partnerLabel} ` +
      map.map((m) => `${PILLAR_KO[m.pillar]}지 ${m.branch}=${m.sinsal}`).join(", ") + ".",
    source: "십이신살(년지 삼합국)",
    detail: { ref, mappings: map.map((m) => `${PILLAR_KO[m.pillar]}:${m.branch}:${m.sinsal}`) },
  }
}

/** 궁합 교차 판단 묶음. */
export interface CompatCrosses {
  /** 상대 일간을 주체 배우자궁(일지)에 놓은 십이운성. */
  spouseGungStageForSubject: Judgment
  /** 주체 일간을 후보 배우자궁(일지)에 놓은 십이운성. */
  spouseGungStageForCandidate: Judgment
  /** 후보 일지가 주체 순중공망에 드는가. */
  voidForSubject: Judgment
  /** 주체 일지가 후보 순중공망에 드는가. */
  voidForCandidate: Judgment
  /** 두 일주 대조(동일일주·천간동·일지동). */
  dayPillarMatch: Judgment
  /** 주체 년지 기준 후보 지지의 십이신살. */
  sinsalCrossForSubject: Judgment
  /** 후보 년지 기준 주체 지지의 십이신살. */
  sinsalCrossForCandidate: Judgment
}

export function crossJudgments(subject: Bazi, candidate: Bazi): CompatCrosses {
  return {
    spouseGungStageForSubject: spouseGungStage("spouse_gung_stage_subject", "주체", "후보", subject, candidate),
    spouseGungStageForCandidate: spouseGungStage("spouse_gung_stage_candidate", "후보", "주체", candidate, subject),
    voidForSubject: voidCross("void_cross_subject", "주체", "후보", subject, candidate),
    voidForCandidate: voidCross("void_cross_candidate", "후보", "주체", candidate, subject),
    dayPillarMatch: dayPillarMatch("day_pillar_match", subject, candidate),
    sinsalCrossForSubject: sinsalCross("sinsal_cross_subject", "주체", "후보", subject, candidate),
    sinsalCrossForCandidate: sinsalCross("sinsal_cross_candidate", "후보", "주체", candidate, subject),
  }
}
