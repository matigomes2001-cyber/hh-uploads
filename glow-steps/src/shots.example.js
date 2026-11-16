// WHICH AI DO PEOPLE ACTUALLY USE? v2: the shot list (the only file that changes per video, with script.json).
// A shot: { id, at, cam, note, draw(lt, d, t) } · lt = time in shot, d = shot length, t = film time.
// cam is a FUNCTION (lt, d, t) => { x, y, z, r, dx, dy }: its own camera move per shot. Subtitles are off; short sticker chips carry the facts.
// Sound: cue(t, type, { gain, dur }): whoosh · pop · sparkle · slide · tock · thud · zip (see tools/mix.py).
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

const HOOK = [
  ['ChatGPT', 'Perplexity', 'Midjourney', 'Copilot', 'Suno', 'Cursor', 'Runway', 'Gemini'],
  ['Claude', 'Grok', 'Canva', 'Notion', 'Grammarly', 'DeepSeek', 'Replit', 'Descript'],
  ['Copilot', 'Runway', 'Gemini', 'Suno', 'Perplexity', 'Cursor', 'Claude', 'Midjourney'],
  ['Grok', 'Descript', 'ChatGPT', 'Canva', 'Replit', 'Notion', 'DeepSeek', 'Grammarly'],
  ['Suno', 'Gemini', 'Cursor', 'Claude', 'Midjourney', 'Copilot', 'Perplexity', 'Runway'],
];
const LANE_Y = [600, 750, 900, 1050, 1200];
const LANE_S = [0.8, 0.92, 1.04, 0.92, 0.8];   // depth: the middle lane is closest
/** the hook's drifting tiles; `a` is the overall alpha, `lt` staggers the lanes in one after another */
function hookLanes(t, a = 1, lt = 99) {
  HOOK.forEach((names, i) => K.lane(t, LANE_Y[i], i % 2 ? 1 : -1, 40 + i * 12, names, LANE_S[i], a * eo(clamp((lt - i * 0.12) / 0.35))));
}
/** headline card: a title, not subtitles: shown whole */
function headline(lt, a = 1) {
  const l1 = eob(seg(lt, 0.2, 0.6)), l2 = eob(seg(lt, 0.42, 0.82));
  ctx.save(); ctx.translate(540, 300); ctx.scale(l1, l1); K.text('Which AI do people', 0, 0, 84, C.paper, { align: 'center', a }); ctx.restore();
  ctx.save(); ctx.translate(540, 410); ctx.scale(l2, l2);
  ctx.font = '800 112px Sora'; const w = ctx.measureText('actually use?').width;
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, C.violetLight); g.addColorStop(1, C.coral);
  K.text('actually use?', 0, 0, 112, g, { align: 'center', a }); ctx.restore();
}

/** the leaderboard scene. o: { open: [ranks unlocked], current, rowU (0..1 for the current row), slide, urlP, ringAt, label, done, pulse, happy, wave } */
function scene(t, lt, o) {
  K.bg(t);
  ctx.save(); ctx.translate(0, OY);
  ctx.save(); ctx.translate(0, (1 - eo(clamp(o.slide ?? 1))) * 1100);
  K.windowFrame('web traffic · october', o.urlP ?? 1);
  for (let r = 1; r <= 5; r++) K.row(r, o.open.includes(r) ? 1 : r === o.current ? (o.rowU ?? 0) : 0);
  ctx.restore();
  const ringIn = eob(clamp((lt - (o.ringAt ?? 0)) / 0.4));
  ctx.save(); ctx.translate(160, 170); ctx.scale(ringIn, ringIn); ctx.translate(-160, -170);
  K.ring(160, 170, 70, 5, o.done ?? 0, o.label, o.pulse ?? 0); ctx.restore();
  K.text('most visited AI', 270, 148, 54, C.paper, { a: ringIn });
  K.text('top 5, by website visits', 270, 202, 28, C.dim, { ui: true, a: ringIn });
  K.pip(940, 178, 0.55, { t, look: -1, lookY: 0.6, happy: o.happy ?? 0, wave: o.wave ?? 0 });
  ctx.restore();
}

/** draw a rank's row as a big "hero card" with a pose { x, y, sx, sy, rot, a, clipW } */
function hero(rank, p) {
  const [mx, my] = K.rowMid(rank);
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0); ctx.scale(p.sx, p.sy); ctx.translate(-mx, -my); ctx.globalAlpha *= p.a ?? 1;
  if (p.clipW != null) { ctx.beginPath(); ctx.rect(mx - 450, my - 110, 900 * p.clipW, 220); ctx.clip(); }
  K.row(rank, 1);
  ctx.restore();
}

const BASE = 1.1, CY = 790;   // hero size and resting height
const OY = 100;                // the whole leaderboard scene sits this much lower (no subtitles, so the frame is balanced)

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0.02, t).toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · HOOK: a headline, hundreds of tools drift past in depth lanes, Pip peeks in ──
  {
    const st = cut(0), use = Wd('actually', 0) - st;
    add({ id: 'S01', at: st, note: 'headline card + five depth lanes of tiles drifting; slow drifting roll camera; Pip peeks in and gets curious on "actually"',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(500, 590, p), y: 960, z: lerp(1.0, 1.09, eio(p)), r: lerp(-0.014, 0.01, p) }; },
      draw(lt, d, t) {
        K.bg(t); hookLanes(t, 1, lt + 0.25);
        headline(lt);
        K.pip(860, lerp(1640, 1385, eo(seg(lt, 0.5, 1.1))), 0.82, { t, look: -1, lookY: -0.3, happy: lt > use ? 1 : 0, wave: seg(lt, use, use + 0.2) });
      } });
    cue(0.1, 'pop', { gain: 0.5 }); cue(0.25, 'whoosh', { gain: 0.5 }); cue(st + 0.6, 'pop', { gain: 0.45 }); cue(st + 0.55, 'slide', { dur: 0.4 }); cue(st + use, 'pop', { gain: 0.5 });
  }

  // ── 2 · the window slides up and a magnifier scans the five locked rows ──
  {
    const st = cut(1), five = Wd('five', 1) - st;
    add({ id: 'S02', at: st, note: 'window slides up while the camera tilts down; URL types in; magnifier scans the locked rows; ring pulses on "five"',
      cam: (lt, d) => { const p = lt / d; return { x: 540, y: lerp(1080, 820, eo(clamp(lt / 1.0))), z: lerp(1.16, 1.0, eo(clamp(lt / 1.0))) + 0.02 * p, r: lerp(0.03, 0, eo(clamp(lt / 1.0))) }; },
      draw(lt, d, t) {
        scene(t, lt, { open: [], current: 0, slide: seg(lt, 0, 0.55), urlP: seg(lt, 0.45, 1.5), ringAt: 0.35, label: '5', done: 0, pulse: lt > five ? Math.max(0, 1 - (lt - five) * 4) : 0 });
        // magnifier sweeps down the rows; each row lights up as the lens passes
        ctx.save(); ctx.translate(0, OY);
        const sp = eio(seg(lt, 0.9, d - 0.5)), y0 = K.rowMid(1)[1], y1 = K.rowMid(5)[1], my = lerp(y0, y1, sp), mxx = 540 + Math.sin(lt * 2.6) * 150;
        for (let r = 1; r <= 5; r++) { const dy = Math.abs(K.rowMid(r)[1] - my), a = clamp(1 - dy / 110) * 0.3 * seg(lt, 0.9, 1.1); if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.violetLight; ctx.beginPath(); ctx.roundRect(K.BOARD.x + 30, K.rowTop(r), K.BOARD.w - 60, 138, 38); ctx.fill(); ctx.restore(); } }
        K.magnifier(mxx, my, eob(seg(lt, 0.8, 1.2)));
        ctx.restore();
      } });
    cue(st, 'whoosh'); cue(st + 0.3, 'slide', { dur: 0.35 }); cue(st + five, 'pop', { gain: 0.6 });
    for (let k = 0; k < 4; k++) cue(st + 1.2 + k * 0.55, 'tock', { gain: 0.35 });
  }

  // ── 3-7 · the countdown: every rank has its own reveal, camera move and sticker ──
  const REVEAL = {
    5: { // card flips in from the right with speed lines
      stamp: (p) => ({ x: lerp(-520, 540, eo(p)), y: 560, rot: -0.12 }),
      pose: (p, after, o) => { o.x = lerp(1500, 540, eo(p)); o.rot = lerp(-0.4, 0, eob(p)); o.sx = BASE * Math.max(0.03, Math.abs(Math.cos(lerp(Math.PI * 1.5, 0, eo(p))))); },
      cam: (lt, at) => ({ x: lerp(585, 510, eio(clamp(lt / (at + 1.4)))), y: 930, z: lerp(1.0, 1.06, eio(clamp(lt / (at + 1.4)))), r: lerp(-0.022, 0.004, eo(clamp(lt / (at + 0.8)))) }),
      extras: (lt, at, e0, t) => { const p = seg(lt, e0, at); if (p < 1 && p > 0) { ctx.save(); ctx.strokeStyle = C.violetLight; ctx.lineCap = 'round'; for (let i = 0; i < 7; i++) { const y = 640 + i * 50 + rnd(i) * 20, x1 = lerp(1500, 540, eo(p)) + 330, len = 220 + rnd(i + 3) * 260; ctx.globalAlpha = 0.5 * (1 - p); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + len, y); ctx.stroke(); } ctx.restore(); } },
      chips: () => [{ txt: 'inside X', icon: 'x', at: Wd('lives', 2) - cut(2), x: 540, y: 1500, rot: -0.05 }],
      sfx: (st, at, e0) => { cue(st + e0, 'whoosh'); cue(st + at, 'thud'); },
    },
    4: { // card drops from the top and bounces; a shockwave ring spreads
      stamp: (p) => ({ x: 540, y: lerp(-380, 560, eo(p)), rot: 0.08 }),
      pose: (p, after, o) => { o.y = lerp(-260, CY, p * p); if (after > 0) { const b = Math.exp(-5 * after) * Math.abs(Math.sin(after * 11)), sq = Math.exp(-9 * after) * 0.18; o.y = CY - 90 * b; o.sy = BASE * (1 - sq); o.sx = BASE * (1 + sq * 0.6); } },
      cam: (lt, at) => { const a = lt - at; return { x: 540, y: lerp(620, 940, eo(clamp(lt / (at + 0.4)))), z: lerp(1.14, 1.0, eo(clamp(lt / (at + 0.8)))), r: 0, dy: a > 0 ? Math.exp(-7 * a) * Math.sin(a * 46) * 14 : 0 }; },
      extras: (lt, at) => { const p = seg(lt, at, at + 0.7); if (p > 0 && p < 1) { ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 10 * (1 - p); ctx.globalAlpha = 0.8 * (1 - p); ctx.beginPath(); ctx.ellipse(540, CY + 110, lerp(120, 640, eo(p)), lerp(30, 150, eo(p)), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } },
      chips: () => [{ txt: 'open models', icon: 'unlock', at: Wd('known', 3) - cut(3), x: 540, y: 1500, rot: 0.05 }],
      sfx: (st, at, e0) => { cue(st + e0, 'zip', { dur: 0.45 }); cue(st + at, 'thud'); cue(st + at + 0.35, 'thud', { gain: 0.45 }); },
    },
    3: { // card is written out left to right with a cursor; code glyphs float up
      stamp: (p) => ({ x: 540, y: 560, sc: lerp(0.4, 1, eob(p)), rot: lerp(-0.45, -0.05, eo(p)) }),
      pose: (p, after, o) => { o.sx = o.sy = BASE * lerp(0.9, 1, eo(p)); o.clipW = eo(p); },
      cam: (lt, at) => ({ x: lerp(500, 560, lt / 4), y: lerp(980, 820, eio(clamp(lt / 3))), z: lerp(1.0, 1.12, eio(clamp(lt / 3.4))), r: lerp(-0.03, 0.02, eio(clamp(lt / 3.4))) }),
      extras: (lt, at, e0, t) => {
        const p = seg(lt, e0, at);
        if (p > 0 && p < 1) { const cx = 540 - 450 * BASE + 900 * BASE * eo(p); ctx.save(); ctx.shadowColor = K.rgba(C.coral, 0.9); ctx.shadowBlur = 24; ctx.fillStyle = C.coral; ctx.fillRect(cx - 4, CY - 100, 8, 200); ctx.restore(); }
        ['{ }', '</>', '//', '¶'].forEach((g, i) => { const q = seg(lt, at + i * 0.18, at + 1.5 + i * 0.18); if (q > 0 && q < 1) K.text(g, 220 + i * 215, lerp(CY - 140, CY - 330, eo(q)), 62, C.violetLight, { align: 'center', a: Math.sin(Math.PI * q) * 0.8 }); });
      },
      chips: () => [{ txt: 'writing', icon: 'pen', at: Wd('writing', 4) - cut(4), x: 350, y: 1440, rot: -0.06 }, { txt: 'coding', icon: 'code', at: Wd('coding', 4) - cut(4), x: 730, y: 1570, rot: 0.05 }],
      sfx: (st, at, e0) => { for (let k = 0; k < 7; k++) cue(st + e0 + (at - e0) * (k / 7), 'tock', { gain: 0.4 }); cue(st + at, 'pop'); },
    },
    2: { // card rises from the bottom with chevrons: it climbs
      stamp: (p) => ({ x: 540, y: lerp(1500, 560, eo(p)), rot: 0.06 }),
      pose: (p, after, o) => { o.y = lerp(1560, CY, eo(p)); o.x = 540 + Math.sin(p * Math.PI * 3) * 50 * (1 - p); o.rot = Math.sin(p * Math.PI * 3) * 0.08 * (1 - p); },
      cam: (lt, at) => ({ x: 540, y: lerp(1180, 780, eio(clamp(lt / (at + 0.5)))), z: lerp(1.0, 1.08, eio(clamp(lt / 3.6))), r: lerp(0.02, 0, eo(clamp(lt / (at + 0.5)))) }),
      extras: (lt, at, e0, t) => { const p = seg(lt, e0, at + 0.5); if (p < 1) K.chevrons(540 + Math.sin(p * 9) * 20, lerp(1560, CY, eo(Math.min(1, p * 1.2))), t, 1 - p * 0.4); },
      chips: () => [{ txt: 'climbing fast', icon: 'up', at: Wd('climbed', 5) - cut(5), x: 540, y: 1500, rot: -0.04 }],
      sfx: (st, at, e0) => { cue(st + e0, 'slide', { dur: 0.5 }); cue(st + at, 'pop'); cue(st + at + 0.05, 'sparkle', { dur: 0.6, gain: 0.6 }); },
    },
    1: { // spotlight, crown, confetti, big pull-out
      stamp: (p) => ({ x: 540, y: 560, sc: lerp(2.3, 1, eo(p)), rot: 0 }),
      pose: (p, after, o) => { const s = lerp(0.15, 1, eob(p)); o.sx = o.sy = BASE * 1.06 * s; },
      cam: (lt, at) => { const a = lt - at; return { x: 540, y: lerp(840, 900, eio(clamp(lt / 3))), z: lerp(1.2, 1.0, eo(clamp(lt / (at + 0.9)))), r: 0, dx: a > 0 ? Math.exp(-6 * a) * Math.sin(a * 50) * 10 : 0, dy: a > 0 ? Math.exp(-6 * a) * Math.cos(a * 44) * 10 : 0 }; },
      extras: (lt, at, e0, t) => { const a = eo(seg(lt, e0 - 0.1, at)) * (1 - 0.7 * eo(seg(lt, at + 1.4, at + 2.2))); K.spot(540, a); K.confetti(lt - at, 56); },
      chips: () => [{ txt: 'share shrinking', icon: 'down', at: Wd('share', 6) - cut(6), x: 540, y: 1500, rot: -0.04 }],
      sfx: (st, at, e0) => { cue(st + e0, 'whoosh'); cue(st + at, 'thud'); cue(st + at + 0.1, 'sparkle', { dur: 0.9 }); },
      dimMax: 0.62, dockDelay: 1.4,
    },
  };

  const rankShot = (id, idx, rank, word) => {
    const R = REVEAL[rank], st = cut(idx), at = Wd(word, idx) - st, e0 = Math.max(0.05, at - 0.5);
    const dk = at + (R.dockDelay ?? 1.05), open = [5, 4, 3, 2, 1].filter((r) => r > rank), rowY = K.rowMid(rank)[1];
    const chips = R.chips();
    add({ id, at: st, note: `rank ${rank}: own reveal + camera`, cam: (lt, d, t) => R.cam(lt, at),
      draw(lt, d, t) {
        const rowU = seg(lt, dk + 0.4, dk + 0.75), dockP = eio(seg(lt, dk, dk + 0.45));
        scene(t, lt, { open, current: rank, rowU, label: String(rank), ringAt: -1, done: open.length + eo(seg(lt, dk + 0.4, dk + 0.9)), pulse: Math.sin(Math.PI * seg(lt, dk + 0.4, dk + 0.9)) * 0.9, happy: lt > at ? 1 : 0, wave: rank === 1 ? seg(lt, at + 0.3, at + 0.6) : 0 });
        // dim the list while the hero is on stage
        const dim = (R.dimMax ?? 0.5) * eo(seg(lt, e0 - 0.2, e0 + 0.2)) * (1 - eo(seg(lt, dk + 0.1, dk + 0.5)));
        if (dim > 0) { ctx.fillStyle = K.rgba(C.deep, dim); ctx.fillRect(-300, -300, W + 600, H + 600); }
        ctx.save(); ctx.translate(0, OY);
        // ghost numeral
        const sp = R.stamp(seg(lt, 0.05, 0.55)), sa = seg(lt, 0.05, 0.3) * (1 - eo(seg(lt, dk + 0.1, dk + 0.5)));
        if (sa > 0) K.stamp(String(rank), sp.x, sp.y, 760, { rot: sp.rot, sc: sp.sc, a: sa });
        R.extras(lt, at, e0, t);
        // the hero card: enters in the rank's own style, rests, then flies into its row
        if (lt >= e0) {
          const o = { x: 540, y: CY, sx: BASE, sy: BASE, rot: 0, a: 1 };
          R.pose(seg(lt, e0, at), lt - at, o);
          const idle = Math.sin(t * 3) * 5 * (1 - dockP);
          o.y = lerp(o.y + idle, rowY, dockP); o.x = lerp(o.x, 540, dockP); o.sx = lerp(o.sx, 1, dockP); o.sy = lerp(o.sy, 1, dockP); o.rot *= 1 - dockP;
          o.a = 1 - seg(lt, dk + 0.42, dk + 0.55);
          if (o.a > 0) hero(rank, o);
          // the crown sits on the #1 badge like a hat, rides along while it docks, then stays on its row
          if (rank === 1) K.crown(o.x - 264 * o.sx, o.y - 58 * o.sy, 0.5 * o.sx * eob(seg(lt, at + 0.15, at + 0.55)), seg(lt, at + 0.15, at + 0.3), -0.28);
        }
        // sparkles as the row docks
        const [bx, by] = K.rowMid(rank); K.burst(bx, by, seg(lt, dk + 0.4, dk + 1.2), 10, 170, rank * 7);
        // sticker chips with the key fact
        chips.forEach((c, i) => { const q = seg(lt, c.at, c.at + 0.35); if (q > 0) K.chip(c.txt, c.x, c.y, eob(q), c.rot + Math.sin(t * 2 + i) * 0.012, seg(lt, c.at, c.at + 0.12), c.icon); });
        ctx.restore();
      } });
    R.sfx(st, at, e0);
    cue(st + dk + 0.4, 'pop', { gain: 0.7 });
    chips.forEach((c) => cue(st + c.at, 'pop', { gain: 0.5 }));
  };
  rankShot('S03', 2, 5, 'grok');
  rankShot('S04', 3, 4, 'deepseek');
  rankShot('S05', 4, 3, 'claude');
  rankShot('S06', 5, 2, 'gemini');
  rankShot('S07', 6, 1, 'chatgpt');

  // ── 8 · the phone: apps pop in, one glows, tap ripples, Pip waves, the hook tiles return ──
  {
    const st = cut(7), ph = Wd('phone', 7) - st;
    add({ id: 'S08', at: st, note: 'phone rises, apps pop in one by one, glowing app gets "?" and tap ripples, slow orbiting camera, hook tiles return',
      cam: (lt, d) => { const p = lt / d; return { x: lerp(600, 500, p), y: lerp(900, 840, eio(p)), z: lerp(1.0, 1.1, eio(p)), r: Math.sin(lt * 0.9) * 0.025 }; },
      draw(lt, d, t) {
        K.bg(t);
        hookLanes(t, lerp(0.28, 0.85, eo(seg(lt, d - 1.5, d - 0.1))));
        const slide = eob(seg(lt, 0, 0.55)), py = lerp(1500, 800, slide) + Math.sin(t * 1.6) * 8;
        K.phone(540, py, 1.2, t, 4, '?', seg(lt, ph, ph + 0.3));
        if (lt > ph) K.ripple(540, py - 120, lt - ph, seg(lt, ph, ph + 0.2));
        K.pip(190, 1260, 0.85, { t, look: 1, wave: seg(lt, 0.4, 0.7), happy: 1 });
      } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slide', { dur: 0.4 }); cue(st + ph, 'pop'); cue(st + ph + 0.3, 'tock', { gain: 0.5 }); cue(st + ph + 1.1, 'tock', { gain: 0.4 });
  }

  return { shots: S, cues: CUES };
}
