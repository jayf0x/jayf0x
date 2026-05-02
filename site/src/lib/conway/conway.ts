export type CK = string

export const ck = (x: number, y: number): CK => `${x},${y}`

export function unck(k: CK): [number, number] {
  const i = k.indexOf(',')
  return [parseInt(k.slice(0, i), 10), parseInt(k.slice(i + 1), 10)]
}

export function conwayStep(
  alive: Set<CK>,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): { next: Set<CK>; counts: Map<CK, number> } {
  const counts = new Map<CK, number>()

  for (const k of alive) {
    const [x, y] = unck(k)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue
        const nk = ck(nx, ny)
        counts.set(nk, (counts.get(nk) ?? 0) + 1)
      }
    }
  }

  const next = new Set<CK>()
  for (const [k, c] of counts) {
    if (alive.has(k) ? c === 2 || c === 3 : c === 3) next.add(k)
  }

  return { next, counts }
}
