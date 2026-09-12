/**
 * 사주팔자 계산 엔진.
 */
export declare const EPOCH_ORD = 719163;
export interface PillarIndex {
    stemIdx: number;
    branchIdx: number;
}
export interface BaziIndices {
    year: PillarIndex;
    month: PillarIndex;
    day: PillarIndex;
    hour: PillarIndex;
}
/**
 * 프레임을 분리해 연·월·일·시 사주의 천간·지지 인덱스를 계산한다.
 *
 * 시간 기준(2026-09 재설계): 각 기둥이 서로 다른 시간 프레임을 쓴다.
 *  - 일주(日柱)  = 로컬 civil 날짜(dateOrd) — 진태양시로 굴리지 않는다(v1).
 *  - 시주(時柱)  = 로컬 진태양시 시각(localHour) — 경도·균시차 보정이 여기에만 적용.
 *  - 월·연주     = 출생 절대순간(utcSec, true-UTC) vs 절기 UTC 비교.
 *
 * @param dateOrd  - `toOrdinal(year, month, day)`(로컬 civil 날짜)
 * @param localHour - 0~24 로컬 시각(소수 가능, 진태양시 보정 반영). 시주 지지·야자시 판정용.
 * @param utcSec    - 출생 절대순간(Unix epoch 초, UTC). 절기(월·연) 판정용.
 */
export declare function baziVectorized(dateOrd: number, localHour: number, utcSec: number): BaziIndices;
//# sourceMappingURL=engine.d.ts.map