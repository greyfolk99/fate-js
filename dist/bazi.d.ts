import type { Bazi, BirthInput, Pillar } from "./types.js";
/**
 * 생년월일시로 사주팔자 사주(四柱)를 계산한다.
 *
 * 시간 프레임(2026-09 재설계): 각 기둥이 다른 프레임을 쓴다.
 *  - 월·연주 = 출생 **절대순간(UTC)** vs 절기 UTC. 입력 로컬시각을 UTC오프셋으로 변환.
 *    (오프셋은 timezone(IANA) 자동 해석 또는 utcOffsetMinutes 수동 지정 — 정확히 하나, 암묵 기본값 없음.)
 *  - 시주 = 로컬 **진태양시**(경도+균시차 보정). 보정은 시주에만 적용, 절대순간·일주는 안 건드림.
 *  - 일주 = 로컬 civil 날짜 + 야자시. (진태양시로 날짜를 굴리지 않는다 — v1.)
 * 진태양시를 끄려면 input.timeBasis='standard' 또는 setSolarConfig({applySolarTime:false}).
 *
 * @param input - 날짜·시간·오프셋·보정 옵션
 * @returns 연·월·일·시 사주(四柱) 객체
 */
export declare function bazi(input: BirthInput & {
    hour: number;
}): Bazi & {
    hour: Pillar;
};
export declare function bazi(input: BirthInput): Bazi;
//# sourceMappingURL=bazi.d.ts.map