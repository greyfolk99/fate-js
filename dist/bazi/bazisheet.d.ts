/**
 * baziSheet — 한 사람의 **원국+분석 시트**(팩트 기반, 시스템∩AI 친화).
 *
 * `analyze()`(BaziAnalysis)가 뽑은 결정론 사실을 그대로 받아, 표현만 정규화한다:
 *  ① 모든 명리 값 = 한자 코드(머신키). 한글/영문 라벨 전멸 → 표시(t)는 glossary 몫.
 *  ② present-only — 합충·특수신살·공망은 성립한 것만(강약 득령/득지/득세는 근거라 present 유지).
 *  ③ 산문(prose)·policy 딕셔너리 제거 → policyVersion 문자열 + 외부 레지스트리.
 *  ④ 십이신살은 기둥에서 빼내 twelveSinsal{fromYear,fromDay} 4배열로.
 *
 * 스키마: mannabosal/schema/bazi-sheet.schema.json 과 1:1. 새 도메인 값은 enums.json 참조.
 */
import type { BaziAnalysis } from "./analyze.js";
import type { SheetSubject } from "../types.js";
export declare const BAZISHEET_SCHEMA_VERSION: "bazi-sheet-v2";
export declare const BAZISHEET_POLICY_VERSION: "bazi-sheet/2026-09";
type Pillar4 = "year" | "month" | "day" | "hour";
export interface BaziSheet {
    schemaVersion: typeof BAZISHEET_SCHEMA_VERSION;
    bazi: BaziAnalysis["bazi"];
    gender: "male" | "female";
    dayMaster: {
        glyph: string;
        element: string;
        yinyang: string;
    };
    pillars: {
        name: Pillar4;
        ganzhi: string;
        stem: {
            glyph: string;
            element: string;
            yinyang: string;
            tenGod: string | null;
        };
        branch: {
            glyph: string;
            element: string;
            yinyang: string;
            tenGod: string | null;
            hiddenStems: {
                glyph: string;
                element: string;
                yinyang: string;
                tenGod: string | null;
                role: string;
            }[];
            twelveStage: string;
        };
        nayin: {
            name: string;
            element: string;
        };
    }[];
    tenGodDistribution: Record<string, number>;
    elementDistribution: {
        simple: Record<string, number>;
        withHidden: Record<string, number>;
    };
    analysis: {
        strength: {
            dayElement: string;
            deukryeong: {
                present: boolean;
                monthBranchTenGod: string | null;
            };
            deukji: {
                present: boolean;
                roots: {
                    stem: string;
                    tenGod: string;
                }[];
            };
            deukse: {
                simple: {
                    ally: number;
                    foe: number;
                    byGroup: Record<string, number>;
                };
                withHidden: {
                    ally: number;
                    foe: number;
                    byGroup: Record<string, number>;
                };
            };
            rooting: {
                pillar: Pillar4;
                via: {
                    stem: string;
                    kind: string;
                }[];
            }[];
            revealed: {
                stem: string;
                fromBranch: Pillar4;
                atStems: Pillar4[];
            }[];
            byRule: {
                rule: string;
                result: string;
            }[];
        };
        gyeokguk: {
            monthBranch: string;
            monthHiddenStems: {
                stem: string;
                tenGod: string;
                role: string;
            }[];
            revealed: {
                stem: string;
                tenGod: string;
                role: string;
                atStems: Pillar4[];
            }[];
            candidates: {
                basedOn: string;
                basis: string;
            }[];
        };
        yongsin: {
            eokbu: {
                favorable: string[];
                unfavorable: string[];
            };
            johu: {
                season: string;
                main: string[];
                sub: string[];
                cond?: string;
            };
        };
        relations: {
            kind: string;
            detail: string | null;
            polarity: string;
            pillars: Pillar4[];
            glyphs: string[];
            element?: string;
        }[];
        void: string[];
    };
    twelveSinsal: {
        fromYear: string[];
        fromDay: string[];
    };
    specialSinsal: {
        code: string;
        pillars: Pillar4[];
    }[];
    policyVersion: string;
}
/** BaziAnalysis(BaziAnalysis) → baziSheet. 순수 함수(표현 정규화만). */
export declare function toBaziSheet(n: BaziAnalysis): BaziSheet;
/** 사주 한 벌 → baziSheet(원국+분석 시트). 4기둥·성별 필수(타입이 런타임 전제조건과 일치). */
export declare function baziSheet(subject: SheetSubject): BaziSheet;
/**
 * baziSheet 를 GLM 프롬프트·UI용 한자 한 줄로 렌더한다.
 * 간지·일간·강약·용신·오행분포(장간포함)·격국후보·공망을 압축한다.
 */
export declare function formatBaziSheet(b: BaziSheet, tag?: string): string;
export {};
//# sourceMappingURL=bazisheet.d.ts.map