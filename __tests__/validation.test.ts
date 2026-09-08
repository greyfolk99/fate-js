/**
 * 입력 검증(assertValidBirthInput) + 절기 데이터 범위 throw 테스트.
 * 조용한 오답 대신 명시적 RangeError를 던지는지 확인한다.
 */
import { describe, test, expect, afterEach } from "vitest"
import { bazi } from "../src/bazi.js"
import { baziVectorized } from "../src/engine.js"
import { catalog } from "../src/catalog.js"
import { getSolarConfig, setSolarConfig } from "../src/config.js"
import { assertValidBirthInput, assertValidDate } from "../src/validate.js"

describe("assertValidDate", () => {
  test("실존하지 않는 날짜는 throw (2월 30일·4월 31일)", () => {
    expect(() => assertValidDate(2000, 2, 30)).toThrow(RangeError)
    expect(() => assertValidDate(2001, 4, 31)).toThrow(RangeError)
  })
  test("범위 밖 month/day throw", () => {
    expect(() => assertValidDate(2000, 13, 1)).toThrow(RangeError)
    expect(() => assertValidDate(2000, 0, 1)).toThrow(RangeError)
    expect(() => assertValidDate(2000, 1, 0)).toThrow(RangeError)
  })
  test("NaN·비정수 throw", () => {
    expect(() => assertValidDate(NaN, 1, 1)).toThrow(RangeError)
    expect(() => assertValidDate(2000, 1.5, 1)).toThrow(RangeError)
  })
  test("윤년 2월 29일은 통과, 평년 2월 29일은 throw", () => {
    expect(() => assertValidDate(2000, 2, 29)).not.toThrow()
    expect(() => assertValidDate(1900, 2, 29)).toThrow(RangeError) // 1900은 평년(100의 배수, 400 아님)
    expect(() => assertValidDate(2001, 2, 29)).toThrow(RangeError)
  })
})

describe("assertValidBirthInput 시간·경도", () => {
  test("hour 0–23 벗어나면 throw", () => {
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: 24 })).toThrow(RangeError)
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: -1 })).toThrow(RangeError)
  })
  test("minute 0–59 벗어나면 throw", () => {
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: 1, minute: 90 })).toThrow(RangeError)
  })
  test("minute를 hour 없이 단독 지정하면 throw", () => {
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, minute: 30 })).toThrow(RangeError)
  })
  test("longitude 비유한/범위밖 throw (무한 루프 방지)", () => {
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: 1, longitude: Infinity })).toThrow(RangeError)
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: 1, longitude: 999 })).toThrow(RangeError)
  })
  test("정상 입력은 통과", () => {
    expect(() => assertValidBirthInput({ year: 1992, month: 8, day: 4, hour: 1, minute: 55, longitude: 127, utcOffsetMinutes: 540 })).not.toThrow()
  })
  test("utcOffsetMinutes 생략 시 throw (필수 — 암묵 타임존 기본값 금지)", () => {
    // @ts-expect-error utcOffsetMinutes는 필수 필드 — 생략 시 타입에러 + 런타임 throw.
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: 1 })).toThrow()
  })
  test("utcOffsetMinutes 범위밖(−720~840)은 throw", () => {
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: 1, utcOffsetMinutes: 9999 })).toThrow(RangeError)
  })
})

describe("bazi 진입점 검증·절기범위", () => {
  test("잘못된 입력은 bazi에서 throw", () => {
    expect(() => bazi({ year: 2000, month: 2, day: 30 })).toThrow(RangeError)
    expect(() => bazi({ year: 2000, month: 1, day: 1, hour: 24 })).toThrow(RangeError)
  })
  test("절기 데이터 범위 밖 연도는 throw (clamp 아님)", () => {
    expect(() => bazi({ year: 1500, month: 6, day: 15, timeBasis: "standard", utcOffsetMinutes: 540 })).toThrow(RangeError)
    expect(() => bazi({ year: 2500, month: 6, day: 15, timeBasis: "standard", utcOffsetMinutes: 540 })).toThrow(RangeError)
  })
  test("범위 안 정상 연도는 통과", () => {
    expect(() => bazi({ year: 2000, month: 6, day: 15, hour: 12, timeBasis: "standard", utcOffsetMinutes: 540 })).not.toThrow()
  })
})

describe("추가 검증 구멍 (codex Round2)", () => {
  test("year ≤ 0은 throw (date-util 계약)", () => {
    expect(() => assertValidDate(0, 1, 1)).toThrow(RangeError)
    expect(() => assertValidDate(-1, 1, 1)).toThrow(RangeError)
  })
  test("잘못된 timeBasis 문자열은 throw (조용히 standard 처리 금지)", () => {
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: 1, timeBasis: "bad", utcOffsetMinutes: 540 })).toThrow(RangeError)
    expect(() => assertValidBirthInput({ year: 2000, month: 1, day: 1, hour: 1, timeBasis: "solar", utcOffsetMinutes: 540 })).not.toThrow()
  })
  test("baziVectorized는 비유한(NaN/Infinity) utcSec를 throw (range check 통과 구멍)", () => {
    const ord = 700000 // 범위 내 임의 ordinal
    const goodUtc = (700000 - 719163) * 86400 // 범위 내 UTC 초
    expect(() => baziVectorized(ord, 12, NaN)).toThrow(RangeError)
    expect(() => baziVectorized(ord, 12, Infinity)).toThrow(RangeError)
    expect(() => baziVectorized(ord, 12, goodUtc)).not.toThrow()
  })
  test("catalog 입력검증: yearStart>yearEnd·NaN·hours 24 throw", () => {
    expect(() => catalog(2001, 2000, 540)).toThrow(RangeError)
    expect(() => catalog(NaN, 2000, 540)).toThrow(RangeError)
    expect(() => catalog(2000, 2000, 540, [24])).toThrow(RangeError)
    expect(() => catalog(2000, 2000, 540, [12])).not.toThrow()
  })
  test("catalog 입력검증: utcOffsetMinutes 필수·범위 (암묵 타임존 기본값 금지)", () => {
    // @ts-expect-error utcOffsetMinutes는 필수 위치 인자 — 생략 시 타입에러 + 런타임 throw.
    expect(() => catalog(2000, 2000)).toThrow(RangeError)
    expect(() => catalog(2000, 2000, NaN)).toThrow(RangeError)
    expect(() => catalog(2000, 2000, 9999)).toThrow(RangeError)
    expect(() => catalog(2000, 2000, 540, [12])).not.toThrow()
  })
})

describe("setSolarConfig 검증 (codex Round2)", () => {
  const DEFAULTS = getSolarConfig()
  afterEach(() => setSolarConfig(DEFAULTS))
  test("Infinity·범위밖 경도/자오선은 throw (무한루프·오답 방지)", () => {
    expect(() => setSolarConfig({ defaultLongitude: Infinity })).toThrow(RangeError)
    expect(() => setSolarConfig({ standardMeridian: 999 })).toThrow(RangeError)
    expect(() => setSolarConfig({ defaultLongitude: 127.5 })).not.toThrow()
  })
})
