'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '@/lib/store';
import { PHASE } from '@/lib/config';
import { clamp, easeInOutCubic, mulberry32, remap } from '@/lib/math';
import { dustSprite, smokeSprite } from './textures';

// ------------------------------------------------------------------ smoke

export function Smoke({ mobile }: { mobile: boolean }) {
  const count = mobile ? 5 : 10;
  const group = useRef<THREE.Group>(null);

  const puffs = useMemo(() => {
    const rand = mulberry32(555);
    return Array.from({ length: count }, () => ({
      x: (rand() - 0.5) * 11,
      y: 1.2 + rand() * 4,
      z: -4.5 - rand() * 3,
      scale: 2.6 + rand() * 3.4,
      speed: 0.08 + rand() * 0.12,
      spin: (rand() - 0.5) * 0.05,
      opacity: 0.04 + rand() * 0.05,
      phase: rand() * Math.PI * 2,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i] as THREE.Mesh;
      const p = puffs[i];
      const y = 1.2 + ((p.y - 1.2 + t * p.speed) % 5);
      m.position.set(p.x + Math.sin(t * 0.1 + p.phase) * 0.7, y, p.z);
      m.rotation.z = p.phase + t * p.spin;
      const mat = m.material as THREE.MeshBasicMaterial;
      // fade in low, fade out high
      mat.opacity = p.opacity * Math.sin(((y - 1.2) / 5) * Math.PI);
    }
  });

  const tex = smokeSprite();
  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <mesh key={i} scale={p.scale}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={p.opacity}
            depthWrite={false}
            fog={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------- dust

export function Dust({ mobile }: { mobile: boolean }) {
  const count = mobile ? 90 : 240;
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const rand = mulberry32(808);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2 + rand() * 6;
      const a = rand() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = rand() * 5.2;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    const p = points.current;
    if (!p) return;
    p.rotation.y = clock.elapsedTime * 0.014;
    p.position.y = Math.sin(clock.elapsedTime * 0.18) * 0.14;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        map={dustSprite()}
        size={0.038}
        sizeAttenuation
        transparent
        opacity={0.22}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#ffca8a"
      />
    </points>
  );
}

// ---------------------------------------------------- crumbs & char flecks

export function Crumbs({ mobile }: { mobile: boolean }) {
  const count = mobile ? 24 : 52;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const flecks = useMemo(() => {
    const rand = mulberry32(272);
    return Array.from({ length: count }, () => ({
      radius: 1.3 + rand() * 1.6,
      angle: rand() * Math.PI * 2,
      y: 0.2 + rand() * 2.6,
      orbit: (rand() - 0.5) * 0.14,
      bob: 0.4 + rand() * 0.8,
      phase: rand() * Math.PI * 2,
      scale: 0.5 + rand() * 1,
      spin: rand() * Math.PI * 2,
    }));
  }, [count]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const rand = mulberry32(99);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(rand() > 0.55 ? '#caa15c' : rand() > 0.4 ? '#5a3a1d' : '#8a6535');
      m.setColorAt(i, c);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const P = world.scroll;
    // crumbs live while things are airborne, retreat once assembled
    const a = easeInOutCubic(remap(P, PHASE.assembleStart, PHASE.assembleEnd));
    const e = easeInOutCubic(remap(P, PHASE.explodeStart, PHASE.explodeApex));
    const rv = easeInOutCubic(remap(P, PHASE.explodeApex, PHASE.reassembleEnd));
    const presence = clamp(Math.max(1 - a, e * (1 - rv)) + 0.06);

    for (let i = 0; i < count; i++) {
      const f = flecks[i];
      const angle = f.angle + t * f.orbit;
      dummy.position.set(
        Math.cos(angle) * f.radius * (0.7 + presence * 0.5),
        f.y + Math.sin(t * f.bob + f.phase) * 0.22,
        Math.sin(angle) * f.radius * (0.7 + presence * 0.5)
      );
      dummy.rotation.set(f.spin + t * 0.4, f.spin * 2 + t * 0.3, f.spin);
      dummy.scale.setScalar(0.02 * f.scale * (0.25 + presence));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.85} />
    </instancedMesh>
  );
}
