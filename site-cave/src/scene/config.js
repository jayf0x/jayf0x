export const SCENE_CONFIG = {
  // Projector spotlight
  lightX: 0,
  lightY: 0.5,
  lightZ: 3.5,
  lightIntensity: 18,
  lightAngle: 0.45,
  lightPenumbra: 0.35,

  // Wall GLB
  wallX: 0,
  wallY: 0,
  wallZ: 0,
  wallScale: 0,
  wallRotX: 0,

  // Atmosphere
  ambientIntensity: 3,
  dustOpacity: 0.35,
  fogColor: "#000",
  fogDensity: 0.09,
  // Bloom above ~1.5 causes runaway render-target accumulation and can crash the tab.
  bloomIntensity: 0.6,

  // Fire / God Rays
  showGodRays: true,
  sunX: 0,
  sunY: 0,
  sunZ: 3,
  sunSize: 0.3,
  godRaysDensity: 0.96,
  godRaysWeight: 0.6,
  godRaysDecay: 0.93,
  fireIntensity: 8,

  // QA Cube
  cubeX: 0,
  cubeY: 0,
  cubeZ: 1,
  cubeScale: 0.4,
};
