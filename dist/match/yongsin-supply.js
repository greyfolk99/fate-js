import { analysisFacts } from "../bazi/analysis.js";
import { STEM_ELEMENTS, BRANCH_ELEMENTS, HIDDEN_STEMS, CONTROLS } from "../constants.js";
const EL_KO = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
/** 상대 원국의 오행 — visible=천간 4자(투출), grounded=천간+지지 본기. */
function partnerElements(partner) {
    const cells = [partner.year, partner.month, partner.day, partner.hour].filter((p) => p != null);
    const visible = new Set(cells.map((c) => STEM_ELEMENTS[c.stem]));
    const grounded = new Set([...visible, ...cells.map((c) => BRANCH_ELEMENTS[c.branch])]);
    const visibleStems = new Set(cells.map((c) => c.stem));
    const allStems = new Set(visibleStems);
    for (const c of cells)
        for (const hs of HIDDEN_STEMS[c.branch])
            allStems.add(hs);
    return { visible, grounded, visibleStems, allStems };
}
/** 억부 희신 커버·투출 — "희신 X중 Y공급(Z는 투출)" 사실. */
function eokbuSupplyJudgment(id, meLabel, partnerLabel, partner, favorable) {
    const p = partnerElements(partner);
    const covered = favorable.filter((e) => p.grounded.has(e));
    const revealed = favorable.filter((e) => p.visible.has(e));
    const present = covered.length > 0;
    const favStr = favorable.map((e) => EL_KO[e]).join("");
    const covStr = covered.map((e) => EL_KO[e]).join("");
    const revStr = revealed.map((e) => EL_KO[e]).join("");
    return {
        id, label: `${meLabel} 억부용신 공급`, category: `${covered.length}/${favorable.length}`, present,
        statement: present
            ? `${meLabel} 억부 희신 ${favStr} 중 ${partnerLabel} 원국이 ${covStr}을(를) 공급` +
                (revealed.length ? ` — ${revStr}은(는) 천간 투출.` : " — 투출 없음(지지·본기).")
            : `${partnerLabel} 원국은 ${meLabel} 억부 희신 ${favStr}을(를) 공급하지 않음.`,
        source: "억부용신 공급",
        detail: {
            favorable: favorable.map((e) => EL_KO[e]),
            covered: covered.map((e) => EL_KO[e]),
            revealed: revealed.map((e) => EL_KO[e]),
        },
    };
}
/** 조후 用神(특정 천간) 공급 — 투출(천간)인가 암장(지장간)인가 구분. */
function johuSupplyJudgment(id, meLabel, partnerLabel, partner, main, sub) {
    const p = partnerElements(partner);
    const mainRevealed = main.filter((s) => p.visibleStems.has(s));
    const mainHidden = main.filter((s) => !p.visibleStems.has(s) && p.allStems.has(s));
    const subHit = sub.filter((s) => p.allStems.has(s));
    const present = mainRevealed.length > 0 || mainHidden.length > 0;
    return {
        id, label: `${meLabel} 조후용신 공급`, category: mainRevealed.length > 0 ? "투출" : present ? "암장" : false,
        present,
        statement: present
            ? `${meLabel} 조후 主用神 ${main.join("")} 중 ` +
                [
                    mainRevealed.length ? `${mainRevealed.join("")}이(가) ${partnerLabel} 천간에 투출` : "",
                    mainHidden.length ? `${mainHidden.join("")}은(는) 지장간에만 암장` : "",
                ].filter(Boolean).join(", ") +
                (subHit.length ? ` (次佐 ${subHit.join("")}도 있음).` : ".")
            : `${partnerLabel} 원국은 ${meLabel} 조후 主用神 ${main.join("")}을(를) 갖고 있지 않음.`,
        source: "조후용신 공급(궁통보감 표)",
        detail: { main, sub, mainRevealed, mainHidden, subHit },
    };
}
/** 공급의 거울 — 상대 원국이 내 억부 기신(忌神)을 유입시키거나 희신을 극하는가.
 * 기신 정의 = analysis.ts yongsin.eokbu.unfavorable(억부 반대편, 滴天髓 衰旺 원리).
 * 剋은 천간(투출 오행) 단위로만 본다 — 지장간 극은 잡음이라 사실로 안 찍는다. */
function harmJudgment(id, meLabel, partnerLabel, partner, unfavorable, favorable) {
    const p = partnerElements(partner);
    const covered = unfavorable.filter((e) => p.grounded.has(e));
    const revealed = unfavorable.filter((e) => p.visible.has(e));
    const keuk = [];
    for (const c of [partner.year, partner.month, partner.day, partner.hour]) {
        if (c == null)
            continue;
        const el = STEM_ELEMENTS[c.stem];
        const hit = favorable.find((f) => CONTROLS[el] === f);
        if (hit)
            keuk.push(`${c.stem}剋${EL_KO[hit]}`);
    }
    const keukUniq = [...new Set(keuk)];
    const present = covered.length > 0 || keukUniq.length > 0;
    const unfStr = unfavorable.map((e) => EL_KO[e]).join("");
    const covStr = covered.map((e) => EL_KO[e]).join("");
    const revStr = revealed.map((e) => EL_KO[e]).join("");
    return {
        id, label: `${meLabel} 기신 유입·용신 극`, category: revealed.length > 0 ? "투출" : present ? "암장" : false,
        present,
        statement: present
            ? [
                covered.length
                    ? `${meLabel} 억부 기신 ${unfStr} 중 ${partnerLabel} 원국이 ${covStr}을(를) 유입` +
                        (revealed.length ? ` — ${revStr}은(는) 천간 투출.` : " — 투출 없음(지지·본기).")
                    : "",
                keukUniq.length ? `${partnerLabel} 천간이 ${meLabel} 희신을 극: ${keukUniq.join("·")}.` : "",
            ].filter(Boolean).join(" ")
            : `${partnerLabel} 원국은 ${meLabel} 기신 ${unfStr}을(를) 유입시키지 않고 희신을 극하지도 않음.`,
        source: "억부용신 공급(거울면)",
        detail: {
            unfavorable: unfavorable.map((e) => EL_KO[e]),
            covered: covered.map((e) => EL_KO[e]),
            revealed: revealed.map((e) => EL_KO[e]),
            keuk: keukUniq,
        },
    };
}
export function yongsinSupply(subject, candidate) {
    const a = analysisFacts(subject.bazi).yongsin;
    const b = analysisFacts(candidate.bazi).yongsin;
    return {
        eokbuToSubject: eokbuSupplyJudgment("yongsin_eokbu_subject", "주체", "후보", candidate.bazi, a.eokbu.favorable),
        eokbuToCandidate: eokbuSupplyJudgment("yongsin_eokbu_candidate", "후보", "주체", subject.bazi, b.eokbu.favorable),
        johuToSubject: johuSupplyJudgment("johu_subject", "주체", "후보", candidate.bazi, a.johu.main, a.johu.sub),
        johuToCandidate: johuSupplyJudgment("johu_candidate", "후보", "주체", subject.bazi, b.johu.main, b.johu.sub),
        harmToSubject: harmJudgment("yongsin_harm_subject", "주체", "후보", candidate.bazi, a.eokbu.unfavorable, a.eokbu.favorable),
        harmToCandidate: harmJudgment("yongsin_harm_candidate", "후보", "주체", subject.bazi, b.eokbu.unfavorable, b.eokbu.favorable),
    };
}
//# sourceMappingURL=yongsin-supply.js.map