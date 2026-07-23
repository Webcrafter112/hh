import * as THREE from 'three';
import { mulberry32 } from '@/lib/math';

// Procedural canvas textures — zero network fetches, tuned per ingredient.
// Everything is generated once and cached at module level.

function makeTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = colorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function speckle(
  ctx: CanvasRenderingContext2D,
  size: number,
  count: number,
  colors: string[],
  rMin: number,
  rMax: number,
  alpha: number,
  seed = 7
) {
  const rand = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * (0.4 + rand() * 0.6);
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    const r = rMin + rand() * (rMax - rMin);
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const cache: Record<string, THREE.Texture> = {};
const memo = (key: string, make: () => THREE.Texture) =>
  (cache[key] ??= make());

/** toasted brioche — warm radial gradient with baked speckle */
export const bunMap = () =>
  memo('bun', () =>
    makeTexture(1024, (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.08, s / 2, s / 2, s * 0.62);
      g.addColorStop(0, '#dfa964');
      g.addColorStop(0.55, '#c28a45');
      g.addColorStop(0.85, '#a06a2e');
      g.addColorStop(1, '#8a5a26');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 2600, ['#f3cf8f', '#c07c2e', '#8a4f1c'], 1, 3.5, 0.16, 11);
      // faint bake streaks
      const rand = mulberry32(31);
      ctx.globalAlpha = 0.05;
      for (let i = 0; i < 46; i++) {
        ctx.strokeStyle = rand() > 0.5 ? '#f7dba3' : '#8a4f1c';
        ctx.lineWidth = 2 + rand() * 8;
        ctx.beginPath();
        const y = rand() * s;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(s * 0.3, y + (rand() - 0.5) * 90, s * 0.7, y + (rand() - 0.5) * 90, s, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    })
  );

export const bunRoughness = () =>
  memo('bunRough', () =>
    makeTexture(
      512,
      (ctx, s) => {
        ctx.fillStyle = '#8f8f8f';
        ctx.fillRect(0, 0, s, s);
        speckle(ctx, s, 2400, ['#6f6f6f', '#b5b5b5', '#a0a0a0'], 1, 4, 0.5, 5);
      },
      THREE.NoColorSpace
    )
  );

/** shared crust base for the patty */
function pattyCrust(ctx: CanvasRenderingContext2D, s: number) {
  ctx.fillStyle = '#452a15';
  ctx.fillRect(0, 0, s, s);
  const rand = mulberry32(97);
  for (let i = 0; i < 1500; i++) {
    const r = 3 + rand() * 14;
    const shade = rand();
    ctx.globalAlpha = 0.25 + rand() * 0.35;
    ctx.fillStyle =
      shade > 0.72 ? '#61401f' : shade > 0.3 ? '#33200e' : '#201106';
    ctx.beginPath();
    ctx.arc(rand() * s, rand() * s, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** seared beef top — charred crust + crosshatch grill marks */
export const pattyTopMap = () =>
  memo('pattyTop', () =>
    makeTexture(1024, (ctx, s) => {
      pattyCrust(ctx, s);
      const mark = (angle: number, alpha: number) => {
        ctx.save();
        ctx.translate(s / 2, s / 2);
        ctx.rotate(angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#140904';
        for (let x = -s; x < s; x += 176) {
          ctx.fillRect(x, -s, 40, s * 2);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      };
      mark(Math.PI / 4.2, 0.42);
      mark(-Math.PI / 3.4, 0.26);
      speckle(ctx, s, 900, ['#6e4a22', '#1c0f06'], 1, 3, 0.3, 41);
    })
  );

/** seared beef side — ragged crust only, no marks */
export const pattySideMap = () =>
  memo('pattySide', () =>
    makeTexture(1024, (ctx, s) => {
      pattyCrust(ctx, s);
      speckle(ctx, s, 1200, ['#6e4a22', '#7a5326', '#1c0f06'], 1, 4, 0.32, 43);
    })
  );

export const pattyRoughness = () =>
  memo('pattyRough', () =>
    makeTexture(
      512,
      (ctx, s) => {
        // mid-rough with glossier grease pockets
        ctx.fillStyle = '#9a9a9a';
        ctx.fillRect(0, 0, s, s);
        speckle(ctx, s, 700, ['#4a4a4a', '#5f5f5f'], 4, 14, 0.55, 23);
        speckle(ctx, s, 1400, ['#c9c9c9'], 1, 4, 0.4, 29);
      },
      THREE.NoColorSpace
    )
  );

/** melted cheddar — soft radial sheen */
export const cheeseMap = () =>
  memo('cheese', () =>
    makeTexture(512, (ctx, s) => {
      const g = ctx.createRadialGradient(s * 0.45, s * 0.4, s * 0.05, s / 2, s / 2, s * 0.7);
      g.addColorStop(0, '#ffbe55');
      g.addColorStop(0.6, '#f5a33a');
      g.addColorStop(1, '#df8c25');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 350, ['#ffd27a', '#e0932c'], 2, 8, 0.12, 61);
    })
  );

/** iceberg — veined greens */
export const lettuceMap = () =>
  memo('lettuce', () =>
    makeTexture(1024, (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.05, s / 2, s / 2, s * 0.7);
      g.addColorStop(0, '#a8c977');
      g.addColorStop(0.55, '#6da13c');
      g.addColorStop(1, '#477526');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      // radial veins
      const rand = mulberry32(77);
      ctx.strokeStyle = '#e4f4bc';
      for (let i = 0; i < 90; i++) {
        const a = rand() * Math.PI * 2;
        ctx.globalAlpha = 0.14 + rand() * 0.22;
        ctx.lineWidth = 1 + rand() * 3.4;
        ctx.beginPath();
        ctx.moveTo(s / 2, s / 2);
        const r1 = s * (0.16 + rand() * 0.2);
        const r2 = s * 0.52;
        const wob = (rand() - 0.5) * 0.7;
        ctx.quadraticCurveTo(
          s / 2 + Math.cos(a + wob) * r1,
          s / 2 + Math.sin(a + wob) * r1,
          s / 2 + Math.cos(a) * r2,
          s / 2 + Math.sin(a) * r2
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    })
  );

/** tomato slice — flesh wheel with seed arcs */
export const tomatoMap = () =>
  memo('tomato', () =>
    makeTexture(1024, (ctx, s) => {
      const c = s / 2;
      const g = ctx.createRadialGradient(c, c, s * 0.02, c, c, c);
      g.addColorStop(0, '#e3c5a4');
      g.addColorStop(0.16, '#d67a55');
      g.addColorStop(0.42, '#c23e26');
      g.addColorStop(0.9, '#ad2f1c');
      g.addColorStop(1, '#8c2213');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      // pericarp walls
      const rand = mulberry32(13);
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#f3c9a8';
      const cells = 7;
      for (let i = 0; i < cells; i++) {
        const a0 = (i / cells) * Math.PI * 2 + 0.2;
        ctx.beginPath();
        ctx.ellipse(
          c + Math.cos(a0) * s * 0.26,
          c + Math.sin(a0) * s * 0.26,
          s * 0.13,
          s * 0.055,
          a0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      // seeds
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#efd28f';
      for (let i = 0; i < cells; i++) {
        const a0 = (i / cells) * Math.PI * 2 + 0.2;
        for (let jitter = 0; jitter < 6; jitter++) {
          const rr = s * (0.2 + rand() * 0.13);
          const aa = a0 + (rand() - 0.5) * 0.5;
          ctx.beginPath();
          ctx.ellipse(
            c + Math.cos(aa) * rr,
            c + Math.sin(aa) * rr,
            s * 0.011,
            s * 0.006,
            aa,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    })
  );

/** pickle chip — mottled brine green */
export const pickleMap = () =>
  memo('pickle', () =>
    makeTexture(512, (ctx, s) => {
      const c = s / 2;
      const g = ctx.createRadialGradient(c, c, s * 0.04, c, c, c);
      g.addColorStop(0, '#c9cf7e');
      g.addColorStop(0.5, '#93a24a');
      g.addColorStop(0.92, '#6f8038');
      g.addColorStop(1, '#4c5c24');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 700, ['#dde3a0', '#5c6d2b'], 1.5, 5, 0.3, 19);
    })
  );

/** caramelized onion strands */
export const onionMap = () =>
  memo('onion', () =>
    makeTexture(512, (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, '#d99a4e');
      g.addColorStop(0.5, '#b0722f');
      g.addColorStop(1, '#8a5220');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      // glossy caramel streaks
      const rand = mulberry32(53);
      for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = 0.12 + rand() * 0.16;
        ctx.strokeStyle = rand() > 0.4 ? '#f0bd7a' : '#6e3d15';
        ctx.lineWidth = 2 + rand() * 5;
        const y = rand() * s;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(s / 2, y + (rand() - 0.5) * 40, s, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    })
  );

/** soft round sprite for smoke */
export const smokeSprite = () =>
  memo('smoke', () =>
    makeTexture(256, (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255, 236, 214, 0.55)');
      g.addColorStop(0.4, 'rgba(220, 200, 180, 0.18)');
      g.addColorStop(1, 'rgba(200, 180, 160, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    })
  );

/** tiny glowing mote for dust */
export const dustSprite = () =>
  memo('dust', () =>
    makeTexture(64, (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255, 220, 170, 0.9)');
      g.addColorStop(0.35, 'rgba(255, 200, 130, 0.28)');
      g.addColorStop(1, 'rgba(255, 190, 120, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    })
  );
