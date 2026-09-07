/**
 * known-good fixtures cross-validation
 *
 * ground_truth_1800_2200.npz 에서 추출한 500개 샘플과
 * baziTable() 계산 결과를 비교한다.
 *
 * 샘플 재생성:
 *   python3 scripts/gen_ground_truth_samples.py
 */
import { describe, test, expect } from "vitest"
import samples from "./fixtures/ground_truth_samples.json"
import { baziTable } from "../src/bazi-table.js"
import { STEM_INDEX, BRANCH_INDEX } from "../src/constants.js"

type Sample = {
  year: number
  month: number
  day: number
  hour: number
  expected: {
    yearGan: number
    yearZhi: number
    monthGan: number
    monthZhi: number
    dayGan: number
    dayZhi: number
    hourGan: number
    hourZhi: number
  }
}

describe("known-good fixtures", () => {
  test.each(samples as Sample[])(
    "$year-$month-$day $hour시",
    ({ year, month, day, hour, expected }) => {
      // 이 픽스처의 오라클(ground_truth npz)은 표준시(입력 시각 그대로) 기준 —
      // 원시 천문 계산(절기·일주·시주)을 검증한다. 진태양시(출생지 경도) 보정은
      // 그 위에 얹는 별개 레이어이므로 여기선 표준시 모드로 엔진 자체를 본다.
      const result = baziTable({ year, month, day, hour, timeBasis: "standard" })

      const got = {
        yearGan:  STEM_INDEX[result.year.stem],
        yearZhi:  BRANCH_INDEX[result.year.branch],
        monthGan: STEM_INDEX[result.month.stem],
        monthZhi: BRANCH_INDEX[result.month.branch],
        dayGan:   STEM_INDEX[result.day.stem],
        dayZhi:   BRANCH_INDEX[result.day.branch],
        hourGan:  STEM_INDEX[result.hour!.stem],
        hourZhi:  BRANCH_INDEX[result.hour!.branch],
      }

      const mismatch = (Object.keys(expected) as (keyof typeof expected)[])
        .filter(k => got[k] !== expected[k])
        .map(k => `${k}: got=${got[k]} expected=${expected[k]}`)

      expect(
        mismatch,
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ` +
        `${hour}시 → 불일치: ${mismatch.join(", ")}`,
      ).toEqual([])
    },
  )
})
