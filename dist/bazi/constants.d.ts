/**
 * 1인 원국(原局) 파생 상수 — 십이운성(十二運星)·십이신살(十二神殺).
 * 문헌 대조로 검증한 값만 담는다. 유파가 갈리는 항목은 주석에 남긴다.
 */
import { STEMS, BRANCHES } from "../constants.js";
type Stem = typeof STEMS[number];
type Branch = typeof BRANCHES[number];
/** 십이운성 12단계 — 장생지에서 진행 순서. */
export declare const TWELVE_STAGES: readonly string[];
/**
 * 일간별 장생지(長生地).
 * 甲亥·乙午·丙寅·丁酉·戊寅·己酉·庚巳·辛子·壬申·癸卯 (화토동법).
 * 검증: 연해자평·자평진전 십이운성표 만장일치(화토동법 기준).
 */
export declare const JANGSAENG_BY_STEM: Record<Stem, Branch>;
/**
 * 일간 기준 지지 하나의 십이운성 단계를 구한다.
 * 양간 순행(+), 음간 역행(-).
 */
export declare function twelveStage(dayStem: Stem, branch: Branch): string;
/** 십이신살 12종 — 겁살부터 순서(지지 순환과 1:1 대응). */
export declare const TWELVE_SINSAL: readonly string[];
/**
 * 기준지 `ref` 를 기준으로 지지 `branch` 가 갖는 십이신살 명칭.
 * 지살(index 3) = 국의 장생지에 놓이도록 정렬한다.
 */
export declare function twelveSinsal(ref: Branch, branch: Branch): string;
export {};
//# sourceMappingURL=constants.d.ts.map