---
title: "craftr: el producte que funcionava i que ningú podia omplir"
description: "Vaig construir el Lightroom dels usuaris de Cricut en quatre setmanes amb agents de codi. Funcionava. La visió tenia un forat que cap refactor tapa: per a la majoria d'usuaris, la biblioteca real és la de Cricut Design Space, i d'allà no en surt res."
date: 2026-10-09
draft: true
hairline:
  name: prestatge
  alt: "Un classificador obert ple de fulls amb dissenys, al costat d'una caixa tancada amb pestell."
---

Fa sis mesos vaig tenir per primera vegada un producte propi a punt per llançar. Funcionava, la usabilitat era bona, Stripe connectat, domini reservat. I un bon dia em vaig aturar a pensar en el primer pas que faria qualsevol usuari nou: «puja la teva biblioteca de dissenys». Com? Des d'on? Per a la majoria d'usuaris de Cricut, la biblioteca real és la de Design Space, i aquesta no es mou.

Aquest és el postmortem de [craftr](https://usecraftr.com): un mes de feina, 162 commits, un producte que funcionava amb un defecte que cap refactor arregla. I una lliçó sobre què ha canviat la IA (i què no) a l'hora de construir les teves pròpies eines.

## D'on surt craftr

Faig manualitats amb una Cricut, una màquina de retallar que treballa a partir de fitxers vectorials (SVG, DXF). I feia servir [QuiverAI](https://quiver.ai/), un model que genera vectors a partir de text ([en vaig parlar aquí](/blog/quiverai-ai-sdk)). Els dos mons encaixaven massa bé: les màquines de retallar mengen SVG, i la IA ja sap produir SVG.

Per tallar amb una Cricut passes obligatòriament per Design Space, el programari de la marca: hi puges el fitxer, l'ajustes i l'envies a la màquina. Molts usuaris no guarden l'original, i el disseny viu només allà, igual que els que compren dins la mateixa plataforma.

Alhora, el moment més feixuc del flux de treball no era dissenyar: era organitzar. La biblioteca de dissenys de Design Space és lenta i farragosa, i els meus dissenys originals estaven escampats entre l'ordinador i Dropbox. Vaig pensar el que pensa qualsevol que té un mal i sap dirigir agents: això ho puc arreglar. Un gestor de biblioteca de dissenys, el Lightroom dels usuaris de Cricut. Una biblioteca individual, sense equips, pensada també per a qui en viu. Primer per a Cricut, després hi afegiria fonts i fitxers de brodat.

També sabia que, si funcionava, Cricut ho acabaria copiant a la seva plataforma. Això em donava una finestra de temps, i amb agents de codi n'hi havia prou amb aquesta finestra per construir-ho tot.

## Problemes reals: bundles i llicències

Abans de picar res, vaig passar una estona a Reddit i altres comunitats per veure si el problema era compartit. Ho era, i amb dues cares que jo no patia:

1. **Els bundles de marketplaces.** Compres un paquet a Etsy o Creative Fabrica i reps un ZIP amb dotze fitxers del mateix disseny en quatre formats. Quin fas servir? Aquí craftr detectava duplicats, triava un fitxer com a principal i la resta com a variants, i et suggeria el format adequat per a la teva màquina (SVG per a Cricut, DXF per a Silhouette, l'altra gran marca de màquines de tall).

2. **Les llicències.** Molts usuaris de Cricut són petits negocis que personalitzen productes i els venen a Etsy. Cada disseny comprat porta una llicència (ús personal, comercial, print-on-demand) que ningú registra, i un dia arriba una reclamació per drets d'autor. craftr guardava l'origen, el tipus de llicència, una matriu de drets i la captura de la llicència com a prova.

## Què vaig construir

Vaig dirigir agents de codi i en quatre setmanes (del 3 al 31 de març) el projecte va acumular 162 commits. El que en va sortir:

- Un gestor web ràpid: cache agressiva i feina pesant en cues asíncrones perquè la navegació voli.
- Visors especialitzats per a il·lustracions vectorials, amb separació per capes i colors.
- Etiquetatge automàtic del contingut i categories que s'organitzen soles.
- Importació de ZIP de bundles amb detecció de duplicats i rol per a cada fitxer.
- Registre de llicències amb origen, tipus i prova.
- Generació de dissenys amb QuiverAI, amb streaming del SVG en directe.
- I per sota: Next.js, Drizzle, Postgres amb seguretat a nivell de fila (RLS), autenticació pròpia, disseny propi i Stripe cobrant subscripcions Pro.

El resultat, tant tècnic com d'usabilitat, em sembla excel·lent. Fins i tot vaig demanar a un agent una anàlisi de llançament: analitzava canals i em deia que, amb tracció als fòrums i comunitats, em faria ric ràpidament.

## El detall que no vaig tenir en compte

La promesa de craftr era «tota la teva biblioteca en un lloc». Però perquè hi arribi, l'usuari ha de poder portar-hi els seus dissenys. Els que tens en fitxers, perfecte: els ZIP dels bundles, els SVG comprats, els originals que guardes a Dropbox, tot això s'importa. El problema és que, per a la majoria d'usuaris de Cricut, la biblioteca real és la de Design Space, i aquesta no es mou: no hi ha exportació, ni massiva ni individual, ni cap API, ni cap altra via que un usuari normal pugui fer servir. craftr funcionava, però l'usuari típic no tenia amb què omplir-lo.

No ho vaig veure perquè jo era l'excepció: tenia els meus originals a Dropbox. I els problemes dels altres, els bundles i les llicències, els vaig validar amb una biblioteca que no calia rescatar.

La metàfora de Lightroom es trencava al primer pas. Un fotògraf pot importar el seu catàleg de mil fotos a qualsevol programa nou. Un usuari de Cricut no pot moure la seva biblioteca enlloc. Intentar-ho per la porta del darrere tampoc és una opció: les condicions de Cricut prohibeixen l'enginyeria inversa, i no és una batalla per lliurar sol. La frase «ho descarregaré tot i ho posaré a la plataforma nova» és impossible de dir a un usuari de Cricut.

Aquell dia vaig aparcar el projecte.

## Construir ja no és el coll d'ampolla

La tesi que volia provar amb aquest projecte es manté intacta, fins i tot reforçada: la IA està democratitzant el desenvolupament d'eines. Qui té un problema sap millor que ningú què necessita, i per primer cop es pot construir l'eina a mida sense equip, sense finançament i sense mesos de feina. Jo sol, dirigint agents, vaig muntar en un mes infraestructura de producció amb pagaments, seguretat i un disseny propi. Fa cinc anys això era un equip i un trimestre. Ara és un mes i una subscripció a un agent.

El que la IA no canvia és l'altra meitat de l'equació: conèixer el domini. I el domini inclou les regles de l'ecosistema: els formats, les migracions i, sobretot, els jardins tancats. Un agent executa les teves suposicions amb una eficàcia impressionant. També les equivocades. El meu agent de llançament projectava tracció sense cap dubte. Els agents no validen per tu; amplifiquen el que ja creus.

Vaig validar que el problema era real, però no que la solució fos viable. Si ho refés, la primera setmana no hi hauria codi: buscaria «export library from Cricut Design Space» i llegiria què diuen les comunitats d'usuaris abans d'escriure la primera línia. Construir és tan barat ara que la validació és l'única cosa cara que et queda.

## On queda tot plegat

Aparcat, amb Stripe a punt i beta testers a mig reclutar. Però no enterrat: dues portes han quedat obertes.

La primera és la comunitat d'impressió 3D, que m'han suggerit diverses persones. El problema és el mateix (una biblioteca de fitxers STL ingovernable), però l'ecosistema és l'oposat: formats oberts, fitxers al teu disc, res a veure amb jardins tancats. La segona és el fil que vaig detectar investigant els petits negocis: el que de debò els cal s'acosta més a un CRM que a un gestor de fitxers. Projectes per client, cobrat o no cobrat, llicències per saber què pots revendre.

De moment, craftr em serveix de demostració: les eines ja les podem fer tots. El que continua sent difícil, i continua sent feina nostra, és saber què es pot fer abans de fer-ho.
