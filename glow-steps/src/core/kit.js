// Glow Steps kit: midnight gradient world, glass cards, a locked-to-unlocked step row, a step ring, the mascot Pip.
// Everything is a pure function of time. Names only, no logos; the mascot and every shape are original.
import { ctx, C, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle, ell } from './lib.js';

export const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

/** text in the style fonts. o: { ui: Inter instead of Sora, w: weight, align, a: alpha } */
export function text(str, x, y, size, color = C.paper, o = {}) {
  ctx.save(); ctx.font = `${o.w ?? (o.ui ? 600 : 800)} ${size}px ${o.ui ? 'Inter' : 'Sora'}`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle'; ctx.globalAlpha *= o.a ?? 1; ctx.fillStyle = color; ctx.fillText(str, x, y); ctx.restore();
}

function glow(x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ── world ────────────────────────────────────────────────────────────────
/** midnight gradient, two slow drifting glows (violet top-left, coral bottom-right) and a faint dot grid */
export function bg(t) {
  const g = ctx.createLinearGradient(0, -300, 0, H + 300); g.addColorStop(0, C.ink); g.addColorStop(1, C.ink2);
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
  glow(180 + Math.sin(t * 0.35) * 90, 260 + Math.cos(t * 0.3) * 70, 800, C.violet, 0.34);
  glow(930 + Math.cos(t * 0.28) * 80, 1500 + Math.sin(t * 0.33) * 90, 880, C.coral, 0.2);
  glow(1000, 640 + Math.sin(t * 0.4) * 60, 520, C.violetDark, 0.28);
  ctx.fillStyle = 'rgba(245,243,255,0.07)';
  for (let y = -300; y < H + 300; y += 56) for (let x = -300; x < W + 300; x += 56) ctx.fillRect(x, y, 3, 3);
  motes(t);
}
/** soft dots drifting upward, so the background is never still */
export function motes(t) {
  ctx.save();
  for (let i = 0; i < 28; i++) {
    const sp = 14 + rnd(i + 9) * 24, span = 1.2 * H, y = (((rnd(i + 5) * span - t * sp) % span) + span) % span - 120;
    ctx.globalAlpha = 0.1 + rnd(i + 7) * 0.22; circle(rnd(i) * W + Math.sin(t * 0.4 + i) * 34, y, 3 + rnd(i + 2) * 8, i % 3 ? C.violetLight : C.coralLight);
  }
  ctx.restore();
}

/** the card everything sits on: plum gradient, soft shadow, hairline light edge on top */
export function glass(x, y, w, h, r = 36, o = {}) {
  ctx.save();
  ctx.shadowColor = 'rgba(8,5,30,0.55)'; ctx.shadowBlur = o.blur ?? 40; ctx.shadowOffsetY = o.dy ?? 16;
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top || C.plum2); g.addColorStop(1, o.bot || C.plum);
  rr(x, y, w, h, r); ctx.fillStyle = g; ctx.fill();
  ctx.shadowColor = 'transparent';
  rr(x + 0.5, y + 0.5, w - 1, h - 1, r); ctx.strokeStyle = o.edge || 'rgba(245,243,255,0.14)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}

// ── name tiles (text only: a gradient monogram + the name, never a logo) ──
const PAIRS = [[C.violet, C.coral], [C.coral, C.violetLight], [C.violetLight, C.violet], [C.violetDark, C.coral], [C.coralLight, C.violet]];
const pairOf = (name) => PAIRS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PAIRS.length];
function mono(name, x, y, r) {
  const m = pairOf(name), g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, m[0]); g.addColorStop(1, m[1]);
  circle(x, y, r, g); text(name[0], x, y + 2, r * 1.05, C.white, { align: 'center' });
}
/** x, y = centre. o: { w, by, a } */
export function tile(name, x, y, s = 1, o = {}) {
  const w = o.w ?? 540, h = 124;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= o.a ?? 1;
  glass(-w / 2, -h / 2, w, h, 40, { blur: 26, dy: 10 });
  mono(name, -w / 2 + 72, 0, 38);
  text(name, -w / 2 + 134, o.by ? -14 : 0, 44, C.paper);
  if (o.by) text(o.by, -w / 2 + 134, 28, 26, C.dim, { ui: true });
  ctx.restore();
}
/** one lane of tiles drifting sideways (dir ±1), looping. names: [string] */
export function lane(t, y, dir, speed, names, s = 0.8, a = 1) {
  const step = 540 * s + 70, total = names.length * step;
  names.forEach((n, i) => {
    const x = (((i * step + dir * speed * t) % total) + total) % total - 380;
    if (x > -420 && x < W + 420) tile(n, x, y, s, { a });
  });
}

// ── the browser window with five step rows ────────────────────────────────
export const BOARD = { x: 80, y: 300, w: 920, h: 950 };
export const ROWS = [['ChatGPT', 'OpenAI'], ['Gemini', 'Google'], ['Claude', 'Anthropic'], ['DeepSeek', 'DeepSeek'], ['Grok', 'xAI']];
export const rowTop = (rank) => BOARD.y + 120 + (rank - 1) * 160;
export const rowMid = (rank) => [BOARD.x + BOARD.w / 2, rowTop(rank) + 69];

export function windowFrame(url, p = 1) {
  const { x, y, w, h } = BOARD;
  glass(x, y, w, h, 48, { blur: 70, dy: 28, top: C.plum, bot: '#1F1740' });
  circle(x + 56, y + 48, 11, C.coral); circle(x + 92, y + 48, 11, C.violetLight); circle(x + 128, y + 48, 11, C.dimmer);
  rr(x + 170, y + 22, w - 230, 52, 26); ctx.fillStyle = rgba(C.deep, 0.8); ctx.fill();
  text(url.slice(0, Math.round(url.length * clamp(p))), x + 200, y + 49, 26, C.dim, { ui: true });
}

function lockIcon(x, y, a) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a; ctx.strokeStyle = C.dim; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -8, 15, Math.PI, 0); ctx.stroke();
  rr(-23, -6, 46, 36, 10); ctx.fillStyle = C.dim; ctx.fill(); circle(0, 12, 5, C.ink); ctx.restore();
}
function checkIcon(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); circle(0, 0, 30, C.mint);
  ctx.strokeStyle = C.deep; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-12, 1); ctx.lineTo(-3, 11); ctx.lineTo(14, -9); ctx.stroke(); ctx.restore();
}

/** one step row. u: 0 locked → 1 unlocked (the unlock pops). */
export function row(rank, u) {
  const [name, by] = ROWS[rank - 1], x = BOARD.x + 30, w = BOARD.w - 60, h = 138, y = rowTop(rank), cx = x + w / 2, cy = y + h / 2;
  const pop = u > 0 && u < 1 ? 1 + 0.06 * Math.sin(Math.PI * eo(u)) : 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
  // locked layer
  if (u < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - eo(u);
    rr(x, y, w, h, 38); ctx.fillStyle = 'rgba(245,243,255,0.05)'; ctx.fill(); ctx.strokeStyle = 'rgba(245,243,255,0.1)'; ctx.lineWidth = 2; ctx.stroke();
    text(String(rank), x + 54, cy + 2, 58, C.dimmer, { align: 'center' });
    circle(x + 160, cy, 38, 'rgba(245,243,255,0.1)');
    rr(x + 224, cy - 30, 300, 24, 12); ctx.fillStyle = 'rgba(245,243,255,0.1)'; ctx.fill();
    rr(x + 224, cy + 8, 190, 18, 9); ctx.fillStyle = 'rgba(245,243,255,0.07)'; ctx.fill();
    lockIcon(x + w - 70, cy, 0.9);
    ctx.restore();
  }
  // unlocked layer
  if (u > 0) {
    ctx.save(); ctx.globalAlpha *= eo(u);
    glass(x, y, w, h, 38, { blur: 30, dy: 10, top: '#43337A', bot: '#2E2358', edge: rgba(C.violetLight, 0.45) });
    text(String(rank), x + 54, cy + 2, 58, C.paper, { align: 'center' });
    mono(name, x + 160, cy, 38);
    text(name, x + 224, cy - 14, 50, C.paper);
    text(by, x + 224, cy + 30, 28, C.dim, { ui: true });
    checkIcon(x + w - 70, cy, 0.4 + 0.6 * eob(clamp(u * 1.4)));
    ctx.restore();
  }
  ctx.restore();
}

// ── step ring (top-left for the whole video): n segments, `done` of them mint ──
export function ring(x, y, r, n, done, label, pulse = 0) {
  const gap = 0.16, a0 = -Math.PI / 2, per = TAU / n;
  ctx.save(); ctx.translate(x, y); const sc = 1 + 0.08 * pulse; ctx.scale(sc, sc);
  circle(0, 0, r + 18, rgba(C.deep, 0.55));
  ctx.lineWidth = 16; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const s = a0 + i * per + gap / 2, e = a0 + (i + 1) * per - gap / 2;
    ctx.beginPath(); ctx.arc(0, 0, r, s, e); ctx.strokeStyle = rgba(C.violetLight, 0.22); ctx.stroke();
    const f = clamp(done - i);
    if (f > 0) { ctx.save(); ctx.shadowColor = rgba(C.mint, 0.7); ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(0, 0, r, s, s + (e - s) * f); ctx.strokeStyle = C.mint; ctx.stroke(); ctx.restore(); }
  }
  text(label, 0, 3, r * 0.95, C.paper, { align: 'center' });
  ctx.restore();
}

// ── sparkles ────────────────────────────────────────────────────────────────
export function spark(x, y, r, a = 1, rot = 0, col = C.violetLight) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rad = i % 2 ? r * 0.28 : r, an = i * Math.PI / 4 - Math.PI / 2; ctx.lineTo(Math.cos(an) * rad, Math.sin(an) * rad); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
/** p: 0..1 progress of a sparkle burst from (x, y) */
export function burst(x, y, p, n = 9, R = 150, seed = 0) {
  if (p <= 0 || p >= 1) return;
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU + rnd(i + seed) * 0.6, d = R * eo(p) * (0.6 + rnd(i + 9 + seed) * 0.6), sz = (16 + rnd(i + 3 + seed) * 20) * (1 - p * 0.4);
    spark(x + Math.cos(an) * d, y + Math.sin(an) * d, sz, 1 - p * p, p * 2 + i, i % 3 === 0 ? C.coralLight : i % 3 === 1 ? C.paper : C.violetLight);
  }
}

// ── Pip, the mascot: a round-headed helper with a glowing antenna (original design) ──
/** origin = head centre; s: scale. o: { t, look (-1..1), lookY, wave (0..1), happy (0..1), a } */
export function pip(x, y, s = 1, o = {}) {
  const t = o.t ?? 0, look = o.look ?? 0, lookY = o.lookY ?? 0, wave = o.wave ?? 0, happy = o.happy ?? 0;
  const blink = (t % 3.4) > 3.28 ? 0.12 : 1, bob = Math.sin(t * 2.2) * 5;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(s, s); ctx.globalAlpha *= o.a ?? 1;
  glow(0, 190, 150, C.violet, 0.28);
  // arms (behind the body)
  const arm = (px, py, ang, len) => { ctx.save(); ctx.translate(px, py); ctx.rotate(ang); rr(-2, -11, len, 22, 11); ctx.fillStyle = C.violetDark; ctx.fill(); circle(len, 0, 15, C.violetLight); ctx.restore(); };
  arm(-52, 118, 2.35, 58);
  arm(52, 118, lerp(0.8, -1.2 + Math.sin(t * 10) * 0.35, wave), 58);
  // body
  const bg2 = ctx.createLinearGradient(0, 80, 0, 190); bg2.addColorStop(0, '#7B5CF0'); bg2.addColorStop(1, C.violetDark);
  rr(-52, 84, 104, 100, 40); ctx.fillStyle = bg2; ctx.fill();
  circle(0, 134, 10, C.coral);
  // antenna
  ctx.strokeStyle = C.violetLight; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -74); ctx.lineTo(0, -112); ctx.stroke();
  glow(0, -124, 46, C.coral, 0.5 + 0.2 * Math.sin(t * 4)); circle(0, -124, 13, C.coral);
  // head
  const hg = ctx.createLinearGradient(0, -80, 0, 80); hg.addColorStop(0, '#A590FF'); hg.addColorStop(1, '#6B4FE6');
  rr(-92, -76, 184, 156, 66); ctx.fillStyle = hg; ctx.fill();
  rr(-92 + 1, -76 + 1, 182, 154, 65); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.stroke();
  // face plate
  rr(-68, -46, 136, 94, 44); ctx.fillStyle = C.deep; ctx.fill();
  const ex = look * 9, ey = lookY * 7;
  ell(-30 + ex, -6 + ey, 10, 18 * blink, C.mint); ell(30 + ex, -6 + ey, 10, 18 * blink, C.mint);
  ctx.strokeStyle = C.mint; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(ex * 0.8, 14 + ey, 15, Math.PI * (0.18 - happy * 0.06), Math.PI * (0.82 + happy * 0.06)); ctx.stroke();
  circle(-52, 18, 8, rgba(C.coral, 0.55)); circle(52, 18, 8, rgba(C.coral, 0.55));
  ctx.restore();
}

// ── phone with an app grid, one app glowing ────────────────────────────────
/** hi = index (0..11) of the glowing app; t drives the pulse. */
export function phone(x, y, s, t, hi = 4, mark = '', markP = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  glass(-215, -430, 430, 860, 74, { blur: 70, dy: 30, top: '#3A2D6A', bot: '#241A47' });
  rr(-196, -411, 392, 822, 58); ctx.fillStyle = C.deep; ctx.fill();
  rr(-62, -392, 124, 32, 16); ctx.fillStyle = '#05040F'; ctx.fill();
  for (let i = 0; i < 12; i++) {
    const col = i % 3, rw = Math.floor(i / 3), ix = -122 + col * 122, iy = -250 + rw * 150, m = PAIRS[i % PAIRS.length];
    ctx.save(); ctx.translate(ix, iy);
    const on = i === hi, pulse = on ? 1 + 0.07 * Math.sin(t * 5) : 1; ctx.scale(pulse, pulse);
    if (on) glow(0, 0, 130, C.violet, 0.55);
    const g = ctx.createLinearGradient(-48, -48, 48, 48); g.addColorStop(0, on ? C.violetLight : rgba(m[0], 0.35)); g.addColorStop(1, on ? C.coral : rgba(m[1], 0.35));
    rr(-48, -48, 96, 96, 30); ctx.fillStyle = g; ctx.fill();
    if (on) { rr(-48, -48, 96, 96, 30); ctx.strokeStyle = C.paper; ctx.lineWidth = 4; ctx.stroke(); }
    if (on && mark) { const k = eob(clamp(markP)); ctx.scale(k, k); text(mark, 0, 4, 64, C.white, { align: 'center' }); }
    ctx.restore();
  }
  // dock
  rr(-176, 300, 352, 104, 48); ctx.fillStyle = 'rgba(245,243,255,0.06)'; ctx.fill();
  for (let i = 0; i < 4; i++) { const m = PAIRS[(i + 2) % PAIRS.length], g = ctx.createLinearGradient(0, 322, 0, 382); g.addColorStop(0, rgba(m[0], 0.35)); g.addColorStop(1, rgba(m[1], 0.35)); rr(-150 + i * 82, 322, 62, 62, 20); ctx.fillStyle = g; ctx.fill(); }
  ctx.restore();
}

/** a speech bubble with one big character, e.g. "?" */
export function bubble(str, x, y, s = 1, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  glass(-56, -56, 112, 112, 40, { blur: 24, dy: 8 });
  text(str, 0, 4, 64, C.paper, { align: 'center' }); ctx.restore();
}

// ── v2 additions: stamps, chips, magnifier, crown, confetti, chevrons, ripples ──
/** giant ghost numeral behind a reveal */
export function stamp(str, x, y, size, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(o.sc ?? 1, o.sc ?? 1); ctx.globalAlpha *= o.a ?? 1;
  ctx.font = `800 ${size}px Sora`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 8; ctx.strokeStyle = rgba(C.violetLight, 0.5); ctx.strokeText(str, 0, 0);
  ctx.fillStyle = rgba(C.violet, 0.14); ctx.fillText(str, 0, 0); ctx.restore();
}
function icn(kind, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = C.white; ctx.fillStyle = C.white; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kind === 'up' || kind === 'down') {
    if (kind === 'down') ctx.scale(1, -1);
    ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, -18); ctx.moveTo(-15, -4); ctx.lineTo(0, -18); ctx.lineTo(15, -4); ctx.stroke();
  } else if (kind === 'unlock') {
    rr(-17, -2, 34, 28, 8); ctx.fill(); ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(-9, -12); ctx.arc(0, -12, 9, Math.PI, 0); ctx.lineTo(9, -6); ctx.stroke();
  } else if (kind === 'pen') {
    ctx.beginPath(); ctx.moveTo(-14, 16); ctx.lineTo(14, -14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-18, 20); ctx.lineTo(-10, 18); ctx.lineTo(-16, 12); ctx.closePath(); ctx.fill();
  } else if (kind === 'clock') {
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 0); ctx.lineTo(9, 6); ctx.stroke();
  } else if (kind === 'eye') {
    ctx.beginPath(); ctx.moveTo(-24, 0); ctx.quadraticCurveTo(0, -26, 24, 0); ctx.quadraticCurveTo(0, 26, -24, 0); ctx.stroke(); circle(0, 0, 7, C.white);
  } else if (kind === 'code') { text('</>', 0, 2, 30, C.white, { align: 'center' }); }
  else if (kind === 'x') { text('X', 0, 2, 44, C.white, { align: 'center' }); }
  ctx.restore();
}
/** sticker chip with a short fact. icon: up | down | unlock | pen | code | x */
export function chip(str, x, y, s = 1, rot = -0.05, a = 1, icon = '') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.font = '800 48px Sora'; const tw = ctx.measureText(str).width, w = tw + (icon ? 150 : 72), h = 100;
  ctx.shadowColor = 'rgba(8,5,30,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violet); g.addColorStop(1, C.coral);
  rr(-w / 2, -h / 2, w, h, 32); ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent';
  rr(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 31); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  if (icon) icn(icon, -w / 2 + 62, 0);
  text(str, icon ? -w / 2 + 110 : -tw / 2, 3, 48, C.white);
  ctx.restore();
}
export function magnifier(x, y, s = 1, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  glow(0, 0, 160, C.violetLight, 0.22); circle(0, 0, 78, rgba(C.violetLight, 0.14));
  ctx.strokeStyle = C.paper; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, 0, 78, 0, TAU); ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = C.coral; ctx.beginPath(); ctx.moveTo(58, 58); ctx.lineTo(122, 122); ctx.stroke();
  ctx.restore();
}
export function crown(x, y, s = 1, a = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(0, -50, 0, 40); g.addColorStop(0, C.coralLight); g.addColorStop(1, C.coral);
  ctx.beginPath(); ctx.moveTo(-62, 38); ctx.lineTo(-74, -30); ctx.lineTo(-32, 0); ctx.lineTo(0, -52); ctx.lineTo(32, 0); ctx.lineTo(74, -30); ctx.lineTo(62, 38); ctx.closePath();
  ctx.fillStyle = g; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = C.paper; ctx.stroke();
  [[-74, -30], [0, -52], [74, -30]].forEach(([px, py]) => circle(px, py, 9, C.paper));
  ctx.restore();
}
/** p = seconds since the burst started */
export function confetti(p, n = 56) {
  if (p <= 0 || p > 3) return;
  const cols = [C.violetLight, C.coral, C.paper, C.coralLight, C.violet];
  for (let i = 0; i < n; i++) {
    const x = rnd(i) * W + Math.sin(p * 2 + i) * 40, y = -60 + p * (420 + rnd(i + 1) * 460), w = 14 + rnd(i + 3) * 14;
    ctx.save(); ctx.translate(x, y); ctx.rotate(p * (3 + rnd(i + 2) * 6) + i); ctx.globalAlpha = clamp(1 - (p - 2.2) / 0.8);
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-w / 2, -w / 4, w, w / 2); ctx.restore();
  }
}
/** upward chevrons trailing below (x, y) */
export function chevrons(x, y, p, a = 1) {
  ctx.save(); ctx.strokeStyle = C.coralLight; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < 5; i++) {
    const ph = (p * 1.6 + i / 5) % 1, yy = y + 40 + ph * 360; ctx.globalAlpha = a * (1 - ph) * 0.8;
    ctx.beginPath(); ctx.moveTo(x - 42, yy + 18); ctx.lineTo(x, yy - 14); ctx.lineTo(x + 42, yy + 18); ctx.stroke();
  }
  ctx.restore();
}
export function ripple(x, y, t, a = 1) {
  ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 5;
  for (let k = 0; k < 3; k++) { const p = (t * 0.9 + k / 3) % 1; ctx.globalAlpha = a * 0.7 * (1 - p); ctx.beginPath(); ctx.arc(x, y, 50 + p * 130, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
/** a soft cone of light from the top of the frame */
export function spot(x, a = 1) {
  ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, 1500); g.addColorStop(0, rgba(C.paper, 0.34 * a)); g.addColorStop(1, rgba(C.paper, 0));
  ctx.beginPath(); ctx.moveTo(x - 70, -300); ctx.lineTo(x + 70, -300); ctx.lineTo(x + 560, 1500); ctx.lineTo(x - 560, 1500); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
}

// ── v3 additions (episode "why AI forgets"): chat bubbles, panel, step pills, toggle, note, eye ──
/** chat bubble. edge = right edge (side 'u') or left edge (side 'a'); cy = centre y. o: { side, s, a, hi, dx }. returns width */
export function msg(str, edge, cy, o = {}) {
  ctx.save(); ctx.font = '700 34px Inter'; const tw = ctx.measureText(str).width, w = tw + 64, h = 84, u = (o.side || 'a') === 'u';
  const cx = (u ? edge - w / 2 : edge + w / 2) + (o.dx || 0), s = o.s ?? 1;
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha *= o.a ?? 1;
  ctx.shadowColor = 'rgba(8,5,30,0.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  if (u) { g.addColorStop(0, C.violet); g.addColorStop(1, C.violetDark); } else { g.addColorStop(0, '#4A3A86'); g.addColorStop(1, '#33266B'); }
  rr(-w / 2, -h / 2, w, h, 36); ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent';
  rr(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 35); ctx.strokeStyle = o.hi ? rgba(C.coral, 0.4 + 0.6 * o.hi) : 'rgba(255,255,255,0.18)'; ctx.lineWidth = o.hi ? 5 : 2; ctx.stroke();
  ctx.font = '700 34px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.paper; ctx.fillText(str, 0, 2);
  ctx.restore(); return w;
}
/** the context-window panel. o: { rim 0..1 (violet glow), danger 0..1 (coral), label, labelP (write-on 0..1), ghost 0..1 (dashed empty outline instead) } */
export function panel(x, y, w, h, o = {}) {
  ctx.save();
  if (o.ghost) {
    ctx.globalAlpha *= o.ghost; ctx.setLineDash([22, 18]); rr(x, y, w, h, 44); ctx.strokeStyle = rgba(C.violetLight, 0.55); ctx.lineWidth = 5; ctx.stroke(); ctx.setLineDash([]);
    ctx.restore(); return;
  }
  glass(x, y, w, h, 44, { blur: 60, dy: 24, top: '#2D2358', bot: '#1F1745' });
  const rim = o.rim ?? 0, dg = o.danger ?? 0;
  if (rim > 0 || dg > 0) {
    ctx.save(); const c = dg > 0 ? C.coral : C.violetLight, a = dg > 0 ? dg : rim;
    ctx.shadowColor = rgba(c, 0.9 * a); ctx.shadowBlur = 36; rr(x, y, w, h, 44); ctx.strokeStyle = rgba(c, 0.95 * a); ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
  }
  if (o.label) {
    ctx.save(); ctx.font = '800 34px Sora'; const lw = ctx.measureText(o.label).width + 64, p = clamp(o.labelP ?? 1);
    ctx.beginPath(); ctx.rect(x + 40, y - 80, lw * p, 120); ctx.clip();
    const g = ctx.createLinearGradient(x, 0, x + lw, 0); g.addColorStop(0, C.violet); g.addColorStop(1, C.coral);
    rr(x + 40, y - 34, lw, 68, 34); ctx.fillStyle = g; ctx.fill(); text(o.label, x + 72, y + 2, 34, C.white); ctx.restore();
  }
  ctx.restore();
}
export const clipRR = (x, y, w, h, r = 44) => { rr(x, y, w, h, r); ctx.clip(); };
/** vertical fill gauge, p 0..1; full flashes coral */
export function meter(x, y, h, p, flash = 0) {
  ctx.save(); rr(x - 18, y, 36, h, 18); ctx.fillStyle = rgba(C.deep, 0.8); ctx.fill(); rr(x - 18, y, 36, h, 18); ctx.strokeStyle = 'rgba(245,243,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();
  const fh = Math.max(0, (h - 8) * clamp(p));
  if (fh > 2) { const g = ctx.createLinearGradient(0, y + h, 0, y); g.addColorStop(0, C.violet); g.addColorStop(1, C.coral); rr(x - 14, y + h - 4 - fh, 28, fh, 14); ctx.fillStyle = g; ctx.fill(); }
  if (flash > 0) { ctx.shadowColor = rgba(C.coral, 0.9); ctx.shadowBlur = 30 * flash; rr(x - 18, y, 36, h, 18); ctx.strokeStyle = rgba(C.coral, flash); ctx.lineWidth = 5; ctx.stroke(); }
  ctx.restore();
}
export const PILL_TAGS = [];
export const PILLS = ['goes in', 'fills up', 'new chat', 'the fix'], PILL_Y = 476;
export const pillX = (i) => 116 + 100 + i * 216;
/** step pill i. u: 0 locked → 1 done (mint check). cur: highlighted as the current step. pose: { dx, dy, sx, sy, rot, a } */
export function pill(i, u, cur, t, pose = {}) {
  const w = 200, h = 112, x = pillX(i), y = PILL_Y + (pose.dy || 0);
  ctx.save(); ctx.translate(x + (pose.dx || 0), y); ctx.rotate(pose.rot || 0); ctx.scale(pose.sx ?? 1, pose.sy ?? 1); ctx.globalAlpha *= pose.a ?? 1;
  const pop = u > 0 && u < 1 ? 1 + 0.08 * Math.sin(Math.PI * eo(u)) : 1; ctx.scale(pop, pop);
  if (u > 0.5) glass(-w / 2, -h / 2, w, h, 32, { blur: 24, dy: 8, top: '#43337A', bot: '#2E2358', edge: rgba(C.violetLight, 0.4) });
  else { rr(-w / 2, -h / 2, w, h, 32); ctx.fillStyle = 'rgba(245,243,255,0.06)'; ctx.fill(); ctx.strokeStyle = cur ? rgba(C.violetLight, 0.7 + 0.3 * Math.sin(t * 6)) : 'rgba(245,243,255,0.12)'; ctx.lineWidth = cur ? 4 : 2; ctx.stroke(); }
  const on = u > 0.5 || cur;
  text(PILL_TAGS[i] || 'STEP ' + (i + 1), -w / 2 + 24, -22, 20, on ? C.violetLight : C.dimmer, { ui: true, w: 700 });
  text(PILLS[i], -w / 2 + 24, 18, 32, on ? C.paper : C.dimmer);
  if (u > 0.5) { ctx.save(); ctx.translate(w / 2 - 6, -h / 2 + 6); const k = 0.55 * eob(clamp((u - 0.5) * 2)); ctx.scale(k, k); circle(0, 0, 30, C.mint); ctx.strokeStyle = C.deep; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-12, 1); ctx.lineTo(-3, 11); ctx.lineTo(14, -9); ctx.stroke(); ctx.restore(); }
  else if (!cur) lockIcon(w / 2 - 30, -30, 0.42);
  ctx.restore();
}
/** switch. on 0..1 (violet/coral when on, never mint) */
export function toggle(x, y, on, label, s = 1, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.font = '800 40px Sora'; const lw = ctx.measureText(label).width, W2 = 150, w = lw + W2 + 80;
  glass(-w / 2, -60, w, 120, 60, { blur: 26, dy: 10 });
  text(label, -w / 2 + 36, 3, 40, C.paper);
  const tx = w / 2 - 36 - W2, g = ctx.createLinearGradient(tx, 0, tx + W2, 0); g.addColorStop(0, lerpHex(C.dimmer, C.violet, on)); g.addColorStop(1, lerpHex(C.dimmer, C.coral, on));
  rr(tx, -34, W2, 68, 34); ctx.fillStyle = g; ctx.fill();
  circle(tx + 34 + (W2 - 68) * eio(clamp(on)), 0, 27, C.white);
  ctx.restore();
}
function lerpHex(a, b, t) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = (sh) => Math.round(lerp((A >> sh) & 255, (B >> sh) & 255, clamp(t))); return `rgb(${f(16)},${f(8)},${f(0)})`; }
/** sticky note card with a pin */
export function note(str, x, y, s = 1, rot = 0, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.font = '800 36px Sora'; const w = ctx.measureText(str).width + 80, h = 96;
  ctx.shadowColor = 'rgba(8,5,30,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; rr(-w / 2, -h / 2, w, h, 22); ctx.fillStyle = C.paper; ctx.fill(); ctx.shadowColor = 'transparent';
  text(str, 0, 4, 36, C.ink, { align: 'center' }); circle(0, -h / 2 + 4, 11, C.coral); ctx.restore();
}
/** an eye with a slash through it: "can't see" */
export function eyeOff(x, y, s = 1, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a; circle(0, 0, 58, rgba(C.deep, 0.85));
  ctx.strokeStyle = C.paper; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(0, -30, 34, 0); ctx.quadraticCurveTo(0, 30, -34, 0); ctx.stroke(); circle(0, 0, 9, C.paper);
  ctx.strokeStyle = C.coral; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-40, -36); ctx.lineTo(40, 36); ctx.stroke(); ctx.restore();
}
