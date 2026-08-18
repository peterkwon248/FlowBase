// FlowBase — i18n 코어 (ko/en 토글 · 기본 ko)
//
// 설계 결정 (MEMORY Key Design #27):
// - **키 = 영어 원문** (gettext 방식). 별도 키 네이밍(`board.header.save`) ❌.
//   → en 사전이 필요 없음(항등). ko 사전만 유지하면 되므로 유지비 절반.
//   → 번역 누락 시 영어 원문으로 graceful degrade — 빈 문자열/키 노출 ❌.
// - **외부 i18n 라이브러리 ❌ LOCK** — next-intl은 App Router locale 라우팅을
//   요구하는데 본 앱은 로컬 first(Key Design #17) 클라이언트 상태라 부적합.
//   dnd 라이브러리 ❌ / framer-motion ❌ 와 같은 의존성 최소 컨벤션 유지.
// - 언어는 `settings.language`에 persist (store v18) — 테마 accent와 같은 자리.
//
// 순환 import 주의: store → i18n ❌ (i18n → store 단방향만).

import { useCallback } from "react"
import { useFlowBase } from "@/lib/flowbase-store"
import { ko } from "./ko"

export type Language = "ko" | "en"

export const LANGUAGES: { id: Language; label: string; native: string }[] = [
  { id: "ko", label: "Korean", native: "한국어" },
  { id: "en", label: "English", native: "English" },
]

export const DEFAULT_LANGUAGE: Language = "ko"

export type TParams = Record<string, string | number>

/** `{name}` 자리표시자 치환. 값 없으면 자리표시자를 그대로 남김(디버깅 용이). */
function interpolate(s: string, params?: TParams): string {
  if (!params) return s
  return s.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in params ? String(params[key]) : whole,
  )
}

/**
 * 순수 함수 번역 — 훅 밖(이벤트 핸들러·lib 모듈)에서도 씀.
 * en은 항등이므로 사전 조회 자체를 건너뜀.
 */
export function translate(
  lang: Language,
  source: string,
  params?: TParams,
): string {
  if (lang === "en") return interpolate(source, params)
  return interpolate(ko[source] ?? source, params)
}

/** 현재 언어 (React 밖에서 읽기 — toast 핸들러, lib 모듈 등). */
export function currentLanguage(): Language {
  return useFlowBase.getState().settings.language ?? DEFAULT_LANGUAGE
}

/**
 * React 밖 번역. 스토어를 즉시 읽으므로 렌더 중 호출 ❌ (useT 사용).
 * 이벤트 핸들러·비동기 콜백에서 toast 문구 만들 때 씀.
 */
export function tt(source: string, params?: TParams): string {
  return translate(currentLanguage(), source, params)
}

/** 컴포넌트용 — 언어 변경 시 리렌더된다. */
export function useT() {
  const lang = useFlowBase((s) => s.settings.language ?? DEFAULT_LANGUAGE)
  return useCallback(
    (source: string, params?: TParams) => translate(lang, source, params),
    [lang],
  )
}

/** 언어 자체가 필요할 때 (날짜 로케일·정렬 등). */
export function useLanguage(): Language {
  return useFlowBase((s) => s.settings.language ?? DEFAULT_LANGUAGE)
}

/** Intl 로케일 태그 — toLocaleDateString 등에 넘김. */
export function localeTag(lang: Language): string {
  return lang === "ko" ? "ko-KR" : "en-US"
}
