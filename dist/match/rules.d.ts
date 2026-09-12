import type { STEMS, BRANCHES } from "../constants.js";
import type { Bazi } from "../types.js";
import type { MatchEdge, MatchFact, PillarName } from "./types.js";
type Stem = typeof STEMS[number];
type Branch = typeof BRANCHES[number];
interface Cell {
    name: PillarName;
    stem: Stem;
    branch: Branch;
}
/** 사주 4주(시 미상이면 3주)를 순회 가능한 셀 배열로 편다. */
export declare function cells(bazi: Bazi): Cell[];
/** pairwise 교차 룰 전체 실행. */
export declare function pairwiseRules(subject: Cell[], candidate: Cell[]): MatchFact[];
export declare function hyungRule(subject: Cell[], candidate: Cell[]): MatchFact;
export declare function samhapRule(subject: Cell[], candidate: Cell[]): MatchFact;
export declare function banghapRule(subject: Cell[], candidate: Cell[]): MatchFact;
export declare function hiddenAmhapRule(subject: Cell[], candidate: Cell[]): MatchFact;
export declare function elementComplementRule(subject: Cell[], candidate: Cell[]): MatchFact;
/** 엣지 하나를 `壬(일간) —관계— 丙(년간)` 형태로 렌더. */
export declare function renderEdge(label: string, edge: MatchEdge): string;
export {};
//# sourceMappingURL=rules.d.ts.map