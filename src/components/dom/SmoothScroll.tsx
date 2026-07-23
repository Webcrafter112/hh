'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { world } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scroll wired into the GSAP ticker + shared world state. */
export default function SmoothScroll() {
  useEffect(() => {
    world.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    world.isMobile =
      window.matchMedia('(pointer: coarse)').matches ||
      window.innerWidth < 820;

    const lenis = new Lenis({
      lerp: world.reducedMotion ? 1 : 0.085,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6,
    });

    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      world.scrollTarget = e.progress;
      world.velocity = e.velocity;
      ScrollTrigger.update();
    });

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const onPointer = (e: PointerEvent) => {
      world.pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      world.pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const onResize = () => {
      world.isMobile =
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth < 820;
    };
    window.addEventListener('resize', onResize);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
