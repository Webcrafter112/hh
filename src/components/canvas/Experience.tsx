'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { world } from '@/lib/store';
import Scene from './Scene';

export default function Experience() {
  // decided once on the client, before first canvas render
  const [mobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth < 820)
  );

  return (
    <div className="webgl" aria-hidden>
      <Canvas
        shadows
        dpr={mobile ? [1, 1.5] : [1, 2]}
        camera={{ fov: 38, position: [3.1, 2.1, 6.7], near: 0.1, far: 60 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onCreated={() => {
          world.ready = true;
        }}
      >
        <Scene mobile={mobile} />
      </Canvas>
    </div>
  );
}
