export const TERRAIN = {
  // Full grid dimensions (panel area faded via TSL camera-right projection)
  cols: 20,
  rows: 8,
  gapFraction: 0.08,

  // Heights in world units — large range for "skyscraper to sandy shore" drama
  minHeight: 0.3,
  maxHeight: 10.0,

  // Noise
  spatialFreq: 0.4,
  animSpeed: 0.12,

  // --- Dimetric orthographic camera ---
  // worldViewWidth: world units visible across the canvas width.
  // OrthoZoom sets zoom = size.width / worldViewWidth so this scales everything.
  worldViewWidth: 25,

  // Camera placed using THREE.Vector3.setFromSphericalCoords(distance, phi, theta):
  //   phi   = PI/3  → 60° from +Y axis (30° above XZ-plane)
  //   theta = PI/4  → 45° from +Z toward +X (diagonal, shows 3 cube faces)
  cameraDistance: 22,
  cameraSphericalPhi: Math.PI / 3,
  cameraSphericalTheta: Math.PI / 4,
  cameraTarget: [0, 4, -1] ,

  // --- Colors ---
  bgColor: '#14141a',
  columnColor: '#4c4c64',

  // Lighting — consumed by TSL manual lighting in ColumnGrid
  ambientIntensity: 0.35,
  dirLight1Position: [4, 12, 4] ,
  dirLight1Intensity: 1.5,
  dirLight2Position: [-3, 3, 8] ,
  dirLight2Intensity: 0.55,

  // --- Site panel ---
  sitePanelBg: 'rgba(255, 255, 255, 0.88)',
  sitePanelWidth: '60%',

  // Panel fade in world units along the camera-right axis.
  // The panel half-width in camera-right space = worldViewWidth * 0.3 (60% of frustum).
  panelFadeWidth: 1.5,
}
