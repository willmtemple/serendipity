// Defines a grid for elements in the editor.

import { Rect } from "../hooks/measure";

const SVG_QUANTUM = 0.005;

export function roundQuantum(n: number): number {
  return Math.ceil(n / SVG_QUANTUM) * SVG_QUANTUM;
}

export function alignRect(r: Rect): Rect {
  for (const k of Object.keys(r) as (keyof Rect)[]) {
    r[k] = roundQuantum(r[k]);
  }

  return r;
}
