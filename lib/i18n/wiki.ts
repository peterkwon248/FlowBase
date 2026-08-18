// Wiki 시드 페이지의 언어별 표시 해석.
//
// 규칙: **사용자가 편집한 페이지는 절대 건드리지 않는다.**
// 현재 body가 시드 원문과 정확히 같을 때만 한국어본으로 바꿔 보여준다.
// 한 글자라도 편집됐다면 그건 사용자 데이터이므로 그대로 둔다.

import { SEED_WIKI_PAGES } from "@/lib/flowbase-wiki-seed"
import { wikiKo } from "./wiki-ko"
import type { Language } from "./index"

const SEED_BY_ID = new Map(SEED_WIKI_PAGES.map((p) => [p.id, p]))

export interface WikiDisplay {
  title: string
  category: string
  body: string
}

/** 편집되지 않은 시드 페이지인지 — id가 시드에 있고 body가 원문과 동일. */
export function isPristineSeedPage(id: string, body: string): boolean {
  const seed = SEED_BY_ID.get(id)
  return !!seed && seed.body === body
}

/**
 * 표시용 title/category/body를 언어에 맞춰 돌려준다.
 * en이거나, 시드에 없거나, 편집된 페이지면 입력값을 그대로 돌려준다.
 */
export function wikiDisplay(
  lang: Language,
  page: { id: string; title: string; category: string; body: string },
): WikiDisplay {
  if (lang !== "ko") return page
  const ko = wikiKo[page.id]
  if (!ko) return page
  if (!isPristineSeedPage(page.id, page.body)) return page
  return ko
}
