/**
 * ordinal 날짜 유틸리티.
 * Proleptic Gregorian Calendar 기준. 1년 1월 1일 = ordinal 1.
 */

function daysBeforeYear(y: number): number {
  const ym1 = y - 1
  return (
    365 * ym1 +
    Math.floor(ym1 / 4) -
    Math.floor(ym1 / 100) +
    Math.floor(ym1 / 400)
  )
}

const DAYS_BEFORE_MONTH = [0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysBeforeMonth(year: number, month: number): number {
  const base = DAYS_BEFORE_MONTH[month] ?? 0
  return base + (month > 2 && isLeap(year) ? 1 : 0)
}

/**
 * (year, month, day) → ordinal. 1년 1월 1일 = 1.
 */
export function toOrdinal(year: number, month: number, day: number): number {
  return daysBeforeYear(year) + daysBeforeMonth(year, month) + day
}

/**
 * ordinal → { year, month, day }. 1년 1월 1일 = 1.
 */
export function fromOrdinal(ord: number): { year: number; month: number; day: number } {
  // Algorithm from Meeus, "Astronomical Algorithms", chapter 7
  let n = ord - 1 // 0-based days since 0001-01-01
  const n400 = Math.floor(n / 146097)
  n -= n400 * 146097
  const n100 = Math.min(Math.floor(n / 36524), 3)
  n -= n100 * 36524
  const n4 = Math.floor(n / 1461)
  n -= n4 * 1461
  const n1 = Math.min(Math.floor(n / 365), 3)
  n -= n1 * 365

  const year = n400 * 400 + n100 * 100 + n4 * 4 + n1 + 1
  // n is now 0-based day within year
  const leap = isLeap(year) ? 1 : 0
  // figure out month
  let month = 1
  while (month < 12) {
    const next = (DAYS_BEFORE_MONTH[month + 1] ?? 0) + (month >= 2 ? leap : 0)
    if (n < next) break
    month++
  }
  const day = n - daysBeforeMonth(year, month) + 1
  return { year, month, day }
}
