/**
 * Prestatge: a desk file sorter of five slots, sloped dividers on a rounded
 * base, a design sheet standing in each slot, and beside it a sealed crate:
 * boarded sides, an overhanging lid on its seam, a hasp and staple holding it.
 * The slot under the pointer gives its sheet up, its neighbours rise less,
 * staggered outwards. Over the crate the lid strains a hair and stays shut:
 * nothing comes out. The slider is how far a sheet rises, in world units.
 */
const {
  Cam, clamp, facing, fillet, fit, open, poly, proj, prism, rings, seg, tween, tset, tval, tdone,
  mk, solid, put, pointer, register, disposer,
} = HL;

const N = 5, G = 12, T = 1.6, D = 40, HB = 34, HF = 13, SH = 27, TK = 0.8;
const REST = [3, 0, 9, 1, 4], LIT = 2, STEP = 45;
const XC = N * G + T + 22, CW = 38, CH = 22, LH = 5, OV = 1.6, STRAIN = 2.4;

/** A flat outline in the (y, z) plane, stood at x. */
const at = (P, shape, x, z) => poly(shape.map(([u, v]) => P(x, u, v + z)));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value;
  const C = Cam(45, 0.5, 2.1);
  fit(C, [[-4, -4, -4], [XC + CW + OV, D + OV, 0], [XC + CW + OV, -OV, 0], [-4, D + 4, -4], [0, 0, HB], [G * 0.5, 5, SH + 34]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the sorter's base, a low rounded plinth
  const [br, bi] = rings(-4, -4, N * G + T + 4, D + 4, 4, 1.6);
  put(solid(g), prism(P, front, br, bi, -4, 0));

  const divider = fillet([[0, 0], [D, 0], [D, HF], [0, HB]], [1, 1, 2.5, 3]);
  const sheet = fillet([[5, 0], [D - 5, 0], [D - 5, SH], [5, SH]], [0.6, 0.6, 1.2, 1.2]);
  const motif = Array.from({ length: 25 }, (_, k) => [D - 13 + 4.2 * Math.cos(k * Math.PI / 12), SH - 8 + 4.2 * Math.sin(k * Math.PI / 12)]);

  // back to front along x: divider, sheet, divider, ...
  const sheets = [];
  const drawDivider = (x) => {
    mk("path", { d: at(P, divider, x, 0), class: "lo" }, g);
    mk("path", { d: at(P, divider, x + T, 0), class: "sil" }, g);
  };
  for (let i = 0; i < N; i++) {
    drawDivider(i * G);
    const sg = mk("g", {}, g), x = i * G + G / 2 + T / 2;
    sheets.push({
      x, a: tween(REST[i]), drawn: NaN,
      back: mk("path", { class: "lo" }, sg), face: mk("path", { class: "sil" }, sg),
      ink: mk("path", { class: "nf lo" }, sg),
    });
  }
  drawDivider(N * G);

  // the crate: body with two boards a side, lid on its seam, hasp and staple
  const [cr, ci] = rings(XC, 0, XC + CW, D, 3, 1.4);
  put(solid(g), prism(P, front, cr, ci, 0, CH));
  const boards = [CH / 3, (2 * CH) / 3].map((z) =>
    seg(P(XC + CW, 3, z), P(XC + CW, D - 3, z)) + seg(P(XC + 3, D, z), P(XC + CW - 3, D, z))).join("");
  mk("path", { d: boards, class: "nf lo" }, g);
  const lid = solid(g);
  const [lr, li] = rings(XC - OV, -OV, XC + CW + OV, D + OV, 3.6, 1.4);
  const hx = XC + CW / 2, hy = D + OV + 0.4;
  const hasp = fillet([[hx - 5, CH - 9], [hx + 5, CH - 9], [hx + 5, CH + 4], [hx - 5, CH + 4]], [1.2, 1.2, 1.2, 1.2]);
  const haspEl = mk("path", { d: poly(hasp.map(([u, v]) => P(u, hy, v))), class: "sil" }, g);
  const staple = fillet([[hx - 2.2, CH - 7], [hx + 2.2, CH - 7], [hx + 2.2, CH - 1.5], [hx - 2.2, CH - 1.5]], [1.4, 1.4, 1.4, 1.4]);
  mk("path", { d: poly(staple.map(([u, v]) => P(u, hy + 0.2, v))), class: "nf" }, g);
  const lz = tween(0);
  let lidDrawn = NaN;

  function drawSheet(s, z) {
    if (z === s.drawn) return;
    s.drawn = z;
    s.back.setAttribute("d", at(P, sheet, s.x - TK, z));
    s.face.setAttribute("d", at(P, sheet, s.x, z));
    s.ink.setAttribute("d", open(motif.map(([u, v]) => P(s.x, u, v + z))));
  }
  function drawLid(z) {
    if (z === lidDrawn) return;
    lidDrawn = z;
    put(lid, prism(P, front, lr, li, CH + z, CH + LH + z));
  }

  const B = register(stage, (_dt, now) => {
    let m = false;
    for (const s of sheets) { drawSheet(s, tval(s.a, now)); if (!tdone(s.a, now)) m = true; }
    drawLid(tval(lz, now)); if (!tdone(lz, now)) m = true;
    return m;
  });
  bag.add(B.unregister);

  // hit (rule 01): rest centres in one row along x, nearest on screen x, inside a band
  const parts = sheets.map((s) => P(s.x, D / 2, 20)).concat([P(XC + CW / 2, D / 2, 14)]);
  function hit([x, y]) {
    let best = -1, bd = Infinity;
    parts.forEach((c, k) => { const d = Math.abs(x - c[0]); if (d < bd) { bd = d; best = k; } });
    const c = parts[best], wide = best === N;
    return bd < (wide ? 42 : 11) && Math.abs(y - c[1]) < (wide ? 56 : 52) ? best : -1;
  }

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 && a < N ? a : act >= 0 && act < N ? act : LIT;
    act = a;
    sheets.forEach((s, i) => {
      const d = Math.abs(i - from);
      const z = a >= 0 && a < N ? clamp(LIFT * (1 - d * 0.45), 0, LIFT) : REST[i];
      tset(s.a, z, now, d * STEP);
      s.face.classList.toggle("hi", a < 0 ? i === LIT : i === a);
    });
    tset(lz, a === N ? STRAIN : 0, now, 0);
    haspEl.classList.toggle("hi", a === N);
    read.textContent = a < 0 ? "rest" : a === N ? "caixa · 0" : `ranura ${a + 1}`;
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { LIFT = v; const a = act; act = -2; setActive(a); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "prestatge",
  means: "A file sorter gives up the sheet under the pointer; the sealed crate beside it strains its lid and gives nothing.",
  rules: [1, 2, 4, 5],
  range: [16, 26, 34],
  tour: [[141, 135], [177, 155], [234, 205], null],
  mount,
});
