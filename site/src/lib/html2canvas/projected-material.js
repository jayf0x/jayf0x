import * as THREE from 'three'

/**
 * Projects a texture onto any MeshStandardMaterial as if a virtual camera
 * were a slide projector in world space. Inspired by three-projected-material
 * but implemented as an `onBeforeCompile` shader patch so host material
 * lighting and environment stay intact.
 *
 * One projector can drive many meshes — all share the same uniforms, so
 * calling update() once per frame refreshes every mesh simultaneously.
 *
 * Key uniform: `uLitness`
 *   0 → fragment color = flat sampled texture (pure 2D illusion)
 *   1 → fragment color = texture composited with full PBR lighting
 *   Animated in Scene.animate() based on camera's distance from rest position.
 *
 * Usage:
 *   const projector = createProjector({ camera, texture })
 *   projector.applyTo(mesh)          // patch the mesh's material
 *   projector.update()               // sync camera matrices (call each frame or on change)
 *   projector.uniforms.uLitness.value = t  // 0–1 blend
 */
export function createProjector({ camera, texture }) {
  const uniforms = {
    projectedTexture: { value: texture },
    projectorViewMatrix: { value: new THREE.Matrix4() },
    projectorProjectionMatrix: { value: new THREE.Matrix4() },
    projectorPosition: { value: new THREE.Vector3() },
    uLitness: { value: 0 },
  }

  function applyTo(mesh) {
    const material = mesh.material
    if (!material) return

    material.onBeforeCompile = (shader) => {
      // Inject uniforms into the compiled shader
      shader.uniforms.projectedTexture = uniforms.projectedTexture
      shader.uniforms.projectorViewMatrix = uniforms.projectorViewMatrix
      shader.uniforms.projectorProjectionMatrix = uniforms.projectorProjectionMatrix
      shader.uniforms.projectorPosition = uniforms.projectorPosition
      shader.uniforms.uLitness = uniforms.uLitness

      // ── Vertex shader ────────────────────────────────────────────────────
      // Compute each vertex's position in projector clip-space so the
      // fragment shader can sample the texture via perspective division.
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform mat4 projectorViewMatrix;
          uniform mat4 projectorProjectionMatrix;
          uniform vec3 projectorPosition;
          varying vec4 vProjectedCoord;
          varying vec3 vProjectorDir;
          varying vec3 vProjectorNormal;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vec4 _projWorld = modelMatrix * vec4(transformed, 1.0);
          vProjectedCoord = projectorProjectionMatrix * projectorViewMatrix * _projWorld;
          vProjectorDir = normalize(projectorPosition - _projWorld.xyz);
          vProjectorNormal = normalize(mat3(modelMatrix) * normal);`
        )

      // ── Fragment shader ──────────────────────────────────────────────────
      // Convert clip-space coord to UV, check frustum + facing, sample,
      // then blend flat texture vs full PBR output via uLitness.
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform sampler2D projectedTexture;
          uniform float uLitness;
          varying vec4 vProjectedCoord;
          varying vec3 vProjectorDir;
          varying vec3 vProjectorNormal;`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          vec3 _projNDC = vProjectedCoord.xyz / vProjectedCoord.w;
          vec2 _projUV  = _projNDC.xy * 0.5 + 0.5;
          float _inFrustum = step(0.0, _projUV.x) * step(_projUV.x, 1.0)
                           * step(0.0, _projUV.y) * step(_projUV.y, 1.0)
                           * step(-1.0, _projNDC.z) * step(_projNDC.z, 1.0);
          float _facing   = step(0.0, dot(vProjectorNormal, vProjectorDir));
          vec4  _projColor = texture2D(projectedTexture, _projUV);
          float _mask      = _inFrustum * _facing * _projColor.a;
          diffuseColor.rgb = mix(diffuseColor.rgb, _projColor.rgb, _mask);
          vec3 _flatDiffuse = diffuseColor.rgb;`
        )
        .replace(
          '#include <opaque_fragment>',
          `#include <opaque_fragment>
          // Blend: uLitness=0 → flat HTML look; uLitness=1 → full PBR lighting
          gl_FragColor.rgb = mix(_flatDiffuse, gl_FragColor.rgb, uLitness);`
        )
    }

    material.needsUpdate = true
  }

  function update() {
    camera.updateMatrixWorld()
    uniforms.projectorViewMatrix.value.copy(camera.matrixWorldInverse)
    uniforms.projectorProjectionMatrix.value.copy(camera.projectionMatrix)
    uniforms.projectorPosition.value.setFromMatrixPosition(camera.matrixWorld)
  }

  return { applyTo, update, uniforms, camera }
}
