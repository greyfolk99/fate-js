import type { STEMS, BRANCHES } from "./constants.js"

export type Stem = typeof STEMS[number]
export type Branch = typeof BRANCHES[number]

export interface Pillar {
  stem: Stem
  branch: Branch
}

export interface BaziChart {
  year: Pillar
  month: Pillar
  day: Pillar
  /** 시주(時柱) — 시간 미상일 때 null. */
  hour: Pillar | null
}

/**
 * catalog() 반환값.
 *
 * 메모리 레이아웃:
 *   N = 행 수 (연·월·일·시 조합)
 *   years / months / days / hours — 각 행의 날짜 구성 요소
 *   slotIndex — 0=year 1=month 2=day 3=hour
 *   stems     — [N*4] row-major (year/month/day/hour 순)
 *   branches  — [N*4] row-major (year/month/day/hour 순)
 */
export interface CatalogResult {
  years: Int16Array
  months: Int8Array
  days: Int8Array
  hours: Int8Array
  slotIndex: Int8Array
  /** 천간 인덱스 배열 [N*4], row-major — year/month/day/hour 순. */
  stems: Int8Array
  /** 지지 인덱스 배열 [N*4], row-major — year/month/day/hour 순. */
  branches: Int8Array
}

export interface ChartInput {
  year: number
  month: number
  day: number
  /** 24시 기준 정수 시각 (0–23). 미지정이면 시주 없음. */
  hour?: number
  /**
   * 시간 기준.
   * - `'standard'` — 표준시(기본값)
   * - `'solar'`    — 진태양시(경도 보정)
   */
  timeBasis?: "standard" | "solar"
  /** 경도 보정용 (timeBasis === 'solar' 일 때 유효). 동경 양수. */
  longitude?: number
  /** IANA timezone 문자열 (예: 'Asia/Seoul'). */
  timezone?: string
}
