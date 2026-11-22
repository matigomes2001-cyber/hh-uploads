// IS THERE REALLY AN AI FOR EVERYTHING? Glow Steps episode: using an AI-tools directory in three steps (task, filter, save) + test it.
// A shot: { id, at, cam, note, draw(lt, d, t) }. cam(lt, d, t) => { x, y, z, r, dx, dy } (own move per shot). Tool names in visuals are generic labels, not real products.
import { ctx, C, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle } from './core/lib.js';
import { L, lineWords } from './core/timing.js';
import * as K from './core/kit.js';

K.PILLS.splice(0, 4, 'the task', 'filter', 'save', 'test it');
K.PILL_TAGS.splice(0, 4, 'STEP 1', 'STEP 2', 'STEP 3', 'THEN');

const HOOK = [['Trip planner', 'Resume helper', 'Photo fixer', 'Meal planner', 'Logo maker', 'Study buddy'], ['Note taker', 'Voice cleaner', 'Email helper', 'Slide maker', 'Budget buddy', 'Code helper'], ['Meal planner', 'Logo maker', 'Trip planner', 'Photo fixer', 'Study buddy', 'Resume helper'], ['Code helper', 'Budget buddy', 'Note taker', 'Slide maker', 'Voice cleaner', 'Email helper']];
const LANE_Y = [720, 880, 1040, 1200], LANE_S = [0.8, 0.92, 0.92, 0.8];
const hookLanes = (t, a = 1, lt = 99) => HOOK.forEach((n, i) => K.lane(t, LANE_Y[i], i % 2 ? 1 : -1, 40 + i * 12, n, LANE_S[i], a * eo(clamp((lt - i * 0.12) / 0.35))));

const CARDS = [['Notes to tasks', 'Free'], ['Meeting recap', 'Freemium'], ['Daily planner', 'Paid'], ['Mind mapper', 'Free trial']];
const CY = [960, 1085, 1210, 1335];

function win(x, y, w, h, url, p = 1) {
  K.glass(x, y, w, h, 48, { blur: 70, dy: 28, top: C.plum, bot: '#1F1740' });
  circle(x + 52, y + 44, 10, C.coral); circle(x + 86, y + 44, 10, C.violetLight); circle(x + 120, y + 44, 10, C.dimmer);
  rr(x + 160, y + 20, w - 210, 48, 24); ctx.fillStyle = K.rgba(C.deep, 0.8); ctx.fill();
  K.text(url.slice(0, Math.round(url.length * clamp(p))), x + 188, y + 45, 26, C.dim, { ui: true });
}
function searchBar(y, txt, typed, t, ph, glow = 0) {
  K.glass(160, y - 48, 760, 96, 48, { blur: 26, dy: 10, edge: K.rgba(C.violetLight, 0.5 + 0.4 * glow) });
  ctx.save(); ctx.strokeStyle = C.violetLight; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(215, y - 4, 16, 0, TAU); ctx.moveTo(227, y + 8); ctx.lineTo(240, y + 22); ctx.stroke(); ctx.restore();
  const n = Math.round(txt.length * clamp(typed)), shown = txt.slice(0, n);
  if (n === 0) K.text(ph, 270, y + 2, 32, C.dimmer, { ui: true, w: 700 }); else K.text(shown, 270, y + 2, 34, C.paper, { ui: true, w: 700 });
  if (glow > 0 && Math.sin(t * 14) > -0.2) { ctx.save(); ctx.font = '700 34px Inter'; const cw = n ? ctx.measureText(shown).width : 0; ctx.fillStyle = C.coral; ctx.fillRect(270 + cw + 6, y - 24, 6, 48); ctx.restore(); }
}
function bookmark(x, y, s, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a; ctx.fillStyle = C.coral; ctx.shadowColor = K.rgba(C.coral, 0.8); ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(-18, -26); ctx.lineTo(18, -26); ctx.lineTo(18, 26); ctx.lineTo(0, 12); ctx.lineTo(-18, 26); ctx.closePath(); ctx.fill(); ctx.restore();
}
function card(i, o = {}) {
  const [name, price] = CARDS[i]; const y = (o.y ?? CY[i]);
  ctx.save(); ctx.translate(o.dx || 0, 0);
  K.tile(name, 540, y, 0.9 * (o.s ?? 1), { w: 800, by: price, a: o.a ?? 1 });
  if (o.hi) { ctx.save(); ctx.globalAlpha *= o.hi; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 28; rr(540 - 360, y - 50, 720, 100, 36); ctx.strokeStyle = C.coral; ctx.lineWidth = 6; ctx.stroke(); ctx.restore(); }
  if (o.mark > 0) bookmark(870, y, eob(o.mark) * 0.9, clamp(o.mark * 3));
  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0.02, t).toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const wd = (line, k) => lineWords(line)[k].s;
  const chip = (txt, x, y, t, at, rot, icon, i = 0) => { const q = seg(t, at, at + 0.35); if (q > 0) K.chip(txt, x, y, eob(q), rot + Math.sin(t * 2 + i) * 0.012, seg(t, at, at + 0.12), icon); };

  const UT = [wd(2, 19) + 0.3, wd(3, 13) + 0.3, wd(4, 14) + 0.2, wd(6, 15) + 0.3];
  const PS = [cut(2), cut(3), cut(4), cut(5)];
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
    K.text('Find the right tool', 250, 318, 50, C.paper, { a: ri }); K.text('a directory of AI tools', 250, 372, 28, C.dim, { ui: true, a: ri });
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
  const WX = 100, WY = 640, WW = 880, WH = 790;

  // ───────── 1 · HOOK: hundreds of tools drift past, which one? ─────────
  {
    const tNo = wd(0, 11), tWhich = wd(0, 13), tAI = wd(0, 6);
    add({ id: 'S01', at: 0, note: 'headline; four lanes of generic tool tiles drift; Pip peeks, a "which one?" chip lands; drifting roll pan',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(480, 600, p), y: 960, z: lerp(1.0, 1.08, eio(p)), r: lerp(-0.014, 0.012, p) }; },
      draw(lt, d, t) {
        K.bg(t); hookLanes(t, lerp(1, 0.55, eo(seg(t, tNo, tNo + 0.5))), lt + 0.25);
        const l1 = eob(seg(lt, 0.2, 0.6)), l2 = eob(seg(lt, 0.42, 0.82));
        ctx.save(); ctx.translate(540, 330); ctx.scale(l1, l1); K.text('Is there an AI', 0, 0, 84, C.paper, { align: 'center' }); ctx.restore();
        ctx.save(); ctx.translate(540, 450); ctx.scale(l2, l2); ctx.font = '800 118px Sora'; const w = ctx.measureText('for that?').width;
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text('for that?', 0, 0, 118, g, { align: 'center' }); ctx.restore();
        const qq = eob(seg(t, tNo, tNo + 0.4)); if (qq > 0) { ctx.save(); ctx.translate(540, 1000); ctx.scale(qq, qq); ctx.rotate(-0.06); K.text('?', 0, 0, 420, K.rgba(C.coralLight, 0.8), { align: 'center' }); ctx.restore(); }
        chip('which one?', 540, 1440, t, tWhich, -0.04, 'eye');
        K.pip(880, lerp(1740, 1560, eo(seg(lt, 0.6, 1.2))), 0.7, { t, look: -1, lookY: -0.5, happy: 0, wave: 0 });
      } });
    cue(0.1, 'pop', { gain: 0.5 }); cue(0.25, 'whoosh', { gain: 0.5 }); cue(0.7, 'slide', { dur: 0.4, gain: 0.5 }); cue(tNo, 'pop', { gain: 0.6 }); cue(tNo + 0.05, 'thud', { gain: 0.4 }); cue(tWhich, 'pop', { gain: 0.5 });
  }

  // ───────── 2 · the website: its name types into the address bar ─────────
  {
    const st = cut(1), tSite = wd(1, 3), tThat = wd(1, 11), tDot = wd(1, 12);
    add({ id: 'S02', at: st, note: 'ring + step pills appear; a browser window slides up, the address types, a hero title writes on, task cards pop in; ".com" chip lands; tilt-down push camera',
      cam: (lt, d) => ({ x: 540, y: lerp(800, 990, eo(clamp(lt / 1.6))), z: lerp(1.18, 1.0, eo(clamp(lt / 1.4))), r: lerp(0.035, 0, eo(clamp(lt / 1.2))) }),
      draw(lt, d, t) {
        header(t);
        const sl = eo(seg(lt, 0.15, 0.7));
        ctx.save(); ctx.translate(0, (1 - sl) * 900); win(WX, WY, WW, WH, 'theresanaiforthat.com', seg(t, tSite, tThat + 0.2));
        const hp = eo(seg(t, tSite + 0.3, tSite + 1.5)); if (hp > 0) { ctx.save(); ctx.font = '800 64px Sora'; const hw = ctx.measureText("There's An AI For That").width; ctx.beginPath(); ctx.rect(540 - hw / 2 - 20, 780, (hw + 40) * hp, 120); ctx.clip();
          const g = ctx.createLinearGradient(540 - hw / 2, 0, 540 + hw / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text("There's An AI For That", 540, 840, 64, g, { align: 'center' }); ctx.restore(); }
        searchBar(1000, '', 0, t, 'search by task…', 0);
        ['Write', 'Plan', 'Design', 'Learn'].forEach((n, i) => { const q = eob(seg(t, tSite + 1.0 + i * 0.25, tSite + 1.4 + i * 0.25)); if (q > 0) { ctx.save(); ctx.translate(200 + i * 227, 1170); ctx.scale(q, q); K.glass(-95, -50, 190, 100, 34, { blur: 20, dy: 8 }); K.text(n, 0, 3, 36, C.paper, { align: 'center' }); ctx.restore(); } });
        ctx.restore();
        const dq = eob(seg(t, tDot, tDot + 0.35)); if (dq > 0) { K.chip('dot com', 540, 1470, dq, 0.04 + Math.sin(t * 2) * 0.012, clamp(dq * 3), 'unlock'); shock(540, 1500, t, tDot + 0.1, 420, 70); }
        K.pip(920, 1560, 0.5, { t, look: -1, lookY: -0.4, happy: t > tDot ? 1 : 0, wave: 0 });
      } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slide', { dur: 0.5, gain: 0.5 }); for (let k = 0; k < 8; k++) cue(tSite + k * 0.18, 'tock', { gain: 0.28 }); [0, 1, 2, 3].forEach((i) => cue(tThat + i * 0.18, 'pop', { gain: 0.35 })); cue(tDot, 'thud', { gain: 0.7 });
  }

  // ───────── 3 · STEP 1: type the task in plain words ─────────
  {
    const st = cut(2), tType = wd(2, 2), tPlain = wd(2, 9), tTurn = wd(2, 12), tList = wd(2, 19);
    const tt = [tTurn + 0.6, tTurn + 1.0, tTurn + 1.4, tTurn + 1.8];
    add({ id: 'S03', at: st, note: 'step 1 flips in; the search bar waits with a cursor then the task types out in time with the words; four result cards arrive one by one with different entrances; low left-to-right pan',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(610, 470, eio(p)), y: lerp(1110, 940, eo(clamp(lt / 2.0))), z: lerp(1.0, 1.09, eio(p)), r: lerp(0.02, -0.012, p) }; },
      draw(lt, d, t) {
        header(t);
        win(WX, WY, WW, WH, 'theresanaiforthat.com');
        searchBar(790, 'turn my notes into a to-do list', seg(t, tTurn - 0.05, tList + 0.3), t, 'describe your task…', 1);
        [0, 1, 2, 3].forEach((i) => { const ga = eo(seg(t, st + 1.0 + i * 0.15, st + 1.5 + i * 0.15)) * (1 - seg(t, tt[i], tt[i] + 0.3)); if (ga > 0) K.panel(140, CY[i] - 52, 800, 104, { ghost: ga }); });
        // results
        [0, 1, 2, 3].forEach((i) => {
          const q = seg(t, tt[i], tt[i] + 0.5); if (q <= 0) return;
          const o = { a: clamp(q * 3) };
          if (i === 0) o.dx = (1 - eo(q)) * -700;
          if (i === 1) o.s = 0.1 + 0.9 * eob(q);
          if (i === 2) o.y = lerp(CY[2] - 260, CY[2], q * q) - (q > 0.98 ? 0 : 0);
          if (i === 3) { o.dx = (1 - eo(q)) * 700; }
          card(i, o);
        });
        chip('plain words', 540, 1470, t, tPlain, -0.04, 'pen');
      } });
    cue(st, 'whoosh'); cue(st + 0.35, 'pop', { gain: 0.5 }); for (let k = 0; k < 10; k++) cue(tTurn + k * 0.17, 'tock', { gain: 0.28 }); tt.forEach((x) => cue(x, 'pop', { gain: 0.4 })); cue(tPlain, 'pop', { gain: 0.5 }); doneCues(0);
  }

  // ───────── 4 · STEP 2: filter by price ─────────
  {
    const st = cut(3), tFilter = wd(3, 2), tPrice = wd(3, 4), tFree = wd(3, 10), tFm = wd(3, 12), tStart = wd(3, 8);
    const FC = [['Free', 230, tFree], ['Freemium', 520, tFm], ['Free trial', 810, 99]];
    add({ id: 'S04', at: st, note: 'step 2 drops with shockwave; a row of filter chips slides in; the paid card is struck out and slides away; Free and Freemium light up with sparks; landing shake, pull-out',
      cam: (lt, d, t) => { const a = t - tFilter; return { x: lerp(560, 540, eo(clamp(lt / 2))), y: lerp(1000, 930, eo(clamp(lt / 1.5))), z: lerp(1.16, 1.0, eo(clamp(lt / 2.2))), r: lerp(-0.03, 0, eo(clamp(lt / 1.4))), dx: a > 0 && a < 1 ? Math.exp(-8 * a) * Math.sin(a * 48) * 8 : 0, dy: a > 0 && a < 1 ? Math.exp(-8 * a) * Math.cos(a * 42) * 8 : 0 }; },
      draw(lt, d, t) {
        header(t);
        win(WX, WY, WW, WH, 'theresanaiforthat.com');
        FC.forEach(([n, x, on], i) => { const q = eob(seg(t, tFilter + i * 0.15, tFilter + 0.4 + i * 0.15)); if (q <= 0) return; const lit = eo(seg(t, on, on + 0.3));
          ctx.save(); ctx.translate(x - (1 - eo(q)) * 500, 815); ctx.scale(Math.max(0.05, q), 1);
          ctx.font = '800 36px Sora'; const w = ctx.measureText(n).width + 64; K.glass(-w / 2, -42, w, 84, 42, { blur: 18, dy: 8, top: lit > 0 ? C.violet : undefined, bot: lit > 0 ? C.coral : undefined, edge: K.rgba(C.paper, 0.2 + 0.4 * lit) });
          K.text(n, 0, 3, 36, C.paper, { align: 'center' }); ctx.restore(); if (lit > 0 && lit < 1) K.burst(x, 815, lit, 7, 80, i * 3 + 1); });
        const out = seg(t, tPrice, tPrice + 0.6);
        [0, 1, 2, 3].forEach((i) => { const o = {};
          if (i === 2) { o.dx = eo(out) * 900; o.a = 1 - out; }
          if (i === 1 && t > tFm) o.hi = 0.5 + 0.5 * Math.sin(t * 6); if (i === 0 && t > tFree) o.hi = 0.5 + 0.5 * Math.sin(t * 6 + 1);
          card(i, o); });
        if (out > 0 && out < 1) { ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 20; const sp = eo(seg(t, tPrice, tPrice + 0.25)); ctx.beginPath(); ctx.moveTo(240, CY[2] + 6); ctx.lineTo(240 + 600 * sp, CY[2] - 8); ctx.stroke(); ctx.restore(); }
        chip('start with free', 540, 1470, t, tStart, -0.04, 'down');
      } });
    cue(st, 'zip', { dur: 0.4 }); cue(st + 0.35, 'thud', { gain: 0.6 }); [0, 1, 2].forEach((i) => cue(tFilter + i * 0.15, 'slide', { dur: 0.3, gain: 0.4 })); cue(tPrice, 'zip', { dur: 0.3, gain: 0.5 }); cue(tPrice + 0.5, 'whoosh', { gain: 0.4 });
    cue(tFree, 'pop', { gain: 0.6 }); cue(tFm, 'pop', { gain: 0.6 }); cue(tStart, 'pop', { gain: 0.4 }); doneCues(1);
  }

  // ───────── 5 · STEP 3: save the useful ones, try one at a time ─────────
  {
    const st = cut(4), tSave = wd(4, 2), tUse = wd(4, 6), tTry = wd(4, 9), tOne = wd(4, 11), tTime = wd(4, 14);
    const mk = [tSave, tSave + 0.45, tUse];
    const hx = (t) => { const s = seg(t, tTry, tTime + 0.2); return s; };
    add({ id: 'S05', at: st, note: 'step 3 writes on; bookmark badges stamp onto the three cards one by one; a coral highlight hops card to card for "one at a time"; orbiting roll',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(580, 500, p), y: lerp(880, 960, eio(p)), z: lerp(1.0, 1.1, eio(p)), r: Math.sin(lt * 1.0) * 0.03 }; },
      draw(lt, d, t) {
        header(t);
        win(WX, WY, WW, WH, 'theresanaiforthat.com');
        K.text('My saved tools', 540, 790, 52, C.paper, { align: 'center', a: eo(seg(t, tSave - 0.2, tSave + 0.3)) });
        K.text('3 tools', 540, 850, 30, C.dim, { align: 'center', ui: true, a: eo(seg(t, tSave + 0.8, tSave + 1.2)) });
        const s = hx(t), at = Math.min(2, Math.floor(s * 3)), ids = [0, 1, 3];
        ids.forEach((ci, k) => { const y = CY[k] + 0; const hi = t > tTry && at === k && s < 1 ? 0.6 + 0.4 * Math.sin(t * 8) : 0;
          card(ci, { y, mark: seg(t, mk[k], mk[k] + 0.4), hi }); });
        const bq = eob(seg(t, tOne, tOne + 0.35)); if (bq > 0) K.chip('one at a time', 540, 1470, bq, -0.04 + Math.sin(t * 2) * 0.012, clamp(bq * 3), 'up');
        const sq = eob(seg(t, tSave, tSave + 0.35)); if (sq > 0) K.chip('save', 760, 700, 0.7 * sq, 0.05, clamp(sq * 3), 'unlock');
      } });
    cue(st, 'slide', { dur: 0.5, gain: 0.6 }); mk.forEach((x) => { cue(x, 'pop', { gain: 0.6 }); cue(x + 0.03, 'tock', { gain: 0.4 }); }); for (let k = 0; k < 3; k++) cue(tTry + k * 0.35, 'whoosh', { gain: 0.3 }); cue(tOne, 'pop', { gain: 0.5 }); doneCues(2);
  }

  // ───────── 6 · the caveat: a directory, not a guarantee; some listings are sponsored ─────────
  {
    const st = cut(5), tDir = wd(5, 3), tNot = wd(5, 4), tGua = wd(5, 6), tList = wd(5, 9), tSp = wd(5, 12);
    add({ id: 'S06', at: st, note: 'step 4 rises with chevrons; "directory" drops in, "not" a coral slash, "guarantee" fades with a strike; a listing card appears and a coral SPONSORED stamp slams on; push-in with roll',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(500, 570, p), y: lerp(1000, 940, eo(p)), z: lerp(1.0, 1.15, eio(p)), r: lerp(-0.05, 0.015, eo(clamp(lt / 2))) }; },
      draw(lt, d, t) {
        header(t);
        const dp = seg(t, tDir - 0.25, tDir + 0.1), da = t - tDir - 0.1;
        if (dp > 0) { let y = lerp(520, 780, dp * dp), sy = 1; if (da > 0) { y = 780 - 40 * Math.exp(-5 * da) * Math.abs(Math.sin(da * 11)); sy = 1 - Math.exp(-9 * da) * 0.1; } ctx.save(); ctx.translate(540, y); ctx.scale(1, sy); K.text('a directory', 0, 0, 100, C.paper, { align: 'center' }); ctx.restore(); shock(540, 850, t, tDir + 0.1, 460, 70); }
        const gq = eob(seg(t, tGua - 0.1, tGua + 0.35)); if (gq > 0) { ctx.save(); ctx.translate(540, 940); ctx.scale(gq, gq); K.text('a guarantee', 0, 0, 100, K.rgba(C.paper, 0.45), { align: 'center' }); ctx.restore(); }
        const nq = eob(seg(t, tNot - 0.05, tNot + 0.3)); if (nq > 0) { ctx.save(); ctx.translate(540, 860); ctx.scale(nq, nq); ctx.rotate(-0.1); K.text('NOT', 0, 0, 70, C.coral, { align: 'center' }); ctx.restore(); }
        const sp = eo(seg(t, tGua + 0.35, tGua + 0.75)); if (sp > 0) { ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(190, 950); ctx.lineTo(190 + 700 * sp, 930); ctx.stroke(); ctx.restore(); }
        const cq = seg(t, tList - 0.1, tList + 0.5); if (cq > 0) { card(0, { y: lerp(1500, 1190, eo(cq)), a: clamp(cq * 3) }); }
        const ss = seg(t, tSp - 0.05, tSp + 0.2); if (ss > 0) { ctx.save(); ctx.translate(830, 1128); ctx.rotate(-0.1); const s = lerp(2.2, 1, eo(ss)); ctx.scale(s, s); ctx.globalAlpha *= clamp(ss * 3);
          ctx.font = '800 32px Sora'; const w = ctx.measureText('SPONSORED').width + 44; rr(-w / 2, -32, w, 64, 18); ctx.fillStyle = K.rgba(C.coral, 0.95); ctx.shadowColor = K.rgba(C.coral, 0.8); ctx.shadowBlur = 24; ctx.fill(); ctx.shadowColor = 'transparent'; K.text('SPONSORED', 0, 3, 32, C.white, { align: 'center' }); ctx.restore(); shock(830, 1250, t, tSp + 0.1, 380, 70); }
        chip('read before you trust', 540, 1470, t, tSp + 0.05, -0.04, 'eye');
      } });
    cue(st, 'slide', { dur: 0.5, gain: 0.6 }); cue(tDir - 0.2, 'zip', { dur: 0.3, gain: 0.5 }); cue(tDir + 0.1, 'thud', { gain: 0.6 }); cue(tNot, 'pop', { gain: 0.5 }); cue(tGua, 'pop', { gain: 0.4 }); cue(tGua + 0.4, 'zip', { dur: 0.3, gain: 0.4 }); cue(tList, 'whoosh', { gain: 0.4 }); cue(tSp, 'thud', { gain: 0.8 }); cue(tSp + 0.05, 'pop', { gain: 0.5 });
  }

  // ───────── 7 · test it: a three-point checklist ─────────
  {
    const st = cut(6), tRead = wd(6, 1), tCheck = wd(6, 5), tTest = wd(6, 9), tFirst = wd(6, 15);
    const ys = [820, 990, 1160];
    add({ id: 'S07', at: st, note: 'three rows: "read the page" slides in with a magnifier, "check pricing" flips in, "test small" drops with a bounce; ticks land; diagonal sweep from the top right',
      cam: (lt, d) => { const p = eio(lt / d); return { x: lerp(620, 470, p), y: lerp(760, 980, p), z: lerp(1.14, 1.04, p), r: lerp(0.035, -0.012, p) }; },
      draw(lt, d, t) {
        header(t);
        const row = (i, label, sub, at, entr, icon) => { const q = seg(t, at - 0.15, at + 0.4); if (q <= 0) return;
          ctx.save(); const y = ys[i]; let tx = 0, ty = 0, sx = 1;
          if (entr === 0) tx = (1 - eo(q)) * -800; if (entr === 1) sx = Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, Math.PI * 2, eo(q))))); if (entr === 2) { const a = t - at - 0.1; ty = q < 1 ? lerp(-300, 0, q * q) : (a > 0 ? -40 * Math.exp(-5 * a) * Math.abs(Math.sin(a * 11)) : 0); }
          ctx.translate(540 + tx, y + ty); ctx.scale(sx, 1);
          K.glass(-390, -66, 780, 132, 44, { blur: 30, dy: 12, edge: K.rgba(C.violetLight, 0.45) });
          circle(-318, 0, 38, K.rgba(C.violet, 0.9)); K.text(String(i + 1), -318, 3, 40, C.white, { align: 'center' });
          K.text(label, -250, -12, 44, C.paper); K.text(sub, -250, 30, 28, C.dim, { ui: true });
          const tk = eob(seg(t, at + 0.5, at + 0.9)); if (tk > 0) { ctx.save(); ctx.translate(330, 0); ctx.scale(tk, tk); circle(0, 0, 32, C.violetLight); ctx.strokeStyle = C.deep; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-3, 12); ctx.lineTo(15, -10); ctx.stroke(); ctx.restore(); }
          ctx.restore(); };
        row(0, 'Read its page', 'what it really does', tRead, 0); row(1, 'Check pricing', 'free, freemium or paid', tCheck, 1); row(2, 'Test a small task', 'before you rely on it', tTest, 2);
        const mq = seg(t, tRead, tRead + 1.2); if (mq > 0 && mq < 1) K.magnifier(lerp(260, 760, eio(mq)), ys[0] + Math.sin(mq * 9) * 14, eob(clamp(mq * 4)), 1 - seg(mq, 0.7, 1));
        chip('small task first', 540, 1470, t, tFirst - 0.55, -0.04, 'down');
        K.pip(920, 1330, 0.5, { t, look: -1, lookY: -0.3, happy: t > tFirst ? 1 : 0, wave: 0 });
      } });
    cue(st, 'slide', { dur: 0.5, gain: 0.5 }); cue(tRead, 'whoosh', { gain: 0.5 }); cue(tRead + 0.5, 'pop', { gain: 0.5 }); cue(tCheck, 'whoosh', { gain: 0.4 }); cue(tCheck + 0.4, 'pop', { gain: 0.5 }); cue(tTest - 0.2, 'zip', { dur: 0.3, gain: 0.5 }); cue(tTest + 0.1, 'thud', { gain: 0.7 }); cue(tTest + 0.5, 'pop', { gain: 0.5 }); doneCues(3);
  }

  // ───────── 8 · loop: there probably is, so go look ─────────
  {
    const st = cut(7), tThere = wd(7, 5), tThat = wd(7, 9), tProb = wd(7, 11), tGo = wd(7, 13), tLook = wd(7, 15);
    add({ id: 'S08', at: st, note: 'spotlight; tool tiles drift back; the title writes on, a big check pops on "probably", a magnifier sweeps on "go look", Pip waves; settle-in pull-out',
      cam: (lt, d) => ({ x: lerp(500, 540, eo(clamp(lt / 1.4))), y: lerp(880, 960, eio(clamp(lt / d))), z: lerp(1.2, 1.0, eo(clamp(lt / 1.6))), r: lerp(-0.04, 0, eo(clamp(lt / 1.4))) }),
      draw(lt, d, t) {
        header(t, { final: true });
        hookLanes(t, 0.3 * eo(seg(lt, 0.2, 0.9)), lt);
        K.spot(540, eo(seg(lt, 0, 0.5)) * 0.6);
        const tp = eo(seg(t, tThere - 0.1, tThat + 0.5)); if (tp > 0) { ctx.save(); ctx.font = '800 76px Sora'; const lw = ctx.measureText("there's an AI for that").width; ctx.beginPath(); ctx.rect(540 - lw / 2 - 20, 690, (lw + 40) * tp, 150, 0); ctx.clip();
          const g = ctx.createLinearGradient(540 - lw / 2, 0, 540 + lw / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral); K.text("there's an AI for that", 540, 760, 76, g, { align: 'center' }); ctx.restore(); }
        const ck = seg(t, tProb - 0.05, tProb + 0.5); if (ck > 0) { ctx.save(); ctx.translate(540, 1010); const s = eob(ck) * 1.3; ctx.scale(s, s); circle(0, 0, 120, C.mint); ctx.strokeStyle = C.deep; ctx.lineWidth = 24; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-48, 4); ctx.lineTo(-12, 42); ctx.lineTo(54, -36); ctx.stroke(); ctx.restore(); K.burst(540, 1010, seg(t, tProb + 0.1, tProb + 1.0), 12, 260, 5); shock(540, 1180, t, tProb + 0.1, 520, 100); }
        const mq = seg(t, tGo, tLook + 0.5); if (mq > 0) K.magnifier(lerp(240, 800, eio(mq)), 1290 + Math.sin(mq * 8) * 20, eob(clamp(mq * 4)), 1);
        K.pip(900, 1420, 0.65, { t, look: -1, lookY: -0.3, happy: 1, wave: seg(t, tLook - 0.1, tLook + 0.3) });
        K.confetti(t - tProb - 0.1, 44);
      } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(tThere, 'pop', { gain: 0.4 }); for (let k = 0; k < 5; k++) cue(tThere + k * 0.2, 'tock', { gain: 0.25 }); cue(tProb, 'thud', { gain: 0.8 }); cue(tProb + 0.05, 'sparkle', { dur: 0.9, gain: 0.7 }); cue(tGo, 'whoosh', { gain: 0.4 }); cue(tLook, 'pop', { gain: 0.5 });
  }

  return { shots: S, cues: CUES };
}
