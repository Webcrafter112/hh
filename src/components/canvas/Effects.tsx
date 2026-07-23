'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Vignette,
} from '@react-three/postprocessing';

export default function Effects({ mobile }: { mobile: boolean }) {
  const focus = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.32}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.28}
        radius={0.7}
      />
      {mobile ? (
        <></>
      ) : (
        <DepthOfField
          target={focus}
          focalLength={0.018}
          bokehScale={2.1}
          height={520}
        />
      )}
      <Vignette eskil={false} offset={0.24} darkness={0.78} />
    </EffectComposer>
  );
}
