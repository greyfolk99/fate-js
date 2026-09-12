/** 사주팔자 도메인 상수. */
export const STEMS = [
    "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸",
];
export const BRANCHES = [
    "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
];
export const ELEMENTS = ["wood", "fire", "earth", "metal", "water"];
export const STEM_INDEX = Object.fromEntries(STEMS.map((s, i) => [s, i]));
export const BRANCH_INDEX = Object.fromEntries(BRANCHES.map((b, i) => [b, i]));
export const ELEMENT_INDEX = Object.fromEntries(ELEMENTS.map((e, i) => [e, i]));
export const STEM_ELEMENTS = {
    "甲": "wood", "乙": "wood",
    "丙": "fire", "丁": "fire",
    "戊": "earth", "己": "earth",
    "庚": "metal", "辛": "metal",
    "壬": "water", "癸": "water",
};
export const BRANCH_ELEMENTS = {
    "子": "water", "丑": "earth", "寅": "wood", "卯": "wood",
    "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
    "申": "metal", "酉": "metal", "戌": "earth", "亥": "water",
};
/**
 * 천간 음양(陰陽) — 甲丙戊庚壬 = 양(yang), 乙丁己辛癸 = 음(yin).
 * 십성(十星) 판정에 쓰인다.
 */
export const STEM_YINYANG = {
    "甲": "yang", "乙": "yin",
    "丙": "yang", "丁": "yin",
    "戊": "yang", "己": "yin",
    "庚": "yang", "辛": "yin",
    "壬": "yang", "癸": "yin",
};
/**
 * 지장간(地藏干) — 각 지지에 숨어 있는 천간.
 * 첫 번째 원소가 주기(主氣).
 */
export const HIDDEN_STEMS = {
    "子": ["癸"],
    "丑": ["己", "癸", "辛"],
    "寅": ["甲", "丙", "戊"],
    "卯": ["乙"],
    "辰": ["戊", "乙", "癸"],
    "巳": ["丙", "戊", "庚"],
    "午": ["丁", "己"],
    "未": ["己", "丁", "乙"],
    "申": ["庚", "壬", "戊"],
    "酉": ["辛"],
    "戌": ["戊", "辛", "丁"],
    "亥": ["壬", "甲"],
};
/**
 * 천간합(天干合) — 합이 되는 천간 쌍.
 * Set<string> 배열로 표현.
 */
export const STEM_COMBINATIONS = [
    new Set(["甲", "己"]),
    new Set(["乙", "庚"]),
    new Set(["丙", "辛"]),
    new Set(["丁", "壬"]),
    new Set(["戊", "癸"]),
];
/**
 * 지지육합(地支六合) — 합이 되는 지지 쌍.
 */
export const BRANCH_LIUHE = [
    new Set(["子", "丑"]),
    new Set(["寅", "亥"]),
    new Set(["卯", "戌"]),
    new Set(["辰", "酉"]),
    new Set(["巳", "申"]),
    new Set(["午", "未"]),
];
/**
 * 지지충(地支冲) — 충이 되는 지지 쌍.
 */
export const BRANCH_CLASH = [
    new Set(["子", "午"]),
    new Set(["丑", "未"]),
    new Set(["寅", "申"]),
    new Set(["卯", "酉"]),
    new Set(["辰", "戌"]),
    new Set(["巳", "亥"]),
];
/**
 * 지지해(地支害) — 해가 되는 지지 쌍.
 */
export const BRANCH_HARM = [
    new Set(["子", "未"]),
    new Set(["丑", "午"]),
    new Set(["寅", "巳"]),
    new Set(["卯", "辰"]),
    new Set(["申", "亥"]),
    new Set(["酉", "戌"]),
];
/** 오행 상생(相生) — A generates B. */
export const GENERATES = {
    "wood": "fire",
    "fire": "earth",
    "earth": "metal",
    "metal": "water",
    "water": "wood",
};
/** 오행 상극(相克) — A controls B. */
export const CONTROLS = {
    "wood": "earth",
    "earth": "water",
    "water": "fire",
    "fire": "metal",
    "metal": "wood",
};
/** 오행 상극(被克) — A is controlled by B. */
export const CONTROLLED_BY = {
    "earth": "wood",
    "water": "earth",
    "fire": "water",
    "metal": "fire",
    "wood": "metal",
};
//# sourceMappingURL=constants.js.map