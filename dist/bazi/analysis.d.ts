/**
 * 1인 원국 2단계 — 신강신약(身强身弱)·격국(格局)·용신(用神)을 "사실"로 뽑는다.
 *
 * 철학: 점수·최종판정은 박지 않는다(그건 다운스트림 ML/LLM 몫).
 * 판정을 좌우하는 결정론 사실(득령·득지·득세·통근·투출·투출격 후보·
 * 억부 희기 오행)만 담고, "신강/신약·X격·용신 Y"는 다수설 참고 라벨로만.
 */
import type { STEMS, BRANCHES, ELEMENTS as ELEMENTS_T } from "../constants.js";
import type { Bazi } from "../types.js";
import type { TenGod } from "../match/judgments-types.js";
import type { PillarName } from "../match/types.js";
type Stem = typeof STEMS[number];
type Branch = typeof BRANCHES[number];
type Element = typeof ELEMENTS_T[number];
type StarGroup = "비겁" | "인성" | "식상" | "재성" | "관성";
export interface StrengthFacts {
    dayElement: Element;
    /** 득령(得令) — 월지가 일간을 돕는가(월지 본기가 비겁·인성). */
    deukryeong: {
        present: boolean;
        monthBranchTenGod: TenGod;
    };
    /** 득지(得地) — 일지에 일간의 뿌리(비겁·인성 지장간)가 있는가. */
    deukji: {
        present: boolean;
        roots: {
            stem: Stem;
            tenGod: TenGod;
        }[];
    };
    /** 득세(得勢) — 아군(비겁+인성) vs 적군(식상+재+관) 세력. */
    deukse: {
        simple: {
            ally: number;
            foe: number;
            byGroup: Record<StarGroup, number>;
        };
        withHidden: {
            ally: number;
            foe: number;
            byGroup: Record<StarGroup, number>;
        };
    };
    /** 통근(通根) — 일간과 같은 오행(비겁) 지장간이 있는 기둥. 인성은 생조라 제외. */
    rooting: {
        pillar: PillarName;
        via: {
            stem: Stem;
            kind: "비겁";
        }[];
    }[];
    /** 투출(透出) — 지장간이 천간에 드러난 것. */
    revealed: {
        stem: Stem;
        fromBranch: PillarName;
        atStems: PillarName[];
    }[];
    /** 참고 판정(점수 아님) — 다수설 휴리스틱 라벨. */
    reference: {
        verdict: "신강" | "신약" | "중화";
        basis: string;
    };
}
export interface GyeokgukFacts {
    monthBranch: Branch;
    monthHiddenStems: {
        stem: Stem;
        tenGod: TenGod;
        role: string;
    }[];
    /** 월지 지장간 중 천간에 투출한 것. */
    revealed: {
        stem: Stem;
        tenGod: TenGod;
        role: string;
        atStems: PillarName[];
    }[];
    /** 격 후보(단정 아님) — 투출 우선, 없으면 월령 본기. */
    candidates: {
        name: string;
        tenGod: TenGod;
        basis: string;
    }[];
}
export interface YongsinFacts {
    /** 억부(抑扶) — 신강신약 참고판정에 따른 희신·기신 오행 후보. */
    eokbu: {
        method: string;
        favorable: Element[];
        unfavorable: Element[];
        basis: string;
    };
    /** 조후(調候) — 궁통보감 月支×日干 표 기반. main=主用神, sub=次·佐(천간). */
    johu: {
        season: string;
        main: Stem[];
        sub: Stem[];
        /** 원문 조건 분기(있으면). */
        cond?: string;
        basis: string;
    };
}
export interface AnalysisFacts {
    strength: StrengthFacts;
    gyeokguk: GyeokgukFacts;
    yongsin: YongsinFacts;
}
export declare function analysisFacts(bazi: Bazi): AnalysisFacts;
export {};
//# sourceMappingURL=analysis.d.ts.map