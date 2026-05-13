import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildGoboCanvas } from "./utils/textCanvas";

/**
 * ProjectionSurface — off-screen render target for the spotlight gobo.
 *
 * Three layers composited each frame into `target`:
 *   0  video plane  — mp4 looping video, NormalBlending (base)
 *   1  text plane   — white text, AdditiveBlending (adds brightness on top of video)
 *   2  webcam plane — user silhouette, MultiplyBlending (shadow that dims projection)
 *
 * Video mesh is hidden until video plays — the black scene bg shows through so the
 * additive text layer renders white text on black (correct gobo: dark=no light, white=light).
 * Webcam fallback is white (multiply-identity) so it's a no-op when camera is inactive.
 */
export function ProjectionSurface({ target, videoRef, isActive }) {
  const stateRef = useRef(null);

  const { scene, camera } = useMemo(() => {
    const whiteTex = new THREE.DataTexture(
      new Uint8Array([255, 255, 255, 255]),
      1, 1,
      THREE.RGBAFormat,
    );
    whiteTex.needsUpdate = true;

    const s = new THREE.Scene();
    s.background = new THREE.Color(0x000000);

    const cam = new THREE.OrthographicCamera(-1, 1, 0.5, -0.5, 0.1, 10);
    cam.position.set(0, 0, 5);

    // Layer 0: mp4 video base — hidden until video is ready so black bg shows through
    const videoMat = new THREE.MeshBasicMaterial({
      map: whiteTex,
      depthTest: false,
      depthWrite: false,
    });
    const videoMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), videoMat);
    videoMesh.renderOrder = 0;
    videoMesh.visible = false; // revealed when VideoTexture is ready
    s.add(videoMesh);

    // Layer 1: text (additive — black bg disappears, white text brightens)
    const textTex = new THREE.CanvasTexture(buildGoboCanvas());
    const textMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 1),
      new THREE.MeshBasicMaterial({
        map: textTex,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        transparent: true,
      }),
    );
    textMesh.renderOrder = 1;
    s.add(textMesh);

    // Layer 2: webcam silhouette shadow (multiply — dims where person is dark)
    const camMat = new THREE.MeshBasicMaterial({
      map: whiteTex,
      blending: THREE.MultiplyBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const camMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), camMat);
    camMesh.renderOrder = 2;
    s.add(camMesh);

    stateRef.current = { videoMat, videoMesh, camMat, whiteTex, videoTex: null, camTex: null };
    return { scene: s, camera: cam };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    stateRef.current?.videoTex?.dispose();
    stateRef.current?.camTex?.dispose();
    stateRef.current?.whiteTex?.dispose();
  }, []);

  // mp4 video — always looping; mesh is shown only once video has a frame
  useEffect(() => {
    const state = stateRef.current;
    const vid = document.createElement("video");
    vid.src = "/video.mp4";
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.crossOrigin = "anonymous";

    const tex = new THREE.VideoTexture(vid);
    tex.minFilter = THREE.LinearFilter;
    state.videoTex = tex;
    state.videoMat.map = tex;
    state.videoMat.needsUpdate = true;

    const onReady = () => {
      state.videoMesh.visible = true;
    };
    vid.addEventListener("playing", onReady);
    vid.play().catch(console.error);

    return () => {
      vid.removeEventListener("playing", onReady);
      vid.pause();
      vid.src = "";
      tex.dispose();
      state.videoTex = null;
      state.videoMesh.visible = false;
      state.videoMat.map = state.whiteTex;
      state.videoMat.needsUpdate = true;
    };
  }, []);

  // Webcam silhouette — active only when camera is enabled
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    if (!isActive || !videoRef?.current) {
      state.camTex?.dispose();
      state.camTex = null;
      state.camMat.map = state.whiteTex;
      state.camMat.needsUpdate = true;
      return;
    }

    const tex = new THREE.VideoTexture(videoRef.current);
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(-1, 1);
    tex.offset.set(1, 0);
    state.camTex = tex;
    state.camMat.map = tex;
    state.camMat.needsUpdate = true;

    return () => {
      tex.dispose();
      state.camTex = null;
      state.camMat.map = state.whiteTex;
      state.camMat.needsUpdate = true;
    };
  }, [isActive, videoRef]);

  useFrame(({ gl }) => {
    const prev = gl.autoClear;
    gl.autoClear = true;
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.autoClear = prev;
  });

  return null;
}
