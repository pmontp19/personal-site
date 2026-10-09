/*
 * Munta una figura Hairline (kernel.js, de @lucasmarkes/hairline) dins d'un
 * post: fa el que fa el bench de l'skill, sense controls. El valor és el del
 * mig de `range`. Mentre la figura és a la vista i ningú hi posa el punter,
 * un punter invisible fa la volta (`tour`), excepte amb reduced motion.
 */
window.hairline = (figure) => {
  const host = document.currentScript.closest("figure");
  const stage = host.querySelector(".hl-stage");
  const out = host.querySelector(".hl-read");
  HL.inject(document);
  stage.setAttribute("data-hairline", figure.name);
  const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
  const read = {
    get textContent() { return out.textContent; },
    set textContent(v) { out.textContent = v == null ? "" : String(v); },
  };
  figure.mount({ stage, svg, read }, figure.range[1]);

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let lap = null;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !lap) lap = HL.tour(stage, figure.tour || HL.LAP);
    else if (!e.isIntersecting && lap) { lap.stop(); lap = null; }
  }, { threshold: 0.6 }).observe(stage);
};
