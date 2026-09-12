/** 사주팔자 도메인 상수. */
export declare const STEMS: readonly ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export declare const BRANCHES: readonly ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export declare const ELEMENTS: readonly ["wood", "fire", "earth", "metal", "water"];
export declare const STEM_INDEX: Record<(typeof STEMS)[number], number>;
export declare const BRANCH_INDEX: Record<(typeof BRANCHES)[number], number>;
export declare const ELEMENT_INDEX: Record<(typeof ELEMENTS)[number], number>;
export declare const STEM_ELEMENTS: Record<typeof STEMS[number], typeof ELEMENTS[number]>;
export declare const BRANCH_ELEMENTS: Record<typeof BRANCHES[number], typeof ELEMENTS[number]>;
/**
 * 천간 음양(陰陽) — 甲丙戊庚壬 = 양(yang), 乙丁己辛癸 = 음(yin).
 * 십성(十星) 판정에 쓰인다.
 */
export declare const STEM_YINYANG: Record<typeof STEMS[number], "yang" | "yin">;
/**
 * 지장간(地藏干) — 각 지지에 숨어 있는 천간.
 * 첫 번째 원소가 주기(主氣).
 */
export declare const HIDDEN_STEMS: Record<typeof BRANCHES[number], readonly (typeof STEMS[number])[]>;
/**
 * 천간합(天干合) — 합이 되는 천간 쌍.
 * Set<string> 배열로 표현.
 */
export declare const STEM_COMBINATIONS: ReadonlyArray<Readonly<Set<typeof STEMS[number]>>>;
/**
 * 지지육합(地支六合) — 합이 되는 지지 쌍.
 */
export declare const BRANCH_LIUHE: ReadonlyArray<Readonly<Set<typeof BRANCHES[number]>>>;
/**
 * 지지충(地支冲) — 충이 되는 지지 쌍.
 */
export declare const BRANCH_CLASH: ReadonlyArray<Readonly<Set<typeof BRANCHES[number]>>>;
/**
 * 지지해(地支害) — 해가 되는 지지 쌍.
 */
export declare const BRANCH_HARM: ReadonlyArray<Readonly<Set<typeof BRANCHES[number]>>>;
/** 오행 상생(相生) — A generates B. */
export declare const GENERATES: Record<typeof ELEMENTS[number], typeof ELEMENTS[number]>;
/** 오행 상극(相克) — A controls B. */
export declare const CONTROLS: Record<typeof ELEMENTS[number], typeof ELEMENTS[number]>;
/** 오행 상극(被克) — A is controlled by B. */
export declare const CONTROLLED_BY: Record<typeof ELEMENTS[number], typeof ELEMENTS[number]>;
//# sourceMappingURL=constants.d.ts.map