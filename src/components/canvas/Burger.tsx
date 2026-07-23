'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '@/lib/store';
import {
  INGREDIENTS,
  LAND_DURATION,
  PHASE,
  STAGGER,
} from '@/lib/config';
import {
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  mulberry32,
  remap,
  springPulse,
} from '@/lib/math';
import {
  BunBottom,
  BunTop,
  Cheese,
  Lettuce,
  Onions,
  Patty,
  Pickles,
  Sauce,
  SAUCE_BLOBS,
  Tomato,
} from './BurgerMeshes';

interface Seeded {
  jitter: THREE.Vector3;
  baseRot: THREE.Euler;
  freq: THREE.Vector3;
  phase: THREE.Vector3;
  wobble: number;
  burstDir: THREE.Vector3;
  burstDist: number;
  tumble: THREE.Vector3;
  delay: number;
  squashiness: number;
}

const SQUASH: Record<string, number> = {
  bunTop: 1,
  bunBottom: 0.7,
  patty1: 0.5,
  patty2: 0.5,
  cheese: 0.35,
  lettuce: 0.4,
  tomato: 0.3,
  pickles: 0.3,
  onions: 0.3,
  sauce: 0,
};

// scratch objects — no per-frame allocation
const vFloat = new THREE.Vector3();
const vPos = new THREE.Vector3();
const vTmp = new THREE.Vector3();
const CHEDDAR = new THREE.Color('#ffffff');
const GOUDA = new THREE.Color('#c8874a'); // variation B: smoked gouda tint
const SAUCE_A = new THREE.Color('#ff6a1f');
const SAUCE_B = new THREE.Color('#ffc857'); // variation B: golden sauce

export default function Burger() {
  const rootRef = useRef<THREE.Group>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const cheeseSlab = useRef<THREE.Mesh>(null);
  const cheeseDrips = useRef<THREE.Group>(null);
  const cheeseMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const sauceBlobs = useRef<(THREE.Mesh | null)[]>([]);
  const sauceMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const turntable = useRef(0);

  const seeds = useMemo<Seeded[]>(() => {
    const rand = mulberry32(1337);
    return INGREDIENTS.map((def) => {
      const dir = new THREE.Vector3(
        rand() * 2 - 1,
        (rand() * 2 - 1) * 0.5 + (def.posA[1] > 0.9 ? 0.45 : -0.1),
        rand() * 2 - 1
      ).normalize();
      return {
        jitter: new THREE.Vector3(
          (rand() * 2 - 1) * 0.5,
          (rand() * 2 - 1) * 0.22,
          (rand() * 2 - 1) * 0.5
        ),
        baseRot: new THREE.Euler(
          (rand() * 2 - 1) * 0.55,
          rand() * Math.PI * 2,
          (rand() * 2 - 1) * 0.45
        ),
        freq: new THREE.Vector3(
          0.5 + rand() * 0.5,
          0.35 + rand() * 0.45,
          0.55 + rand() * 0.5
        ),
        phase: new THREE.Vector3(
          rand() * Math.PI * 2,
          rand() * Math.PI * 2,
          rand() * Math.PI * 2
        ),
        wobble: 0.35 + rand() * 0.4,
        burstDir: dir,
        burstDist: 2.4 + rand() * 1.4,
        tumble: new THREE.Vector3(
          (rand() * 2 - 1) * 2.4,
          (rand() * 2 - 1) * 3.2,
          (rand() * 2 - 1) * 2.4
        ),
        delay: rand() * 0.16,
        squashiness: SQUASH[def.id] ?? 0.4,
      };
    });
  }, []);

  const blobSeeds = useMemo(() => {
    const rand = mulberry32(9001);
    return SAUCE_BLOBS.map((_, i) => ({
      scatter: new THREE.Vector3(
        (rand() * 2 - 1) * 0.55,
        (rand() * 2 - 1) * 0.45,
        (rand() * 2 - 1) * 0.55
      ),
      freq: 0.5 + rand() * 0.7,
      phase: rand() * Math.PI * 2,
      delay: i * 0.09,
    }));
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const P = world.scroll;
    const drift = world.reducedMotion ? 0.2 : 1;

    // ---------------------------------------------------- phase progress
    const a = easeInOutCubic(remap(P, PHASE.assembleStart, PHASE.assembleEnd));
    const e = easeInOutCubic(remap(P, PHASE.explodeStart, PHASE.explodeApex));
    const rv = easeInOutCubic(remap(P, PHASE.explodeApex, PHASE.reassembleEnd));
    const explodeWeight = e * (1 - rv);
    const showcase = remap(P, PHASE.showcaseStart, PHASE.showcaseEnd);
    const variantMix = easeInOutCubic(rv);

    // ------------------------------------------------------- whole stack
    const root = rootRef.current;
    if (root) {
      // settle squash & spring the moment assembly completes
      const settle = springPulse((P - PHASE.assembleEnd) * 4.2);
      const settleB = springPulse((P - PHASE.reassembleEnd) * 4.2);
      const s = (settle + settleB) * 0.9;
      root.scale.set(1 + 0.05 * s, 1 - 0.075 * s, 1 + 0.05 * s);

      // slow turntable once assembled (sections 4–5), frozen mid-explosion
      const assembledWeight = a * (1 - explodeWeight);
      turntable.current += dt * 0.16 * assembledWeight * drift;
      root.rotation.y =
        turntable.current + easeInOutCubic(clamp(showcase)) * Math.PI * 0.85;
      root.position.y = -0.05;
    }

    // ------------------------------------------------- each ingredient
    for (let i = 0; i < INGREDIENTS.length; i++) {
      const def = INGREDIENTS[i];
      const g = groupRefs.current[i];
      if (!g) continue;
      const sd = seeds[i];

      const ai = easeInOutCubic(
        clamp((a - def.rank * STAGGER) / LAND_DURATION)
      );
      const ei = easeInOutCubic(clamp((e - sd.delay) / (1 - 0.16)));
      const rvi = easeInOutCubic(clamp((rv - sd.delay * 0.6) / (1 - 0.1)));
      const ew = ei * (1 - rvi);
      const floatWeight = Math.max(1 - ai, ew * 0.65);

      // position: float cloud -> assembled A -> radial burst -> assembled B
      vFloat.set(
        def.floatPos[0] + sd.jitter.x,
        def.floatPos[1] + sd.jitter.y,
        def.floatPos[2] + sd.jitter.z
      );
      vPos.set(def.posA[0], def.posA[1], def.posA[2]);
      vFloat.lerp(vPos, ai);

      vTmp
        .copy(sd.burstDir)
        .multiplyScalar(sd.burstDist)
        .add(vPos);
      vFloat.lerp(vTmp, ei);

      vTmp.set(def.posB[0], def.posB[1], def.posB[2]);
      vFloat.lerp(vTmp, rvi);

      // independent idle drift (subtle pseudo-physics)
      const amp = 0.09 * floatWeight * drift;
      vFloat.x += Math.sin(t * sd.freq.x + sd.phase.x) * amp;
      vFloat.y += Math.sin(t * sd.freq.y + sd.phase.y) * amp * 1.35;
      vFloat.z += Math.sin(t * sd.freq.z + sd.phase.z) * amp;

      // cursor influence — deeper layers drag more while airborne
      const px = world.pointer.x;
      const py = world.pointer.y;
      const drag = def.pointerDepth * (0.9 * floatWeight + 0.1);
      vFloat.x += px * drag;
      vFloat.y += -py * drag * 0.6;

      g.position.copy(vFloat);

      // rotation: bounded float wobble -> aligned rest yaw (+ burst tumble)
      const fw = floatWeight;
      g.rotation.x =
        sd.baseRot.x * fw +
        Math.sin(t * sd.freq.x * 0.8 + sd.phase.x) * 0.16 * fw * drift +
        sd.tumble.x * ew;
      g.rotation.z =
        sd.baseRot.z * fw +
        Math.sin(t * sd.freq.z * 0.7 + sd.phase.z) * 0.14 * fw * drift +
        sd.tumble.z * ew;
      g.rotation.y =
        def.restYaw +
        (sd.baseRot.y - def.restYaw) * fw +
        Math.sin(t * sd.wobble + sd.phase.y) * 0.35 * fw * drift +
        sd.tumble.y * ew;

      // landing squash (impact) — recovers by the time ai reaches 1
      const sq =
        Math.sin(Math.PI * clamp((ai - 0.78) / 0.22)) * sd.squashiness;
      const land = Math.max(
        sq,
        Math.sin(Math.PI * clamp((rvi - 0.78) / 0.22)) * sd.squashiness
      );
      g.scale.set(1 + land * 0.09, 1 - land * 0.16, 1 + land * 0.09);
    }

    // ------------------------------------------------------ cheese melt
    const cheeseIdx = INGREDIENTS.findIndex((d) => d.id === 'cheese');
    const cheeseDef = INGREDIENTS[cheeseIdx];
    const cheeseAi = easeInOutCubic(
      clamp((a - cheeseDef.rank * STAGGER) / LAND_DURATION)
    );
    const meltA = easeOutCubic(remap(cheeseAi, 0.7, 1));
    const meltB = easeOutCubic(remap(rv, 0.7, 1));
    const melt = Math.max(meltA * (1 - explodeWeight), meltB);
    if (cheeseSlab.current) {
      cheeseSlab.current.scale.set(
        0.88 + 0.15 * melt,
        1.35 - 0.35 * melt,
        0.88 + 0.15 * melt
      );
    }
    if (cheeseDrips.current) {
      cheeseDrips.current.scale.set(
        0.7 + 0.3 * melt,
        Math.max(0.08, melt),
        0.7 + 0.3 * melt
      );
      cheeseDrips.current.visible = melt > 0.02;
    }
    if (cheeseMat.current) {
      cheeseMat.current.color.copy(CHEDDAR).lerp(GOUDA, variantMix);
    }

    // -------------------------------------------- sauce droplets falling
    const sauceIdx = INGREDIENTS.findIndex((d) => d.id === 'sauce');
    const sauceDef = INGREDIENTS[sauceIdx];
    const sauceA = clamp(
      (a - sauceDef.rank * STAGGER) / LAND_DURATION
    );
    if (sauceMat.current) {
      sauceMat.current.color.copy(SAUCE_A).lerp(SAUCE_B, variantMix);
      sauceMat.current.emissiveIntensity = 0.05 * variantMix;
    }
    for (let i = 0; i < SAUCE_BLOBS.length; i++) {
      const blob = sauceBlobs.current[i];
      if (!blob) continue;
      const bs = blobSeeds[i];
      const bp = clamp((sauceA - bs.delay) / (1 - bs.delay * 2));
      const drop = easeInCubic(bp); // accelerating fall
      const spreadT = easeOutCubic(bp);
      const home = SAUCE_BLOBS[i].home;
      blob.position.set(
        bs.scatter.x + (home[0] - bs.scatter.x) * spreadT +
          Math.sin(t * bs.freq + bs.phase) * 0.05 * (1 - bp),
        bs.scatter.y + 1.1 * (1 - drop) * (1 - bp * 0.4) +
          (home[1] - bs.scatter.y) * drop,
        bs.scatter.z + (home[2] - bs.scatter.z) * spreadT +
          Math.cos(t * bs.freq + bs.phase) * 0.05 * (1 - bp)
      );
      // droplet flattens into a smear on impact
      const splat = easeOutCubic(remap(bp, 0.82, 1));
      blob.scale.set(1 + splat * 0.55, 1 - splat * 0.52, 1 + splat * 0.55);
    }
  });

  const renderIngredient = (id: string) => {
    switch (id) {
      case 'bunTop':
        return <BunTop />;
      case 'bunBottom':
        return <BunBottom />;
      case 'patty1':
        return <Patty seed={1} />;
      case 'patty2':
        return <Patty seed={2} />;
      case 'cheese':
        return (
          <Cheese
            slabRef={cheeseSlab}
            dripsRef={cheeseDrips}
            materialRef={cheeseMat}
          />
        );
      case 'lettuce':
        return <Lettuce />;
      case 'tomato':
        return <Tomato />;
      case 'pickles':
        return <Pickles />;
      case 'onions':
        return <Onions />;
      case 'sauce':
        return <Sauce blobsRef={sauceBlobs} materialRef={sauceMat} />;
      default:
        return null;
    }
  };

  return (
    <group ref={rootRef}>
      {INGREDIENTS.map((def, i) => (
        <group
          key={def.id}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          {renderIngredient(def.id)}
        </group>
      ))}
    </group>
  );
}
