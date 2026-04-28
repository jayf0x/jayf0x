/// <reference types="vite/client" />

// React 19 removed global JSX namespace; re-augment React.JSX with R3F Three elements.
import type { ThreeElements } from "@react-three/fiber"

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
