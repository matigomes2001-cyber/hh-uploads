// Glow Steps engine: canvas, palette, math and drawing primitives.
// Every drawing function in the kit uses the shared `ctx` exported here (set once by main.js).
export const W = 1080, H = 1920, FPS = 30;
export let ctx = null;
export function setCtx(c) { ctx = c; }

// The style palette. Only these (plus alpha tints of them) appear on screen.
// Midnight base, two glow accents (violet, coral), mint ONLY for "step done", paper white for text.
export const C = {
  ink: '#15122E', ink2: '#1B1640', deep: '#0E0B22',
  plum: '#2A1F4D', plum2: '#382A66',
  violet: '#8B6CFF', violetLight: '#B3A0FF', violetDark: '#6246D9',
  coral: '#FF6B8B', coralLight: '#FF9AB0',
  mint: '#3DDC97',
  paper: '#F5F3FF', dim: '#A79FD0', dimmer: '#6D6498', white: '#FFFFFF',
};

// ---------- math ----------
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / ((b - a) || 1e-6));
export const eo = (t) => 1 - Math.pow(1 - t, 3);
export const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eob = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const TAU = Math.PI * 2;

// ---------- primitives ----------
export function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function ell(x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function line(pts, color, w) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
export function fillAll(color) { ctx.fillStyle = color; ctx.fillRect(-300, -300, W + 600, H + 600); }
