'use client';

import dynamic from 'next/dynamic';
import SmoothScroll from '@/components/dom/SmoothScroll';
import Cursor from '@/components/dom/Cursor';
import Preloader from '@/components/dom/Preloader';
import Nav from '@/components/dom/Nav';
import Sections from '@/components/dom/Sections';
import Footer from '@/components/dom/Footer';

const Experience = dynamic(() => import('@/components/canvas/Experience'), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Preloader />
      <Cursor />
      <Nav />
      <Experience />
      <Sections />
      <Footer />
      <div className="edge-vignette" />
      <div className="grain" />
    </>
  );
}
