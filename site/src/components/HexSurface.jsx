import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'

// ---------------------------------------------------------------------------
// VERTEX SHADER
// Noise is sampled at each tile's cell centre — all vertices of a tile share
// the same Z offset and face normal so the tile acts as a rigid geometric unit.
// Three elevation samples (centre + 2 neighbours) produce the hex face normal.
// ---------------------------------------------------------------------------
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uHexScale;
  uniform float uNoiseSpeed;
  uniform float uNoiseFreq;
  uniform float uElevation;
  uniform float uElevAmp;

  varying vec2  vPx;
  varying float vElev;
  varying vec3  vNormal;

  // 2D Simplex noise --------------------------------------------------------
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i   = floor(v + dot(v, C.yy));
    vec2 x0  = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy  -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m  = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m       = m * m * m * m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // FBM — 5 octaves, 30° rotation between layers ----------------------------
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8660254, 0.5, -0.5, 0.8660254);
    for (int i = 0; i < 5; i++) {
      v += a * snoise(p);
      p  = rot * p * 2.07 + vec2(3.7, 1.9);
      a *= 0.5;
    }
    return v * 0.5 + 0.5;
  }

  // Flat-top hex grid -------------------------------------------------------
  vec4 hexGrid(vec2 p) {
    vec2 r  = vec2(1.0, 1.7320508);
    vec2 h  = r * 0.5;
    vec2 a  = mod(p,     r) - h;
    vec2 b  = mod(p - h, r) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    return vec4(gv, p - gv);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Smooth continuous elevation — single soft S-curve, no binary threshold --
  float cellElev(vec2 id, vec2 ds, vec2 dt) {
    float swell = fbm(id * uNoiseFreq * 0.28 + ds);
    float tile  = fbm(id * uNoiseFreq        + dt);
    float e     = swell * 0.65 + tile * 0.35;
    // Per-tile random threshold offset so neighbours don't all switch together
    float rnd = hash(id);
    float lo  = 0.35 + rnd * 0.06;
    float hi  = lo + 0.28;          // 0.28-wide transition = slow, visible rise
    return smoothstep(lo, hi, e) * uElevation;
  }

  void main() {
    vec2 px = uv * uResolution;
    vPx     = px;
    vec2 id = hexGrid(px / uHexScale).zw;

    vec2 ds = uTime * uNoiseSpeed * 0.32 * vec2( 0.17,  0.23);
    vec2 dt = uTime * uNoiseSpeed        * vec2( 0.29, -0.21);

    float h0 = cellElev(id,                        ds, dt);
    float hX = cellElev(id + vec2(1.0, 0.0),       ds, dt);
    float hY = cellElev(id + vec2(0.5, 0.8660254), ds, dt);

    vElev = h0;

    // Hex face normal from two adjacent cell heights
    float amp = uElevAmp;
    float hex = uHexScale;
    vec3 tX   = vec3(hex,       0.0,             (hX - h0) * amp);
    vec3 tY   = vec3(hex * 0.5, hex * 0.8660254, (hY - h0) * amp);
    vNormal   = normalize(cross(tX, tY));
    if (vNormal.z < 0.0) vNormal = -vNormal;

    vec3 pos = position;
    pos.z   += h0 * amp;          // positive Z = toward camera = column rises

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// ---------------------------------------------------------------------------
// FRAGMENT SHADER
// Hex grid recomputed from vPx so rim boundaries are always crisp.
// Lighting effect is proportional to elevation: base surface is exactly
// #faf8f2 with no visible structure.
// ---------------------------------------------------------------------------
const fragmentShader = /* glsl */ `
  uniform float uHexScale;
  uniform float uShadowStr;
  uniform float uLightStr;
  uniform vec3  uLightDir;

  varying vec2  vPx;
  varying float vElev;
  varying vec3  vNormal;

  // Flat-top hex SDF: 0 = centre, 0.5 = edge midpoint
  float hexDist(vec2 p) {
    p = abs(p);
    return max(p.y, dot(p, vec2(0.8660254, 0.5)));
  }

  vec4 hexGrid(vec2 p) {
    vec2 r  = vec2(1.0, 1.7320508);
    vec2 h  = r * 0.5;
    vec2 a  = mod(p,     r) - h;
    vec2 b  = mod(p - h, r) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    return vec4(gv, p - gv);
  }

  void main() {
    vec2  gv = hexGrid(vPx / uHexScale).xy;
    float hd = hexDist(gv);

    // Thin dark rim — simulates the shadowed sides of the raised column.
    // Lives only in the outer ~20% of the tile so the top face stays clean.
    float rimT  = smoothstep(0.38, 0.49, hd);
    float shadow = rimT * vElev * uShadowStr;

    // Lambert: (diff − 0.5) centres variation around zero so the resting
    // surface contributes zero lightV regardless of the normal.
    // Multiplier 0.25 gives ±12% brightness range — clearly visible.
    vec3  N      = normalize(vNormal);
    vec3  L      = normalize(uLightDir);
    float diff   = dot(N, L);
    float lightV = (diff - 0.5) * vElev * uLightStr * 0.25;

    vec3 base  = vec3(0.9804, 0.9725, 0.9490); // #faf8f2
    vec3 color = base + lightV - shadow;

    gl_FragColor = vec4(color, 1.0);
  }
`

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const FOV_DEG = 28

export const HexSurface = () => {
  const matRef  = useRef()
  const { size, camera } = useThree()

  // Position the perspective camera so the plane at z=0 fills the viewport
  useEffect(() => {
    const z = (size.height / 2) / Math.tan((FOV_DEG * Math.PI / 180) / 2)
    camera.position.set(0, 0, z)
    camera.near = z * 0.01
    camera.far  = z * 6
    camera.updateProjectionMatrix()
  }, [camera, size.height])

  const {
    hexScale, noiseSpeed, noiseFreq,
    elevation, elevAmp, shadowStr, lightStr,
  } = useControls('Hex Surface', {
    hexScale:   { value: 42,   min: 10,    max: 200,  step: 1     },
    noiseSpeed: { value: 0.05, min: 0,     max: 0.5,  step: 0.005 },
    noiseFreq:  { value: 0.05, min: 0.005, max: 0.2,  step: 0.005 },
    elevation:  { value: 1.0,  min: 0,     max: 2.0,  step: 0.01  },
    elevAmp:    { value: 80,   min: 0,     max: 300,  step: 5     },
    shadowStr:  { value: 0.12, min: 0,     max: 0.5,  step: 0.005 },
    lightStr:   { value: 2.0,  min: 0,     max: 6.0,  step: 0.1   },
  })

  const uniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uResolution: { value: [size.width, size.height] },
    uHexScale:   { value: hexScale   },
    uNoiseSpeed: { value: noiseSpeed },
    uNoiseFreq:  { value: noiseFreq  },
    uElevation:  { value: elevation  },
    uElevAmp:    { value: elevAmp    },
    uShadowStr:  { value: shadowStr  },
    uLightStr:   { value: lightStr   },
    uLightDir:   { value: [0.4, 0.6, 1.0] },
  }), []) // eslint-disable-line

  useFrame(({ clock }) => {
    const m = matRef.current
    if (!m) return
    const t = clock.getElapsedTime()
    m.uniforms.uTime.value       = t
    m.uniforms.uResolution.value = [size.width, size.height]
    m.uniforms.uHexScale.value   = hexScale
    m.uniforms.uNoiseSpeed.value = noiseSpeed
    m.uniforms.uNoiseFreq.value  = noiseFreq
    m.uniforms.uElevation.value  = elevation
    m.uniforms.uElevAmp.value    = elevAmp
    m.uniforms.uShadowStr.value  = shadowStr
    m.uniforms.uLightStr.value   = lightStr
    // Light drifts slowly — atmospheric, not reactive
    const a = t * 0.07
    m.uniforms.uLightDir.value = [Math.sin(a) * 0.6, 0.5, 1.0]
  })

  const segX = Math.round(size.width  / 10)
  const segY = Math.round(size.height / 10)

  return (
    <mesh>
      <planeGeometry args={[size.width, size.height, segX, segY]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
