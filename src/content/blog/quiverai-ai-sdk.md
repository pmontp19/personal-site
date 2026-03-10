---
title: "QuiverAI i l'AI SDK: quan el text és una imatge (i es pot fer streaming)"
description: "Fa uns dies vaig afegir suport per a QuiverAI a l'AI SDK de Vercel, i el procés va revelar un cas d'ús que trobo especialment curiós: un model que genera text... però el text és una imatge."
date: 2026-03-10
---

Fa uns dies vaig afegir suport per a [QuiverAI](https://quiver.ai/) a l'AI SDK de Vercel, i el procés va revelar un cas d'ús que trobo especialment curiós: **un model que genera text... però el text és una imatge**.

## SVG: el format que viu en dos mons

Un SVG és, tècnicament, XML. Text pla. Pots obrir-lo amb el bloc de notes i llegir-lo:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="red" stroke="blue" stroke-width="4"/>
</svg>
```

Però si el poses en un `<img>` o el carregues al navegador, veus una imatge vectorial. Escalable fins a l'infinit, sense píxels.

Això fa que QuiverAI sigui un cas especial: és un model de generació d'imatges, però la seva sortida és text. I quan algo és text, es pot fer **streaming**.

## `LanguageModelV3` i `ImageModelV3`: la mateixa API, dues experiències

L'AI SDK té dos tipus de models per a casos com aquest:

- **`LanguageModelV3`**: retorna text. Suporta `generateText` i `streamText`.
- **`ImageModelV3`**: retorna bytes (`Uint8Array`). Suporta `generateImage`.

A `quiverai-ai-provider` he implementat els dos. Criden exactament la mateixa API de QuiverAI per sota, però exposen interfícies molt diferents cap a l'aplicació.

### `generateImage`: l'experiència clàssica

```ts
import { quiverai } from 'quiverai-ai-provider';
import { generateImage } from 'ai';

const { images } = await generateImage({
  model: quiverai.image('arrow-preview'),
  prompt: 'Un cercle vermell amb vora blava',
});

const svg = new TextDecoder().decode(images[0].uint8Array);
```

Esperes, arriba la imatge sencera, la renderitzes. Simple, net. L'esperable per a la majoria de casos d'ús.

### `streamText`: el dibuix en directe

Ara ve la part divertida. Com que el SVG és text, pots fer streaming token a token. Cada fragment que arriba és un tros petit de markup XML — a vegades un sol caràcter, a vegades uns pocs bytes:

```
<
svg
 xmlns
="
http://www.w3.org/2000/svg
"
```

Si vas acumulant els fragments i re-renderitzes el SVG al navegador a cada chunk, obtens un efecte de **dibuix en directe**: veus com l'SVG es construeix sol, capa a capa, línia a línia.

```ts
import { quiverai } from 'quiverai-ai-provider';
import { streamText } from 'ai';

const result = streamText({
  model: quiverai('arrow-preview'),
  prompt: 'Un cercle vermell amb vora blava',
});

let svg = '';
for await (const chunk of result.textStream) {
  svg += chunk;
  renderSVG(svg); // el navegador tolera SVG incomplet!
}
```

El truc és que els navegadors moderns toleren SVG parcialment format. No cal esperar el tag de tancament `</svg>` per renderitzar algo; el motor del navegador fa el possible amb el que té.

El problema és fer-ho consistent per tots els navegadors. Si arriba un chunk a mitges — per exemple, `<path d="M 10 10 L 20 ` — el navegador pot no renderitzar res o mostrar coses estranyes. Per evitar aquesta inconsistència, la solució és usar un **parser incremental que tanca automàticament els tags pendents** mentre vas acumulant els fragments. Quan renderitzes cada versió del SVG, ja tens una estructura vàlida amb tots els elements tancats. El truc aquí és fer servir un parser SAX que construeix l'arbre element a element: cada vegada que arriba un chunk nou, es processa, es tanca qualsevol tag obert, i es serialitza a un SVG físicament vàlid. Així veus el dibuix progrés suau sense saltejades ni distorsions:

```ts
const parser = createSaxStreamingParser();

for await (const chunk of result.textStream) {
  parser.write(chunk);
  const validSVG = parser.toValidSVG(); // Sempre vàlid, tags tancats
  updateCanvas(validSVG);
}

parser.close();
```

D'aquesta manera, cada frame que es renderitza al navegador és un SVG complet i parsejable — no només "tan complet com podia ser". 

## Com funciona el streaming per sota

L'API de QuiverAI envia tres tipus d'esdeveniments SSE:

| Esdeveniment | Contingut | Mapejat a |
|---|---|---|
| `generating` | Raonament intern del model | `reasoning-delta` |
| `draft` | Fragment de SVG (1-5 caràcters) | `text-delta` |
| `content` | SVG complet final | `text-end` |

Els `draft` events són els interessants: cada un porta un tros minúscul de l'SVG. Per al live rendering, els vas acumulant. Quan arriba el `content` final, tens el SVG complet i net.

Un detall tècnic: la implementació oficial de `@quiverai/sdk` tenia un bug al seu parser Zod — rebutjava els events `generating` perquè el seu schema no els contemplava. Vaig haver d'implementar un parser SSE propi que usa `postToApi` de `@ai-sdk/provider-utils` amb un handler personalitzat en lloc del `createEventSourceResponseHandler` estàndard.

## Per a qui és útil el streaming d'SVG?

- **Editors de gràfics amb IA**: l'usuari veu el resultat construir-se en temps real en lloc d'esperar una pantalla en blanc.
- **Generadors de logos o icones**: feedback immediat que redueix la sensació d'espera.
- **Apps de storytelling visual**: pots sincronitzar la narració amb l'aparició progressiva dels elements gràfics.
- **Demos i prototips**: l'efecte de "dibuix en directe" és visualment impactant amb molt poc codi.

---

El provider és open source: [github.com/pmontp19/quiverai-ai-sdk-provider](https://github.com/pmontp19/quiverai-ai-sdk-provider)

`npm install quiverai-ai-provider`