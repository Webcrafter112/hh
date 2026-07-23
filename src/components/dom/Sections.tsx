'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MagneticButton from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

const fadeUp = {
  initial: { opacity: 0, y: 42 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.4 },
  transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const },
};

function Chars({ text }: { text: string }) {
  return (
    <span className="reveal-line">
      {text.split('').map((c, i) => (
        <span key={i} className="char">
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  );
}

export default function Sections() {
  const craftedRef = useRef<HTMLDivElement>(null);

  // "Crafted to Perfection" — scroll-scrubbed per-character rise
  useEffect(() => {
    const el = craftedRef.current;
    if (!el) return;
    const chars = el.querySelectorAll('.char');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        chars,
        { yPercent: 120, opacity: 0, filter: 'blur(10px)' },
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          stagger: 0.028,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.6,
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <main>
      {/* ------------------------------------------ 1 · floating ingredients */}
      <section className="section" style={{ height: '135vh' }}>
        <div className="section-sticky">
          <motion.div
            className="hero-inner"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow">Ember — Smash Burger Atelier</span>
            <h1 className="display-xl">
              Gravity,
              <br />
              <span className="text-outline">suspended.</span>
            </h1>
            <p className="lede">
              Nine ingredients, weightless — until you scroll. Watch the
              Ember Classic assemble itself, layer by layer.
            </p>
          </motion.div>
          <motion.div
            className="hero-bottom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.3 }}
          >
            <div className="scroll-hint">
              <div className="scroll-hint-line" />
              <span>Scroll to assemble</span>
            </div>
            <span>EST. MMXXVI — No. 01</span>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------- 2 · assembly begins */}
      <section className="section" id="craft" style={{ height: '150vh' }}>
        <div className="section-sticky">
          <motion.div className="block-right" {...fadeUp}>
            <span className="eyebrow">The Craft</span>
            <h2 className="display-lg">
              Nine ingredients.
              <br />
              <span className="text-ember">Zero shortcuts.</span>
            </h2>
            <p className="lede">
              Brioche proofed for 48 hours. Heritage beef, ground twice
              daily. A sauce we refuse to explain. Everything falls into
              place — literally.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------- 3 · almost complete */}
      <section className="section" style={{ height: '150vh' }}>
        <div className="section-sticky">
          <motion.div className="block-left" {...fadeUp}>
            <span className="eyebrow">The Smash</span>
            <h2 className="display-lg">
              Smashed at 300°.
              <br />
              Seared in seconds.
            </h2>
            <div className="stat-row">
              <div className="stat-chip">
                <strong>300°C</strong>
                <span>Cast-iron plancha</span>
              </div>
              <div className="stat-chip">
                <strong>2 × 80 g</strong>
                <span>Double smashed patties</span>
              </div>
              <div className="stat-chip">
                <strong>48 h</strong>
                <span>Proofed brioche</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------- 4 · full burger */}
      <section className="section" style={{ height: '140vh' }}>
        <div className="section-sticky">
          <motion.span
            className="caption-bottom"
            {...fadeUp}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            No. 01 — The Ember Classic
          </motion.span>
        </div>
      </section>

      {/* ----------------------------------------- 5 · showcase + typography */}
      <section className="section" id="menu" style={{ height: '170vh' }}>
        <div className="section-sticky center-stage" ref={craftedRef}>
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            The Ember Standard
          </span>
          <h2 className="display-xl" aria-label="Crafted to Perfection">
            <Chars text="Crafted to" />
            <Chars text="Perfection" />
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.6 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <MagneticButton>
              <span className="btn-dot" />
              Order Now
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* -------------------------------------- 6 · explode into variation */}
      <section className="section" id="story" style={{ height: '220vh' }}>
        <div className="section-sticky">
          <motion.div className="block-left" {...fadeUp}>
            <span className="eyebrow">No. 02</span>
            <h2 className="display-lg">
              Same physics.
              <br />
              <span className="text-outline">Darker intentions.</span>
            </h2>
            <p className="lede">
              The Ember Royale — re-plated in mid-air. Lettuce beneath the
              meat, smoked gouda, golden sauce. Watch it come apart and
              land differently.
            </p>
            <MagneticButton className="btn-ghost" strength={0.25}>
              Explore the menu
            </MagneticButton>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
