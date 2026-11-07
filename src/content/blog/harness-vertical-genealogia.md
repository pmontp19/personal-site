---
tags: [agents-ia, enginyeria]
title: "Les regles que els agents no es poden saltar: el harness vertical de la meva genealogia"
description: "Un tuit em va donar el nom (harness vertical) i un altre el criteri (la piràmide invertida). Com vaig convertir en barreres les regles en prosa del projecte de genealogia, per què les barreres també s'han de provar, i què vaig aprendre quan vaig deixar els agents sols dies seguits."
date: 2026-11-04
draft: false
hairline:
  name: piramide
  alt: "Quatre lloses apilades en piràmide invertida: a dalt la més ampla, el codi, que és l'única ressaltada; cada capa per sota és més estreta, fins a la punta de baix, la revisió humana."
---

Al post de [gedlint](/blog/gedlint) vaig deixar escrita una frase que no he deixat de rumiar: el pitjor mode de fallada d'un gate és un build verd que no ha validat res. Parlava d'un linter, però el problema és més gran.

El projecte de genealogia té agents que treballen dies seguits, gairebé desatesos, i al darrere un munt de regles apreses a cops: com es numeren les sessions, quants agents poden consultar alhora l'arxiu diocesà, quina prova cal per afirmar una dada. Cada regla neix d'un incident real. Però on viuen? En markdown, i una regla en markdown és una petició. El linter en fa complir una part; la resta confia que l'agent ho llegirà, ho entendrà i ho obeirà.

Fa unes setmanes van coincidir dues lectures que em van donar les paraules per a això. La primera, un [tuit de Greg Isenberg](https://x.com/gregisenberg/status/2110414696037716372) que tradueixo:

> Els harnesses d'agents són els nous GPT wrappers, però en el bon sentit, sobretot els verticals. Els millors equips tracten el model com una peça intercanviable i assignen un model diferent a cada feina. Fan servir prompts portables en comptes de fine-tuning, i fan A/B testing sobre el que els usuaris fan amb la sortida: l'editen, l'exporten, la comparteixen? Un harness vertical és bàsicament quatre coses: els connectors per a les dades d'aquella indústria, els evals escrits per gent que en sap de l'ofici, les regles sobre què l'agent pot tocar i què no, i una pantalla neta perquè un humà ho revisi. El model és, com a molt, un 20% de tot plegat.

La segona, un [tuit de @poteto](https://x.com/poteto/status/2111133080526495985) amb una idea senzilla: si vols confiar en la feina dels agents, inverteix la piràmide. Més esforç a dalt de tot, al codi, i el mínim a la revisió humana. Les dues juntes diuen una cosa que el repo ja intentava fer sense saber-ho: un harness vertical és el lloc on les regles deixen de ser peticions i es converteixen en barreres, perquè l'agent pugui treballar sol de debò.

**En resum**

- Un harness és la bastida al voltant d'un model: el bucle, les eines, el context, els guardrails. Els verticals hi afegeixen quatre peces: connectors, evals d'experts, regles de permisos i una pantalla de revisió.
- El criteri per decidir què va on és la piràmide invertida: primer codi que fa impossible el camí incorrecte, després anàlisi estàtica, prosa només per al mínim, i la revisió humana al final.
- Les regles que vivien al codi no han tornat a fallar; les que només eren prosa, sí.
- Les barreres també són codi, i el codi falla. Les meves fallaven, i cap fallada la va veure qui l'havia escrita.
- El model és una peça intercanviable, però només ho saps si tens evals per tasca.
- Quan vaig deixar els agents sols, el que més els frenava era una regla meva.

## El terme i el debat

El terme el va consolidar Anthropic quan va reanomenar el Claude Code SDK com a Claude Agent SDK: "el harness d'agent que impulsa Claude Code pot impulsar molts altres tipus d'agents". L'agent és el comportament emergent; el harness, la maquinària que el produeix.

El debat interessant és si aquesta maquinària ha de ser generalista o vertical. L'argument en contra dels verticals és la lliçó amarga de sempre: cada component d'un harness codifica una suposició sobre què el model no sap fer sol, i aquestes suposicions caduquen a cada generació de models.

Però l'evidència també apunta en l'altre sentit. Canviar només la infraestructura que envolta el model, amb els mateixos pesos, va fer saltar LangChain del top 30 al top 5 de Terminal Bench 2.0. I Harvey, al sector legal, ha multiplicat per cinc la seva valoració integrant advocats en l'enginyeria i en l'avaluació. La frase que més m'ha servit és de Prithvi Rajasekaran, a l'[enginyeria d'Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps): "l'espai de combinacions interessants de harness no s'encongeix quan milloren els models; es mou". Un component de harness val la pena quan la tasca supera el que el model fa sol de manera fiable, i això canvia a cada model.

## Les quatre peces contra el meu repo

El repo de genealogia no va néixer d'aquest marc, però hi encaixa amb una precisió una mica incòmoda:

| Element | Al meu repo | Com era a mitjan octubre |
|---|---|---|
| Connectors de dades | Validador i editor de l'arbre, descarregador de l'arxiu diocesà, índexs i cerques | Fort: eines pròpies amb regles de cost apreses a cop sec |
| Evals d'experts | El linter al CI, nivells de prova per integrar qualsevol troballa | Fort en estructura, feble en conducta: validaven l'arbre, no la feina de llegir |
| Regles de permisos | Un document que deia "mai toquis el fitxer de l'arbre a mà" | Mitjà: confiança i verificació a posteriori, cap frontera real |
| Pantalla de revisió | Un estat de la recerca en markdown que era un mur de text | El més feble: la revisió hi era per accident |

Els nivells de prova diuen que un índex mai confirma res, que una imatge de l'acta llegida sí, i que dues fonts independents tanquen una línia. Rellegit ara, és literalment un eval de domini escrit per algú que sap de l'ofici.

La taula diu on era fort, però no per què. Això m'ho va respondre la piràmide.

## La piràmide invertida

El tuit plantejava quatre capes, de més a menys esforç:

1. **Codi.** Millores que eliminin categories senceres de problemes. Els agents agafen el camí més curt, així que fes que el camí fàcil sigui el correcte.
2. **Anàlisi estàtica.** Linters, tests, CI.
3. **Prosa.** Regles, instruccions, skills, el mínim indispensable.
4. **Revisió humana.** La que menys escala, al final de tot.

<figure style="margin:1.5rem 0">
<svg viewBox="0 0 640 380" role="img" aria-labelledby="piramide-esquema" style="width:100%;height:auto;font-family:var(--mono);font-size:15px">
<title id="piramide-esquema">La piràmide invertida: quatre capes, de més a menys esforç. A dalt i ampla, el codi; després l'anàlisi estàtica; la prosa, el mínim; i a la punta de baix, la revisió humana.</title>
<g fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--muted)">
<polygon points="58,48 582,48 320,356" vector-effect="non-scaling-stroke"/>
<line x1="123.5" y1="125" x2="516.5" y2="125" vector-effect="non-scaling-stroke"/>
<line x1="189" y1="202" x2="451" y2="202" vector-effect="non-scaling-stroke"/>
<line x1="254.5" y1="279" x2="385.5" y2="279" vector-effect="non-scaling-stroke"/>
<line x1="612" y1="352" x2="612" y2="58" stroke-dasharray="2 6" vector-effect="non-scaling-stroke"/>
<polygon points="612,48 605,64 619,64"/>
</g>
<g fill="currentColor" style="color:var(--muted)" text-anchor="middle">
<text x="320" y="96">codi</text>
<text x="320" y="173">anàlisi estàtica</text>
<text x="320" y="250">prosa</text>
<text x="320" y="314" font-size="13">revisió</text>
<text x="320" y="329" font-size="13">humana</text>
<text x="636" y="40" text-anchor="end" font-size="12">més esforç</text>
<text x="636" y="372" text-anchor="end" font-size="12">menys escala</text>
</g>
</svg>
</figure>

Vaig demanar a un agent que revisés el harness amb aquest criteri, contrastant l'historial del repo amb la taula d'incidents on cada regla té al costat l'incident que la va fer néixer. El patró era net: quan la regla vivia al codi, el problema no tornava; quan només vivia en prosa, tornava una vegada i una altra.

## De prosa a barrera

Vaig recórrer la piràmide de dalt a baix.

**Codi.** L'agent ja no editava l'arbre a mà, només amb operacions que verifiquen la integritat abans d'escriure. Vaig aplicar la mateixa idea a regles que només eren prosa: una eina que calcula i reserva el número de sessió, un bloqueig perquè només un agent consulti l'arxiu alhora, lots de lectura amb mida màxima, i una porta de tancament que no accepta cap tasca sense la prova adjunta.

**Anàlisi estàtica.** Vaig activar al linter les regles biològiques (edats de vida, de pares, distància entre germans) que tenia escrites però apagades. I la llista de coses que una sessió ha de complir abans de tancar es va convertir en una ordre que corre a cada push i a cada PR.

**Permisos.** Editar l'arbre a mà, denegat; pujar a main, pregunta. I després, agents per rol: un lector i un verificador que només poden llegir.

**Prosa, el mínim i provada.** Hi ha coneixement que no es pot codificar, com quina estratègia toca davant un cognom que canvia. Això continua en prosa, però ara amb evals: casos amb la resposta esperada, un runner que els passa pel harness complet i un model que fa de jutge. Quan un eval va fallar, la meitat de les vegades fallava l'eval: el model havia vist que la pregunta ja estava resolta i va contestar la que tocava. La prosa, a més, s'ha d'aprimar: cada línia que sobra és context que l'agent llegeix a cada sessió i una ocasió més de contradir el codi.

**L'humà, una pantalla suficient.** Un tauler generat des del repo, pensat per al mòbil: què està encallat i per què, quines decisions m'esperen, si el bucle està treballant. I una regla que ho lliga tot: l'usuari no està dins del bucle, i el missatge de l'agent ha de bastar per entendre què s'ha fet i per què, sense codis interns.

També vaig descartar una barrera després de provar-la. Una barrera amb massa falsos positius s'acaba apagant, i llavors no serveix de res.

## Les barreres també són codi

Aquí hi ha el que més m'ha ensenyat. El hook que havia de protegir l'arbre rebutjava tots els commits que el tocaven, bons i dolents, per una cometa mal posada. Era així des del primer dia. Els agents se l'havien saltat i cap no ho va dir. Un control que ningú prova no protegeix res: ensenya als agents a saltar-se'l.

Ho vaig arreglar i vaig passar un revisor independent, amb instruccions de refutar en lloc de confirmar. Va trobar que l'arranjament continuava fallant sobre l'arbre real, perquè els tests només feien servir arbres sintètics, i una colla de forats més, inclosos dos de seguretat al tauler. També em va corregir un recompte: moltes de les meves "barreres" eren eines que fan fàcil el camí correcte, però que res no obliga a fer servir. De 26 regles, només 7 les feia complir el codi.

Una setmana després va passar el mateix amb una barrera nova, contra persones duplicades a l'arbre. Un model d'un altre laboratori la va declarar no fiable per a producció; un segon revisor va trobar un duplicat real que s'escapava de totes les comprovacions. Al final, part d'aquella feina va acabar dins de gedlint, per a qualsevol arbre.

Dues barreres, la mateixa lliçó: qui escriu la barrera no és qui la pot validar.

## El model, una peça intercanviable (si ho pots mesurar)

Isenberg deia que els bons equips assignen un model diferent a cada feina. Jo ho feia per intuïció; ara ho faig amb evals, i els resultats no eren els que esperava.

En estratègia de recerca, diversos models gratuïts encerten tant com el de pagament. Llegint premsa impresa, també. Però llegint actes manuscrites del segle XVIII el panorama canvia del tot: els gratuïts gairebé no en llegeixen cap bé, el meu model habitual en llegeix la meitat, i el millor, totes. En estratègia, el model és potser aquell 20%; llegint manuscrits, és gairebé tot.

I l'eval de lectura va fer una cosa que no li demanava. En transcriure jo mateix les respostes correctes, vaig trobar errors a l'arbre: dades validades, amb la imatge citada, que un agent havia llegit malament i ningú havia revisat. Ara cap lectura d'un sol lector entra a l'arbre sense un verificador independent.

## La regla que feia parar l'agent

Fins aquí, tot anava d'impedir que l'agent fes coses incorrectes. Quan vaig mesurar com treballava de veritat, el problema era el contrari.

En una sessió de més de quatre dies, l'agent havia passat més de la meitat del temps parat, esperant que jo escrivís "continua". No era el model: el protocol deia, en prosa, que parés després de cada tres tasques, i l'agent obeïa.

Ara el bucle només s'atura per motius explícits (no queda feina, cal una decisió meva, un recurs ha caigut), un plugin el reenganxa si para sense motiu i para si fa voltes sense avançar, i una eina mesura quantes hores treballa i quantes espera. Sense mesurar, el meu harness optimitzava que l'agent no s'equivoqués i ignorava que treballés. Una regla de "para i pregunta" també és una barrera.

L'altra part del fre era més prosaica: el meu harness vertical corre dins d'un de generalista, i les manies d'aquell també són meves. Formats d'imatge que feien petar les peticions, permisos que demanaven confirmació a ningú. Són exactament els components que caducaran amb la propera versió, però mentre hi són costen hores, i només els veus si algú es pregunta per què el bucle s'ha aturat.

## Què m'emporto

Per deixar treballar agents sols calen quatre coses, i totes són feina de dalt de la piràmide.

**Barreres, no peticions.** Si una regla importa, que la faci complir el codi. La prosa es queda per al coneixement que no es pot codificar, i aquesta també té evals.

**Barreres provades, per algú altre.** El codi d'una barrera necessita el seu test i el seu revisor, sobre dades reals. Una regla escrita és una petició; un hook sense test és una regla escrita amb pretensions.

**Una pantalla suficient, i saber què no veu.** L'esforç humà no ha d'anar a llegir cada PR, sinó a dissenyar l'entorn perquè l'agent faci el correcte per defecte.

**Mesurar l'autonomia, no suposar-la.** Les regles que frenen l'agent també són regles, i sense dades no les veus.

La regla de decisió que en trauria: especialitza el harness on la tasca està més enllà del que el model fa sol, i poda la resta a cada model nou. Les tècniques concretes caduquen. L'única peça que es fa més forta amb cada model que surt és l'eval, perquè cada model nou és una passada gratis contra el teu criteri. Els actius més duradors del meu repo no són tècnics sinó epistèmics: el registre de cerques sense resultat, els nivells de prova, la font oral documentada. Gent que sap de l'ofici escrivint els criteris amb què es jutja la feina. El model arriba i passa; el criteri es queda.
