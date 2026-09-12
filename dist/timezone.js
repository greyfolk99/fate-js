/**
 * IANA 타임존 리졸버 — 로컬 벽시계 시각의 UTC 오프셋(분, 동쪽 +)을 구한다.
 *
 * 플랫폼 내장 Intl의 tzdata를 쓴다(런타임 의존성 0). tzdb 기준으로
 * DST·역사 표준시 변경(서울 1954~61 +8:30, 1987~88 서머타임 등)·표준시 도입 전
 * LMT까지 해석된다. Node·브라우저는 기본 지원, 구형 React Native(Hermes)는
 * Intl 폴리필이 필요할 수 있다.
 *
 * 전이 부근의 존재하지 않는(공백)/겹치는(중복) 로컬 시각은 전이 **후** 오프셋
 * 기준으로 결정적으로 해석한다.
 */
const dtfCache = new Map();
function formatterFor(timeZone) {
    let f = dtfCache.get(timeZone);
    if (!f) {
        try {
            f = new Intl.DateTimeFormat("en-US", {
                timeZone,
                hourCycle: "h23",
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
            });
        }
        catch {
            throw new RangeError(`유효한 IANA 타임존이 아닙니다: "${timeZone}" (예: "Asia/Seoul")`);
        }
        dtfCache.set(timeZone, f);
    }
    return f;
}
/** 특정 절대순간(UTC ms)에 그 존이 갖는 오프셋(분). 존의 벽시계와 UTC의 차로 계산. */
function zoneOffsetMinutesAt(timeZone, utcMs) {
    const parts = formatterFor(timeZone).formatToParts(new Date(utcMs));
    const p = {};
    for (const x of parts)
        p[x.type] = x.value;
    const wall = new Date(0);
    wall.setUTCFullYear(Number(p.year), Number(p.month) - 1, Number(p.day));
    wall.setUTCHours(Number(p.hour), Number(p.minute), Number(p.second), 0);
    return Math.round((wall.getTime() - utcMs) / 60000);
}
/**
 * IANA 타임존 + 로컬 벽시계 시각 → UTC 오프셋(분, 동쪽 +).
 * 오프셋이 벽시계에 의존하고 벽시계의 절대순간이 오프셋에 의존하는 순환은
 * 고정점 반복 2회로 푼다(전이 없는 보통 시각은 1회에 수렴).
 */
export function resolveUtcOffsetMinutes(timeZone, year, month, day, hour = 0, minute = 0) {
    const guess = new Date(0);
    guess.setUTCFullYear(year, month - 1, day);
    guess.setUTCHours(hour, minute, 0, 0);
    const localAsUtcMs = guess.getTime();
    const first = zoneOffsetMinutesAt(timeZone, localAsUtcMs);
    return zoneOffsetMinutesAt(timeZone, localAsUtcMs - first * 60000);
}
//# sourceMappingURL=timezone.js.map