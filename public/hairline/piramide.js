/**
 * Piràmide: four slabs stacked one over another, the widest on top and each
 * one below it narrower, down to the apex at the bottom: an inverted pyramid.
 * The taper is the slider: near the low end it is almost a tower, at the
 * middle it is the post's pyramid, at the high end a spike. The pointer picks
 * the layer under it and the rest go dim; at rest the top slab is the bright
 * one, because that is where the effort lives.
 */
const {
  Cam, disposer, facing, fit, mk, prism, pointer, proj, put, register, ringAt,
  rings, solid, tdone, tset, tval, tween,
} = HL;

const N = 4, TOP = 46, TH = 14, GAP = 12, R = 5, CR = 1.6;
const NAMES = ["codi", "anàlisi estàtica", "prosa", "revisió humana"];
const zOf = (i) => [i * (TH + GAP), i * (TH + GAP) + TH];
const halfOf = (i, v) => Math.max(6, TOP * (1 - (N - 1 - i) * (v / 100)));

const inPoly = (pts, x, y) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++)
    if ((pts[i][1] > y) !== (pts[j][1] > y) &&
      x < ((pts[j][0] - pts[i][0]) * (y - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c;
  return c;
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let cur = 0, drawn = NaN, faces = [];

  const C = Cam(45, 0.5, 2.2);
  fit(C, [[-TOP, -TOP, 0], [TOP, TOP, 0], [TOP, -TOP, 0], [-TOP, TOP, 0],
    [-TOP, -TOP, zOf(N - 1)[1]], [TOP, TOP, zOf(N - 1)[1]],
    [TOP, -TOP, zOf(N - 1)[1]], [-TOP, TOP, zOf(N - 1)[1]]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const slabs = [];
  for (let i = 0; i < N; i++) slabs.push(solid(g));

  function draw(v) {
    for (let i = 0; i < N; i++) {
      const h = halfOf(i, v), [z0, z1] = zOf(i);
      const [ring, inner] = rings(-h, -h, h, h, R, CR);
      put(slabs[i], prism(P, front, ring, inner, z0, z1));
      faces[i] = ringAt(P, ring, z1);
    }
  }

  function setLayer(a) {
    if (a === cur) return;
    cur = a;
    slabs.forEach((s, i) => {
      const on = N - 1 - i === a;
      s.sil.classList.toggle("hi", on);
      s.cr.classList.toggle("hi", on);
    });
    read.textContent = a < 0 ? "rest" : NAMES[a];
  }

  function pick([x, y]) {
    for (let layer = 0; layer < N; layer++) if (inPoly(faces[N - 1 - layer], x, y)) return layer;
    let best = -1, bd = 70 * 70;
    for (let layer = 0; layer < N; layer++) {
      const f = faces[N - 1 - layer], c = f.reduce((a, p) => [a[0] + p[0] / f.length, a[1] + p[1] / f.length], [0, 0]);
      const d = (c[0] - x) * (c[0] - x) + (c[1] - y) * (c[1] - y);
      if (d < bd) { bd = d; best = layer; }
    }
    return best;
  }

  const tw = tween(value);
  const B = register(stage, (_dt, now) => {
    const v = tval(tw, now);
    if (v !== drawn) { drawn = v; draw(v); }
    return !tdone(tw, now);
  });
  bag.add(B.unregister);

  slabs[N - 1].sil.classList.add("hi");
  slabs[N - 1].cr.classList.add("hi");
  read.textContent = NAMES[0];
  bag.add(pointer(stage, {
    move: (p) => setLayer(pick(p)),
    leave: () => setLayer(0),
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { tset(tw, v, performance.now(), 0); B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "piramide",
  means: "Four slabs stack into an inverted pyramid: codebase is the wide top layer, human review the narrow apex at the bottom. The taper is the slider; the pointer picks a layer, and at rest the top one is bright.",
  range: [12, 22, 30],
  tour: [[200, 90], [200, 140], [200, 190], [200, 245], null],
  mount,
});
