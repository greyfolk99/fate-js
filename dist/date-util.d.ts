/**
 * ordinal 날짜 유틸리티.
 * Proleptic Gregorian Calendar 기준. 1년 1월 1일 = ordinal 1.
 */
/**
 * (year, month, day) → ordinal. 1년 1월 1일 = 1.
 */
export declare function toOrdinal(year: number, month: number, day: number): number;
/**
 * ordinal → { year, month, day }. 1년 1월 1일 = 1.
 */
export declare function fromOrdinal(ord: number): {
    year: number;
    month: number;
    day: number;
};
//# sourceMappingURL=date-util.d.ts.map