/**
 * Taula: a light table of design thumbnails, each tile a low plate with its
 * cut line drawn on top. The pointer is projected onto the table and the tiles
 * near it rise, each on its own spring, falling off with distance. The back
 * quarter of the table is under a sealed cover plate screwed down at its
 * corners: what is under it never rises, whatever the pointer does. At rest
 * the open tiles lie in a gentle dune, the tallest one bright. The slider is
 * the radius, in cells.
 */
const {
  Cam,
  circ,
  clamp,
  facing,
  fillet,
  fit,
  poly,
  prism,
  proj,
  rings,
  unproj,
  spring,
  stepS,
  flatDot,
  mk,
  place,
  pointer,
  put,
  register,
  disposer,
  solid,
} = HL;

const N = 8,
  CELL = 15,
  FOOT = 12,
  HMAX = 40,
  EXT = N * CELL,
  PB = 5;
const LC = 4,
  LX = LC * CELL - 1.5,
  LH = 9; // the lid covers cells i < 4, j < 4

/** The share of full height at u radii from the pointer, clamped to a floor. */
const falloff = (u) =>
  u <= 0
    ? 1
    : u <= 0.417
      ? 1 - (u / 0.417) * 0.6875
      : u <= 1
        ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185
        : 0.094;

/** The cut line on a tile: a circle, a diamond or a rounded triangle, as world offsets round its centre. */
const CUTS = [
  circ(4, 16).map((q) => [q.u, q.v]),
  fillet(
    [
      [0, -4.6],
      [4.6, 0],
      [0, 4.6],
      [-4.6, 0],
    ],
    [1, 1, 1, 1],
  ),
  fillet(
    [
      [0, -4.4],
      [4, 3.2],
      [-4, 3.2],
    ],
    [1.2, 1.2, 1.2],
  ),
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.72);
  fit(
    C,
    [
      [-6, -6, -PB],
      [EXT + 6, EXT + 6, -PB],
      [EXT + 6, -6, -PB],
      [-6, EXT + 6, -PB],
      [EXT / 2, EXT / 2, HMAX * 0.8],
    ],
    200,
    166,
  );
  const P = proj(C),
    front = facing(C);
  let R = value * CELL,
    over = null;

  const g = mk("g", {}, svg),
    tiles = [];
  const [pr, pi] = rings(-6, -6, EXT + 6, EXT + 6, 9, 2.2);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));

  // The lid first: every open tile stands past one of its faces, so it is never in front of one.
  const lid = solid(g),
    [lr, li] = rings(-2.5, -2.5, LX, LX, 4, 1.6);
  put(lid, prism(P, front, lr, li, 0, LH));
  for (const [x, y] of [
    [2, 2],
    [LX - 4.5, 2],
    [2, LX - 4.5],
    [LX - 4.5, LX - 4.5],
  ]) {
    place(flatDot(g, C, 0.75, "dot m"), P(x, y, LH));
  }

  // Diagonal by diagonal from the back corner, so appending is painting back to front.
  for (let s = 0; s <= 2 * (N - 1); s++)
    for (let i = 0; i < N; i++) {
      const j = s - i;
      if (j < 0 || j >= N || (i < LC && j < LC)) continue;
      const u = i / (N - 1),
        v = j / (N - 1);
      const h0 =
        1.6 +
        15 * Math.exp(-((u - 0.78) ** 2 + (v - 0.62) ** 2) / 0.06) +
        6 * Math.exp(-((u - 0.2) ** 2 + (v - 0.86) ** 2) / 0.03);
      const x0 = i * CELL + (CELL - FOOT) / 2,
        y0 = j * CELL + (CELL - FOOT) / 2;
      const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 2.4, 0.9);
      const el = solid(g),
        cut = mk("path", { class: "nf lo" }, el.g);
      tiles.push({
        i,
        j,
        h0,
        ring,
        inner,
        cut,
        shape: CUTS[(i + 2 * j) % 3],
        sp: spring(h0, { eps: 0.04 }),
        el,
        drawn: NaN,
      });
    }
  const peak = tiles.reduce((a, b) => (b.h0 > a.h0 ? b : a));
  const byCell = new Map(tiles.map((t) => [t.i + "," + t.j, t]));
  let lit = null;

  /** One place is bright: the tile chosen, the lid, or at rest the tallest tile. */
  function light(t, onLid) {
    if (lit && lit !== "lid") {
      lit.el.sil.classList.remove("hi");
      lit.cut.setAttribute("class", "nf lo");
    }
    lid.sil.classList.toggle("hi", onLid);
    lit = onLid ? "lid" : t;
    if (t && !onLid) {
      t.el.sil.classList.add("hi");
      t.cut.setAttribute("class", "nf hi");
    }
  }

  // A tile whose spring hasn't moved keeps its paths.
  function draw(t) {
    const h = Math.max(0.6, t.sp.x);
    if (h === t.drawn) return;
    t.drawn = h;
    put(t.el, prism(P, front, t.ring, t.inner, 0, h));
    const cx = (t.i + 0.5) * CELL,
      cy = (t.j + 0.5) * CELL;
    t.cut.setAttribute(
      "d",
      poly(t.shape.map(([a, b]) => P(cx + a, cy + b, h))),
    );
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const t of tiles) {
      if (stepS(t.sp, dt)) m = true;
      draw(t);
    }
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    for (const t of tiles) {
      if (!over) {
        t.sp.t = t.h0;
        continue;
      }
      const dx = (t.i + 0.5) * CELL - over.at[0],
        dy = (t.j + 0.5) * CELL - over.at[1];
      t.sp.t = Math.max(t.h0 * 0.5, HMAX * falloff(Math.hypot(dx, dy) / R));
    }
    if (!over) {
      light(peak, false);
      read.textContent = "rest";
    } else if (over.lid) {
      light(null, true);
      read.textContent = "tancat";
    } else {
      const i = clamp(Math.floor(over.at[0] / CELL), 0, N - 1),
        j = clamp(Math.floor(over.at[1] / CELL), 0, N - 1);
      light(byCell.get(i + "," + j), false);
      read.textContent = `disseny ${i + 1}·${j + 1}`;
    }
    B.wake();
  }

  // The lid's top first, which never moves; then the table, which never moves either.
  function hit(p) {
    const top = unproj(C, p[0], p[1], LH);
    if (top[0] < LX && top[1] < LX && top[0] > -2.5 && top[1] > -2.5)
      return { lid: true, at: top };
    const at = unproj(C, p[0], p[1], 0);
    const lidAt = at[0] < LC * CELL && at[1] < LC * CELL;
    return { lid: lidAt, at };
  }

  bag.add(
    pointer(stage, {
      move: (p) => {
        over = hit(p);
        retarget();
      },
      leave: () => {
        over = null;
        retarget();
      },
    }),
  );
  retarget();
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      R = v * CELL;
      if (over) retarget();
    },
    destroy: bag.dispose,
  };
}

hairline({
  name: "taula",
  means:
    "A light table of designs rises under the pointer; the quarter sealed under the lid never comes out.",
  rules: [1, 3, 5, 6],
  range: [1.5, 2.5, 4],
  tour: [[236, 170], [200, 106], [108, 156], null],
  mount,
});
