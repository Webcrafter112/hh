'use client';

import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
} from 'framer-motion';

/** Minimal dot + trailing ring cursor. Hidden on touch devices via CSS. */
export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [x, y]);

  return (
    <>
      <motion.div
        className="cursor-dot"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="cursor-ring"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
      />
    </>
  );
}
