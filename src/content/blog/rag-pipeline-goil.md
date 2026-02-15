---
title: "Com he implementat RAG a Goil: per què ho faig jo"
description: "Per què he optat per construir la nostra pròpia pipeline de RAG en lloc d'usar wrappers de tercers, i com ho hem fet amb pgvector, OpenAI i Next.js."
date: 2026-01-15
---

Amb el time to market actual, és fàcil limitar-se a connectar-se a un wrapper de tercers i donar la feina per feta. A Goil ho estic fent diferent.

He implementat la nostra pròpia pipeline de [RAG (Retrieval-Augmented Generation)](https://www.pinecone.io/learn/retrieval-augmented-generation/). El context personalitzat que se li dona a la IA perquè sàpiga coses que van més enllà del seu propi entrenament.

## Per què és important per a nosaltres?

Com que no delego el procés a plataformes tancades, en tinc el control total. Això em permet:

- **Testejar cada etapa**, visibilitat de què falla i per què.
- **Afinar el context engineering**: no és el mateix una transcripció que un llibre; puc ajustar la lògica de [chunking segons el tipus de document](https://weaviate.io/blog/chunking-strategies-for-rag).
- **Personalitzar la recuperació**: adapto com es busquen les dades segons les necessitats.

Segons [Databricks](https://community.databricks.com/t5/technical-blog/the-ultimate-guide-to-chunking-strategies-for-rag-applications/ba-p/113089), el chunking és clau: cada chunk s'indexa i s'incrusta individualment, així que l'estratègia de divisió afecta directament la qualitat de la recuperació.

## El nostre stack actual

### 🔹 pgvector amb Postgres

[Fiable i robust](https://www.datacamp.com/tutorial/pgvector-tutorial). Tenir les dades vectorials al mateix lloc que les relacionals ho simplifica tot. [pgvector](https://www.yugabyte.com/blog/postgresql-pgvector-getting-started/) permet emmagatzemar, consultar i indexar embeddings al costat de la resta de les teves dades.

### 🔹 Embeddings d'OpenAI

[Models efectius, ràpids i amb un cost raonable](https://developers.openai.com/api/docs/guides/embeddings/). OpenAI ofereix [text-embedding-3-small i text-embedding-3-large](https://openai.com/index/new-embedding-models-and-api-updates/), dues opcions que cobreixen la majoria de casos d'ús.

### 🔹 Frontend + API amb Next.js

Ens permet iterar i desplegar millores a una velocitat altíssima. El [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) és el toolkit TypeScript per construir aplicacions amb IA, i [Next.js](https://vercel.com/templates/next.js/nextjs-ai-chatbot) és la base perfecta per a interfícies de xat en producció.

Aquesta arquitectura modular ens dona la llibertat de canviar qualsevol peça de l'stack amb relativa facilitat si el mercat o la tecnologia evolucionen.

## Build vs Buy

[Render](https://render.com/articles/build-vs-buy-rag-infrastructure) analitza el dilema: construir un stack RAG propi vs comprar una plataforma unificada. La decisió afecta directament les mètriques de negoci i tècniques.

[Retool](https://retool.com/blog/build-vs-buy-ai-agents) argumenta que les solucions personalitzades guanyen a llarg termini: més control, més flexibilitat, més avantatge competitiu.

[Ramtin Lahooti](https://ramtinlahooti.com/blog/custom-ai-agents-vs-wrappers) ho resumeix: construeix custom si necessites un "data moat" — vols que la IA aprengui de la història única de la teva empresa, quelcom que els competidors no poden accedir.

## En què es tradueix això?

En una experiència sense friccions per als nostres usuaris. Convertim un problema tècnic complex en una acció tan simple com carregar documents amb un sol clic.

L'usuari puja els arxius de la seva empresa i el nostre sistema gestiona la indexació i la integració automàticament. El resultat? Un assistent d'IA que realment coneix el seu negoci, amb la tranquil·litat de saber exactament com es processen les dades.

Potser el cost de desenvolupament inicial és més alt, però és l'única manera d'assegurar-nos que el producte evoluciona sense dependre dels límits de ningú més.
