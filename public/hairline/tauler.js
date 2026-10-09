/**
 * Tauler: a workshop tool wall over a card-catalog cabinet, told in three
 * attempts. The pointer's x picks one, and every part tweens there, staggered
 * out from the pointer: 1, one pegboard crammed with twelve near-identical
 * screwdrivers; 2, three smaller boards with gaps between them, four each;
 * 3, the drivers fold into one handle beside three bits, and the catalog
 * drawer under the wall slides out, its index cards standing in it. Between
 * them the parts pass through the middle layout. The slider is how far the
 * drawer slides, in world units.
 *
 * Rest is attempt 3 with the drawer half out and the handle bright: the
 * thumbnail is the post's answer, few tools and a catalog behind them.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, lerp, open, poly, prism, proj, ringAt, rings, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const N = 12, STEP = 35, CARDS = 14, Z0 = 5, ZH = 24, DY = 40;
const mix = (A, B, t) => A.map((a, k) => lerp(a, B[k], t));
/** A layout f(s), s = 0, 1, 2, read at q in [0, 2]: from attempt 1 to 3 through 2. */
const at = (f, q) => (q <= 1 ? mix(f(0), f(1), q) : mix(f(1), f(2), q - 1));
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/** Board g: [x0, x1, z0, z1] of its plate, then [x0, x1, z0, z1] of its hole grid. */
const board = (g) => (s) => [
  [0, 150, 34, 104], [12 + g * 63 - 24, 12 + g * 63 + 24, 38, 100], [44, 106, 42, 98],
][s].concat([
  [g * 50 + 6, g * 50 + 44, 40, 98], [g * 63 - 6, g * 63 + 30, 44, 94], [50, 100, 48, 92],
][s]);

/** Tool i: [x, top, handle w, handle h, shaft w, shaft h, tip h, tip w]. Nine drivers fold into one handle; 9 to 11 become bits. */
const tool = (i) => (s) => {
  if (s === 0) return [6 + (i * 138) / 11, 96, 7.5, 19, 1.8, 23 + (i % 3) * 2.5, 3.2, i % 2 ? 1.8 : 0.5];
  if (s === 1) { const g = Math.floor(i / 4), k = i % 4; return [12 + g * 63 + (k - 1.5) * 10.5, 92, 7.5, 19, 1.8, 21 + (k % 2) * 3, 3.2, [1.8, 0.5, 1.2][g]]; }
  return i < 9 ? [62, 92, 10.5, 27, 4.6, 8, 1, 4.6] : [80 + (i - 9) * 9, 86, 4.2, 1.5, 3.6, 15, 3.4, [3.6, 0.5, 1.8][i - 9]];
};

/** A tool hung flat on the wall: outline, grip grooves and the hanging hole, all in the plane y = 1. */
function toolPaths(P, p) {
  const [x, top, hw, hl, sw, sl, tl, tw] = p, a = top - hl, b = a - 2, c = b - sl, d = c - tl;
  const W = (u, v) => P(x + u, 1, v);
  const pts = [[-hw / 2, top], [hw / 2, top], [hw / 2, a], [sw / 2, b], [sw / 2, c], [tw / 2, d], [-tw / 2, d], [-sw / 2, c], [-sw / 2, b], [-hw / 2, a]];
  const out = poly(fillet(pts, [hw * 0.45, hw * 0.45, 1.2, 0.6, 0.4, 0.3, 0.3, 0.4, 0.6, 1.2]).map(([u, v]) => W(u, v)));
  if (hl < 8) return [out, "", ""];
  const gr = [-0.2, 0.2].map((k) => seg(W(hw * k, top - 7), W(hw * k, a + 3))).join("");
  return [out, gr, poly(rrect(-1, top - 4, 1, top - 2, 1, 3).map((q) => W(q.u, q.v)))];
}

/** The catalog drawer, open D units: far parts, painted before its cards, and near parts, after them. */
function drawerPaths(P, front, D) {
  const y1 = DY + 6 + D;
  const outer = rrect(52, DY, 98, y1, 2.5, 5), inner = rrect(53.6, DY + 1.6, 96.4, y1 - 1.6, 1.2, 5);
  const far = [poly(hull(ringAt(P, outer, Z0).concat(ringAt(P, outer, ZH)))), poly(ringAt(P, inner, ZH)), open(ringAt(P, run(inner, (q) => !front(q)), Z0 + 2))];
  const iF = LR(ringAt(P, run(inner, front), ZH)), oT = LR(ringAt(P, run(outer, front), ZH)), oB = LR(ringAt(P, run(outer, front), Z0));
  const onFront = (ring) => poly(ring.map((q) => P(q.u, y1, q.v)));
  const near = [
    poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), open(oT), open(iF), open([oT[0], ...oB, oT[oT.length - 1]]),
    onFront(rrect(68, 9, 82, 13.5, 2.2, 5)), onFront(rrect(65, 16, 85, 21.5, 1, 4)),
  ];
  return { far, near, y1 };
}

/** Index card k, counted from the drawer's front, standing in the plane y with its tab in one of three places. */
const CARD = (k) => { const t = [57, 70, 83][k % 3]; return fillet([[55, 7], [95, 7], [95, 27], [t + 10, 27], [t + 10, 30.5], [t, 30.5], [t, 27], [55, 27]], [0.6, 0.6, 1, 0.8, 1, 1, 0.8, 1]); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let open1 = value, cur = -1, from = 8;

  const C = Cam(45, 0.5, 1.85);
  fit(C, [[-12, 0, 100], [162, 0, 100], [162, 0, 40], [44, 40, 0], [106, 40, 0], [52, DY + 62, Z0], [98, DY + 62, Z0], [0, 0, 104]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the wall: three plates (stacked into one in attempts 1 and 3), then their holes, then the tools on it
  const boards = [0, 1, 2].map((k) => ({ f: board(k), tw: tween(2), back: mk("path", { class: "lo" }, g), face: mk("path", { class: "sil" }, g) }));
  boards.forEach((b) => { b.holes = []; for (let k = 0; k < 20; k++) b.holes.push(mk("circle", { r: 0.9, class: "dot off" }, g)); });
  const tools = [];
  for (let i = 0; i < N; i++) tools.push({ f: tool(i), tw: tween(2), out: mk("path", { class: "sil" }, g), gr: mk("path", { class: "nf lo" }, g), hole: mk("path", { class: "nf lo" }, g), q: NaN });

  // the cabinet, then the drawer: its far half, its cards back to front, its near half
  const [cr, ci] = rings(44, 4, 106, DY, 4, 1.4);
  put(solid(g), prism(P, front, cr, ci, 0, 30));
  const far = ["sil", "nf", "nf lo"].map((cls) => mk("path", { class: cls }, g));
  const cards = [];
  for (let k = CARDS - 1; k >= 0; k--) cards[k] = { shape: CARD(k), el: mk("path", {}, g) };
  const near = ["fo", "nf lo", "nf", "nf sil", "nf", "nf lo"].map((cls) => mk("path", { class: cls }, g));
  const drawer = tween(open1 * 0.5);
  let drawnD = NaN;

  function drawBoard(b, q) {
    const [x0, x1, z0, z1, hx0, hx1, hz0, hz1] = at(b.f, q);
    const r = rrect(x0, z0, x1, z1, 3, 4);
    b.back.setAttribute("d", poly(r.map((p) => P(p.u, -3, p.v))));
    b.face.setAttribute("d", poly(r.map((p) => P(p.u, 0, p.v))));
    b.holes.forEach((el, k) => place(el, P(lerp(hx0, hx1, (k % 4) / 3), 0, lerp(hz0, hz1, Math.floor(k / 4) / 4))));
  }
  function drawDrawer(D) {
    const d = drawerPaths(P, front, D);
    far.forEach((el, k) => el.setAttribute("d", d.far[k]));
    near.forEach((el, k) => el.setAttribute("d", d.near[k]));
    cards.forEach((c, k) => {
      const y = d.y1 - 4 - k * 4.2;
      c.el.setAttribute("d", y > DY + 1.6 ? poly(c.shape.map(([u, v]) => P(u, y, v))) : "");
    });
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    boards.forEach((b) => { const q = tval(b.tw, now); if (q !== b.q) { b.q = q; drawBoard(b, q); } if (!tdone(b.tw, now)) moving = true; });
    tools.forEach((t) => {
      const q = tval(t.tw, now);
      if (q !== t.q) { t.q = q; const [o, gr, h] = toolPaths(P, at(t.f, q)); t.out.setAttribute("d", o); t.gr.setAttribute("d", gr); t.hole.setAttribute("d", h); }
      if (!tdone(t.tw, now)) moving = true;
    });
    const D = tval(drawer, now);
    if (D !== drawnD) { drawnD = D; drawDrawer(D); }
    return moving || !tdone(drawer, now);
  });
  bag.add(B.unregister);

  // hit: three fixed bands of the stage's x, never the pose on screen; the stagger starts at the tool nearest the pointer's x at rest
  const sx = tools.map((t) => P(t.f(0)[0], 1, 96)[0]);
  const band = (x) => (x < 400 / 3 ? 0 : x < 800 / 3 ? 1 : 2);
  const nearest = (x) => clamp(Math.round(((x - sx[0]) / (sx[N - 1] - sx[0])) * (N - 1)), 0, N - 1);
  const target = () => (cur < 0 ? open1 * 0.5 : cur === 2 ? open1 : 0);

  function choose(b, p) {
    if (b === cur) return;
    const now = performance.now(), q = b < 0 ? 2 : b;
    if (p) from = nearest(p[0]);
    cur = b;
    // staggered by board, from the pointer: a board and its four tools share one delay, so no tool ever leaves its board
    const delay = (k) => Math.abs(1.5 + 4 * k - from) * STEP;
    tools.forEach((t, i) => tset(t.tw, q, now, delay(Math.floor(i / 4))));
    boards.forEach((bd, k) => tset(bd.tw, q, now, delay(k)));
    tset(drawer, target(), now, b === 2 ? 4 * STEP : 0);
    // one bright place: the handle at rest, the whole board in 1, one specialist in 2, the catalog in 3
    tools[8].out.classList.toggle("hi", b < 0);
    boards.forEach((bd, k) => bd.face.classList.toggle("hi", (b === 0 && k === 2) || (b === 1 && k === 1)));
    far[0].classList.toggle("hi", b === 2); near[3].classList.toggle("hi", b === 2);
    read.textContent = b < 0 ? "rest" : "intent " + (b + 1);
    B.wake();
  }

  tools[8].out.classList.add("hi");
  bag.add(pointer(stage, { move: (p) => choose(band(p[0]), p), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { open1 = v; tset(drawer, target(), performance.now(), 0); B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "tauler",
  means: "Three tries at an assistant as a tool wall: one crammed board, three split ones, then one handle, three bits and a catalog drawer.",
  rules: [1, 2, 5, 8],
  range: [24, 40, 56],
  tour: [[90, 150], [200, 150], [310, 150], null],
  mount,
});
