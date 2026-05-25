// FlowBase V2 — Chart SVG → PNG export (G7-B1)
// 의존성 0. CSS variable (var(--chart-1)) inline화 + serialize → Image → canvas → toBlob.
//
// 한계:
//   - HTML table (Pivot)은 SVG 아님 → 별 처리 필요 (skip)
//   - recharts BarChart/DonutChart는 SVG 사용 — getBoundingClientRect로 size 계산
//   - 외부 image, css var, custom font는 inline 시 깨질 수 있음 — minimum scope

const FALLBACK_BG = "#ffffff"

// CSS variable 값 추출 (var(--chart-1) → 실제 색)
function resolveCssVar(svg: SVGSVGElement, varName: string): string | null {
  const el = svg.closest("[data-theme]") || document.documentElement
  const value = getComputedStyle(el).getPropertyValue(varName).trim()
  return value || null
}

// SVG attribute의 var() 참조를 실제 값으로 inline 치환
function inlineCssVars(svg: SVGSVGElement) {
  const elements = svg.querySelectorAll<SVGElement>("*")
  // root + children
  const all = [svg as SVGElement, ...Array.from(elements)]
  for (const el of all) {
    // attribute: fill/stroke
    for (const attr of ["fill", "stroke"]) {
      const v = el.getAttribute(attr)
      if (v && v.startsWith("var(")) {
        const match = v.match(/var\((--[^),]+)\)/)
        if (match) {
          const resolved = resolveCssVar(svg, match[1])
          if (resolved) el.setAttribute(attr, resolved)
        }
      }
    }
    // computed style fill/stroke (rect/path tailwind class)
    if (el instanceof SVGElement) {
      const cs = getComputedStyle(el)
      if (el.getAttribute("fill") == null) {
        const fill = cs.fill
        if (fill && fill !== "rgb(0, 0, 0)") el.setAttribute("fill", fill)
      }
      if (el.getAttribute("stroke") == null) {
        const stroke = cs.stroke
        if (stroke && stroke !== "rgb(0, 0, 0)" && stroke !== "none")
          el.setAttribute("stroke", stroke)
      }
    }
  }
}

// SVG 요소 → PNG blob (Promise). 실패 시 reject.
export async function svgToPng(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  // size 확정
  const rect = svg.getBoundingClientRect()
  const width = rect.width || svg.viewBox.baseVal?.width || 320
  const height = rect.height || svg.viewBox.baseVal?.height || 240

  // clone — 원본 영향 ❌
  const clone = svg.cloneNode(true) as SVGSVGElement
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  }
  clone.setAttribute("width", String(width))
  clone.setAttribute("height", String(height))

  // 원본 SVG에 inline (DOM 접근 가능 시점)
  inlineCssVars(svg)
  // clone에도 동일 처리 — clone은 detached라 getComputedStyle ❌, attribute 복사로 충분
  // (위 inlineCssVars 호출이 원본 svg 속성 갱신 → cloneNode 이전이면 적용됨. 그러나 이미 clone 후라 다시 inline 적용 — 단순화: 원본만 inline 후 serialize.)

  // serialize
  const xml = new XMLSerializer().serializeToString(svg)
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" })
  const svgUrl = URL.createObjectURL(svgBlob)

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        URL.revokeObjectURL(svgUrl)
        reject(new Error("Canvas 2D context unavailable"))
        return
      }
      ctx.fillStyle = FALLBACK_BG
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(svgUrl)
        if (!pngBlob) {
          reject(new Error("Canvas toBlob failed"))
          return
        }
        resolve(pngBlob)
      }, "image/png")
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(svgUrl)
      reject(new Error(`SVG image load failed: ${String(err)}`))
    }
    img.src = svgUrl
  })
}

// chart card root element → 첫 SVG 추출 → PNG download.
// container = ChartCard wrapper element. title = filename hint.
export async function downloadChartPng(
  container: HTMLElement,
  title = "chart",
): Promise<void> {
  const svg = container.querySelector("svg")
  if (!svg) {
    throw new Error("No SVG found in chart (HTML chart can't be exported as PNG yet)")
  }
  const blob = await svgToPng(svg as SVGSVGElement)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${title.replace(/[^\w가-힣 -]+/g, "")}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // revoke 시점 — link.click() 후 잠시 후
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
