'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="footer" id="visit">
      <div className="footer-grid">
        <div className="footer-col">
          <h4>Visit</h4>
          <ul>
            <li>14 Charcoal Lane</li>
            <li>Shoreditch, London</li>
            <li>Tue – Sun, 12:00 – 23:00</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Menu</h4>
          <ul>
            <li><a href="#craft">The Ember Classic</a></li>
            <li><a href="#story">The Ember Royale</a></li>
            <li><a href="#menu">Sides &amp; Shakes</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Follow</h4>
          <ul>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">TikTok</a></li>
            <li><a href="#">X</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="mailto:hello@ember.club">hello@ember.club</a></li>
            <li>+44 20 7946 0958</li>
          </ul>
        </div>
      </div>
      <motion.div
        className="footer-mark"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        EMBER
      </motion.div>
      <div className="footer-legal">
        <span>© MMXXVI Ember Smash Club</span>
        <span>Crafted to perfection</span>
      </div>
    </footer>
  );
}
