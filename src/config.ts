/**
 * 전역 설정 — 진태양시(眞太陽時) 보정 기본값.
 *
 * 라이브러리 전역에 걸리는 설정은 함수 파라미터가 아니라 여기(전역 setter + 환경변수)로 둔다.
 * 출생지 경도처럼 "사람마다 다른 데이터"는 BirthInput.longitude 로 받고,
 * 그게 없을 때의 기본값·표준자오선·보정 on/off 같은 "라이브러리 설정"만 여기서 관리한다.
 *
 *   env: BAZI_SOLAR_TIME(=1/0) · BAZI_LONGITUDE · BAZI_STD_MERIDIAN · BAZI_EOT(=1/0)
 *   code: setSolarConfig({...}) / getSolarConfig()
 */

declare const process: { env?: Record<string, string | undefined> } | undefined

function env(name: string): string | undefined {
  try {
    return typeof process !== "undefined" ? process?.env?.[name] : undefined
  } catch {
    return undefined
  }
}
function envNum(name: string, dflt: number): number {
  const v = env(name)
  const n = v == null ? NaN : Number(v)
  return Number.isFinite(n) ? n : dflt
}
function envBool(name: string, dflt: boolean): boolean {
  const v = env(name)
  if (v == null) return dflt
  return v === "1" || v.toLowerCase() === "true"
}

export interface SolarConfig {
  /** 진태양시 보정 기본 적용 여부. (BirthInput.timeBasis 로 개별 override 가능) */
  applySolarTime: boolean
  /** 균시차(Equation of Time) 포함 여부. false 면 경도(지방평균시) 보정만. */
  applyEot: boolean
  /** 표준시 자오선(동경). KST = 135. 입력 시각이 이 자오선 표준시라고 본다. */
  standardMeridian: number
  /** 출생지 경도 미상 시 기본값(동경 양수). 한국 평균 ≈ 127.5. */
  defaultLongitude: number
}

let _cfg: SolarConfig = {
  applySolarTime: envBool("BAZI_SOLAR_TIME", true),
  applyEot: envBool("BAZI_EOT", true),
  standardMeridian: envNum("BAZI_STD_MERIDIAN", 135),
  defaultLongitude: envNum("BAZI_LONGITUDE", 127.5),
}

export function getSolarConfig(): SolarConfig {
  return { ..._cfg }
}

/** 전역 진태양시 설정 갱신(부분 갱신). */
export function setSolarConfig(patch: Partial<SolarConfig>): void {
  _cfg = { ..._cfg, ...patch }
}
