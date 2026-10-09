---
title: "Tres intents per fer un assistent d'IA que serveixi: de les eines a les capacitats"
description: "Com he passat d'un assistent amb una eina per cada funcionalitat, a una exploració amb UI generada pel model, a un assistent amb capacitats que el model proposa i les persones aproven. Què va fallar i què he après."
date: 2026-10-09
draft: true
---

A [Goil](https://goil.app) fem una plataforma perquè negocis (clubs, acadèmies, gestories, empreses, ajuntaments) es comuniquin amb la seva gent i la gestionin: una app amb la seva marca per als usuaris i un backoffice per a l'equip. Al gener vaig explicar [com vaig muntar el RAG](/blog/rag-pipeline-goil) perquè la IA conegués el context de cada negoci.

Aquest post explica el que va venir després: posar un assistent dins del producte que no només respongui, sinó que faci coses. M'hi he equivocat dues vegades abans d'arribar a una cosa que m'agrada. Les errades són la part interessant.

## Primer intent: una eina per cada funcionalitat

La idea més òbvia: un assistent dins del producte amb un conjunt d'eines escrites a mà, cadascuna lligada a una funcionalitat. «Quins esdeveniments tinc aquesta setmana?» crida una eina. «Crea un avís» en crida una altra.

Funciona a la demo. A producció, els problemes:

- **Els models d'aleshores triaven malament l'eina.** Els econòmics sobretot. Dues eines que s'assemblen, i en triaven la que no tocava.
- **Com més eines, pitjor.** Cada eina nova entra al context a cada petició. Més confusió, més cost, més latència. Afegir capacitat feia l'assistent pitjor.
- **Cada funcionalitat nova demanava una eina nova.** El producte avançava a un ritme i l'assistent anava sempre per darrere, com una segona capa que calia mantenir.

El problema no era el model. Era que havia convertit el catàleg del producte en el catàleg d'eines del model, i tots dos creixen a ritmes molt diferents.

## Segon intent: especialistes i interfície generada

La premissa era descarregar l'assistent d'eines. En lloc d'un sol assistent amb tot, diversos assistents especialitzats, cadascun amb les seves eines i la seva expertesa: un per a calendari i reserves, un altre per a notificacions, un altre per a gestió d'usuaris. Cada agent veu poques eines, així que en teoria cadascun tria bé.

En una branca d'exploració ho vaig provar, i de pas vaig donar més llibertat al model en un altre eix. El model rebia un catàleg de components i emetia una interfície en un llenguatge de marcatge pensat per això. També vaig provar un subagent que generava HTML per visualitzar dades. I, per no dependre de les eines que ja tenia, vaig començar a crear endpoints pensats només per a l'agent.

Va ser una bona exploració perquè va fallar de maneres molt clares:

- **Repartir les eines no resolia el problema, el movia.** Algú ha d'encaminar cada petició a l'especialista que toca, i les peticions que creuen dominis no encaixen en cap. Compartir context entre ells i donar-los memòria comuna era una feina nova que abans no existia. L'encaminament, el context i la memòria no escalaven millor que les eines.
- **Cap validació al servidor.** El que el model emetia es renderitzava tal qual. Un error del model era un error a la pantalla de l'usuari.
- **El model copiava valors dins la UI.** Si la xifra surt del model i no de la dada, la xifra pot ser incorrecta i ningú ho sabria.
- **El client controlava part del prompt.** Una part del que dirigia el comportament del model viatjava des del client. Mala idea.
- **L'HTML generat ignorava el sistema de disseny.** Cada resposta tenia la seva pròpia estètica. Res no semblava del producte.
- **Els endpoints a mida no escalen.** Era una API paral·lela per a l'agent, amb els seus contractes, que calia mantenir al costat de la bona.

Aquesta branca no va arribar a producció, i va fer bé de no arribar-hi. Però em va deixar quatre idees clares: repartir les eines entre agents no elimina el problema, el converteix en un d'encaminament i de context compartit; el que el model produeix ha de passar per validació; les dades han d'anar per referència i no per còpia; i l'agent ha d'usar el que el producte ja fa, no una versió paral·lela.

## Tercer intent: un assistent, moltes capacitats

La resposta ha estat girar el plantejament. Hi ha un únic assistent. Les seves eines i les seccions del seu prompt es munten a cada torn segons les **capacitats** habilitades per a aquella persona. Tres coses decideixen què té: el seu rol, el que inclou el pla del negoci i un interruptor que el negoci pot girar.

Ara per ara en tinc tres.

### `docs`: ajuda sobre el producte

Respon preguntes sobre com funciona el producte, a partir de la documentació. És la peça que ja venia del RAG.

### `data`: preguntar a les teves dades

El model escriu consultes de lectura restringides sobre un catàleg curat de les dades del negoci. Només el que he decidit exposar, i les dades personals no hi arriben mai. El resultat torna com a taula o gràfic, i el pots fixar al tauler.

### `actions`: el model proposa, tu decideixes

El model **no executa**. Proposa canvis a través d'un catàleg d'accions que reutilitza els casos d'ús que el producte ja té. La persona veu què passarà i ho aprova. Si l'acció és irreversible, o arriba a molta gent, et demana que confirmis a quantes persones arribarà. I el servidor ho torna a comprovar tot abans d'aplicar res.

## Poques eines genèriques, un catàleg que creix

El canvi que més pesa és aquest: en lloc d'una eina per funcionalitat, **poques eines genèriques**. Una per consultar, una per proposar una acció, una per cercar documentació. A sobre n'hi ha unes poques d'extra (vistes, formularis, visites guiades, més avall, encara experimentals), però cap lligada a una funcionalitat concreta. El que creix és el catàleg que hi ha darrere, no la llista d'eines que el model veu.

Afegir una funcionalitat a l'assistent ja no vol dir tocar el prompt ni inflar el context. Vol dir descriure-la al catàleg.

I una cosa que no esperava: els models econòmics van tornar a ser prou bons. Hi ha dues raons. La primera és que aquest any els models han avançat moltíssim: un model petit d'ara és molt més capaç que un de gran d'abans, i fa molt més que generar text (només cal comparar Sonnet 3.5 amb Sonnet 5.5, o amb GPT-Luna). La segona és que ara tenen una superfície petita i ben descrita, i triar entre tres coses és molt més fàcil que triar entre trenta.

Per saber-ho amb certesa, no vaig confiar en la intuïció. Vaig muntar avaluacions amb el vocabulari de cada tipus de negoci (un club no parla com una gestoria) i vaig comparar models amb les mateixes preguntes. Quan canvio el prompt, el catàleg o el model, ho sé per una mesura i no per una sensació.

I per poder fiar-me del backend que hi ha sota, hi he aplicat el que explico a [Cobertura no és verificació](/blog/cobertura-no-es-verificacio): mutation testing sobre el codi que l'assistent acaba executant. Una acció que un model proposa i una persona aprova ha de fer exactament el que diu.

## El que he construït a sobre

Un cop la base era sòlida, van sortir altres coses gairebé de franc. Són experimentals i les tinc en test A/B, així que no les presento com a acabades.

**UI generada, ara sí.** El model ja no escriu HTML. Emet una especificació de vista amb tipus i amb una llista tancada de components, i les dades hi van lligades per referència. El servidor la valida abans que arribi a ningú. La interfície sempre és del producte, i les xifres sempre són de la dada.

**Guia dins del backoffice.** L'assistent sap en quina pantalla ets. Pot **omplir un formulari prèviament** perquè el revisis, i mai l'envia. I pot fer **visites guiades** pas a pas, els passos de les quals viuen a la documentació. Així la documentació i les visites s'escriuen una sola vegada, no dues.

**Copilot i documentació alhora.** La mateixa conversa pot respondre «com es fa això?» i ajudar-te a fer-ho, sense canviar d'eina.

## Extra: el teu agent, els mateixos permisos

Hi ha una derivada que m'agrada molt. Les persones que gestionen un negoci ja tenen el seu assistent de confiança: Claude, ChatGPT, Cursor. Per què haurien d'obrir un altre xat?

Amb MCP i OAuth, aquests assistents es connecten a Goil i arriben a les **mateixes capacitats**, amb els **mateixos permisos** i les **mateixes aprovacions**. No hi ha una porta del darrere ni un nivell de confiança diferent. Si no ho podries fer al backoffice, el teu agent tampoc ho pot fer.

## El que he après

- **Poques eines genèriques guanyen a moltes d'específiques.** El catàleg ha de créixer; la llista d'eines, no.
- **El model proposa, les persones decideixen.** I el servidor ho torna a comprovar, perquè no es pot confiar només en el que ha vist la persona.
- **L'estructura va als catàlegs i als contractes, no als prompts.** Un prompt es llegeix, un contracte es valida.
- **Avaluacions abans que sensacions.** Si no pots mesurar si un canvi va millor, no ho saps.
- **Reutilitza el producte, no el dupliquis.** Una API paral·lela per a l'agent és deute des del primer dia.

## I ara què

Encara queda feina. M'interessa que l'assistent sigui proactiu i no només reactiu: resums que t'arribin sense que els demanis. I més pantalles i més visites guiades, que és on es nota més que l'assistent sap on ets.

Però la base ja no em preocupa.
