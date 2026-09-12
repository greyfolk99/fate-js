import { baziVectorized, EPOCH_ORD } from "./engine.js";
import { toOrdinal } from "./date-util.js";
import { STEMS, BRANCHES } from "./constants.js";
import { getSolarConfig } from "./config.js";
import { solarCorrectionMinutes } from "./solar-time.js";
import { assertValidBirthInput } from "./validate.js";
import { resolveUtcOffsetMinutes } from "./timezone.js";
export function bazi(input) {
    assertValidBirthInput(input);
    const { year, month, day, hour, minute } = input;
    const hasTime = hour !== undefined;
    const cfg = getSolarConfig();
    const applySolar = input.timeBasis
        ? input.timeBasis === "solar"
        : cfg.applySolarTime;
    const dateOrd = toOrdinal(year, month, day); // 일주: 로컬 civil 날짜(진태양시로 안 굴림)
    const stdHour = hour ?? 0;
    const stdMinute = minute ?? 0;
    // ── 절기용 절대순간(UTC) ── 입력 로컬시각 − UTC오프셋. 진태양시는 절대순간을 안 바꾸므로 미적용.
    // 오프셋: utcOffsetMinutes 수동 지정 또는 timezone(IANA) 자동 해석 — XOR은 검증에서 보장됨.
    const offsetMin = input.utcOffsetMinutes !== undefined
        ? input.utcOffsetMinutes
        : resolveUtcOffsetMinutes(input.timezone, year, month, day, stdHour, stdMinute);
    const utcSec = (dateOrd - EPOCH_ORD) * 86400 + stdHour * 3600 + stdMinute * 60 - offsetMin * 60;
    // ── 시주용 로컬 진태양시 시각 ──
    let localHour = stdHour + stdMinute / 60;
    if (hasTime && applySolar) {
        const longitude = input.longitude ?? cfg.defaultLongitude;
        const corr = solarCorrectionMinutes(year, month, day, longitude, cfg.standardMeridian, cfg.applyEot);
        localHour += corr / 60;
        // 시주 지지 계산용 [0,24) 정규화(일주 date는 안 굴린다).
        localHour = ((localHour % 24) + 24) % 24;
    }
    const indices = baziVectorized(dateOrd, hasTime ? localHour : 0, utcSec);
    return {
        year: { stem: STEMS[indices.year.stemIdx], branch: BRANCHES[indices.year.branchIdx] },
        month: { stem: STEMS[indices.month.stemIdx], branch: BRANCHES[indices.month.branchIdx] },
        day: { stem: STEMS[indices.day.stemIdx], branch: BRANCHES[indices.day.branchIdx] },
        hour: hasTime
            ? { stem: STEMS[indices.hour.stemIdx], branch: BRANCHES[indices.hour.branchIdx] }
            : null,
    };
}
//# sourceMappingURL=bazi.js.map