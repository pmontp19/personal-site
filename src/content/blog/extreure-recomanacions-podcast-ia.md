---
title: "Extreure recomanacions de podcasts amb IA"
description: "Com he construit un pipeline automàtic per extreure recomanacions de llibres, películes i séries dels podcasts"
date: 2026-02-27
---

Escoltant **Mossegalapoma** sempre m'he trobat tirant endavant i enrere per buscar les referències a llibres, películes i altres obres que surten més enllà de les propostes mossegui. Quan dius "ah, doncs millor que li done un cop d'ull a això" i has de parar el podcast per buscar-ho, al final ho oblides. Vaig pensar: i si tingués totes aquestes recomanacions recollides en un lloc?

Doncs amb els models de llenguatge actuals, es pot fer. I força bé.

## Com funciona

El pipeline és automàtic:

1. **RSS → Descàrrega**: S'escolta el feed RSS del podcast. Si hi ha un episodi nou, es descarrega l'àudio.

2. **Compressió**: L'mp3 es comprimeix (mono, 16kHz, 24kbps) perquè cap en 25MB — el límit de Groq.

3. **Transcripció**: Whisper de Groq transcriu l'àudio. Tot i que el català no és el seu fort, funciona prou bé.

4. **Extracció de recomanacions**: Aquí ve la màgia. Amb un model de text — actualment **Claude Sonnet 4.6** — s'analitza la transcripció i s'extreuen les obres recomanades. No totes les mencions compten: el model busca recomanacions explícites, no simplement referències culturals.

5. **Enriquiment**: Cada obra es consulta a una API externa per obtenir dades extres:
   - **TMDB**: pósters, trames i puntuacions de películas i sèries
   - **Open Library**: cobertes i autors de llibres
   - **RAWG**: imatges de videojocs
   - **iTunes**: podcasts

6. **Emmagatzematge**: Tot es guarda a SQLite i s'exporta a un fitxer JSON.

7. **Frontend**: Un site fet amb **Astro** llegeix el JSON a build time i genera una pàgina on pots consultar totes les recomanacions per episodi.

## Un disseny modular

Una de les coses que m'ha agradat fer és que el sistema és bastant genèric. Canviant la variable `RSS_URL`, pots processar qualsevol altre podcast. Ara mateix està configurat per Mossegalapoma, però l'arquitectura ho permetria extrapolar a d'altres.

## Problemes trobats

No tot ha sigut fàcil:

- **Model d'extracció**: Opus era massa overkill (i car). Haiku donava massa falsos positius. Sonnet sembla el punt just entre rendiment i qualitat.

- **Transcripció**: Whisper no acaba de pillar bé el català. Moltes obres surten mal transcrites i llavors l'extracció no les troba.

- **Reconeixement**: Tot i l'enriquiment amb APIs externes, quan el títol original no coincideix amb el que diuen al podcast (o està en un altre idioma), costa de fer el match.

## Estat actual

De moment no crec que l'acabi del tot. La base funciona, però la qualitat de les dades dependrà molt de com evolucioni la transcripció i el reconeixement d'obres. De moment és una prova de concepte que funciona — i que m'ha servit per aprendre algo més jugant amb els models.

## Stack

- **Backend**: Python, Groq API, SQLite
- **Frontend**: Astro, Tailwind CSS
- **APIs externes**: TMDB, Open Library, RAWG, iTunes
