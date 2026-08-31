import type { BaziChart, ChartInput } from "./types.js"

/**
 * 주어진 날짜·시각으로 사주팔자 사주(四柱)를 계산한다.
 *
 * TODO: ground_truth_1800_2200 바이너리 데이터 로더 구현 후 완성.
 *       python-bazi/_engine.py 의 `chart()` 로직을 참고할 것.
 *
 * @param input - 날짜·시간 및 보정 옵션
 * @returns 연·월·일·시 사주(四柱) 객체
 * @throws {Error} 미구현
 */
export function chart(input: ChartInput): BaziChart {
  void input
  // TODO: implement using ground_truth data
  throw new Error("Not implemented: requires ground_truth data loader")
}
