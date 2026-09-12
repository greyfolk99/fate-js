import type { STEMS, BRANCHES } from "./constants.js";
export type Stem = typeof STEMS[number];
export type Branch = typeof BRANCHES[number];
export interface Pillar {
    stem: Stem;
    branch: Branch;
}
export interface Bazi {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    /** 시주(時柱) — 시간 미상일 때 null. */
    hour: Pillar | null;
}
/** 분석 입력 — 사주 한 벌 + 성별(선택). */
export interface Subject {
    bazi: Bazi;
    /** 배우자성(재/관) 판정에 필요. */
    gender?: "male" | "female";
}
/** 시트 입력 — 시주까지 갖춘 사주(4기둥 필수) + 성별 필수. */
export interface SheetSubject {
    bazi: Bazi & {
        hour: Pillar;
    };
    gender: "male" | "female";
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
    years: Int16Array;
    months: Int8Array;
    days: Int8Array;
    hours: Int8Array;
    slotIndex: Int16Array;
    /** 천간 인덱스 배열 [N*4], row-major — year/month/day/hour 순. */
    stems: Int8Array;
    /** 지지 인덱스 배열 [N*4], row-major — year/month/day/hour 순. */
    branches: Int8Array;
}
/** 출생 입력의 공통부. */
interface BirthInputBase {
    year: number;
    month: number;
    day: number;
    /** 24시 기준 정수 시각 (0–23). 미지정이면 시주 없음. */
    hour?: number;
    /** 분 (0–59). 미지정이면 0. 진태양시 보정 시 시주 경계 판정에 쓰인다. */
    minute?: number;
    /**
     * 시간 기준. 미지정이면 전역 설정(getSolarConfig().applySolarTime, 기본 true)을 따른다.
     * - `'solar'`    — 진태양시(경도 지방시 + 균시차) 보정 적용
     * - `'standard'` — 표준시 그대로(보정 안 함)
     */
    timeBasis?: "standard" | "solar";
    /** 출생지 경도(동경 양수). 미지정이면 전역 기본값(getSolarConfig().defaultLongitude). 진태양시(시주) 보정용. */
    longitude?: number;
    /**
     * IANA 타임존 이름(예: 'Asia/Seoul'). **권장 입력** — 오프셋을 플랫폼 tzdata로 자동 해석한다
     * (DST·역사 표준시 포함: 서울 1954~61 +8:30, 1987~88 서머타임 등).
     */
    timezone?: string;
    /**
     * UTC 오프셋(분, 동쪽 +) 수동 지정(예: KST=540). DST·역사 변경을 호출자가 직접 반영해야 한다.
     * **timezone과 같이 주면 이 값이 우선한다**(수동 명시가 자동 해석을 오버라이드).
     */
    utcOffsetMinutes?: number;
}
/**
 * 출생 입력. `timezone`(IANA, 권장) 또는 `utcOffsetMinutes` 중 **최소 하나**는 필수
 * (절기 판정에 절대순간이 필요 — 암묵 기본값 없음). 둘 다 주면 utcOffsetMinutes 우선.
 */
export type BirthInput = BirthInputBase & ({
    utcOffsetMinutes: number;
} | {
    timezone: string;
});
export {};
//# sourceMappingURL=types.d.ts.map