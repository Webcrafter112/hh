'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { easing } from 'maath';
import { world } from '@/lib/store';
import { PHASE } from '@/lib/config';
import { damp, remap, smootherstep } from '@/lib/math';

const target = new THREE.Vector3();

/**
 * One continuous camera path over the whole scroll — orbit, dolly-in,
 * showcase hold, pull-back for the explosion — plus handheld micro-motion
 * and cursor parallax. Everything runs through critically-damped smoothing,
 * so there are no jumps even when the user flicks the scrollbar.
 */
export default function CameraRig() {
  const look = useRef(new THREE.Vector3(0, 1.4, 0));
  const shake = useMemo(() => ({ t: 0 }), []);

  useFrame((state, dt) => {
    const P = world.scroll;
    const t = state.clock.elapsedTime;
    const handheld = world.reducedMotion ? 0 : 1;

    // orbit angle — one slow sweep across the whole page
    const theta = 0.42 + P * Math.PI * 1.62;

    // radius: 8.1 → (zoom) 4.8 → (explode pull-back) 7.8 → (finale) 5.6
    let radius = 8.1 + (world.isMobile ? 1.4 : 0);
    radius += (7.0 - 8.1) * smootherstep(remap(P, PHASE.assembleStart, PHASE.assembleEnd));
    radius += (4.8 - 7.0) * smootherstep(remap(P, PHASE.zoomStart, PHASE.zoomEnd));
    radius += (7.8 - 4.8) * smootherstep(remap(P, PHASE.explodeStart, PHASE.explodeApex));
    radius += (5.6 - 7.8) * smootherstep(remap(P, PHASE.explodeApex + 0.015, PHASE.reassembleEnd));

    // camera height eases down as the stack lands, lifts for the burst
    let height = 2.9;
    height += (1.35 - 2.9) * smootherstep(remap(P, PHASE.assembleStart, PHASE.assembleEnd));
    height += (1.05 - 1.35) * smootherstep(remap(P, PHASE.zoomStart, PHASE.zoomEnd));
    height += (2.3 - 1.05) * smootherstep(remap(P, PHASE.explodeStart, PHASE.explodeApex));
    height += (1.35 - 2.3) * smootherstep(remap(P, PHASE.explodeApex + 0.015, PHASE.reassembleEnd));

    // focus point: center of the floating cloud → center of the burger
    let lookY = 2.45;
    lookY += (0.92 - 2.45) * smootherstep(remap(P, PHASE.assembleStart, PHASE.assembleEnd));
    lookY += (1.35 - 0.92) * smootherstep(remap(P, PHASE.explodeStart, PHASE.explodeApex));
    lookY += (0.98 - 1.35) * smootherstep(remap(P, PHASE.explodeApex + 0.015, PHASE.reassembleEnd));

    // tiny handheld drift — layered sine, never repeats visibly
    shake.t += dt;
    const st = shake.t;
    const hx = (Math.sin(st * 0.57) * 0.05 + Math.sin(st * 1.31 + 2) * 0.016) * handheld;
    const hy = (Math.sin(st * 0.47 + 1) * 0.038 + Math.sin(st * 1.73) * 0.012) * handheld;

    // cursor parallax
    const px = world.pointer.x;
    const py = world.pointer.y;

    target.set(
      Math.sin(theta) * radius + hx + px * 0.5,
      height + hy - py * 0.32,
      Math.cos(theta) * radius
    );
    easing.damp3(state.camera.position, target, 0.42, dt);

    // hero framing: nudge the cloud right of the headline, recenter on assembly
    const heroShift = world.isMobile
      ? 0
      : -0.85 * (1 - smootherstep(remap(P, PHASE.assembleStart, PHASE.assembleEnd)));
    look.current.x = damp(look.current.x, heroShift - px * 0.24, 2.4, dt);
    look.current.y = damp(look.current.y, lookY + py * 0.12, 2.4, dt);
    state.camera.lookAt(look.current.x, look.current.y, 0);

    // gentle dolly-zoom into the hero shot
    const cam = state.camera as THREE.PerspectiveCamera;
    const fovTarget =
      38 - 4 * smootherstep(remap(P, PHASE.zoomStart, PHASE.zoomEnd));
    cam.fov = damp(cam.fov, fovTarget, 3, dt);
    cam.updateProjectionMatrix();
  });

  return null;
}
