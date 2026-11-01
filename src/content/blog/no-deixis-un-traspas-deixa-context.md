---
title: "No deixis un traspàs, deixa context"
description: "Quan vaig marxar de Goil, en lloc d'escriure un traspàs vaig deixar que un agent m'entrevistés amb més de cent preguntes i ho contrastés amb el codi. Ara l'equip pot preguntar-li què faria jo. Per què el context i la direcció valen més que un document."
date: 2026-11-01
draft: false
---

El 30 d'octubre va ser el meu últim dia a [Goil](https://goil.app). Quan marxes d'una empresa, toca fer el traspàs. Tots sabem com acaba: un document llarg, escrit a correcuita l'última setmana, que algú obre un cop, hi passa la vista per sobre i no torna a obrir mai més. Quan el necessiten de veritat, sis mesos després, ja no se'n recorden o no hi troben la resposta.

No volia deixar això. Volia deixar una cosa a qui puguin preguntar.

**En resum**

- Un agent em va entrevistar amb més de cent preguntes en divuit rondes: visió, projectes, decisions, tasques en curs, què es trencarà primer.
- Ho va contrastar amb la documentació, el codi i l'estat real de les tasques, i on no quadrava em tornava a preguntar.
- Amb tot això he deixat un agent a qui l'equip pot preguntar quan jo ja no hi soc.

## El problema dels traspassos

Un traspàs clàssic té dos problemes.

El primer és que l'escriu qui marxa, i qui marxa no sap què li preguntaran. Escric el que em sembla important, que acostuma a ser el que tinc més fresc. El que la gent necessitarà d'aquí a tres mesos, el *per què* d'una decisió de fa un any, normalment no hi és.

El segon és que es llegeix com un document. Ningú llegeix quaranta pàgines per si de cas. La gent té un dubte puntual, en un moment puntual, i vol una resposta curta.

Amb els agents passa una cosa semblant. Un agent sense context és com un company nou el primer dia: llest, però sense saber res del que ha passat abans. Pot llegir el codi, però el codi explica què fa una cosa. Per què es va fer així, quines alternatives vam descartar o cap on volíem anar, això no hi surt. Sense això, l'agent endevina. I endevina amb molta seguretat.

## Girar-ho: que l'agent em pregunti a mi

En lloc d'escriure, vaig fer que un agent m'entrevistés.

Primer va llegir la documentació dels projectes i dels productes, els repositoris i les tasques obertes. Amb això va preparar preguntes. Res de genèric com "explica'm el projecte X": preguntava pels forats. Aquí hi ha una branca a mitges, és per acabar o per llençar? Aquesta decisió de fa mesos, per què? Qui ho porta, ara que marxes?

Jo només havia de respondre. Ràpid, informal, com si m'ho preguntés un company al passadís. De vegades una línia. De vegades un paràgraf llarg explicant tot el que havia intentat aquell estiu i per què. De vegades "ni idea, això no és meu, pregunta-ho a qui ho porta".

Després l'agent ho contrastava. Si jo deia que una cosa estava feta i al codi no hi era, tornava a preguntar. Si una resposta no s'entenia, la reformulava a la ronda següent. Un cop li vaig contestar literalment "no entenc la pregunta". La va refer i la vaig poder respondre. La major part de les rondes van caure en dos dies. Després, fins a l'últim dia, anar actualitzant l'estat de les coses a mesura que es tancaven.

El resultat el vaig dictar jo a base de respondre, i queda lligat al que hi ha al codi i a les tasques.

## Què vol dir context

Quan parlo de context no parlo de bolcar-ho tot. Parlo de quatre coses:

- **Per què.** Per què es va fer cada cosa, què vam provar abans i què va fallar. El que no surt al codi.
- **On.** On viu cada cosa i a qui preguntar avui.
- **Com la vaig deixar.** L'estat de cada projecte el dia que vaig marxar, amb data. Sabent que d'aquí a un mes ja no serà veritat.
- **Cap on.** La visió. Què faria jo si continués, com a opinió.

L'últim punt és el que més m'importava. Un traspàs explica el que hi ha. El més valuós que tenia al cap, però, era la direcció: cap on portaria cada producte, quines apostes havíem fet i per què, què em semblava que no calia repetir. Això és el que es perd quan algú marxa, i és el que un agent necessita per poder aconsellar.

## Direcció, no decisions

Una cosa que vaig tenir clara des del principi: l'agent no decideix res.

Si li pregunten "ho fem?", dona context i la meva opinió d'aleshores, i diu qui ho porta ara. Jo ja no hi soc, i no té sentit que una versió meva congelada a l'octubre decideixi per un equip que segueix endavant.

Tampoc sap res de després que marxés. Si li pregunten l'estat actual d'alguna cosa, diu com estava quan vaig marxar i on s'ha de mirar ara. I si no ho té apuntat, ho diu: "això no ho tinc, pregunta-ho a X". Prefereixo mil vegades un "no ho sé" que una resposta inventada amb la meva veu.

Això també és direcció: com s'ha de comportar l'agent, fins on arriba, quan ha de dir que no ho sap. Ho vaig escriure com escriuria les instruccions per a algú que em substitueix uns dies, i ho vaig provar amb el tipus de preguntes que l'equip faria. Sense aquesta part, un agent amb molt de context és perillós: ho sap tot i no sap quan callar.

## On viu

L'equip el té on ja és: el xat on parlem cada dia. Li pregunten com em preguntarien a mi, i respon curt i en primera persona. Algú escriu "què va quedar pendent de l'assistent?" i rep tres o quatre línies: com el vaig deixar, què faria jo a continuació, on mirar l'estat d'avui i a qui preguntar.

Qui treballa amb un agent de programació el pot instal·lar al seu, i aleshores l'agent té el meu context mentre toca el codi: sap per què una cosa és com és abans de canviar-la.

No sé quant de temps el faran servir. Potser unes setmanes, fins que l'equip faci seves les coses que portava. Potser més. També he deixat escrit com desmuntar-lo quan ja no aporti res, perquè no es quedi oblidat fent soroll.

## Què n'he après

**El context no s'escriu, s'extreu.** Si m'haguessin demanat un document, hauria escrit una fracció del que va sortir amb les preguntes. Que algú et pregunti, i et repregunti quan no quadra, treu coses que no sabies que sabies.

**Un agent és tan bo com el context i la direcció que li dones.** Vaig provar una dotzena de models i els bons quedaven a poques dècimes. El que els separava era si tenien el *per què* i si sabien fins on arribar. Ho he anat veient tot l'any, amb [l'assistent del producte](/blog/assistent-ia-goil-capacitats) i amb [com programo ara](/blog/com-programo-ara): la major part de la feina és preparar el context.

**El coneixement d'una persona no hauria de marxar amb ella.** Aquest és un cas petit, d'una persona que marxa. Però el problema és el de qualsevol empresa: el coneixement viu al cap de la gent, i el que està escrit sovint no ho pot fer servir ningú, ni persones ni agents. Si demà hi ha d'haver agents treballant a cada departament, necessitaran el context de l'empresa, no un de genèric. Aquest agent és una prova petita de com podria ser.

L'última setmana a una empresa sol ser per escriure documents que ningú llegirà. Jo vaig dedicar els últims dies a respondre preguntes i deixar-les ben lligades. Crec que ha estat més útil per a tothom, i segur que més divertit.
