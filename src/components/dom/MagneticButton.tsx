'use client';

import { useRef, type ReactNode, type PointerEvent } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface Props {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}

/** Button that leans toward the cursor with spring inertia, then snaps home. */
export default function MagneticButton({
  children,
  className = 'btn-magnetic',
  strength = 0.35,
  onClick,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 14, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 180, damping: 14, mass: 0.4 });

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left - rect.width / 2) * strength);
    my.set((e.clientY - rect.top - rect.height / 2) * strength);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ x: sx, y: sy }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
