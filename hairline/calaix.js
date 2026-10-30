/**
 * Calaix: a card-catalog drawer of design cards. Some designs are bundles: a
 * primary card with its variants (the same design in other formats) filed
 * tight behind it, their tabs stepping across. The design under the pointer
 * stands up, its variants fanning behind it; the neighbours part, staggered
 * outwards by distance. Each primary's number is punched on its tab.
 * The slider is the stagger, in ms.
 */
const {
  Cam,
  clamp,
  facing,
  fillet,
  fit,
  hull,
  open,
  poly,
  prism,
  proj,
  rad,
  ringAt,
  rings,
  rrect,
  run,
  seg,
  tdone,
  tset,
  tval,
  tween,
  disposer,
  mk,
  place,
  pointer,
  put,
  reflect,
  register,
  solid,
} = HL;

const W = 84,
  H = 52,
  TW = 18,
  TH = 7,
  TK = 1.4,
  G = 14,
  V = 2.2,
  TABS = [5, 24, 43, 61];
const KS = [1, 2, 1, 4, 1, 1, 3]; // files per design: 1 is a lone card, more is a bundle
const REST = -12,
  BACK = -24,
  FWD = 20,
  LIFT = 16,
  MARK = 3;
const WH = 20,
  WR = 6,
  WT = 2.4,
  FT = 4,
  FH = 30;

// cards back to front: a bundle's variants first, its primary last
const cards = [];
let y = 0;
KS.forEach((k, d) => {
  for (let r = k - 1; r >= 0; r--) {
    const t0 = TABS[(d + r) % 4];
    const shape = fillet(
      [
        [0, 0],
        [W, 0],
        [W, H],
        [t0 + TW, H],
        [t0 + TW, H + TH],
        [t0, H + TH],
        [t0, H],
        [0, H],
      ],
      [1, 1, 3.2, 1.8, 2.4, 2.4, 1.8, 3.2],
    );
    cards.push({ d, r, y, t0, shape });
    y += r ? V : G;
  }
});
const YL = y - G,
  X0 = -5,
  X1 = W + 5,
  Y0 = -9,
  Y1 = YL + 9;
const span = KS.map((_, d) => cards.filter((c) => c.d === d).map((c) => c.y));

/** A run of points ordered left to right on screen. */
const LR = (pts) =>
  pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse();

/** The drawer, which never moves: `far` before the cards, `near` after them, then its front plate. */
function drawer(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [
      open(
        ringAt(
          P,
          run(inner, (q) => !front(q)),
          2.5,
        ),
      ),
      "nf lo",
    ],
  ];
  const iF = LR(ringAt(P, run(inner, front), WH)),
    oT = LR(ringAt(P, run(outer, front), WH)),
    oB = LR(ringAt(P, run(outer, front), 0));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
  ];
  // the front: a plate taller than the walls, a label holder, a cup pull and the rod's knob
  const hx = (X0 + X1) / 2,
    onFront = (ring) => ring.map((q) => P(q.u, Y1 + FT, q.v));
  const face = [
    [poly(onFront(rrect(hx - 15, FH - 11, hx + 15, FH - 3.5, 1.2, 3))), "nf"],
    [
      poly(onFront(rrect(hx - 13.4, FH - 9.6, hx + 13.4, FH - 4.9, 0.6, 3))),
      "nf lo",
    ],
    [poly(onFront(rrect(hx - 10, 9, hx + 10, 16, 3.5, 5))), "nf"],
    [poly(onFront(rrect(hx - 8.4, 10.6, hx + 8.4, 13, 1.2, 5))), "nf lo"],
    [poly(onFront(rrect(hx - 1.8, 3, hx + 1.8, 6.6, 1.8, 4))), "nf lo"],
  ];
  return { far, near, face };
}

/** A card leaning th degrees (negative leans back), lifted by `lift`: its paths, and where its punches sit. */
function pose(P, c, th, lift) {
  const s = Math.sin(rad(th)),
    co = Math.cos(rad(th));
  const w = (u, v) => P(u, c.y + v * s, v * co + lift);
  const wb = (u, v) => P(u, c.y + v * s - TK * co, v * co + TK * s + lift);
  const punch = [];
  for (let k = 0; k < 8; k++)
    punch.push(
      w(
        c.t0 + TW / 2 + ((k % 4) - 1.5) * 3.4,
        H + TH / 2 + (0.5 - Math.floor(k / 4)) * 2.8,
      ),
    );
  return {
    back: poly(c.shape.map((p) => wb(p[0], p[1]))),
    face: poly(c.shape.map((p) => w(p[0], p[1]))),
    head: seg(w(6, H - 10), w(W - 6, H - 10)),
    rules: c.r
      ? ""
      : [H - 17, H - 24, H - 31].map((v) => seg(w(6, v), w(W - 6, v))).join(""),
    punch,
  };
}

/** Where design a puts card c: [lean, lift]. a < 0 is rest, where variants fan back behind their primary. */
function target(c, a) {
  if (a < 0) return [REST - 1.5 * c.r, 0];
  if (c.d === a) return [-3 * c.r, LIFT + 4 * c.r];
  return [c.d < a ? BACK - 2 * c.r : FWD, 0];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.58);
  const top = H + TH;
  fit(
    C,
    [
      [X0 - 2, Y0, 0],
      [X1 + 2, Y1 + FT, 0],
      [X1, Y0 - 22, top],
      [X0, Y0 - 22, top],
      [X1, Y0, top + LIFT + 12],
      [X1 + 2, Y1 + FT, FH],
      [X0 - 2, Y1 + FT, FH],
      [X0 - 2, Y1 + FT, 0],
      [X1, Y0, WH],
    ],
    200,
    166,
  );
  const P = proj(C),
    front = facing(C);
  const outer = rrect(X0, Y0, X1, Y1, WR, 6),
    inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6);
  const paths = drawer(P, front, outer, inner);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 14);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);

  for (const c of cards) {
    const grp = mk("g", {}, g);
    c.back = mk("path", { class: "lo" }, grp);
    c.face = mk("path", { class: "sil" }, grp);
    c.head = mk("path", { class: "nf" + (c.r ? " lo" : "") }, grp);
    c.rules = mk("path", { class: "nf lo" }, grp);
    // the design's number, punched in a 4 x 2 grid on the primary's tab
    c.punch = c.r
      ? []
      : Array.from({ length: 8 }, (_, k) =>
          mk(
            "circle",
            { r: 1.05, class: "dot " + (k === c.d ? "m" : "off") },
            grp,
          ),
        );
    const [th, z] = target(c, -1);
    c.a = tween(th);
    c.z = tween(z);
    c.drawn = "";
  }

  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);
  const [ring, inn] = rings(X0 - 2, Y1, X1 + 2, Y1 + FT, 1.6, 0.8);
  put(solid(g), prism(P, front, ring, inn, 0, FH));
  for (const [d, cls] of paths.face) mk("path", { d, class: cls }, g);

  // hit bands along the RESTING top edges, as world y along the drawer: they never move, and nothing draws them
  const tp = (yy) =>
    P(W / 2, yy + H * Math.sin(rad(REST)), H * Math.cos(rad(REST)));
  const c0 = tp(0),
    c1 = tp(1),
    dv = [c1[0] - c0[0], c1[1] - c0[1]];
  const px0 = P(0, 0, 0),
    px1 = P(1, 0, 0),
    ex = [px1[0] - px0[0], px1[1] - px0[1]];
  const HALF = W / 2 + 6,
    det = dv[0] * ex[1] - dv[1] * ex[0];

  /** The design whose band holds the point; -1 outside. */
  function hit([x, yy]) {
    const qx = x - c0[0],
      qy = yy - c0[1];
    const s = (qx * ex[1] - qy * ex[0]) / det,
      r = (dv[0] * qy - dv[1] * qx) / det;
    if (Math.abs(r) > HALF || s < -G / 2 - 6 || s > YL + G / 2) return -1;
    const d = span.findIndex((ys) => s <= ys[ys.length - 1] + G / 2);
    return d < 0 ? KS.length - 1 : d;
  }

  function draw(c, th, lift) {
    const key = th.toFixed(2) + "," + lift.toFixed(2);
    if (key === c.drawn) return;
    c.drawn = key;
    const q = pose(P, c, th, lift);
    c.back.setAttribute("d", q.back);
    c.face.setAttribute("d", q.face);
    c.head.setAttribute("d", q.head);
    c.rules.setAttribute("d", q.rules);
    c.punch.forEach((el, k) => place(el, q.punch[k]));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const c of cards) {
      draw(c, tval(c.a, now), tval(c.z, now));
      if (!tdone(c.a, now) || !tdone(c.z, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  let act = null;
  const caption = (a) =>
    a < 0
      ? "rest"
      : "disseny " +
        String(a + 1).padStart(2, "0") +
        (KS[a] > 1 ? " · 1+" + (KS[a] - 1) : "");
  /** Pulls design a (-1 puts them all back). The stagger spreads out from the design pulled, or the one let go. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(),
      from = a >= 0 ? a : (act ?? MARK),
      lit = a < 0 ? MARK : a;
    act = a;
    for (const c of cards) {
      const delay = Math.abs(c.d - from) * stag + c.r * stag * 0.4,
        [th, z] = target(c, a);
      tset(c.a, th, now, delay);
      tset(c.z, z, now, delay);
      // one bright place: the chosen design's primary, or at rest the four-file bundle's
      const on = c.d === lit && !c.r;
      c.face.classList.toggle("hi", on);
      c.head.classList.toggle("hi", on);
      if (!c.r) c.punch[c.d].setAttribute("class", "dot " + (on ? "" : "m"));
    }
    read.textContent = caption(a);
    B.wake();
  }
  setActive(-1);

  bag.add(
    pointer(stage, {
      move: (p) => setActive(hit(p)),
      leave: () => setActive(-1),
    }),
  );
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      stag = clamp(v, 0, 120);
    },
    destroy: bag.dispose,
  };
}

hairline({
  name: "calaix",
  means:
    "A drawer of design cards, bundles filed as a primary with its variants: the one under the pointer stands up, the rest part.",
  rules: [1, 2, 5, 10],
  range: [0, 40, 90],
  tour: [[198, 166], [201, 136], [205, 99], null],
  mount,
});
