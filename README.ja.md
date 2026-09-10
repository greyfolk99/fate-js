# fate-js

[English](./README.md) · [한국어](./README.ko.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md)

生年月日時から四柱推命の命式(年・月・日・時の干支四柱)を計算する TypeScript ライブラリ。npm パッケージ名は `fate-js`。

- 二十四節気(立春など)を基準に月柱の境界を計算
- IANA タイムゾーン対応 — `timezone: "Asia/Seoul"` を渡すと UTC オフセットを自動解決(DST・歴史的標準時変更を含む:ソウルは 1954~61 年 +8:30、1987~88 年に夏時間)
- 出生時刻が不明な場合は三柱(年・月・日)のみ計算
- 年範囲 × 全時柱の組み合わせを `TypedArray` で一括計算(`catalog`)— 大量計算向け
- 純粋な TypeScript、ランタイム依存ゼロ — ブラウザ・Node・React Native で動作

## インストール

```bash
# GitHub から直接インストール
npm install github:greyfolk99/fate-js
# または pnpm
pnpm add github:greyfolk99/fate-js
```

## 使い方

### 単体 — `bazi()`

`timezone`(IANA 名、推奨)または `utcOffsetMinutes`(東経が正、KST=540、JST=540)の少なくとも一方が必須 — 節気を絶対時刻(UTC)で照合するため、暗黙のタイムゾーンを仮定しない。`timezone` を渡すとプラットフォームの tz データでオフセットを自動解決する(DST・歴史的標準時を含む)。両方渡した場合は `utcOffsetMinutes` が優先(手動オーバーライド)。

```ts
import { bazi } from "fate-js"

const c = bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, timezone: "Asia/Seoul", timeBasis: "standard" })
// { year: {stem:'庚',branch:'午'}, month: {stem:'辛',branch:'巳'},
//   day: {stem:'庚',branch:'辰'}, hour: {stem:'辛',branch:'巳'} }

// オフセットの手動制御(非標準ゾーン・分単位の精密制御):
bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, utcOffsetMinutes: 540, timeBasis: "standard" })

// 時刻不明なら hour を省略 → 時柱は null(三柱)
bazi({ year: 1990, month: 5, day: 15, timezone: "Asia/Seoul" })
```

デフォルトでは真太陽時補正(経度+均時差)が有効(時柱のみに適用)。上記のように `timeBasis: "standard"` を渡すと標準時で計算する。

### シート — `baziSheet()` · `matchSheet()`

事実ベースの構造化シート:`baziSheet(subject)` は一人の**命式+分析**(身強身弱・用神・五行/通変星の分布・格局・空亡・神殺)を、`matchSheet(a, b)` は二人の**相性**(12 種の関係を 合/生/沖 の三つのレンズで)を、点数を付けずに抽出する。

```ts
import { bazi, baziSheet, matchSheet, formatBaziSheet, formatMatchSheet } from "fate-js"

const a = { bazi: bazi({ year: 1990, month: 5, day: 15, hour: 10, minute: 30, timezone: "Asia/Seoul" }), gender: "male" as const }
const b = { bazi: bazi({ year: 1992, month: 11, day: 2, hour: 14, minute: 20, timezone: "Asia/Seoul" }), gender: "female" as const }

formatBaziSheet(baziSheet(a), "A")   // 漢字一行サマリー
formatMatchSheet(matchSheet(a, b)) // 3 レンズ漢字テキストブロック
```

### 一括 — `catalog()`

年範囲 × 時柱の組み合わせの命式を `TypedArray` で返す(相性スキャン・統計などの大量計算向け)。

```ts
import { catalog } from "fate-js"

const cat = catalog(1990, 2000, 540) // 1990~2000年、KST、全12時柱
cat.stems      // Int8Array [N*4]  (year/month/day/hour 順、row-major)
cat.branches   // Int8Array [N*4]
cat.years      // Int16Array [N]
```

## API

| export | 説明 |
|---|---|
| `bazi(input: BirthInput): Bazi` | 生年月日時 → 四柱(`timezone` または `utcOffsetMinutes` 必須) |
| `resolveUtcOffsetMinutes(tz, y, m, d, h?, min?)` | IANA タイムゾーン + ローカル時刻 → UTC オフセット(分) |
| `baziSheet(subject): BaziSheet` | 一人の命式+分析シート(事実ベース、点数なし) |
| `matchSheet(a, b): MatchSheet` | 二人の相性シート(12 種の関係 → 3 レンズ 合/生/沖) |
| `analyze(subject): BaziAnalysis` | 命式分析(強弱・格局・用神・神殺) |
| `catalog(yearStart, yearEnd, utcOffsetMinutes, hours?): CatalogResult` | 年範囲 → 命式行列(`TypedArray`) |
| `formatBaziSheet` · `formatMatchSheet` | シート → LLM プロンプト/UI 用漢字テキスト |
| `STEMS`, `BRANCHES` | 天干・地支の定数配列 |
| 型 | `BirthInput`, `Bazi`, `BaziSheet`, `MatchSheet`, `Pillar`, `CatalogResult`, `Stem`, `Branch` |

## ライセンス

MIT
