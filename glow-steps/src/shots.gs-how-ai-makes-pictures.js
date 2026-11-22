// HOW DOES AI TURN WORDS INTO A PICTURE? Glow Steps episode: diffusion as three steps (static, clean up, repeat) + a twist.
// A shot: { id, at, cam, note, draw(lt, d, t) }. cam(lt, d, t) => { x, y, z, r, dx, dy } (own move per shot).
import { ctx, C, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle } from './core/lib.js';
import { L, Le, Wd } from './core/timing.js';
import * as K from './core/kit.js';

K.PILLS.splice(0, 4, 'static', 'clean up', 'repeat', 'twist');
K.PILL_TAGS.splice(0, 4, 'STEP 1', 'STEP 2', 'STEP 3', 'THEN');

// ── the picture card: a little original scene under a layer of animated static ──
const NOISE = ['#B3A0FF', '#F5F3FF', '#6246D9', '#A79FD0', '#382A66', '#8B6CFF', '#2A1F4D'];
function scene(v) { // local coords -286..286
  const g = ctx.createLinearGradient(0, -286, 0, 286);
  if (v === 0) { g.addColorStop(0, C.violetDark); g.addColorStop(0.6, C.coral); g.addColorStop(1, C.coralLight); }
  else { g.addColorStop(0, C.deep); g.addColorStop(0.6, C.ink2); g.addColorStop(1, C.violet); }
  ctx.fillStyle = g; ctx.fillRect(-290, -290, 580, 580);
  if (v === 0) {
    circle(90, -60, 74, C.coralLight);
    ctx.fillStyle = C.plum; ctx.beginPath(); ctx.moveTo(-290, 290); ctx.lineTo(-290, 60); ctx.lineTo(-170, -40); ctx.lineTo(-40, 110); ctx.lineTo(110, 20); ctx.lineTo(290, 150); ctx.lineTo(290, 290); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(-290, 290); ctx.lineTo(-290, 170); ctx.lineTo(-100, 140); ctx.lineTo(120, 220); ctx.lineTo(290, 190); ctx.lineTo(290, 290); ctx.closePath(); ctx.fill();
  } else {
    for (let k = 0; k < 9; k++) circle(-240 + rnd(k) * 480, -250 + rnd(k + 9) * 250, 3 + rnd(k + 4) * 3, K.rgba(C.paper, 0.8));
    circle(-90, -110, 62, C.paper); circle(-66, -126, 56, C.deep);
    ctx.fillStyle = C.ink; ctx.fillRect(-290, 40, 580, 250);
    for (let k = 0; k < 4; k++) { ctx.strokeStyle = K.rgba(C.paper, 0.4 - k * 0.07); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); for (let q = 0; q <= 10; q++) { const px = -260 + q * 52, py = 80 + k * 52 + Math.sin(q * 1.4 + k * 2) * 8; q ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  }
}
/** o: { rot, a, tag, edge, seed, fps, hi } · n = noise level 0..1 */
function card(x, y, size, v, n, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(size, size); ctx.globalAlpha *= o.a ?? 1;
  K.glass(-300, -300, 600, 600, 48, { blur: 40, dy: 16, edge: o.edge || K.rgba(C.violetLight, 0.5) });
  ctx.save(); rr(-286, -286, 572, 572, 36); ctx.clip();
  scene(v);
  if (n > 0.001) {
    const fr = Math.floor(t * (o.fps || 14)), sd = (o.seed || 0) * 977;
    for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) {
      const r = rnd(i * 53 + j * 17 + sd), a = clamp(n * 1.35 - r * 0.35); if (a < 0.02) continue;
      const r2 = rnd(i * 131 + j * 71 + fr * 389 + sd);
      ctx.globalAlpha = (o.a ?? 1) * a; ctx.fillStyle = NOISE[Math.floor(r2 * NOISE.length)]; ctx.fillRect(-286 + i * 22, -286 + j * 22, 22.5, 22.5);
    }
  }
  ctx.restore();
  if (o.hi) { ctx.save(); ctx.shadowColor = K.rgba(C.coral, 0.9 * o.hi); ctx.shadowBlur = 34; rr(-300, -300, 600, 600, 48); ctx.strokeStyle = K.rgba(C.coral, 0.95 * o.hi); ctx.lineWidth = 7; ctx.stroke(); ctx.restore(); }
  if (o.tag) { ctx.save(); ctx.font = '700 26px Inter'; const tw = ctx.measureText(o.tag).width + 44; rr(-300 + 26, -300 + 24, tw, 48, 24); ctx.fillStyle = K.rgba(C.deep, 0.78); ctx.fill(); ctx.restore(); K.text(o.tag, -300 + 48, -300 + 49, 26, C.paper, { ui: true, w: 700 }); }
  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0.02, t).toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const chip = (txt, x, y, t, at, rot, icon, i = 0) => { const q = seg(t, at, at + 0.35); if (q > 0) K.chip(txt, x, y, eob(q), rot + Math.sin(t * 2 + i) * 0.012, seg(t, at, at + 0.12), icon); };
  const shock = (cx, cy, t, at, rx = 520, ry = 110) => { const p = seg(t, at, at + 0.7); if (p > 0 && p < 1) { ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 10 * (1 - p); ctx.globalAlpha = 0.8 * (1 - p); ctx.beginPath(); ctx.ellipse(cx, cy, lerp(100, rx, eo(p)), lerp(24, ry, eo(p)), 0, 0, TAU); ctx.stroke(); ctx.restore(); } };

  const msgAt = (str, cx, cy, o = {}) => { ctx.save(); ctx.font = '700 34px Inter'; const w = ctx.measureText(str).width + 64; ctx.restore(); return K.msg(str, cx + w / 2, cy, { side: 'u', ...o }); };

  // ── key times ──
  const UT = [Le(2) - 0.25, Le(3) - 0.25, Le(4) - 0.2, Le(6) - 0.3];       // when each mint check lands
  const PS = [cut(2), cut(3), cut(4), cut(6)];                              // when each pill becomes current
  const uAt = (t) => UT.map((x) => seg(t, x, x + 0.5));
  const curAt = (t) => (t < PS[0] ? -1 : t < PS[1] ? 0 : t < PS[2] ? 1 : t < PS[3] ? 2 : t < cut(7) ? 3 : -1);
  const pillPose = (i, t) => {
    const intro = seg(t, cut(1) + 0.35 + i * 0.24, cut(1) + 0.8 + i * 0.24), p = seg(t, PS[i], PS[i] + 0.6), pp = {};
    if (t < PS[i]) return { a: 0.6 * eo(intro), dy: (1 - eo(intro)) * 150, rot: (1 - eo(intro)) * (i % 2 ? 0.2 : -0.2) };
    if (i === 0) { pp.sx = Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, Math.PI * 2, eo(p))))); pp.rot = (1 - eo(p)) * -0.2; }
    if (i === 1) { const a = t - PS[1]; pp.dy = a < 0.3 ? lerp(-220, 0, eo(a / 0.3)) : -30 * Math.exp(-9 * (a - 0.3)) * Math.abs(Math.sin((a - 0.3) * 14)); }
    if (i === 2) { const sx = eo(p); pp.sx = Math.max(0.05, sx); pp.dx = -(1 - sx) * 100; pp.a = 0.3 + 0.7 * sx; }
    if (i === 3) { pp.dy = lerp(260, 0, eo(p)) + Math.sin(p * 9) * 8 * (1 - p); pp.a = clamp(p * 3); pp.rot = Math.sin(p * 10) * 0.05 * (1 - p); }
    return pp;
  };
  const header = (t, o = {}) => {
    K.bg(t);
    const ri = eob(seg(t, cut(1), cut(1) + 0.5)), u = uAt(t), done = u.reduce((a, b) => a + b, 0), cur = curAt(t);
    const pulse = Math.max(...u.map((v) => (v > 0 && v < 1 ? Math.sin(Math.PI * v) : 0)));
    ctx.save(); ctx.translate(150, 330); ctx.scale(ri, ri); ctx.translate(-150, -330);
    K.ring(150, 330, 58, 4, o.final ? 4 : done, o.final ? '4' : String(Math.max(1, Math.min(4, cur + 1))), pulse * 0.9); ctx.restore();
    K.text('Words to picture', 250, 318, 50, C.paper, { a: ri }); K.text('how image AI works', 250, 372, 28, C.dim, { ui: true, a: ri });
    for (let i = 0; i < 4; i++) K.pill(i, u[i], cur === i, t, pillPose(i, t));
    const a = t - PS[1];
    if (a > 0.3 && a < 1.0) { const q = (a - 0.3) / 0.7; ctx.save(); ctx.strokeStyle = C.paper; ctx.globalAlpha = 0.7 * (1 - q); ctx.lineWidth = 8 * (1 - q); ctx.beginPath(); ctx.ellipse(K.pillX(1), K.PILL_Y + 60, lerp(60, 330, eo(q)), lerp(14, 60, eo(q)), 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    const b = seg(t, PS[2], PS[2] + 0.6);
    if (b > 0 && b < 1) { ctx.save(); ctx.fillStyle = C.coral; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 18; ctx.fillRect(K.pillX(2) - 100 + 200 * eo(b), K.PILL_Y - 40, 6, 80); ctx.restore(); }
    const c = seg(t, PS[3], PS[3] + 0.8);
    if (c > 0 && c < 1) K.chevrons(K.pillX(3), K.PILL_Y - 70, t, (1 - c) * 0.9);
    u.forEach((v, i) => { if (v > 0 && v < 1) K.burst(K.pillX(i) + 90, K.PILL_Y - 50, v, 7, 90, i * 5 + 3); });
  };
  const doneCues = (i) => { cue(UT[i], 'pop', { gain: 0.7 }); cue(UT[i] + 0.02, 'sparkle', { dur: 0.7, gain: 0.6 }); };
  const PX = 100, PY = 640, PW = 880, PH = 740;
  const CX = 540, CYY = 1010;   // the big card's resting spot

  // ───────────────────────── 1 · HOOK ─────────────────────────
  {
    const tWords = Wd('words', 0), tPic = Wd('picture', 0), tFew = Wd('few', 0);
    add({ id: 'S01', at: 0, note: 'headline; a prompt bubble, then a card of pure static with a ? that starts to clear; drifting roll pan; Pip peeks',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(480, 600, p), y: 960, z: lerp(1.0, 1.08, eio(p)), r: lerp(-0.014, 0.012, p) }; },
      draw(lt, d, t) {
        K.bg(t);
        const l1 = eob(seg(lt, 0.2, 0.6)), l2 = eob(seg(lt, 0.42, 0.82));
        ctx.save(); ctx.translate(540, 330); ctx.scale(l1, l1); K.text('A few words', 0, 0, 90, C.paper, { align: 'center' }); ctx.restore();
        ctx.save(); ctx.translate(540, 450); ctx.scale(l2, l2); ctx.font = '800 108px Sora'; const w = ctx.measureText('a picture?').width;
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('a picture?', 0, 0, 108, g, { align: 'center' }); ctx.restore();
        const bq = eob(seg(t, tFew - 0.1, tFew + 0.35)); if (bq > 0) msgAt('a calm sunset over hills', 540, 700, { s: bq, a: clamp(bq * 3) });
        const cp = eob(seg(lt, 0.8, 1.4)); if (cp > 0) card(CX, 1060, 0.78 * cp, 0, lerp(1, 0.8, eo(seg(t, tPic - 0.4, tPic + 0.3))), t, { tag: 'AI', rot: (1 - cp) * 0.3 });
        const qm = seg(t, tPic - 0.2, tPic + 0.3); if (qm > 0) K.text('?', 540, 1070, 220, K.rgba(C.paper, 0.85 * Math.min(1, qm * 2)), { align: 'center' });
        K.pip(880, lerp(1740, 1470, eo(seg(lt, 0.6, 1.2))), 0.7, { t, look: -1, lookY: -0.5, happy: t > tPic ? 1 : 0, wave: seg(t, tPic + 0.1, tPic + 0.4) });
      } });
    cue(0.1, 'pop', { gain: 0.5 }); cue(0.25, 'whoosh', { gain: 0.5 }); cue(0.9, 'slide', { dur: 0.4, gain: 0.5 }); cue(tFew, 'pop', { gain: 0.5 }); cue(tWords, 'tock', { gain: 0.4 }); cue(tPic, 'pop', { gain: 0.6 });
  }

  // ───────────────────────── 2 · three steps drop in ─────────────────────────
  {
    const st = cut(1), tTrick = Wd('trick', 1), tThree = Wd('three', 1);
    add({ id: 'S02', at: st, note: 'ghost numeral 3 + "3 steps" title drop in, the locked step pills rise one by one; tilt-down camera',
      cam: (lt, d) => ({ x: 540, y: lerp(780, 980, eo(clamp(lt / 1.6))), z: lerp(1.2, 1.0, eo(clamp(lt / 1.4))), r: lerp(0.035, 0, eo(clamp(lt / 1.2))) }),
      draw(lt, d, t) {
        header(t);
        K.stamp('3', 540, 1010, 900, { rot: 0.04, a: eo(seg(lt, 0.2, 0.7)), sc: lerp(1.5, 1, eo(seg(lt, 0.2, 0.8))) });
        const q = eob(seg(t, tThree - 0.1, tThree + 0.4)); if (q > 0) { ctx.save(); ctx.translate(540, 1010); ctx.rotate(-0.04); ctx.scale(q, q); ctx.font = '800 150px Sora'; const w = ctx.measureText('3 steps').width;
          const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('3 steps', 0, 0, 150, g, { align: 'center' }); ctx.restore(); }
        K.text('one simple trick', 540, 1150, 40, C.dim, { align: 'center', ui: true, a: eo(seg(t, tThree + 0.2, tThree + 0.6)) });
        chip('one trick', 540, 1400, t, tTrick, 0.04, 'unlock');
        K.pip(900, 1300, 0.55, { t, look: -1, lookY: -0.4, happy: t > tThree ? 1 : 0, wave: 0 });
      } });
    cue(st, 'whoosh'); [0, 1, 2, 3].forEach((i) => cue(st + 0.5 + i * 0.24, 'slide', { dur: 0.3, gain: 0.4 })); cue(tTrick, 'pop', { gain: 0.5 }); cue(tThree, 'thud', { gain: 0.7 });
  }

  // ───────────────────────── 3 · STEP 1: pure static ─────────────────────────
  {
    const st = cut(2), tStart = Wd('starts', 2), tStatic = Wd('static', 2), tTV = Wd('tv', 2), tSig = Wd('signal', 2);
    add({ id: 'S03', at: st, note: 'step 1 flips in; panel rises; a card of full animated static flips in; a scanline sweeps and a NO SIGNAL tag blinks on "signal"; left-to-right low pan',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(610, 470, eio(p)), y: lerp(1110, 940, eo(clamp(lt / 2.0))), z: lerp(1.0, 1.09, eio(p)), r: lerp(0.02, -0.012, p) }; },
      draw(lt, d, t) {
        header(t);
        const rise = eo(seg(t, st + 0.1, st + 0.6));
        ctx.save(); ctx.translate(0, (1 - rise) * 380); ctx.globalAlpha *= rise; K.panel(PX, PY, PW, PH, { rim: 0.3, label: 'random static', labelP: eo(seg(t, tStart, tStart + 0.5)) }); ctx.restore();
        const fp = seg(t, tStart + 0.2, tStatic + 0.1), fx = Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, Math.PI * 2, eo(fp)))));
        if (fp > 0) { ctx.save(); ctx.translate(CX, CYY); ctx.scale(fx, 1); ctx.translate(-CX, -CYY); card(CX, CYY, 0.98, 0, 1, t, { fps: 16 }); ctx.restore(); }
        const sw = seg(t, tTV, tSig + 0.1); if (sw > 0 && sw < 1) { const y = lerp(720, 1300, eio(sw)); ctx.save(); ctx.fillStyle = K.rgba(C.paper, 0.35); ctx.fillRect(250, y - 14, 580, 28); ctx.restore(); }
        shock(540, 1330, t, tStatic, 420, 80);
        const nq = seg(t, tSig, tSig + 0.3); if (nq > 0 && Math.sin(t * 14) > -0.4) { ctx.save(); ctx.translate(540, 1010); ctx.scale(eob(nq), eob(nq)); K.glass(-190, -52, 380, 104, 32, { top: K.rgba(C.deep, 0.9), bot: K.rgba(C.deep, 0.9) }); K.text('NO SIGNAL', 0, 4, 52, C.paper, { align: 'center' }); ctx.restore(); }
        chip('pure random static', 540, 1470, t, tStatic - 0.1, -0.04, 'eye');
      } });
    cue(st, 'whoosh'); cue(st + 0.35, 'pop', { gain: 0.5 }); cue(tStart, 'slide', { dur: 0.4, gain: 0.5 }); cue(tStart + 0.3, 'whoosh', { gain: 0.5 }); cue(tStatic, 'thud', { gain: 0.6 }); cue(tTV, 'zip', { dur: 0.5, gain: 0.5 }); cue(tSig + 0.05, 'pop', { gain: 0.6 }); doneCues(0);
  }

  // ───────────────────────── 4 · STEP 2: clean up a tiny bit, guided by your words ─────────────────────────
  {
    const st = cut(3), tClean = Wd('cleans', 3), tTiny = Wd('tiny', 3), tGuided = Wd('guided', 3);
    const land = tGuided + 0.5;
    add({ id: 'S04', at: st, note: 'step 2 drops with shockwave; the static card gets a little cleaner (a noise meter dips a bit); a prompt bubble flies in from the right with speed lines on "guided", lands with shake; a faint sun shows; pull-out',
      cam: (lt, d, t) => { const a = t - land; return { x: lerp(560, 540, eo(clamp(lt / 2))), y: lerp(1000, 930, eo(clamp(lt / 1.5))), z: lerp(1.16, 1.0, eo(clamp(lt / 2.2))), r: lerp(-0.03, 0, eo(clamp(lt / 1.4))), dx: a > 0 ? Math.exp(-8 * a) * Math.sin(a * 48) * 10 : 0, dy: a > 0 ? Math.exp(-8 * a) * Math.cos(a * 42) * 12 : 0 }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { rim: 0.3, label: 'clean up', labelP: eo(seg(lt, 0.2, 0.9)) });
        const n = lerp(1, 0.78, eio(seg(t, tClean, tTiny + 0.5))) - 0.1 * eo(seg(t, land, land + 0.7));
        card(CX, CYY - 20, 0.9, 0, n, t, { fps: 14 });
        // noise meter under the card
        const my = 1340; K.glass(240, my - 16, 600, 32, 16, { blur: 10, dy: 4 }); ctx.save(); rr(246, my - 10, 588 * n, 20, 10); ctx.fillStyle = C.coral; ctx.fill(); ctx.restore(); K.text('noise', 240, my - 44, 26, C.dim, { ui: true, w: 700 });
        // prompt bubble flies in with speed lines
        const fp = seg(t, tGuided - 0.15, land);
        if (fp > 0) {
          const x = lerp(1450, 540, eo(fp)); let y = 800, sc = 1; const a = t - land;
          if (fp < 1) { ctx.save(); ctx.strokeStyle = C.violetLight; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const yy = 740 + i * 34 + rnd(i) * 14, x1 = x + 330, len = 160 + rnd(i + 3) * 200; ctx.globalAlpha = 0.5 * (1 - fp); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x1 + len, yy); ctx.stroke(); } ctx.restore(); }
          if (a > 0) { y = 800 - 40 * Math.exp(-5 * a) * Math.abs(Math.sin(a * 11)); sc = 1 + Math.exp(-9 * a) * 0.08; }
          ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); msgAt('a calm sunset over hills', 0, 0, { s: 1, a: 1, hi: 0.8 + 0.2 * Math.sin(t * 6) }); ctx.restore();
        }
        shock(540, 1250, t, land, 520, 100);
        chip('a tiny bit', 330, 1470, t, tTiny - 0.05, -0.05, 'down');
        chip('guided by words', 640, 1560, t, tGuided, 0.04, 'pen');
      } });
    cue(st, 'zip', { dur: 0.4 }); cue(st + 0.35, 'thud', { gain: 0.6 }); cue(tClean, 'whoosh', { gain: 0.4 }); cue(tTiny, 'pop', { gain: 0.5 }); cue(tGuided - 0.1, 'whoosh', { gain: 0.6 }); cue(land, 'thud', { gain: 0.8 }); cue(land + 0.3, 'thud', { gain: 0.4 }); cue(tGuided, 'pop', { gain: 0.5 }); doneCues(1);
  }

  // ───────────────────────── 5 · STEP 3: repeat until a picture appears ─────────────────────────
  {
    const st = cut(4), tRep = Wd('repeats', 4), tAg1 = Wd('again', 4), tUntil = Wd('until', 4), tApp = Wd('appears', 4);
    const tAg2 = tAg1 + 0.45;
    const minis = [0.78, 0.58, 0.38, 0.18, 0], mAt = [tRep - 0.1, tRep + 0.3, tAg1, tAg2 + 0.1, tUntil + 0.35];
    add({ id: 'S05', at: st, note: 'step 3 writes on; five mini cards pop in one after another with chevron arrows between them (static fades each time) while the big card clears from static to the sunset on "appears"; orbiting roll camera',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(560, 520, p), y: lerp(880, 960, eio(p)), z: lerp(1.0, 1.06, eio(p)), r: Math.sin(lt * 1.0) * 0.03 }; },
      draw(lt, d, t) {
        header(t);
        const lp = eo(seg(lt, 0.15, 0.9)); K.text('repeat the cleanup', 540, 650, 52, C.paper, { align: 'center', a: lp });
        const n = lerp(0.78, 0, eio(seg(t, tRep, tApp + 0.1)));
        const bp = eob(seg(lt, 0.1, 0.6)); card(CX, 960, 0.8 * bp, 0, n, t, { fps: 12, tag: 'GETTING CLEARER' });
        minis.forEach((mn, i) => {
          const q = eob(seg(t, mAt[i], mAt[i] + 0.35)); if (q <= 0) return;
          const mx = 230 + i * 155;
          ctx.save(); ctx.translate(mx, 1320 + Math.sin(t * 3 + i) * 4); ctx.scale(q, q); ctx.translate(-mx, -1320); card(mx, 1320, 0.26, 0, mn, t, { fps: 8, seed: i + 1 }); ctx.restore();
          if (i < 4 && seg(t, mAt[i + 1], mAt[i + 1] + 0.2) > 0) { const ax = mx + 78, ay = 1320; ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(ax - 4, ay); ctx.lineTo(ax + 14, ay); ctx.moveTo(ax + 4, ay - 10); ctx.lineTo(ax + 14, ay); ctx.lineTo(ax + 4, ay + 10); ctx.stroke(); ctx.restore(); }
        });
        const cv = seg(t, tRep, tRep + 0.7); if (cv > 0 && cv < 1) K.chevrons(540, lerp(1500, 1200, eo(cv)), t, 1 - cv);
        chip('again and again', 540, 1520, t, tAg1 - 0.1, -0.04, 'up');
        K.burst(CX, 960, seg(t, tApp + 0.1, tApp + 0.9), 10, 330, 5);
      } });
    cue(st, 'slide', { dur: 0.5, gain: 0.6 }); cue(tRep, 'pop', { gain: 0.5 }); mAt.forEach((m) => cue(m, 'pop', { gain: 0.35 })); cue(tAg1, 'tock', { gain: 0.5 }); cue(tAg2, 'tock', { gain: 0.5 }); cue(tUntil, 'whoosh', { gain: 0.5 }); cue(tApp, 'sparkle', { dur: 0.8, gain: 0.6 }); doneCues(2);
  }

  // ───────────────────────── 6 · the name: diffusion ─────────────────────────
  {
    const st = cut(5), tDiff = Wd('diffusion', 5), tBrand = Wd('brand', 5), tPat = Wd('patterns', 5);
    add({ id: 'S06', at: st, note: 'title writes on with a cursor; the clean picture flips in; small thumbnails fly in from the sides and merge behind it on "patterns"; push-in with roll',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(500, 570, p), y: lerp(1000, 940, eo(p)), z: lerp(1.0, 1.15, eio(p)), r: lerp(-0.05, 0.015, eo(clamp(lt / 2))) }; },
      draw(lt, d, t) {
        header(t);
        const lp = eo(seg(t, tDiff - 0.3, tDiff + 0.5)); if (lp > 0) { ctx.save(); ctx.font = '800 100px Sora'; const lw = ctx.measureText('diffusion').width; ctx.beginPath(); ctx.rect(540 - lw / 2 - 20, 600, (lw + 40) * lp, 200); ctx.clip();
          const g = ctx.createLinearGradient(540 - lw / 2, 0, 540 + lw / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('diffusion', 540, 700, 100, g, { align: 'center' }); ctx.restore();
          if (lp < 1) { ctx.save(); ctx.font = '800 100px Sora'; const lw2 = ctx.measureText('diffusion').width; ctx.fillStyle = C.coral; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 18; ctx.fillRect(540 - lw2 / 2 + lw2 * lp, 640, 7, 120); ctx.restore(); } }
        // learned-pattern thumbnails fly in and merge
        for (let k = 0; k < 4; k++) { const q = seg(t, tPat - 0.1 + k * 0.08, tPat + 0.7 + k * 0.08); if (q > 0 && q < 1) { const fromL = k % 2 === 0, x = lerp(fromL ? -120 : 1200, 540, eio(q)), y = lerp(1100 + k * 80, 1060, eio(q)); card(x, y, 0.22, k % 2, 0, t, { a: 1 - seg(q, 0.7, 1), rot: (fromL ? -1 : 1) * (1 - q) * 0.6 }); } }
        const c1 = seg(t, st + 0.25, st + 0.85), fx = Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, Math.PI * 2, eo(c1)))));
        if (c1 > 0) { ctx.save(); ctx.translate(CX, 1090); ctx.scale(fx, 1); ctx.translate(-CX, -1090); card(CX, 1090, 0.72, 0, 0, t, { tag: 'NEW', hi: 0.5 + 0.4 * Math.sin(t * 5) }); ctx.restore(); }
        K.burst(CX, 1090, seg(t, tBrand, tBrand + 0.9), 9, 300, 3);
        chip('brand new picture', 540, 1500, t, tBrand, -0.04, 'unlock');
        chip('learned patterns', 540, 1590, t, tPat, 0.04, 'eye');
      } });
    cue(st, 'whoosh', { gain: 0.5 }); for (let k = 0; k < 8; k++) cue(tDiff - 0.3 + k * 0.09, 'tock', { gain: 0.3 }); cue(tBrand - 0.3, 'zip', { dur: 0.35, gain: 0.5 }); cue(tBrand, 'pop', { gain: 0.6 }); cue(tPat, 'whoosh', { gain: 0.5 }); cue(tPat + 0.5, 'sparkle', { dur: 0.6, gain: 0.5 });
  }

  // ───────────────────────── 7 · THE TWIST: same words, different static ─────────────────────────
  {
    const st = cut(6), tTwist = Wd('twist', 6), tSame = Wd('same', 6), tDiffS = Wd('static', 6), tGive = Wd('give', 6);
    add({ id: 'S07', at: st, note: 'step 4 rises with chevrons; one prompt bubble drops in; two cards of different static appear side by side; on "give" they clear to two different pictures and a coral not-equal sign lands between; diagonal sweep from top right',
      cam: (lt, d) => { const p = eio(lt / d); return { x: lerp(570, 500, p), y: lerp(760, 980, p), z: lerp(1.1, 1.03, p), r: lerp(0.03, -0.012, p) }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { rim: 0.3, label: 'the twist', labelP: eo(seg(lt, 0.2, 0.9)) });
        const bq = eob(seg(t, st + 0.45, st + 0.85)); if (bq > 0) msgAt('a calm sunset over hills', 540, 760, { s: bq, a: clamp(bq * 3) });
        const cq = eob(seg(t, tDiffS - 0.5, tDiffS + 0.1)), n = lerp(1, 0, eio(seg(t, tGive, tGive + 0.9)));
        if (cq > 0) {
          ctx.save(); ctx.translate(300, 1070); ctx.scale(cq, cq); ctx.translate(-300, -1070); card(300, 1070, 0.6, 0, n, t, { seed: 1, fps: 12, tag: 'STATIC A' }); ctx.restore();
          ctx.save(); ctx.translate(780, 1070); ctx.scale(cq, cq); ctx.translate(-780, -1070); card(780, 1070, 0.6, 1, n, t, { seed: 2, fps: 12, tag: 'STATIC B' }); ctx.restore();
        }
        const ne = eob(seg(t, tGive + 0.8, tGive + 1.2)); if (ne > 0) { ctx.save(); ctx.translate(540, 1070); ctx.scale(ne, ne); circle(0, 0, 54, C.deep); K.text('≠', 0, 6, 90, C.coral, { align: 'center' }); ctx.restore(); }
        K.burst(540, 1070, seg(t, tGive + 0.9, tGive + 1.7), 9, 200, 11);
        chip('same words', 540, 1450, t, tSame, -0.04, 'pen');
        chip('different static', 540, 1550, t, tDiffS - 0.05, 0.04, 'eye');
      } });
    cue(st, 'slide', { dur: 0.5, gain: 0.6 }); cue(tTwist, 'pop', { gain: 0.5 }); cue(st + 0.45, 'pop', { gain: 0.5 }); cue(tSame, 'tock', { gain: 0.4 }); cue(tDiffS - 0.4, 'whoosh', { gain: 0.5 }); cue(tDiffS, 'thud', { gain: 0.5 }); cue(tGive, 'zip', { dur: 0.5, gain: 0.5 }); cue(tGive + 0.85, 'thud', { gain: 0.6 }); doneCues(3);
  }

  // ───────────────────────── 8 · loop: it cleans up static ─────────────────────────
  {
    const st = cut(7), tSo = L(7), tClean = Wd('cleans', 7), tStat = Wd('static', 7);
    add({ id: 'S08', at: st, note: 'spotlight, ring full; a card of static with the prompt bubble; it clears into the sunset on "cleans up static", crown + confetti, Pip waves; settle-in zoom',
      cam: (lt, d) => ({ x: lerp(500, 540, eo(clamp(lt / 1.4))), y: lerp(880, 960, eio(clamp(lt / d))), z: lerp(1.2, 1.0, eo(clamp(lt / 1.6))), r: lerp(-0.04, 0, eo(clamp(lt / 1.4))) }),
      draw(lt, d, t) {
        header(t, { final: true });
        K.spot(540, eo(seg(lt, 0, 0.5)) * 0.7);
        const bq = eob(seg(t, tSo + 0.3, tSo + 0.75)); if (bq > 0) msgAt('a calm sunset over hills', 540, 690, { s: bq, a: clamp(bq * 3) });
        const n = lerp(1, 0, eio(seg(t, tClean, tStat + 0.4))), a = t - tStat - 0.2;
        let sy = 1, y = 1090; if (a > 0) { y = 1090 - 40 * Math.exp(-5 * a) * Math.abs(Math.sin(a * 11)); sy = 1 - Math.exp(-9 * a) * 0.06; }
        ctx.save(); ctx.translate(540, y); ctx.scale(1, sy); card(0, 0, 0.78, 0, n, t, { fps: 14, hi: seg(t, tStat + 0.2, tStat + 0.5) * (0.6 + 0.4 * Math.sin(t * 5)) }); ctx.restore();
        K.crown(740, y - 250, 0.55 * eob(seg(t, tStat + 0.3, tStat + 0.7)), seg(t, tStat + 0.3, tStat + 0.45), 0.2);
        shock(540, 1400, t, tStat + 0.2, 520, 100);
        K.pip(880, 1400, 0.7, { t, look: -1, lookY: -0.3, happy: 1, wave: seg(t, tStat + 0.1, tStat + 0.4) });
        K.confetti(t - tStat - 0.2, 46);
      } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(tSo + 0.3, 'pop', { gain: 0.5 }); cue(tClean, 'whoosh', { gain: 0.5 }); cue(tStat + 0.2, 'thud', { gain: 0.8 }); cue(tStat + 0.3, 'sparkle', { dur: 0.9, gain: 0.7 });
  }

  return { shots: S, cues: CUES };
}
