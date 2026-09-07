/**
 * natal-2 표시사전(display glossary) — 번역 지원.
 *
 * 원칙: natal-2 "데이터"는 한자 코드(머신키) 한 벌만 쓴다(한글·영문 혼용 금지).
 * 사람이 읽을 한글/영문은 "데이터"가 아니라 이 사전에서 표시 시점에 룩업한다.
 *   t("將星殺")        → "장성살"   (기본 ko)
 *   t("將星殺", "en")  → "jangseongsal"
 *   label("relationKind", "刑", "en") → "hyeong (punishment)"
 * 코드는 명리 원전 그대로이므로 LLM/ML은 코드를 직접 읽고, UI만 t()로 번역한다.
 */

export type Lang = "ko" | "en" | "hanja"

export interface Term { ko: string; en: string }

/** enum 이름 → { 한자코드 → {ko,en} }. schema/enums.json 도메인과 1:1. */
export const GLOSSARY: Record<string, Record<string, Term>> = {
  element: {
    "木": { ko: "목", en: "wood" }, "火": { ko: "화", en: "fire" }, "土": { ko: "토", en: "earth" },
    "金": { ko: "금", en: "metal" }, "水": { ko: "수", en: "water" },
  },
  yinyang: { "陰": { ko: "음", en: "yin" }, "陽": { ko: "양", en: "yang" } },
  tenGod: {
    "比肩": { ko: "비견", en: "bigyeon (peer)" }, "劫財": { ko: "겁재", en: "geopjae (rob wealth)" },
    "食神": { ko: "식신", en: "siksin (eating god)" }, "傷官": { ko: "상관", en: "sanggwan (hurting officer)" },
    "偏財": { ko: "편재", en: "pyeonjae (indirect wealth)" }, "正財": { ko: "정재", en: "jeongjae (direct wealth)" },
    "偏官": { ko: "편관", en: "pyeongwan (indirect officer)" }, "正官": { ko: "정관", en: "jeonggwan (direct officer)" },
    "偏印": { ko: "편인", en: "pyeonin (indirect seal)" }, "正印": { ko: "정인", en: "jeongin (direct seal)" },
  },
  tenGodGroup: {
    "比劫": { ko: "비겁", en: "bigyeop (peers/rivals)" }, "印星": { ko: "인성", en: "inseong (seal/resource)" },
    "食傷": { ko: "식상", en: "siksang (output)" }, "財星": { ko: "재성", en: "jaeseong (wealth)" },
    "官星": { ko: "관성", en: "gwanseong (officer/authority)" },
  },
  twelveStage: {
    "長生": { ko: "장생", en: "jangsaeng" }, "沐浴": { ko: "목욕", en: "mogyok" }, "冠帶": { ko: "관대", en: "gwandae" },
    "臨官": { ko: "임관", en: "imgwan" }, "帝旺": { ko: "제왕", en: "jewang" }, "衰": { ko: "쇠", en: "soe" },
    "病": { ko: "병", en: "byeong" }, "死": { ko: "사", en: "sa" }, "墓": { ko: "묘", en: "myo" },
    "絕": { ko: "절", en: "jeol" }, "胎": { ko: "태", en: "tae" }, "養": { ko: "양", en: "yang" },
  },
  hiddenStemRole: {
    "餘氣": { ko: "여기", en: "yeogi (residual qi)" }, "中氣": { ko: "중기", en: "junggi (middle qi)" },
    "正氣": { ko: "정기", en: "jeonggi (main qi)" },
  },
  relationKind: {
    "天干合": { ko: "천간합", en: "cheongan-hap (stem combine)" }, "天干沖": { ko: "천간충", en: "cheongan-chung (stem clash)" },
    "地支六合": { ko: "지지육합", en: "jiji-yukhap (branch six-combine)" }, "地支三合": { ko: "지지삼합", en: "jiji-samhap (branch triple-combine)" },
    "地支三合半合": { ko: "지지삼합반합", en: "jiji-samhap-banhap (triple half-combine)" }, "地支方合半合": { ko: "지지방합반합", en: "jiji-banghap-banhap (directional half-combine)" }, "地支方合": { ko: "지지방합", en: "jiji-banghap (branch directional-combine)" },
    "地支沖": { ko: "지지충", en: "jiji-chung (branch clash)" }, "刑": { ko: "형", en: "hyeong (punishment)" },
    "破": { ko: "파", en: "pa (break)" }, "害": { ko: "해", en: "hae (harm)" }, "怨嗔": { ko: "원진", en: "wonjin (mutual resentment)" },
  },
  season: {
    "春": { ko: "봄", en: "spring" }, "夏": { ko: "여름", en: "summer" }, "秋": { ko: "가을", en: "autumn" }, "冬": { ko: "겨울", en: "winter" },
  },
  strengthResult: {
    "身強": { ko: "신강", en: "singang (strong day-master)" }, "身弱": { ko: "신약", en: "sinyak (weak day-master)" },
    "中和": { ko: "중화", en: "junghwa (balanced)" },
  },
  strengthRule: {
    "抑扶": { ko: "억부", en: "eokbu (restrain/support)" }, "調候": { ko: "조후", en: "johu (climatic)" },
    "病藥": { ko: "병약", en: "byeongyak (ailment/remedy)" }, "通關": { ko: "통관", en: "tonggwan (mediation)" },
    "專旺": { ko: "전왕", en: "jeonwang (dominant)" },
  },
  gyeokgukBasis: {
    "月令本氣": { ko: "월령본기", en: "wollyeong-bongi (month-order main qi)" },
    "月令中氣": { ko: "월령중기", en: "wollyeong-junggi (month-order middle qi)" },
    "月令餘氣": { ko: "월령여기", en: "wollyeong-yeogi (month-order residual qi)" },
    "月令透出": { ko: "월령투출", en: "wollyeong-tuchul (month-order revealed)" },
  },
  twelveSinsal: {
    "劫殺": { ko: "겁살", en: "geopsal" }, "災殺": { ko: "재살", en: "jaesal" }, "天殺": { ko: "천살", en: "cheonsal" },
    "地殺": { ko: "지살", en: "jisal" }, "年殺": { ko: "연살", en: "yeonsal" }, "月殺": { ko: "월살", en: "wolsal" },
    "亡神殺": { ko: "망신살", en: "mangsinsal" }, "將星殺": { ko: "장성살", en: "jangseongsal" }, "攀鞍殺": { ko: "반안살", en: "banansal" },
    "驛馬殺": { ko: "역마살", en: "yeongmasal" }, "六害殺": { ko: "육해살", en: "yukhaesal" }, "華蓋殺": { ko: "화개살", en: "hwagaesal" },
  },
  specialSinsal: {
    "天乙貴人": { ko: "천을귀인", en: "cheoneul-gwiin" }, "文昌貴人": { ko: "문창귀인", en: "munchang-gwiin" },
    "紅艶殺": { ko: "홍염살", en: "hongyeomsal" }, "羊刃": { ko: "양인", en: "yangin" },
    "白虎大殺": { ko: "백호대살", en: "baekho-daesal" }, "魁罡": { ko: "괴강", en: "goegang" }, "鬼門關殺": { ko: "귀문관살", en: "gwimun-gwansal" },
  },
  polarity: { harmony: { ko: "조화", en: "harmony" }, clash: { ko: "충돌", en: "clash" } },
  pillarName: {
    year: { ko: "년주", en: "year" }, month: { ko: "월주", en: "month" }, day: { ko: "일주", en: "day" }, hour: { ko: "시주", en: "hour" },
  },
}

/** 코드 → {ko,en} 평면 역인덱스(전 enum 통합). 충돌 시 먼저 등록된 것 우선. */
const FLAT: Record<string, Term> = (() => {
  const out: Record<string, Term> = {}
  for (const dom of Object.values(GLOSSARY)) {
    for (const [code, term] of Object.entries(dom)) if (!(code in out)) out[code] = term
  }
  return out
})()

/** enum 지정 룩업. 없으면 코드 원문 반환(안전). */
export function label(enumName: string, code: string, lang: Lang = "ko"): string {
  if (lang === "hanja") return code
  return GLOSSARY[enumName]?.[code]?.[lang] ?? code
}

/** enum 몰라도 되는 전역 룩업 — natal-2 값 하나를 번역. 모르는 코드는 그대로. */
export function t(code: string, lang: Lang = "ko"): string {
  if (lang === "hanja") return code
  return FLAT[code]?.[lang] ?? code
}
