/** 경도·표준자오선 등 각도값: −180~180 사이 유한 실수. */
export declare function assertLongitude(v: number, name: string): void;
/**
 * proleptic Gregorian 실존 날짜인지 확인한다(2월 30일·4월 31일 등 거부).
 * ordinal 왕복(toOrdinal→fromOrdinal)이 입력과 일치해야 실존 날짜다.
 */
export declare function assertValidDate(year: number, month: number, day: number): void;
/**
 * 검증 대상 입력의 최소 형태(BirthInput 부분집합).
 * 타임존 지정(timezone/utcOffsetMinutes)은 BirthInput에선 XOR 필수지만 여기선 둘 다
 * optional — 누락 검증(아래 throw)을 위해 "아직 완전하지 않은 입력"도 타입 캐스팅 없이
 * 이 함수에 넣을 수 있어야 한다.
 */
export interface ValidatableBirthInput {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    longitude?: number;
    timeBasis?: string;
    utcOffsetMinutes?: number;
    timezone?: string;
}
/**
 * 출생 입력 전체 검증. 날짜 실존성 + hour 0–23 정수 + minute 0–59 정수 +
 * minute 단독 지정 금지 + longitude −180~180 유한값.
 * longitude 범위 검증은 진태양시 자정 보정 while 루프의 무한 루프도 함께 막는다.
 */
export declare function assertValidBirthInput(input: ValidatableBirthInput): void;
//# sourceMappingURL=validate.d.ts.map