/**
 * 1인 원국 2단계 — 신강신약(身强身弱)·격국(格局)·용신(用神)을 "사실"로 뽑는다.
 *
 * 철학: 점수·최종판정은 박지 않는다(그건 다운스트림 ML/LLM 몫).
 * 판정을 좌우하는 결정론 사실(득령·득지·득세·통근·투출·투출격 후보·
 * 억부 희기 오행)만 담고, "신강/신약·X격·용신 Y"는 다수설 참고 라벨로만.
 */
import { STEM_ELEMENTS, HIDDEN_STEMS, GENERATES, CONTROLS, CONTROLLED_BY, ELEMENTS, } from "../constants.js";
import { cells } from "../match/rules.js";
import { tenGod } from "../match/judgments.js";
import { JOHU_TABLE } from "./johu-table.js";
const GROUP_OF = {
    "비견": "비겁", "겁재": "비겁",
    "편인": "인성", "정인": "인성",
    "식신": "식상", "상관": "식상",
    "편재": "재성", "정재": "재성",
    "편관": "관성", "정관": "관성",
};
/** 일간 오행 기준 각 오행군의 오행. */
function groupElements(dm) {
    // 인성 = 일간을 생하는 오행, 관성 = 일간을 극하는 오행.
    let generator = dm;
    for (const e of ELEMENTS)
        if (GENERATES[e] === dm)
            generator = e;
    return {
        비겁: dm,
        인성: generator,
        식상: GENERATES[dm],
        재성: CONTROLS[dm],
        관성: CONTROLLED_BY[dm],
    };
}
// ── 신강신약 ────────────────────────────────────────────────────────
const HIDDEN_ROLE = ["정기(正氣)", "중기(中氣)", "여기(餘氣)"];
function roleAt(count, idx) {
    if (count === 1)
        return "정기(正氣)";
    if (count === 2)
        return idx === 0 ? "정기(正氣)" : "여기(餘氣)";
    return HIDDEN_ROLE[idx];
}
function strengthFacts(bazi) {
    const dm = bazi.day.stem;
    const dmElement = STEM_ELEMENTS[dm];
    const cs = cells(bazi);
    // 득령 — 월지 본기 기준.
    const monthMain = HIDDEN_STEMS[bazi.month.branch][0];
    const monthTenGod = tenGod(dm, monthMain);
    const deukryeong = {
        present: GROUP_OF[monthTenGod] === "비겁" || GROUP_OF[monthTenGod] === "인성",
        monthBranchTenGod: monthTenGod,
    };
    // 득지 — 일지 지장간에 비겁·인성.
    const dayRoots = [];
    for (const hs of HIDDEN_STEMS[bazi.day.branch]) {
        const g = tenGod(dm, hs);
        if (GROUP_OF[g] === "비겁" || GROUP_OF[g] === "인성")
            dayRoots.push({ stem: hs, tenGod: g });
    }
    const deukji = { present: dayRoots.length > 0, roots: dayRoots };
    // 득세 — 세력 카운트(일간 자신 제외).
    const tally = (withHidden) => {
        const byGroup = { 비겁: 0, 인성: 0, 식상: 0, 재성: 0, 관성: 0 };
        for (const c of cs) {
            if (c.name !== "day")
                byGroup[GROUP_OF[tenGod(dm, c.stem)]]++;
            if (withHidden) {
                for (const hs of HIDDEN_STEMS[c.branch])
                    byGroup[GROUP_OF[tenGod(dm, hs)]]++;
            }
            else {
                byGroup[GROUP_OF[tenGod(dm, HIDDEN_STEMS[c.branch][0])]]++;
            }
        }
        return {
            ally: byGroup.비겁 + byGroup.인성,
            foe: byGroup.식상 + byGroup.재성 + byGroup.관성,
            byGroup,
        };
    };
    const deukse = { simple: tally(false), withHidden: tally(true) };
    // 통근 — 일간이 뿌리내린 기둥. 표준 정의는 지장간에 일간과 같은 오행(비겁)이
    // 있는 것만이다. 인성은 생조(生助)이지 뿌리가 아니므로 세지 않는다 — 인성
    // 세력은 득지·득세(byGroup)에 이미 반영되어 있다.
    const rooting = [];
    for (const c of cs) {
        const via = [];
        for (const hs of HIDDEN_STEMS[c.branch]) {
            if (STEM_ELEMENTS[hs] === dmElement)
                via.push({ stem: hs, kind: "비겁" });
        }
        if (via.length)
            rooting.push({ pillar: c.name, via });
    }
    // 투출 — 지장간이 천간에 드러남.
    const stemPositions = new Map();
    for (const c of cs) {
        if (!stemPositions.has(c.stem))
            stemPositions.set(c.stem, []);
        stemPositions.get(c.stem).push(c.name);
    }
    const revealed = [];
    for (const c of cs) {
        for (const hs of HIDDEN_STEMS[c.branch]) {
            const at = stemPositions.get(hs);
            if (at)
                revealed.push({ stem: hs, fromBranch: c.name, atStems: at });
        }
    }
    // 참고 판정 — 다수설 휴리스틱(득령·득지·세력우세 중 2↑ → 신강).
    const strong = [
        deukryeong.present,
        deukji.present,
        deukse.withHidden.ally >= deukse.withHidden.foe,
    ].filter(Boolean).length;
    const verdict = strong >= 2 ? "신강" : strong === 0 ? "신약" : "중화";
    const reference = {
        verdict: verdict,
        basis: "득령·득지·득세(지장간가중) 셋 중 성립 개수(2↑=신강, 0=신약, 1=중화). 다수설 개략 — 최종판정은 다운스트림 몫.",
    };
    return { dayElement: dmElement, deukryeong, deukji, deukse, rooting, revealed, reference };
}
// ── 격국 ────────────────────────────────────────────────────────────
function gyeokName(g) {
    const map = {
        "정관": "정관격(正官格)", "편관": "편관격(偏官格·七殺)",
        "정재": "정재격(正財格)", "편재": "편재격(偏財格)",
        "정인": "정인격(正印格)", "편인": "편인격(偏印格)",
        "식신": "식신격(食神格)", "상관": "상관격(傷官格)",
        "비견": "건록격(建祿格)", "겁재": "양인격(羊刃格)",
    };
    return map[g];
}
function gyeokgukFacts(bazi) {
    const dm = bazi.day.stem;
    const mb = bazi.month.branch;
    const hidden = HIDDEN_STEMS[mb];
    const monthHiddenStems = hidden.map((hs, i) => ({
        stem: hs, tenGod: tenGod(dm, hs), role: roleAt(hidden.length, i),
    }));
    // 사주 천간 위치.
    const stemPositions = new Map();
    for (const c of cells(bazi)) {
        if (!stemPositions.has(c.stem))
            stemPositions.set(c.stem, []);
        stemPositions.get(c.stem).push(c.name);
    }
    const revealed = monthHiddenStems
        .map((h) => ({ ...h, atStems: stemPositions.get(h.stem) ?? [] }))
        .filter((h) => h.atStems.length > 0);
    // 격 후보 — 투출 우선(정기>중기>여기), 없으면 월령 본기.
    const candidates = [];
    if (revealed.length) {
        for (const r of revealed) {
            candidates.push({ name: gyeokName(r.tenGod), tenGod: r.tenGod, basis: `월지 ${r.role} 투출` });
        }
    }
    else {
        const main = monthHiddenStems[0];
        candidates.push({ name: gyeokName(main.tenGod), tenGod: main.tenGod, basis: "월령 본기(투출 없음)" });
    }
    return { monthBranch: mb, monthHiddenStems, revealed, candidates };
}
// ── 용신 ────────────────────────────────────────────────────────────
const SEASON_OF = {
    "寅": "봄(春)", "卯": "봄(春)", "辰": "봄(春)",
    "巳": "여름(夏)", "午": "여름(夏)", "未": "여름(夏)",
    "申": "가을(秋)", "酉": "가을(秋)", "戌": "가을(秋)",
    "亥": "겨울(冬)", "子": "겨울(冬)", "丑": "겨울(冬)",
};
function yongsinFacts(bazi, strength) {
    const dm = STEM_ELEMENTS[bazi.day.stem];
    const ge = groupElements(dm);
    // 억부 — 참고판정 기준.
    const strong = strength.reference.verdict === "신강";
    const favorable = strong
        ? [ge.식상, ge.재성, ge.관성]
        : [ge.인성, ge.비겁];
    const unfavorable = strong
        ? [ge.비겁, ge.인성]
        : [ge.식상, ge.재성, ge.관성];
    // 조후 — 궁통보감 月支×日干 표(johu-table.ts, edition-lock·교차검증 수렴본).
    const season = SEASON_OF[bazi.month.branch];
    const johu = JOHU_TABLE[bazi.day.stem][bazi.month.branch];
    return {
        eokbu: {
            method: "억부(抑扶)",
            favorable,
            unfavorable,
            basis: `참고판정 ${strength.reference.verdict} → ${strong ? "설기·극(식상·재·관)" : "생조(인성·비겁)"} 희신. 최종 용신은 다운스트림 몫.`,
        },
        johu: {
            season,
            main: [...johu.main],
            sub: [...johu.sub],
            ...(johu.cond ? { cond: johu.cond } : {}),
            basis: "궁통보감 조후표(月支×日干) — 표 사실만, 취사는 다운스트림 몫.",
        },
    };
}
export function analysisFacts(bazi) {
    const strength = strengthFacts(bazi);
    return {
        strength,
        gyeokguk: gyeokgukFacts(bazi),
        yongsin: yongsinFacts(bazi, strength),
    };
}
//# sourceMappingURL=analysis.js.map