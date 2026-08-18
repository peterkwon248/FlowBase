// 문서 언어 동기화 — <html lang>과 탭 제목을 선택 언어에 맞춘다.
//
// 왜 필요한가: app/layout.tsx의 `metadata`는 서버에서 정적으로 계산되는데
// 언어는 클라이언트 store(localStorage)에 있다. locale 라우팅(/ko, /en) 없이는
// 서버가 사용자의 언어를 알 수 없으므로, 마운트 후 클라이언트에서 보정한다.
// 정적 metadata는 기본값(ko)을 담당하고 — 첫 페인트가 이미 맞다 — 이 컴포넌트는
// 사용자가 en으로 바꿨을 때만 실질적으로 일한다.

"use client"

import { useEffect } from "react"
import { useLanguage } from "@/lib/i18n"

const DOC_TITLE: Record<string, string> = {
  ko: "FlowBase - 업무 데이터베이스",
  en: "FlowBase - Work database",
}

export function DocumentLanguage() {
  const lang = useLanguage()

  useEffect(() => {
    document.documentElement.lang = lang
    const title = DOC_TITLE[lang]
    if (title) document.title = title
  }, [lang])

  return null
}
