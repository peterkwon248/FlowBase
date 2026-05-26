'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

// LOCK (P-1, 2026-05-26): toast position = "bottom-right" 일관 유지.
//   - 개별 toast 호출이 position 명시 ❌. (Layout: 사이드바 좌 + AI 패널 우 — bottom-right는 portal viewport
//     레벨에서 렌더되어 panel 위에 표시되므로 가장 덜 침해.)
//   - richColors: warning/error/success 시각 구분 (특히 viewer-readonly toast 가독성).
//   - closeButton: 사용자 명시 dismiss (snapshot/import 등 긴 toast).
//   - duration 기본 4000ms (action toast는 호출처에서 12000 등 override 가능).
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
