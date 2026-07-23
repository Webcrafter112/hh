'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  SpotLight,
} from '@react-three/drei';
import { world } from '@/lib/store';
import { damp } from '@/lib/math';

export default function Stage({ mobile }: { mobile: boolean }) {
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0.9, 0);
    return o;
  }, []);

  // lighting breathes with the cursor
  useFrame((_, dt) => {
    const px = world.pointer.x;
    const py = world.pointer.y;
    if (key.current) {
      key.current.position.x = damp(key.current.position.x, 0.7 + px * 1.4, 3, dt);
      key.current.position.z = damp(key.current.position.z, 0.6 + py * 0.8, 3, dt);
      key.current.intensity = damp(
        key.current.intensity,
        235 * (1 + px * 0.12),
        3,
        dt
      );
    }
    if (rim.current) {
      rim.current.intensity = damp(
        rim.current.intensity,
        46 * (1 - px * 0.25),
        3,
        dt
      );
    }
  });

  return (
    <>
      <color attach="background" args={['#0E0E0E']} />
      <fog attach="fog" args={['#0a0a0a', 9, 22]} />

      {/* procedural HDRI — warm studio softbox + ember rim, zero fetches */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#ffe3c0"
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[9, 9, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#ff8a00"
          position={[-6, 2, -5]}
          rotation-y={Math.PI / 3}
          scale={[6, 2.4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#4a5a78"
          position={[6, 1.4, 4]}
          rotation-y={-Math.PI / 2.6}
          scale={[5, 2, 1]}
        />
        <Lightformer
          form="circle"
          intensity={0.7}
          color="#ffc857"
          position={[3.5, 4.5, -3]}
          scale={2.4}
        />
      </Environment>

      {/* key light + soft shadows */}
      <primitive object={target} />
      <spotLight
        ref={key}
        position={[0.7, 6.4, 0.6]}
        angle={0.55}
        penumbra={0.85}
        intensity={235}
        color="#ffe3c2"
        castShadow
        shadow-mapSize-width={mobile ? 512 : 1024}
        shadow-mapSize-height={mobile ? 512 : 1024}
        shadow-bias={-0.0004}
        shadow-radius={6}
        target={target}
      />

      {/* volumetric cone from above — the "spotlight through smoke" beam */}
      {!mobile && (
        <SpotLight
          position={[0.4, 6.2, 0.3]}
          target={target}
          distance={7.5}
          angle={0.42}
          attenuation={6}
          anglePower={5}
          radiusTop={0.24}
          color="#ffc98f"
          opacity={0.28}
          castShadow={false}
        />
      )}

      {/* warm ember rim from behind */}
      <pointLight
        ref={rim}
        position={[-3.6, 2.4, -4.2]}
        intensity={46}
        distance={16}
        decay={2}
        color="#ff8a00"
      />
      <pointLight
        position={[4.2, 0.9, -3.4]}
        intensity={18}
        distance={12}
        decay={2}
        color="#ffc857"
      />
      <ambientLight intensity={0.18} color="#2a2038" />

      {/* glossy charcoal table — real-time planar reflections */}
      <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow>
        <circleGeometry args={[18, 72]} />
        <MeshReflectorMaterial
          resolution={mobile ? 256 : 1024}
          mirror={0.32}
          mixBlur={7}
          mixStrength={1.25}
          blur={[300, 140]}
          depthScale={0}
          roughness={0.85}
          metalness={0.3}
          color="#0b0b0b"
        />
      </mesh>

      <ContactShadows
        position={[0, 0.012, 0]}
        opacity={0.72}
        scale={9}
        blur={2.8}
        far={3.4}
        resolution={mobile ? 256 : 512}
        color="#000000"
      />
    </>
  );
}
