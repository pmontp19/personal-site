/*
 * Munta una figura Hairline (kernel.js, de @lucasmarkes/hairline) dins d'un
 * post: fa el que fa el bench de l'skill, sense controls. El valor és el del
 * mig de `range`. Mentre la figura és a la vista i ningú hi posa el punter,
 * un punter invisible fa la volta (`tour`), excepte amb reduced motion.
 * També munta els fotogrames fixos de la figura (vegeu més avall).
 */
window.hairline = (figure) => {
  const host = document.currentScript.closest("figure");
  HL.inject(document);
  const mount = (host) => {
    const stage = host.querySelector(".hl-stage");
    const out = host.querySelector(".hl-read");
    stage.setAttribute("data-hairline", figure.name);
    const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
    const read = {
      get textContent() { return out.textContent; },
      set textContent(v) { out.textContent = v == null ? "" : String(v); },
    };
    figure.mount({ stage, svg, read }, figure.range[1]);
    return stage;
  };
  const stage = mount(host);

  // Fotogrames fixos de la mateixa figura més avall del post (HairlineFigure
  // amb `at`): es munten aquí, perquè la figura només es pot carregar un cop,
  // i un punter fals es queda al punt `at` (unitats del viewBox).
  addEventListener("DOMContentLoaded", () => {
    for (const el of document.querySelectorAll(`figure[data-at][data-name="${figure.name}"]`)) {
      const s = mount(el);
      const [x, y] = el.dataset.at.split(",").map(Number);
      const r = s.getBoundingClientRect();
      s.dispatchEvent(new PointerEvent("pointermove", {
        clientX: r.left + (x / 400) * r.width,
        clientY: r.top + (y / 320) * r.height,
        pointerType: "mouse",
      }));
    }
  });

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let lap = null;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !lap) lap = HL.tour(stage, figure.tour || HL.LAP);
    else if (!e.isIntersecting && lap) { lap.stop(); lap = null; }
  }, { threshold: 0.6 }).observe(stage);
};
