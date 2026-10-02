---
title: "Tinc mem: com he fet un cercador de fotogrames de Plats bruts"
description: "Com va néixer tincmem.cat, el cercador de fotogrames i diàlegs de Plats bruts: el pipeline de vídeo, la cerca al navegador, Cloudflare, i què m'ha dit l'analítica."
date: 2026-10-02
draft: true
---

Fa uns dies vaig publicar [tincmem.cat](https://tincmem.cat), un cercador de fotogrames de *Plats bruts*: escrius una frase, tries el fotograma, hi poses text si vols, i el descarregues o en fas un GIF. Ha tingut ressò a la premsa: [Nació Digital](https://naciodigital.cat/next/trend/una-font-inagotable-de-mems-de-plats-bruts-la-nova-creacio-viral-dun-usuari-algu-ho-havia-de-fer.html), [Racó Català](https://www.racocatala.cat/noticia/72170/aplicacio-permet-convertir-tots-fotogrames-dialegs-plats-bruts-mems) i [El Món a RAC1](https://x.com/pmontp19/status/2104852329954787654) se'n van fer ressò.

Aquí explico com s'ha fet, quines decisions tècniques han acabat sent les bones, i què he après mirant l'analítica.

## L'origen

La idea no és meva: està inspirada en [Frinkiac](https://frinkiac.com), el cercador de captures dels Simpson. Plats bruts té una cosa que el fa perfecte per això: frases que ja formen part del llenguatge de tothom ("Tinc espelma", "Tinc un somni"...).
**[PENDENT: aquí, en una o dues línies, la teva història: què et va fer començar, i el moment concret.]**

El primer commit és del 23 de setembre. Cinc dies després ja sortia a la premsa.

## El pipeline: de vídeo a frases

Tot el contingut es genera abans, amb un pipeline en Python que no corre mai en producció. La web final és estàtica. Per cada capítol:

1. **Catàleg.** Llegeixo l'API de 3Cat per saber quins capítols hi ha (73 de Plats bruts).
2. **Subtítols.** Cada línia de subtítol és una frase cercable. Per cada una, agafo tres moments dins del seu interval.
3. **Fotograma.** De cada moment trio el més nítid de tres candidats, i descarto els gairebé idèntics dins del mateix pla (per no omplir el cercador de còpies). La detecció de canvis de pla es fa amb ffmpeg.
4. **Qui parla.** El truc que més m'agrada: els subtítols de 3Cat tenen un color per personatge. Groc és el David, cian el Lopes, verd l'Emma, fúcsia la senyora Carbonell. Només mirant el color de cada línia puc filtrar per personatge sense cap model d'IA.
5. **Mitjans.** Genero miniatures, el fotograma de la frase, un vídeo petit (400x300) per fer GIFs al navegador, i la imatge de previsualització amb el subtítol cremat.

El resultat: unes 31.000 frases i uns 70.000 fotogrames.

## La web: tot al navegador

La web és un únic `index.html` estàtic. La cerca va amb [MiniSearch](https://lucaong.github.io/minisearch/) (BM25), que busca primer exacte i, si no troba res, aproximat, amb un avís. Els GIF es construeixen al navegador amb [gifenc](https://github.com/mattdesl/gifenc), sense pujar res enlloc i sense marca d'aigua. Cada fotograma té una URL pròpia (`/T1C1/642400/213`), perquè es pugui compartir exactament aquell moment.

Dos detalls que em van costar més del que semblava:

- **Safari i iOS.** El GIF a iOS només arrenca si el `play()` del vídeo es crida dins del clic.- **Mòbil primer.** La majoria de gent ho compartirà des del telèfon: capçalera compacta, personatges lliscants, graella de dues columnes.

## Cloudflare: Workers, R2 i un cas de CORS

El desplegament és un Worker de Cloudflare amb fitxers estàtics (poc més d'1 MB) i els fotogrames, miniatures i vídeos a R2, perquè superen els límits de fitxers estàtics (20.000 fitxers i 25 MiB per fitxer).

Un cas que val la pena explicar: per copiar imatges i fer GIFs, el navegador necessita CORS a R2. Però la memòria cau de Cloudflare no fa cas de `Vary: Origin`: si una sola petició sense `Origin` (un crawler, una previsualització d'enllaç) arriba primer, la memòria cau guarda la resposta sense capçaleres CORS, i després la web veu imatges trencades. La solució va ser una Transform Rule que posa `Access-Control-Allow-Origin: *` a tot el domini de mitjans, més demanar sempre les imatges amb `crossorigin`.

I una limitació del pla gratuït: 10 ms de CPU per petició. Construir l'índex de MiniSearch dins del Worker en costava entre 400 i 700. Per a la cerca que serveixen el Worker i l'MCP vaig acabar fent un `indexOf` sobre un fitxer pla, sense tolerància a errors d'escriptura (la web sí que en té, perquè corre al navegador).

## Pensat també per a agents

Aquest és el costat que potser sorprèn. Cada fotograma també es pot demanar en Markdown (`Accept: text/markdown` o acabant la URL amb `.md`): frase, imatge i context en 1 o 2 kB, en comptes dels 45 kB de la web. La cerca també té versió Markdown, hi ha `llms.txt`, i he publicat un servidor MCP perquè un assistent pugui cercar escenes de Plats bruts.

## Les analítiques

Vaig voler saber què passava sense posar cookies ni banners:

- **Cloudflare Web Analytics** per a visites i pàgines, que sense cookies no necessita avís de consentiment. Com que la web navega amb `pushState`, vaig haver d'afegir-hi canvis d'historial perquè comptés cada fotograma com a vista.
- **Esdeveniments propis** (cerques, fotogrames vistos, accions) enviats a Cloudflare Analytics Engine des del Worker, i un petit script que els consulta.

**[PENDENT: dades reals. Cal consultar-les amb `python3 stats.py platsbruts 7` (necessita `CF_API_TOKEN`) i el panell de Web Analytics. Idees de què explicar:]**

- **[PENDENT: visites i usuaris únics el dia de la premsa vs. la resta]**
- **[PENDENT: les 5 cerques més fetes]**
- **[PENDENT: cerques sense resultats: què busca la gent que no hi és]**
- **[PENDENT: capítols més vistos i països]**
- **[PENDENT: percentatge de mòbil]**

## Què en trec

- Un projecte petit, fet per fans i molt concret, pot arribar lluny si resol una cosa amb gràcia.
- Fer-ho tot abans (pipeline) i servir estàtic ho fa barat i ràpid de mantenir.
- Pensar des del primer dia que els visitants també poden ser agents canvia com serveixes el contingut.

Tot és un projecte de fans, sense ànim de lucre i sense cap relació amb 3Cat, Televisió de Catalunya ni Kràmpack. Les imatges i els diàlegs són dels seus titulars, i només s'usen com a citació i homenatge.

**[PENDENT: tancament personal, i si vols obrir el codi.]**
