'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MagneticButton from './MagneticButton';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      className={`nav${scrolled ? ' scrolled' : ''}`}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <a href="#" className="nav-logo" aria-label="Ember home">
        EMBER<em>.</em>
      </a>
      <div className="nav-links">
        <a href="#craft">The Craft</a>
        <a href="#menu">Menu</a>
        <a href="#story">Story</a>
        <a href="#visit">Visit</a>
      </div>
      <MagneticButton className="btn-ghost" strength={0.25}>
        Order Now
      </MagneticButton>
    </motion.nav>
  );
}
