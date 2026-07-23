// Shared mutable world state — written by DOM (scroll/pointer), read per-frame
// inside the R3F loop. Kept outside React state to avoid re-render churn.
export const world = {
  /** smoothed scroll progress 0..1 (whole page) */
  scroll: 0,
  /** raw scroll target from Lenis */
  scrollTarget: 0,
  /** scroll velocity (normalized-ish) */
  velocity: 0,
  /** smoothed pointer, -1..1 */
  pointer: { x: 0, y: 0 },
  pointerTarget: { x: 0, y: 0 },
  reducedMotion: false,
  isMobile: false,
  /** set true once the canvas has rendered its first frame */
  ready: false,
};
