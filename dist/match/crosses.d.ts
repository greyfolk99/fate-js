/**
 * 궁합 교차 판단 — 두 사주의 일간·일지·년지·일주를 맞대어 나오는 결정론 사실.
 *
 * 원칙: "무엇이 있어서/없어서 무엇이다" 형태의 사실만 담는다. 점수·해석·가중·
 * 정통/통속 등급은 넣지 않는다(그건 하류 LLM/ML 의 몫). 각 규칙의 문헌 출처·
 * 유파는 아래 주석으로만 남기고, 시트 데이터에는 사실만 싣는다.
 */
import type { Bazi } from "../types.js";
import type { Judgment } from "./judgments-types.js";
/** 궁합 교차 판단 묶음. */
export interface MatchCrosses {
    /** 상대 일간을 주체 배우자궁(일지)에 놓은 십이운성. */
    spouseGungStageForSubject: Judgment;
    /** 주체 일간을 후보 배우자궁(일지)에 놓은 십이운성. */
    spouseGungStageForCandidate: Judgment;
    /** 후보 일지가 주체 순중공망에 드는가. */
    voidForSubject: Judgment;
    /** 주체 일지가 후보 순중공망에 드는가. */
    voidForCandidate: Judgment;
    /** 두 일주 대조(동일일주·천간동·일지동). */
    dayPillarMatch: Judgment;
    /** 주체 년지 기준 후보 지지의 십이신살. */
    sinsalCrossForSubject: Judgment;
    /** 후보 년지 기준 주체 지지의 십이신살. */
    sinsalCrossForCandidate: Judgment;
}
export declare function crossJudgments(subject: Bazi, candidate: Bazi): MatchCrosses;
//# sourceMappingURL=crosses.d.ts.map