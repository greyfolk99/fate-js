/**
 * ground_truth cross-validation
 *
 * python-bazi ground_truth_1800_2200.npz 에서 추출한 500개 샘플과
 * @fate/bazi chart() 계산 결과를 비교한다.
 *
 * 샘플 재생성:
 *   python3 scripts/gen_ground_truth_samples.py
 */
import { describe, test, expect } from "vitest"
import samples from "./fixtures/ground_truth_samples.json"
import { chart } from "../src/chart.js"
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

describe("ground_truth cross-validation (python-bazi vs @fate/bazi)", () => {
  test.each(samples as Sample[])(
    "$year-$month-$day $hour시",
    ({ year, month, day, hour, expected }) => {
      const result = chart({ year, month, day, hour })

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
