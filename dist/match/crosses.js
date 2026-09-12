import { BRANCHES, STEM_INDEX, BRANCH_INDEX } from "../constants.js";
import { twelveStage, twelveSinsal } from "../bazi/constants.js";
const PILLAR_KO = { year: "년", month: "월", day: "일", hour: "시" };
/** 순중공망(旬中空亡) — 일주 기준 공망 2지. 계산: 淵海子平·三命通會·命理約言(만장일치). */
function voidBranches(bazi) {
    const base = (BRANCH_INDEX[bazi.day.branch] - STEM_INDEX[bazi.day.stem] + 12) % 12;
    return [BRANCHES[(base + 10) % 12], BRANCHES[(base + 11) % 12]];
}
// ── 배우자궁 십이운성 교차 ──────────────────────────────────────────
// 상대 일간을 내 일지(=배우자궁)에 놓아 십이운성을 읽는다.
// 십이운성 계산=화토동법 만장일치(연해자평·자평진전). 배우자궁=일지는 자평진전
// "坐下財官" 근거(다수설). "배우자궁 12운성으로 궁합 본다"는 적용법은 원전 근거
// 부재=현대 통용 — 시트엔 사실(운성 단계)만 싣고 길흉 해석은 LLM 몫.
function spouseGungStage(id, meLabel, partnerLabel, me, partner) {
    const stage = twelveStage(partner.day.stem, me.day.branch);
    return {
        id,
        label: `${meLabel} 배우자궁 십이운성`,
        category: stage,
        present: true,
        statement: `${partnerLabel} 일간 ${partner.day.stem}이(가) ${meLabel} 일지 ${me.day.branch}(배우자궁)에서 십이운성 ${stage}.`,
        source: "십이운성(화토동법)",
        detail: { partnerDayStem: partner.day.stem, myDayBranch: me.day.branch, stage },
    };
}
// ── 공망 교차 ──────────────────────────────────────────────────────
// 상대 일지가 내 순중공망 2지에 드는가. 계산은 만장일치, 궁합 통변은 현대 통용.
function voidCross(id, meLabel, partnerLabel, me, partner) {
    const voids = voidBranches(me);
    const hit = voids.includes(partner.day.branch);
    return {
        id,
        label: `${meLabel} 공망 교차`,
        category: hit,
        present: hit,
        statement: hit
            ? `${meLabel} 순중공망 ${voids.join("·")}에 ${partnerLabel} 일지 ${partner.day.branch}이(가) 듦.`
            : `${partnerLabel} 일지 ${partner.day.branch}은(는) ${meLabel} 순중공망(${voids.join("·")})에 들지 않음.`,
        source: "순중공망(旬中空亡)",
        detail: { voids, hit },
    };
}
// ── 일주 대조 ──────────────────────────────────────────────────────
// 두 일주의 천간·지지 일치 여부. 순수 문자 비교. "동일일주/천간지동" 궁합 적용법
// 자체는 원전 근거 부재=현대 통용 — 시트엔 일치 사실만.
function dayPillarMatch(id, a, b) {
    const aStem = a.day.stem, aBr = a.day.branch, bStem = b.day.stem, bBr = b.day.branch;
    const sameStem = aStem === bStem, sameBranch = aBr === bBr;
    const category = sameStem && sameBranch ? "동일일주"
        : sameStem ? "천간동" : sameBranch ? "일지동" : "무";
    const statement = category === "동일일주" ? `두 일주가 ${aStem}${aBr}로 동일.`
        : category === "천간동" ? `두 일간이 ${aStem}로 같고 일지(${aBr}/${bBr})는 다름.`
            : category === "일지동" ? `두 일지가 ${aBr}로 같고 일간(${aStem}/${bStem})은 다름.`
                : `두 일주 천간·지지 모두 다름(${aStem}${aBr}/${bStem}${bBr}).`;
    return {
        id, label: "일주 대조", category, present: category !== "무",
        statement, source: "일주 대조", detail: { sameStem, sameBranch },
    };
}
// ── 십이신살 교차(년지 삼합국 기준) ─────────────────────────────────
// 상대의 각 지지가 내 년지 삼합국 기준 어떤 12신살에 놓이는가.
// 매핑=삼합국 기반(三命通會 卷三 諸神煞). 기준=년지(원전 다수설); 일지 기준은 현대 통용.
// 12개 전부가 길흉이 아니므로(지살·장성·반안 등 중립·길신 포함) 길흉 판정은 넣지 않고
// "어느 지지가 어느 신살"이라는 매핑 사실만 싣는다.
function sinsalCross(id, meLabel, partnerLabel, me, partner) {
    const ref = me.year.branch;
    // 시주(hour)는 생시 미상 시 null — 있을 때만 포함한다.
    const cells = [
        { pillar: "year", branch: partner.year.branch },
        { pillar: "month", branch: partner.month.branch },
        { pillar: "day", branch: partner.day.branch },
    ];
    if (partner.hour)
        cells.push({ pillar: "hour", branch: partner.hour.branch });
    const map = cells.map((c) => ({
        pillar: c.pillar, branch: c.branch, sinsal: twelveSinsal(ref, c.branch),
    }));
    const dayEntry = map.find((m) => m.pillar === "day");
    return {
        id,
        label: `${meLabel} 년지 기준 ${partnerLabel} 십이신살 교차`,
        category: dayEntry.sinsal,
        present: true,
        statement: `${meLabel} 년지 ${ref} 삼합국 기준 ${partnerLabel} ` +
            map.map((m) => `${PILLAR_KO[m.pillar]}지 ${m.branch}=${m.sinsal}`).join(", ") + ".",
        source: "십이신살(년지 삼합국)",
        detail: { ref, mappings: map.map((m) => `${PILLAR_KO[m.pillar]}:${m.branch}:${m.sinsal}`) },
    };
}
export function crossJudgments(subject, candidate) {
    return {
        spouseGungStageForSubject: spouseGungStage("spouse_gung_stage_subject", "주체", "후보", subject, candidate),
        spouseGungStageForCandidate: spouseGungStage("spouse_gung_stage_candidate", "후보", "주체", candidate, subject),
        voidForSubject: voidCross("void_cross_subject", "주체", "후보", subject, candidate),
        voidForCandidate: voidCross("void_cross_candidate", "후보", "주체", candidate, subject),
        dayPillarMatch: dayPillarMatch("day_pillar_match", subject, candidate),
        sinsalCrossForSubject: sinsalCross("sinsal_cross_subject", "주체", "후보", subject, candidate),
        sinsalCrossForCandidate: sinsalCross("sinsal_cross_candidate", "후보", "주체", candidate, subject),
    };
}
//# sourceMappingURL=crosses.js.map