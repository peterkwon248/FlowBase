// FlowBase V2 — LCS 기반 line diff
// 출처: NEXT-ACTION P2 — "A3 Wiki body diff 정교화 (naive line diff → LCS)"
//
// prev → next 변환을 same/removed/added 시퀀스로 표현. LCS(최장 공통 부분수열)로
// 공통 라인을 정렬해, 한 줄 삽입/삭제가 이후 라인을 통째로 어긋나게 만들던
// 위치-대-위치(naive) 비교의 결함을 해소한다.
// 외부 lib ❌ LOCK 준수 (의존성 0).

export type DiffLine =
  | { kind: "same"; text: string }
  | { kind: "added"; text: string }
  | { kind: "removed"; text: string }

export function diffLines(prev: string, next: string): DiffLine[] {
  const a = prev.split("\n")
  const b = next.split("\n")
  const n = a.length
  const m = b.length

  // dp[i][j] = a[i..], b[j..]의 LCS 길이 (뒤에서 채움)
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  )
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  // backtrack — 공통 라인은 same, 그 외는 LCS를 더 많이 보존하는 방향으로 removed/added
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "removed", text: a[i] })
      i++
    } else {
      out.push({ kind: "added", text: b[j] })
      j++
    }
  }
  while (i < n) {
    out.push({ kind: "removed", text: a[i] })
    i++
  }
  while (j < m) {
    out.push({ kind: "added", text: b[j] })
    j++
  }
  return out
}
