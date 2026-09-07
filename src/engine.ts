/**
 * 사주팔자 계산 엔진.
 */

import jieqiData from "./jieqi.json" with { type: "json" }

// ── 상수 ──────────────────────────────────────────────────────────────────────
// 1900-01-31 의 ordinal = 693626  (甲辰日 기준일)
const BASE_ORD = 693626
// 1970-01-01 의 ordinal = 719163
const EPOCH_ORD = 719163
const BASE_GAN = 0
const BASE_ZHI = 4

// 월간(月干) 기준: 寅月 시작 천간 (연간 기준)
const YIN_MONTH_GAN = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0] as const
// 절기 순서 → 월지(月支) 인덱스
// mi=0=大雪(子月), 1=小寒(丑月), 2=立春(寅月), ..., 11=立冬(亥月)
const JIE_TO_MONTH_ZHI = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
// 寅月(mi=2) 기준 오프셋: 子=-2≡8, 丑=-1≡9, 寅=0, 卯=1, ...
const JIE_TO_MONTH_OFFSET = [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
// 일간(日干) → 시간(時干) 시작 인덱스
const DAY_GAN_TO_HOUR_BASE = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8] as const

// 절기 데이터 (epoch seconds)
const jieSec: number[] = jieqiData.sec
const jieMonth: number[] = jieqiData.month
const jieYear: number[] = jieqiData.year

// ── 이진탐색 ───────────────────────────────────────────────────────────────────
/**
 * arr에서 val을 초과하는 첫 번째 인덱스를 반환한다.
 * (val 이하인 마지막 위치 + 1)
 */
function searchSortedRight(arr: number[], val: number): number {
  let lo = 0
  let hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    const arrMid = arr[mid]
    if (arrMid === undefined || arrMid <= val) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return lo
}

// ── 음수 안전 모듈러 ───────────────────────────────────────────────────────────
function mod(x: number, n: number): number {
  return ((x % n) + n) % n
}

// ── 공개 타입 ──────────────────────────────────────────────────────────────────
export interface PillarIndex {
  stemIdx: number
  branchIdx: number
}

export interface BaziIndices {
  year: PillarIndex
  month: PillarIndex
  day: PillarIndex
  hour: PillarIndex
}

// ── 핵심 함수 ──────────────────────────────────────────────────────────────────
/**
 * ordinal·시각으로 연·월·일·시 사주의 천간·지지 인덱스를 계산한다.
 *
 * @param dateOrd - `toOrdinal(year, month, day)` 값
 * @param hour    - 0~24 시각(소수 가능 — 진태양시 보정 결과를 그대로 받는다).
 *                  시주 지지 = floor((hour+1)/2), 절기 탐색도 이 소수 시각을 쓴다.
 */
export function baziVectorized(dateOrd: number, hour: number): BaziIndices {
  // ── 일주(日柱) ──
  const diff = dateOrd - BASE_ORD
  const dayGan = mod(BASE_GAN + diff, 10)
  const dayZhi = mod(BASE_ZHI + diff, 12)

  // ── 시주(時柱) ──
  // 子時(23시)는 다음 날 기준
  const nextDay = hour >= 23
  const hourZhi = nextDay ? 0 : mod(Math.floor((hour + 1) / 2), 12)
  const dayGanForHour = nextDay ? mod(dayGan + 1, 10) : dayGan
  const hourGan = mod(
    (DAY_GAN_TO_HOUR_BASE[dayGanForHour] ?? 0) + hourZhi,
    10,
  )

  // ── 절기 탐색 ──
  const dtSec = (dateOrd - EPOCH_ORD) * 86400 + hour * 3600
  let pos = searchSortedRight(jieSec, dtSec) - 1
  pos = Math.max(0, Math.min(pos, jieSec.length - 1))

  const monthSeq = jieMonth[pos] ?? 0
  const jy = jieYear[pos] ?? 0
  const ygBase = mod(jy - 4, 10)

  // ── 연주(年柱) ── 입춘(mi=2) 기준, 大雪(0)·小寒(1)은 전년도
  const yearStem = monthSeq < 2 ? mod(ygBase - 1, 10) : ygBase

  // ── 월주(月柱) ──
  const monthGan = mod(
    (YIN_MONTH_GAN[ygBase] ?? 0) + (JIE_TO_MONTH_OFFSET[monthSeq] ?? 0),
    10,
  )
  const monthZhi = JIE_TO_MONTH_ZHI[monthSeq] ?? 0

  // ── 연지(年支) ──
  const yearZhiBase = mod(jy - 4, 12)
  const yearZhi = monthSeq < 2 ? mod(yearZhiBase - 1, 12) : yearZhiBase

  return {
    year:  { stemIdx: yearStem,  branchIdx: yearZhi },
    month: { stemIdx: monthGan,  branchIdx: monthZhi },
    day:   { stemIdx: dayGan,    branchIdx: dayZhi },
    hour:  { stemIdx: hourGan,   branchIdx: hourZhi },
  }
}
