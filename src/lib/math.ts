export const clamp = (v: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, v));

/** remap v from [a,b] to [0,1], clamped */
export const remap = (v: number, a: number, b: number) =>
  clamp((v - a) / (b - a));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const easeInCubic = (t: number) => t * t * t;

export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export const smootherstep = (t: number) =>
  t * t * t * (t * (t * 6 - 15) + 10);

/** frame-rate independent exponential damping */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/** deterministic PRNG so the composition is stable between reloads */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** damped oscillation used for the settle "squash & spring" — 0 at t<=0, decays to 0 */
export function springPulse(t: number, frequency = 11, decay = 5.5) {
  if (t <= 0) return 0;
  return Math.exp(-decay * t) * Math.sin(frequency * t);
}
