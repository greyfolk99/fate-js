import type { ELEMENTS } from "../constants.js";
import type { Subject } from "../types.js";
import type { MatchJudgments } from "./judgments-types.js";
type Element = typeof ELEMENTS[number];
/** 관계의 방향 성질 — 화합(harmony)/충돌(clash)/중립(neutral). 판단이 아니라 분류 태그. */
export type Polarity = "harmony" | "clash" | "neutral";
/** 기둥 위치. */
export type PillarName = "year" | "month" | "day" | "hour";
/** 관계의 분류 축. */
export type FactCategory = "stem" | "branch" | "element" | "hidden";
/**
 * 관계 엣지 하나 — `주체글자(궁) —관계— 후보글자(궁)`.
 *
 * 점수가 아니라 "무엇이 무엇과 어떤 관계인가"를 그대로 구조화한다.
 * 정형이라 LLM 프롬프트·ML 인풋 양쪽에 균일하게 쓰인다.
 */
export interface MatchEdge {
    subject: {
        glyph: string;
        pillar: PillarName;
    };
    object: {
        glyph: string;
        pillar: PillarName;
    };
    /** 삼합·방합이 만들어내는 오행 국 등 부가값. */
    element?: Element;
}
/**
 * 하나의 관계 유형에 대한 결과.
 *
 * 관계가 없어도 `present:false` 로 항상 한 줄 남긴다(인풋 차원 고정).
 * 종합 점수는 담지 않는다 — 그건 하류 LLM 의 몫.
 */
export interface MatchFact {
    /** 안정적 키(정형 인풋의 컬럼명). 예: "branch_yukhap". */
    id: string;
    category: FactCategory;
    /** 관계명. 예: "지지 육합". */
    label: string;
    /** 이 관계가 하나라도 성립하는가. */
    present: boolean;
    polarity: Polarity;
    /** 성립한 엣지 수(객관적 사실). */
    count: number;
    /** 성립한 관계 엣지들. */
    edges: MatchEdge[];
    /** 관여한 기둥 위치들의 합집합(양쪽 사주 통틀어). */
    pillars: PillarName[];
    /** 문헌 근거 해석 문장 — LLM 입력·UI 노출용. */
    statement: string;
    /** 근거 출처 태그(문헌/전통명). */
    source: string;
    /** 엣지로 안 떨어지는 부가 사실(오행 보완 대상 등). */
    detail?: Record<string, string | number | string[]>;
}
/** 궁합 계산 입력 — 코어 Subject 별칭(사주 한 벌 + 성별 선택). */
export type MatchSubject = Subject;
/** 관계 3렌즈(만나보살 확정): 合=끌림·정, 生=보완·상생, 沖=관계온도(방향X). */
export type Lens = "合" | "生" | "沖";
/** 한 렌즈에 묶인 교차 관계들. */
export interface LensGroup {
    lens: Lens;
    /** 이 렌즈에 속하는 관계 facts 전체(차원 고정 — present:false 포함). */
    facts: MatchFact[];
    /** 성립한(present) 관계 수 합. */
    activeCount: number;
    /** 성립한 엣지 총수. */
    edgeTotal: number;
}
/**
 * 두 사주의 궁합 시트 — 팩트 기반, 점수 없음.
 *
 * 시스템(결정론 코드)으로 구할 수 있는 명리 관계를 빠짐없이 정형 포맷으로
 * 담는다. 관계(12종+오행보완)를 3렌즈(合/生/沖)로 조직하고, 신살·납음·궁위·
 * 십성교차는 judgments(rationale 재료)로 별도. 소비자(LLM 프롬프트/ML 인풋)가
 * 그대로 읽는다. 원국 사실은 baziSheet(개인 시트)에 있다.
 */
export interface MatchSheet {
    schemaVersion: string;
    subject: MatchSubject;
    candidate: MatchSubject;
    /** 관계 fact 전체(차원 고정 — present:false 포함). */
    facts: MatchFact[];
    /** 관계 3렌즈. 항상 3개(合/生/沖) 고정 순서 — facts 를 렌즈로 묶은 뷰. */
    lenses: LensGroup[];
    /**
     * 결정론 판단 파생값 — 십성·납음·신살·겉속궁합 분류.
     * 12관계(facts)와 별개 섹션. 종합 점수는 담지 않는다.
     */
    judgments: MatchJudgments;
}
export {};
//# sourceMappingURL=types.d.ts.map