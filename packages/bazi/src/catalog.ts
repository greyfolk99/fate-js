import { baziVectorized } from "./_engine.js"
import { toOrdinal, fromOrdinal } from "./_dateutil.js"
import type { CatalogResult } from "./types.js"

const TIME_SLOTS = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21] as const

/**
 * 연도 범위와 (선택적) 시각 목록으로 사주 카탈로그를 생성한다.
 *
 * 메모리 레이아웃:
 *   N = 총 행 수 (날짜 수 × hours.length)
 *   stems/branches — [N*4] row-major (year/month/day/hour 순)
 *
 * @param yearStart - 시작 연도 (포함)
 * @param yearEnd   - 종료 연도 (포함)
 * @param hours     - 포함할 시각 목록 (0–23). 미지정 시 기본 12시주 대표시간.
 * @returns 카탈로그 결과 (TypedArray 기반 컬럼형 레이아웃)
 */
export function catalog(
  yearStart: number,
  yearEnd: number,
  hours: readonly number[] = TIME_SLOTS,
): CatalogResult {
  const startOrd = toOrdinal(yearStart, 1, 1)
  const endOrd = toOrdinal(yearEnd + 1, 1, 1) // exclusive

  const totalDays = endOrd - startOrd
  const N = totalDays * hours.length

  const yearsArr   = new Int16Array(N)
  const monthsArr  = new Int8Array(N)
  const daysArr    = new Int8Array(N)
  const hoursArr   = new Int8Array(N)
  const slotIndex  = new Int8Array(N)
  const stemsArr   = new Int8Array(N * 4)
  const branchesArr = new Int8Array(N * 4)

  let row = 0
  for (let ord = startOrd; ord < endOrd; ord++) {
    const { year, month, day } = fromOrdinal(ord)
    for (let si = 0; si < hours.length; si++) {
      const h = hours[si]!
      const idx = baziVectorized(ord, h)

      yearsArr[row]  = year
      monthsArr[row] = month
      daysArr[row]   = day
      hoursArr[row]  = h
      slotIndex[row] = si

      const base = row * 4
      stemsArr[base]     = idx.year.stemIdx
      stemsArr[base + 1] = idx.month.stemIdx
      stemsArr[base + 2] = idx.day.stemIdx
      stemsArr[base + 3] = idx.hour.stemIdx

      branchesArr[base]     = idx.year.branchIdx
      branchesArr[base + 1] = idx.month.branchIdx
      branchesArr[base + 2] = idx.day.branchIdx
      branchesArr[base + 3] = idx.hour.branchIdx

      row++
    }
  }

  return {
    years:     yearsArr,
    months:    monthsArr,
    days:      daysArr,
    hours:     hoursArr,
    slotIndex: slotIndex,
    stems:     stemsArr,
    branches:  branchesArr,
  }
}
