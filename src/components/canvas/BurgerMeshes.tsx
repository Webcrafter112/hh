'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '@/lib/math';
import {
  bunMap,
  bunRoughness,
  cheeseMap,
  lettuceMap,
  onionMap,
  pattyRoughness,
  pattySideMap,
  pattyTopMap,
  pickleMap,
  tomatoMap,
} from './textures';

// ---------------------------------------------------------------- helpers

/** radial noise displacement so cylinders read as hand-formed food */
function roughenRadial(
  geometry: THREE.BufferGeometry,
  amount: number,
  freq = 7,
  seed = 1
) {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  let maxR = 0;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    maxR = Math.max(maxR, Math.hypot(v.x, v.z));
  }
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 1e-5) continue;
    const a = Math.atan2(v.z, v.x);
    const n =
      Math.sin(a * freq + seed) +
      Math.sin(a * (freq * 1.9) + seed * 2.7) * 0.5 +
      Math.sin(a * (freq * 3.7) + seed * 1.3) * 0.25 +
      Math.sin(v.y * 21 + a * 2) * 0.3;
    const falloff = Math.pow(r / maxR, 3); // keep centers calm
    const k = 1 + n * amount * falloff;
    pos.setX(i, v.x * k);
    pos.setZ(i, v.z * k);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

// ------------------------------------------------------------------- buns

export function BunTop() {
  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.97, 0),
      new THREE.Vector2(1.05, 0.09),
      new THREE.Vector2(1.04, 0.2),
      new THREE.Vector2(0.94, 0.34),
      new THREE.Vector2(0.74, 0.47),
      new THREE.Vector2(0.46, 0.57),
      new THREE.Vector2(0.18, 0.62),
      new THREE.Vector2(0, 0.63),
    ];
    const g = new THREE.LatheGeometry(pts, 128);
    roughenRadial(g, 0.014, 6, 4);
    return g;
  }, []);

  const seeds = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = seeds.current;
    if (!mesh) return;
    const rand = mulberry32(2024);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const scale = new THREE.Vector3();
    for (let i = 0; i < 150; i++) {
      // sample the dome as a squashed sphere, reject the underside
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(1 - rand() * 0.78); // bias to the crown
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      );
      const p = dir.clone().multiplyScalar(1.035);
      p.y = p.y * 0.6 + 0.03;
      const normal = new THREE.Vector3(dir.x, dir.y / 0.6, dir.z).normalize();
      q.setFromUnitVectors(up, normal);
      const yaw = new THREE.Quaternion().setFromAxisAngle(
        normal,
        rand() * Math.PI * 2
      );
      q.premultiply(yaw);
      const s = 0.8 + rand() * 0.45;
      scale.set(s, s * 0.55, s * 1.55);
      m.compose(p, q, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={bunMap()}
          roughnessMap={bunRoughness()}
          roughness={0.62}
          clearcoat={0.34}
          clearcoatRoughness={0.55}
          sheen={0.4}
          sheenColor="#ffdca3"
        />
      </mesh>
      {/* pale crumb underside */}
      <mesh rotation-x={Math.PI / 2} position-y={0.002}>
        <circleGeometry args={[0.97, 96]} />
        <meshStandardMaterial color="#f0d9a8" roughness={0.95} />
      </mesh>
      <instancedMesh ref={seeds} args={[undefined, undefined, 150]} castShadow>
        <sphereGeometry args={[0.027, 10, 8]} />
        <meshPhysicalMaterial
          color="#e9d5a4"
          roughness={0.5}
          clearcoat={0.18}
        />
      </instancedMesh>
    </group>
  );
}

export function BunBottom() {
  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0, -0.16),
      new THREE.Vector2(0.62, -0.16),
      new THREE.Vector2(0.94, -0.14),
      new THREE.Vector2(1.02, -0.05),
      new THREE.Vector2(1.02, 0.07),
      new THREE.Vector2(0.94, 0.14),
      new THREE.Vector2(0.6, 0.16),
      new THREE.Vector2(0, 0.16),
    ];
    const g = new THREE.LatheGeometry(pts, 128);
    roughenRadial(g, 0.012, 8, 9);
    return g;
  }, []);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        map={bunMap()}
        roughnessMap={bunRoughness()}
        roughness={0.66}
        clearcoat={0.24}
        clearcoatRoughness={0.6}
        sheen={0.3}
        sheenColor="#ffdca3"
      />
    </mesh>
  );
}

// ------------------------------------------------------------------ patty

export function Patty({ seed = 1 }: { seed?: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.95, 0.92, 0.24, 128, 6);
    roughenRadial(g, 0.08, 6, seed * 3.1);
    return g;
  }, [seed]);

  // grill marks only on the caps — the ragged side gets plain crust
  const materials = useMemo(() => {
    const side = new THREE.MeshPhysicalMaterial({
      map: pattySideMap(),
      roughnessMap: pattyRoughness(),
      roughness: 0.55,
      clearcoat: 0.4, // grease sheen
      clearcoatRoughness: 0.34,
    });
    const cap = new THREE.MeshPhysicalMaterial({
      map: pattyTopMap(),
      roughnessMap: pattyRoughness(),
      roughness: 0.5,
      clearcoat: 0.45,
      clearcoatRoughness: 0.3,
    });
    return [side, cap, cap];
  }, []);

  return (
    <mesh geometry={geometry} material={materials} castShadow receiveShadow />
  );
}

// ----------------------------------------------------------------- cheese

/**
 * Melted cheddar. `slabRef` + `dripsRef` are animated by the Burger
 * orchestrator (melt = drips grow, slab relaxes outward).
 */
export function Cheese({
  slabRef,
  dripsRef,
  materialRef,
}: {
  slabRef: React.RefObject<THREE.Mesh | null>;
  dripsRef: React.RefObject<THREE.Group | null>;
  materialRef: React.RefObject<THREE.MeshPhysicalMaterial | null>;
}) {
  const geometry = useMemo(() => {
    const half = 0.8;
    const r = 0.16;
    const shape = new THREE.Shape();
    shape.moveTo(-half + r, -half);
    shape.lineTo(half - r, -half);
    shape.absarc(half - r, -half + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(half, half - r);
    shape.absarc(half - r, half - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-half + r, half);
    shape.absarc(-half + r, half - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-half, -half + r);
    shape.absarc(-half + r, -half + r, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.03,
      bevelSegments: 4,
      curveSegments: 24,
    });
    g.rotateX(-Math.PI / 2);
    // drape: corners hanging past the patty sag downward
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const d = Math.hypot(v.x, v.z);
      const over = Math.max(0, d - 0.72);
      pos.setY(i, v.y - Math.pow(over, 1.6) * 0.55);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const drips = useMemo(() => {
    const rand = mulberry32(404);
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + rand() * 0.6;
      const r = 0.78 + rand() * 0.14;
      return {
        pos: [Math.cos(a) * r, -0.1, Math.sin(a) * r] as const,
        len: 0.1 + rand() * 0.17,
        rad: 0.05 + rand() * 0.035,
      };
    });
  }, []);

  return (
    <group>
      <mesh ref={slabRef} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={materialRef}
          map={cheeseMap()}
          color="#ffffff"
          roughness={0.22} // glossy melt
          clearcoat={0.9}
          clearcoatRoughness={0.25}
          sheen={0.3}
          sheenColor="#ffdd88"
        />
      </mesh>
      <group ref={dripsRef}>
        {drips.map((d, i) => (
          <mesh key={i} position={[d.pos[0], d.pos[1], d.pos[2]]} castShadow>
            <capsuleGeometry args={[d.rad, d.len, 6, 12]} />
            <meshPhysicalMaterial
              map={cheeseMap()}
              roughness={0.2}
              clearcoat={0.9}
              clearcoatRoughness={0.22}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- lettuce

export function Lettuce() {
  const geometry = useMemo(() => {
    const g = new THREE.CircleGeometry(1.16, 160, 0, Math.PI * 2);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const r = Math.hypot(v.x, v.z);
      const a = Math.atan2(v.z, v.x);
      const rim = Math.pow(r / 1.16, 2.6);
      const ruffle =
        Math.sin(a * 9 + r * 5) * 0.085 +
        Math.sin(a * 17 + 2.4) * 0.038 +
        Math.sin(a * 5 - r * 7) * 0.05;
      pos.setY(i, v.y + ruffle * rim + Math.sin(r * 9) * 0.012);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const mat = (
    <meshPhysicalMaterial
      map={lettuceMap()}
      roughness={0.38}
      clearcoat={0.55} // moisture
      clearcoatRoughness={0.32}
      sheen={0.3}
      sheenColor="#a8c479"
      side={THREE.DoubleSide}
    />
  );

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        {mat}
      </mesh>
      <mesh
        geometry={geometry}
        rotation-y={2.3}
        position-y={0.05}
        scale={0.94}
        castShadow
      >
        {mat}
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------- tomato

export function Tomato() {
  const materials = useMemo(() => {
    const side = new THREE.MeshPhysicalMaterial({
      color: '#a82a17',
      roughness: 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
    });
    const top = new THREE.MeshPhysicalMaterial({
      map: tomatoMap(),
      roughness: 0.34,
      clearcoat: 0.5,
      clearcoatRoughness: 0.32,
      transmission: 0.08, // fresh translucency
      thickness: 0.3,
      ior: 1.35,
    });
    return [side, top, top];
  }, []);

  return (
    <group>
      <mesh
        material={materials}
        position={[0.14, 0, 0.1]}
        rotation-y={0.4}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.8, 0.8, 0.09, 96]} />
      </mesh>
      <mesh
        material={materials}
        position={[-0.2, 0.1, -0.12]}
        rotation={[0.05, 2.1, -0.03]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.76, 0.76, 0.09, 96]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- pickles

export function Pickles() {
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 48, 2);
    roughenRadial(g, 0.06, 8, 5);
    return g;
  }, []);

  const chips = useMemo(
    () => [
      { pos: [0.42, 0, 0.12] as const, rot: [0.06, 0.5, -0.04] as const },
      { pos: [-0.3, 0.02, 0.34] as const, rot: [-0.05, 1.7, 0.06] as const },
      { pos: [-0.1, 0.01, -0.4] as const, rot: [0.04, 3.4, 0.05] as const },
    ],
    []
  );

  return (
    <group>
      {chips.map((c, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={[c.pos[0], c.pos[1], c.pos[2]]}
          rotation={[c.rot[0], c.rot[1], c.rot[2]]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            map={pickleMap()}
            roughness={0.24}
            clearcoat={0.85} // briny gloss
            clearcoatRoughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------- onions

export function Onions() {
  const strands = useMemo(() => {
    const rand = mulberry32(88);
    return Array.from({ length: 5 }, () => ({
      pos: [(rand() - 0.5) * 0.9, (rand() - 0.5) * 0.05, (rand() - 0.5) * 0.9] as const,
      rot: [Math.PI / 2 + (rand() - 0.5) * 0.5, 0, rand() * Math.PI * 2] as const,
      arc: 2.6 + rand() * 2.4,
      radius: 0.24 + rand() * 0.14,
    }));
  }, []);

  return (
    <group>
      {strands.map((s, i) => (
        <mesh
          key={i}
          position={[s.pos[0], s.pos[1], s.pos[2]]}
          rotation={[s.rot[0], s.rot[1], s.rot[2]]}
          castShadow
        >
          <torusGeometry args={[s.radius, 0.05, 10, 40, s.arc]} />
          <meshPhysicalMaterial
            map={onionMap()}
            roughness={0.3}
            clearcoat={0.7}
            clearcoatRoughness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------ sauce

export const SAUCE_BLOBS = [
  { home: [0.62, 0, 0.18], r: 0.15 },
  { home: [-0.5, 0, 0.42], r: 0.12 },
  { home: [0.1, 0, -0.62], r: 0.14 },
  { home: [-0.62, 0, -0.2], r: 0.1 },
  { home: [0.42, 0, -0.4], r: 0.11 },
  { home: [-0.14, 0, 0.6], r: 0.13 },
  { home: [0.05, 0.02, 0.05], r: 0.16 },
] as const;

export function Sauce({
  blobsRef,
  materialRef,
}: {
  blobsRef: React.RefObject<(THREE.Mesh | null)[]>;
  materialRef: React.RefObject<THREE.MeshPhysicalMaterial | null>;
}) {
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#e85c17',
        roughness: 0.32,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
        emissive: '#ff5400',
        emissiveIntensity: 0,
      }),
    []
  );

  useLayoutEffect(() => {
    materialRef.current = material;
  }, [material, materialRef]);

  return (
    <group>
      {SAUCE_BLOBS.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            blobsRef.current[i] = el;
          }}
          material={material}
          castShadow
        >
          <sphereGeometry args={[b.r, 24, 18]} />
        </mesh>
      ))}
    </group>
  );
}
