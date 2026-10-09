---
title: "craftr: el producte que funcionava i que ningú podia fer servir"
description: "Vaig construir el Lightroom dels usuaris de Cricut en quatre setmanes amb agents de codi. Tècnicament és excel·lent. La visió tenia un forat que cap refactor tapa: el que entra a Cricut Design Space no en torna a sortir."
date: 2026-10-09
draft: true
hairline:
  name: prestatge
  alt: "Un classificador de fulls amb dissenys a cada ranura i, al costat, una caixa tancada amb pestell: els fulls del classificador surten quan hi passes el punter, la caixa no s'obre i no en surt res."
---

Fa sis mesos vaig tenir per primera vegada un producte propi a punt per llançar. Funcionava, la usabilitat era bona, Stripe connectat, domini reservat. I un bon dia em vaig aturar a pensar en el primer pas que faria qualsevol usuari nou: «puja la teva biblioteca de dissenys». Com? Des d'on? Cricut Design Space no et deixa treure res. El que entra, no en surt.

Aquest és el postmortem de [craftr](https://usecraftr.com): un mes de feina, 162 commits, un producte tècnicament excel·lent amb un defecte que cap refactor arregla. I una lliçó sobre què ha canviat la IA (i què no) a l'hora de construir les teves pròpies eines.

## D'on surt craftr

Faig crafting amb una Cricut, una màquina de retallar que treballa a partir de fitxers vectorials (SVG, DXF). I feia servir [QuiverAI](https://quiver.ai/), un model que genera vectors a partir de text ([en vaig parlar aquí](/blog/quiverai-ai-sdk)). Els dos mons encaixaven massa bé: les màquines de retallar mengen SVG, i la IA ja sap produir SVG.

Alhora, el moment més feixuc del flux de treball no era dissenyar: era organitzar. La biblioteca de dissenys de Design Space és lenta i engorrosa, i els meus dissenys originals estaven escampats entre l'ordinador i Dropbox. Vaig pensar el que pensa qualsevol que té un mal i sap dirigir agents: això ho puc arreglar. Un gestor personal de biblioteca de dissenys, el Lightroom dels usuaris de Cricut. Per a ús personal, només per a tu i els teus treballs. Primer per a Cricut, després hi afegiria fonts i fitxers de brodat.

També hi havia un argument d'avantatge competitiu: Cricut acabaria copiant-ho a la seva plataforma, però això només donava una finestra de temps. I els agents de codi feien que la finestra fos suficient per construir-ho tot.

## Problemes reals: bundles i llicències

Abans de picar res, vaig passar una estona a Reddit i altres comunitats per veure si el mal era compartit. Ho era, i amb dues cares que jo no patia:

1. **Els bundles de marketplaces.** Compres un paquet a Etsy o Creative Fabrica i reps un ZIP amb dotze fitxers del mateix disseny en quatre formats. Quin fas servir? Aquí craftr detectava duplicats, marcava un fitxer com a principal i la resta com a variants, i et suggeria el format adequat per a la teva màquina (SVG per a Cricut, DXF per a Silhouette).

2. **Les llicències.** Molts usuaris de Cricut són petits negocis que personalitzen productes i els venen a Etsy. Cada disseny comprat porta una llicència (ús personal, comercial, print-on-demand) que ningú registra, i un dia arriba la carta. craftr guardava l'origen, el tipus de llicència, una matriu de drets i la captura de la llicència com a prova.

## Què vaig construir

Vaig treballar amb agents guiats per mi i en quatre setmanes (del 3 al 31 de març) el projecte va acumular 162 commits. El que en va sortir:

- Un gestor web ràpid: cache agressiva i feina pesant en cues asíncrones perquè la navegació voli.
- Visors especialitzats per a il·lustracions vectorials, amb separació per capes i colors.
- Reconeixement intel·ligent del contingut i categories intel·ligents.
- Importació de ZIP de bundles amb detecció de duplicats i rol per a cada fitxer.
- Registre de llicències amb origen, tipus i prova.
- Generació de dissenys amb QuiverAI, amb streaming del SVG en directe.
- Tot el de sota: Next.js, Drizzle, Postgres amb seguretat per fila, autenticació pròpia, disseny propi i Stripe cobrant subscripcions Pro.

El resultat, tant tècnic com d'usabilitat, em sembla excel·lent. Fins i tot vam fer un passi de go-to-market: un agent analitzava canals i em deia que, amb tracció als fòrums i comunitats, ens faríem rics ràpidament. Els agents són optimistes. Els jardins tancats, no.

## El detall que no vaig tenir en compte

La promesa de craftr era «tota la teva biblioteca en un lloc». Però perquè hi arribi, l'usuari ha de poder portar-hi els seus dissenys. Els que tens en fitxers, perfecte: els ZIP dels bundles, els SVG comprats, els teus originals de Dropbox, tot això s'importa. El problema és que bona part del flux de treball d'un usuari de Cricut passa dins Design Space, i allà cada disseny que puges queda presoner: no hi ha exportació, ni massiva ni individual, ni cap API, ni cap altra via que un usuari normal pugui fer servir.

La metàfora de Lightroom es trencava al primer pas. Un fotògraf pot importar el seu catàleg de mil fotos a qualsevol programa nou. Un usuari de Cricut no pot moure la seva biblioteca enlloc. Potser fins i tot això xoca amb alguna normativa europea d'interoperabilitat; no ho sé, no hi he aprofundit. Intentar-ho per la porta del darrere tampoc és una opció: Cricut té fama d'emprendre accions legals per enginyeria inversa del seu maquinari i programari. El que sé és que la frase «ho descarregaré tot i ho posaré a la plataforma nova» és impossible de dir a un usuari de Cricut.

Aquell dia vaig aparcar el projecte.

## Construir ja no és el coll d'ampolla

La tesi que volia provar amb aquest projecte es manté intacta, fins i tot reforçada: la IA està democratitzant el desenvolupament d'eines. Qui té un problema sap millor que ningú què necessita, i per primer cop es pot construir l'eina a mida sense equip, sense finançament i sense mesos de feina. Jo sol, dirigint agents, vaig muntar en un mes infraestructura de producció amb pagaments, seguretat i un disseny que m'enorgulleix. Fa cinc anys això era un equip i un trimestre. Ara és un mes i una subscripció.

El que la IA no canvia és l'altra meitat de l'equació: conèixer el domini. I el domini inclou les regles de l'ecosistema: els formats, les migracions i, sobretot, els jardins tancats. Els agents executen les teves suposicions amb una excel·lència impressionant. També les equivocades. El meu agent de go-to-market projectava tracció, no dubtes: els agents no et fan la validació, te la multipliquen.

Vaig validar que el dolor era real, però no que la solució fos viable. Si ho refés, la primera setmana no hi hauria codi: buscaria «export library from Cricut Design Space» i llegiria què diuen les comunitats d'usuaris abans d'escriure la primera línia. Construir és tan barat ara que la validació és l'única cosa cara que et queda.

## On queda tot plegat

Aparcat, amb Stripe a punt i beta testers a mig reclutar. Però no enterrat: dues portes han quedat obertes.

La primera és la comunitat d'impressió 3D, que més d'una conversa m'ha suggerit. El dolor és el mateix (una biblioteca de fitxers STL ingovernable), però l'ecosistema és l'oposat: formats oberts, fitxers al teu disc, res a veure amb jardins tancats. La segona és el fil que vaig detectar investigant els petits negocis: el seu mal real és més de CRM que de gestió de fitxers. Projectes per client, cobrat o no cobrat, llicències per saber què pots revendre.

De moment, craftr em serveix de demostració: les eines ja les podem fer tots. El que continua sent difícil, i continua sent cosa nostra, és saber què cal fer.
