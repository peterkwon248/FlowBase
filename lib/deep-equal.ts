// FlowBase V2 — deep equal helper (Q1-B5)
// 의존성 0. 순수 함수.
//
// JSON.stringify 비교는 키 순서 영향 받음 (브라우저별 객체 키 ordering). 같은 의미 다른
// 순서면 false → SavedView modified detection 등에서 false positive 발생.
// 이 helper는 키 순서 무관 — Object.keys 정렬 없이 양쪽 keys 합집합 비교.
//
// LOCK: 순수 데이터 비교만 (function, Date, RegExp, Map, Set 등 미지원 — store state는
// JSON 직렬화 가능한 primitive/array/plain object 위주).

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== "object") return false

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], (b as unknown[])[i])) return false
    }
    return true
  }
  // plain object
  if (Array.isArray(b)) return false
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const aKeys = Object.keys(ao)
  const bKeys = Object.keys(bo)
  if (aKeys.length !== bKeys.length) return false
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false
    if (!deepEqual(ao[k], bo[k])) return false
  }
  return true
}
