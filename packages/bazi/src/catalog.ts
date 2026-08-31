import type { CatalogResult } from "./types.js"

/**
 * 연도 범위와 (선택적) 시각 목록으로 사주 카탈로그를 생성한다.
 *
 * TODO: ground_truth_1800_2200 바이너리를 로드하고 yearStart–yearEnd 구간을
 *       슬라이싱하는 로직 구현. python-bazi/_engine.py 의 `catalog()` 참고.
 *
 * @param yearStart - 시작 연도 (포함, 1800–2200)
 * @param yearEnd   - 종료 연도 (포함, 1800–2200)
 * @param hours     - 포함할 시각 목록 (0–23). 미지정 시 모든 시각(0–23).
 * @returns 카탈로그 결과 (TypedArray 기반 컬럼형 레이아웃)
 * @throws {Error} 미구현
 */
export function catalog(
  yearStart: number,
  yearEnd: number,
  hours?: readonly number[],
): CatalogResult {
  void yearStart
  void yearEnd
  void hours
  // TODO: implement — load ground_truth_1800_2200 binary and slice by year range
  throw new Error("Not implemented: requires ground_truth data loader")
}
