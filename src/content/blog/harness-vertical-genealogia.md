---
title: "Les regles que els agents no es poden saltar: el harness vertical de la meva genealogia"
description: "Un tuit em va donar el nom (harness vertical) i un altre el criteri (la piràmide invertida). Com vaig convertir en barreres les regles en prosa del projecte de genealogia, i per què les barreres també s'han de provar."
date: 2026-10-17
draft: true
---

Al post de [gedlint](/blog/gedlint) vaig deixar escrita una frase que no he deixat de rumiar: el pitjor mode de fallada d'un gate és un build verd que no ha validat res. Parlava d'un script del CI que va petar i va acabar amb `success`. Parlava d'un linter, però el problema és més gran.

El projecte de genealogia té agents que treballen hores seguides, gairebé desatesos, i al darrere un munt de regles apreses a cops: el número de sessió es calcula així, a l'arxiu diocesà només hi va un agent alhora, tota afirmació forta porta la imatge de l'acta. Cada regla neix d'un incident real. Però on viuen? En markdown, i una regla en markdown és una petició. El linter i el ratchet en fan complir una part, i la resta confia que l'agent ho llegirà, ho entendrà i ho obeirà.

Aquesta setmana han coincidit dues lectures que m'han donat les paraules per a això. La primera, un [tuit de Greg Isenberg](https://x.com/gregisenberg/status/2110414696037716372) que tradueixo:

> Els harnesses d'agents són els nous GPT wrappers, però en el bon sentit, sobretot els verticals. Els millors equips tracten el model com una peça intercanviable i assignen un model diferent a cada feina. Fan servir prompts portables en comptes de fine-tuning, i fan A/B testing sobre el que els usuaris fan amb la sortida: l'editen, l'exporten, la comparteixen? Un harness vertical és bàsicament quatre coses: els connectors per a les dades d'aquella indústria, els evals escrits per gent que en sap de l'ofici, les regles sobre què l'agent pot tocar i què no, i una pantalla neta perquè un humà ho revisi. El model és, com a molt, un 20% de tot plegat.

La segona, un [tuit de @poteto](https://x.com/poteto/status/2111133080526495985) amb una idea senzilla: si vols confiar en la feina dels agents, inverteix la piràmide. Més esforç a dalt de tot, al codi, i el mínim a la revisió humana. Les dues juntes diuen una cosa que el repo ja intentava fer sense saber-ho: un harness vertical és el lloc on les regles deixen de ser peticions i es converteixen en barreres, perquè l'agent pugui treballar sol de debò.

**En resum**

- Un harness és la bastida al voltant d'un model: el bucle, les eines, la gestió de context, els guardrails. Claude Code, Cursor i Devin en són. Els verticals hi afegeixen quatre peces: connectors, evals d'experts, regles de permisos i una pantalla de revisió.
- El criteri per decidir què va on és la piràmide invertida: codi que fa impossible el camí incorrecte, anàlisi estàtica, prosa només per al mínim, i la revisió humana al final.
- Vaig auditar el repo amb dades (409 commits i la taula d'incidents): les regles que vivien al codi no han tornat a fallar, les que només eren prosa, sí. De 26 regles, 7 les fa complir el codi o el CI, 7 tenen una eina o un control parcial, i 12 encara són prosa.
- Vaig passar a codi cinc regles, vaig posar evals conductuals a la prosa que quedava i una pantalla per a l'humà.
- Les barreres són codi, i el codi falla. El hook que havia de protegir l'arbre rebutjava tots els commits, bons i dolents, i ningú ho havia provat. Un revisor adversarial en va trobar més.
- Per deixar treballar agents sols calen tres coses: barreres, barreres provades i una pantalla suficient. L'eval és l'única peça que millora amb cada model nou.

## El terme i el debat

El terme el va consolidar Anthropic quan va reanomenar el Claude Code SDK com a Claude Agent SDK: "el harness d'agent que impulsa Claude Code pot impulsar molts altres tipus d'agents". La definició és seca: l'agent és el comportament emergent, el harness és la maquinària que el produeix. Un LLM cru és una CPU sense res al voltant: el context és la RAM, les eines els perifèrics, i el harness el sistema operatiu.

El debat interessant és si aquesta maquinària ha de ser generalista o vertical. L'argument en contra dels verticals és la lliçó amarga de sempre: cada component d'un harness codifica una suposició sobre què el model no sap fer sol, i aquestes suposicions caduquen a cada generació de models. Manus va reconstruir el seu framework quatre o cinc vegades, cada cop després de trobar una manera millor de donar forma al context.

Però l'evidència empírica també és contundent en l'altre sentit: canviar només la infraestructura que envolta el model, amb els mateixos pesos, va fer saltar LangChain del top 30 al top 5 de Terminal Bench 2.0 (de 52,8 a 66,5), tocant només el prompt, les eines i un middleware que obliga l'agent a verificar abans de sortir. I el mercat: Harvey (legal) ha passat de 3.000 a 15.500 milions de dòlars de valoració en 19 mesos integrant advocats en l'enginyeria i en l'avaluació, que són els qui jutgen la feina. La frase que més m'ha servit és de Prithvi Rajasekaran, a l'[enginyeria d'Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps): "l'espai de combinacions interessants de harness no s'encongeix quan milloren els models; es mou". La lectura que en faig jo és que un component de harness només val la pena quan la tasca supera el que el model fa de manera fiable en solitari, i que això canvia a cada model.

## Les quatre peces contra el meu repo

El repo de genealogia no va néixer d'aquest marc, però hi encaixa amb una precisió una mica incòmoda. L'he auditat peça a peça:

| Element | Al meu repo | Com era |
|---|---|---|
| Connectors de dades | Validador i editor del GEDCOM, descarregador de l'arxiu diocesà amb límits d'ús respectats, índexs i cerques | Fort: eines pròpies amb anys de regles de cost apreses a cop sec |
| Evals d'experts | El linter al CI amb ratchet, nivells de prova T0/T1/T2 per integrar qualsevol troballa | Fort en estructura, feble en conducta: validaven l'arbre, no la feina de llegir |
| Regles de permisos | Un document de convencions que deia "mai toquis el fitxer de l'arbre a mà" | Mitjà: confiança i verificació a posteriori, cap frontera real |
| Pantalla de revisió | Un estat de la recerca en markdown que era un mur de text | El més feble: la revisió hi era per accident |

T0, T1 i T2 són els meus nivells de prova: un índex mai confirma res, una imatge llegida sí, i dues fonts independents tanquen una línia. Rellegint-lo, és literalment un eval de domini escrit per algú que sap de l'ofici: l'equivalent genealògic d'allò que Harvey demana als advocats que integra a l'avaluació.

La taula diu on era fort, però no per què. Això m'ho va respondre la piràmide.

## La piràmide invertida

El tuit plantejava quatre capes, de més a menys esforç:

1. **Codi.** Millores que eliminin categories senceres de problemes. Els agents copien el que ja existeix i agafen el camí més curt, així que fes que el camí fàcil sigui el correcte.
2. **Anàlisi estàtica.** Linters, tests, CI.
3. **Prosa.** Regles, documents d'instruccions, skills, el mínim indispensable.
4. **Revisió humana.** La que menys escala, al final de tot.

Vaig demanar a un agent que revisés el meu harness amb aquest criteri, i amb dades: els 409 commits del repo i la taula d'incidents que fa mesos que mantinc, on cada regla del projecte té al costat l'incident real que la va fer néixer. El patró era net. Quan la regla vivia al codi (el format de l'arbre, la pausa mínima entre peticions a l'arxiu) el problema no havia tornat. On només vivia en prosa (el número de sessió, la mida dels lots de lectura, "tota afirmació forta porta la imatge de l'acta") tornava una vegada i una altra.

Era el que ja passava amb gedlint sense que jo ho hagués dit així. El linter de l'arbre és la capa 2 d'aquesta piràmide, i funciona perquè no demana res a l'agent: si el commit trenca una regla, el build es posa vermell. Tot el que no passava per allà depenia de la bona voluntat.

## De prosa a barrera

Vaig recórrer la piràmide de dalt a baix.

### Codi: que el camí fàcil sigui el correcte

El precedent ja hi era. Al [primer post](/blog/myheritage-agents-autonoms) explicava que l'agent no edita el GEDCOM a mà: només fa operacions atòmiques que verifiquen la integritat abans d'escriure. Això és el camí fàcil convertit en l'únic camí. Vaig aplicar la mateixa idea a quatre regles que només eren prosa:

- **El número de sessió el calcula una eina** que compta les sessions fusionades i les que estan en curs, i reserva el número pujant la branca de seguida. Hi havia hagut cinc col·lisions, inclòs un dia amb tres "Sessió 17".
- **Un sol agent alhora a l'arxiu diocesà**, amb un bloqueig compartit entre totes les còpies de treball, en lloc d'una frase que diu "màxim un agent".
- **Lots de lectura de 25 pàgines com a màxim**, amb el briefing de cada lot ja escrit. La regla venia d'un subagent que es va penjar gairebé dues hores intentant llegir 176 pàgines d'un sol cop.
- **Tancar una tasca exigeix la prova.** La porta de sortida acceptava qualsevol text. Ara demana la ruta de la imatge de l'acta o l'enllaç a l'arxiu, i comprova que existeix.

### Anàlisi estàtica: el que no es pot saltar sense que es vegi

**Els llindars biològics del linter, actius.** La configuració tenia escrita, però comentada, la secció d'edat màxima de vida, edat mínima de pares i finestra entre germans. Activada, els 522 diagnòstics que l'arbre ja arrossegava han anat al baseline i el ratchet fa la seva feina: el build només falla amb violacions noves. El que era documentació és una barrera.

**Una comprovació d'estat net.** La llista de coses que una sessió ha de complir per tancar era prosa. Ara és una ordre que comprova l'arbre, la cua de treball, tots els tests de les eines, els guions llargs (una mania d'estil del projecte), que cada negatiu estigui al registre de negatius i cada unitat tancada al diari, i que cada imatge citada a l'arbre sigui al repo. Corre a cada PR i, abans de cada push, sobre els commits que es pugen. És la cinquena regla que passa a codi.

**El fitxer de l'arbre, protegit.** Un hook de git que rebutja el commit si l'edició deixa errors d'integritat o línies massa llargues. La regla "un sol escriptor del fitxer" passa de prosa a barrera real: pots desobeir-la, però el commit no passa. (Spoiler: no funcionava. Hi arribo més avall.)

**Permisos al harness.** La configuració dels agents ara té regles: editar l'arbre a mà, denegat; pujar a main, pregunta; forçar la pujada, denegat. Els incidents de seguretat d'agents que s'han fet públics aquest mes són fallades de frontera, no de capacitat.

### Prosa: el mínim, i provada

Hi ha coneixement que no es pot codificar: com es desbloqueja una línia genealògica, quina estratègia toca davant un cognom que canvia per una pubilla. Això continua sent prosa, a la skill d'estratègia del projecte. Però la prosa també es pot provar.

La skill ja tenia sis casos d'exemple amb la resposta esperada, que ningú executava mai. Ara tenen un runner: cada cas es passa pel harness complet, amb el repo com a context, i es puntua. Primer baseline: 4 de 6.

I dos dels sis fallats ensenyen més que els sis aprovats. Un fallava per literalitat de la rúbrica (el model deia "agnatícia" i l'eval buscava "patrilineal"). L'altre és or: l'eval demanava com desbloquejar l'origen d'una besàvia, i el model va llegir l'estat de la recerca, va veure que aquesta qüestió ja estava resolta amb fonts des de fa dies, i va redirigir la resposta cap al bloqueig real. L'eval era vell; el model, correcte. Quan un eval falla, la primera pregunta és si falla l'eval.

Per acabar-ho d'arrodonir, model com a jutge. La rúbrica de paraules clau és barata, però literal, així que una segona crida avalua la resposta contra el criteri d'expert, amb permís explícit per premiar qui detecta que la pregunta està desactualitzada. Jutge diferent del generador, sortida en JSON, veredicte en una taula.

### L'humà: una pantalla suficient

Un tauler HTML generat des de les fonts vives del repo: la cua de treball amb allò que està encallat i per què, l'estat de les comprovacions, els murs de pedra documentals i la cobertura de cada branca. I una regla nova al document d'instruccions que ho lliga tot: l'usuari no està dins del bucle. El que veu dels agents és només el missatge, i ha de ser suficient: què s'està fent i per què, els codis interns traduïts, i la part humana al final. Ni un W713 sols a cap missatge.

### No tota regla mereix una barrera

També vaig descartar una regla després de provar-la en lloc de discutir-la. Volia un avís per a les notes de l'arbre que diuen "T1" sense citar document i imatge. Prototip: 38 avisos, quasi tots documents familiars perfectament legítims (llibre de família, registre del cementiri). Massa soroll per a una barrera. Una barrera amb massa falsos positius s'acaba apagant, i llavors el gate no serveix, com deia a gedlint.

## Les barreres també són codi

Aquí hi ha el que més m'ha ensenyat. Quan vaig passar l'agent a revisar el harness, la primera troballa no venia de la taula. El hook que havia presumit més amunt tenia una cometa mal posada: passava la ruta de l'eina i el seu argument com un sol nom de fitxer. Python no el trobava i el hook rebutjava qualsevol commit que toqués l'arbre, estigués bé o malament. Era així des del dia que el vaig escriure. Les dues edicions de l'arbre que hi va haver mentrestant se l'havien hagut de saltar, i cap agent no ho va dir.

Ho vaig arreglar, però no era l'últim error del hook. Un control que ningú prova no protegeix res: ensenya als agents a saltar-se'l. És el mateix error que vaig descriure a gedlint, un gate que es trenca en silenci, aplicat aquesta vegada al meu propi codi.

Les eines noves van tenir un destí semblant. El primer que va atrapar la comprovació d'estat net va ser el meu codi: l'eina d'escriptura de l'agent havia convertit un caràcter escapat en un guió llarg literal, i el push va ser rebutjat. La primera passada pel CI en va trobar dues més. Els tests de les eines no havien corregut mai al CI i els faltava una llibreria d'imatges. I l'escaneig de privacitat marcava com a personal el correu fictici dels tests nous.

## El revisor que no era jo

Per a l'última capa, la revisió, vaig invertir la feina. Un subagent independent, amb instruccions de refutar, no de confirmar. Va tornar amb una troballa crítica que jo no havia vist: el meu arranjament del hook continuava rebutjant tota edició de l'arbre real, ara per un altre motiu. L'arbre arrossega tres línies llargues que el linter ja té acceptades al baseline, i el meu control les tornava a jutjar a cada commit. Els tests passaven perquè només feien servir arbres sintètics. La solució és la mateixa idea del ratchet del CI: rebutjar només les línies llargues noves. Aquesta vegada ho vaig provar sobre l'arbre real en un clon temporal.

Va trobar també que el control del push jutjava la còpia de treball i no els commits que es pugen, que una eina saltava el bloqueig de l'arxiu, i un error de paràmetres a l'eina de la cua que ignorava en silenci la ruta del fitxer quan anava abans de la subcomanda. Aquest últim el va descobrir de la manera més convincent possible: el revisor va modificar sense voler la cua real de treball, se'n va adonar, ho va desfer i ho va reportar.

I em va corregir un recompte. Jo havia marcat com a "fet complir pel codi" regles que ara tenen una eina, però que res no obliga a fer servir. Una eina disponible fa que el camí correcte sigui el fàcil, que no és poc, però no és una barrera. Amb aquest criteri més estricte, de les 26 regles de la taula d'incidents, 7 les fa complir el codi o el CI, 7 tenen una eina o un control parcial, i 12 encara són prosa. Ara la taula té una columna que ho diu.

El tauler de revisió, la pantalla del primer dia, va passar pel mateix revisor abans de fusionar-se, i el servidor del mode viu tenia dos forats. Servia qualsevol fitxer del repo, inclòs `.git` amb tot l'historial, cosa que amb Tailscale vol dir a qualsevol dispositiu de la meva xarxa. I no comprovava la capçalera `Host`, de manera que una web qualsevol oberta al navegador podria haver llegit l'arbre, amb dades de persones vives, a través de localhost (el que es coneix com a *DNS rebinding*). Cap dels dos era difícil d'arreglar, i cap dels dos el veu un humà mirant la pantalla. Que una pantalla sigui suficient per decidir no equival a una revisió.

## Què m'emporto

Per deixar treballar agents de forma autònoma calen tres coses, i totes tres són feina de dalt de la piràmide.

**Barreres, no peticions.** Si una regla importa, que la faci complir el codi: l'eina que calcula el número en lloc de la frase que diu "mira el diari", el bloqueig en lloc de "màxim un agent". La prosa es queda per al coneixement que no es pot codificar, i aquesta també té evals.

**Barreres provades.** El codi d'una barrera és codi com qualsevol altre, i necessita el seu test i el seu revisor. Una regla escrita és una petició; un hook sense test és una regla escrita amb pretensions. Cal provar-les sobre dades reals i no només sintètiques, i deixar que un revisor intenti refutar-les.

**Una pantalla suficient, i saber què no veu.** L'esforç humà no ha d'anar a llegir cada PR, sinó a dissenyar l'entorn perquè l'agent faci el correcte per defecte i a comprovar de tant en tant que l'entorn fa el que diu.

La regla de decisió que jo en trauria: especialitza el harness exactament on la tasca està més enllà del que el model fa sol, i poda la resta a cada model nou. Tècniques concretes caduquen. Els connectors, les fronteres i la pantalla són estructurals, però l'única peça que es fa més forta amb cada model que surt és l'eval, perquè cada model nou és una passada gratis contra el teu criteri. Els actius més duradors del meu repo no són tècnics sinó epistèmics: el registre de cerques tancades sense resultat, la font oral documentada, els nivells de prova. Gent que sap de l'ofici escrivint els criteris amb què es jutja la feina. El mateix que monetitzen Harvey i els seus. El model arriba i passa; el criteri es queda.

El flux de feina d'aquest projecte (worktrees, sessions paral·leles, revisió) el vaig explicar a [Com programo ara](/blog/com-programo-ara), i la filosofia de verificació, a [Cobertura no és verificació](/blog/cobertura-no-es-verificacio).
