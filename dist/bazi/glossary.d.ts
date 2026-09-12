/**
 * baziSheet 표시사전(display glossary) — 번역 지원.
 *
 * 원칙: baziSheet "데이터"는 한자 코드(머신키) 한 벌만 쓴다(한글·영문 혼용 금지).
 * 사람이 읽을 한글/영문은 "데이터"가 아니라 이 사전에서 표시 시점에 룩업한다.
 *   t("將星殺")        → "장성살"   (기본 ko)
 *   t("將星殺", "en")  → "jangseongsal"
 *   label("relationKind", "刑", "en") → "hyeong (punishment)"
 * 코드는 명리 원전 그대로이므로 LLM/ML은 코드를 직접 읽고, UI만 t()로 번역한다.
 */
export type Lang = "ko" | "en" | "hanja";
export interface Term {
    ko: string;
    en: string;
}
/** enum 이름 → { 한자코드 → {ko,en} }. schema/enums.json 도메인과 1:1. */
export declare const GLOSSARY: Record<string, Record<string, Term>>;
/** enum 지정 룩업. 없으면 코드 원문 반환(안전). */
export declare function label(enumName: string, code: string, lang?: Lang): string;
/** enum 몰라도 되는 전역 룩업 — baziSheet 값 하나를 번역. 모르는 코드는 그대로. */
export declare function t(code: string, lang?: Lang): string;
//# sourceMappingURL=glossary.d.ts.map