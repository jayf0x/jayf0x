export interface ProjectionScene {
  dispose: () => void;
}

export interface CreateProjectionSceneOptions {
  pageElement: HTMLElement;
  modelUrl: string;
  cssString?: string | null;
}

export function collectDocumentCss(): Promise<string>;

export function createProjectionScene(
  options: CreateProjectionSceneOptions,
): Promise<ProjectionScene>;
