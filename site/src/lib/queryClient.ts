import { QueryClient } from "@tanstack/react-query"

const FIVE_HOURS = 5 * 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_HOURS,
      gcTime: FIVE_HOURS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Thin localStorage cache layer around any async fetch.
 *  Falls back gracefully if localStorage is unavailable. */
export async function withLocalStorageCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const { data, ts } = JSON.parse(raw) as { data: T; ts: number }
      if (Date.now() - ts < ttl) return data
    }
  } catch {}

  const data = await fn()

  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch {}

  return data
}
