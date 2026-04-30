Imagine a white page like a calm ocean where you can't see the waves. Then like the wind blows, some tiles/squares move slightly up in 3D, revealing a subtle lighting coming from under them, like a wave on an isometric digital ocean.

Use Vertex shader/Perlin/Simplex noise - what's most pragmatic for this use case.

Expected result:
- visually: tiles sporadically appear where noise is high and fade out becoming part again of the plane again
- each tile is basically a 3D cube with a stretched hight
- use 

## Concept: Content-Aware Noise Modulation

You have a moving tile floor driven by a noise function. Instead of applying the same movement everywhere, the strength of that movement changes depending on where the tiles are on the screen.

The central idea is that areas close to visible content (like the main section or footer) should move less, while areas farther away can move more. This creates a calm zone around content and a more dynamic environment toward the edges.

To achieve this, you define invisible regions that correspond to your layout elements. These regions act as zones where the animation is reduced. Around those zones, the movement gradually increases, creating a smooth transition rather than a sharp boundary.

The result is a surface where motion adapts to the layout: subtle and non-distracting near content, more expressive in open space.




