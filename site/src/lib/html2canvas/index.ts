/**
 * A simpler TS version of https://github.com/cullenwebber/three-html-to-canvas
 */
import {
  CanvasTexture,
  LinearFilter,
  Material,
  Matrix4,
  Mesh,
  Texture,
  Vector3,
  WebGLRenderer,
  WebGLProgramParametersWithUniforms,
  VSMShadowMap,
  SRGBColorSpace,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  MeshStandardMaterial,
  Box3,
} from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CreateProjectionSceneOptions, GLTFResult, ProjectionScene } from "./types";
import { devLog } from "@/utils/logger";

// ── CSS collection ────────────────────────────────────────────────────────────

async function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

async function inlineFontUrls(css: string): Promise<string> {
  const re = /url\((https:\/\/[^)"']+)\)/g;
  const urls = [...new Set([...css.matchAll(re)].map((m) => m[1]))];
  if (!urls.length) return css;
  const pairs = await Promise.all(
    urls.map(async (url): Promise<[string, string | null]> => {
      try {
        const blob = await fetch(url).then((r) => r.blob());
        return [url, await blobToDataUri(blob)];
      } catch {
        return [url, null];
      }
    }),
  );
  let out = css;
  for (const [orig, uri] of pairs) {
    if (uri) out = out.split(orig).join(uri);
  }
  return out;
}

export async function collectDocumentCss() {
  const chunks = await Promise.all(
    Array.from(document.styleSheets).map(async (sheet) => {
      try {
        if (sheet.cssRules)
          return Array.from(sheet.cssRules)
            .map((r) => r.cssText)
            .join("\n");
      } catch (e) {
        devLog(e);
      }
      if (!sheet.href) return "";
      try {
        const css = await fetch(sheet.href).then((r) => r.text());
        return await inlineFontUrls(css);
      } catch {
        return "";
      }
    }),
  );
  return chunks.filter(Boolean).join("\n");
}

// ── HTML → CanvasTexture ──────────────────────────────────────────────────────
// Serialises the given element via SVG foreignObject.
// IMPORTANT: the element must have no offscreen/invisible positioning styles —
// those serialise verbatim and would hide content inside the SVG context.

function createHtmlTexture(
  element: HTMLElement,
  width: number,
  height: number,
  pixelRatio = 2,
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  const ctx = canvas.getContext("2d")!;

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  let extraCss = "";

  async function update() {
    const serialized = new XMLSerializer().serializeToString(element);
    const styleBlock = extraCss
      ? `<style xmlns="http://www.w3.org/1999/xhtml">/*<![CDATA[*/${extraCss}/*]]>*/</style>`
      : "";

    // The wrapper div is the positioning root; content elements with
    // position:absolute resolve against it.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject x="0" y="0" width="${width}" height="${height}">
        <div xmlns="http://www.w3.org/1999/xhtml"
             style="position:relative;width:${width}px;height:${height}px;overflow:hidden;margin:0;padding:0;">
          ${styleBlock}${serialized}
        </div>
      </foreignObject>
    </svg>`;

    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const img = new Image();
    img.src = url;
    await img.decode();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    texture.needsUpdate = true;
  }

  return {
    texture,
    update,
    setExtraCss(css: string) {
      extraCss = css;
    },
    dispose() {
      texture.dispose();
    },
  };
}

// ── Projection shader ─────────────────────────────────────────────────────────

function createProjector(camera: PerspectiveCamera, texture: Texture) {
  const uniforms = {
    projectedTexture: { value: texture },
    projectorViewMatrix: { value: new Matrix4() },
    projectorProjectionMatrix: { value: new Matrix4() },
    projectorPosition: { value: new Vector3() },
    uLitness: { value: 0 },
  };

  function applyTo(mesh: Mesh) {
    if (!mesh.material || Array.isArray(mesh.material)) return;
    const mat = mesh.material as Material;
    mat.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, uniforms);

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform mat4 projectorViewMatrix;
uniform mat4 projectorProjectionMatrix;
uniform vec3 projectorPosition;
varying vec4 vProjectedCoord;
varying vec3 vProjectorDir;
varying vec3 vProjectorNormal;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
vec4 _projWorld   = modelMatrix * vec4( transformed, 1.0 );
vProjectedCoord   = projectorProjectionMatrix * projectorViewMatrix * _projWorld;
vProjectorDir     = normalize( projectorPosition - _projWorld.xyz );
vProjectorNormal  = normalize( mat3( modelMatrix ) * normal );`,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
uniform sampler2D projectedTexture;
uniform float uLitness;
varying vec4 vProjectedCoord;
varying vec3 vProjectorDir;
varying vec3 vProjectorNormal;`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
vec3  _projNDC   = vProjectedCoord.xyz / vProjectedCoord.w;
vec2  _projUV    = _projNDC.xy * 0.5 + 0.5;
float _inFrustum = step(0.0,_projUV.x) * step(_projUV.x,1.0)
                 * step(0.0,_projUV.y) * step(_projUV.y,1.0)
                 * step(-1.0,_projNDC.z) * step(_projNDC.z,1.0);
float _facing    = step( 0.0, dot( vProjectorNormal, vProjectorDir ) );
vec4  _projColor = texture2D( projectedTexture, _projUV );
float _mask      = _inFrustum * _facing * _projColor.a;
diffuseColor.rgb = mix( diffuseColor.rgb, _projColor.rgb, _mask );
vec3 _flatDiffuse = diffuseColor.rgb;`,
        )
        .replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = mix( _flatDiffuse, gl_FragColor.rgb, uLitness );`,
        );
    };
    mat.needsUpdate = true;
  }

  function update() {
    camera.updateMatrixWorld();
    uniforms.projectorViewMatrix.value.copy(camera.matrixWorldInverse);
    uniforms.projectorProjectionMatrix.value.copy(camera.projectionMatrix);
    uniforms.projectorPosition.value.setFromMatrixPosition(camera.matrixWorld);
  }

  return { applyTo, update, uniforms };
}

// ── Main entry point ──────────────────────────────────────────────────────────
// All distance/size values are in js world units.
//
// Model transform pipeline (applied after GLB load):
//   1. Auto-centre the bounding box to the origin
//   2. Uniform scale so the longest axis == modelFitSize (then × modelScale)
//   3. Apply modelRotation (Euler XYZ, radians)
//   4. Translate by modelPosition
//
// OrbitControls are attached to `container` — events pass through the
// pointer-events:none canvas to the container element below.
export async function createProjectionScene({
  pageElement,
  modelUrl,
  container = document.body,
  cssString = null,
  // ── model tweaks ───
  modelScale = 2,
  modelFitSize = 5,
  modelPosition = { x: 0, y: 0, z: 0 },
  modelRotation = { x: 0, y: 0, z: 0 },
  // ── camera tweaks ──
  cameraFov = 45,
  cameraPosition = { x: 0, y: 0, z: 8 },
  cameraLookAt = { x: 0, y: 0, z: 0 },
}: CreateProjectionSceneOptions): Promise<ProjectionScene> {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const aspect = width / height;

  // Canvas — absolute, fills the container; pointer-events:none so orbit
  // events fall through to the container which OrbitControls listens on.
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;";
  container.appendChild(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();

  const camPos = new Vector3(
    cameraPosition.x,
    cameraPosition.y,
    cameraPosition.z,
  );
  const camTarget = new Vector3(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z);

  const camera = new PerspectiveCamera(cameraFov, aspect, 0.1, 200);
  camera.position.copy(camPos);
  camera.lookAt(camTarget);

  const controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = true;
  controls.target.copy(camTarget);
  controls.update();

  const ambient = new AmbientLight(0xffffff, 1.2);
  scene.add(ambient);
  const key = new DirectionalLight(0xffffff, 2.6);
  key.position.set(5, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  // Projector camera — frozen at the initial camera pose so the texture stays
  // locked to the model surface as the user orbits.
  const projectorCam = new PerspectiveCamera(cameraFov, aspect, 0.1, 200);
  projectorCam.position.copy(camPos);
  projectorCam.lookAt(camTarget);
  projectorCam.updateMatrixWorld();

  const htmlTex = createHtmlTexture(
    pageElement,
    width,
    height,
    Math.min(window.devicePixelRatio, 2),
  );
  const projector = createProjector(projectorCam, htmlTex.texture);

  // Load GLB
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  const gltf = (await new Promise<GLTF>((resolve, reject) => {
    gltfLoader.load(modelUrl, resolve, undefined, reject);
  })) as GLTFResult;

  const model = gltf.scene;
  const meshes: Mesh[] = [];

  model.traverse((c) => {
    if (!(c instanceof Mesh)) return;
    c.material = new MeshStandardMaterial({ color: 0xffffff });
    c.castShadow = true;
    c.receiveShadow = true;
    meshes.push(c);
  });

  // 1. Auto-centre: move bounding box centre to world origin
  const box = new Box3().setFromObject(model);
  const centre = box.getCenter(new Vector3());
  model.position.sub(centre);

  // 2. Uniform scale so the longest axis == modelFitSize, then apply multiplier
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const autoScale =
    maxDim > 0 ? (modelFitSize / maxDim) * modelScale : modelScale;
  model.scale.setScalar(autoScale);

  // 3. User rotation (Euler XYZ, radians)
  model.rotation.set(modelRotation.x, modelRotation.y, modelRotation.z);

  // 4. User position offset
  model.position.add(
    new Vector3(modelPosition.x, modelPosition.y, modelPosition.z),
  );

  scene.add(model);

  for (const mesh of meshes) projector.applyTo(mesh);
  projector.update();

  // Rasterise HTML once fonts are ready
  if (document.fonts?.ready) await document.fonts.ready;
  htmlTex.setExtraCss(
    cssString !== null ? cssString : await collectDocumentCss(),
  );
  await htmlTex.update();

  // Render loop
  let animId: number;
  (function tick() {
    animId = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  })();

  function dispose() {
    cancelAnimationFrame(animId);
    controls.dispose();
    renderer.dispose();
    htmlTex.dispose();
    dracoLoader.dispose();
    model.traverse((c) => {
      if (!(c instanceof Mesh)) return;
      c.geometry?.dispose();
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material?.dispose();
    });
    canvas.remove();
  }

  return { dispose, camera, scene, gltf };
}
