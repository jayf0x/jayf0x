import type {
  AnimationClip,
  Mesh,
  MeshStandardMaterial,
  Object3DEventMap,
  PerspectiveCamera,
  Scene,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface ProjectionScene {
  dispose: () => void;
  camera: PerspectiveCamera;
  scene: Scene<Object3DEventMap>;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CreateProjectionSceneOptions {
  pageElement: HTMLElement;
  modelUrl: string;
  container?: HTMLElement;
  cssString?: string | null;
  // model transform
  modelScale?: number;
  modelFitSize?: number;
  modelPosition?: Vec3;
  modelRotation?: Vec3;
  // camera
  cameraFov?: number;
  cameraPosition?: Vec3;
  cameraLookAt?: Vec3;
}

interface GLTFAction extends AnimationClip {
  name: string;
}

export type GLTFResult = GLTF & {
  nodes: {
    g_12140_Skull_v3_jaw: Mesh;
  };
  materials: {
    ["12140_Skull_v3"]: MeshStandardMaterial;
  };
  animations: GLTFAction[];
};
