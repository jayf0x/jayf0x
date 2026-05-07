import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// ── CSS collection ─────────────────────────────────────────────────────────────
// Inlines all document stylesheets (incl. cross-origin font sheets) into a
// single CSS string safe for injection into an SVG foreignObject.

async function blobToDataUri(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

async function inlineFontUrls(css) {
  const re = /url\((https:\/\/[^)"']+)\)/g;
  const urls = [...new Set([...css.matchAll(re)].map((m) => m[1]))];
  if (!urls.length) return css;
  const pairs = await Promise.all(
    urls.map(async (url) => {
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
      } catch {}
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

// ── HTML → CanvasTexture ───────────────────────────────────────────────────────
// Rasterizes an HTMLElement via SVG foreignObject → <img> → 2D canvas.

function createHtmlTexture(element, width, height, pixelRatio = 2) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  const ctx = canvas.getContext("2d");

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  let extraCss = "";

  async function update() {
    const serialized = new XMLSerializer().serializeToString(element);
    const styleBlock = extraCss
      ? `<style xmlns="http://www.w3.org/1999/xhtml">/*<![CDATA[*/${extraCss}/*]]>*/</style>`
      : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;">
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

  function setExtraCss(css) {
    extraCss = css;
  }

  function dispose() {
    texture.dispose();
  }

  return { texture, update, setExtraCss, dispose };
}

// ── Projection shader ──────────────────────────────────────────────────────────
// Patches MeshStandardMaterial via onBeforeCompile to project a texture from
// a virtual "projector camera" onto mesh surfaces.

function createProjector(camera, texture) {
  const uniforms = {
    projectedTexture: { value: texture },
    projectorViewMatrix: { value: new THREE.Matrix4() },
    projectorProjectionMatrix: { value: new THREE.Matrix4() },
    projectorPosition: { value: new THREE.Vector3() },
    uLitness: { value: 0 },
  };

  function applyTo(mesh) {
    if (!mesh.material) return;
    mesh.material.onBeforeCompile = (shader) => {
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
          vec4 _projWorld = modelMatrix * vec4(transformed, 1.0);
          vProjectedCoord = projectorProjectionMatrix * projectorViewMatrix * _projWorld;
          vProjectorDir = normalize(projectorPosition - _projWorld.xyz);
          vProjectorNormal = normalize(mat3(modelMatrix) * normal);`,
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
          vec3 _projNDC = vProjectedCoord.xyz / vProjectedCoord.w;
          vec2 _projUV = _projNDC.xy * 0.5 + 0.5;
          float _inFrustum = step(0.0, _projUV.x) * step(_projUV.x, 1.0)
                           * step(0.0, _projUV.y) * step(_projUV.y, 1.0)
                           * step(-1.0, _projNDC.z) * step(_projNDC.z, 1.0);
          float _facing = step(0.0, dot(vProjectorNormal, vProjectorDir));
          vec4 _projColor = texture2D(projectedTexture, _projUV);
          float _mask = _inFrustum * _facing * _projColor.a;
          diffuseColor.rgb = mix(diffuseColor.rgb, _projColor.rgb, _mask);
          vec3 _flatDiffuse = diffuseColor.rgb;`,
        )
        .replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
          gl_FragColor.rgb = mix(_flatDiffuse, gl_FragColor.rgb, uLitness);`,
        );
    };
    mesh.material.needsUpdate = true;
  }

  function update() {
    camera.updateMatrixWorld();
    uniforms.projectorViewMatrix.value.copy(camera.matrixWorldInverse);
    uniforms.projectorProjectionMatrix.value.copy(camera.projectionMatrix);
    uniforms.projectorPosition.value.setFromMatrixPosition(camera.matrixWorld);
  }

  return { applyTo, update, uniforms };
}

// ── Main entry point ───────────────────────────────────────────────────────────
// Creates a full Three.js projection scene. Appends a fixed canvas to the DOM,
// loads the GLB model, projects pageElement as a texture onto it, and starts
// the render loop.
//
// Returns { dispose } for cleanup on unmount.

export async function createProjectionScene({
  pageElement,
  modelUrl,
  cssString = null,
}) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  const FOV = 45;
  const POSITION = new THREE.Vector3(0, 0, 15);
  const LOOK_AT = new THREE.Vector3(0, -1, -4);

  // Renderer — transparent so the app background shows through
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;left:0;top:0;z-index:35;pointer-events:none;";
  document.body.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(FOV, aspect, 1, 100);
  camera.position.copy(POSITION);
  camera.lookAt(LOOK_AT);

  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(5, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  // Build HTML texture from the source element
  const htmlTex = createHtmlTexture(
    pageElement,
    width,
    height,
    Math.min(window.devicePixelRatio, 2),
  );

  // Projector camera mirrors the main camera (static projection)
  const projectorCam = new THREE.PerspectiveCamera(FOV, aspect, 1, 100);
  projectorCam.position.copy(POSITION);
  projectorCam.lookAt(LOOK_AT);
  projectorCam.updateMatrixWorld();

  const projector = createProjector(projectorCam, htmlTex.texture);

  // Load GLB
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  const gltf = await new Promise((resolve, reject) => {
    gltfLoader.load(modelUrl, resolve, undefined, reject);
  });

  const model = gltf.scene;
  const meshes = [];

  model.traverse((c) => {
    if (!c.isMesh) return;
    c.rotateZ(1.3);
    c.rotateY(1.3);
    if (c.userData.name === "bg") {
      c.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      c.castShadow = false;
      c.receiveShadow = true;
    } else {
      c.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      c.castShadow = true;
      c.receiveShadow = true;
    }
    meshes.push(c);
  });

  scene.add(model);

  for (const mesh of meshes) {
    projector.applyTo(mesh);
  }
  projector.update();

  // Rasterize after fonts are ready
  if (document.fonts?.ready) await document.fonts.ready;
  if (cssString !== null) {
    htmlTex.setExtraCss(cssString);
  } else {
    htmlTex.setExtraCss(await collectDocumentCss());
  }
  await htmlTex.update();

  // Render loop — gentle model rotation
  let animId;
  const clock = new THREE.Clock();

  (function tick() {
    animId = requestAnimationFrame(tick);
    const elapsed = clock.getElapsedTime();
    model.rotation.y = elapsed * 0.25;
    renderer.render(scene, camera);
  })();

  // Dispose everything
  function dispose() {
    cancelAnimationFrame(animId);
    renderer.dispose();
    htmlTex.dispose();
    dracoLoader.dispose();
    model.traverse((c) => {
      if (!c.isMesh) return;
      c.geometry?.dispose();
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material?.dispose();
    });
    canvas.remove();
  }

  return { dispose };
}
