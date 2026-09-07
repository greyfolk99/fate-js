import type { ELEMENTS } from "../constants.js"
import type { BaziTable } from "../types.js"
import type { CompatJudgments } from "./judgments-types.js"

type Element = typeof ELEMENTS[number]

/** 관계의 방향 성질 — 화합(harmony)/충돌(clash)/중립(neutral). 판단이 아니라 분류 태그. */
export type Polarity = "harmony" | "clash" | "neutral"

/** 기둥 위치. */
export type PillarName = "year" | "month" | "day" | "hour"

/** 관계의 분류 축. */
export type FactCategory = "stem" | "branch" | "element" | "hidden"

/**
 * 관계 엣지 하나 — `주체글자(궁) —관계— 후보글자(궁)`.
 *
 * 점수가 아니라 "무엇이 무엇과 어떤 관계인가"를 그대로 구조화한다.
 * 정형이라 LLM 프롬프트·ML 인풋 양쪽에 균일하게 쓰인다.
 */
export interface CompatEdge {
  subject: { glyph: string; pillar: PillarName }
  object: { glyph: string; pillar: PillarName }
  /** 삼합·방합이 만들어내는 오행 국 등 부가값. */
  element?: Element
}

/**
 * 하나의 관계 유형에 대한 결과.
 *
 * 관계가 없어도 `present:false` 로 항상 한 줄 남긴다(인풋 차원 고정).
 * 종합 점수는 담지 않는다 — 그건 하류 LLM 의 몫.
 */
export interface CompatFact {
  /** 안정적 키(정형 인풋의 컬럼명). 예: "branch_yukhap". */
  id: string
  category: FactCategory
  /** 관계명. 예: "지지 육합". */
  label: string
  /** 이 관계가 하나라도 성립하는가. */
  present: boolean
  polarity: Polarity
  /** 성립한 엣지 수(객관적 사실). */
  count: number
  /** 성립한 관계 엣지들. */
  edges: CompatEdge[]
  /** 관여한 기둥 위치들의 합집합(양쪽 사주 통틀어). */
  pillars: PillarName[]
  /** 문헌 근거 해석 문장 — LLM 입력·UI 노출용. */
  statement: string
  /** 근거 출처 태그(문헌/전통명). */
  source: string
  /** 엣지로 안 떨어지는 부가 사실(오행 보완 대상 등). */
  detail?: Record<string, string | number | string[]>
}

/** 궁합 계산 입력 — 사주 하나 + 부가 정보. */
export interface CompatSubject {
  bazi: BaziTable
  /** 배우자성(재/관) 판정에 필요. v1 룰에는 아직 미사용. */
  gender?: "male" | "female"
}

/**
 * 두 사주의 궁합 관계 테이블.
 *
 * 시스템(결정론 코드)으로 구할 수 있는 명리 관계를 빠짐없이 정형 포맷으로
 * 담는다. 소비자(LLM 프롬프트/ML 인풋)는 이 목록을 그대로 읽는다.
 */
export interface CompatTable {
  schemaVersion: string
  subject: CompatSubject
  candidate: CompatSubject
  facts: CompatFact[]
  /**
   * 결정론 판단 파생값 — 십성·납음·신살·겉속궁합 분류.
   * 12관계(facts)와 별개 섹션. 종합 점수는 담지 않는다.
   */
  judgments: CompatJudgments
}
