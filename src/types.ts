import type { STEMS, BRANCHES } from "./constants.js"

export type Stem = typeof STEMS[number]
export type Branch = typeof BRANCHES[number]

export interface Pillar {
  stem: Stem
  branch: Branch
}

export interface Bazi {
  year: Pillar
  month: Pillar
  day: Pillar
  /** 시주(時柱) — 시간 미상일 때 null. */
  hour: Pillar | null
}

/** 분석 입력 — 사주 한 벌 + 성별(선택). */
export interface Subject {
  bazi: Bazi
  /** 배우자성(재/관) 판정에 필요. */
  gender?: "male" | "female"
}

/** 시트 입력 — 시주까지 갖춘 사주(4기둥 필수) + 성별 필수. */
export interface SheetSubject {
  bazi: Bazi & { hour: Pillar }
  gender: "male" | "female"
}

/**
 * catalog() 반환값.
 *
 * 메모리 레이아웃:
 *   N = 행 수 (연·월·일·시 조합)
 *   years / months / days / hours — 각 행의 날짜 구성 요소
 *   slotIndex — 각 행이 hours 인자 배열의 몇 번째 원소인지(시간 슬롯 인덱스)
 *   stems     — [N*4] row-major (year/month/day/hour 순)
 *   branches  — [N*4] row-major (year/month/day/hour 순)
 */
export interface CatalogResult {
  years: Int16Array
  months: Int8Array
  days: Int8Array
  hours: Int8Array
  slotIndex: Int16Array
  /** 천간 인덱스 배열 [N*4], row-major — year/month/day/hour 순. */
  stems: Int8Array
  /** 지지 인덱스 배열 [N*4], row-major — year/month/day/hour 순. */
  branches: Int8Array
}

export interface BirthInput {
  year: number
  month: number
  day: number
  /** 24시 기준 정수 시각 (0–23). 미지정이면 시주 없음. */
  hour?: number
  /** 분 (0–59). 미지정이면 0. 진태양시 보정 시 시주 경계 판정에 쓰인다. */
  minute?: number
  /**
   * 시간 기준. 미지정이면 전역 설정(getSolarConfig().applySolarTime, 기본 true)을 따른다.
   * - `'solar'`    — 진태양시(경도 지방시 + 균시차) 보정 적용
   * - `'standard'` — 표준시 그대로(보정 안 함)
   */
  timeBasis?: "standard" | "solar"
  /** 출생지 경도(동경 양수). 미지정이면 전역 기본값(getSolarConfig().defaultLongitude). 진태양시(시주) 보정용. */
  longitude?: number
  /**
   * 출생 시각의 UTC 오프셋(분, 동쪽 +). 절기(월·연주)용 절대순간 변환에 쓴다. **필수**.
   * **DST·역사적 표준시 변경을 여기에 반영한다**(예: 한국 1954–61은 +510, 1987 여름 DST는 +600).
   * 암묵적 기본값(KST 등)은 없다 — 모든 호출자가 이 사주의 타임존을 명시해야 한다.
   * (시간 미상이어도 연·월주 절기 판정에 절대순간이 필요하므로 필수.)
   */
  utcOffsetMinutes: number
}
