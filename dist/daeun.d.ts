/**
 * 대운(大運)·세운(歲運) 계산.
 *
 * 대운 규칙(고전 표준 — 자평 계열 공통):
 *  - 방향: 양간(陽干) 연주 + 남자, 또는 음간(陰干) 연주 + 여자 → 순행(順行).
 *    그 반대 조합 → 역행(逆行). (양남음녀 순행 — 유파 이견 없음)
 *  - 대운수: 출생 순간부터 다음 절(節, 순행) 또는 직전 절(역행)까지의
 *    실제 경과일 ÷ 3 = 시작 나이(년). 3일=1년, 1일=4개월 환산.
 *    반올림 정책은 유파마다 갈리므로 여기서는 소수(float)로 그대로 반환하고,
 *    표기 단계에서 정책을 정하게 한다.
 *  - 대운 간지: 월주(月柱)에서 60갑자를 순행 +1 / 역행 −1씩 진행.
 *
 * 시간 프레임: 절(節) 경계 비교는 출생 절대순간(true-UTC) vs 절기 UTC —
 * bazi()의 월주 판정과 동일한 축을 쓴다(진태양시 보정은 여기 관여하지 않음).
 *
 * 출생 시각(hour)을 모르면 00:00으로 계산되어 대운수에 최대 ±8시간(약 ±0.1년,
 * 약 1.3개월) 오차가 생길 수 있다 — 호출부에서 안내할 것.
 */
import { STEMS, BRANCHES } from "./constants.js";
import type { BirthInput } from "./types.js";
export type Gender = "male" | "female";
export interface DaeunPillar {
    /** 1부터 시작하는 대운 순번 */
    order: number;
    /** 이 대운이 시작되는 만 나이(년, 소수). 표기 반올림은 호출부 정책. */
    startAge: number;
    /** 이 대운이 시작되는 그레고리력 연도(출생연도 + floor(startAge)) — 표기 보조용 */
    startYear: number;
    stem: typeof STEMS[number];
    branch: typeof BRANCHES[number];
}
export interface Daeun {
    /** 순행(順行) 여부 — 양남음녀 = true */
    forward: boolean;
    /** 대운수(첫 대운 시작 만 나이, 년 단위 소수). days/3 그대로. */
    startAge: number;
    /** 대운수 환산 근거: 출생↔절(節) 경계까지 경과일(소수) */
    boundaryDays: number;
    pillars: DaeunPillar[];
}
/**
 * 대운(大運)을 계산한다.
 *
 * @param input - bazi()와 동일한 출생 입력 + gender
 * @param count - 뽑을 대운 개수(기본 10 — 약 100년)
 */
export declare function daeun(input: BirthInput & {
    gender: Gender;
}, count?: number): Daeun;
export interface SeunYear {
    /** 그레고리력 연도 라벨. 실제 경계는 그 해 입춘(立春)부터임. */
    year: number;
    stem: typeof STEMS[number];
    branch: typeof BRANCHES[number];
}
/**
 * 세운(歲運) — 연도별 간지. 1984 = 甲子 기준.
 * 각 항목의 유효 구간은 "그 해 입춘 ~ 이듬해 입춘"이다(연초 입춘 전은 전년 세운).
 */
export declare function seun(startYear: number, count?: number): SeunYear[];
//# sourceMappingURL=daeun.d.ts.map