export interface TextBlock {
  id: number
  title: string
  body: string
  category: string
  lineCount: number
}

const HEADER_RE = /^<(.+?)>\s*$/

const CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ["고객센터", "콜센터", "전화번호", "연락처"], category: "연락처" },
  { keywords: ["가격", "단가", "원", "비용", "리필"], category: "가격" },
  { keywords: ["사용법", "설정", "방법", "조작", "충전", "음소거", "다운로드"], category: "사용법" },
  { keywords: ["RPM", "무게", "사용시간", "모터", "소음", "스펙", "단계", "에코", "시간", "용량"], category: "제품 스펙" },
  { keywords: ["테스트", "검수", "출고 전", "전수"], category: "품질/검수" },
  { keywords: ["배송", "교환", "반품", "파손", "AS", "발송", "응대", "안내"], category: "CS/응대" },
  { keywords: ["비밀번호", "ID", "계정", "로그인"], category: "계정/인증" },
]

function inferCategory(title: string, body: string): string {
  const haystack = `${title}\n${body}`
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) {
      return rule.category
    }
  }
  return "기타"
}

export function parseTextBlocks(text: string): TextBlock[] {
  const normalized = text.replace(/\r\n/g, "\n")
  const blocks = normalized
    .split(/^[ \t]*\*\*\*[ \t]*$/m)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks.map((raw, idx) => {
    const lines = raw.split("\n")
    const firstNonEmpty = lines.findIndex((l) => l.trim().length > 0)
    let title = ""
    let bodyStart = 0

    if (firstNonEmpty >= 0) {
      const headLine = lines[firstNonEmpty].trim()
      const m = headLine.match(HEADER_RE)
      if (m) {
        title = m[1].trim()
        bodyStart = firstNonEmpty + 1
      } else {
        title = headLine.length > 60 ? `${headLine.slice(0, 60)}…` : headLine
        bodyStart = firstNonEmpty + 1
      }
    }

    const body = lines.slice(bodyStart).join("\n").trim()

    return {
      id: idx + 1,
      title: title || "(제목 없음)",
      body,
      category: inferCategory(title, body),
      lineCount: lines.length,
    }
  })
}
