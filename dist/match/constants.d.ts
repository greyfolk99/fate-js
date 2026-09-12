/** 궁합(宮合) 룰 전용 명리 상수. 계산이 표로 딱 떨어지는 관계만 담는다. */
import type { STEMS, BRANCHES, ELEMENTS } from "../constants.js";
type Stem = typeof STEMS[number];
type Branch = typeof BRANCHES[number];
type Element = typeof ELEMENTS[number];
/**
 * 천간충(天干沖) — 충이 되는 천간 쌍.
 * 甲庚·乙辛·丙壬·丁癸. (戊己 중앙토는 충하지 않는다.)
 */
export declare const STEM_CLASH: ReadonlyArray<Readonly<Set<Stem>>>;
/** 삼합·방합처럼 오행 국(局)을 만드는 지지 조합. */
export interface BranchGroup {
    /** 국을 이루는 지지들. */
    branches: readonly Branch[];
    /** 왕지(旺支) — 이 글자가 있어야 반합이 성립. */
    king: Branch;
    /** 국이 만들어내는 오행. */
    element: Element;
}
/**
 * 삼합(三合) — 세 지지가 모여 하나의 오행 국을 이룬다.
 * 두 글자만 모여도 왕지(가운데)를 포함하면 반합(半合)으로 약하게 성립.
 */
export declare const BRANCH_SAMHAP: readonly BranchGroup[];
/**
 * 방합(方合) — 같은 방위(계절)의 세 지지가 모여 이루는 국.
 * 삼합보다 결속은 약하지만 오행 세력을 크게 키운다.
 */
export declare const BRANCH_BANGHAP: readonly BranchGroup[];
/** 형(刑)의 종류. */
export type HyungKind = "samhyung" | "sanghyung" | "jahyung";
export interface HyungRule {
    branches: readonly Branch[];
    kind: HyungKind;
    /** 전통 명칭. */
    name: string;
}
/**
 * 형(刑) — 삼형·상형·자형.
 * 삼형은 세 지지가 다 모일 때 완성되나, 두 지지만으로도 형이 성립한다.
 */
export declare const BRANCH_HYUNG: readonly HyungRule[];
/**
 * 파(破) — 육파(六破). 서로 깨뜨리는 지지 쌍.
 * 子酉·午卯·申巳·寅亥·辰丑·戌未.
 */
export declare const BRANCH_PA: ReadonlyArray<Readonly<Set<Branch>>>;
/**
 * 원진(怨嗔) — 서로 미워하는 지지 쌍. 애증·불화.
 * 子未·丑午·寅酉·卯申·辰亥·巳戌.
 */
export declare const BRANCH_WONJIN: ReadonlyArray<Readonly<Set<Branch>>>;
export {};
//# sourceMappingURL=constants.d.ts.map