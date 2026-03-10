---
title: "QuiverAI i l'AI SDK: quan el text és una imatge (i es pot fer streaming)"
description: "Fa uns dies vaig afegir suport per a QuiverAI a l'AI SDK de Vercel, i el procés va revelar un cas d'ús que trobo especialment curiós: un model que genera text... però el text és una imatge."
date: 2026-03-10
---

**Languages:** [Català](#catalan) • [English](#english)

---

## Català {#catalan}

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

Un detall tècnic: la implementació oficial de `@quiverai/sdk` tenia un bug (potser de forma intencionada) al seu parser Zod — rebutjava els events `generating` perquè el seu schema no els contemplava. Vaig haver d'implementar un parser SSE propi que usa `postToApi` de `@ai-sdk/provider-utils` amb un handler personalitzat en lloc del `createEventSourceResponseHandler` estàndard.

## Per a qui és útil el streaming d'SVG?

- **Editors de gràfics amb IA**: l'usuari veu el resultat construir-se en temps real en lloc d'esperar una pantalla en blanc.
- **Generadors de logos o icones**: feedback immediat que redueix la sensació d'espera.
- **Apps de storytelling visual**: pots sincronitzar la narració amb l'aparició progressiva dels elements gràfics.
- **Demos i prototips**: l'efecte de "dibuix en directe" és visualment impactant amb molt poc codi.

---

El provider és open source: [github.com/pmontp19/quiverai-ai-sdk-provider](https://github.com/pmontp19/quiverai-ai-sdk-provider)

`npm install quiverai-ai-provider`

---

## English {#english}

A few days ago I added [QuiverAI](https://quiver.ai/) support to Vercel's AI SDK, and the process revealed a use case I find particularly fun: **a model that generates text... but the text is an image**.

### SVG: The Format Living in Two Worlds

An SVG is, technically, XML. Plain text. You can open it with a text editor and read it:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="red" stroke="blue" stroke-width="4"/>
</svg>
```

But if you put it in an `<img>` tag or load it in the browser, you see a vector image. Infinitely scalable, no pixels.

This makes QuiverAI special: it's an image generation model, but its output is text. And when something is text, you can **stream it**.

### `LanguageModelV3` and `ImageModelV3`: Same API, Two Experiences

The AI SDK has two types of models for cases like this:

- **`LanguageModelV3`**: returns text. Supports `generateText` and `streamText`.
- **`ImageModelV3`**: returns bytes (`Uint8Array`). Supports `generateImage`.

In `quiverai-ai-provider` I implemented both. They call exactly the same QuiverAI API underneath, but expose very different interfaces to the application.

#### `generateImage`: The Classic Experience

```ts
import { quiverai } from 'quiverai-ai-provider';
import { generateImage } from 'ai';

const { images } = await generateImage({
  model: quiverai.image('arrow-preview'),
  prompt: 'A red circle with a blue border',
});

const svg = new TextDecoder().decode(images[0].uint8Array);
```

You wait, the entire image arrives, you render it. Simple, clean. What you'd expect for most use cases.

#### `streamText`: Live Drawing

Now comes the fun part. Since the SVG is text, you can stream it token by token. Each chunk that arrives is a small piece of XML markup — sometimes a single character, sometimes a few bytes:

```
<
svg
 xmlns
="
http://www.w3.org/2000/svg
"
```

If you accumulate the fragments and re-render the SVG in the browser with each chunk, you get a **live drawing effect**: you see how the SVG builds itself, layer by layer, line by line.

```ts
import { quiverai } from 'quiverai-ai-provider';
import { streamText } from 'ai';

const result = streamText({
  model: quiverai('arrow-preview'),
  prompt: 'A red circle with a blue border',
});

let svg = '';
for await (const chunk of result.textStream) {
  svg += chunk;
  renderSVG(svg); // the browser tolerates incomplete SVG!
}
```

The trick is that modern browsers tolerate partially formatted SVG. You don't need to wait for the closing `</svg>` tag to render something; the browser engine does its best with what it has.

The problem is making it consistent across all browsers. If a chunk arrives mid-way — for example, `<path d="M 10 10 L 20 ` — the browser might not render anything or show visual glitches. To avoid this inconsistency, the solution is to use an **incremental parser that automatically closes pending tags** as you accumulate fragments. When you render each version of the SVG, you already have a valid structure with all elements closed. The trick here is to use a SAX parser that builds the tree element by element: each time a new chunk arrives, it's processed, any open tags are closed, and it's serialized to a physically valid SVG. This way you see the drawing progress smoothly without jumps or distortions:

```ts
const parser = createSaxStreamingParser();

for await (const chunk of result.textStream) {
  parser.write(chunk);
  const validSVG = parser.toValidSVG(); // Always valid, tags closed
  updateCanvas(validSVG);
}

parser.close();
```

This way, each frame rendered in the browser is a complete, parseable SVG — not just "as complete as it could be".

### How Streaming Works Under the Hood

The QuiverAI API sends three types of SSE events:

| Event | Content | Mapped to |
|---|---|---|
| `generating` | Model's internal reasoning | `reasoning-delta` |
| `draft` | SVG fragment (1-5 characters) | `text-delta` |
| `content` | Complete final SVG | `text-end` |

The `draft` events are the interesting ones: each carries a tiny piece of the SVG. For live rendering, you accumulate them. When the final `content` event arrives, you have the complete, clean SVG.

A technical detail: the official `@quiverai/sdk` implementation had a bug (or maybe intentional) in its Zod parser — it rejected `generating` events because its schema didn't account for them. I had to implement a custom SSE parser that uses `postToApi` from `@ai-sdk/provider-utils` with a custom handler instead of the standard `createEventSourceResponseHandler`.

### Who Benefits from SVG Streaming?

- **AI-powered graphics editors**: users see the result build in real-time instead of waiting for a blank screen.
- **Logo or icon generators**: immediate feedback that reduces the feeling of waiting.
- **Visual storytelling apps**: you can sync narration with the progressive appearance of graphical elements.
- **Demos and prototypes**: the "live drawing" effect is visually impactful with minimal code.

---

The provider is open source: [github.com/pmontp19/quiverai-ai-sdk-provider](https://github.com/pmontp19/quiverai-ai-sdk-provider)

`npm install quiverai-ai-provider`