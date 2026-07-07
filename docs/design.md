# Brand & design spec — Pere Montpeó (redisseny)

Direcció: [`pierre.computer`](https://pierre.computer/) com a referència visual
(terminal / brutalist minimal), adaptada al contingut i a l'accent de marca de
[`peremontpeo.dev`](https://peremontpeo.dev/).

Aquest document és la **font de veritat** del redisseny. Recull l'spec original i
les decisions preses durant la fase de proposta (maquetes v1–v7). S'escriu **abans**
d'implementar; els canvis de direcció es reflecteixen aquí primer.

## Principi

La pàgina **és un fitxer de text**. Sense chrome, sense superfícies, sense vores:
només text monospace dins un `<pre>`, separadors `~~~` i un únic accent ambre. Tota
decisió que afegeixi «decoració» va en contra de la direcció.

## Tokens de color (OKLch)

```css
.theme {
  color-scheme: light dark;

  --bg:      light-dark(oklch(97% 0.003 250), oklch(7% 0.005 260));   /* ≈ #f7f7f8 / #070708 */
  --surface: var(--bg);                                               /* pàgina única, no hi ha superfícies */
  --fg:      light-dark(oklch(20% 0.004 250), oklch(97% 0.003 250));
  --muted:   light-dark(oklch(52% 0.004 250), oklch(55% 0.004 250));  /* labels ALL CAPS, dates, metadades */
  --border:  transparent;                                             /* sense vores; els separadors són ~~~ */
  --accent:  oklch(68% 0.14 65);                                      /* ambre CRT, hereu de hsl(40,100%,30%) */
}
.theme[data-theme="light"] { color-scheme: light; }
.theme[data-theme="dark"]  { color-scheme: dark; }
```

- **Un sol accent.** L'ambre es reserva exclusivament per a: cursor `█`, enllaços,
  i l'indicador d'estat «Actual / Online». Res més va en ambre.
- **Tema automàtic** via `prefers-color-scheme` (`light-dark()`), amb un **toggle
  manual mínim** de tres estats — `AUTO / CLAR / FOSC` — heretat de la web actual
  (es persisteix a `localStorage`, com ara).

## Tipografia

- Display + body + mono = **una única família monospace** (intencional, com
  pierre.computer):

  ```css
  --mono: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco,
          'Cascadia Mono', Consolas, 'Liberation Mono', monospace;
  ```

- Mida base: **`12px` / `line-height: 20px`** (igual que la referència).
- Jerarquia mínima: el títol és `font-weight: 700`; tota la resta és pes regular.
  La jerarquia la fan les **labels ALL CAPS** i l'espai en blanc, no la mida.
- Les fonts locals actuals (Geist Mono / Geist Pixel / Geist Sans) deixen de
  carregar-se a la home; vegeu «Articles» per a l'excepció del blog.

## Postura (layout rules)

1. Tot el contingut dins un `<pre>` amb `white-space: pre-wrap; overflow-wrap: anywhere`.
2. Separadors amb `~~~` (tres tildes), no `<hr>` ni vores.
3. Labels ALL CAPS + `:` (`STATUS:`, `LLOC:`, `ÚLTIM APUNT:`, `EXPERIÈNCIA:`, `CONTACTE:`).
4. Enllaços inline com markdown dins el `<pre>`: `[text]` (claudàtors en `--muted`,
   text en `--accent`). L'URL s'omet quan el text ja és l'URL (contacte).
5. Cursor `█` al títol; parpelleig pas a pas (`step-end`), desactivat amb
   `prefers-reduced-motion`.
6. Sense chrome: no header sticky, no footer pesat, no nav superior, no imatges
   (excepte l'avatar, vegeu divergències). Només `padding: 30px` (`40px` a `≥640px`).
   Amplada de línia màxima de lectura: `max-width: 46rem` centrat.
7. Tema: `light-dark()` + `prefers-color-scheme` (auto), amb toggle manual mínim.

## Avatar interactiu (divergència acordada respecte l'spec)

L'spec original deia «no imatges». Mantenim **un únic element gràfic**: l'avatar
interactiu existent (`InteractiveAvatar.astro`), tal com és ara — **foto normal amb
la capa SVG d'ulls** que segueixen el cursor, parpellegen i fan wink.

> **Descartat:** es va provar un tractament *dithered* (Bayer 4×4 duotò) per donar-li
> aire de terminal, però els ulls SVG nítids per sobre de la cara ditherada xocaven.
> Decisió final: **avatar sense dither**.

- Foto: `src/assets/avatar.png`, `object-fit: cover`.
- Mida: ~132px. Cantonades rectes (no cercle), sense vora ni ombra.
- La capa SVG d'ulls es manté intacta: pupil·les fosques (`--eye-pupil: #111827`),
  escleròtica color crema (`--eye-sclera: #fdf4e4`), seguiment del cursor +
  parpelleig/wink. **Aquests dos colors són fixos**, no depenen del tema: van per
  sobre de la foto (que no canvia amb el tema), i el crema ha de casar amb el fons
  crema de `avatar.png` (no blanc pur).
- `prefers-reduced-motion`: atura el parpelleig automàtic (el seguiment del cursor
  es manté, és benigne).

Opció oberta (no decidida): passar la foto a **escala de grisos** (`filter:
grayscale(1)` o pre-procés amb `sharp`) per integrar-la millor amb el to monocrom de
la pàgina, mantenint l'avatar reconeixible. Per defecte es deixa **en color**.

## Nav (divergència acordada)

El web té diverses pàgines (`/`, `/blog`, `/experiencia`, `/cv`). En lloc de zero
navegació, una **nav mínima en text** al peu: `[inici] [apunts]` (+ `[cv]`), dins el
`<pre>`, amb l'estil d'enllaç markdown.

## Articles del blog (excepció de tipografia)

A les pàgines d'apunts (`/blog/[slug]`), el **cos de l'article es manté en Geist Sans**
per a la lectura còmoda de text llarg. El *chrome* (capçalera, metadades, navegació,
peu) segueix en monospace. La resta de pàgines són 100% monospace.

## Contingut conservat (de peremontpeo.dev)

- **Nom:** PERE MONTPEÓ
- **Bio (ca):** «Enginyer de programari especialitzat en tot i en res. Actualment,
  fent que els ordinadors facin coses sols. Si no estic programant, segurament em
  trobaràs sobre la bicicleta, a la cuina o llegint.»
- **Localització:** Tarragona, Catalunya
- **Experiència:**
  - AI Lead Engineer — Goil (jul. 2025 — Actual)
  - Software Engineer — Decathlon Technology Spain (gen. 2024 — jul. 2025)
  - Innovation Manager — Decathlon Technology Spain (gen. 2023 — febr. 2024)
  - Software Engineer — Decathlon Technology Spain (març 2022 — març 2023)
  - (+ entrades anteriors a `src/content/experience/`, enllaçades des de `[veure tot]`)
- **Últim apunt:** «QuiverAI i l'AI SDK: quan el text és una imatge (i es pot fer
  streaming)» (10/03/2026, 2 min)
- **Contacte:** pere@montpeo.com · github.com/pmontp19 · linkedin.com/in/perem ·
  twitter.com/pmontp19 (el correu es manté ofuscat amb el patró actual de
  `ContactSection.astro`).

## Estructura de la home (esquema)

```
[avatar dithered]

PERE MONTPEÓ █

<bio>

STATUS:  AI Lead Engineer @ Goil · Actual
LLOC:    Tarragona, Catalunya

~~~

ÚLTIM APUNT:
[<títol últim apunt>]
<data> · <temps lectura>

~~~

EXPERIÈNCIA:
- <rang>  <rol> @ <empresa>
  …
[veure tot →]

~~~

CONTACTE:
- CORREU    [pere@montpeo.com]
- GITHUB    [github.com/pmontp19]
- LINKEDIN  [linkedin.com/in/perem]
- TWITTER   [twitter.com/pmontp19]

~~~

© <any> Pere Montpeó · [inici] [apunts] · fet amb astro
```

## Mapa d'implementació (codebase)

| Fitxer | Canvi |
| --- | --- |
| `src/styles/global.css` | Substituir tokens HSL per OKLch + `light-dark()`; mono únic 12/20; estils de `pre.doc`, `.tilde`, `.label`, `.mdlink`, `.cursor`; eliminar `.card`, `.tag`, vores, ombres, graella de punts. |
| `src/layouts/Layout.astro` | Treure header sticky / footer pesat / fons de punts; `padding` 30/40px; conservar el script de tema (ampliar a AUTO/CLAR/FOSC) i les view transitions. |
| `src/components/Header.astro` | Reduir a nav en text (o moure-la al peu); eliminar emoji 🍔 / 👨‍💻 i menú hamburguesa. |
| `src/components/Footer.astro` | Línia única en text amb `[inici] [apunts]` i el toggle de tema mínim. |
| `src/components/InteractiveAvatar.astro` | Conservar pràcticament tal qual (foto + ulls interactius); només adaptar el marc al nou layout (cantonades rectes, sense cercle/ombra), tokens d'ulls via OKLch. |
| `src/pages/index.astro` | Reescriure la home com a `<pre>` segons l'esquema. |
| `src/components/BlogPosts.astro`, `ExperienceTimeline.astro`, `ExperienceEntry.astro`, `ContactSection.astro` | Adaptar a sortida de text dins `<pre>` (llistes amb `-`, labels ALL CAPS, enllaços `[markdown]`). |
| `src/pages/blog/index.astro`, `blog/[slug].astro` | Llistat i article en l'estil terminal; cos de l'article en Geist Sans (excepció). |
| `src/pages/experiencia.astro`, `cv/[lang].astro`, `cv/index.astro`, `contact.astro` | Coherència amb el sistema. |
| OG images (`src/lib/og-image.ts`, `src/pages/api/og-image/*`) | Revisar perquè reflecteixin la nova paleta/tipografia. |

## Accessibilitat

- Contrast: `--fg` sobre `--bg` compleix AA en tots dos temes; l'accent ambre s'usa
  per a text d'enllaç sobre fons, verificar AA (≥ 4.5:1) — ajustar la lluminositat de
  l'accent si cal sense canviar el to.
- `prefers-reduced-motion`: desactiva cursor parpellejant, parpelleig d'ulls i
  qualsevol transició.
- Focus visible (`outline` en accent) a tots els enllaços i botons.
- L'avatar és decoratiu (`alt=""`, `aria-hidden` a la capa d'ulls); cap informació
  depèn només d'ell.
- `<pre>` amb `pre-wrap` per no forçar scroll horitzontal en mòbil.

## Notes / decisions obertes

- **Avatar en color vs escala de grisos:** per defecte en color; obert a provar
  `grayscale` si destorba el to monocrom.
- **Amplada de columna:** 46rem; revisar amb contingut real.
- Fidelitat 100% a l'spec = treure l'avatar i deixar text pur. Decisió actual:
  **mantenir l'avatar interactiu** (foto + ulls) com a segell personal, sense dither.
