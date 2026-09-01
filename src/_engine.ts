/**
 * 사주팔자 계산 엔진.
 * Python python-bazi/_engine.py 의 `bazi_vectorized()` 로직을 TypeScript로 포팅.
 */

import jieqiData from "./_jieqi.json" with { type: "json" }

// ── 상수 ──────────────────────────────────────────────────────────────────────
// date(1900, 1, 31).toordinal() = 693626  (甲辰日 기준일)
const _BASE_ORD = 693626
// date(1970, 1, 1).toordinal() = 719163
const _EPOCH_ORD = 719163
const _BASE_GAN = 0
const _BASE_ZHI = 4

// 월간(月干) 기준: 寅月 시작 천간 (연간 기준)
const _YIN_MONTH_GAN = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0] as const
// 절기 순서 → 월지(月支) 인덱스
// mi=0=大雪(子月), 1=小寒(丑月), 2=立春(寅月), ..., 11=立冬(亥月)
const _JIE_TO_MONTH_ZHI = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
// 寅月(mi=2) 기준 오프셋: 子=-2≡8, 丑=-1≡9, 寅=0, 卯=1, ...
const _JIE_TO_MONTH_OFFSET = [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
// 일간(日干) → 시간(時干) 시작 인덱스
const _DAY_GAN_TO_HOUR_BASE = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8] as const

// 절기 데이터 (epoch seconds)
const _jie_sec: number[] = jieqiData.sec
const _jie_month: number[] = jieqiData.month
const _jie_year: number[] = jieqiData.year

// ── 이진탐색 ───────────────────────────────────────────────────────────────────
/**
 * Python `numpy.searchsorted(arr, val, side="right")` 대응.
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
 * Python `_engine.bazi_vectorized()` 스칼라 버전.
 *
 * @param dateOrd - `toOrdinal(year, month, day)` 값 (Python date.toordinal() 동일)
 * @param hour    - 0~23 정수
 */
export function baziVectorized(dateOrd: number, hour: number): BaziIndices {
  // ── 일주(日柱) ──
  const diff = dateOrd - _BASE_ORD
  const day_gan = mod(_BASE_GAN + diff, 10)
  const day_zhi = mod(_BASE_ZHI + diff, 12)

  // ── 시주(時柱) ──
  // 子時(23시)는 다음 날 기준
  const next_day = hour >= 23
  const hour_zhi = next_day ? 0 : mod(Math.floor((hour + 1) / 2), 12)
  const day_gan_for_hour = next_day ? mod(day_gan + 1, 10) : day_gan
  const hour_gan = mod(
    (_DAY_GAN_TO_HOUR_BASE[day_gan_for_hour] ?? 0) + hour_zhi,
    10,
  )

  // ── 절기 탐색 ──
  const dt_sec = (dateOrd - _EPOCH_ORD) * 86400 + hour * 3600
  let pos = searchSortedRight(_jie_sec, dt_sec) - 1
  pos = Math.max(0, Math.min(pos, _jie_sec.length - 1))

  const month_seq = _jie_month[pos] ?? 0
  const jy = _jie_year[pos] ?? 0
  const yg_base = mod(jy - 4, 10)

  // ── 연주(年柱) ── 입춘(mi=2) 기준, 大雪(0)·小寒(1)은 전년도
  const year_yg = month_seq < 2 ? mod(yg_base - 1, 10) : yg_base

  // ── 월주(月柱) ──
  const month_gan = mod(
    (_YIN_MONTH_GAN[yg_base] ?? 0) + (_JIE_TO_MONTH_OFFSET[month_seq] ?? 0),
    10,
  )
  const month_zhi = _JIE_TO_MONTH_ZHI[month_seq] ?? 0

  // ── 연지(年支) ──
  const year_zhi_base = mod(jy - 4, 12)
  const year_zhi = month_seq < 2 ? mod(year_zhi_base - 1, 12) : year_zhi_base

  return {
    year:  { stemIdx: year_yg,   branchIdx: year_zhi },
    month: { stemIdx: month_gan, branchIdx: month_zhi },
    day:   { stemIdx: day_gan,   branchIdx: day_zhi },
    hour:  { stemIdx: hour_gan,  branchIdx: hour_zhi },
  }
}
