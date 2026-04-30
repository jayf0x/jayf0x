/**
 * Collects every stylesheet currently attached to the document and returns
 * them as a single CSS string for injection into an SVG `<foreignObject>`.
 *
 * Why this exists:
 *   When HtmlToCanvas serializes a DOM element into a data-URL SVG, that SVG
 *   is loaded as an `<img>` in "restricted mode" — it cannot reach the parent
 *   document's stylesheets or @font-face rules. Tailwind utilities and Google
 *   Fonts silently fall back to browser defaults unless we embed CSS directly.
 *
 * Same-origin sheets (Vite CSS, inline <style>):
 *   Read via CSSOM — cssRules is accessible.
 *
 * Cross-origin sheets (fonts.googleapis.com):
 *   CSSOM access throws SecurityError, so we fetch the href instead.
 *   Font CSS then has every remote woff2 URL rewritten to a base64 data URI
 *   so the sandboxed SVG can render fonts without network access.
 */
export async function collectDocumentCss() {
  const chunks = await Promise.all(
    Array.from(document.styleSheets).map(readSheet)
  )
  return chunks.filter(Boolean).join('\n')
}

async function readSheet(sheet) {
  try {
    const rules = sheet.cssRules
    if (rules) {
      return Array.from(rules).map((r) => r.cssText).join('\n')
    }
  } catch {
    // Cross-origin — fall through to fetch
  }

  if (!sheet.href) return ''

  try {
    const res = await fetch(sheet.href)
    const css = await res.text()
    return inlineFontUrls(css)
  } catch {
    return ''
  }
}

/** Replaces every `url(https://...)` in `css` with a base64 data URI. */
async function inlineFontUrls(css) {
  const urlRegex = /url\((https:\/\/[^)"']+)\)/g
  const urls = [...new Set([...css.matchAll(urlRegex)].map((m) => m[1]))]
  if (!urls.length) return css

  const pairs = await Promise.all(
    urls.map(async (url) => {
      try {
        const blob = await (await fetch(url)).blob()
        return [url, await blobToDataUri(blob)]
      } catch {
        return [url, null]
      }
    })
  )

  let out = css
  for (const [orig, dataUri] of pairs) {
    if (dataUri) out = out.split(orig).join(dataUri)
  }
  return out
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
