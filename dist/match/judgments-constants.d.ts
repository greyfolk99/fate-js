/**
 * 궁합 판단(判斷)용 명리 상수 — 납음·신살 룩업 테이블.
 * 문헌 대조로 검증한 값만 담는다. 유파가 갈리는 항목은 주석에 대안을 남긴다.
 */
import type { STEMS, BRANCHES, ELEMENTS } from "../constants.js";
type Stem = typeof STEMS[number];
type Branch = typeof BRANCHES[number];
type Element = typeof ELEMENTS[number];
/**
 * 60갑자 → 30 납음오행(納音五行).
 *
 * 60갑자는 두 간지씩 짝지어 같은 납음을 공유한다(첫 짝 甲子·乙丑 = 海中金).
 * 배열 인덱스 k(0..29) 는 60간지 순번 2k, 2k+1 짝에 해당한다.
 * (간지 순번 n → 천간 STEMS[n%10], 지지 BRANCHES[n%12].)
 *
 * 검증: Baidu Baike 六十甲子纳音表 · sajuabc 납음오행표 · 每日頭條 納音表.
 * 두 독립 출처(중문·한글)가 30짝 전부 일치.
 * (白蠟金은 白鑞金, 釵釧金은 "차천금"으로도 표기되나 오행 배정은 동일.)
 */
export declare const NAYIN_PAIRS: readonly {
    name: string;
    element: Element;
}[];
/**
 * 삼합(三合) 그룹별 도화(桃花)·역마(驛馬)·화개(華蓋) 지지.
 * 어떤 지지든 자신이 속한 삼합 그룹으로 매핑해 조회한다.
 *
 * - 도화 = 왕지 다음(목욕沐浴) 자리, 子午卯酉 중 하나.
 * - 역마 = 장생지와 충하는 자리, 寅申巳亥 중 하나.
 * - 화개 = 묘(墓) 자리, 辰戌丑未 중 하나.
 *
 * 검증: namu.wiki(신살)·sazasaju·sajuabc — 세 신살 전부 출처 만장일치.
 */
export declare const SINSAL_FROM_SAMHAP: Record<Branch, {
    dohwa: Branch;
    yeokma: Branch;
    hwagae: Branch;
}>;
/**
 * 홍염살(紅艶殺) — 일간 기준.
 * sajuabc "정통" 다수설 표. 유파 이설: 甲乙壬은 申으로 보는 표도 있고
 * (午↔申 분기), 己는 표에서 빠지기도 한다. 여기선 다수설로 고정.
 */
export declare const HONGYEOM_BY_STEM: Record<Stem, Branch>;
/**
 * 천을귀인(天乙貴人) — 일간 기준, 각 2지.
 * 고전 결(訣): 甲戊庚牛羊(丑未), 乙己鼠猴(子申), 丙丁猪鷄(亥酉),
 * 六辛馬虎(午寅), 壬癸兔蛇(卯巳). 신살 중 가장 안정적(만장일치).
 */
export declare const CHEONEUL_BY_STEM: Record<Stem, readonly Branch[]>;
/**
 * 문창귀인(文昌貴人) — 일간 기준(일간의 식신 지지·장생 계열). 만장일치.
 */
export declare const MUNCHANG_BY_STEM: Record<Stem, Branch>;
/**
 * 양인살(羊刃/陽刃) — 일간 기준.
 * 양간(甲丙戊庚壬) 5개가 정설: 甲卯·丙午·戊午·庚酉·壬子.
 * 음간(乙丁己辛癸)은 다수설이 "양인 없음"으로 보나, 소수설 음인(陰刃)
 * 표(乙辰·丁未·己未·辛戌·癸丑)를 참고값으로 함께 싣는다(학파 의존).
 */
export declare const YANGIN_BY_STEM: Record<Stem, Branch>;
/**
 * 백호살(白虎大殺) — 특정 60갑자 7주. 출처 만장일치(이설 없음).
 * 甲辰·乙未·丙戌·丁丑·戊辰·壬戌·癸丑.
 */
export declare const BAEKHO_PILLARS: ReadonlySet<string>;
/**
 * 괴강살(魁罡) — 특정 60갑자 주.
 * 정설 4주(庚辰·庚戌·壬辰·戊戌)만 담는다.
 * 이설: 壬戌·戊辰 을 더해 6주로 보는 표도 있음(戊辰·壬戌는 논쟁적).
 * 극소수설로 甲辰을 넣기도 함 — 여기선 논쟁 없는 4주로 고정.
 */
export declare const GWAEGANG_PILLARS: ReadonlySet<string>;
/**
 * 귀문관살(鬼門關殺) — 지지 쌍 6종.
 * 子酉·丑午·寅未·卯申·辰亥·巳戌.
 * 원진(怨嗔)과 4쌍(丑午·卯申·辰亥·巳戌) 겹치며, 子·寅 쌍에서 갈린다
 * (귀문 子酉·寅未 vs 원진 子未·寅酉).
 */
export declare const GWIMUN_PAIRS: ReadonlyArray<Readonly<Set<Branch>>>;
export {};
//# sourceMappingURL=judgments-constants.d.ts.map