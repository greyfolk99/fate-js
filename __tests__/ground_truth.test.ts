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
      // 이 픽스처의 오라클(fate-py)은 절기표의 native 프레임 = CST(동경120, UTC+8) 벽시계로
      // 생성됐다(jieqi.json이 원래 CST축이었으므로). 엔진은 이제 UTC 캐노니컬이라, 이 샘플을
      // CST 프레임(utcOffsetMinutes:480)으로 호출하면 오프셋(−28800)이 상쇄돼 구엔진 결과를
      // 그대로 재현한다 → 원시 천문 계산(절기·일주·시주) + UTC 변환의 sign까지 함께 검증.
      const result = baziTable({ year, month, day, hour, timeBasis: "standard", utcOffsetMinutes: 480 })

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
