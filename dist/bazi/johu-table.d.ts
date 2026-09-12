/**
 * 調候用神表 — 일간(10) × 월지(12) = 120셀.
 *
 * Edition-lock: 維基文庫(wikisource) 窮通寶鑑 통행본(≈徐樂吾 造化元鑰 계열).
 * 독립 재구축 2회(원문 축자 직독 + 집계표 삼중대조)를 셀 단위 diff 하여
 * 主용신 수준 근본 불일치 0으로 수렴한 표만 수록(2026-09-08).
 *  - main = 조후 主用神(양측 합의). sub = 합의된 次/佐.
 *  - cond = 원문 자체의 조건 분기(지지 국·상반/하반월 등) — 평탄화하지 않고 축자 보존.
 *  - note = 이설 기록(집계표 평탄화 아티팩트·순서 이설·판본 결락).
 *  - 원문이 명시 배격하는데 유통 집계표가 병기한 干은 제외했다:
 *    庚戌의 己(忌己濁壬)·辛申의 癸(癸不可用)·辛子의 戊(不見戊癸)·
 *    壬酉의 庚(見庚破甲)·壬丑의 丁(원문 부재).
 *
 * 판정·점수는 없다 — "이 달 이 일간의 조후 用神은 무엇"이라는 표 사실만.
 */
import type { STEMS, BRANCHES } from "../constants.js";
type Stem = typeof STEMS[number];
type Branch = typeof BRANCHES[number];
export interface JohuEntry {
    /** 조후 主用神(복수 가능 — 원문이 並要로 둔 경우). */
    main: Stem[];
    /** 次·佐 用神(양측 합의분). */
    sub: Stem[];
    /** 원문 조건 분기(있으면). */
    cond?: string;
    /** 이설·판본 기록(있으면). */
    note?: string;
}
export declare const JOHU_TABLE: Record<Stem, Record<Branch, JohuEntry>>;
export {};
//# sourceMappingURL=johu-table.d.ts.map