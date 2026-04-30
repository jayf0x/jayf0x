import { SquareCursorCore, type SquareCursorOptions } from "./cursor.js";

export default function SquareCursor(
  root: HTMLElement,
  options: SquareCursorOptions,
) {
  root.classList.add("sqrcsr-cursor");
  const instance = new SquareCursorCore(root, options);
  return instance;
}
