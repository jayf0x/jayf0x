/// <reference types="vite/client" />

// React 19 removed global JSX namespace — re-augment React.JSX with R3F Three elements.
// Using the webgpu entry since GraphScene imports Canvas from there.
import type { ThreeElements } from "@react-three/fiber/webgpu"

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
