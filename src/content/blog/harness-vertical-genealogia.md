---
title: "El model només és el 20%: la meva genealogia com a harness vertical"
description: "Un passatge d'un butlletí va posar paraules al que feia temps que sospitava: els millors projectes amb agents no escullen models, munten harnesses verticals. Què en diu el mercat i què he canviat avui mateix al projecte de genealogia per seguir-lo."
date: 2026-10-16
draft: true
---

Avui he llegit un passatge que explicava una cosa que feia temps que em passava per davant sense tenir-ne el nom: els millors equips que treballen amb agents no aposten per un model, aposten per un *harness*. El passatge era d'un butlletí, sense firma, i el tradueixo:

> Els harnesses d'agents són els nous GPT wrappers, però en el bon sentit, sobretot els verticals. Els millors equips tracten el model com una peça intercanviable i enrutin models diferents a feines diferents. Fan servir prompts portables en comptes de fine-tuning, i fan A/B testing sobre el que els usuaris fan amb la sortida: l'editen, l'exporten, la comparteixen? Un harness vertical és bàsicament quatre coses: els connectors per a les dades d'aquella indústria, els evals escrits per gent que en sap del ofici, les regles sobre què l'agent pot tocar i què no, i una pantalla neta perquè un humà ho revisi. El model és, si més no, un 20% de tot plegat.

Un harness vertical. Quatre peces. El model intercanviable. Ho he llegit dues vegades i m'he adonat que el projecte de genealogia, del que ja he parlat [aquí](/blog/myheritage-agents-autonoms) i [aquí](/blog/gedlint), ja era això sense tenir-ne el nom. Aquest post és el de la capa que engloba totes les altres.

**En resum**

- Un harness és la bastida al voltant d'un model: el bucle, les eines, la gestió de context, els guardrails. Claude Code, Cursor, Devin: harnesss.
- El debat generalistes contra verticals no es tanca, però les xifres del mercat (Harvey, Cursor, Sierra) i dels benchmarks (canviar el harness sense tocar el model va fer saltar un equip del top 30 al top 5 de TerminalBench) ja han votat.
- El meu repo de genealogia tenia dues de les quatre peces fortes i dues de precàries. Avui les he arreglat: llindars del linter actius, el GEDCOM protegit per un hook, permisos al harness, evals conductuals amb un model com a jutge, i una pantalla de revisió.
- La lliçó que m'emporto: dels quatre elements, els evals són l'únic actiu que no caduca amb el model nou. I el model nou sempre arriba.

## El terme i el debat

El terme el va consolidar Anthropic quan va renomenar el Claude Code SDK com a Claude Agent SDK: "el harness d'agent que impulsa Claude Code pot impulsar molts altres tipus d'agents". La definició és seca: l'agent és el comportament emergent, el harness és la maquinària que el produeix. Un LLM cru és una CPU sense res al voltant: el context és la RAM, les eines els perifèrics, i el harness el sistema operatiu.

El debat interessant és si aquesta maquinària ha de ser generalista o vertical. L'argument en contra dels verticals és la lliçó amarga de sempre: cada component d'un harness codifica una suposició sobre què el model no sap fer sol, i aquestes suposicions caduquen a cada generació de models. Tècniques que al setembre eren enginyeria ara són pes mort. Manus va reescriure el seu framework cinc vegades en sis mesos, cada cop traient complexitat.

Però l'evidència empírica també és contundent en l'altre sentit: canviar només la infraestructura que envolta el model, amb els mateixos pesos, va fer saltar un equip de fora del top 30 al top 5 de TerminalBench. I el mercat: Harvey (legal) ha passat de 3.000 a 15.500 milions de dòlars de valoració en 19 mesos contractant exadvocats per escriure els criteris amb què es jutja la feina. La síntesi d'Anthropic és la regla més útil que he trobat: els components del harness valen la pena exactament quan la tasca està més enllà del que el model fa de manera fiable en solitari, i "l'espai de combinacions interessants de harness no s'encongeix quan milloren els models: es mou".

## Les quatre peces contra el meu repo

El repo de genealogia no va néixer d'aquest marc, però hi encaixa amb una precisió una mica incòmode. L'he auditat peça a peça:

| Element | Al meu repo | Com era |
|---|---|---|
| Connectors de dades | Validador i editor del GEDCOM, descarregador de l'arxiu diocesà amb límits d'ús respectats, índexs i cerques | Fort: eines pròpies amb anys de regles de cost apreses a cop secs |
| Evals d'experts | El linter al CI amb ratchet, nivells de prova T0/T1/T2 per integrar qualsevol troballa | Fort en estructura, feble en conducta: validaven l'arbre, no la feina de llegir |
| Regles de permisos | Un document de convencions que deia "mai toquis el fitxer de l'arbre a mà" | Mitjà: confiança i verificació a posteriori, cap frontera real |
| Pantalla de revisió | Un estat de la recerca en markdown que era un mur de text | El més feble: la revisió hi era per accident |

T0, T1 i T2 són els meus nivells de prova: un índex mai confirma res, una imatge llegida sí, i dues fonts independents tanquen una línia. Rellegint-lo, és literalment un eval de domini escrit per algú que sap del ofici: l'equivalent genealògic del que Harvey paga els exadvocats per fer.

## Un dia de harness

Amb el marc a la taula, les peces febles es van arreglar en una tarda:

**Els llindars del linter, actius.** La configuració tenia la secció de llindars biològics escrita però comentada: edat màxima de vida, edat mínima de pares, finestra entre germans. Activada, els 522 diagnòstics que l'arbre ja arrossegava han anat al baseline i el ratchet fa la seva feina: el build només falla amb violacions noves. El que era documentació és una barrera.

**El fitxer de l'arbre, protegit.** Un hook de git que rebutja el commit si l'edició deixa errors d'integritat o línies massa llargues. La regla "un sol escriptor del fitxer" ha passat de prosa a enforcement: pots desobeir-la, però el commit no passa.

**Permisos al harness.** La configuració dels agents ara té regles: editar l'arbre a mà, denegat; pujar a main, pregunta; forçar la pujada, denegat. Els incidents de seguretat d'agents que s'han fet públics aquest mes són fallades de frontera, no de capacitat.

**Evals conductuals.** Aquest és el que em fa més il·lusió. La skill d'estratègia del projecte ja tenia sis casos d'exemple amb la resposta esperada, però ningú els executava mai. Ara tenen un runner: cada cas es passa pel harness complet, amb el repo com a context, i es puntua. Primer baseline: 4 de 6.

I dos dels sis fallats ensenyen més que els sis aprovats. Un fallava per literalitat de la rúbrica (el model deia "agnatícia" i l'eval buscava "patrilineal"). L'altre és or: l'eval demanava com desbloquejar l'origen d'una besàvia, i el model va llegir l'estat de la recerca, va veure que aquesta qüestió ja estava resolta amb fonts des de fa dies, i va redirigir la resposta cap al bloqueig real. L'eval era vell; el model, correcte. Quan un eval falla, la primera pregunta és si falla l'eval.

Per acabar-ho d'arrodonir: model com a jutge. La rúbrica de paraules clau és barata però literal, així que una segona crida avalua la resposta contra el criteri d'expert, amb permís explícit per premiar qui detecta que la pregunta està desactualitzada. Jutge diferent del generador, sortida en JSON, veredicte en una taula.

**La pantalla.** Un tauler HTML generat des de les fonts vives del repo: la cua de treball amb el que està encallat i per què, l'estat de les comprovacions, els murs de pedra documentals i la cobertura de cada branca. I una regla nova al document d'instruccions que ho lliga tot: l'usuari no està dins del bucle. El que veu dels agents és només el missatge, i ha de bastar: què s'està fent i per què, els codis interns traduïts, i la part humana al final. Ni un W713 sols a cap missatge.

## Què m'emporto

La regla de decisió que jo en trauria: especialitza el harness exactament on la tasca està més enllà del que el model fa sol, i poda la resta a cada model nou. Tècniques concretes caduquen; el que queda estructuralment fora del model és precisament això: connectors, evals, fronteres i pantalla.

I la ironia final. De les quatre peces, l'única que es fa més forta amb cada model que surt és l'eval, perquè cada model nou és una passada gratis contra el teu criteri. Els actius més duradors del meu repo no són tècnics sinó epistèmics: el registre de cerques tancades sense resultat, la font oral documentada, els nivells de prova. Gent que sap del ofici escrivint els criteris amb què es jutja la feina. El mateix que monetitzen Harvey i els seus. El model arriba i passa; el criteri es queda.

El flux de feina d'aquest projecte (worktrees, sessions paral·leles, revisió) el vaig explicar a [Com programo ara](/blog/com-programo-ara), i la filosofia de verificació, a [Cobertura no és verificació](/blog/cobertura-no-es-verificacio).
