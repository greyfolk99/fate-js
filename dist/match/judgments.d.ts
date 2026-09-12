/**
 * 궁합 판단(判斷) 추출 — 십성·납음·신살·겉속궁합 분류.
 *
 * 12관계(rules.ts)와 별개의 결정론 파생값을 뽑는다. 유파에 따라 판정이
 * 갈리는 곳은 일지 기준을 1차로 삼고 basis 필드·주석에 대안을 남긴다.
 * 신강신약·용신처럼 유파별 정량화가 필요한 값은 다루지 않는다.
 */
import type { STEMS, BRANCHES, ELEMENTS } from "../constants.js";
import type { Bazi } from "../types.js";
import type { MatchSubject } from "./types.js";
import type { TenGod, TenGodCount, MatchJudgments } from "./judgments-types.js";
type Stem = typeof STEMS[number];
type Branch = typeof BRANCHES[number];
type Element = typeof ELEMENTS[number];
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
export declare function tenGod(dayMaster: Stem, other: Stem): TenGod;
/** 한 사주의 천간 4자(시 미상이면 3자)를 일간 기준 십성 분포로 집계. */
export declare function tenGodDistribution(bazi: Bazi): TenGodCount;
/**
 * 간지 두 글자(예: 甲子)의 납음을 구한다.
 *
 * 실제 사주의 간지는 언제나 양간-양지·음간-음지로 짝이 맞아 60간지에 든다.
 * 짝이 어긋나는(음양 불일치) 불가능한 조합이면 60간지에 없으므로 null.
 */
export declare function nayinOf(stem: Stem, branch: Branch): {
    name: string;
    element: Element;
} | null;
/**
 * 두 사주의 판단 파생값을 뽑는다. subject 관점을 1차로 기술한다.
 * `facts` 는 matchSheet 의 12관계 결과 — 겉속궁합 집계에 재활용.
 */
export declare function judgeMatch(subject: MatchSubject, candidate: MatchSubject, facts: import("./types.js").MatchFact[]): Omit<MatchJudgments, "yongsinSupply">;
export {};
//# sourceMappingURL=judgments.d.ts.map