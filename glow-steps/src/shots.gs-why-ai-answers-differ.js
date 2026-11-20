// WHY DOES AI GIVE DIFFERENT ANSWERS EVERY TIME? Glow Steps episode: next-word ranking, a weighted dice, branching paths, a temperature dial.
// A shot: { id, at, cam, note, draw(lt, d, t) }. cam(lt, d, t) => { x, y, z, r, dx, dy } (own move per shot).
import { ctx, C, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle } from './core/lib.js';
import { L, Wd, lineWords } from './core/timing.js';
import * as K from './core/kit.js';

K.PILLS.splice(0, 4, 'one word', 'dice roll', 'the dial', 'your move');

const wd = (line, k) => lineWords(line)[k].s;          // start of the k-th word of a line (for repeated words)
const NAMES = ['Mochi', 'Luna', 'Pixel', 'Biscuit'];

// ── one die: face 1-6, rotation, size ──
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function die(x, y, s, face, rot = 0, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  K.glass(-110, -110, 220, 220, 52, { blur: 40, dy: 18, top: '#5A45A8', bot: '#3A2C78', edge: 'rgba(255,255,255,0.35)' });
  PIPS[face].forEach(([px, py], i) => circle(px * 52, py * 52, 17, i % 2 ? C.coralLight : C.paper));
  ctx.restore();
}
// ── a tiny chat panel: a user line and an AI answer ──
function chatPanel(x, y, w, h, o) {
  K.panel(x, y, w, h, { rim: o.rim ?? 0.25 });
  if (o.u > 0) K.msg('Name my cat', x + w - 30, y + 90, { side: 'u', s: eob(o.u), a: clamp(o.u * 3) });
  if (o.a > 0) K.msg(o.ans, x + 30, y + 200, { side: 'a', s: eob(o.a), a: clamp(o.a * 3), hi: o.hi });
}
function ghostWord(str, x, y, size, a = 1) { K.text(str, x, y, size, C.paper, { align: 'center', a }); }

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0.02, t).toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const chip = (txt, x, y, t, at, rot, icon, i = 0) => { const q = seg(t, at, at + 0.35); if (q > 0) K.chip(txt, x, y, eob(q), rot + Math.sin(t * 2 + i) * 0.012, seg(t, at, at + 0.12), icon); };

  // ── key times ──
  const UT = [wd(1, 16) + 0.12, wd(3, 16) + 0.12, wd(4, 15) + 0.35, wd(5, 17) + 0.12];     // when each mint check lands
  const PS = [cut(1), cut(2), cut(4), cut(5)];                                                // when each pill becomes current
  const uAt = (t) => UT.map((x) => seg(t, x, x + 0.5));
  const curAt = (t) => (t < cut(1) ? -1 : t < cut(2) ? 0 : t < cut(4) ? 1 : t < cut(5) ? 2 : t < cut(6) ? 3 : -1);
  const pillPose = (i, t) => {
    const p = seg(t, PS[i], PS[i] + 0.6), pp = {};
    if (t < PS[i]) return i === 0 ? { a: 0 } : { a: 0.6 * seg(t, PS[0], PS[0] + 0.5) };
    if (i === 0) { pp.sx = Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, Math.PI * 2, eo(p))))); pp.rot = (1 - eo(p)) * -0.2; }
    if (i === 1) { const a = t - PS[1]; pp.dy = a < 0.3 ? lerp(-220, 0, eo(a / 0.3)) : -30 * Math.exp(-9 * (a - 0.3)) * Math.abs(Math.sin((a - 0.3) * 14)); }
    if (i === 2) { const sx = eo(p); pp.sx = Math.max(0.05, sx); pp.dx = -(1 - sx) * 100; pp.a = 0.3 + 0.7 * sx; }
    if (i === 3) { pp.dy = lerp(260, 0, eo(p)) + Math.sin(p * 9) * 8 * (1 - p); pp.a = clamp(p * 3); pp.rot = Math.sin(p * 10) * 0.05 * (1 - p); }
    return pp;
  };
  const header = (t, o = {}) => {
    K.bg(t);
    const u = uAt(t), done = u.reduce((a, b) => a + b, 0), cur = curAt(t), pulse = Math.max(...u.map((v) => (v > 0 && v < 1 ? Math.sin(Math.PI * v) : 0)));
    K.ring(150, 330, 58, 4, o.final ? 4 : done, o.final ? '4' : String(Math.max(1, Math.min(4, cur + 1))), pulse * 0.9);
    K.text('Why answers vary', 250, 318, 50, C.paper); K.text('the dice inside AI', 250, 372, 28, C.dim, { ui: true });
    for (let i = 0; i < 4; i++) K.pill(i, u[i], cur === i, t, pillPose(i, t));
    const a = t - PS[1];   // shockwave under pill 2
    if (a > 0.3 && a < 1.0) { const q = (a - 0.3) / 0.7; ctx.save(); ctx.strokeStyle = C.paper; ctx.globalAlpha = 0.7 * (1 - q); ctx.lineWidth = 8 * (1 - q); ctx.beginPath(); ctx.ellipse(K.pillX(1), K.PILL_Y + 60, lerp(60, 330, eo(q)), lerp(14, 60, eo(q)), 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    const b = seg(t, PS[2], PS[2] + 0.6);   // write-on cursor for pill 3
    if (b > 0 && b < 1) { ctx.save(); ctx.fillStyle = C.coral; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 18; ctx.fillRect(K.pillX(2) - 100 + 200 * eo(b), K.PILL_Y - 40, 6, 80); ctx.restore(); }
    const c = seg(t, PS[3], PS[3] + 0.8);   // chevrons for pill 4
    if (c > 0 && c < 1) K.chevrons(K.pillX(3), K.PILL_Y - 70, t, (1 - c) * 0.9);
    u.forEach((v, i) => { if (v > 0 && v < 1) K.burst(K.pillX(i) + 90, K.PILL_Y - 50, v, 7, 90, i * 5 + 3); });
  };

  // ───────────────────────── 1 · HOOK: two chats, same question, two answers ─────────────────────────
  {
    const tAsk = wd(0, 1), tTwice = wd(0, 6), tTwo = wd(0, 12), tDiff = wd(0, 13);
    add({ id: 'S01', at: 0, note: 'headline, two chat panels get the same question, then two different answers; slow drifting roll',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(480, 595, p), y: 960, z: lerp(1.0, 1.08, eio(p)), r: lerp(-0.014, 0.012, p) }; },
      draw(lt, d, t) {
        K.bg(t);
        const l1 = eob(seg(lt, 0.2, 0.6)), l2 = eob(seg(lt, 0.42, 0.82));
        ctx.save(); ctx.translate(540, 330); ctx.scale(l1, l1); K.text('Same question,', 0, 0, 84, C.paper, { align: 'center' }); ctx.restore();
        ctx.save(); ctx.translate(540, 450); ctx.scale(l2, l2); ctx.font = '800 118px Sora'; const w = ctx.measureText('new answer?').width;
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('new answer?', 0, 0, 118, g, { align: 'center' }); ctx.restore();
        chatPanel(80, 620, 440, 440, { u: seg(t, tAsk, tAsk + 0.4), a: seg(t, tTwo, tTwo + 0.4), ans: 'Mochi!' });
        const pr = eob(seg(t, tTwice - 0.1, tTwice + 0.4));
        ctx.save(); ctx.translate(780, 840); ctx.scale(pr, pr); ctx.translate(-780, -840); chatPanel(560, 620, 440, 440, { u: seg(t, tTwice + 0.1, tTwice + 0.5), a: seg(t, tDiff, tDiff + 0.4), ans: 'Luna!' }); ctx.restore();
        const ne = eob(seg(t, tDiff + 0.2, tDiff + 0.6)); if (ne > 0) { ctx.save(); ctx.translate(540, 1140); ctx.scale(ne, ne); ctx.rotate(-0.08); K.text('≠', 0, 0, 150, C.coral, { align: 'center' }); ctx.restore(); }
        K.pip(540, 1320, 0.6, { t, look: 0, lookY: -0.4, happy: t > tDiff ? 1 : 0, wave: 0 });
      } });
    cue(0.1, 'pop', { gain: 0.5 }); cue(0.25, 'whoosh', { gain: 0.5 }); cue(tAsk, 'pop', { gain: 0.5 }); cue(tTwice, 'whoosh', { gain: 0.5 }); cue(tTwice + 0.2, 'pop', { gain: 0.5 });
    cue(tTwo, 'pop', { gain: 0.5 }); cue(tDiff, 'pop', { gain: 0.5 }); cue(tDiff + 0.25, 'thud', { gain: 0.6 });
  }

  // ───────────────────────── 2 · step 1: it builds the reply one word at a time ─────────────────────────
  {
    const st = cut(1);
    const TOK = ['The', "cat's", 'name', 'is', 'Mochi'], TT = [wd(1, 9), wd(1, 10), wd(1, 11), wd(1, 12), wd(1, 16) - 0.1];
    ctx.save(); ctx.font = '800 56px Sora'; const TW = TOK.map((s) => ctx.measureText(s).width + 64); ctx.restore();
    add({ id: 'S02', at: st, note: 'step 1 flips in; panel writes itself word by word (tokens drop in, cursor blinks); pan down-right',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(600, 480, eio(p)), y: lerp(930, 830, eo(p)), z: lerp(1.0, 1.09, eio(p)), r: lerp(0.02, -0.01, p) }; },
      draw(lt, d, t) {
        header(t);
        const q = eo(seg(lt, 0.2, 0.7));
        ctx.save(); ctx.globalAlpha *= q; K.panel(100, 650, 860, 560, { rim: 0.3, label: 'AI is typing…', labelP: eo(seg(lt, 0.3, 1.1)) }); ctx.restore();
        // flow layout, two rows
        const rows = [[0, 1, 2], [3, 4]];
        rows.forEach((r, ri) => {
          const tot = r.reduce((a, k) => a + TW[k], 0) + (r.length - 1) * 24; let x = 530 - tot / 2;
          r.forEach((k) => {
            const p = seg(t, TT[k] - 0.05, TT[k] + 0.4), cx = x + TW[k] / 2, cy = 830 + ri * 190; x += TW[k] + 24;
            if (p > 0) { ctx.save(); ctx.translate(cx, cy + (1 - eo(p)) * -70); ctx.scale(eob(p), eob(p)); ctx.globalAlpha *= clamp(p * 3);
              K.glass(-TW[k] / 2, -62, TW[k], 124, 44, { blur: 24, dy: 10, top: k === 4 ? C.violet : undefined, bot: k === 4 ? C.violetDark : undefined }); K.text(TOK[k], 0, 4, 56, C.white, { align: 'center' }); ctx.restore(); }
          });
        });
        // blinking cursor after the latest token
        const last = TT.filter((x) => t > x).length - 1;
        if (last >= 0 && last < 4) { const ri = last < 3 ? 0 : 1, r = rows[ri], tot = r.reduce((a, k) => a + TW[k], 0) + (r.length - 1) * 24; let x = 530 - tot / 2; r.forEach((k) => { if (k <= last) x += TW[k] + 24; });
          if (Math.sin(t * 14) > -0.2) { ctx.fillStyle = C.coral; ctx.fillRect(x - 6, 830 + ri * 190 - 44, 8, 88); } }
        chip('one word at a time', 430, 1440, t, wd(1, 12), -0.04, 'pen');
        K.pip(900, 1330, 0.55, { t, look: -1, lookY: -0.5, happy: 0, wave: 0 });
      } });
    cue(st, 'whoosh'); cue(st + 0.3, 'slide', { dur: 0.35, gain: 0.5 }); TT.forEach((x, i) => cue(x, i === 4 ? 'pop' : 'tock', { gain: 0.5 })); cue(wd(1, 12), 'pop', { gain: 0.5 });
    cue(UT[0], 'pop', { gain: 0.7 }); cue(UT[0] + 0.02, 'sparkle', { dur: 0.7, gain: 0.6 });
  }

  // ── bars shared by shots 3 and 4: the ranked next words ──
  const BX = 170, BMAX = 640, BW = [640, 470, 330, 200], BY = (i) => 840 + i * 118;
  const bars = (t, grow, o = {}) => {
    const a = o.a ?? 1;
    for (let i = 0; i < 4; i++) {
      const p = eo(grow[i]); if (p <= 0) continue;
      const w = Math.max(96, BW[i] * p), y = BY(i), hi = o.hi === i ? 1 : 0;
      ctx.save(); ctx.globalAlpha *= a;
      if (hi) { ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 30; }
      const g = ctx.createLinearGradient(BX, 0, BX + BMAX, 0); g.addColorStop(0, C.violet); g.addColorStop(1, i === 0 ? C.coral : C.violetLight);
      rr(BX, y - 48, w, 96, 40); ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent';
      rr(BX + 1, y - 47, w - 2, 94, 39); ctx.strokeStyle = hi ? C.coralLight : 'rgba(255,255,255,0.25)'; ctx.lineWidth = hi ? 5 : 2; ctx.stroke();
      K.text(NAMES[i], BX + 38, y + 3, 46, C.white); ctx.restore();
    }
  };
  const promptTile = (x, y, p, a = 1) => { if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(p, p); ctx.globalAlpha *= a; K.glass(-330, -52, 660, 104, 44, { blur: 26, dy: 10 }); K.text("The cat's name is", -290, 3, 42, C.paper); K.text('…', 215, 0, 50, C.coralLight); ctx.restore(); };

  // ───────────────────────── 3 · it ranks the next words, the top pick can lose ─────────────────────────
  {
    const st = cut(2), tTop = wd(2, 13), tNot = wd(2, 15), tAlw = wd(2, 16), tWin = wd(2, 17);
    const grow = (t) => [seg(t, wd(2, 4), wd(2, 4) + 0.45), seg(t, wd(2, 6), wd(2, 6) + 0.45), seg(t, wd(2, 8), wd(2, 8) + 0.45), seg(t, wd(2, 10), wd(2, 10) + 0.45)];
    add({ id: 'S03', at: st, note: 'step 2 drops with a shockwave; prompt tile + four ranked bars grow in turn; a crown lands on the top one, shakes, hops to the runner-up; push-in from below',
      cam: (lt, d) => ({ x: lerp(500, 520, eo(clamp(lt / 3))), y: lerp(1120, 900, eio(clamp(lt / 2.2))), z: lerp(1.2, 1.0, eo(clamp(lt / 2.0))), r: lerp(0.035, 0, eo(clamp(lt / 1.6))) }),
      draw(lt, d, t) {
        header(t);
        const pt = eob(seg(lt, 0.15, 0.6)); promptTile(540, 690, pt);
        const hop = seg(t, tAlw, tAlw + 0.55), sh = seg(t, tNot, tAlw);
        bars(t, grow(t), { hi: t > tAlw + 0.3 ? 1 : -1 });
        // crown: lands on bar 0 on "top", wobbles on "doesn't", hops to bar 1 on "always"
        const cp = eob(seg(t, tTop - 0.05, tTop + 0.35));
        if (cp > 0) {
          const x0 = BX + BW[0] + 70, x1 = BX + BW[1] + 70, y0 = BY(0), y1 = BY(1), e = eio(hop);
          const cx = lerp(x0, x1, e), cy = lerp(y0, y1, e) - Math.sin(Math.PI * e) * 90 + (1 - eo(seg(t, tTop - 0.05, tTop + 0.3))) * -120;
          K.crown(cx, cy, 0.62 * cp, seg(t, tTop - 0.05, tTop + 0.15), -0.2 + Math.sin(sh * 30) * 0.3 * (1 - hop) * sh);
        }
        K.burst(BX + BW[1] + 70, BY(1), seg(t, tAlw + 0.5, tWin + 0.5), 8, 120, 21);
        chip('top pick can lose', 540, 1440, t, tNot, 0.04, 'down');
      } });
    cue(st, 'zip', { dur: 0.4 }); cue(st + 0.35, 'thud'); cue(st + 0.3, 'pop', { gain: 0.4 });
    [wd(2, 4), wd(2, 6), wd(2, 8), wd(2, 10)].forEach((x) => cue(x, 'slide', { dur: 0.3, gain: 0.45 }));
    cue(tTop, 'pop', { gain: 0.7 }); cue(tNot, 'tock', { gain: 0.6 }); cue(tNot + 0.12, 'tock', { gain: 0.5 }); cue(tAlw, 'whoosh', { gain: 0.5 }); cue(tAlw + 0.4, 'pop', { gain: 0.6 }); cue(tWin, 'sparkle', { dur: 0.6, gain: 0.5 });
  }

  // ───────────────────────── 4 · the weighted dice drops ─────────────────────────
  {
    const st = cut(3), tRoll = wd(3, 1), tDice = wd(3, 4), tOne = wd(3, 6), tRoll2 = wd(3, 8);
    const land1 = tDice + 0.15, land2 = tRoll2 + 0.35;
    add({ id: 'S04', at: st, note: 'bars fade back; a die drops from the top, bounces with a shockwave, then hops and tumbles to a different face; pan with a landing shake',
      cam: (lt, d, t) => { const a = t - land1, b = t - land2; return { x: lerp(470, 600, eio(lt / d)), y: lerp(1000, 880, eo(clamp(lt / 1.6))), z: lerp(1.08, 1.02, lt / d), r: lerp(-0.02, 0.015, lt / d), dx: (a > 0 ? Math.exp(-8 * a) * Math.sin(a * 50) * 12 : 0) + (b > 0 ? Math.exp(-8 * b) * Math.sin(b * 50) * 10 : 0), dy: a > 0 ? Math.exp(-8 * a) * Math.cos(a * 44) * 12 : 0 }; },
      draw(lt, d, t) {
        header(t);
        promptTile(540, 690, 1, 0.5);
        bars(t, [1, 1, 1, 1], { a: 0.35 });
        // weighted tag
        const wp = eob(seg(t, wd(3, 3), wd(3, 3) + 0.35)); if (wp > 0) { ctx.save(); ctx.translate(790, 1230); ctx.rotate(0.1); ctx.scale(wp, wp); K.glass(-120, -42, 240, 84, 30, { blur: 18, dy: 6 }); K.text('weighted', 0, 3, 38, C.violetLight, { align: 'center' }); ctx.restore(); }
        // die: fall → bounce → idle → second roll (hop + spin) → settle
        let y = 930, rot = 0, sy = 1, sx = 1, face = 2;
        const fp = seg(t, tRoll - 0.1, land1);
        if (t < land1) { y = lerp(-260, 930, fp * fp); rot = (1 - fp) * -5; face = 1 + Math.floor(t * 18) % 6; }
        else {
          const a = t - land1, b = Math.exp(-5 * a) * Math.abs(Math.sin(a * 10)); y = 930 - 130 * b; rot = Math.exp(-4 * a) * 0.6 * Math.sin(a * 9); const sq = Math.exp(-9 * a) * 0.2; sy = 1 - sq; sx = 1 + sq * 0.6; face = 2;
          if (t > tOne) { const c = seg(t, tOne, land2); y = 930 - Math.sin(Math.PI * c) * 260; rot = c * TAU * 2; face = c < 1 ? 1 + Math.floor(t * 18) % 6 : 5; if (c >= 1) { const e = t - land2, sq2 = Math.exp(-9 * e) * 0.2; sy = 1 - sq2; sx = 1 + sq2 * 0.6; y = 930 - 90 * Math.exp(-5 * e) * Math.abs(Math.sin(e * 10)); rot = Math.exp(-4 * e) * 0.5 * Math.sin(e * 9); } }
        }
        ctx.save(); ctx.translate(540, y); ctx.scale(sx, sy); ctx.translate(-540, -y); die(540, y, 1.15, face, rot); ctx.restore();
        [land1, land2].forEach((l, i) => { const p = seg(t, l, l + 0.7); if (p > 0 && p < 1) { ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 10 * (1 - p); ctx.globalAlpha = 0.8 * (1 - p); ctx.beginPath(); ctx.ellipse(540, 1130, lerp(100, 520, eo(p)), lerp(24, 110, eo(p)), 0, 0, TAU); ctx.stroke(); ctx.restore(); } });
        chip('a weighted dice roll', 540, 1440, t, tDice - 0.1, -0.04, 'unlock');
        K.pip(190, 1330, 0.55, { t, look: 1, lookY: -0.2, happy: t > land1 ? 1 : 0, wave: 0 });
      } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(tRoll, 'whoosh', { gain: 0.6 }); for (let k = 0; k < 4; k++) cue(tRoll + 0.15 + k * 0.17, 'tock', { gain: 0.3 });
    cue(land1, 'thud'); cue(land1 + 0.32, 'thud', { gain: 0.45 }); cue(wd(3, 3), 'pop', { gain: 0.4 }); cue(tOne, 'whoosh', { gain: 0.5 }); cue(tRoll2 + 0.35, 'thud', { gain: 0.8 });
  }

  // ───────────────────────── 5 · one different roll → a new path ─────────────────────────
  {
    const st = wd(3, 9) - 0.08, tF0 = wd(3, 9), tAns = wd(3, 12), tNew = wd(3, 15);
    const ends = [{ x: 290, txt: 'Mochi, sleepy cat', col: C.violet }, { x: 790, txt: 'Luna, night owl', col: C.coral }];
    const branch = (p, ex) => { // path from (540,730) curving to (ex,1050)
      const pts = []; for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push([lerp(540, ex, eio(u)) , lerp(760, 1040, u)]); }
      return pts.slice(0, Math.max(2, Math.round(24 * p) + 1));
    };
    add({ id: 'S05', at: st, note: 'a path forks from the prompt: two glowing routes draw down to two different answers; step 2 unlocks; slow pull-out with roll',
      cam: (lt, d) => { const p = eo(clamp(lt / d)); return { x: lerp(490, 540, p), y: lerp(780, 940, p), z: lerp(1.22, 1.0, p), r: lerp(-0.035, 0.02, p) }; },
      draw(lt, d, t) {
        header(t);
        promptTile(540, 690, 1);
        ends.forEach((e, i) => {
          const p = seg(t, tF0 + i * 0.25, tAns + i * 0.1); const pts = branch(eo(p), e.x);
          if (pts.length > 1) { ctx.save(); ctx.strokeStyle = i ? C.coral : C.violetLight; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.shadowColor = K.rgba(i ? C.coral : C.violetLight, 0.9); ctx.shadowBlur = 24; ctx.beginPath(); pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); const [hx, hy] = pts[pts.length - 1]; circle(hx, hy, 18, C.white); ctx.restore(); }
          const cp = eob(seg(t, tAns + i * 0.25 + 0.1, tAns + i * 0.25 + 0.55));
          if (cp > 0) { ctx.save(); ctx.translate(e.x, 1130 + (1 - eo(cp)) * 60); ctx.scale(cp, cp); ctx.globalAlpha *= clamp(cp * 2);
            K.glass(-215, -62, 430, 124, 42, { blur: 26, dy: 10, top: i ? '#E05579' : C.violet, bot: i ? C.coral : C.violetDark, edge: 'rgba(255,255,255,0.35)' }); K.text(e.txt, 0, 3, 38, C.white, { align: 'center' }); ctx.restore(); }
        });
        chip('a whole new path', 540, 1440, t, tNew - 0.1, 0.04, 'up');
        K.burst(540, 760, seg(t, tF0, tF0 + 0.8), 8, 110, 31);
      } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(tF0, 'zip', { dur: 0.4, gain: 0.6 }); cue(tF0 + 0.25, 'zip', { dur: 0.4, gain: 0.5 }); cue(tAns + 0.2, 'pop', { gain: 0.6 }); cue(tAns + 0.45, 'pop', { gain: 0.6 });
    cue(UT[1], 'pop', { gain: 0.7 }); cue(UT[1] + 0.02, 'sparkle', { dur: 0.7, gain: 0.6 });
  }

  // ───────────────────────── 6 · step 3: the temperature dial ─────────────────────────
  {
    const st = cut(4), tTemp = wd(4, 8), tUp = wd(4, 13), tDown = wd(4, 15), tRand = wd(4, 12);
    const CX = 540, CY = 1050, R = 290;
    const ang = (t) => { // needle angle: -90 (left) .. +90 (right) deg-ish in radians from vertical
      const a0 = -1.1, hi = 1.15, lo = -0.55;
      if (t < tTemp) return a0 + Math.sin(t * 3) * 0.04;
      if (t < tUp) return lerp(a0, lo, eo(seg(t, tTemp, tTemp + 0.5)));
      if (t < tDown) return lerp(lo, hi, eob(seg(t, tUp, tUp + 0.5))) + Math.sin(t * 22) * 0.05 * seg(t, tUp + 0.5, tUp + 0.7);
      return lerp(hi, -0.9, eo(seg(t, tDown, tDown + 0.6)));
    };
    add({ id: 'S06', at: st, note: 'step 3 writes on; a gauge rises with chevrons, label writes on, needle swings up (outputs get varied and shaky) and back down (outputs settle); orbiting roll camera',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(560, 515, p), y: lerp(930, 900, eio(p)), z: lerp(1.0, 1.1, eio(p)), r: Math.sin(lt * 1.1) * 0.03 }; },
      draw(lt, d, t) {
        header(t);
        const rise = eo(seg(lt, 0.2, 0.8));
        ctx.save(); ctx.translate(0, (1 - rise) * 260); ctx.globalAlpha *= rise;
        // arc
        ctx.save(); ctx.lineWidth = 44; ctx.lineCap = 'round'; const g = ctx.createLinearGradient(CX - R, 0, CX + R, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral);
        ctx.shadowColor = K.rgba(C.violet, 0.6); ctx.shadowBlur = 30; ctx.strokeStyle = g; ctx.beginPath(); ctx.arc(CX, CY, R, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.restore();
        for (let k = 0; k <= 10; k++) { const a = lerp(-1.1, 1.1, k / 10) - Math.PI / 2, r1 = R + 44, r2 = R + (k % 5 ? 62 : 80); ctx.strokeStyle = 'rgba(245,243,255,0.5)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * r1, CY + Math.sin(a) * r1); ctx.lineTo(CX + Math.cos(a) * r2, CY + Math.sin(a) * r2); ctx.stroke(); }
        // needle
        const na = ang(t) - Math.PI / 2; ctx.save(); ctx.shadowColor = 'rgba(8,5,30,0.6)'; ctx.shadowBlur = 16; ctx.strokeStyle = C.paper; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(na) * (R - 30), CY + Math.sin(na) * (R - 30)); ctx.stroke(); ctx.restore();
        circle(CX, CY, 32, C.paper); circle(CX, CY, 14, C.coral);
        K.text('steady', CX - R, CY + 70, 36, C.violetLight, { align: 'center', ui: true }); K.text('wild', CX + R, CY + 70, 36, C.coralLight, { align: 'center', ui: true });
        ctx.restore();
        // label writes on
        const lp = eo(seg(t, tTemp - 0.1, tTemp + 0.6)); if (lp > 0) { ctx.save(); ctx.font = '800 76px Sora'; const lw = ctx.measureText('temperature').width; ctx.beginPath(); ctx.rect(540 - lw / 2 - 20, 640, (lw + 40) * lp, 140); ctx.clip();
          const gg = ctx.createLinearGradient(540 - lw / 2, 0, 540 + lw / 2, 0); gg.addColorStop(0, C.violetLight); gg.addColorStop(1, C.coral); K.text('temperature', 540, 700, 76, gg, { align: 'center' }); ctx.restore();
          if (lp < 1) { ctx.save(); ctx.fillStyle = C.coral; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 18; ctx.fillRect(540 - 250 + 500 * lp, 660, 6, 80); ctx.restore(); } }
        if (t < tTemp + 0.3 && lt < 1.6) K.chevrons(CX, CY + 20, t, (1 - seg(lt, 0.9, 1.6)) * 0.8 * rise);
        // outputs: three mini tiles that settle or scatter with the needle
        const a = ang(t), wild = clamp((a + 0.3) / 1.2), sets = [['Mochi', 'Mochi', 'Mochi'], ['Luna', 'Pixel', 'Biscuit']], which = wild > 0.5 ? 1 : 0;
        const op = eob(seg(t, tTemp + 0.2, tTemp + 0.7));
        for (let i = 0; i < 3; i++) { const sh = wild * (Math.sin(t * 17 + i * 2) * 7); ctx.save(); ctx.translate(250 + i * 290, 1290 + sh); ctx.rotate(wild * Math.sin(t * 13 + i) * 0.08); ctx.scale(op, op);
          K.glass(-125, -48, 250, 96, 38, { blur: 20, dy: 8, top: which ? '#5A3A8A' : undefined }); K.text(sets[which][i], 0, 3, 38, C.paper, { align: 'center' }); ctx.restore(); }
        chip('turn randomness down', 540, 1450, t, tDown - 0.05, -0.03, 'down');
      } });
    cue(st, 'slide', { dur: 0.45, gain: 0.6 }); cue(st + 0.35, 'pop', { gain: 0.45 }); cue(tTemp - 0.1, 'zip', { dur: 0.45, gain: 0.5 }); for (let k = 0; k < 5; k++) cue(tTemp + k * 0.1, 'tock', { gain: 0.35 });
    cue(tUp, 'whoosh', { gain: 0.6 }); for (let k = 0; k < 5; k++) cue(tUp + 0.45 + k * 0.16, 'tock', { gain: 0.3 }); cue(tDown, 'whoosh', { gain: 0.5 }); cue(tDown + 0.6, 'thud', { gain: 0.5 });
    cue(UT[2], 'pop', { gain: 0.7 }); cue(UT[2] + 0.02, 'sparkle', { dur: 0.7, gain: 0.6 });
  }

  // ───────────────────────── 7 · step 4: your move ─────────────────────────
  {
    const st = cut(5), tFresh = wd(5, 4), tAgain = wd(5, 7), tFacts = wd(5, 11), tSrc = wd(5, 14);
    add({ id: 'S07', at: st, note: 'step 4 rises with chevrons; an "ask again" card flips in, a "facts" card drops with a bounce and a magnifier; diagonal sweep from the top right',
      cam: (lt, d) => { const p = eio(lt / d); return { x: lerp(530, 470, p), y: lerp(780, 960, p), z: lerp(1.12, 1.03, p), r: lerp(0.03, -0.012, p) }; },
      draw(lt, d, t) {
        header(t);
        // left card: flips in on "fresh"
        const fp = seg(t, tFresh - 0.1, tFresh + 0.5), fx = Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, Math.PI * 2, eo(fp)))));
        if (fp > 0) { ctx.save(); ctx.translate(310, 940); ctx.scale(fx, 1); K.glass(-210, -250, 420, 500, 56, { blur: 40, dy: 16, edge: K.rgba(C.violetLight, 0.5) });
          // circular arrow
          const sp = (t - tAgain) > 0 ? eo(seg(t, tAgain, tAgain + 0.8)) * TAU : 0; ctx.save(); ctx.translate(0, -70); ctx.rotate(sp); ctx.strokeStyle = C.paper; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.arc(0, 0, 76, -0.4, Math.PI * 1.45); ctx.stroke(); ctx.beginPath(); ctx.moveTo(52, -64); ctx.lineTo(80, -28); ctx.lineTo(30, -26); ctx.closePath(); ctx.fillStyle = C.coral; ctx.fill(); ctx.stroke(); ctx.restore();
          K.text('Fresh ideas', 0, 90, 44, C.paper, { align: 'center' }); K.text('ask again', 0, 150, 34, C.violetLight, { align: 'center', ui: true }); ctx.restore(); }
        // right card: drops on "facts" with a bounce
        const rp = seg(t, tFacts - 0.5, tFacts + 0.1), a = t - tFacts;
        if (rp > 0) { let y = lerp(260, 940, rp * rp), sy = 1; if (a > 0) { y = 940 - 80 * Math.exp(-5 * a) * Math.abs(Math.sin(a * 11)); sy = 1 - Math.exp(-9 * a) * 0.12; }
          ctx.save(); ctx.translate(770, y); ctx.scale(1, sy); K.glass(-210, -250, 420, 500, 56, { blur: 40, dy: 16, edge: K.rgba(C.violetLight, 0.5) });
          K.magnifier(0, -80, 0.9 * eob(seg(t, tFacts + 0.1, tFacts + 0.5))); K.text('Facts', 0, 90, 44, C.paper, { align: 'center' }); K.text('check sources', 0, 150, 34, C.violetLight, { align: 'center', ui: true }); ctx.restore(); }
        const sp2 = seg(t, tFacts, tFacts + 0.7); if (sp2 > 0 && sp2 < 1) { ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 10 * (1 - sp2); ctx.globalAlpha = 0.8 * (1 - sp2); ctx.beginPath(); ctx.ellipse(770, 1210, lerp(100, 360, eo(sp2)), lerp(20, 70, eo(sp2)), 0, 0, TAU); ctx.stroke(); ctx.restore(); }
        chip('ask again', 330, 1380, t, tAgain, -0.05, 'up', 0);
        chip('check sources', 700, 1470, t, tSrc, 0.04, 'eye', 1);
      } });
    cue(st, 'slide', { dur: 0.5, gain: 0.6 }); cue(tFresh, 'whoosh', { gain: 0.5 }); cue(tFresh + 0.35, 'pop', { gain: 0.6 }); cue(tAgain, 'pop', { gain: 0.5 }); cue(tAgain + 0.1, 'zip', { dur: 0.4, gain: 0.4 });
    cue(tFacts - 0.4, 'zip', { dur: 0.4, gain: 0.5 }); cue(tFacts, 'thud'); cue(tFacts + 0.3, 'thud', { gain: 0.4 }); cue(tSrc, 'pop', { gain: 0.5 });
    cue(UT[3], 'pop', { gain: 0.8 }); cue(UT[3] + 0.02, 'sparkle', { dur: 0.9, gain: 0.7 });
  }

  // ───────────────────────── 8 · loop: same question, new roll ─────────────────────────
  {
    const st = cut(6), tRoll = wd(6, 3), tGet = wd(6, 9), tAns = wd(6, 6);
    add({ id: 'S08', at: st, note: 'spotlight, ring full, two chats again; the dice rolls and both answers change; Pip waves; settle-in zoom',
      cam: (lt, d) => ({ x: lerp(500, 540, eo(clamp(lt / 1.4))), y: lerp(880, 960, eio(clamp(lt / d))), z: lerp(1.2, 1.0, eo(clamp(lt / 1.6))), r: lerp(-0.04, 0, eo(clamp(lt / 1.4))) }),
      draw(lt, d, t) {
        header(t, { final: true });
        K.spot(540, eo(seg(lt, 0, 0.5)) * 0.8);
        const ro = seg(t, tRoll, tRoll + 0.9), sw = ro > 0.55;
        const flip = (p) => Math.max(0.05, Math.abs(Math.cos(p * Math.PI)));
        const panel = (x, a, b) => { const fl = ro > 0 && ro < 1 ? flip(ro * 2 % 1) : 1; ctx.save(); ctx.translate(x + 220, 840); ctx.scale(1, ro > 0 && ro < 1 ? 1 - 0.04 * Math.sin(Math.PI * ro) : 1); ctx.translate(-(x + 220), -840); chatPanel(x, 620, 440, 440, { u: 1, a: 1, ans: sw ? b : a, hi: sw ? Math.sin(Math.PI * seg(t, tRoll + 0.5, tRoll + 1.2)) : 0 }); ctx.restore(); };
        panel(80, 'Mochi!', 'Pixel!'); panel(560, 'Luna!', 'Biscuit!');
        // die between and below, rolling on "roll"
        const c = seg(t, tRoll - 0.15, tRoll + 0.6), y = 1275 - Math.sin(Math.PI * c) * 150;
        die(540, y, 0.8, c > 0 && c < 1 ? 1 + Math.floor(t * 18) % 6 : (c >= 1 ? 4 : 2), c * TAU * 1.5);
        const q = eob(seg(t, tAns, tAns + 0.4)); if (q > 0) { ctx.save(); ctx.translate(540, 1135); ctx.scale(q, q); K.text('which one?', 0, 0, 64, C.coralLight, { align: 'center' }); ctx.restore(); }
        K.pip(880, 1330, 0.7, { t, look: -1, lookY: -0.3, happy: 1, wave: seg(t, tGet - 0.2, tGet + 0.2) });
        K.confetti(t - UT[3] - 0.3, 40);
      } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.3, 'pop', { gain: 0.4 }); cue(tRoll - 0.15, 'whoosh', { gain: 0.5 }); for (let k = 0; k < 3; k++) cue(tRoll + k * 0.15, 'tock', { gain: 0.3 }); cue(tRoll + 0.6, 'thud', { gain: 0.7 });
    cue(tRoll + 0.55, 'sparkle', { dur: 0.6, gain: 0.5 }); cue(tAns, 'pop', { gain: 0.5 }); cue(tGet, 'pop', { gain: 0.5 });
  }

  return { shots: S, cues: CUES };
}
