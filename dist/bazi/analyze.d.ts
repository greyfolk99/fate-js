/**
 * 1인 원국(原局) FactSheet — 사주 여덟 글자에서 결정론으로 나오는 명리
 * 요소를 전부 구조화해 뽑는다. 해석 문장(prose)이 아니라 사실(fact)만 담아
 * 뒤에 LLM 라벨·궁합(matchSheet) 재료로 쓴다.
 *
 * 1단계: 기둥별 십성·지장간·십이운성·십이신살·납음·공망·오행분포·
 *        원국 내부 관계(합충형파해)·원국 신살(길흉신).
 * 2단계(예정): 신강신약·격국·용신·대운.
 */
import { BRANCHES } from "../constants.js";
import type { STEMS, ELEMENTS as ELEMENTS_T } from "../constants.js";
import type { Bazi } from "../types.js";
import type { TenGod, TenGodCount } from "../match/judgments-types.js";
import type { PillarName, Polarity } from "../match/types.js";
import type { Subject } from "../types.js";
import type { AnalysisFacts } from "./analysis.js";
type Stem = typeof STEMS[number];
type Branch = typeof BRANCHES[number];
type Element = typeof ELEMENTS_T[number];
export declare const BAZIANALYSIS_SCHEMA_VERSION = "bazi-analysis";
export interface HiddenStemInfo {
    glyph: Stem;
    element: Element;
    yinyang: "yang" | "yin";
    tenGod: TenGod;
    /** 정기(正氣)=주기 · 중기(中氣) · 여기(餘氣). */
    role: string;
}
export interface BaziStem {
    glyph: Stem;
    element: Element;
    yinyang: "yang" | "yin";
    /** 일간(자신)은 null. */
    tenGod: TenGod | null;
}
export interface BaziBranch {
    glyph: Branch;
    element: Element;
    yinyang: "yang" | "yin";
    /** 지지 본기(주기) 기준 십성. */
    tenGod: TenGod;
    hiddenStems: HiddenStemInfo[];
    /** 십이운성(장생~양). */
    twelveStage: string;
    /** 십이신살 — 년지 기준. */
    sinsalFromYear: string;
    /** 십이신살 — 일지 기준. */
    sinsalFromDay: string;
    /** 공망(空亡) 여부. */
    isVoid: boolean;
}
export interface BaziPillar {
    name: PillarName;
    stem: BaziStem;
    branch: BaziBranch;
    ganzhi: string;
    nayin: {
        name: string;
        element: Element;
    } | null;
}
export interface ElementCount {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
}
export interface BaziRelation {
    id: string;
    label: string;
    polarity: Polarity;
    pillars: PillarName[];
    glyphs: string[];
    element?: Element;
}
export interface BaziSinsal {
    id: string;
    label: string;
    present: boolean;
    pillars: PillarName[];
    basis: string;
}
export interface BaziAnalysis {
    schemaVersion: string;
    bazi: Bazi;
    gender?: "male" | "female";
    dayMaster: {
        glyph: Stem;
        element: Element;
        yinyang: "yang" | "yin";
    };
    pillars: BaziPillar[];
    voidBranches: Branch[];
    tenGodDistribution: TenGodCount;
    elementDistribution: {
        /** 천간 4 + 지지 본기 4 (시 미상이면 각 3). */
        simple: ElementCount;
        /** 지장간 전부를 각 1로 가중. */
        withHidden: ElementCount;
    };
    sinsal: BaziSinsal[];
    internalRelations: BaziRelation[];
    /** 2단계 — 신강신약·격국·용신(사실 시트, 점수·최종판정 없음). */
    analysis: AnalysisFacts;
    policy: Record<string, string>;
}
/**
 * 사주 한 벌의 1인 원국 FactSheet 를 만든다.
 */
export declare function analyze(subject: Subject): BaziAnalysis;
export {};
//# sourceMappingURL=analyze.d.ts.map