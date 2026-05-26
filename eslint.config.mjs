// FlowBase V2 — ESLint flat config (Q2)
// ESLint 9 + Next.js 16 + TypeScript + React 19 + Vitest.
//
// Minimal flat config — typescript recommended + next plugin (core-web-vitals 위주).
// 강제 룰 추가는 최소 — react-hooks/exhaustive-deps만 명시 (zustand 직접 구독 무한 루프
// 방지 패턴 보호). 그 외는 ts/next recommended.
//
// 무시: build artifacts (.next, node_modules) · prototype legacy · design-ref legacy ·
// shadcn 표준 컴포넌트 (own conventions).

import nextPlugin from "@next/eslint-plugin-next"
import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "design-ref/**",
      "next-env.d.ts",
      "components/ui/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      // ts recommended (manual selection)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      // Q13-D3: 추가 룰 강화
      "@typescript-eslint/no-misused-promises": "off", // typed-linting 필요 (skip)
      // next core-web-vitals 핵심
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "off",
      // react-hooks 패턴 보호 (zustand selectVisibleRows 등)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // 일반
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-unused-vars": "off", // ts 버전 사용
      "prefer-const": "warn",
      // Q13-D3: console.log/debug 차단 (info/warn/error는 OK — 의도된 로깅).
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      // eqeqeq — strict equality 권장 (==를 ===로). 단 null check만 != 허용.
      eqeqeq: ["warn", "smart"],
    },
  },
]
