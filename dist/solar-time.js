/**
 * 진태양시(眞太陽時) 보정.
 *
 * 시계로 적힌 표준시(예: KST)를 그 지역의 실제 태양시로 바꾼다:
 *   진태양시 = 지방평균시(경도 보정) + 균시차(Equation of Time)
 *     · 경도 보정 : 시계 시각 − (표준자오선 − 출생지경도) × 4분
 *     · 균시차    : 지구 공전 이심률·자전축 기울기로 생기는 태양시-평균시 오차(±약 16분)
 * 사주 시주(時柱)는 태양의 실제 위치로 정해지므로, 경계(예: 03:00) 근처면 이 보정이 시주를 바꾼다.
 */
import { toOrdinal } from "./date-util.js";
/**
 * 균시차(분). 양수 = 실제 태양시가 평균시보다 빠름.
 * NOAA 근사식(정확도 ±약 0.5분 — 시주 판정엔 충분).
 */
export function equationOfTime(year, month, day) {
    const dayOfYear = toOrdinal(year, month, day) - toOrdinal(year, 1, 1) + 1;
    const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
    return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}
/**
 * 표준시 → 진태양시 보정량(분). 시계 시각에 이 값을 더하면 진태양시.
 * @param longitude 출생지 경도(동경 양수)
 * @param standardMeridian 표준시 자오선(동경). KST=135.
 * @param includeEot 균시차 포함 여부.
 */
export function solarCorrectionMinutes(year, month, day, longitude, standardMeridian, includeEot) {
    const longitudeMin = (longitude - standardMeridian) * 4; // 1° = 4분
    const eot = includeEot ? equationOfTime(year, month, day) : 0;
    return longitudeMin + eot;
}
//# sourceMappingURL=solar-time.js.map