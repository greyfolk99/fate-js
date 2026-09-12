/** 궁합(宮合) 룰 전용 명리 상수. 계산이 표로 딱 떨어지는 관계만 담는다. */
/**
 * 천간충(天干沖) — 충이 되는 천간 쌍.
 * 甲庚·乙辛·丙壬·丁癸. (戊己 중앙토는 충하지 않는다.)
 */
export const STEM_CLASH = [
    new Set(["甲", "庚"]),
    new Set(["乙", "辛"]),
    new Set(["丙", "壬"]),
    new Set(["丁", "癸"]),
];
/**
 * 삼합(三合) — 세 지지가 모여 하나의 오행 국을 이룬다.
 * 두 글자만 모여도 왕지(가운데)를 포함하면 반합(半合)으로 약하게 성립.
 */
export const BRANCH_SAMHAP = [
    { branches: ["申", "子", "辰"], king: "子", element: "water" },
    { branches: ["亥", "卯", "未"], king: "卯", element: "wood" },
    { branches: ["寅", "午", "戌"], king: "午", element: "fire" },
    { branches: ["巳", "酉", "丑"], king: "酉", element: "metal" },
];
/**
 * 방합(方合) — 같은 방위(계절)의 세 지지가 모여 이루는 국.
 * 삼합보다 결속은 약하지만 오행 세력을 크게 키운다.
 */
export const BRANCH_BANGHAP = [
    { branches: ["寅", "卯", "辰"], king: "卯", element: "wood" },
    { branches: ["巳", "午", "未"], king: "午", element: "fire" },
    { branches: ["申", "酉", "戌"], king: "酉", element: "metal" },
    { branches: ["亥", "子", "丑"], king: "子", element: "water" },
];
/**
 * 형(刑) — 삼형·상형·자형.
 * 삼형은 세 지지가 다 모일 때 완성되나, 두 지지만으로도 형이 성립한다.
 */
export const BRANCH_HYUNG = [
    { branches: ["寅", "巳", "申"], kind: "samhyung", name: "무은지형(無恩之刑)" },
    { branches: ["丑", "戌", "未"], kind: "samhyung", name: "시세지형(恃勢之刑)" },
    { branches: ["子", "卯"], kind: "sanghyung", name: "무례지형(無禮之刑)" },
    { branches: ["辰", "辰"], kind: "jahyung", name: "진진자형(辰辰自刑)" },
    { branches: ["午", "午"], kind: "jahyung", name: "오오자형(午午自刑)" },
    { branches: ["酉", "酉"], kind: "jahyung", name: "유유자형(酉酉自刑)" },
    { branches: ["亥", "亥"], kind: "jahyung", name: "해해자형(亥亥自刑)" },
];
/**
 * 파(破) — 육파(六破). 서로 깨뜨리는 지지 쌍.
 * 子酉·午卯·申巳·寅亥·辰丑·戌未.
 */
export const BRANCH_PA = [
    new Set(["子", "酉"]),
    new Set(["午", "卯"]),
    new Set(["申", "巳"]),
    new Set(["寅", "亥"]),
    new Set(["辰", "丑"]),
    new Set(["戌", "未"]),
];
/**
 * 원진(怨嗔) — 서로 미워하는 지지 쌍. 애증·불화.
 * 子未·丑午·寅酉·卯申·辰亥·巳戌.
 */
export const BRANCH_WONJIN = [
    new Set(["子", "未"]),
    new Set(["丑", "午"]),
    new Set(["寅", "酉"]),
    new Set(["卯", "申"]),
    new Set(["辰", "亥"]),
    new Set(["巳", "戌"]),
];
//# sourceMappingURL=constants.js.map