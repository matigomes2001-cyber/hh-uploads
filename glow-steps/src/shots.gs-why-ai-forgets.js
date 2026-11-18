// WHY DOES AI FORGET WHAT YOU JUST SAID? Glow Steps episode: a chat, a limited "window", four steps that unlock one by one.
// A shot: { id, at, cam, note, draw(lt, d, t) }. cam(lt, d, t) => { x, y, z, r, dx, dy } (own move per shot).
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle } from './core/lib.js';
import { L, Wd } from './core/timing.js';
import * as K from './core/kit.js';

const PX = 170, PY = 600, PW = 780, PH = 700;            // the chat / context-window panel
const UEDGE = PX + PW - 36, AEDGE = PX + 36;               // right edge of user bubbles, left edge of AI bubbles
const SP = 96, slotY = (k) => PY + 72 + k * SP;
const MSG = [['u', 'My dog is Biscuit'], ['a', 'Cute name!'], ['u', 'Plan my trip'], ['a', 'Sure, where to?'], ['u', 'Lisbon, three days'], ['a', 'Here is a plan'],
  ['u', 'Add food spots'], ['a', 'On it'], ['u', 'And rainy days?']];
const bub = (i, y, o = {}) => K.msg(MSG[i][1], MSG[i][0] === 'u' ? UEDGE : AEDGE, y, { side: MSG[i][0], ...o });
const SX = 110, SMY = PY + 40, SMH = PH - 80;               // gauge on the panel's left

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0.02, t).toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const chip = (txt, x, y, t, at, rot, icon, i = 0) => { const q = seg(t, at, at + 0.35); if (q > 0) K.chip(txt, x, y, eob(q), rot + Math.sin(t * 2 + i) * 0.012, seg(t, at, at + 0.12), icon); };

  // ── absolute film times of the key words ──
  const TY = { type: Wd('type', 2), ans: Wd('answers', 2), goes: Wd('goes', 2), into: Wd('into', 2), lim: Wd('limited', 2), space2: Wd('space', 2), called: Wd('called', 2), win2: Wd('window', 2) };
  const T3 = { when: Wd('when', 3), space: Wd('space', 3), fills: Wd('fills', 3), up: Wd('up', 3), slip: Wd('slip', 3), view: Wd('view', 3), cant: Wd("can't", 3), any: Wd('anymore', 3) };
  const T4 = { empty: Wd('empty', 4), unl: Wd('unless', 4), mem: Wd('memory', 4), sw: Wd('switched', 4), on: Wd('on', 4) };
  const T5 = { rep: Wd('repeat', 5), imp: Wd('important', 5), start: Wd('start', 5), short: Wd('short', 5), sum: Wd('summary', 5) };
  const T6 = { stops: Wd('stops', 6), seeing: Wd('seeing', 6), so: Wd('so', 6), ask: Wd('ask', 6), still: Wd('still', 6), win: Wd('window', 6) };
  const UT = [TY.win2 + 0.1, T3.any + 0.1, T4.on + 0.05, T5.sum + 0.35];     // when each step's mint check lands
  const PS = [cut(2), cut(3), cut(4), cut(5)];                                  // when each pill becomes the current step
  const uAt = (t) => UT.map((x) => seg(t, x, x + 0.5));
  const curAt = (t) => (t < cut(2) ? -1 : t < cut(3) ? 0 : t < cut(4) ? 1 : t < cut(5) ? 2 : t < cut(6) ? 3 : -1);
  // each pill enters in its own style
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
    K.text('Why AI forgets', 250, 318, 50, C.paper); K.text('the context window', 250, 372, 28, C.dim, { ui: true });
    if (!o.noPills) for (let i = 0; i < 4; i++) K.pill(i, u[i], cur === i, t, pillPose(i, t));
    const a = t - PS[1];   // shockwave under pill 2 when it lands
    if (a > 0.3 && a < 1.0) { const q = (a - 0.3) / 0.7; ctx.save(); ctx.strokeStyle = C.paper; ctx.globalAlpha = 0.7 * (1 - q); ctx.lineWidth = 8 * (1 - q); ctx.beginPath(); ctx.ellipse(K.pillX(1), K.PILL_Y + 60, lerp(60, 330, eo(q)), lerp(14, 60, eo(q)), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    const b = seg(t, PS[2], PS[2] + 0.6);   // write-on cursor for pill 3
    if (b > 0 && b < 1) { ctx.save(); ctx.fillStyle = C.coral; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 18; ctx.fillRect(K.pillX(2) - 100 + 200 * eo(b), K.PILL_Y - 40, 6, 80); ctx.restore(); }
    const c = seg(t, PS[3], PS[3] + 0.8);   // chevrons for pill 4 rising
    if (c > 0 && c < 1) K.chevrons(K.pillX(3), K.PILL_Y - 70, t, (1 - c) * 0.9);
  };
  const fly = (k, p) => { const e = eo(p); return [{ dx: -760 * (1 - e) }, { dx: 760 * (1 - e) }, { dy: -520 * (1 - e) }, { dy: 520 * (1 - e) }, { s: eob(p) }][k % 5]; };

  // ── 1 · HOOK ──
  {
    const st = 0, tw = Wd('told', 0), tn = Wd('ten', 0), ta = Wd('ago', 0), tai = Wd('ai', 0);
    add({ id: 'S01', at: st, note: 'headline, chat panel, 10 min later clock chip, the AI blanks; Pip confused; slow drifting roll',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(500, 585, p), y: 960, z: lerp(1.0, 1.08, eio(p)), r: lerp(-0.014, 0.01, p) }; },
      draw(lt, d, t) {
        K.bg(t);
        const l1 = eob(seg(lt, 0.2, 0.6)), l2 = eob(seg(lt, 0.42, 0.82));
        ctx.save(); ctx.translate(540, 330); ctx.scale(l1, l1); K.text('Why does AI', 0, 0, 84, C.paper, { align: 'center' }); ctx.restore();
        ctx.save(); ctx.translate(540, 450); ctx.scale(l2, l2); ctx.font = '800 118px Sora'; const w = ctx.measureText('forget?').width;
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('forget?', 0, 0, 118, g, { align: 'center' }); ctx.restore();
        K.panel(PX, PY, PW, PH, {});
        const p0 = seg(t, 0.5, 0.95), p1 = seg(t, tai, tai + 0.4), p3 = seg(t, tn, tn + 0.35), p4 = seg(t, ta, ta + 0.4);
        if (p0 > 0) K.msg('My dog is Biscuit', UEDGE, slotY(0), { side: 'u', s: eob(p0), a: p0 });
        if (p1 > 0) K.msg('Cute name!', AEDGE, slotY(1), { side: 'a', s: eob(p1), a: p1 });
        const pc = seg(t, tw, tw + 0.4); if (pc > 0) K.chip('10 min later', 540, slotY(2) + 6, 0.85 * eob(pc), -0.03, seg(t, tw, tw + 0.12), 'clock');
        if (p3 > 0) K.msg("What's my dog's name?", UEDGE, slotY(3), { side: 'u', s: eob(p3), a: p3 });
        if (p4 > 0) K.msg('Hmm… no idea', AEDGE, slotY(4), { side: 'a', s: eob(p4), a: p4 });
        K.pip(860, 1362, 0.66, { t, look: -1, lookY: -0.6, happy: 0, wave: 0 });
      } });
    cue(0.1, 'pop', { gain: 0.5 }); cue(0.25, 'whoosh', { gain: 0.5 }); cue(0.55, 'pop', { gain: 0.45 }); cue(tai, 'pop', { gain: 0.4 }); cue(tw, 'tock'); cue(tw + 0.1, 'pop', { gain: 0.5 }); cue(tn, 'slide', { dur: 0.3 }); cue(ta, 'thud', { gain: 0.5 });
  }

  // shared "window view": panel with 7 bubbles, a bright window frame around the lower four, the older ones dimmed
  const winView = (t, o) => {
    const fy0 = slotY(3) - 54, fy1 = slotY(6) + 54, fx = PX + 18, fw = PW - 36;
    K.panel(PX, PY, PW, PH, { rim: 0.35 });
    ctx.save(); K.clipRR(PX, PY, PW, PH);
    for (let i = 0; i < 7; i++) bub(i, slotY(i), { a: i < 3 ? lerp(1, 0.3, eo(o.dim ?? 1)) : 1 });
    ctx.fillStyle = K.rgba(C.deep, 0.45 * eo(o.dim ?? 1)); ctx.fillRect(PX, PY, PW, fy0 - PY - 10);
    ctx.restore();
    const fp = clamp(o.frame ?? 1), per = 2 * (fw + (fy1 - fy0));
    if (fp > 0) { ctx.save(); ctx.shadowColor = K.rgba(C.violetLight, 0.95); ctx.shadowBlur = 34; ctx.strokeStyle = C.paper; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.setLineDash([per * eo(fp), per]); rr(fx, fy0, fw, fy1 - fy0, 40); ctx.stroke(); ctx.restore(); }
  };

  // ── 2 · "it has a window" ──
  {
    const st = cut(1), tm = Wd('memory', 1), tw = Wd('window', 1), th = Wd('has', 1);
    add({ id: 'S02', at: st, note: 'memory tile gets struck out, window tile glows, a bright frame draws on around the visible part; swinging pan',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(600, 470, eio(p)), y: lerp(1000, 900, eo(p)), z: lerp(1.07, 1.03, p), r: Math.sin(lt * 1.9) * 0.02 * (1 - p) }; },
      draw(lt, d, t) {
        K.bg(t);
        const a1 = eob(seg(lt, 0.0, 0.4)), a2 = eob(seg(t, tw - 0.1, tw + 0.35));
        ctx.save(); ctx.translate(330, 420); ctx.scale(a1, a1); K.glass(-210, -64, 420, 128, 50, { blur: 26, dy: 10 }); K.text('memory', 0, 4, 58, C.dim, { align: 'center' });
        const sp = seg(t, tm + 0.1, tm + 0.45); if (sp > 0) { ctx.strokeStyle = C.coral; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-170, 20); ctx.lineTo(-170 + 340 * eo(sp), -22); ctx.stroke(); } ctx.restore();
        ctx.save(); ctx.translate(745, 420); ctx.scale(a2, a2); const gg = ctx.createLinearGradient(-190, 0, 190, 0); gg.addColorStop(0, C.violet); gg.addColorStop(1, C.coral);
        ctx.shadowColor = K.rgba(C.violet, 0.8); ctx.shadowBlur = 36; rr(-190, -64, 380, 128, 50); ctx.fillStyle = gg; ctx.fill(); ctx.shadowColor = 'transparent'; K.text('window', 0, 4, 62, C.white, { align: 'center' }); ctx.restore();
        winView(t, { frame: seg(t, th, tw + 0.5), dim: seg(t, tw, tw + 0.6) });
        chip('not like a memory', 540, 1440, t, tw + 0.1, -0.04, 'eye');
      } });
    cue(st, 'whoosh'); cue(st + 0.15, 'pop', { gain: 0.5 }); cue(tm + 0.1, 'zip', { dur: 0.3, gain: 0.5 }); cue(th, 'slide', { dur: 0.4 }); cue(tw, 'pop', { gain: 0.6 }); cue(tw + 0.1, 'sparkle', { dur: 0.5, gain: 0.5 });
  }

  // ── 3a · step one: everything goes in (bubbles fly into a dashed empty window) ──
  const landT = [TY.type, TY.ans, TY.goes, TY.into, TY.space2];
  const drawIn = (t, count) => {
    for (let k = 0; k < count; k++) {
      const p = seg(t, landT[k] - 0.42, landT[k] + 0.05), f = fly(k, p);
      if (p > 0) bub(k, slotY(k), { a: clamp(p * 3), ...f, s: f.s ?? 1 });
    }
  };
  {
    const st = cut(2);
    add({ id: 'S03', at: st, note: 'step 1 pill flips in; bubbles fly into a dashed empty window each from a different side; pan left to right',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(480, 600, eio(p)), y: 930, z: 1.05, r: lerp(0.012, -0.012, p) }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { ghost: 0.6 + 0.2 * Math.sin(t * 3) });
        drawIn(t, 4);
        chip('everything it sees', 540, 1440, t, TY.type + 0.2, -0.04, 'eye');
      } });
    cue(st, 'whoosh'); cue(st + 0.25, 'pop', { gain: 0.5 });
    landT.slice(0, 4).forEach((x) => { cue(x - 0.35, 'slide', { dur: 0.3, gain: 0.5 }); cue(x, 'pop', { gain: 0.5 }); });
    cue(TY.type + 0.2, 'pop', { gain: 0.4 });
  }
  // ── 3b · the limited space becomes the "context window" panel ──
  {
    const st = TY.lim - 0.08;
    add({ id: 'S04', at: st, note: 'dashed outline solidifies into a glowing panel, gauge appears, label writes on, step 1 unlocks; pull-out camera',
      cam: (lt, d) => ({ x: 540, y: lerp(940, 920, eo(clamp(lt / 1.4))), z: lerp(1.1, 1.0, eo(clamp(lt / 1.6))), r: lerp(0.03, 0, eo(clamp(lt / 1.4))) }),
      draw(lt, d, t) {
        header(t);
        const q = eo(seg(t, TY.lim, TY.lim + 0.5)), lab = seg(t, TY.called, TY.win2 + 0.1);
        ctx.save(); ctx.globalAlpha *= q; K.panel(PX, PY, PW, PH, { rim: 0.4 + 0.5 * Math.sin(Math.PI * seg(t, TY.win2, TY.win2 + 0.8)), label: 'context window', labelP: eo(lab) }); ctx.restore();
        ctx.save(); ctx.globalAlpha *= 1 - q; K.panel(PX, PY, PW, PH, { ghost: 0.6 }); ctx.restore();
        drawIn(t, 4);
        const p5 = seg(t, TY.space2 - 0.4, TY.space2 + 0.05); if (p5 > 0) bub(4, slotY(4), { s: eob(p5), a: clamp(p5 * 3) });
        ctx.save(); ctx.globalAlpha *= q; K.meter(SX, SMY, SMH, (4 + p5) / 7 * eo(seg(t, TY.lim + 0.1, TY.lim + 0.9))); ctx.restore();
        K.burst(K.pillX(0) + 90, K.PILL_Y - 50, seg(t, TY.win2 + 0.1, TY.win2 + 0.9), 7, 90, 5);
        chip('limited space', 540, 1440, t, TY.lim + 0.05, 0.04, 'unlock');
      } });
    cue(st, 'slide', { dur: 0.4 }); cue(TY.lim + 0.05, 'pop', { gain: 0.5 }); cue(TY.called, 'zip', { dur: 0.35, gain: 0.5 }); cue(TY.space2, 'pop', { gain: 0.5 }); cue(TY.win2 + 0.1, 'pop', { gain: 0.7 }); cue(TY.win2 + 0.12, 'sparkle', { dur: 0.7, gain: 0.6 });
  }

  // ── step 2 helpers: bubble list with a shift (older ones slip out of the top) ──
  const shiftAt = (t) => seg(t, T3.slip, T3.slip + 0.5) + seg(t, T3.view, T3.view + 0.5);
  const drawFull = (t) => {
    const sh = shiftAt(t);
    for (let i = 0; i < 9; i++) {
      const born = i < 5 ? -1 : i === 5 ? T3.when : i === 6 ? T3.space : i === 7 ? T3.slip : T3.view;
      const pp = born < 0 ? 1 : seg(t, born - 0.05, born + 0.4); if (pp <= 0) continue;
      const k = i - sh, y = slotY(k) + (born >= 0 ? (1 - eo(pp)) * 60 : 0), fade = clamp((k + 0.95) / 0.95);
      if (fade <= 0) continue;
      bub(i, y, { a: Math.min(pp * 2, 1) * fade, s: 1 - 0.1 * (1 - fade) });
    }
  };
  // ── 4a · step two: the window fills up ──
  {
    const st = cut(3);
    add({ id: 'S05', at: st, note: 'step 2 pill drops with shockwave; two more bubbles stack in; gauge fills and the rim flashes coral at "up"; tilt from below with a shake',
      cam: (lt, d, t) => { const a = t - T3.up; return { x: 540, y: lerp(1100, 820, eio(clamp(lt / 2.0))), z: lerp(1.05, 1.0, lt / d), r: 0, dy: a > 0 ? Math.exp(-7 * a) * Math.sin(a * 48) * 14 : 0 }; },
      draw(lt, d, t) {
        header(t);
        const n = 5 + seg(t, T3.when - 0.05, T3.when + 0.4) + seg(t, T3.space - 0.05, T3.space + 0.4);
        const fl = seg(t, T3.fills + 0.1, T3.up + 0.1), flash = fl * (0.55 + 0.45 * Math.sin(t * 20));
        K.panel(PX, PY, PW, PH, { rim: 0.4, danger: fl > 0 ? 0.35 + 0.65 * Math.abs(flash) : 0, label: 'context window', labelP: 1 });
        K.meter(SX, SMY, SMH, n / 7, fl > 0 ? 0.5 + 0.5 * Math.abs(flash) : 0);
        ctx.save(); K.clipRR(PX, PY, PW, PH); drawFull(t); ctx.restore();
        if (fl > 0) { const q = seg(t, T3.fills + 0.1, T3.fills + 0.7); ctx.save(); ctx.translate(PX + PW - 90, PY - 40); ctx.rotate(0.08); ctx.scale(eob(q), eob(q)); K.glass(-92, -42, 184, 84, 28, { blur: 20, dy: 6, top: C.coral, bot: '#E0476B', edge: 'rgba(255,255,255,0.4)' }); K.text('FULL', 0, 3, 46, C.white, { align: 'center' }); ctx.restore(); }
        chip('space fills up', 540, 1440, t, T3.fills, -0.04, 'up');
      } });
    cue(st, 'zip', { dur: 0.4 }); cue(st + 0.35, 'thud'); cue(T3.when, 'pop', { gain: 0.5 }); cue(T3.space, 'pop', { gain: 0.5 }); cue(T3.fills, 'pop', { gain: 0.6 }); cue(T3.up + 0.1, 'thud', { gain: 0.8 });
    for (let k = 0; k < 3; k++) cue(T3.fills + 0.1 + k * 0.28, 'tock', { gain: 0.4 });
  }
  // ── 4b · the oldest parts slip out of view ──
  {
    const st = T3.slip - 0.08;
    add({ id: 'S06', at: st, note: 'newest bubbles push the oldest up and out (fading), chevrons rise, a crossed-out eye lands; step 2 unlocks; rolling drift',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(600, 490, eio(p)), y: lerp(880, 840, p), z: lerp(1.04, 1.1, eio(p)), r: lerp(0.03, -0.02, eio(p)) }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { rim: 0.4, label: 'context window', labelP: 1 });
        K.meter(SX, SMY, SMH, 1, 0);
        ctx.save(); K.clipRR(PX, PY, PW, PH); drawFull(t); ctx.restore();
        const cv = seg(t, T3.slip, T3.slip + 0.9); if (cv > 0 && cv < 1) K.chevrons(PX + PW / 2, PY - 10, t, (1 - cv) * 0.9);
        K.eyeOff(PX + PW - 10, PY - 24, 0.85 * eob(seg(t, T3.cant, T3.cant + 0.4)), seg(t, T3.cant, T3.cant + 0.15));
        chip('oldest slips out', 540, 1440, t, T3.slip + 0.05, 0.04, 'up', 1);
        K.burst(K.pillX(1) + 90, K.PILL_Y - 50, seg(t, T3.any + 0.1, T3.any + 0.9), 7, 90, 11);
      } });
    cue(T3.slip, 'whoosh', { gain: 0.6 }); cue(T3.slip + 0.1, 'slide', { dur: 0.4 }); cue(T3.view, 'whoosh', { gain: 0.5 }); cue(T3.cant, 'thud', { gain: 0.5 }); cue(T3.any + 0.1, 'pop', { gain: 0.7 }); cue(T3.any + 0.12, 'sparkle', { dur: 0.7, gain: 0.6 });
  }

  // ── 5a · step three: a new chat opens an empty window ──
  const oldPanelView = (x0) => {
    ctx.save(); ctx.translate(x0, 0); K.panel(PX, PY, PW, PH, { rim: 0.3, label: 'context window', labelP: 1 });
    ctx.save(); K.clipRR(PX, PY, PW, PH); for (let i = 2; i < 9; i++) bub(i, slotY(i - 2), { a: 0.9 }); ctx.restore(); ctx.restore();
  };
  {
    const st = cut(4);
    add({ id: 'S07', at: st, note: 'step 3 pill writes on; old window slides away left, an empty "new chat" window slides in from the right; zoom-out orbit',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(620, 540, eo(p)), y: lerp(920, 900, p), z: lerp(1.16, 1.0, eo(clamp(lt / 1.8))), r: lerp(-0.045, 0, eo(clamp(lt / 1.6))) }; },
      draw(lt, d, t) {
        header(t);
        const sl = eio(seg(lt, 0.15, 0.9));
        if (sl < 1) oldPanelView(-1150 * sl);
        ctx.save(); ctx.translate(1150 * (1 - sl), 0);
        K.panel(PX, PY, PW, PH, { rim: 0.35 + 0.3 * eo(seg(t, T4.empty, T4.empty + 0.5)), label: 'new chat', labelP: eo(seg(lt, 0.5, 1.1)) });
        K.meter(SX, SMY, SMH, 0, 0);
        ctx.restore();
        K.burst(PX + PW / 2, 900, seg(t, T4.empty, T4.empty + 0.9), 10, 210, 3);
        chip('empty window', 540, 1440, t, T4.empty - 0.05, -0.05, 'eye');
      } });
    cue(st, 'zip', { dur: 0.4 }); for (let k = 0; k < 5; k++) cue(st + 0.1 + k * 0.1, 'tock', { gain: 0.3 }); cue(st + 0.2, 'whoosh'); cue(st + 0.85, 'thud', { gain: 0.6 }); cue(T4.empty, 'pop', { gain: 0.6 }); cue(T4.empty + 0.05, 'sparkle', { dur: 0.6, gain: 0.5 });
  }
  // ── 5b · a memory switch gets turned on and a note appears ──
  {
    const st = T4.unl - 0.08;
    add({ id: 'S08', at: st, note: 'memory toggle pops in, flips on, a sticky note pins into the empty window; step 3 unlocks; side-slide camera',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(700, 540, eo(p)), y: lerp(1000, 890, eo(p)), z: 1.08, r: lerp(0.025, -0.01, p) }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { rim: 0.5, label: 'new chat', labelP: 1 }); K.meter(SX, SMY, SMH, 0, 0);
        const ti = eob(seg(t, T4.unl, T4.unl + 0.4)), on = eio(seg(t, T4.sw, T4.sw + 0.35));
        K.toggle(PX + PW / 2, 800, on, 'Memory', ti * 1.4, clamp(ti * 2));
        const np = seg(t, T4.on - 0.05, T4.on + 0.45); if (np > 0) K.note('dog: Biscuit', PX + PW / 2 + lerp(0, -70, eo(np)), lerp(800, 1040, eob(np)), eob(np) * 1.35, lerp(0, -0.06, eo(np)), clamp(np * 3));
        K.burst(K.pillX(2) + 90, K.PILL_Y - 50, seg(t, T4.on + 0.1, T4.on + 0.9), 7, 90, 8);
        chip('memory feature', 540, 1440, t, T4.mem, 0.04, 'pen', 2);
      } });
    cue(T4.unl, 'pop', { gain: 0.5 }); cue(T4.sw, 'tock', { gain: 0.7 }); cue(T4.sw + 0.1, 'sparkle', { dur: 0.5, gain: 0.5 }); cue(T4.on, 'pop', { gain: 0.7 }); cue(T4.on + 0.05, 'sparkle', { dur: 0.7, gain: 0.6 }); cue(T4.mem, 'pop', { gain: 0.4 });
  }

  // ── 6a · the fix: repeat the important bit ──
  {
    const st = cut(5);
    add({ id: 'S09', at: st, note: 'step 4 pill rises with chevrons; a highlighted "reminder" bubble lands in the chat; low-angle push camera',
      cam: (lt, d) => { const p = lt / d; return { x: 540, y: lerp(1130, 860, eo(clamp(lt / 1.8))), z: lerp(1.0, 1.1, eio(p)), r: 0 }; },
      draw(lt, d, t) {
        header(t);
        K.panel(PX, PY, PW, PH, { rim: 0.35, label: 'context window', labelP: 1 }); K.meter(SX, SMY, SMH, 3 / 7 + (1 / 7) * seg(t, T5.rep, T5.rep + 0.5), 0);
        bub(2, slotY(0)); bub(3, slotY(1)); bub(4, slotY(2));
        const p = seg(t, T5.rep - 0.1, T5.rep + 0.45);
        if (p > 0) K.msg('Reminder: my dog is Biscuit', UEDGE, lerp(slotY(3) + 220, slotY(3), eo(p)), { side: 'u', a: clamp(p * 2), hi: 0.4 + 0.6 * Math.sin(Math.PI * seg(t, T5.rep + 0.4, T5.imp + 0.6)) });
        const ch = seg(t, T5.rep - 0.1, T5.rep + 0.5); if (ch > 0 && ch < 1) K.chevrons(UEDGE - 250, slotY(3) + 40, t, (1 - ch) * 0.7);
        chip('repeat the key bit', 540, 1440, t, T5.imp - 0.05, -0.04, 'pen', 3);
      } });
    cue(st, 'zip', { dur: 0.4 }); cue(st + 0.5, 'thud', { gain: 0.5 }); cue(T5.rep, 'slide', { dur: 0.4 }); cue(T5.rep + 0.35, 'pop', { gain: 0.7 }); cue(T5.imp, 'pop', { gain: 0.5 });
  }
  // ── 6b · or start fresh with a short summary ──
  {
    const st = T5.start - 0.08;
    add({ id: 'S10', at: st, note: 'chat squeezes into one short summary note that flies into a fresh window; step 4 unlocks; right-to-left pan',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(650, 470, eio(p)), y: lerp(880, 940, p), z: 1.06, r: Math.sin(p * 3.1) * 0.022 }; },
      draw(lt, d, t) {
        header(t);
        const sq = eio(seg(t, T5.short - 0.1, T5.sum - 0.05));
        const nl = seg(t, T5.short - 0.15, T5.short + 0.3);
        K.panel(PX, PY, PW, PH, { rim: 0.4, label: nl > 0 ? 'new chat' : 'context window', labelP: nl > 0 ? eo(nl) : 1 }); K.meter(SX, SMY, SMH, lerp(4 / 7, 0.12, sq));
        const cy = PY + PH / 2 - 20;
        if (sq < 1) for (let i = 0; i < 4; i++) { const y = lerp(slotY(i), cy, sq); ctx.save(); ctx.translate(lerp(0, -80 * (i - 1.5), sq), 0); bub([2, 3, 4, 8][i], y, { a: 1 - sq, s: lerp(1, 0.2, sq) }); ctx.restore(); }
        const np = seg(t, T5.sum - 0.25, T5.sum + 0.35);
        if (np > 0) K.note('Biscuit · Lisbon trip', PX + PW / 2, lerp(cy, slotY(0) + 10, eio(seg(t, T5.sum + 0.05, T5.sum + 0.7))), eob(np) * 1.35, lerp(-0.3, -0.04, eo(np)), clamp(np * 3));
        K.burst(K.pillX(3) + 90, K.PILL_Y - 50, seg(t, UT[3] - 0.1, UT[3] + 0.7), 7, 90, 21);
        chip('short summary', 540, 1440, t, T5.short, 0.04, 'pen', 4);
      } });
    cue(T5.start, 'whoosh', { gain: 0.5 }); cue(T5.short - 0.1, 'zip', { dur: 0.5, gain: 0.7 }); cue(T5.sum - 0.1, 'pop', { gain: 0.6 }); cue(T5.sum + 0.6, 'thud', { gain: 0.5 }); cue(UT[3], 'pop', { gain: 0.8 }); cue(UT[3] + 0.02, 'sparkle', { dur: 0.8, gain: 0.7 });
  }

  // ── 7a · it doesn't forget, it just stops seeing ──
  {
    const st = cut(6);
    add({ id: 'S11', at: st, note: 'ring completes; Pip; window frame around what is still visible, the older bubbles dim; handheld sway camera',
      cam: (lt, d, t) => ({ x: 540 + Math.sin(t * 1.3) * 26, y: 900 + Math.cos(t * 1.1) * 18, z: lerp(1.12, 1.0, eo(clamp(lt / 2.6))), r: Math.sin(t * 0.9) * 0.012 }),
      draw(lt, d, t) {
        header(t, { final: true, noPills: true });
        const pop = eob(seg(lt, 0.0, 0.5));
        K.pip(860, lerp(520, 372, eo(seg(lt, 0.0, 0.5))), 0.62 * pop, { t, look: -0.5, lookY: 0.8, happy: lt > 1.2 ? 1 : 0, wave: seg(lt, 0.3, 0.6) * (lt < 1.4 ? 1 : 0) });
        winView(t, { frame: 1, dim: seg(t, T6.stops - 0.2, T6.stops + 0.5) });
        K.eyeOff(PX + PW / 2 + 90, slotY(1), eob(seg(t, T6.stops, T6.stops + 0.4)), seg(t, T6.stops, T6.stops + 0.15));
        chip('it stops seeing', 540, 1440, t, T6.stops + 0.05, -0.04, 'eye', 5);
        K.burst(150, 330, seg(t, 0.2, 1.0), 8, 120, 31);
      } });
    cue(st, 'pop', { gain: 0.6 }); cue(st + 0.1, 'sparkle', { dur: 0.7, gain: 0.5 }); cue(T6.stops, 'pop', { gain: 0.6 }); cue(T6.seeing, 'thud', { gain: 0.4 });
  }
  // ── 7b · check what is still in its window (loops to the hook) ──
  {
    const st = T6.so - 0.08;
    add({ id: 'S12', at: st, note: 'magnifier scans from the dim old bubbles into the window; "still in its window?" chip pops; sparkles on the last word; pull-out camera',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(480, 540, eo(p)), y: lerp(840, 900, p), z: lerp(1.22, 1.0, eo(clamp(lt / 2.2))), r: lerp(0.025, 0, eo(clamp(lt / 2.0))) }; },
      draw(lt, d, t) {
        header(t, { final: true, noPills: true });
        K.pip(860, 372, 0.62, { t, look: -0.6, lookY: 0.7, happy: 1 });
        winView(t, { frame: 1, dim: 1 });
        K.eyeOff(PX + PW / 2 + 90, slotY(1), 1, 1);
        const sp = eio(seg(t, T6.ask, T6.still + 0.2)), mx = lerp(PX + 160, PX + PW - 200, sp), my = lerp(slotY(0), slotY(5), sp);
        K.magnifier(mx, my, eob(seg(t, T6.ask - 0.25, T6.ask + 0.1)), clamp(1 - seg(t, T6.win + 0.3, T6.win + 0.6)));
        const q = seg(t, T6.still - 0.05, T6.still + 0.4);
        if (q > 0) { ctx.save(); ctx.translate(540, 1440); ctx.scale(eob(q), eob(q)); ctx.font = '800 46px Sora'; const w = ctx.measureText('still in its window?').width + 100; const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violet); g.addColorStop(1, C.coral); ctx.shadowColor = 'rgba(8,5,30,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; rr(-w / 2, -50, w, 100, 34); ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent'; K.text('still in its window?', 0, 3, 46, C.white, { align: 'center' }); ctx.restore(); }
        K.burst(PX + PW / 2, PY + 380, seg(t, T6.win, T6.win + 0.9), 10, 220, 41);
      } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(T6.ask, 'slide', { dur: 0.5 }); cue(T6.still, 'pop', { gain: 0.7 }); cue(T6.win, 'sparkle', { dur: 0.9, gain: 0.7 }); cue(T6.win + 0.05, 'pop', { gain: 0.5 });
  }

  return { shots: S, cues: CUES };
}
