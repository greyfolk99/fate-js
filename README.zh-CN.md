# fate-js

[English](./README.md) · [한국어](./README.ko.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md)

根据出生日期时间排出四柱八字(年·月·日·时的天干地支)的 TypeScript 库。npm 包名为 `fate-js`。

- 月柱边界按二十四节气(立春等)计算
- 不知出生时辰时,只排三柱(年·月·日)
- 可将整段年份范围 × 全部时辰一次性计算为 `TypedArray`(`catalog`)— 适合批量运算
- 纯 TypeScript,零运行时依赖 — 浏览器、Node、React Native 均可运行

## 安装

```bash
# 直接从 GitHub 安装
npm install github:greyfolk99/fate-js
# 或使用 pnpm
pnpm add github:greyfolk99/fate-js
```

## 使用

### 单个命盘 — `bazi()`

`utcOffsetMinutes`(东经为正,KST=540)为必填 — 节气按绝对时间(UTC)对齐,库不假设任何隐式时区。

```ts
import { bazi } from "fate-js"

const c = bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, utcOffsetMinutes: 540, timeBasis: "standard" })
// { year: {stem:'庚',branch:'午'}, month: {stem:'辛',branch:'巳'},
//   day: {stem:'庚',branch:'辰'}, hour: {stem:'辛',branch:'巳'} }

// 时辰不明时省略 hour → 时柱为 null(三柱)
bazi({ year: 1990, month: 5, day: 15, utcOffsetMinutes: 540 })
```

默认启用真太阳时校正(经度+均时差),且仅作用于时柱。如上传入 `timeBasis: "standard"` 则按标准时间计算。

### 命盘表 — `baziSheet()` · `matchSheet()`

基于事实的结构化表:`baziSheet(subject)` 提取一个人的**原局+分析**(身强身弱、用神、五行/十神分布、格局、空亡、神煞);`matchSheet(a, b)` 提取两人**合婚**信息(12 种关系,经 合/生/沖 三个视角)— 只输出结构化事实,不打分。

```ts
import { bazi, baziSheet, matchSheet, formatBaziSheet, formatMatchSheet } from "fate-js"

const a = { bazi: bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, utcOffsetMinutes: 540, gender: "male" }), gender: "male" }
const b = { bazi: bazi({ year: 1992, month: 11, day: 2, hour: 14, minute: 20, utcOffsetMinutes: 540, gender: "female" }), gender: "female" }

formatBaziSheet(baziSheet(a), "A")   // 一行汉字摘要
formatMatchSheet(matchSheet(a, b)) // 三视角汉字文本块
```

### 批量 — `catalog()`

将年份范围 × 时辰组合的八字以 `TypedArray` 返回(适合合婚扫描、统计等批量运算)。

```ts
import { catalog } from "fate-js"

const cat = catalog(1990, 2000, 540) // 1990~2000年,KST,全部12时辰
cat.stems      // Int8Array [N*4]  (year/month/day/hour 顺序,row-major)
cat.branches   // Int8Array [N*4]
cat.years      // Int16Array [N]
```

## API

| 导出 | 说明 |
|---|---|
| `bazi(input: BirthInput): Bazi` | 出生日期时间 → 四柱(`utcOffsetMinutes` 必填) |
| `baziSheet(subject): BaziSheet` | 单人原局+分析表(基于事实,不打分) |
| `matchSheet(a, b): MatchSheet` | 两人合婚表(12 种关系 → 三视角 合/生/沖) |
| `analyze(subject): BaziAnalysis` | 原局分析(强弱·格局·用神·神煞) |
| `catalog(yearStart, yearEnd, utcOffsetMinutes, hours?): CatalogResult` | 年份范围 → 八字矩阵(`TypedArray`) |
| `formatBaziSheet` · `formatMatchSheet` | 表 → 供 LLM 提示词/UI 使用的汉字文本 |
| `STEMS`, `BRANCHES` | 天干·地支常量数组 |
| 类型 | `BirthInput`, `Bazi`, `BaziSheet`, `MatchSheet`, `Pillar`, `CatalogResult`, `Stem`, `Branch` |

## 许可证

MIT
