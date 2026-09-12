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
import { analyze } from "./analyze.js";
export const BAZISHEET_SCHEMA_VERSION = "bazi-sheet-v2";
export const BAZISHEET_POLICY_VERSION = "bazi-sheet/2026-09";
// ── 코드 맵(머신키) ─────────────────────────────────────────────────
const EL = {
    wood: "木", fire: "火", earth: "土", metal: "金", water: "水",
};
const YY = { yang: "陽", yin: "陰" };
const TG = {
    "비견": "比肩", "겁재": "劫財", "식신": "食神", "상관": "傷官", "편재": "偏財",
    "정재": "正財", "편관": "偏官", "정관": "正官", "편인": "偏印", "정인": "正印",
};
const GRP = {
    "비겁": "比劫", "인성": "印星", "식상": "食傷", "재성": "財星", "관성": "官星",
};
const VERDICT = { "신강": "身強", "신약": "身弱", "중화": "中和" };
const REL = {
    stem_hap: "天干合", stem_clash: "天干沖",
    branch_yukhap: "地支六合", branch_clash: "地支沖",
    branch_hae: "害", branch_pa: "破", branch_wonjin: "怨嗔", branch_hyung: "刑",
    branch_samhap: "地支三合", branch_samhap_ban: "地支三合半合",
    branch_banghap: "地支方合", branch_banghap_ban: "地支方合半合",
};
const SP = {
    cheoneul: "天乙貴人", munchang: "文昌貴人", hongyeom: "紅艶殺",
    yangin: "羊刃", baekho: "白虎大殺", gwaegang: "魁罡", gwimun: "鬼門關殺",
};
/** "장성살(將星殺)"·"정기(正氣)"·"여름(夏)" → 괄호 안 한자만. */
function hanja(s) {
    return s.match(/[(（]([^)）]+)[)）]/)?.[1] ?? s;
}
const el = (e) => EL[e];
const yy = (v) => YY[v];
const tg = (g) => (g == null ? null : TG[g]);
const mapElementCount = (ec) => ({
    "木": ec.wood, "火": ec.fire, "土": ec.earth, "金": ec.metal, "水": ec.water,
});
const mapGroupCount = (g) => ({
    "比劫": g["비겁"], "印星": g["인성"], "食傷": g["식상"], "財星": g["재성"], "官星": g["관성"],
});
// ── 변환 ────────────────────────────────────────────────────────────
/** BaziAnalysis(BaziAnalysis) → baziSheet. 순수 함수(표현 정규화만). */
export function toBaziSheet(n) {
    if (n.pillars.length !== 4) {
        throw new Error("baziSheet는 4기둥(시주 포함)이 필요합니다 — 출생시가 없으면 산출 불가");
    }
    if (!n.gender)
        throw new Error("baziSheet는 gender가 필요합니다");
    const s = n.analysis.strength;
    const g = n.analysis.gyeokguk;
    const y = n.analysis.yongsin;
    // 격 후보의 근거: 월지 지장간이 천간에 투출했으면 透出, 아니면 본기(本氣).
    // (BaziAnalysis candidates 는 투출이 있으면 전부 투출 후보, 없으면 본기 후보 1개.)
    const gyeokgukBasis = () => (g.revealed.length > 0 ? "月令透出" : "月令本氣");
    return {
        schemaVersion: BAZISHEET_SCHEMA_VERSION,
        // bazi는 스키마 필드(year/month/day/hour)만 화이트리스트 — 원본 pass-through 시
        // 런타임 입력에 여분 property가 있으면 스키마 additionalProperties:false 를 깬다.
        bazi: {
            year: { stem: n.bazi.year.stem, branch: n.bazi.year.branch },
            month: { stem: n.bazi.month.stem, branch: n.bazi.month.branch },
            day: { stem: n.bazi.day.stem, branch: n.bazi.day.branch },
            hour: n.bazi.hour ? { stem: n.bazi.hour.stem, branch: n.bazi.hour.branch } : null,
        },
        gender: n.gender,
        dayMaster: { glyph: n.dayMaster.glyph, element: el(n.dayMaster.element), yinyang: yy(n.dayMaster.yinyang) },
        pillars: n.pillars.map((p) => ({
            name: p.name,
            ganzhi: p.ganzhi,
            stem: { glyph: p.stem.glyph, element: el(p.stem.element), yinyang: yy(p.stem.yinyang), tenGod: tg(p.stem.tenGod) },
            branch: {
                glyph: p.branch.glyph,
                element: el(p.branch.element),
                yinyang: yy(p.branch.yinyang),
                tenGod: tg(p.branch.tenGod),
                hiddenStems: p.branch.hiddenStems.map((h) => ({
                    glyph: h.glyph, element: el(h.element), yinyang: yy(h.yinyang), tenGod: tg(h.tenGod), role: hanja(h.role),
                })),
                twelveStage: hanja(p.branch.twelveStage),
            },
            nayin: (() => {
                if (!p.nayin)
                    throw new Error(`납음 없음(불가능한 간지): ${p.ganzhi}`);
                return { name: p.nayin.name, element: el(p.nayin.element) };
            })(),
        })),
        tenGodDistribution: Object.fromEntries(Object.entries(TG).map(([ko, code]) => [code, n.tenGodDistribution[ko]])),
        elementDistribution: {
            simple: mapElementCount(n.elementDistribution.simple),
            withHidden: mapElementCount(n.elementDistribution.withHidden),
        },
        analysis: {
            strength: {
                dayElement: el(s.dayElement),
                deukryeong: { present: s.deukryeong.present, monthBranchTenGod: tg(s.deukryeong.monthBranchTenGod) },
                deukji: { present: s.deukji.present, roots: s.deukji.roots.map((r) => ({ stem: r.stem, tenGod: TG[r.tenGod] })) },
                deukse: {
                    simple: { ally: s.deukse.simple.ally, foe: s.deukse.simple.foe, byGroup: mapGroupCount(s.deukse.simple.byGroup) },
                    withHidden: { ally: s.deukse.withHidden.ally, foe: s.deukse.withHidden.foe, byGroup: mapGroupCount(s.deukse.withHidden.byGroup) },
                },
                rooting: s.rooting.map((r) => ({ pillar: r.pillar, via: r.via.map((v) => ({ stem: v.stem, kind: GRP[v.kind] })) })),
                revealed: s.revealed.map((r) => ({ stem: r.stem, fromBranch: r.fromBranch, atStems: r.atStems })),
                byRule: [{ rule: "抑扶", result: VERDICT[s.reference.verdict] }],
            },
            gyeokguk: {
                monthBranch: g.monthBranch,
                monthHiddenStems: g.monthHiddenStems.map((h) => ({ stem: h.stem, tenGod: TG[h.tenGod], role: hanja(h.role) })),
                revealed: g.revealed.map((r) => ({ stem: r.stem, tenGod: TG[r.tenGod], role: hanja(r.role), atStems: r.atStems })),
                candidates: g.candidates.map((c) => ({ basedOn: TG[c.tenGod], basis: gyeokgukBasis() })),
            },
            yongsin: {
                eokbu: { favorable: y.eokbu.favorable.map(el), unfavorable: y.eokbu.unfavorable.map(el) },
                johu: {
                    season: hanja(y.johu.season),
                    main: [...y.johu.main],
                    sub: [...y.johu.sub],
                    ...(y.johu.cond ? { cond: y.johu.cond } : {}),
                },
            },
            relations: n.internalRelations.map((r) => ({
                kind: REL[r.id] ?? r.id,
                detail: r.id === "branch_hyung" && r.label.includes("·") ? hanja(r.label.split("·")[1]) : null,
                polarity: r.polarity,
                pillars: r.pillars,
                glyphs: r.glyphs,
                // 삼합·방합의 오행국(化한 오행). present-only — 있는 관계만.
                ...(r.element ? { element: el(r.element) } : {}),
            })),
            void: n.voidBranches,
        },
        twelveSinsal: {
            fromYear: n.pillars.map((p) => hanja(p.branch.sinsalFromYear)),
            fromDay: n.pillars.map((p) => hanja(p.branch.sinsalFromDay)),
        },
        specialSinsal: n.sinsal
            .filter((x) => x.present)
            .map((x) => ({ code: SP[x.id] ?? x.id, pillars: x.pillars })),
        policyVersion: BAZISHEET_POLICY_VERSION,
    };
}
/** 사주 한 벌 → baziSheet(원국+분석 시트). 4기둥·성별 필수(타입이 런타임 전제조건과 일치). */
export function baziSheet(subject) {
    return toBaziSheet(analyze(subject));
}
/**
 * baziSheet 를 GLM 프롬프트·UI용 한자 한 줄로 렌더한다.
 * 간지·일간·강약·용신·오행분포(장간포함)·격국후보·공망을 압축한다.
 */
export function formatBaziSheet(b, tag = "원국") {
    const el = Object.entries(b.elementDistribution.withHidden)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${k}${n}`)
        .join(" ");
    const str = b.analysis.strength.byRule.map((s) => `${s.rule}:${s.result}`).join("/") || "—";
    const yong = b.analysis.yongsin.eokbu.favorable.join("") || "—";
    const gg = b.analysis.gyeokguk.candidates.map((g) => `${g.basedOn}(${g.basis})`).join(",") || "—";
    const vd = b.analysis.void.join("") || "—";
    // 통근 — 일간과 같은 오행(비겁) 뿌리만(인성 생조는 통근 아님). 무근은 종격
    // (滴天髓 從象) 논의의 1차 사실이라 명시하되, 생조(인성) 유무는 오행분포로
    // 별도 확인 가능. 격 이름 확정은 안 함(임계는 유파 갈림 → 하류 몫).
    const PILLAR_HANJA = { year: "年", month: "月", day: "日", hour: "時" };
    const rooting = b.analysis.strength.rooting;
    const root = rooting.length === 0 ? "無根" : rooting.map((r) => PILLAR_HANJA[r.pillar] ?? r.pillar).join("");
    // 조후 — 궁통보감 표의 主(次佐) 천간. 조건 분기는 구조체(cond)에만.
    const jh = b.analysis.yongsin.johu;
    const johu = jh.main.join("") + (jh.sub.length ? `(${jh.sub.join("")})` : "");
    return (`【${tag}】 ${b.pillars.map((p) => p.ganzhi).join(" ")} · 일간 ${b.dayMaster.glyph}${b.dayMaster.element}` +
        ` · 강약 ${str} · 통근 ${root} · 용신 ${yong} · 조후 ${johu} · 오행 ${el} · 격국 ${gg} · 공망 ${vd}`);
}
//# sourceMappingURL=bazisheet.js.map