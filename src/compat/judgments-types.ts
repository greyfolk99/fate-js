/**
 * 궁합 판단(判斷) 파생 데이터 타입.
 *
 * 12관계(rules.ts)와 별개로, 결정론적으로 뽑을 수 있는 명리 판단값을
 * 담는다. 십성(十星)·납음(納音)·신살(神殺)·겉속궁합 분류가 여기 들어간다.
 * 수치 정량화(신강신약·용신 등 유파 의존값)는 담지 않는다.
 */

import type { ELEMENTS } from "../constants.js"
import type { PillarName } from "./types.js"

type Element = typeof ELEMENTS[number]

/** 십성(十星) 10종. */
export type TenGod =
  | "비견" // 比肩
  | "겁재" // 劫財
  | "식신" // 食神
  | "상관" // 傷官
  | "편재" // 偏財
  | "정재" // 正財
  | "편관" // 偏官 (七殺)
  | "정관" // 正官
  | "편인" // 偏印
  | "정인" // 正印

/**
 * 판단 사실 하나 — 정형(ML 피처)·문장(LLM) 양쪽으로 읽히도록.
 *
 * 관계가 성립하지 않아도 `present`/`category` 로 항상 한 줄 남길 수 있게
 * 구조를 고정한다. 종합 점수는 담지 않는다.
 */
export interface Judgment {
  /** 안정적 키(정형 인풋 컬럼명). 예: "nayin_outer". */
  id: string
  /** 판단명(한글). 예: "납음 겉궁합". */
  label: string
  /** 범주형 결과값. 예: "정재", "generates", true/false. */
  category: string | boolean
  /** 이 판단이 유의미하게 성립하는가. */
  present: boolean
  /** 문헌 근거 해석 문장 — LLM 입력·UI 노출용. */
  statement: string
  /** 근거 출처 태그(문헌/전통명). */
  source: string
  /**
   * 유파 선택을 밝히는 태그. 예: 신살은 "일지 기준(년지 변형은 주석 참조)".
   * 유파가 갈리지 않는 판단이면 생략.
   */
  basis?: string
  /** 엣지로 안 떨어지는 부가 사실. */
  detail?: Record<string, string | number | boolean | string[]>
}

/** 한 사주 안의 십성 분포 — 각 십성이 몇 번 나오는가(고정 차원). */
export type TenGodCount = Record<TenGod, number>

/** 한 기둥의 납음 정보. */
export interface NayinCell {
  pillar: PillarName
  /** 간지(干支) 두 글자. 예: "甲子". */
  ganzhi: string
  /** 납음 명칭(한자). 예: "海中金". */
  name: string
  /** 납음 오행. */
  element: Element
}

/**
 * 궁합 판단 묶음 — CompatTable 에 별도 섹션으로 실린다.
 * 12관계와 섞지 않는다. 신살 판정은 각각 Judgment 로 담고,
 * 걸린 기둥 위치는 Judgment.detail.pillars 에 둔다.
 */
export interface CompatJudgments {
  /** 십성 파트. */
  tenGod: {
    /** 주체 사주의 십성 분포(일간 기준, 천간 4자). */
    subjectDistribution: TenGodCount
    /** 후보 사주의 십성 분포(일간 기준, 천간 4자). */
    candidateDistribution: TenGodCount
    /** 주체가 후보 일간을 지장간 포함해 본 분포는 detail 로 별도. */
    /** 교차 읽기: 후보 일간은 주체에게 무슨 십성인가. */
    candidateToSubject: Judgment
    /** 교차 읽기: 주체 일간은 후보에게 무슨 십성인가. */
    subjectToCandidate: Judgment
    /** 배우자성(재/관) 공급 여부. gender 있을 때만 present 가능. */
    spouseStarForSubject: Judgment
    spouseStarForCandidate: Judgment
  }
  /** 납음 파트. */
  nayin: {
    /** 주체 각 기둥 납음. */
    subjectCells: NayinCell[]
    /** 후보 각 기둥 납음. */
    candidateCells: NayinCell[]
    /** 전통 겉궁합: 주체 년주 납음 vs 후보 년주 납음. */
    outerReading: Judgment
  }
  /** 신살 파트 — 교차(후보가 주체에게 걸리는가) 중심. */
  sinsal: {
    /** 후보가 주체 기준으로 지니는 신살들. */
    candidateForSubject: Judgment[]
    /** 주체가 후보 기준으로 지니는 신살들. */
    subjectForCandidate: Judgment[]
  }
  /** 겉궁합(연주)/속궁합(일지) 분류 요약. */
  palace: Judgment
}
