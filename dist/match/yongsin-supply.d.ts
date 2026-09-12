/**
 * 용신 공급(用神 供給) 교차 — 상대 원국이 내 희신을 "얼마나·어떻게" 공급하는가.
 *
 * ⚠️ boolean(공급 유/무)은 무작위 쌍에서 거의 항상 참(억부 99%·조후 74% 실측)이라
 * 분산 0 = 시트에 넣어도 teacher 가 변별 못 함. 그래서 등급 있는 사실로 담는다:
 *  - 커버 수: 희신 오행 중 상대 원국(천간+지지 본기)에 실재하는 오행들.
 *  - 투출(透出): 그중 상대 "천간 4자"에 드러난 오행/천간 — 명리에서 투출은
 *    지장간 암장과 격이 다른 canonical 개념(자평 격국론 전반). 실측 변별력:
 *    조후主 투출 34%, 억부 투출수 0/1/2/3+ = 8/45/43/4%.
 * 억부용신 원리 = 滴天髓 衰旺篇. 점수·판정 없음 — "무엇 중 무엇이 공급되고
 * 무엇이 투출인가"라는 사실만.
 *
 * ⚠️ 순환 import 방지: analysisFacts 를 쓰므로 judgeMatch 이 아니라
 * matchSheet(matchsheet.ts)에서 호출해 붙인다.
 */
import type { MatchSubject } from "./types.js";
import type { Judgment } from "./judgments-types.js";
export interface YongsinSupply {
    /** 후보 원국이 주체 억부용신을 공급하는가(커버·투출). */
    eokbuToSubject: Judgment;
    /** 주체 원국이 후보 억부용신을 공급하는가. */
    eokbuToCandidate: Judgment;
    /** 후보가 주체 조후용신을 공급하는가(투출/암장). */
    johuToSubject: Judgment;
    /** 주체가 후보 조후용신을 공급하는가. */
    johuToCandidate: Judgment;
    /** 후보가 주체 기신을 유입시키거나 주체 희신을 극하는가(공급의 거울). */
    harmToSubject: Judgment;
    /** 주체가 후보 기신을 유입시키거나 후보 희신을 극하는가. */
    harmToCandidate: Judgment;
}
export declare function yongsinSupply(subject: MatchSubject, candidate: MatchSubject): YongsinSupply;
//# sourceMappingURL=yongsin-supply.d.ts.map