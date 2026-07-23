'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { world } from '@/lib/store';

export default function Preloader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // hold until the canvas has actually produced a frame, min 1.4s of brand
    const start = performance.now();
    const iv = setInterval(() => {
      if (world.ready && performance.now() - start > 1400) {
        setDone(true);
        clearInterval(iv);
      }
    }, 120);
    // never trap the user if WebGL is slow or unavailable
    const bail = setTimeout(() => setDone(true), 3500);
    return () => {
      clearInterval(iv);
      clearTimeout(bail);
    };
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="preloader"
          exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
        >
          <motion.div
            className="preloader-mark"
            initial={{ opacity: 0, letterSpacing: '0.7em' }}
            animate={{ opacity: 1, letterSpacing: '0.42em' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            EMBER<em>.</em>
          </motion.div>
          <div className="preloader-bar">
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.25, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
