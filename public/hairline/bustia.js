/**
 * Bústia: a bank of fifteen mailboxes on a plinth, under a hood. Each door
 * carries a name plate punched with one, two or three dots: the key that made
 * that box. The pointer picks a door, and every box of the same key swings
 * open, staggered out from the one picked, a letter standing in each; the
 * boxes of the other keys stay shut. The slider is the stagger, in ms.
 *
 * Rest is one box ajar with its letter showing, its door bright: an agent's
 * own box, and only that one.
 */
const {
  Cam, clamp, facing, fillet, fit, poly, prism, proj, rad, rings, rrect, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const COLS = 5, ROWS = 3, DW = 20, DH = 22, G = 2.4, M = 5, ZB = 12, T = 1.4;
const W = M * 2 + COLS * DW + (COLS - 1) * G, D = 34;
const ZT = ZB + M * 2 + ROWS * DH + (ROWS - 1) * G, HOOD = 6;
const OPEN = 72, AJAR = 80, REST_I = 6;
// which key made each box, row by row from the top: five boxes each, scattered
const OWNER = [0, 1, 2, 1, 0, 2, 0, 1, 2, 1, 1, 2, 0, 0, 2];
const LETTER = [11, 8, 13, 9, 12, 10, 13, 8, 11, 12, 9, 13, 10, 8, 12];

/** Door i's hinge corner on the face: [x0, z0]. Row 0 is the top. */
const cell = (i) => {
  const c = i % COLS, r = Math.floor(i / COLS);
  return [M + c * (DW + G), ZB + M + (ROWS - 1 - r) * (DH + G)];
};
const OUTLINE = fillet([[0, 0], [DW, 0], [DW, DH], [0, DH]], [1.6, 1.6, 1.6, 1.6]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  // fitted with the left-hand doors fully open, the pose that reaches furthest out
  const C = Cam(45, 0.5, 1.72);
  const sw = (a) => [M + DW * Math.cos(rad(a)), D + DW * Math.sin(rad(a))];
  fit(C, [
    [0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0],
    [-3, -3, ZT + HOOD], [W + 3, D + 4, ZT], [...sw(OPEN), ZB + M], [...sw(OPEN), ZT],
  ], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(5, 5, W - 5, D - 5, 3, 1.2);
  put(solid(g), prism(P, front, pr, pi, 0, ZB));
  const [br, bi] = rings(0, 0, W, D, 3, 1.4);
  put(solid(g), prism(P, front, br, bi, ZB, ZT));
  const [hr, hi] = rings(-3, -3, W + 3, D + 4, 3.5, 1.6);
  const hood = solid(g);
  put(hood, prism(P, front, hr, hi, ZT, ZT + HOOD));
  // the posting slot under the hood's lip, across the right-hand side
  mk("path", { d: poly(rrect(8, ZT - 5, D - 8, ZT - 2.5, 1.2, 3).map((q) => P(W, q.u, q.v))), class: "nf lo" }, g);

  // left to right on screen: an open door swings over the column to its left
  const order = [...Array(COLS * ROWS).keys()].sort((a, b) => (a % COLS) - (b % COLS) || a - b);
  const boxes = [];
  for (const i of order) {
    const [x0, z0] = cell(i), lh = LETTER[i];
    const face = (u, v) => P(x0 + u, D, z0 + v);
    const inside = (u, v) => P(x0 + u, D - 4, z0 + v);
    mk("path", { d: poly(OUTLINE.map(([u, v]) => face(u, v))), class: "lo" }, g);
    mk("path", { d: poly([[2, 2], [DW - 8, 2], [DW - 8, 2 + lh], [2, 2 + lh]].map(([u, v]) => inside(u, v))) }, g);
    mk("path", { d: seg(inside(2, 2 + lh), inside(DW / 2 - 3, lh - 3)) + seg(inside(DW / 2 - 3, lh - 3), inside(DW - 8, 2 + lh)), class: "nf lo" }, g);
    const grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp), door = mk("path", { class: "sil" }, grp);
    const plate = mk("path", { class: "nf lo" }, grp);
    const dots = [];
    for (let k = 0; k <= OWNER[i]; k++) dots.push(mk("circle", { r: 0.95, class: "dot off" }, grp));
    const lock = mk("circle", { r: 1.1, class: "dot m" }, grp);
    boxes[i] = { x0, z0, back, door, plate, dots, lock, a: tween(i === REST_I ? AJAR : 0), last: NaN };
  }

  function draw(b, th) {
    if (th === b.last) return;
    b.last = th;
    const s = Math.sin(rad(th)), c = Math.cos(rad(th));
    const w = (u, v, t = 0) => P(b.x0 + u * c + t * s, D + u * s - t * c, b.z0 + v);
    b.back.setAttribute("d", poly(OUTLINE.map(([u, v]) => w(u, v, T * clamp(th / 15, 0, 1)))));
    b.door.setAttribute("d", poly(OUTLINE.map(([u, v]) => w(u, v))));
    b.plate.setAttribute("d", poly(rrect(3, DH - 9, 13, DH - 4, 1.2, 3).map((q) => w(q.u, q.v))));
    const n = b.dots.length;
    b.dots.forEach((el, k) => place(el, w(8 + (k - (n - 1) / 2) * 2.8, DH - 6.5)));
    place(b.lock, w(DW - 3.5, DH / 2));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    boxes.forEach((b) => {
      draw(b, tval(b.a, now));
      if (!tdone(b.a, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  // the face plane, y = D, which never moves: screen point to [x, z] on it
  const o = P(0, D, 0), px = P(1, D, 0), pz = P(0, D, 1);
  const ex = [px[0] - o[0], px[1] - o[1]], ez = [pz[0] - o[0], pz[1] - o[1]];
  const det = ex[0] * ez[1] - ex[1] * ez[0];
  /** The door whose closed rectangle is under the point, gaps snapping to the nearest; -1 off the face. */
  function hit([sx, sy]) {
    const qx = sx - o[0], qy = sy - o[1];
    const x = (qx * ez[1] - qy * ez[0]) / det, z = (ex[0] * qy - ex[1] * qx) / det;
    if (x < 0 || x > W || z < ZB || z > ZT) return -1;
    const c = clamp(Math.floor((x - M + G / 2) / (DW + G)), 0, COLS - 1);
    const r = clamp(Math.floor((ZT - M + G / 2 - z) / (DH + G)), 0, ROWS - 1);
    return r * COLS + c;
  }

  let act = -1;
  boxes[REST_I].door.classList.add("hi");
  /** Opens every box of the key that made box a, staggered out from it; -1 goes back to rest. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    const fc = from % COLS, fr = Math.floor(from / COLS);
    boxes.forEach((b, i) => {
      const delay = Math.hypot((i % COLS) - fc, Math.floor(i / COLS) - fr) * stag;
      const to = a < 0 ? (i === REST_I ? AJAR : 0) : OWNER[i] === OWNER[a] ? OPEN : 0;
      tset(b.a, to, now, delay);
      b.door.classList.toggle("hi", i === (a < 0 ? REST_I : a));
      b.dots.forEach((el) => el.classList.toggle("off", !(a >= 0 && OWNER[i] === OWNER[a])));
      b.dots.forEach((el) => el.classList.toggle("m", a >= 0 && OWNER[i] === OWNER[a]));
    });
    read.textContent = a < 0 ? "rest" : "clau " + (OWNER[a] + 1);
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "bustia",
  means: "A bank of mailboxes: the pointer picks one, and only the boxes made by the same key swing open.",
  rules: [1, 2, 4, 10],
  range: [0, 45, 90],
  tour: [[150, 170], [250, 140], [190, 210], null],
  mount,
});
