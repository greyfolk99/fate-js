import type { MatchSubject, MatchSheet } from "./types.js";
export declare const MATCHSHEET_SCHEMA_VERSION = "match-sheet-v2";
/**
 * 두 사주 사이의 명리 관계를 정형 포맷으로 빠짐없이 추출한다.
 *
 * 계산으로 딱 떨어지는 관계(천간합·충, 지지 육합·삼합·방합·충·형·파·해·원진,
 * 지장간 암합, 오행 보완)를 facts 에 담는다. 결정론으로 뽑히는 판단 파생값
 * (십성·납음·신살·겉속궁합 분류)은 judgments 섹션에 별도로 담는다.
 * 유파별 정량화가 필요한 값(신강신약·용신)은 여전히 제외 — 별도 처리.
 *
 * 종합 점수는 만들지 않는다(하류 LLM 의 몫). 관계가 없어도 `present:false`
 * 로 항상 한 줄 남겨 인풋 차원을 고정한다.
 */
export declare function matchSheet(subject: MatchSubject, candidate: MatchSubject): MatchSheet;
/**
 * 궁합 시트를 GLM 프롬프트용 한자 텍스트 블록으로 렌더한다.
 * 관계를 3렌즈(合/生/沖)로 묶는다. 성립사실(facts)은 성립한 것만 노출하고
 * (차원 고정은 구조체가 담당), 등급 판단(配星·用神·調候 공급)은 生 줄에 항상
 * 덧붙인다 — 등급은 부재도 정보라 調候 主 부재는 無 토큰으로 표기(라벨 계약).
 * 신살·납음·궁위는 【보조】로 붙인다(rationale 재료).
 *
 * includeHarm: 忌神 유입·剋用神 줄 노출 여부(기본 꺼짐). 발화율 실측(800쌍)에서
 * 기신 투출 99%·剋 99%로 "서로 기신을 대줌" 앵커가 상수화되어 v2.1 보완 일관성이
 * 91→65%로 붕괴했다. 상대량 규칙을 가진 전용 프롬프트에서만 켤 것.
 *
 * includeWangswe: 【沖旺衰】 줄(六沖별 왕쇠·뽑히는 쪽) 노출 여부(기본 꺼짐).
 * 온도 방향 분리(temp_A/B) 재료 — 읽는 규칙을 가진 프롬프트에서만 켤 것.
 */
export declare function formatMatchSheet(sheet: MatchSheet, opts?: {
    includeHarm?: boolean;
    includeWangswe?: boolean;
}): string;
//# sourceMappingURL=matchsheet.d.ts.map