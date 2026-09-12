/**
 * 입력 검증 유틸 — 잘못된 날짜·시간·경도를 계산 이전에 차단한다.
 *
 * TypeScript의 number 타입은 2월 30일·hour 24·NaN·Infinity 같은 값을 못 막는다.
 * public 진입점(bazi 등)에서 이 검증을 먼저 호출해, 조용한 오답 대신
 * 명시적 RangeError를 던지게 한다.
 */
import { fromOrdinal, toOrdinal } from "./date-util.js";
function assertFiniteInt(v, name) {
    if (!Number.isFinite(v) || !Number.isInteger(v)) {
        throw new RangeError(`${name}는 유한한 정수여야 합니다: ${String(v)}`);
    }
}
/** 경도·표준자오선 등 각도값: −180~180 사이 유한 실수. */
export function assertLongitude(v, name) {
    if (!Number.isFinite(v) || v < -180 || v > 180) {
        throw new RangeError(`${name}는 −180~180 사이 유한값이어야 합니다: ${String(v)}`);
    }
}
/**
 * proleptic Gregorian 실존 날짜인지 확인한다(2월 30일·4월 31일 등 거부).
 * ordinal 왕복(toOrdinal→fromOrdinal)이 입력과 일치해야 실존 날짜다.
 */
export function assertValidDate(year, month, day) {
    assertFiniteInt(year, "year");
    assertFiniteInt(month, "month");
    assertFiniteInt(day, "day");
    // date-util 계약: 1년 1월 1일 = ordinal 1. year ≤ 0은 지원 범위 밖.
    if (year < 1)
        throw new RangeError(`year는 1 이상이어야 합니다: ${year}`);
    if (month < 1 || month > 12)
        throw new RangeError(`month는 1–12여야 합니다: ${month}`);
    if (day < 1 || day > 31)
        throw new RangeError(`day는 1–31여야 합니다: ${day}`);
    const rt = fromOrdinal(toOrdinal(year, month, day));
    if (rt.year !== year || rt.month !== month || rt.day !== day) {
        throw new RangeError(`실존하지 않는 날짜입니다: ${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
}
/**
 * 출생 입력 전체 검증. 날짜 실존성 + hour 0–23 정수 + minute 0–59 정수 +
 * minute 단독 지정 금지 + longitude −180~180 유한값.
 * longitude 범위 검증은 진태양시 자정 보정 while 루프의 무한 루프도 함께 막는다.
 */
export function assertValidBirthInput(input) {
    assertValidDate(input.year, input.month, input.day);
    if (input.hour !== undefined) {
        assertFiniteInt(input.hour, "hour");
        if (input.hour < 0 || input.hour > 23)
            throw new RangeError(`hour는 0–23여야 합니다: ${input.hour}`);
    }
    if (input.minute !== undefined) {
        if (input.hour === undefined)
            throw new RangeError("minute는 hour 없이 단독으로 지정할 수 없습니다");
        assertFiniteInt(input.minute, "minute");
        if (input.minute < 0 || input.minute > 59)
            throw new RangeError(`minute는 0–59여야 합니다: ${input.minute}`);
    }
    if (input.longitude !== undefined)
        assertLongitude(input.longitude, "longitude");
    if (input.timeBasis !== undefined && input.timeBasis !== "standard" && input.timeBasis !== "solar") {
        throw new RangeError(`timeBasis는 "standard" 또는 "solar"여야 합니다: ${String(input.timeBasis)}`);
    }
    // 타임존 지정은 timezone(IANA) 또는 utcOffsetMinutes 중 **최소 하나** — 암묵 기본값 금지.
    // 둘 다 주면 utcOffsetMinutes 우선(수동 명시 > 자동 해석 — bazi()에서 적용).
    // 날짜·hour·minute·longitude·timeBasis 검증 뒤에 두어, 기존 invalid-date/hour 테스트가
    // 각자의 이유로 먼저 throw 하도록 한다.
    const hasOffset = input.utcOffsetMinutes !== undefined;
    const hasTimezone = input.timezone !== undefined;
    if (!hasOffset && !hasTimezone) {
        throw new Error("timezone(IANA, 예: 'Asia/Seoul') 또는 utcOffsetMinutes(분, DST·역사변경 포함) 중 하나는 필수입니다. KST 등 암묵 가정 금지.");
    }
    if (hasTimezone && !hasOffset && (typeof input.timezone !== "string" || input.timezone.length === 0)) {
        throw new RangeError(`timezone은 비어있지 않은 IANA 문자열이어야 합니다: ${String(input.timezone)}`);
    }
    const off = input.utcOffsetMinutes;
    if (off !== undefined) {
        assertFiniteInt(off, "utcOffsetMinutes");
        if (off < -720 || off > 840) {
            throw new RangeError(`utcOffsetMinutes는 −720~840 사이여야 합니다: ${off}`);
        }
    }
}
//# sourceMappingURL=validate.js.map