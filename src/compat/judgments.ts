/**
 * 궁합 판단(判斷) 추출 — 십성·납음·신살·겉속궁합 분류.
 *
 * 12관계(rules.ts)와 별개의 결정론 파생값을 뽑는다. 유파에 따라 판정이
 * 갈리는 곳은 일지 기준을 1차로 삼고 basis 필드·주석에 대안을 남긴다.
 * 신강신약·용신처럼 유파별 정량화가 필요한 값은 다루지 않는다.
 */

import {
  STEM_ELEMENTS,
  STEM_YINYANG,
  STEM_INDEX,
  BRANCH_INDEX,
  GENERATES,
  CONTROLS,
  HIDDEN_STEMS,
} from "../constants.js"
import type { STEMS, BRANCHES, ELEMENTS } from "../constants.js"
import type { Bazi } from "../types.js"
import { cells } from "./rules.js"
import type { PillarName } from "./types.js"
import type { CompatSubject } from "./types.js"
import { crossJudgments } from "./crosses.js"
import { NAYIN_PAIRS } from "./judgments-constants.js"
import {
  SINSAL_FROM_SAMHAP,
  HONGYEOM_BY_STEM,
  CHEONEUL_BY_STEM,
  MUNCHANG_BY_STEM,
  YANGIN_BY_STEM,
  BAEKHO_PILLARS,
  GWAEGANG_PILLARS,
  GWIMUN_PAIRS,
} from "./judgments-constants.js"
import type {
  Judgment,
  TenGod,
  TenGodCount,
  NayinCell,
  CompatJudgments,
} from "./judgments-types.js"

type Stem = typeof STEMS[number]
type Branch = typeof BRANCHES[number]
type Element = typeof ELEMENTS[number]

/** 십성 10종 고정 순서 — 분포 벡터의 컬럼 순서. */
const TEN_GODS: readonly TenGod[] = [
  "비견", "겁재", "식신", "상관", "편재",
  "정재", "편관", "정관", "편인", "정인",
]

/** 오행 한글 표기. */
const ELEMENT_KO: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
}

const PILLAR_KO: Record<PillarName, string> = {
  year: "년",
  month: "월",
  day: "일",
  hour: "시",
}

// ── 십성(十星) ──────────────────────────────────────────────────────

/**
 * 일간(day) 대비 어떤 천간 `other` 의 십성을 판정한다.
 *
 * 오행 관계(같음/내가 생/내가 극/나를 극/나를 생) × 음양(같음/다름).
 *   같은 오행:      같은 음양=비견, 다른 음양=겁재
 *   내가 생하는 것: 같은 음양=식신, 다른 음양=상관
 *   내가 극하는 것: 다른 음양=정재, 같은 음양=편재
 *   나를 극하는 것: 다른 음양=정관, 같은 음양=편관
 *   나를 생하는 것: 다른 음양=정인, 같은 음양=편인
 * (정재·정관·정인은 "음양이 다를 때" 성립함에 유의.)
 */
export function tenGod(dayMaster: Stem, other: Stem): TenGod {
  const dm = STEM_ELEMENTS[dayMaster]
  const oe = STEM_ELEMENTS[other]
  const same = STEM_YINYANG[dayMaster] === STEM_YINYANG[other]

  if (dm === oe) return same ? "비견" : "겁재"
  if (GENERATES[dm] === oe) return same ? "식신" : "상관"
  if (CONTROLS[dm] === oe) return same ? "편재" : "정재"
  if (CONTROLS[oe] === dm) return same ? "편관" : "정관"
  // 남은 경우: oe 가 dm 을 생함(GENERATES[oe] === dm).
  return same ? "편인" : "정인"
}

/** 십성 한글 → 한자. */
const TEN_GOD_HANJA: Record<TenGod, string> = {
  "비견": "比肩",
  "겁재": "劫財",
  "식신": "食神",
  "상관": "傷官",
  "편재": "偏財",
  "정재": "正財",
  "편관": "偏官",
  "정관": "正官",
  "편인": "偏印",
  "정인": "正印",
}

function emptyTenGodCount(): TenGodCount {
  const out = {} as TenGodCount
  for (const g of TEN_GODS) out[g] = 0
  return out
}

/** 한 사주의 천간 4자(시 미상이면 3자)를 일간 기준 십성 분포로 집계. */
export function tenGodDistribution(bazi: Bazi): TenGodCount {
  const dm = bazi.day.stem
  const out = emptyTenGodCount()
  for (const cell of cells(bazi)) {
    // 일간 자신(비견 자리)은 세지 않는다 — 배우자성 판정에 왜곡을 줄이려.
    if (cell.name === "day") continue
    out[tenGod(dm, cell.stem)]++
  }
  return out
}

/** 교차 십성 판단 하나 — `viewer` 일간이 `target` 일간을 무엇으로 보는가. */
function crossTenGod(
  id: string,
  viewerLabel: string,
  targetLabel: string,
  viewer: Bazi,
  target: Bazi,
): Judgment {
  const dm = viewer.day.stem
  const other = target.day.stem
  const g = tenGod(dm, other)
  return {
    id,
    label: `${viewerLabel} 기준 ${targetLabel} 일간 십성`,
    category: g,
    present: true,
    statement:
      `${viewerLabel} 일간 ${dm}(${ELEMENT_KO[STEM_ELEMENTS[dm]]})에게 ` +
      `${targetLabel} 일간 ${other}(${ELEMENT_KO[STEM_ELEMENTS[other]]})은(는) ` +
      `${g}(${TEN_GOD_HANJA[g]})에 해당한다.`,
    source: "자평진전·연해자평(십성)",
    detail: { dayMaster: dm, other, tenGod: g },
  }
}

/** 십성군 판정 — 배우자성(재/관) 소속 여부. */
function isWealth(g: TenGod): boolean {
  return g === "정재" || g === "편재"
}
function isOfficer(g: TenGod): boolean {
  return g === "정관" || g === "편관"
}

/**
 * 배우자성(配偶星) 공급 판단.
 * 남명은 재성(정재·편재)=처, 여명은 관성(정관·편관)=부.
 * 상대(partner)가 주체(subject)의 배우자성을 천간·지장간으로 공급하는가.
 * 각 기둥의 천간뿐 아니라 지지의 지장간(HIDDEN_STEMS)까지 훑어,
 * 지지 속에만 숨은 배우자성도 잡는다.
 * gender 미제공이면 present:false 로 남긴다.
 */
function spouseStar(
  id: string,
  subjectLabel: string,
  partnerLabel: string,
  subject: CompatSubject,
  partner: Bazi,
): Judgment {
  const gender = subject.gender
  const dm = subject.bazi.day.stem
  const wantWealth = gender === "male"
  const wantOfficer = gender === "female"

  if (!gender) {
    return {
      id,
      label: `${subjectLabel}의 배우자성 공급`,
      category: false,
      present: false,
      statement: `${subjectLabel}의 성별 미제공 — 배우자성 판정 보류.`,
      source: "자평진전(배우자성)",
      basis: "남명=재성(처), 여명=관성(부)",
    }
  }

  // partner 의 각 기둥을 주체 일간 기준 십성으로 훑는다.
  // 천간뿐 아니라 지지의 지장간(HIDDEN_STEMS)까지 봐서, 지지 속에만 숨은
  // 배우자성도 공급으로 잡는다.
  const wantsStar = (g: TenGod): boolean =>
    (wantWealth && isWealth(g)) || (wantOfficer && isOfficer(g))
  const partnerCells = cells(partner)
  const supplyPillars: PillarName[] = []
  const targetKo = wantWealth ? "재성(財)" : "관성(官)"
  for (const c of partnerCells) {
    const inStem = wantsStar(tenGod(dm, c.stem))
    const inHidden = HIDDEN_STEMS[c.branch].some((hs) => wantsStar(tenGod(dm, hs)))
    if (inStem || inHidden) {
      supplyPillars.push(c.name)
    }
  }
  const present = supplyPillars.length > 0
  const spouseWord = gender === "male" ? "처(妻)" : "부(夫)"
  return {
    id,
    label: `${subjectLabel}의 배우자성 공급`,
    category: present,
    present,
    statement: present
      ? `${partnerLabel}이(가) ${subjectLabel}의 배우자성 ${targetKo}=${spouseWord}을(를) ` +
        `${supplyPillars.map((p) => PILLAR_KO[p]).join("·")}주 천간·지장간으로 공급한다.`
      : `${partnerLabel}은(는) ${subjectLabel}의 배우자성 ${targetKo}을(를) 천간·지장간으로 공급하지 않는다.`,
    source: "자평진전(배우자성)",
    basis: "남명=재성(처), 여명=관성(부) — 천간·지장간 포함",
    detail: {
      gender,
      spouseStar: targetKo,
      supplyPillars,
    },
  }
}

// ── 납음(納音) ──────────────────────────────────────────────────────

/**
 * 간지 두 글자(예: 甲子)의 납음을 구한다.
 *
 * 실제 사주의 간지는 언제나 양간-양지·음간-음지로 짝이 맞아 60간지에 든다.
 * 짝이 어긋나는(음양 불일치) 불가능한 조합이면 60간지에 없으므로 null.
 */
export function nayinOf(
  stem: Stem,
  branch: Branch,
): { name: string; element: Element } | null {
  // 60간지 순번 n: 천간·지지 인덱스가 맞아떨어지는 유일한 n(0..59).
  // n ≡ stemIdx (mod 10), n ≡ branchIdx (mod 12). 짝 인덱스 = floor(n/2).
  const si = STEM_INDEX[stem]
  const bi = BRANCH_INDEX[branch]
  for (let k = 0; k < 60; k++) {
    if (k % 10 === si && k % 12 === bi) {
      const pair = NAYIN_PAIRS[Math.floor(k / 2)]!
      return { name: pair.name, element: pair.element }
    }
  }
  return null
}

function nayinCells(bazi: Bazi): NayinCell[] {
  const out: NayinCell[] = []
  for (const c of cells(bazi)) {
    const ny = nayinOf(c.stem, c.branch)
    if (!ny) continue
    out.push({
      pillar: c.name,
      ganzhi: c.stem + c.branch,
      name: ny.name,
      element: ny.element,
    })
  }
  return out
}

/**
 * 전통 겉궁합 — 주체 년주 납음 vs 후보 년주 납음의 오행 상생/상극/비화.
 * 납음오행끼리 상생이면 길, 비화(같음)면 무난, 상극이면 주의로 읽는 통설.
 */
function nayinOuterReading(subject: Bazi, candidate: Bazi): Judgment {
  const s = nayinOf(subject.year.stem, subject.year.branch)
  const c = nayinOf(candidate.year.stem, candidate.year.branch)
  if (!s || !c) {
    // 실제 사주면 도달하지 않음 — 불가능한 간지 입력일 때만.
    return {
      id: "nayin_outer",
      label: "납음 겉궁합",
      category: false,
      present: false,
      statement: "년주 간지 납음을 확정할 수 없어 겉궁합 판정 보류.",
      source: "삼명통회·전통 궁합(납음)",
      basis: "년주 납음 기준(전통 겉궁합)",
    }
  }
  let category: string
  let relKo: string
  if (s.element === c.element) {
    category = "same"
    relKo = "비화(比和)"
  } else if (GENERATES[s.element] === c.element || GENERATES[c.element] === s.element) {
    category = "generates"
    relKo = "상생(相生)"
  } else {
    // 남은 경우는 반드시 상극 관계(오행 5종 완전그래프).
    category = "controls"
    relKo = "상극(相剋)"
  }
  return {
    id: "nayin_outer",
    label: "납음 겉궁합",
    category,
    present: true,
    statement:
      `주체 년주 ${subject.year.stem}${subject.year.branch}=${s.name}(${ELEMENT_KO[s.element]}), ` +
      `후보 년주 ${candidate.year.stem}${candidate.year.branch}=${c.name}(${ELEMENT_KO[c.element]}) — ` +
      `두 납음오행은 ${relKo} 관계다.`,
    source: "삼명통회·전통 궁합(납음)",
    basis: "년주 납음 기준(전통 겉궁합)",
    detail: {
      subjectNayin: s.name,
      subjectElement: s.element,
      candidateNayin: c.name,
      candidateElement: c.element,
    },
  }
}

// ── 신살(神殺) ──────────────────────────────────────────────────────

/**
 * 삼합 그룹 기반 신살(도화·역마·화개)을 후보가 지니는지 판정.
 * 기준(reference)은 일지(일지 기준) — 년지 변형은 별도 detail.
 */
function samhapSinsal(
  id: string,
  label: string,
  key: "dohwa" | "yeokma" | "hwagae",
  refBranch: Branch,
  targetBazi: Bazi,
): Judgment {
  const hit = SINSAL_FROM_SAMHAP[refBranch][key]
  const pillars: PillarName[] = []
  for (const c of cells(targetBazi)) {
    if (c.branch === hit) pillars.push(c.name)
  }
  const present = pillars.length > 0
  return {
    id,
    label,
    category: present,
    present,
    statement: present
      ? `기준 일지 ${refBranch}의 ${label} 지지는 ${hit} — 상대 사주 ` +
        `${pillars.map((p) => PILLAR_KO[p]).join("·")}주에 있어 성립한다.`
      : `기준 일지 ${refBranch}의 ${label} 지지 ${hit} 없음.`,
    source: "삼명통회·연해자평(신살)",
    basis: "일지(삼합) 기준 — 년지 기준 변형 있음",
    detail: { refBranch, target: hit, pillars },
  }
}

/** 일간 기준 단일 지지 신살(홍염·문창·양인)을 후보가 지니는지. */
function stemBranchSinsal(
  id: string,
  label: string,
  refStem: Stem,
  table: Record<Stem, Branch>,
  source: string,
  targetBazi: Bazi,
): Judgment {
  const hit = table[refStem]
  const pillars: PillarName[] = []
  for (const c of cells(targetBazi)) {
    if (c.branch === hit) pillars.push(c.name)
  }
  const present = pillars.length > 0
  return {
    id,
    label,
    category: present,
    present,
    statement: present
      ? `기준 일간 ${refStem}의 ${label} 지지 ${hit} — 상대 사주 ` +
        `${pillars.map((p) => PILLAR_KO[p]).join("·")}주에 있어 성립한다.`
      : `기준 일간 ${refStem}의 ${label} 지지 ${hit} 없음.`,
    source,
    basis: "일간 기준",
    detail: { refStem, target: hit, pillars },
  }
}

/**
 * 양인살(羊刃) — 일간 기준, 단 **양간(甲丙戊庚壬)일 때만** 판정한다(다수설).
 * 음간(乙丁己辛癸) 일간은 양인 미인정 — present:false 로 남긴다.
 * (음인陰刃 소수설 값은 YANGIN_BY_STEM 에 참고로만 보존, 여기선 미적용.)
 */
function yanginSinsal(refStem: Stem, targetBazi: Bazi): Judgment {
  const source = "자평진전(양인)"
  if (STEM_YINYANG[refStem] !== "yang") {
    return {
      id: "yangin",
      label: "양인살(羊刃)",
      category: false,
      present: false,
      statement: `기준 일간 ${refStem}은(는) 음간 — 양인살 미인정(양간만, 다수설).`,
      source,
      basis: "일간 기준(양간 정설 — 음간 미포함)",
      detail: { refStem, pillars: [] },
    }
  }
  const hit = YANGIN_BY_STEM[refStem]
  const pillars: PillarName[] = []
  for (const c of cells(targetBazi)) {
    if (c.branch === hit) pillars.push(c.name)
  }
  const present = pillars.length > 0
  return {
    id: "yangin",
    label: "양인살(羊刃)",
    category: present,
    present,
    statement: present
      ? `기준 일간 ${refStem}의 양인살(羊刃) 지지 ${hit} — 상대 사주 ` +
        `${pillars.map((p) => PILLAR_KO[p]).join("·")}주에 있어 성립한다.`
      : `기준 일간 ${refStem}의 양인살(羊刃) 지지 ${hit} 없음.`,
    source,
    basis: "일간 기준(양간 정설 — 음간 미포함)",
    detail: { refStem, target: hit, pillars },
  }
}

/** 천을귀인(2지)처럼 지지가 복수인 일간 기준 신살. */
function cheoneulSinsal(
  refStem: Stem,
  targetBazi: Bazi,
): Judgment {
  const targets = CHEONEUL_BY_STEM[refStem]
  const pillars: PillarName[] = []
  for (const c of cells(targetBazi)) {
    if (targets.includes(c.branch)) pillars.push(c.name)
  }
  const present = pillars.length > 0
  return {
    id: "cheoneul",
    label: "천을귀인(天乙貴人)",
    category: present,
    present,
    statement: present
      ? `기준 일간 ${refStem}의 천을귀인 지지 ${targets.join("·")} — 상대 사주 ` +
        `${pillars.map((p) => PILLAR_KO[p]).join("·")}주에 있어 성립한다(최고 길신).`
      : `기준 일간 ${refStem}의 천을귀인 지지 ${targets.join("·")} 없음.`,
    source: "삼명통회(천을귀인)",
    basis: "일간 기준",
    detail: { refStem, targets: [...targets], pillars },
  }
}

/** 특정 간지 기둥 자체가 신살(백호·괴강)인지 — 상대 사주 각 기둥 검사. */
function pillarSinsal(
  id: string,
  label: string,
  pillarSet: ReadonlySet<string>,
  source: string,
  targetBazi: Bazi,
): Judgment {
  const pillars: PillarName[] = []
  for (const c of cells(targetBazi)) {
    if (pillarSet.has(c.stem + c.branch)) pillars.push(c.name)
  }
  const present = pillars.length > 0
  return {
    id,
    label,
    category: present,
    present,
    statement: present
      ? `상대 사주 ${pillars.map((p) => PILLAR_KO[p]).join("·")}주가 ${label} 간지에 해당한다.`
      : `${label} 간지 없음.`,
    source,
    basis: "간지(주) 자체 판정 — 상대 사주 기준",
    detail: { pillars },
  }
}

/** 귀문관살 — 기준 일지와 상대 지지가 귀문 쌍을 이루는지(교차). */
function gwimunSinsal(refBranch: Branch, targetBazi: Bazi): Judgment {
  const pillars: PillarName[] = []
  for (const c of cells(targetBazi)) {
    if (c.branch === refBranch) continue
    const paired = GWIMUN_PAIRS.some(
      (s) => s.has(refBranch) && s.has(c.branch),
    )
    if (paired) pillars.push(c.name)
  }
  const present = pillars.length > 0
  return {
    id: "gwimun",
    label: "귀문관살(鬼門關殺)",
    category: present,
    present,
    statement: present
      ? `기준 일지 ${refBranch}와 상대 ${pillars.map((p) => PILLAR_KO[p]).join("·")}주 지지가 ` +
        `귀문관살 쌍을 이룬다(신경과민·집착).`
      : `기준 일지 ${refBranch} 기준 귀문관살 없음.`,
    source: "궁합 통설(귀문관살)",
    basis: "일지 기준 쌍 판정",
    detail: { refBranch, pillars },
  }
}

/**
 * 후보가 주체 기준으로 지니는 신살 묶음.
 * 기준 = 주체 일지(삼합계·귀문)·주체 일간(간계) — 유파상 일지/일간 1차.
 */
function sinsalFor(refBazi: Bazi, targetBazi: Bazi): Judgment[] {
  const refBranch = refBazi.day.branch
  const refStem = refBazi.day.stem
  return [
    samhapSinsal("dohwa", "도화살(桃花)", "dohwa", refBranch, targetBazi),
    samhapSinsal("yeokma", "역마살(驛馬)", "yeokma", refBranch, targetBazi),
    samhapSinsal("hwagae", "화개살(華蓋)", "hwagae", refBranch, targetBazi),
    stemBranchSinsal(
      "hongyeom", "홍염살(紅艶)", refStem, HONGYEOM_BY_STEM,
      "명리 통설(홍염)", targetBazi,
    ),
    cheoneulSinsal(refStem, targetBazi),
    stemBranchSinsal(
      "munchang", "문창귀인(文昌貴人)", refStem, MUNCHANG_BY_STEM,
      "삼명통회(문창귀인)", targetBazi,
    ),
    yanginSinsal(refStem, targetBazi),
    pillarSinsal(
      "baekho", "백호살(白虎)", BAEKHO_PILLARS,
      "명리 통설(백호대살)", targetBazi,
    ),
    pillarSinsal(
      "gwaegang", "괴강살(魁罡)", GWAEGANG_PILLARS,
      "명리 통설(괴강)", targetBazi,
    ),
    gwimunSinsal(refBranch, targetBazi),
  ]
}

// ── 종합 ────────────────────────────────────────────────────────────

/**
 * 두 사주의 판단 파생값을 뽑는다. subject 관점을 1차로 기술한다.
 * `facts` 는 compatSheet 의 12관계 결과 — 겉속궁합 집계에 재활용.
 */
export function judgeCompat(
  subject: CompatSubject,
  candidate: CompatSubject,
  facts: import("./types.js").CompatFact[],
): Omit<CompatJudgments, "yongsinSupply"> {
  const sb = subject.bazi
  const cb = candidate.bazi

  const palace = buildPalaceSummary(facts)

  return {
    tenGod: {
      subjectDistribution: tenGodDistribution(sb),
      candidateDistribution: tenGodDistribution(cb),
      candidateToSubject: crossTenGod(
        "tengod_candidate_to_subject", "주체", "후보", sb, cb,
      ),
      subjectToCandidate: crossTenGod(
        "tengod_subject_to_candidate", "후보", "주체", cb, sb,
      ),
      spouseStarForSubject: spouseStar(
        "spouse_star_subject", "주체", "후보", subject, cb,
      ),
      spouseStarForCandidate: spouseStar(
        "spouse_star_candidate", "후보", "주체", candidate, sb,
      ),
    },
    nayin: {
      subjectCells: nayinCells(sb),
      candidateCells: nayinCells(cb),
      outerReading: nayinOuterReading(sb, cb),
    },
    sinsal: {
      candidateForSubject: sinsalFor(sb, cb),
      subjectForCandidate: sinsalFor(cb, sb),
    },
    palace,
    hapChungOverlap: buildHapChungOverlap(facts),
    cross: crossJudgments(sb, cb),
  }
}

/**
 * 합충 병존 — 같은 글자(같은 사주·같은 기둥)가 지지 합(六合·三合·方合)과
 * 지지 충족(六沖·刑·害·破·怨嗔) 관계에 동시에 걸린 사실을 뽑는다.
 *
 * 근거: 자평진전 論刑沖會合解法 "會合可以解冲" — 단 원전 스스로 조건부
 * ("有解不能解之別")로 두므로 해소 판정은 내리지 않고 병존 사실만 남긴다.
 */
function buildHapChungOverlap(facts: import("./types.js").CompatFact[]): Judgment {
  const HAP = new Set(["branch_yukhap", "branch_samhap", "branch_banghap"])
  const CHUNG = new Set(["branch_clash", "branch_hyung", "branch_hae", "branch_pa", "branch_wonjin"])
  // 셀 키 = 어느 사주(주체/후보)·기둥·글자. 관계군별로 어떤 관계명에 걸렸는지 수집.
  const seen = new Map<string, { who: string; pillar: PillarName; glyph: string; hap: Set<string>; chung: Set<string> }>()
  const touch = (who: string, pillar: PillarName, glyph: string, kind: "hap" | "chung", label: string) => {
    const key = `${who}:${pillar}:${glyph}`
    const cur = seen.get(key) ?? { who, pillar, glyph, hap: new Set<string>(), chung: new Set<string>() }
    cur[kind].add(label)
    seen.set(key, cur)
  }
  for (const f of facts) {
    if (!f.present) continue
    const kind = HAP.has(f.id) ? "hap" : CHUNG.has(f.id) ? "chung" : null
    if (!kind) continue
    const name = f.label.match(/\(([^)]+)\)/)?.[1] ?? f.label
    for (const e of f.edges) {
      touch("주체", e.subject.pillar, e.subject.glyph, kind, name)
      touch("후보", e.object.pillar, e.object.glyph, kind, name)
    }
  }
  const overlaps = [...seen.values()].filter((c) => c.hap.size > 0 && c.chung.size > 0)
  const present = overlaps.length > 0
  const describe = (c: (typeof overlaps)[number]) =>
    `${c.who} ${PILLAR_KO[c.pillar]}지 ${c.glyph}(${[...c.hap].join("·")}+${[...c.chung].join("·")})`
  return {
    id: "hap_chung_overlap",
    label: "합충 병존",
    category: present,
    present,
    statement: present
      ? `같은 글자가 합과 충에 동시 성립: ${overlaps.map(describe).join(", ")}.`
      : "지지 합과 충이 같은 글자에서 겹치지 않음.",
    source: "합충 병존",
    detail: { cells: overlaps.map(describe) },
  }
}

/**
 * 12관계 facts 를 위치별로 집계해 겉(연주)·속(일지) 화합/충돌 카운트를 낸다.
 * - 겉궁합: 두 사람의 연주끼리(A.年 ↔ B.年) 만난 엣지. 양쪽 끝이 모두 연주.
 * - 속궁합: 두 사람의 일지끼리(A.日支 ↔ B.日支) 만난 엣지. 양쪽 끝이 모두 일지.
 * 한쪽만 연주/일지인 엣지(예: A.年 ↔ B.月)는 겉·속 어디에도 세지 않는다.
 */
function buildPalaceSummary(facts: import("./types.js").CompatFact[]): Judgment {
  let outerHarmony = 0
  let outerClash = 0
  let innerHarmony = 0
  let innerClash = 0

  for (const f of facts) {
    for (const e of f.edges) {
      const bothYear = e.subject.pillar === "year" && e.object.pillar === "year"
      const bothDay = e.subject.pillar === "day" && e.object.pillar === "day"
      if (bothYear) {
        if (f.polarity === "harmony") outerHarmony++
        else if (f.polarity === "clash") outerClash++
      }
      if (bothDay) {
        if (f.polarity === "harmony") innerHarmony++
        else if (f.polarity === "clash") innerClash++
      }
    }
  }

  return {
    id: "palace_summary",
    label: "겉궁합·속궁합 분류",
    category: true,
    present: true,
    statement:
      `겉궁합(연주): 화합 ${outerHarmony} · 충돌 ${outerClash}건. ` +
      `속궁합(일지): 화합 ${innerHarmony} · 충돌 ${innerClash}건.`,
    source: "12관계 위치 집계",
    basis: "연주=겉(사회적), 일지=속(배우자궁)",
    detail: {
      outerHarmony,
      outerClash,
      innerHarmony,
      innerClash,
    },
  }
}
