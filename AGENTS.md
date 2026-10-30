# AGENTS.md

## No "arreglar" (decisions intencionals)

- El correu és invisible sense JS (`data-user`/`data-domain` + JS) per privacitat
  contra scrapers. Auditories d'agent-readiness l'acusen; és volgut, no el canviïs.

## Trampes del lloc

- El document terminal de la portada és un `<pre>`: Astro (`compressHTML`) es menja
  els salts de línia de les plantilles fora de `<pre>`. No el converteixis en `div`
  ni deixis que Prettier reformati el seu contingut (destrueix el layout `pre-wrap`).
- Redirects de pàgina: fer-los a `public/_redirects` (301 real de Cloudflare Pages).
  `Astro.redirect` en mode estàtic genera `<meta http-equiv="refresh">` amb HTTP 200,
  que penalitza agents sense navegador.
- Blocs de codi dels apunts: sempre amb etiqueta d'idioma (fins i tot ```text).

## Generat automàticament (no sincronitzar a mà)

- `llms.txt` (índex), `llms-full.txt` (bolcat) i `blog/<slug>.md` (mirrors) surten
  de la col·lecció `blog`: un post nou hi apareix sol en fer build.
- `src/assets/fonts/geist-sans-*.woff2` i `src/styles/geist-sans.css` surten de
  `scripts/subset-fonts.py` (a mà, no al build). Torna'l a executar si un post nou
  usa un caràcter fora del `unicode-range` del core (instruccions al script).

## Soroll local conegut

- `pnpm lint` falla per `hairline/` i `.agents/` (no versionats): no afecta CI.
