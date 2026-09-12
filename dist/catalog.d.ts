import type { CatalogResult } from "./types.js";
/**
 * 연도 범위와 (선택적) 시각 목록으로 사주 카탈로그를 생성한다.
 *
 * 메모리 레이아웃:
 *   N = 총 행 수 (날짜 수 × hours.length)
 *   stems/branches — [N*4] row-major (year/month/day/hour 순)
 *
 * @param yearStart        - 시작 연도 (포함)
 * @param yearEnd          - 종료 연도 (포함)
 * @param utcOffsetMinutes - 절기(월·연주)용 절대순간 변환 오프셋(분, 동쪽 +). **필수**.
 *                           카탈로그 전체가 이 타임존을 가정한다 — 암묵 기본값 없음.
 * @param hours            - 포함할 시각 목록 (0–23). 미지정 시 기본 12시주 대표시간.
 * @returns 카탈로그 결과 (TypedArray 기반 컬럼형 레이아웃)
 */
export declare function catalog(yearStart: number, yearEnd: number, utcOffsetMinutes: number, hours?: readonly number[]): CatalogResult;
//# sourceMappingURL=catalog.d.ts.map