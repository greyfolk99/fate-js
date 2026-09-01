# @fate/bazi

사주팔자(Bazi) 계산 엔진 — **절기 기반 동적 계산**을 TypeScript로 구현한 라이브러리.
사전 계산 데이터(ground truth) 없이 임의 연·월·일·시의 팔자 4주를 산출한다.

- 절기(節氣) 기반 월주 경계 계산 — 입춘 등 24절기로 월을 나눔
- 벡터화 카탈로그 — 연도 범위 × 시간대 전체 팔자를 `TypedArray`로 대량 산출
- 순수 TypeScript, 런타임 의존성 0 — 브라우저·Node·React Native 어디서나 동작
- Python 레퍼런스 구현([fate-py](https://github.com/greyfolk99/fate-py)) 대비 500개 cross-validation 통과

## 설치

```bash
# GitHub 직접 설치
npm install github:greyfolk99/fate-js
# 또는 pnpm
pnpm add github:greyfolk99/fate-js
```

## 사용

### 단건 — `chart()`

```ts
import { chart } from "@fate/bazi"

const c = chart({ year: 1992, month: 8, day: 4, hour: 3 })
// { year: {stem:'壬',branch:'申'}, month: {stem:'丁',branch:'未'},
//   day: {stem:'壬',branch:'子'}, hour: {stem:'壬',branch:'寅'} }

// 시간 미상이면 hour 생략 → 시주 null (삼주)
chart({ year: 1992, month: 8, day: 4 })
```

### 대량 — `catalog()`

연도 범위 × 시간대 조합의 팔자를 `TypedArray`로 반환한다 (궁합·통계 등 대량 연산용).

```ts
import { catalog } from "@fate/bazi"

const cat = catalog(1990, 2000)          // 1990~2000년, 12시주 전체
cat.stems      // Int8Array [N*4]  (year/month/day/hour 순, row-major)
cat.branches   // Int8Array [N*4]
cat.years      // Int16Array [N]
```

## API

| export | 설명 |
|---|---|
| `chart(input: ChartInput): BaziChart` | 생년월일시 → 사주 4주 |
| `catalog(yearStart, yearEnd, hours?): CatalogResult` | 연도 범위 → 팔자 행렬(TypedArray) |
| `STEMS`, `BRANCHES` | 천간·지지 상수 배열 |
| 타입 | `ChartInput`, `BaziChart`, `Pillar`, `CatalogResult`, `Stem`, `Branch` |

## 라이선스

MIT
