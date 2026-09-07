/**
 * 사주팔자 계산 엔진.
 */

import jieqiData from "./jieqi.json" with { type: "json" }

// ── 상수 ──────────────────────────────────────────────────────────────────────
// 1900-01-31 의 ordinal = 693626  (甲辰日 기준일)
const BASE_ORD = 693626
// 1970-01-01 의 ordinal = 719163 (Unix epoch). utcSec 계산에 재사용하도록 export.
export const EPOCH_ORD = 719163
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

// 절기 데이터 (true-UTC epoch seconds) — 절기 절대순간을 UTC로 저장(2026-09 CST축 버그 교정).
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
 * 프레임을 분리해 연·월·일·시 사주의 천간·지지 인덱스를 계산한다.
 *
 * 시간 기준(2026-09 재설계): 각 기둥이 서로 다른 시간 프레임을 쓴다.
 *  - 일주(日柱)  = 로컬 civil 날짜(dateOrd) — 진태양시로 굴리지 않는다(v1).
 *  - 시주(時柱)  = 로컬 진태양시 시각(localHour) — 경도·균시차 보정이 여기에만 적용.
 *  - 월·연주     = 출생 절대순간(utcSec, true-UTC) vs 절기 UTC 비교.
 *
 * @param dateOrd  - `toOrdinal(year, month, day)`(로컬 civil 날짜)
 * @param localHour - 0~24 로컬 시각(소수 가능, 진태양시 보정 반영). 시주 지지·야자시 판정용.
 * @param utcSec    - 출생 절대순간(Unix epoch 초, UTC). 절기(월·연) 판정용.
 */
export function baziVectorized(dateOrd: number, localHour: number, utcSec: number): BaziIndices {
  // ── 일주(日柱) ──
  const diff = dateOrd - BASE_ORD
  const dayGan = mod(BASE_GAN + diff, 10)
  const dayZhi = mod(BASE_ZHI + diff, 12)

  // ── 시주(時柱) ── 로컬 진태양시 기준. 子時(23시)는 다음 날 일간 기준(야자시).
  const nextDay = localHour >= 23
  const hourZhi = nextDay ? 0 : mod(Math.floor((localHour + 1) / 2), 12)
  const dayGanForHour = nextDay ? mod(dayGan + 1, 10) : dayGan
  const hourGan = mod(
    (DAY_GAN_TO_HOUR_BASE[dayGanForHour] ?? 0) + hourZhi,
    10,
  )

  // ── 절기 탐색 ── 출생 절대순간(UTC) vs 절기 UTC.
  // 비유한(NaN/Infinity) 값은 range 비교를 조용히 통과하므로 먼저 막는다.
  // (NaN 비교는 항상 false → clamp 없이 쓰레기 결과가 나오던 구멍)
  // 절기 데이터 범위 밖도 clamp하지 않고 명시적으로 throw한다(끝값 오답 방지).
  if (!Number.isFinite(utcSec) || utcSec < jieSec[0]! || utcSec >= jieSec[jieSec.length - 1]!) {
    throw new RangeError(
      `절기 데이터 범위 밖이거나 유효하지 않은 시각입니다(utcSec=${utcSec}). ` +
        `이 라이브러리는 절기 테이블이 덮는 기간(대략 1799-01 ~ 2200-11)의 유한한 날짜/시각만 지원합니다.`,
    )
  }
  const pos = searchSortedRight(jieSec, utcSec) - 1

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
