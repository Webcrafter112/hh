// ---------------------------------------------------------------------------
// Scroll choreography — the whole page maps to progress P in [0,1].
// Section 1  : floating ingredients only
// Section 2-3: assembly
// Section 4  : assembled + camera zoom
// Section 5  : showcase turntable + typography
// Section 6  : slow-motion explosion → reassembly into the second variation
// ---------------------------------------------------------------------------
export const PHASE = {
  assembleStart: 0.12,
  assembleAlmost: 0.36, // "almost complete" beat (section 3)
  assembleEnd: 0.5, // fully assembled + settle spring
  zoomStart: 0.53,
  zoomEnd: 0.66,
  showcaseStart: 0.67,
  showcaseEnd: 0.8,
  explodeStart: 0.83,
  explodeApex: 0.905, // fully apart, slow-motion apex
  reassembleEnd: 0.985,
} as const;

export const PALETTE = {
  ink: '#0E0E0E',
  paper: '#F5F5F5',
  ember: '#FF8A00',
  gold: '#FFC857',
} as const;

export type Vec3 = [number, number, number];

export interface IngredientDef {
  id: string;
  /** landing order, bottom of the stack lands first */
  rank: number;
  /** assembled position — variation A (The Ember Classic) */
  posA: Vec3;
  /** assembled position — variation B (The Ember Royale) */
  posB: Vec3;
  /** resting yaw so the stack doesn't look machine-aligned */
  restYaw: number;
  /** exploded float position (seeded offsets are added on top) */
  floatPos: Vec3;
  /** how strongly the cursor drags this layer (depth illusion) */
  pointerDepth: number;
}

// Stack (bottom → top): bottom bun, sauce, onions, patty x2, cheese,
// pickles, tomato, lettuce, top bun. Variation B re-plates it California
// style — lettuce under the patties, tomato riding above the cheese.
export const INGREDIENTS: IngredientDef[] = [
  {
    id: 'bunBottom',
    rank: 0,
    posA: [0, 0.16, 0],
    posB: [0, 0.16, 0],
    restYaw: 0.0,
    floatPos: [0.18, 0.5, 0.1],
    pointerDepth: 0.05,
  },
  {
    id: 'sauce',
    // lands after the patties so the droplets visibly fall onto the meat
    rank: 4,
    posA: [0, 0.36, 0],
    posB: [0, 0.36, 0],
    restYaw: 0.4,
    floatPos: [-0.3, 2.45, -0.25],
    pointerDepth: 0.16,
  },
  {
    id: 'onions',
    rank: 1,
    posA: [0, 0.42, 0],
    posB: [0, 0.42, 0],
    restYaw: 1.2,
    floatPos: [0.35, 1.0, 0.2],
    pointerDepth: 0.12,
  },
  {
    id: 'lettuce',
    rank: 8,
    posA: [0, 1.34, 0],
    posB: [0, 0.52, 0], // variation B: under the meat
    restYaw: 0.25,
    floatPos: [-0.4, 4.25, 0.3],
    pointerDepth: 0.14,
  },
  {
    id: 'patty1',
    rank: 2,
    posA: [0, 0.58, 0],
    posB: [0, 0.72, 0],
    restYaw: 0.8,
    floatPos: [0.3, 1.5, -0.3],
    pointerDepth: 0.07,
  },
  {
    id: 'patty2',
    rank: 3,
    posA: [0, 0.84, 0],
    posB: [0, 0.98, 0],
    restYaw: 2.1,
    floatPos: [-0.35, 2.0, 0.15],
    pointerDepth: 0.08,
  },
  {
    id: 'cheese',
    rank: 5,
    posA: [0, 1.0, 0],
    posB: [0, 1.14, 0],
    restYaw: Math.PI / 4,
    floatPos: [0.4, 2.9, -0.2],
    pointerDepth: 0.11,
  },
  {
    id: 'pickles',
    rank: 6,
    posA: [0, 1.1, 0],
    posB: [0, 1.24, 0],
    restYaw: 0.6,
    floatPos: [-0.25, 3.35, -0.35],
    pointerDepth: 0.15,
  },
  {
    id: 'tomato',
    rank: 7,
    posA: [0, 1.2, 0],
    posB: [0, 1.36, 0],
    restYaw: 1.6,
    floatPos: [0.3, 3.8, 0.25],
    pointerDepth: 0.1,
  },
  {
    id: 'bunTop',
    rank: 9,
    posA: [0, 1.52, 0],
    posB: [0, 1.62, 0],
    restYaw: 0.1,
    floatPos: [-0.15, 4.75, -0.1],
    pointerDepth: 0.06,
  },
];

/** per-ingredient assembly window inside global assembly progress a∈[0,1] */
export const STAGGER = 0.052;
export const LAND_DURATION = 1 - 9 * STAGGER; // last ingredient still finishes at a=1
