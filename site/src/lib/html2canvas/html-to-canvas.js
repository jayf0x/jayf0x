import * as THREE from 'three'

/**
 * Rasterizes an HTMLElement into a THREE.CanvasTexture via the SVG
 * `<foreignObject>` trick.
 *
 * How it works:
 *   1. Serialize the element to a string
 *   2. Wrap in `<svg><foreignObject>` with embedded styles
 *   3. Encode as a data-URL and load as `<img>`
 *   4. Draw the image onto a 2D canvas
 *   5. The canvas is wrapped in a THREE.CanvasTexture (live reference)
 *
 * Limitations (inherent to foreignObject):
 *   - External images need CORS access or data-URI inlining
 *   - Web fonts must be loaded before calling update()
 *   - No interactivity — this is a static snapshot
 *
 * Mobile: pixelRatio should be window.devicePixelRatio (capped at 2)
 * for sharp rendering on retina / high-DPI displays.
 *
 * Usage:
 *   const h2c = new HtmlToCanvas(element, { width, height, pixelRatio })
 *   h2c.extraCss = await collectDocumentCss()  // embed Tailwind + fonts
 *   await h2c.update()                          // first rasterize
 *   projector.applyTo(mesh)                     // h2c.texture is ready
 */
export default class HtmlToCanvas {
  constructor(element, { width, height, pixelRatio = 2 } = {}) {
    this.element = element
    this.pixelRatio = pixelRatio
    this.extraCss = ''

    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')

    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.generateMipmaps = false

    // Internal: prevent concurrent renders, queue pending updates
    this._rendering = false
    this._pending = false
    this._current = null

    this.resize(width ?? window.innerWidth, height ?? window.innerHeight)
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  /** Rasterizes the element. Queues a follow-up if called while rendering. */
  async update() {
    if (this._rendering) {
      this._pending = true
      return this._current
    }

    this._rendering = true
    this._current = (async () => {
      try {
        do {
          this._pending = false

          const nextW = Math.floor(this.width * this.pixelRatio)
          const nextH = Math.floor(this.height * this.pixelRatio)
          if (nextW !== this.canvas.width || nextH !== this.canvas.height) {
            this.canvas.width = nextW
            this.canvas.height = nextH
            this.texture.dispose()
          }

          const url = this.#buildSvgDataUrl()
          const img = new Image()
          img.src = url
          await img.decode()

          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height)

          this.texture.needsUpdate = true
        } while (this._pending)
      } finally {
        this._rendering = false
        this._current = null
      }
    })()

    return this._current
  }

  dispose() {
    this.texture.dispose()
  }

  #buildSvgDataUrl() {
    const serialized = new XMLSerializer().serializeToString(this.element)
    const styleBlock = this.extraCss
      ? `<style xmlns="http://www.w3.org/1999/xhtml">/*<![CDATA[*/${this.extraCss}/*]]>*/</style>`
      : ''

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}">` +
      `<foreignObject width="100%" height="100%">` +
      `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${this.width}px;height:${this.height}px;">` +
      styleBlock + serialized +
      `</div></foreignObject></svg>`

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }
}
