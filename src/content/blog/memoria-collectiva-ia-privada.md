---
title: "IA privada vs memòria col·lectiva: el dilema del desenvolupador"
description: "Com la IA està canviant la manera com compartim coneixement com a desenvolupadors, i per què necessitem una nova arquitectura de memòria compartida."
date: 2026-01-20
---

![Memòria col·lectiva](/images/blog/memoria-collectiva.jpg)

Aquesta setmana, mentre tractava un error de Sentry, em va venir una reflexió al cap.

Abans, quan tenia un problema, enganxava l'error a Google. Normalment acabava a [StackOverflow](https://stackoverflow.com). Allà compartia el problema, les pistes, les proves... la solució final era visible per tothom qui la busqués.

Era una memòria col·lectiva. StackOverflow era, en certa manera, el cervell col·lectiu dels desenvolupadors.

Ara, la [IA de Sentry](https://docs.sentry.io/product/ai-in-sentry/) em dóna solucions immediates. És ràpid. És còmode. Però...

La meva solució particular, el meu raonament, les excepcions del meu context — tot això queda invisible.

Ningú no la veurà. Cap altre model no la podrà aprofitar.

És irònic: la IA que va néixer de dades compartides ara crea silos de coneixement privat.

## El declivi de StackOverflow

No sóc l'únic que ho ha notat. [Eric Holscher](https://www.ericholscher.com/blog/2025/jan/21/stack-overflows-decline/) documenta com el volum de preguntes a StackOverflow va caure dràsticament després del llançament de ChatGPT el novembre 2022. La caiguda continua el 2025.

[Gergely Orosz al Pragmatic Engineer](https://blog.pragmaticengineer.com/stack-overflow-is-almost-dead/) ho resumeix: ChatGPT és més ràpid, està entrenat amb dades de StackOverflow, i les respostes tenen qualitat similar. A més, ChatGPT és educat i respon a tot.

[Futurism](https://futurism.com/artificial-intelligence/ai-has-basically-killed-stack-overflow) reporta que les preguntes mensuals van passar de més de 21.000 el gener 2025 a només 3.607 el desembre.

Avui, StackOverflow és irrellevant. Per què buscar i esperar quan un model et dóna la resposta en segons?

Però el cost és alt: perdem la serendipia (trobar allò que no busques), la traçabilitat, la comunitat. Perdem el "per què" i ens quedem només amb el "com".

## Cap a una nova arquitectura de memòria

[Brookings](https://www.brookings.edu/articles/ai-is-changing-the-physics-of-collective-intelligence-how-do-we-respond/) argumenta que la IA pot canviar la física de la intel·ligència col·lectiva. La pregunta clau: podem crear protocols que aumentin el coneixement compartit?

Segons un [estudi a ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2666389924002332), la IA pot millorar la intel·ligència col·lectiva humana en lloc de reemplaçar-la. Els humans aportem intuïció, creativitat i experiències diverses.

M'interessa la IA privada, personalitzada al meu context. Però voldria també poder seguir aportant i aprofitar el coneixement col·lectiu.

Potser necessitem una nova arquitectura de memòria compartida per models:

- Una memòria privada per defecte (privacitat, context personal)
- Una memòria global opt-in (coneixement compartit, anònim)

Així tindríem el millor dels dos mons: la immediatesa de la IA privada i la riquesa del coneixement col·lectiu.

[Axios](https://www.axios.com/sponsored/why-ais-next-big-leap-is-collective-intelligence) ho planteja bé: el problema fonamental és que els agents d'IA es poden connectar, però no poden pensar junts.

La pregunta no és "IA o comunitat". La pregunta és: com podem tenir totes dues?

Què en penseu?
