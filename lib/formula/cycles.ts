// FlowBase V2 — Formula 순환 의존 detection (G7-C C-F5)
// formula 컬럼들 간 prop() 참조로 만들어진 dependency graph에서 cycle 탐지.
// DFS + 3색(white/gray/black) coloring.

import type { ColumnDef } from "@/types/flowbase"

export interface CycleDetectionResult {
  // 순환이 발견되면 그 cycle을 이루는 컬럼 이름들 (방문 순서, 마지막이 시작 노드와 동일).
  // 예: ["A", "B", "C", "A"] = A → B → C → A
  cycle: string[]
}

// 입력 columns 사이에 formula 순환이 있으면 첫 cycle 반환, 없으면 null.
// 비-formula 컬럼은 deps에서 무시 — text/num 같은 "leaf" 컬럼은 cycle 형성 불가.
export function detectCycle(
  columns: ColumnDef[],
): CycleDetectionResult | null {
  const formulaCols = columns.filter((c) => c.type === "formula")
  if (formulaCols.length === 0) return null

  const formulaNames = new Set(formulaCols.map((c) => c.name))
  const edges = new Map<string, string[]>()
  for (const col of formulaCols) {
    const deps = (col.formulaDeps ?? []).filter((d) => formulaNames.has(d))
    edges.set(col.name, deps)
  }

  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map<string, number>()
  for (const col of formulaCols) color.set(col.name, WHITE)

  const path: string[] = []

  function dfs(node: string): string[] | null {
    const c = color.get(node)
    if (c === GRAY) {
      // 현재 path에서 node가 등장하는 지점부터 끝까지 + node = cycle
      const idx = path.indexOf(node)
      return path.slice(idx).concat(node)
    }
    if (c === BLACK) return null

    color.set(node, GRAY)
    path.push(node)
    for (const next of edges.get(node) ?? []) {
      const cycle = dfs(next)
      if (cycle) return cycle
    }
    path.pop()
    color.set(node, BLACK)
    return null
  }

  for (const col of formulaCols) {
    if (color.get(col.name) === WHITE) {
      const cycle = dfs(col.name)
      if (cycle) return { cycle }
    }
  }
  return null
}

// addColumn/updateColumn에서 patch 직전 호출. patch 적용 후의 columns를 시뮬레이션해서 cycle 탐지.
// 사용처: store. patch 거부 + toast가 호출.
export function wouldCreateCycle(
  prevColumns: ColumnDef[],
  patch:
    | { kind: "add"; col: ColumnDef }
    | { kind: "update"; name: string; patch: Partial<ColumnDef> },
): CycleDetectionResult | null {
  let nextColumns: ColumnDef[]
  if (patch.kind === "add") {
    nextColumns = [...prevColumns, patch.col]
  } else {
    nextColumns = prevColumns.map((c) =>
      c.name === patch.name ? { ...c, ...patch.patch } : c,
    )
  }
  return detectCycle(nextColumns)
}
