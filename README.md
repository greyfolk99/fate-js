# fate-js

[English](./README.md) · [한국어](./README.ko.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md)

A TypeScript library that computes the Four Pillars of Destiny (BaZi, 四柱八字) — the year, month, day, and hour stem-branch pairs — from a birth date and time. Published as `fate-js`.

- Month pillar boundaries follow the 24 solar terms (立春 Start of Spring, etc.)
- IANA timezone support — pass `timezone: "Asia/Seoul"` and the UTC offset is resolved automatically, including DST and historical changes (Seoul used +8:30 in 1954–61, DST in 1987–88)
- Computes three pillars (year · month · day) when the birth hour is unknown
- Bulk computation of full year ranges × all hour branches into `TypedArray`s (`catalog`)
- Pure TypeScript with zero runtime dependencies — runs in browsers, Node, and React Native

## Install

```bash
# install directly from GitHub
npm install github:greyfolk99/fate-js
# or with pnpm
pnpm add github:greyfolk99/fate-js
```

## Usage

### Single chart — `bazi()`

At least one of `timezone` (IANA name, recommended) or `utcOffsetMinutes` (east positive, KST = 540) is required — solar terms are anchored in absolute time (UTC), so the library never assumes an implicit timezone. With `timezone`, the offset is resolved from the platform's tz database, including DST and historical standard-time changes. If both are given, `utcOffsetMinutes` wins (manual override).

```ts
import { bazi } from "fate-js"

const c = bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, timezone: "Asia/Seoul", timeBasis: "standard" })
// { year: {stem:'庚',branch:'午'}, month: {stem:'辛',branch:'巳'},
//   day: {stem:'庚',branch:'辰'}, hour: {stem:'辛',branch:'巳'} }

// manual offset control (non-standard zones, minute-level precision):
bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, utcOffsetMinutes: 540, timeBasis: "standard" })

// unknown birth hour: omit hour → hour pillar is null (three pillars)
bazi({ year: 1990, month: 5, day: 15, timezone: "Asia/Seoul" })
```

True solar time correction (longitude + equation of time) is on by default and applies to the hour pillar only. Pass `timeBasis: "standard"` as above to use standard clock time.

### Sheets — `baziSheet()` · `matchSheet()`

Fact-based sheets: `baziSheet(subject)` extracts one person's natal chart plus analysis (strength, favorable elements, five-element / ten-god distribution, chart structure, void branches, symbolic stars); `matchSheet(a, b)` extracts two people's compatibility (12 relation kinds viewed through the three lenses 合 / 生 / 沖) — structured facts, no scores.

```ts
import { bazi, baziSheet, matchSheet, formatBaziSheet, formatMatchSheet } from "fate-js"

const a = { bazi: bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, timezone: "Asia/Seoul" }), gender: "male" as const }
const b = { bazi: bazi({ year: 1992, month: 11, day: 2, hour: 14, minute: 20, timezone: "Asia/Seoul" }), gender: "female" as const }

formatBaziSheet(baziSheet(a), "A")   // one-line hanzi summary
formatMatchSheet(matchSheet(a, b)) // 3-lens hanzi text block
```

### Bulk — `catalog()`

Returns the pillars for a year range × hour-branch combinations as `TypedArray`s (for compatibility scans, statistics, and other bulk workloads).

```ts
import { catalog } from "fate-js"

const cat = catalog(1990, 2000, 540) // 1990–2000, KST, all 12 hour branches
cat.stems      // Int8Array [N*4]  (year/month/day/hour, row-major)
cat.branches   // Int8Array [N*4]
cat.years      // Int16Array [N]
```

## API

| export | description |
|---|---|
| `bazi(input: BirthInput): Bazi` | birth date/time → four pillars (`timezone` or `utcOffsetMinutes` required) |
| `resolveUtcOffsetMinutes(tz, y, m, d, h?, min?)` | IANA timezone + local wall time → UTC offset in minutes |
| `baziSheet(subject): BaziSheet` | one person's natal chart + analysis sheet (facts, no scores) |
| `matchSheet(a, b): MatchSheet` | two-person compatibility sheet (12 relations → 3 lenses 合/生/沖) |
| `analyze(subject): BaziAnalysis` | natal analysis (strength · structure · favorable elements · stars) |
| `catalog(yearStart, yearEnd, utcOffsetMinutes, hours?): CatalogResult` | year range → pillar matrices (`TypedArray`) |
| `formatBaziSheet` · `formatMatchSheet` | sheet → hanzi text for LLM prompts / UI |
| `STEMS`, `BRANCHES` | stem / branch constant arrays |
| types | `BirthInput`, `Bazi`, `BaziSheet`, `MatchSheet`, `Pillar`, `CatalogResult`, `Stem`, `Branch` |

## License

MIT
