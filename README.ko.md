# fate-js

[English](./README.md) · [한국어](./README.ko.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md)

생년월일시로 사주팔자(四柱) — 천간·지지 4주(년·월·일·시) — 를 계산하는 TypeScript 라이브러리. npm 패키지명은 `fate-js`.

- 24절기(입춘 등)를 기준으로 월주 경계를 계산
- 시(時)를 모르면 삼주(년·월·일)만 계산
- 연도 범위 × 시주 전체를 `TypedArray`로 한 번에 계산 (`catalog`) — 대량 연산용
- 순수 TypeScript, 런타임 의존성 없음 — 브라우저·Node·React Native 어디서나 동작

## 설치

```bash
# GitHub 직접 설치
npm install github:greyfolk99/fate-js
# 또는 pnpm
pnpm add github:greyfolk99/fate-js
```

## 사용

### 단건 — `bazi()`

`utcOffsetMinutes`(동경 +, KST=540)는 필수다 — 절기(월·연주)를 절대시각(UTC)으로 맞추기 위해 암묵 타임존을 두지 않는다.

```ts
import { bazi } from "fate-js"

const c = bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, utcOffsetMinutes: 540, timeBasis: "standard" })
// { year: {stem:'庚',branch:'午'}, month: {stem:'辛',branch:'巳'},
//   day: {stem:'庚',branch:'辰'}, hour: {stem:'辛',branch:'巳'} }

// 시간 미상이면 hour 생략 → 시주 null (삼주)
bazi({ year: 1990, month: 5, day: 15, utcOffsetMinutes: 540 })
```

기본은 진태양시(경도+균시차) 보정이 켜져 있다(시주에만 적용). 위처럼 `timeBasis: "standard"`면 표준시로 계산한다.

### 시트 — `baziSheet()` · `compatSheet()`

사실 기반 시트: `baziSheet(subject)`는 한 사람의 **원국+분석**(강약·용신·오행/십성 분포·격국·공망·신살), `compatSheet(a, b)`는 두 사람의 **궁합**(관계 12종을 合/生/沖 3렌즈로) 을 점수 없이 정형 추출한다.

```ts
import { bazi, baziSheet, compatSheet, formatBaziSheet, formatCompatSheet } from "fate-js"

const a = { bazi: bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, utcOffsetMinutes: 540, gender: "male" }), gender: "male" }
const b = { bazi: bazi({ year: 1992, month: 11, day: 2, hour: 14, minute: 20, utcOffsetMinutes: 540, gender: "female" }), gender: "female" }

formatBaziSheet(baziSheet(a), "A")   // 한자 한 줄 요약
formatCompatSheet(compatSheet(a, b)) // 3렌즈 한자 텍스트 블록
```

### 대량 — `catalog()`

연도 범위 × 시간대 조합의 팔자를 `TypedArray`로 반환한다 (궁합·통계 등 대량 연산용).

```ts
import { catalog } from "fate-js"

const cat = catalog(1990, 2000, 540)     // 1990~2000년, KST, 12시주 전체
cat.stems      // Int8Array [N*4]  (year/month/day/hour 순, row-major)
cat.branches   // Int8Array [N*4]
cat.years      // Int16Array [N]
```

## API

| export | 설명 |
|---|---|
| `bazi(input: BirthInput): Bazi` | 생년월일시 → 사주 4주 (`utcOffsetMinutes` 필수) |
| `baziSheet(subject): BaziSheet` | 한 사람 원국+분석 시트 (팩트 기반, 점수 없음) |
| `compatSheet(a, b): CompatSheet` | 두 사람 궁합 시트 (관계 12종 → 3렌즈 合/生/沖) |
| `analyze(subject): BaziAnalysis` | 원국 분석 (강약·격국·용신·신살) |
| `catalog(yearStart, yearEnd, utcOffsetMinutes, hours?): CatalogResult` | 연도 범위 → 팔자 행렬(TypedArray) |
| `formatBaziSheet` · `formatCompatSheet` | 시트 → LLM 프롬프트/UI용 한자 텍스트 |
| `STEMS`, `BRANCHES` | 천간·지지 상수 배열 |
| 타입 | `BirthInput`, `Bazi`, `BaziSheet`, `CompatSheet`, `Pillar`, `CatalogResult`, `Stem`, `Branch` |

## 라이선스

MIT
