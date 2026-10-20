/**
 * Versions: six versions of one page standing in a tray, v6 at the back, v1 at
 * the front, all alike: a page with a browser bar and a few lines of text.
 * The pointer lifts the plate under it, and the others part round it, the ones
 * behind leaning back and the ones in front leaning forward, staggered outwards.
 * The slider is the stagger.
 *
 * Rest: all lean back a little, v6 at the back stands up, lifted and bright.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, rad, ringAt, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, pointer, proj, reflect, register,
} = HL;

const N = 6, W = 84, H = 60, G = 14, TK = 1.4;
const REST = -10, BACK = -22, FWD = 18, LIFT = 16, CUR = 0;
const X0 = -12, X1 = W + 12, Y0 = -9, Y1 = (N - 1) * G + 9, WH = 20, WR = 6, WT = 2.4;
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());
const SHAPE = fillet([[0, 0], [W, 0], [W, H], [0, H]], [1, 1, 3.2, 3.2]);

/** The tray, which never moves: `far` before the cards, `near` after them. */
function tray(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), 2.5)), "nf lo"],
  ];
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
  ];
  return { far, near };
}

/** Page i leaning th degrees (negative leans back), lifted by `lift`: its back, face, bar and lines. */
function pose(P, i, th, lift) {
  const yb = i * G, s = Math.sin(rad(th)), c = Math.cos(rad(th));
  const w = (u, v) => P(u, yb + v * s, v * c + lift);
  const wb = (u, v) => P(u, yb + v * s - TK * c, v * c + TK * s + lift);
  return {
    back: poly(SHAPE.map((p) => wb(p[0], p[1]))),
    face: poly(SHAPE.map((p) => w(p[0], p[1]))),
    head: seg(w(5, H - 8), w(W - 5, H - 8)) + poly(rrect(7, H - 5.5, 15, H - 2.5, 1.2, 3).map((q) => w(q.u, q.v))),
    rules: [H - 16, H - 22, H - 28, H - 34, H - 40].map((v, k) => seg(w(8, v), w(W - 8 - ((k * 17) % 30), v))).join(""),
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.6);
  fit(C, [[X0, Y0, 0], [X1, Y1, -8], [X1, Y0, 0], [X0, Y1, 0], [0, 0, H + LIFT], [W, 0, H + LIFT], [W, Y1, H + LIFT]], 200, 166);
  const P = proj(C), front = facing(C);
  const outer = rrect(X0, Y0, X1, Y1, WR, 6), inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6);
  const paths = tray(P, front, outer, inner);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 14);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);
  const cards = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp), face = mk("path", { class: "sil" }, grp);
    const head = mk("path", { class: "nf" }, grp), rules = mk("path", { class: "nf lo" }, grp);
    cards.push({ back, face, head, rules, a: tween(i === CUR ? 0 : REST), z: tween(i === CUR ? LIFT : 0), q: "" });
  }
  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);

  // hit bands along the RESTING top edges: they never move, and nothing draws them
  const top = (i) => P(W / 2, i * G + H * Math.sin(rad(REST)), H * Math.cos(rad(REST)));
  const c0 = top(0), c1 = top(1), d = [c1[0] - c0[0], c1[1] - c0[1]];
  const px0 = P(0, 0, 0), px1 = P(1, 0, 0), ex = [px1[0] - px0[0], px1[1] - px0[1]];
  const HALF = W / 2 + 6, det = d[0] * ex[1] - d[1] * ex[0];
  function hit([x, y]) {
    const qx = x - c0[0], qy = y - c0[1];
    const s = (qx * ex[1] - qy * ex[0]) / det, r = (d[0] * qy - d[1] * qx) / det;
    if (Math.abs(r) > HALF || s < -0.5 || s > N + 0.5) return -1;
    return clamp(Math.round(s), 0, N - 1);
  }

  function draw(i, th, lift) {
    const cd = cards[i], key = th + "," + lift;
    if (key === cd.q) return;
    cd.q = key;
    const q = pose(P, i, th, lift);
    cd.back.setAttribute("d", q.back);
    cd.face.setAttribute("d", q.face);
    cd.head.setAttribute("d", q.head);
    cd.rules.setAttribute("d", q.rules);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((cd, i) => { draw(i, tval(cd.a, now), tval(cd.z, now)); if (!tdone(cd.a, now) || !tdone(cd.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // at rest v6 stands lifted and bright; the pointer lifts the page under it instead
  let act = -1;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act, cur = a < 0 ? CUR : a;
    act = a;
    cards.forEach((cd, i) => {
      const th = i === cur ? 0 : a < 0 ? REST : i < a ? BACK : FWD;
      tset(cd.a, th, now, Math.abs(i - from) * stag);
      tset(cd.z, i === cur ? LIFT : 0, now, Math.abs(i - from) * stag);
      cd.face.classList.toggle("hi", i === cur); cd.head.classList.toggle("hi", i === cur);
    });
    read.textContent = a < 0 ? "rest" : "v" + (N - a);
    B.wake();
  }

  cards[CUR].face.classList.add("hi"); cards[CUR].head.classList.add("hi");
  read.textContent = "rest";
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "versions",
  means: "Six versions of one page in a tray: the pointer lifts the one under it, and the rest part round it.",
  rules: [1, 2, 4, 5],
  range: [0, 40, 90],
  tour: [[234, 105], [171, 136], [192, 122], null],
  mount,
});
