/**
 * 대운(大運)·세운(歲運) 계산.
 *
 * 대운 규칙(고전 표준 — 자평 계열 공통):
 *  - 방향: 양간(陽干) 연주 + 남자, 또는 음간(陰干) 연주 + 여자 → 순행(順行).
 *    그 반대 조합 → 역행(逆行). (양남음녀 순행 — 유파 이견 없음)
 *  - 대운수: 출생 순간부터 다음 절(節, 순행) 또는 직전 절(역행)까지의
 *    실제 경과일 ÷ 3 = 시작 나이(년). 3일=1년, 1일=4개월 환산.
 *    반올림 정책은 유파마다 갈리므로 여기서는 소수(float)로 그대로 반환하고,
 *    표기 단계에서 정책을 정하게 한다.
 *  - 대운 간지: 월주(月柱)에서 60갑자를 순행 +1 / 역행 −1씩 진행.
 *
 * 시간 프레임: 절(節) 경계 비교는 출생 절대순간(true-UTC) vs 절기 UTC —
 * bazi()의 월주 판정과 동일한 축을 쓴다(진태양시 보정은 여기 관여하지 않음).
 *
 * 출생 시각(hour)을 모르면 00:00으로 계산되어 대운수에 최대 ±8시간(약 ±0.1년,
 * 약 1.3개월) 오차가 생길 수 있다 — 호출부에서 안내할 것.
 */
import jieqiData from "./jieqi.json" with { type: "json" };
import { EPOCH_ORD } from "./engine.js";
import { toOrdinal } from "./date-util.js";
import { STEMS, BRANCHES, STEM_INDEX, BRANCH_INDEX } from "./constants.js";
import { bazi } from "./bazi.js";
import { assertValidBirthInput } from "./validate.js";
import { resolveUtcOffsetMinutes } from "./timezone.js";
const jieSec = jieqiData.sec;
/** 출생 절대순간(Unix epoch 초, UTC) — bazi()의 절기 판정과 동일한 계산. */
function birthUtcSec(input) {
    const { year, month, day } = input;
    const stdHour = input.hour ?? 0;
    const stdMinute = input.minute ?? 0;
    const offsetMin = input.utcOffsetMinutes !== undefined
        ? input.utcOffsetMinutes
        : resolveUtcOffsetMinutes(input.timezone, year, month, day, stdHour, stdMinute);
    return (toOrdinal(year, month, day) - EPOCH_ORD) * 86400
        + stdHour * 3600 + stdMinute * 60 - offsetMin * 60;
}
/** arr에서 val을 초과하는 첫 인덱스(엔진과 동일한 이진탐색). */
function searchSortedRight(arr, val) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        const arrMid = arr[mid];
        if (arrMid === undefined || arrMid <= val)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo;
}
/**
 * 대운(大運)을 계산한다.
 *
 * @param input - bazi()와 동일한 출생 입력 + gender
 * @param count - 뽑을 대운 개수(기본 10 — 약 100년)
 */
export function daeun(input, count = 10) {
    assertValidBirthInput(input);
    if (input.gender !== "male" && input.gender !== "female") {
        throw new TypeError(`gender는 'male' | 'female'이어야 합니다: ${String(input.gender)}`);
    }
    const chart = bazi(input);
    const yearStemIdx = STEM_INDEX[chart.year.stem];
    const monthStemIdx = STEM_INDEX[chart.month.stem];
    const monthBranchIdx = BRANCH_INDEX[chart.month.branch];
    // 양간(甲丙戊庚壬 = 짝수 인덱스) 남자 / 음간 여자 → 순행
    const yangYear = yearStemIdx % 2 === 0;
    const forward = yangYear === (input.gender === "male");
    // 출생 절대순간 vs 절(節) 경계 — 엔진과 같은 true-UTC 축
    const utcSec = birthUtcSec(input);
    if (!Number.isFinite(utcSec) || utcSec < jieSec[0] || utcSec >= jieSec[jieSec.length - 1]) {
        throw new RangeError(`절기 데이터 범위 밖이거나 유효하지 않은 시각입니다(utcSec=${utcSec}).`);
    }
    const pos = searchSortedRight(jieSec, utcSec) - 1;
    const boundarySec = forward ? jieSec[pos + 1] : jieSec[pos];
    const boundaryDays = Math.abs(boundarySec - utcSec) / 86400;
    const startAge = boundaryDays / 3;
    // 월주 60갑자에서 ±1씩 진행
    const step = forward ? 1 : -1;
    const pillars = [];
    for (let i = 1; i <= count; i++) {
        const stemIdx = (((monthStemIdx + step * i) % 10) + 10) % 10;
        const branchIdx = (((monthBranchIdx + step * i) % 12) + 12) % 12;
        const age = startAge + 10 * (i - 1);
        pillars.push({
            order: i,
            startAge: age,
            startYear: input.year + Math.floor(age),
            stem: STEMS[stemIdx],
            branch: BRANCHES[branchIdx],
        });
    }
    return { forward, startAge, boundaryDays, pillars };
}
/**
 * 세운(歲運) — 연도별 간지. 1984 = 甲子 기준.
 * 각 항목의 유효 구간은 "그 해 입춘 ~ 이듬해 입춘"이다(연초 입춘 전은 전년 세운).
 */
export function seun(startYear, count = 5) {
    const out = [];
    for (let y = startYear; y < startYear + count; y++) {
        out.push({
            year: y,
            stem: STEMS[(((y - 4) % 10) + 10) % 10],
            branch: BRANCHES[(((y - 4) % 12) + 12) % 12],
        });
    }
    return out;
}
//# sourceMappingURL=daeun.js.map