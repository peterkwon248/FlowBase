// FlowBase V2 — rows 스냅샷 기반 undo/redo 스택
// 출처: design-ref/handoff/STATE-SHAPES.md §3
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §5
// localStorage persist ❌ — 새 세션 = 새 스택. 스토어 액션이 push/undo/redo 호출.

import type { TableRow } from "@/types/flowbase"

export interface RowsSnapshot {
  boardId: string
  rows: TableRow[]
}

const LIMIT = 30

class UndoStack {
  private past: RowsSnapshot[] = []
  private future: RowsSnapshot[] = []

  // 변경 직전 스냅샷 저장. 새 액션이므로 redo 스택은 비운다.
  push(snapshot: RowsSnapshot): void {
    this.past.push(snapshot)
    if (this.past.length > LIMIT) this.past.shift()
    this.future = []
  }

  // current = 현재 상태 스냅샷. 직전 상태를 반환하고 current는 redo 스택으로.
  undo(current: RowsSnapshot): RowsSnapshot | null {
    const prev = this.past.pop()
    if (!prev) return null
    this.future.push(current)
    return prev
  }

  redo(current: RowsSnapshot): RowsSnapshot | null {
    const next = this.future.pop()
    if (!next) return null
    this.past.push(current)
    return next
  }

  canUndo(): boolean {
    return this.past.length > 0
  }

  canRedo(): boolean {
    return this.future.length > 0
  }

  clear(): void {
    this.past = []
    this.future = []
  }
}

// 모듈 싱글톤 — 스토어가 import해서 사용.
export const undoStack = new UndoStack()
