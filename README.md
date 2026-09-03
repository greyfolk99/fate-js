# fate-js

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

### 단건 — `baziTable()`

```ts
import { baziTable } from "fate-js"

const c = baziTable({ year: 1992, month: 8, day: 4, hour: 3 })
// { year: {stem:'壬',branch:'申'}, month: {stem:'丁',branch:'未'},
//   day: {stem:'壬',branch:'子'}, hour: {stem:'壬',branch:'寅'} }

// 시간 미상이면 hour 생략 → 시주 null (삼주)
baziTable({ year: 1992, month: 8, day: 4 })
```

### 대량 — `catalog()`

연도 범위 × 시간대 조합의 팔자를 `TypedArray`로 반환한다 (궁합·통계 등 대량 연산용).

```ts
import { catalog } from "fate-js"

const cat = catalog(1990, 2000)          // 1990~2000년, 12시주 전체
cat.stems      // Int8Array [N*4]  (year/month/day/hour 순, row-major)
cat.branches   // Int8Array [N*4]
cat.years      // Int16Array [N]
```

## API

| export | 설명 |
|---|---|
| `baziTable(input: BirthInput): BaziTable` | 생년월일시 → 사주 4주 |
| `catalog(yearStart, yearEnd, hours?): CatalogResult` | 연도 범위 → 팔자 행렬(TypedArray) |
| `STEMS`, `BRANCHES` | 천간·지지 상수 배열 |
| 타입 | `BirthInput`, `BaziTable`, `Pillar`, `CatalogResult`, `Stem`, `Branch` |

## 라이선스

MIT
