---
title: "Descobrint Astro"
description: "Com vaig descobrir Astro i per què funciona tan bé."
date: 2025-04-28
---

Necessitava fer una pàgina web nova, tenia temps lliure, i vaig començar amb els pensaments típics:

– A la feina vaig amb Vue, doncs React
– Per què no Nextjs i faig alguna cosa més elaborada
– Posats a fer, vanilla javascript i a veure com de petita puc fer-la
– Ens agraden els extrems, no javascript, HTML sense estils
– Ben mirat, m'agradaria fer-la més bonica potser
– El vibe coding irrompt, necessito pujar a l'onada, puc fer una cosa més elaborada amb un esforç més baix
– Potser també vull fer un blog, miro un CMS amb un frontend
– Encara més fàcil, volia saber com funcionava [HUGO](http://hugo.io) (resulta que no és tan fàcil) 
– De casualitat descobreixo Astro

Astro és la baula perduda entre els frameworks de Javascript. No hi havia fins al moment cap framework (dels populars) realment enfocat al contingut. A més, si necessitava algun component més elaborat, és compatible amb parts de React, Vue o Svelte i SEO-friendly.

Si no hi poses Javascript, no n'hi ha. Buscava una cosa que realment fos ràpida, generada al servidor, i alguns extres. 

[v0](http://v0.dev) em va ajudar a genrar alguna part de l'UI concreta, i amb Copilot l'he adaptada al projecte d'Astro. Crec que l'únic que Copilot (Gemini 2.5) no ha pogut resoldre són les View Transitions API que amb les últimes versions d'Astro vénen de sèrie, i les imatges d'open-graph, que s'ha enredat bastant i encara no ho he arreglat.

Amb no gaire esforç pots començar el teu web, landing, blog, partint d'arxius Markdown o fins i tot MDX, fins a un CMS personalitzat.

[Astro docs](https://docs.astro.build/en/getting-started/)