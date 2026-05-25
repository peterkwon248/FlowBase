"use client"

// FlowBase V2 — 글로벌 키보드 단축키
//   ⌘Z / ⌘⇧Z / Delete — undo·redo·행 삭제 (Phase 1A)
//   ⌘⇧A / ⌘⇧F / ⌘B — 패널 토글, ⌘N — 새 행 (Phase 5, design §8)
// 설계: docs/02-design/features/flowbase-v2-phase{1,5}.design.md
// 셀 단위 네비(Tab/Enter/Arrow)는 useSheetKeyboardNav(Phase 1B)가 별도 담당.

import { useEffect } from "react"
import { useFlowBase } from "@/lib/flowbase-store"

// input/textarea/select/contentEditable 포커스 중이면 입력기에 양보
function isEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  )
}

// 보드 페이지에서 한 번 호출 — 글로벌 keydown 리스너 등록.
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      const mod = e.metaKey || e.ctrlKey
      const editing = isEditingTarget(e.target)

      // ⌘Z / ⌘⇧Z — 셀 편집 중에는 입력기의 자체 undo에 양보
      if (mod && e.key.toLowerCase() === "z") {
        if (editing) return
        e.preventDefault()
        const s = useFlowBase.getState()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }

      // ⌘K — 검색 팔레트 열기 (편집 중에도 동작 — 셸 단축키)
      if (mod && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault()
        useFlowBase.getState().setSearchOpen(true)
        return
      }

      // ⌘J — Ask AI: 패널 닫혀 있으면 열고 composer focus (편집 중에도 동작)
      if (mod && !e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault()
        useFlowBase.getState().requestAskAi()
        return
      }

      // 패널 토글 — ⌘⇧A / ⌘⇧F / ⌘B (편집 중에도 동작 — 셸 단축키)
      if (mod && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault()
        useFlowBase.getState().togglePanel("activityBar")
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault()
        useFlowBase.getState().togglePanel("sidebar")
        return
      }
      if (mod && !e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault()
        useFlowBase.getState().togglePanel("aiPanel")
        return
      }
      if (mod && !e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault()
        useFlowBase.getState().togglePanel("detailBar")
        return
      }

      // ⌘N — active board에 새 행
      if (mod && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault()
        useFlowBase.getState().addRow()
        return
      }

      // P2: ⌘/ (또는 ⌘?) — 단축키 docs 모달 토글. 편집 중에도 동작 (셸 단축키).
      if (mod && (e.key === "/" || e.key === "?")) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("flowbase-toggle-shortcuts-help"))
        return
      }

      // ⌘D — 선택 행 복제. 셀 편집 중에는 입력기에 양보.
      if (mod && !e.shiftKey && e.key.toLowerCase() === "d") {
        if (editing) return
        const s = useFlowBase.getState()
        if (s.selectedRowIds.length === 0) return
        e.preventDefault()
        for (const id of s.selectedRowIds) {
          s.duplicateRow(id)
        }
        return
      }

      // Delete / Backspace — 선택 행 삭제 (편집 중 ❌, 선택 없으면 무시)
      if ((e.key === "Delete" || e.key === "Backspace") && !editing) {
        const s = useFlowBase.getState()
        if (s.selectedRowIds.length === 0) return
        e.preventDefault()
        s.deleteRows(s.selectedRowIds)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
}
