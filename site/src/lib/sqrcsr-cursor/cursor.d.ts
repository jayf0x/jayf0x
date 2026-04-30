export interface SquareCursorOptions {
  columns?: number;
  ttl?: number; // milliseconds
  colors?: string[];
}

export class SquareCursorCore {
  constructor(rootEl: HTMLElement, options?: SquareCursorOptions);
  destroy(): void;
}

export default function SquareCursor(
  root: HTMLElement,
  options?: SquareCursorOptions
): SquareCursorCore;
