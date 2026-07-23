'use client';

import { useFrame } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { world } from '@/lib/store';
import { damp } from '@/lib/math';
import Stage from './Stage';
import Burger from './Burger';
import CameraRig from './CameraRig';
import Effects from './Effects';
import { Crumbs, Dust, Smoke } from './Particles';

/** Smooths raw scroll/pointer into world state. Mounted FIRST so its
 *  useFrame runs before every consumer in the same frame. */
function WorldTicker() {
  useFrame((_, dt) => {
    world.ready = true; // a real frame is rendering
    world.scroll = damp(world.scroll, world.scrollTarget, 6, dt);
    world.pointer.x = damp(world.pointer.x, world.pointerTarget.x, 4, dt);
    world.pointer.y = damp(world.pointer.y, world.pointerTarget.y, 4, dt);
  });
  return null;
}

export default function Scene({ mobile }: { mobile: boolean }) {
  return (
    <>
      <WorldTicker />
      <CameraRig />
      <Stage mobile={mobile} />
      <Burger />
      <Smoke mobile={mobile} />
      <Dust mobile={mobile} />
      <Crumbs mobile={mobile} />
      <Effects mobile={mobile} />
      <AdaptiveDpr />
    </>
  );
}
