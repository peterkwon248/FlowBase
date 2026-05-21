// FlowBase — vitest 설정 (Phase 2 — AI 라우트 테스트용 최소 도입)
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §14 Q2

import { defineConfig } from "vitest/config"

export default defineConfig({
  // tsconfig의 "@/*" path alias를 네이티브 해석 (vitest 4+)
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
  },
})
