export interface ProjectionScene {
  dispose: () => void;
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

export function collectDocumentCss(): Promise<string>;

export function createProjectionScene(
  options: CreateProjectionSceneOptions,
): Promise<ProjectionScene>;
