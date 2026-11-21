// WANT BETTER AI ANSWERS? SHOW IT ONE EXAMPLE. Glow Steps episode: few-shot prompting as three steps (job, example, ask again) + a check.
// A shot: { id, at, cam, note, draw(lt, d, t) }. cam(lt, d, t) => { x, y, z, r, dx, dy } (own move per shot).
import { ctx, C, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle } from './core/lib.js';
import { L, Wd, lineWords } from './core/timing.js';
import * as K from './core/kit.js';

K.PILLS.splice(0, 4, 'the job', 'example', 'ask again', 'check it');
K.PILL_TAGS.splice(0, 4, 'STEP 1', 'STEP 2', 'STEP 3', 'THEN');

const CAP1 = 'Golden hour. Zero filter.', CAP2 = 'Salt air. Zero rush.';
const BAD1 = 'Golden hour. Zeroo filter.', BAD2 = 'Salt air. Zeroo rush.';

// ── a little photo card (original art: sky, sun, hills or sea) ──
function photoCard(x, y, s, v, a = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  K.glass(-120, -95, 240, 190, 36, { blur: 26, dy: 12, edge: K.rgba(C.violetLight, 0.45) });
  ctx.save(); rr(-106, -81, 212, 162, 26); ctx.clip();
  const g = ctx.createLinearGradient(0, -81, 0, 81);
  if (v === 0) { g.addColorStop(0, C.violetDark); g.addColorStop(1, C.coral); } else { g.addColorStop(0, C.ink2); g.addColorStop(0.55, C.violet); g.addColorStop(1, C.coralLight); }
  ctx.fillStyle = g; ctx.fillRect(-120, -95, 240, 190);
  circle(v === 0 ? 46 : -30, v === 0 ? -14 : 8, 28, C.coralLight);
  if (v === 0) {
    ctx.fillStyle = C.plum; ctx.beginPath(); ctx.moveTo(-120, 95); ctx.lineTo(-60, -10); ctx.lineTo(0, 55); ctx.lineTo(60, 8); ctx.lineTo(120, 95); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(-120, 95); ctx.lineTo(-30, 40); ctx.lineTo(40, 95); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = C.ink2; ctx.fillRect(-120, 20, 240, 80);
    for (let k = 0; k < 3; k++) { ctx.strokeStyle = K.rgba(C.paper, 0.45); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); for (let q = 0; q <= 8; q++) { const px = -100 + q * 25, py = 38 + k * 22 + Math.sin(q * 1.6 + k) * 5; q ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  }
  ctx.restore(); ctx.restore();
}

// ── a caption card: tag + caption text. o: { w, typed 0..1, hi 0..1 (coral rim), edge, flaw 0..1 (underline the typo), tag } ──
function capCard(x, y, s, txt, o = {}) {
  const w = o.w ?? 760, h = o.h ?? 190, size = o.size ?? 44;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s); ctx.globalAlpha *= o.a ?? 1;
  K.glass(-w / 2, -h / 2, w, h, 44, { blur: 40, dy: 16, top: o.top, bot: o.bot, edge: o.edge || K.rgba(C.violetLight, 0.5) });
  if (o.hi) { ctx.save(); ctx.shadowColor = K.rgba(C.coral, 0.9 * o.hi); ctx.shadowBlur = 34; rr(-w / 2, -h / 2, w, h, 44); ctx.strokeStyle = K.rgba(C.coral, 0.95 * o.hi); ctx.lineWidth = 6; ctx.stroke(); ctx.restore(); }
  if (o.tag) { ctx.save(); ctx.font = '700 24px Inter'; const tw = ctx.measureText(o.tag).width + 40; rr(-w / 2 + 28, -h / 2 + 22, tw, 44, 22); ctx.fillStyle = K.rgba(C.violet, 0.55); ctx.fill(); ctx.restore(); K.text(o.tag, -w / 2 + 48, -h / 2 + 45, 24, C.paper, { ui: true, w: 700 }); }
  const n = Math.round(txt.length * clamp(o.typed ?? 1)), shown = txt.slice(0, n), tx = -w / 2 + 40, ty = h * 0.12;
  K.text(shown, tx, ty, size, C.white);
  if (o.typed != null && o.typed < 1 && o.typed > 0 && Math.sin(o.t * 16) > -0.2) { ctx.save(); ctx.font = `800 ${size}px Sora`; const cw = ctx.measureText(shown).width; ctx.fillStyle = C.coral; ctx.fillRect(tx + cw + 6, ty - size * 0.55, 7, size * 1.1); ctx.restore(); }
  if (o.flaw > 0) { // squiggle under the typo "Zeroo"
    ctx.save(); ctx.font = `800 ${size}px Sora`; const k = txt.indexOf('Zeroo'), pre = ctx.measureText(txt.slice(0, k)).width, wd = ctx.measureText('Zeroo').width;
    ctx.strokeStyle = C.coral; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.shadowColor = K.rgba(C.coral, 0.8); ctx.shadowBlur = 14; ctx.beginPath();
    const m = Math.floor(18 * clamp(o.flaw)); for (let q = 0; q <= m; q++) { const px = tx + pre + (wd * q) / 18, py = ty + size * 0.62 + (q % 2 ? 7 : -1); q ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0.02, t).toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const wd = (line, k) => lineWords(line)[k].s;
  const chip = (txt, x, y, t, at, rot, icon, i = 0) => { const q = seg(t, at, at + 0.35); if (q > 0) K.chip(txt, x, y, eob(q), rot + Math.sin(t * 2 + i) * 0.012, seg(t, at, at + 0.12), icon); };

  // ── key times ──
  const UT = [wd(2, 13) + 0.45, wd(3, 11) + 0.3, wd(4, 14) + 0.1, wd(6, 16) + 0.15];      // when each mint check lands
  const PS = [cut(2), cut(3), cut(4), cut(6)];                                              // when each pill becomes current
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
    K.text('Show, don’t tell', 250, 318, 50, C.paper, { a: ri }); K.text('better AI answers', 250, 372, 28, C.dim, { ui: true, a: ri });
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
  const shock = (cx, cy, t, at, rx = 520, ry = 110) => { const p = seg(t, at, at + 0.7); if (p > 0 && p < 1) { ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 10 * (1 - p); ctx.globalAlpha = 0.8 * (1 - p); ctx.beginPath(); ctx.ellipse(cx, cy, lerp(100, rx, eo(p)), lerp(24, ry, eo(p)), 0, 0, TAU); ctx.stroke(); ctx.restore(); } };
  const PX = 100, PY = 640, PW = 880, PH = 740;   // the shared chat panel
  const bubble1 = (t, txt, at, a = 1) => { const q = seg(t, at, at + 0.4); if (q > 0) K.msg(txt, PX + PW - 36, PY + 100, { side: 'u', s: eob(q), a: clamp(q * 3) * a }); };

  // ───────────────────────── 1 · HOOK: a bland answer, "no tricks" ─────────────────────────
  {
    const tBet = wd(0, 1), tAI = wd(0, 4), tTr = wd(0, 8);
    add({ id: 'S01', at: 0, note: 'headline; a chat gets a bland answer; "fancy tricks" note appears and is struck out; drifting roll pan; Pip peeks',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(480, 600, p), y: 960, z: lerp(1.0, 1.08, eio(p)), r: lerp(-0.014, 0.012, p) }; },
      draw(lt, d, t) {
        K.bg(t);
        const l1 = eob(seg(lt, 0.2, 0.6)), l2 = eob(seg(lt, 0.42, 0.82));
        ctx.save(); ctx.translate(540, 330); ctx.scale(l1, l1); K.text('Better AI answers?', 0, 0, 84, C.paper, { align: 'center' }); ctx.restore();
        ctx.save(); ctx.translate(540, 450); ctx.scale(l2, l2); ctx.font = '800 118px Sora'; const w = ctx.measureText('no tricks.').width;
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('no tricks.', 0, 0, 118, g, { align: 'center' }); ctx.restore();
        const pp = eob(seg(lt, 0.8, 1.3)); ctx.save(); ctx.translate(540, 900); ctx.scale(pp, pp); ctx.translate(-540, -900); ctx.globalAlpha *= clamp(pp * 2);
        K.panel(PX, 700, PW, 420, { rim: 0.25 });
        K.msg('Write a caption for my photo', PX + PW - 36, 790, { side: 'u', s: eob(seg(t, tBet, tBet + 0.4)), a: clamp(seg(t, tBet, tBet + 0.3) * 3) });
        K.msg('Here is a caption for your photo.', PX + 36, 920, { side: 'a', s: eob(seg(t, tAI, tAI + 0.4)), a: clamp(seg(t, tAI, tAI + 0.3) * 3) * 0.7 });
        ctx.restore();
        // the note "fancy tricks" appears, then a coral strike-through draws across it
        const nq = eob(seg(t, tTr - 0.1, tTr + 0.35)); if (nq > 0) { K.note('fancy tricks', 540, 1290, nq, -0.05 + Math.sin(t * 2) * 0.01, clamp(nq * 3));
          const sp = eo(seg(t, tTr + 0.45, tTr + 0.85)); if (sp > 0) { ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(340, 1330); ctx.lineTo(340 + 400 * sp, 1250); ctx.stroke(); ctx.restore(); } }
        K.pip(880, lerp(1740, 1470, eo(seg(lt, 0.6, 1.2))), 0.7, { t, look: -1, lookY: -0.5, happy: t > tTr ? 1 : 0, wave: seg(t, tTr + 0.5, tTr + 0.8) });
      } });
    cue(0.1, 'pop', { gain: 0.5 }); cue(0.25, 'whoosh', { gain: 0.5 }); cue(0.9, 'slide', { dur: 0.4, gain: 0.5 }); cue(tBet, 'pop', { gain: 0.5 }); cue(tAI, 'pop', { gain: 0.4 }); cue(tTr, 'pop', { gain: 0.6 }); cue(tTr + 0.5, 'zip', { dur: 0.3, gain: 0.5 });
  }

  // ───────────────────────── 2 · "three step move": the steps drop in ─────────────────────────
  {
    const st = cut(1), tThree = wd(1, 4), tSimple = wd(1, 3);
    add({ id: 'S02', at: st, note: 'ghost numeral 3 + "3 steps" title drop in, the locked step pills rise one by one; tilt-down camera',
      cam: (lt, d) => ({ x: 540, y: lerp(780, 980, eo(clamp(lt / 1.6))), z: lerp(1.2, 1.0, eo(clamp(lt / 1.4))), r: lerp(0.035, 0, eo(clamp(lt / 1.2))) }),
      draw(lt, d, t) {
        header(t);
        K.stamp('3', 540, 1010, 900, { rot: 0.04, a: eo(seg(lt, 0.2, 0.7)), sc: lerp(1.5, 1, eo(seg(lt, 0.2, 0.8))) });
        const q = eob(seg(t, tThree - 0.1, tThree + 0.4)); if (q > 0) { ctx.save(); ctx.translate(540, 1010); ctx.rotate(-0.04); ctx.scale(q, q); ctx.font = '800 150px Sora'; const w = ctx.measureText('3 steps').width;
          const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('3 steps', 0, 0, 150, g, { align: 'center' }); ctx.restore(); }
        K.text('one simple move', 540, 1150, 40, C.dim, { align: 'center', ui: true, a: eo(seg(t, tThree + 0.2, tThree + 0.6)) });
        chip('simple move', 540, 1400, t, tSimple, 0.04, 'unlock');
        K.pip(900, 1300, 0.55, { t, look: -1, lookY: -0.4, happy: t > tThree ? 1 : 0, wave: 0 });
      } });
    cue(st, 'whoosh'); [0, 1, 2, 3].forEach((i) => cue(st + 0.5 + i * 0.24, 'slide', { dur: 0.3, gain: 0.4 })); cue(tSimple, 'pop', { gain: 0.5 }); cue(tThree, 'thud', { gain: 0.7 });
  }

  // ───────────────────────── 3 · STEP 1: tell it the job ─────────────────────────
  {
    const st = cut(2), tTell = wd(2, 2), tWrite = wd(2, 7), tPhoto = wd(2, 13), tJob = wd(2, 5);
    add({ id: 'S03', at: st, note: 'step 1 flips in; panel rises, the request writes on (clipped reveal with cursor); a photo card spins in on "photo"; left-to-right low pan',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(610, 470, eio(p)), y: lerp(1110, 940, eo(clamp(lt / 2.0))), z: lerp(1.0, 1.09, eio(p)), r: lerp(0.02, -0.012, p) }; },
      draw(lt, d, t) {
        header(t);
        const rise = eo(seg(t, tTell - 0.2, tTell + 0.5));
        ctx.save(); ctx.translate(0, (1 - rise) * 380); ctx.globalAlpha *= rise; K.panel(PX, PY, PW, PH, { rim: 0.3, label: 'the job', labelP: eo(seg(t, tJob - 0.1, tJob + 0.5)) }); ctx.restore();
        // request writes on (clip reveal)
        const wp = seg(t, tWrite - 0.1, tPhoto + 0.1), txt = 'Write a short caption for my photo';
        ctx.save(); ctx.font = '700 34px Inter'; const bw = ctx.measureText(txt).width + 64, rx = PX + PW - 36;
        ctx.beginPath(); ctx.rect(rx - bw - 10, PY + 40, (bw + 20) * eo(wp), 120); ctx.clip();
        K.msg(txt, rx, PY + 110, { side: 'u', s: 1, a: wp > 0 ? 1 : 0 }); ctx.restore();
        if (wp > 0 && wp < 1) { ctx.save(); ctx.fillStyle = C.coral; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 16; ctx.fillRect(rx - bw + (bw + 4) * eo(wp), PY + 70, 6, 80); ctx.restore(); }
        // the photo spins in
        const pp = seg(t, tPhoto - 0.1, tPhoto + 0.6); if (pp > 0) photoCard(540, lerp(1500, 1050, eob(pp)), 1.45 * clamp(eob(pp), 0, 1.1), 0, clamp(pp * 3), (1 - eo(pp)) * 1.1);
        shock(540, 1200, t, tPhoto + 0.25, 420, 90);
        // waiting dots
        const dq = seg(t, tPhoto + 0.3, tPhoto + 0.6); if (dq > 0) { for (let k = 0; k < 3; k++) circle(480 + k * 60, 1300 + Math.sin(t * 8 + k) * 8, 12 * eob(dq), C.violetLight); }
        chip('say the job', 540, 1470, t, tJob, -0.04, 'pen');
      } });
    cue(st, 'whoosh'); cue(st + 0.35, 'pop', { gain: 0.5 }); cue(tTell, 'slide', { dur: 0.4, gain: 0.5 }); for (let k = 0; k < 6; k++) cue(tWrite + k * 0.22, 'tock', { gain: 0.3 });
    cue(tPhoto, 'whoosh', { gain: 0.5 }); cue(tPhoto + 0.35, 'thud', { gain: 0.6 }); cue(tJob, 'pop', { gain: 0.5 }); doneCues(0);
  }

  // ───────────────────────── 4 · STEP 2: paste one example ─────────────────────────
  {
    const st = cut(3), tPaste = wd(3, 2), tEx = wd(3, 4), tGood = wd(3, 7);
    const land = tPaste + 0.45;
    add({ id: 'S04', at: st, note: 'step 2 drops with shockwave; an example card slides in from the right with speed lines and lands; an EXAMPLE tag pops; a crown lands on "good"; shake on landing, pull-out',
      cam: (lt, d, t) => { const a = t - land; return { x: lerp(560, 540, eo(clamp(lt / 2))), y: lerp(1000, 930, eo(clamp(lt / 1.5))), z: lerp(1.16, 1.0, eo(clamp(lt / 2.2))), r: lerp(-0.03, 0, eo(clamp(lt / 1.4))), dx: a > 0 ? Math.exp(-8 * a) * Math.sin(a * 48) * 10 : 0, dy: a > 0 ? Math.exp(-8 * a) * Math.cos(a * 42) * 12 : 0 }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { rim: 0.3, label: 'the job', labelP: 1 });
        K.msg('Write a short caption for my photo', PX + PW - 36, PY + 110, { side: 'u', s: 1, a: 0.55 });
        photoCard(240, 1235, 0.8, 0, 1, -0.05);
        // example card: flies in from the right with speed lines
        const fp = seg(t, tPaste - 0.1, land), a = t - land;
        let x = lerp(1500, 540, eo(fp)), y = 960;
        if (fp > 0 && fp < 1) { ctx.save(); ctx.strokeStyle = C.violetLight; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const yy = 880 + i * 36 + rnd(i) * 14, x1 = x + 400, len = 160 + rnd(i + 3) * 200; ctx.globalAlpha = 0.5 * (1 - fp); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x1 + len, yy); ctx.stroke(); } ctx.restore(); }
        let sy = 1, sx = 1; if (a > 0) { y = 960 - 70 * Math.exp(-5 * a) * Math.abs(Math.sin(a * 11)); const sq = Math.exp(-9 * a) * 0.14; sy = 1 - sq; sx = 1 + sq * 0.5; }
        if (fp > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); capCard(0, 0, 1, CAP1, { tag: t > tEx ? 'EXAMPLE' : 'PASTE', rot: (1 - eo(fp)) * -0.18, hi: 0 }); ctx.restore(); }
        shock(540, 1080, t, land, 520, 100);
        // crown lands on "good"
        const cp = eob(seg(t, tGood - 0.05, tGood + 0.35)); if (cp > 0) { K.crown(790, lerp(790, 855, eo(seg(t, tGood - 0.05, tGood + 0.3))), 0.55 * cp, seg(t, tGood - 0.05, tGood + 0.15), 0.25); K.burst(790, 860, seg(t, tGood + 0.2, tGood + 1.0), 8, 110, 12); }
        // AI waits
        for (let k = 0; k < 3; k++) circle(560 + k * 60, 1250 + Math.sin(t * 8 + k) * 8, 12, C.violetLight);
        chip('just one example', 540, 1470, t, tEx, 0.04, 'up');
      } });
    cue(st, 'zip', { dur: 0.4 }); cue(st + 0.35, 'thud', { gain: 0.6 }); cue(tPaste, 'whoosh', { gain: 0.6 }); cue(land, 'thud', { gain: 0.8 }); cue(land + 0.3, 'thud', { gain: 0.4 }); cue(tEx, 'pop', { gain: 0.6 }); cue(tGood, 'pop', { gain: 0.6 }); cue(tGood + 0.1, 'sparkle', { dur: 0.7, gain: 0.5 }); doneCues(1);
  }

  // ───────────────────────── 5 · STEP 3: ask for a new one, it follows the style ─────────────────────────
  {
    const st = cut(4), tAsk = wd(4, 2), tNew = wd(4, 5), tWatch = wd(4, 8), tStyle = wd(4, 12), tFormat = wd(4, 14);
    const tp = (t) => seg(t, tWatch + 0.1, tStyle - 0.1);
    add({ id: 'S05', at: st, note: 'step 3 writes on; a fresh bubble + a flipped-in sea photo; the answer types out letter by letter; a coral arc links example to answer with "same style / same format" chips; orbiting roll camera',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(580, 500, p), y: lerp(880, 960, eio(p)), z: lerp(1.0, 1.1, eio(p)), r: Math.sin(lt * 1.0) * 0.03 }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { rim: 0.3, label: 'ask again', labelP: eo(seg(lt, 0.2, 0.9)) });
        const bq = eob(seg(t, tAsk, tAsk + 0.4)); if (bq > 0) K.msg('Now one for this photo', PX + PW - 36, PY + 110, { side: 'u', s: bq, a: clamp(bq * 3) });
        capCard(540, 900, 0.92, CAP1, { tag: 'EXAMPLE', w: 760, a: 0.95 });
        // new photo flips in
        const fp = seg(t, tNew - 0.1, tNew + 0.5), fx = Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, Math.PI * 2, eo(fp))))); if (fp > 0) { ctx.save(); ctx.translate(240, 1215); ctx.scale(fx, 1); ctx.translate(-240, -1215); photoCard(240, 1215, 0.8, 1, 1, 0.04); ctx.restore(); }
        // the answer types out
        const aq = eob(seg(t, tWatch, tWatch + 0.35)); if (aq > 0) capCard(660, 1215, aq, CAP2, { w: 580, h: 170, size: 38, tag: 'NEW', typed: tp(t), t, edge: K.rgba(C.coral, 0.7), top: '#4A3A86', bot: '#33266B' });
        // coral arc from example card to answer: "same style"
        const ap = eo(seg(t, tStyle, tStyle + 0.5)); if (ap > 0) { ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 20; ctx.setLineDash([26, 18]); ctx.lineDashOffset = -t * 40; ctx.beginPath();
          const n = Math.floor(40 * ap); for (let k = 0; k <= n; k++) { const u = k / 40, px = lerp(900, 880, u) + Math.sin(u * Math.PI) * 80, py = lerp(1000, 1130, u); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.restore(); }
        chip('follows your style', 540, 1470, t, tStyle, -0.04, 'up', 0);
        const fq = eob(seg(t, tFormat, tFormat + 0.35)); if (fq > 0) K.chip('same format', 730, 1335, fq * 0.82, 0.05, clamp(fq * 3), 'eye');
      } });
    cue(st, 'slide', { dur: 0.5, gain: 0.6 }); cue(tAsk, 'pop', { gain: 0.5 }); cue(tNew, 'whoosh', { gain: 0.5 }); cue(tNew + 0.3, 'pop', { gain: 0.5 });
    for (let k = 0; k < 8; k++) cue(tWatch + 0.1 + k * 0.17, 'tock', { gain: 0.3 }); cue(tStyle, 'zip', { dur: 0.4, gain: 0.5 }); cue(tStyle + 0.1, 'pop', { gain: 0.5 }); cue(tFormat, 'pop', { gain: 0.5 }); doneCues(2);
  }

  // ───────────────────────── 6 · the name: few shot prompting, each example is a shot ─────────────────────────
  {
    const st = cut(5), tFew = wd(5, 2), tPrompt = wd(5, 4), tEach = wd(5, 6), tShot = wd(5, 10), tFewB = wd(5, 13), tGoodB = wd(5, 14);
    add({ id: 'S06', at: st, note: 'title writes on with a cursor; the example card is tagged "shot 1"; two more cards drop in with bounces labelled shot 2 and shot 3; push-in with roll',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(500, 570, p), y: lerp(1000, 940, eo(p)), z: lerp(1.0, 1.15, eio(p)), r: lerp(-0.05, 0.015, eo(clamp(lt / 2))) }; },
      draw(lt, d, t) {
        header(t);
        const lp = eo(seg(t, tFew - 0.1, tPrompt + 0.5)); if (lp > 0) { ctx.save(); ctx.font = '800 78px Sora'; const lw = ctx.measureText('few-shot prompting').width; ctx.beginPath(); ctx.rect(540 - lw / 2 - 20, 600, (lw + 40) * lp, 200); ctx.clip();
          const g = ctx.createLinearGradient(540 - lw / 2, 0, 540 + lw / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('few-shot prompting', 540, 700, 78, g, { align: 'center' }); ctx.restore();
          if (lp < 1) { ctx.save(); ctx.font = '800 78px Sora'; const lw2 = ctx.measureText('few-shot prompting').width; ctx.fillStyle = C.coral; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 18; ctx.fillRect(540 - lw2 / 2 + lw2 * lp, 650, 7, 100); ctx.restore(); } }
        // three cards: shot 1 (the example) flips in on "each", shots 2 and 3 drop on "few good"
        const ys = [960, 1130, 1300];
        [1, 2].forEach((k) => { const ga = eo(seg(t, st + 0.9 + k * 0.2, st + 1.4 + k * 0.2)) * (1 - seg(t, k === 1 ? tFewB + 0.1 : tGoodB + 0.1, k === 1 ? tFewB + 0.3 : tGoodB + 0.3)); if (ga > 0) K.panel(180, ys[k] - 75, 720, 150, { ghost: ga }); });
        const c1 = seg(t, st + 0.15, st + 0.65), fx = Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, Math.PI * 2, eo(c1)))));
        if (c1 > 0) { ctx.save(); ctx.translate(540, ys[0]); ctx.scale(fx, 1); capCard(0, 0, 1, CAP1, { tag: t > tShot ? 'SHOT 1' : 'EXAMPLE', w: 720, h: 150, size: 40 }); ctx.restore(); }
        [[tFewB, 'Sunny day. No rush.', 1], [tGoodB, 'Fresh bread. No fuss.', 2]].forEach(([ta, tx, k]) => {
          const p = seg(t, ta - 0.3, ta + 0.1), a = t - ta - 0.1; if (p <= 0) return;
          let y = lerp(520, ys[k], p * p), sy = 1; if (a > 0) { y = ys[k] - 50 * Math.exp(-5 * a) * Math.abs(Math.sin(a * 11)); sy = 1 - Math.exp(-9 * a) * 0.12; }
          ctx.save(); ctx.translate(540, y); ctx.scale(1, sy); capCard(0, 0, 1, tx, { tag: 'SHOT ' + (k + 1), w: 720, h: 150, size: 40, rot: k === 1 ? 0.02 : -0.02 }); ctx.restore(); shock(540, ys[k] + 90, t, ta + 0.1, 420, 70);
        });
        const ex = seg(t, tShot, tShot + 0.5); if (ex > 0) K.burst(540, ys[0], ex, 8, 140, 7);
        chip('each example = a shot', 540, 1470, t, tShot - 0.05, -0.04, 'unlock');
        const bq = eob(seg(t, wd(5, 15), wd(5, 15) + 0.35)); if (bq > 0) K.chip('a few is better', 690, 790, bq * 0.78, 0.06, clamp(bq * 3), 'up');
      } });
    cue(st, 'whoosh', { gain: 0.5 }); for (let k = 0; k < 8; k++) cue(tFew + k * 0.09, 'tock', { gain: 0.3 }); cue(tPrompt + 0.4, 'pop', { gain: 0.5 }); cue(tEach, 'whoosh', { gain: 0.5 }); cue(tEach + 0.3, 'pop', { gain: 0.6 }); cue(tShot, 'pop', { gain: 0.6 });
    cue(tFewB - 0.2, 'zip', { dur: 0.35, gain: 0.5 }); cue(tFewB + 0.1, 'thud', { gain: 0.6 }); cue(tGoodB - 0.2, 'zip', { dur: 0.35, gain: 0.5 }); cue(tGoodB + 0.1, 'thud', { gain: 0.6 }); cue(wd(5, 15), 'pop', { gain: 0.5 });
  }

  // ───────────────────────── 7 · THEN: check it, the flaw gets copied ─────────────────────────
  {
    const st = cut(6), tCheck = wd(6, 1), tFlaw = wd(6, 10), tCopy = wd(6, 14), tToo = wd(6, 16);
    add({ id: 'S07', at: st, note: 'step 4 rises with chevrons; example card (with a typo) and the answer; a magnifier scans, the typo gets a coral squiggle on "flaw", the answer copies it on "copy", an arrow bounces between them; diagonal sweep from top right',
      cam: (lt, d) => { const p = eio(lt / d); return { x: lerp(620, 470, p), y: lerp(760, 980, p), z: lerp(1.14, 1.04, p), r: lerp(0.035, -0.012, p) }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { rim: 0.3, label: 'check it', labelP: eo(seg(lt, 0.2, 0.9)) });
        // magnifier sweeps across the example card while "check the result" is said
        capCard(540, 900, 0.95, BAD1, { tag: 'EXAMPLE', flaw: seg(t, tFlaw, tFlaw + 0.5), hi: 0 });
        const aq = eob(seg(t, tCheck - 0.1, tCheck + 0.4)); const copied = seg(t, tCopy, tCopy + 0.4);
        if (aq > 0) capCard(540, 1210, aq, BAD2, { w: 760, h: 170, size: 42, tag: 'NEW', edge: K.rgba(C.coral, 0.6), flaw: seg(t, tToo - 0.1, tToo + 0.4), top: '#4A3A86', bot: '#33266B' });
        const mp = eio(seg(t, tCheck, tFlaw - 0.1)); if (mp > 0 && mp < 1.001 && t < tFlaw + 0.7) K.magnifier(lerp(260, 700, mp), lerp(1050, 905, mp) + Math.sin(mp * 10) * 12, eob(seg(t, tCheck, tCheck + 0.3)), 1 - eo(seg(t, tFlaw + 0.3, tFlaw + 0.7)));
        // an arrow from the typo down to the copy
        const ar = eo(seg(t, tCopy, tCopy + 0.5)); if (ar > 0) { ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 20; const y0 = 1010, y1 = lerp(1010, 1110, ar) + Math.sin(t * 9) * 4;
          ctx.beginPath(); ctx.moveTo(760, y0); ctx.lineTo(760, y1); ctx.stroke(); if (ar > 0.8) { ctx.beginPath(); ctx.moveTo(735, y1 - 22); ctx.lineTo(760, y1 + 8); ctx.lineTo(785, y1 - 22); ctx.stroke(); } ctx.restore(); }
        chip('flaw in, flaw out', 540, 1470, t, tFlaw - 0.1, -0.04, 'eye');
        K.pip(900, 1360, 0.5, { t, look: -1, lookY: -0.3, happy: 0, wave: 0 });
      } });
    cue(st, 'slide', { dur: 0.5, gain: 0.6 }); cue(tCheck, 'pop', { gain: 0.5 }); cue(tCheck + 0.2, 'whoosh', { gain: 0.4 }); cue(tFlaw, 'zip', { dur: 0.35, gain: 0.5 }); cue(tFlaw + 0.4, 'pop', { gain: 0.5 });
    cue(tCopy, 'whoosh', { gain: 0.5 }); cue(tCopy + 0.3, 'thud', { gain: 0.5 }); cue(tToo, 'tock', { gain: 0.6 }); doneCues(3);
  }

  // ───────────────────────── 8 · loop: don't only tell, show ─────────────────────────
  {
    const st = cut(7), tTell = wd(7, 3), tShow = wd(7, 8), tIt = wd(7, 9);
    add({ id: 'S08', at: st, note: 'spotlight, ring full; a small dim TELL bubble on the left, then a big glowing SHOW example card lands with a bounce, crown + confetti; Pip waves; settle-in zoom',
      cam: (lt, d) => ({ x: lerp(500, 540, eo(clamp(lt / 1.4))), y: lerp(880, 960, eio(clamp(lt / d))), z: lerp(1.2, 1.0, eo(clamp(lt / 1.6))), r: lerp(-0.04, 0, eo(clamp(lt / 1.4))) }),
      draw(lt, d, t) {
        header(t, { final: true });
        K.spot(540, eo(seg(lt, 0, 0.5)) * 0.7);
        const tq = eob(seg(t, tTell - 0.1, tTell + 0.35)); if (tq > 0) { ctx.save(); ctx.translate(540, 740); ctx.scale(tq, tq); ctx.globalAlpha *= clamp(tq * 2) * (1 - 0.55 * eo(seg(t, tShow - 0.3, tShow)));
          K.msg('Write a caption', -150, 0, { side: 'a', s: 1, a: 1 }); K.text('TELL', -130, -70, 40, C.dim, { ui: true, w: 700 }); ctx.restore(); }
        const sp = seg(t, tShow - 0.5, tShow + 0.1), a = t - tShow - 0.1;
        if (sp > 0) { let y = lerp(900, 1050, sp * sp), sy = 1; if (a > 0) { y = 1050 - 80 * Math.exp(-5 * a) * Math.abs(Math.sin(a * 11)); sy = 1 - Math.exp(-9 * a) * 0.12; }
          ctx.save(); ctx.translate(540, y); ctx.scale(1, sy); photoCard(-250, 0, 0.9, 0, 1, -0.06); capCard(70, 0, 1, 'Golden hour.', { w: 520, h: 190, size: 46, tag: 'SHOW', hi: 0.6 + 0.4 * Math.sin(t * 5) }); ctx.restore();
          K.crown(660, y - 118, 0.55 * eob(seg(t, tShow + 0.15, tShow + 0.55)), seg(t, tShow + 0.15, tShow + 0.3), 0.2); shock(540, 1200, t, tShow + 0.1, 520, 100); }
        K.pip(880, 1360, 0.7, { t, look: -1, lookY: -0.3, happy: 1, wave: seg(t, tIt - 0.1, tIt + 0.3) });
        K.confetti(t - tShow - 0.1, 46);
      } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(tTell, 'pop', { gain: 0.5 }); cue(tShow - 0.4, 'zip', { dur: 0.35, gain: 0.5 }); cue(tShow + 0.1, 'thud', { gain: 0.8 }); cue(tShow + 0.2, 'sparkle', { dur: 0.9, gain: 0.7 }); cue(tIt, 'pop', { gain: 0.5 });
  }

  return { shots: S, cues: CUES };
}
