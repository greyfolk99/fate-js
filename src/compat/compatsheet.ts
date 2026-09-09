import {
  cells,
  pairwiseRules,
  hyungRule,
  samhapRule,
  banghapRule,
  hiddenAmhapRule,
  elementComplementRule,
} from "./rules.js"
import { judgeCompat } from "./judgments.js"
import { yongsinSupply } from "./yongsin-supply.js"
import { STEM_ELEMENTS, GENERATES, CONTROLS } from "../constants.js"
import type { Judgment } from "./judgments-types.js"
import type { CompatEdge, CompatSubject, CompatSheet, Lens, LensGroup } from "./types.js"

export const COMPATSHEET_SCHEMA_VERSION = "compat-sheet-v1"

/** compat fact id → 렌즈 매핑. 관계 12종+오행보완만 렌즈를 만든다. */
const FACT_LENS: Record<string, Lens> = {
  // 合(끌림·정) — 서로 당기고 정드는가
  stem_hap: "合",
  branch_yukhap: "合",
  branch_samhap: "合",
  branch_banghap: "合",
  hidden_amhap: "合",
  // 生(보완·상생) — 서로 살리고 채우는가
  element_complement: "生",
  // 沖(관계온도) — 잔잔↔격정, 좋고나쁨 아님
  stem_clash: "沖",
  branch_clash: "沖",
  branch_hae: "沖",
  branch_pa: "沖",
  branch_wonjin: "沖",
  branch_hyung: "沖",
}

const LENS_ORDER: Lens[] = ["合", "生", "沖"]

/**
 * 두 사주 사이의 명리 관계를 정형 포맷으로 빠짐없이 추출한다.
 *
 * 계산으로 딱 떨어지는 관계(천간합·충, 지지 육합·삼합·방합·충·형·파·해·원진,
 * 지장간 암합, 오행 보완)를 facts 에 담는다. 결정론으로 뽑히는 판단 파생값
 * (십성·납음·신살·겉속궁합 분류)은 judgments 섹션에 별도로 담는다.
 * 유파별 정량화가 필요한 값(신강신약·용신)은 여전히 제외 — 별도 처리.
 *
 * 종합 점수는 만들지 않는다(하류 LLM 의 몫). 관계가 없어도 `present:false`
 * 로 항상 한 줄 남겨 인풋 차원을 고정한다.
 */
export function compatSheet(
  subject: CompatSubject,
  candidate: CompatSubject,
): CompatSheet {
  const s = cells(subject.bazi)
  const c = cells(candidate.bazi)

  const facts = [
    ...pairwiseRules(s, c),
    hyungRule(s, c),
    samhapRule(s, c),
    banghapRule(s, c),
    hiddenAmhapRule(s, c),
    elementComplementRule(s, c),
  ]

  const judgments = {
    ...judgeCompat(subject, candidate, facts),
    yongsinSupply: yongsinSupply(subject, candidate),
  }

  const lenses: LensGroup[] = LENS_ORDER.map((lens) => {
    const group = facts.filter((f) => FACT_LENS[f.id] === lens)
    return {
      lens,
      facts: group,
      activeCount: group.filter((f) => f.present).length,
      edgeTotal: group.reduce((n, f) => n + f.count, 0),
    }
  })

  return {
    schemaVersion: COMPATSHEET_SCHEMA_VERSION,
    subject,
    candidate,
    facts,
    lenses,
    judgments,
  }
}

/** compat 엣지의 오행 enum(영문) → 한자. */
const ELEMENT_HANJA: Record<string, string> = {
  wood: "木", fire: "火", earth: "土", metal: "金", water: "水",
}

const LENS_NAME: Record<Lens, string> = {
  合: "合(끌림·정)",
  生: "生(보완·상생)",
  沖: "沖(관계온도)",
}

/** 납음 겉궁합 관계(category) → 한자. */
const NAYIN_RELATION_HANJA: Record<string, string> = {
  same: "比和", generates: "相生", controls: "相剋",
}

/** 라벨의 괄호 속 한자 코드를 뽑는다(GLM 한자 native). 예: "천간합(天干合)" → "天干合". */
function hanjaOf(label: string): string {
  const m = label.match(/\(([^)]+)\)/)
  return m ? m[1]! : label
}

/** 영문 오행 배열 → 한자 문자열. */
function elsHanja(list: unknown): string {
  if (!Array.isArray(list)) return ""
  return list.map((e) => ELEMENT_HANJA[e as string] ?? String(e)).join("")
}

const PILLAR_HANJA: Record<string, string> = {
  year: "年", month: "月", day: "日", hour: "時",
}

/** 엣지 → "A日子-B日丑" — 어느 사주·어느 기둥의 글자끼리 성립했는지(궁위 사실). */
function edgeHanja(e: CompatEdge): string {
  return `A${PILLAR_HANJA[e.subject.pillar]}${e.subject.glyph}-B${PILLAR_HANJA[e.object.pillar]}${e.object.glyph}`
}

/**
 * 삼합·방합 엣지를 오행 국(局)별로 나눠 렌더한다.
 * 국마다 관여 글자 종수(三字=전국, 二字=반합)를 부기 — 글자 수는 국 성립
 * 형태의 사실이지 강도 점수가 아니다.
 */
function groupSegments(name: string, edges: CompatEdge[]): string[] {
  const byEl = new Map<string, CompatEdge[]>()
  for (const e of edges) {
    const el = ELEMENT_HANJA[e.element as string] ?? String(e.element)
    byEl.set(el, [...(byEl.get(el) ?? []), e])
  }
  return [...byEl.entries()].map(([el, es]) => {
    const glyphs = new Set(es.flatMap((e) => [e.subject.glyph, e.object.glyph]))
    const size = glyphs.size >= 3 ? "三字" : "二字"
    return `${name}(${el}·${size})[${es.map(edgeHanja).join(" ")}]`
  })
}

/**
 * 궁합 시트를 GLM 프롬프트용 한자 텍스트 블록으로 렌더한다.
 * 관계를 3렌즈(合/生/沖)로 묶고, 성립한 것만 노출한다(차원 고정은 구조체가 담당).
 * 신살·납음·궁위는 【보조】로 붙인다(rationale 재료).
 *
 * includeHarm: 忌神 유입·剋用神 줄 노출 여부(기본 꺼짐). 발화율 실측(800쌍)에서
 * 기신 투출 99%·剋 99%로 "서로 기신을 대줌" 앵커가 상수화되어 v2.1 보완 일관성이
 * 91→65%로 붕괴했다. 상대량 규칙을 가진 전용 프롬프트에서만 켤 것.
 */
export function formatCompatSheet(sheet: CompatSheet, opts?: { includeHarm?: boolean }): string {
  const lines: string[] = []
  for (const g of sheet.lenses) {
    const active = g.facts.filter((f) => f.present)
    const parts = active.flatMap((f) => {
      const name = hanjaOf(f.label) // 天干合, 六合, 五行相補 …
      // 오행보완(生)은 엣지가 아니라 수수(受) 오행 detail 로 렌더.
      if (f.id === "element_complement") {
        let extra = ""
        if (f.detail) {
          const a = elsHanja(f.detail.subjectReceives)
          const b = elsHanja(f.detail.candidateReceives)
          const segs = [a && `A受${a}`, b && `B受${b}`].filter(Boolean)
          if (segs.length) extra = `(${segs.join(" ")})`
        }
        return [`${name}${extra}`]
      }
      // 삼합·방합은 오행 국별로 나누고 관여 글자 종수(三字/二字)를 부기.
      if (f.id === "branch_samhap" || f.id === "branch_banghap") {
        return groupSegments(name, f.edges)
      }
      // 형은 성립한 형 종류(한자 코드)를 부기. 삼형계(寅巳申·丑戌未)는 세 글자가
      // 다 모였는지(三字=전국)까지 — 삼합의 三字/二字 부기와 같은 패턴.
      const SAMHYUNG_GROUPS: Record<string, string[]> = {
        無恩之刑: ["寅", "巳", "申"],
        持勢之刑: ["丑", "戌", "未"],
      }
      const kinds =
        f.id === "branch_hyung" && Array.isArray(f.detail?.hyung)
          ? `(${(f.detail.hyung as string[]).map((k) => {
              const group = SAMHYUNG_GROUPS[k]
              if (!group) return k
              const glyphs = new Set(
                f.edges.flatMap((e) => [e.subject.glyph, e.object.glyph]).filter((g) => group.includes(g)),
              )
              return `${k}(${glyphs.size >= 3 ? "三字" : "二字"})`
            }).join("·")})`
          : ""
      // 합·충 관계는 성립 엣지의 궁위를 그대로 찍는다 — 어느 기둥 글자끼리인지가
      // 판정 재료라서(쌍 개수는 여전히 강도가 아니라 위치 사실의 나열).
      return [`${name}${kinds}[${f.edges.map(edgeHanja).join(" ")}]`]
    })
    // 生 렌즈는 오행보완만으론 빈약 → 배우자성(財/官)·용신 공급 신호를 덧댄다.
    // 공급은 유/무가 아니라 등급 사실로: 커버 오행 + 투출(透)/암장(藏) 구분.
    // (유/무 boolean 은 무작위 쌍의 99%가 참이라 변별 신호가 0 — 실측.)
    if (g.lens === "生") {
      const tg = sheet.judgments.tenGod
      // 배우자성은 "있음"이 무작위 쌍 96%라 유무 표기는 변별 0 — 자평진전이 실제로
      // 보는 등급(투/장, 배우자궁 안착, 正·偏 개수)을 찍는다.
      const star = (jd: Judgment, tag: string) => {
        if (!jd.present) { parts.push(`${tag}(無)`); return }
        const d = jd.detail as {
          revealedPillars: string[]; daySeat: string | false; jeong: number; pyeon: number
        }
        const segs = [
          d.revealedPillars.length ? `${d.revealedPillars.map((p) => PILLAR_HANJA[p]).join("")}透` : "藏",
          d.daySeat ? (d.daySeat === "본기" ? "坐日支" : "日支藏") : "",
          `正${d.jeong}偏${d.pyeon}`,
        ].filter(Boolean)
        parts.push(`${tag}(${segs.join("·")})`)
      }
      star(tg.spouseStarForSubject, "配星A←B")
      star(tg.spouseStarForCandidate, "配星B←A")
      const ys = sheet.judgments.yongsinSupply
      const eokbu = (jd: Judgment, tag: string) => {
        if (!jd.present) { parts.push(`${tag}(無)`); return }
        const d = jd.detail as { favorable: string[]; covered: string[]; revealed: string[] }
        parts.push(`${tag}(${d.covered.join("")}/${d.favorable.join("")}供${d.revealed.length ? `·${d.revealed.join("")}透` : "·無透"})`)
      }
      eokbu(ys.eokbuToSubject, "用神A←B")
      eokbu(ys.eokbuToCandidate, "用神B←A")
      const johu = (jd: Judgment, tag: string) => {
        // 主用神 투/장에 더해 次佐(보조 용신)도 찍는다 — 主 없이 佐만 있는 경우를
        // (無)로 뭉개면 계산된 사실이 유실된다. 단 主 부재의 "無" 토큰은 유지 —
        // v2.1 앵커('調候为無')가 이 토큰을 읽으므로 佐만 있어도 無·佐X 로 덧붙인다.
        const d = jd.detail as { mainRevealed: string[]; mainHidden: string[]; subHit?: string[] }
        const seg = [
          d.mainRevealed.length ? `${d.mainRevealed.join("")}透` : "",
          d.mainHidden.length ? `${d.mainHidden.join("")}藏` : "",
        ].filter(Boolean).join("·") || "無"
        const jwa = d.subHit?.length ? `·佐${d.subHit.join("")}` : ""
        parts.push(`${tag}(${seg}${jwa})`)
      }
      johu(ys.johuToSubject, "調候A←B")
      johu(ys.johuToCandidate, "調候B←A")
      // 공급의 거울(해로움 사실): 기신 유입(투/장)과 희신 극(천간 단위).
      // 기본 꺼짐(위 includeHarm 주석) — 전용 프롬프트에서만 노출.
      if (opts?.includeHarm) {
        const harm = (jd: Judgment, tag: string, keukTag: string) => {
          const d = jd.detail as { unfavorable: string[]; covered: string[]; revealed: string[]; keuk: string[] }
          parts.push(
            d.covered.length
              ? `${tag}(${d.covered.join("")}/${d.unfavorable.join("")}入${d.revealed.length ? `·${d.revealed.join("")}透` : "·無透"})`
              : `${tag}(無)`,
          )
          parts.push(d.keuk.length ? `${keukTag}(${d.keuk.join("·")})` : `${keukTag}(無)`)
        }
        harm(ys.harmToSubject, "忌神A←B", "剋用神A←B")
        harm(ys.harmToCandidate, "忌神B←A", "剋用神B←A")
      }
    }
    lines.push(`【${LENS_NAME[g.lens]}】 ${parts.length ? parts.join(" · ") : "(없음)"}`)
  }

  const j = sheet.judgments
  const aux: string[] = []
  if (j.nayin.outerReading.present) {
    const cat = String(j.nayin.outerReading.category)
    aux.push(`納音겉궁합:${NAYIN_RELATION_HANJA[cat] ?? cat}`)
  }
  if (j.palace.present) {
    const d = j.palace.detail ?? {}
    aux.push(
      `궁위 겉(和${d.outerHarmony ?? 0}沖${d.outerClash ?? 0})` +
      `속(和${d.innerHarmony ?? 0}沖${d.innerClash ?? 0})`,
    )
  }
  const s2 = j.sinsal.candidateForSubject.filter((s) => s.present).map((s) => hanjaOf(s.label))
  const s1 = j.sinsal.subjectForCandidate.filter((s) => s.present).map((s) => hanjaOf(s.label))
  if (s2.length) aux.push(`神殺(B→A):${s2.join("·")}`)
  if (s1.length) aux.push(`神殺(A→B):${s1.join("·")}`)
  if (aux.length) lines.push(`【보조】 ${aux.join(" · ")}`)

  // 교차 판단 — 배우자궁 십이운성·공망·일주대조·십이신살(사실만).
  const cr = j.cross
  const cx: string[] = []
  // 일간끼리의 오행 생극비(相生·相剋·比和) — 결정론 사실(납음 겉궁합과 같은 층위).
  const dsA = sheet.subject.bazi.day.stem
  const dsB = sheet.candidate.bazi.day.stem
  const eA = STEM_ELEMENTS[dsA]
  const eB = STEM_ELEMENTS[dsB]
  const dayStemRel =
    eA === eB ? `比和(${dsA}·${dsB})`
    : GENERATES[eA] === eB ? `A${dsA}生B${dsB}`
    : GENERATES[eB] === eA ? `B${dsB}生A${dsA}`
    : CONTROLS[eA] === eB ? `A${dsA}剋B${dsB}`
    : `B${dsB}剋A${dsA}`
  cx.push(`日干:${dayStemRel}`)
  cx.push(`배우자궁운성 B→A:${cr.spouseGungStageForSubject.detail?.stage ?? ""}`)
  cx.push(`A→B:${cr.spouseGungStageForCandidate.detail?.stage ?? ""}`)
  if (cr.voidForSubject.present) cx.push("空亡:B일지↦A공망")
  if (cr.voidForCandidate.present) cx.push("空亡:A일지↦B공망")
  if (cr.dayPillarMatch.present) cx.push(`일주:${cr.dayPillarMatch.category}`)
  cx.push(`神殺 A년지기준B일지:${cr.sinsalCrossForSubject.category}`)
  cx.push(`B년지기준A일지:${cr.sinsalCrossForCandidate.category}`)
  lines.push(`【교차】 ${cx.join(" · ")}`)

  // 합충 병존 — 같은 글자가 합·충 양쪽에 걸린 사실(해소 판정은 안 함).
  const ov = j.hapChungOverlap
  if (ov.present) {
    const cells = (ov.detail?.cells as string[]) ?? []
    lines.push(`【병존】 ${cells.join(" · ")}`)
  }

  // 쟁합·투합 — 한 글자가 같은 종류 합을 여럿 맺어 힘이 갈라지는 사실.
  const jh = j.jaenghap
  if (jh.present) {
    const cells = (jh.detail?.cells as string[]) ?? []
    lines.push(`【쟁합】 ${cells.join(" · ")}`)
  }

  return lines.join("\n")
}
