---
title: "Les regles que els agents no es poden saltar: el harness vertical de la meva genealogia"
description: "Un tuit em va donar el nom (harness vertical) i un altre el criteri (la piràmide invertida). Com vaig convertir en barreres les regles en prosa del projecte de genealogia, per què les barreres també s'han de provar, i què vaig aprendre quan vaig deixar els agents sols dies seguits."
date: 2026-11-01
draft: true
---

Al post de [gedlint](/blog/gedlint) vaig deixar escrita una frase que no he deixat de rumiar: el pitjor mode de fallada d'un gate és un build verd que no ha validat res. Parlava d'un script del CI que va petar i va acabar amb `success`. Parlava d'un linter, però el problema és més gran.

El projecte de genealogia té agents que treballen dies seguits, gairebé desatesos, i al darrere un munt de regles apreses a cops: el número de sessió es calcula així, a l'arxiu diocesà només hi va un agent alhora, tota afirmació forta porta la imatge de l'acta. Cada regla neix d'un incident real. Però on viuen? En markdown, i una regla en markdown és una petició. El linter i el seu ratchet (el mecanisme que impedeix que el nombre de problemes torni a pujar) en fan complir una part, i la resta confia que l'agent ho llegirà, ho entendrà i ho obeirà.

Fa unes setmanes van coincidir dues lectures que em van donar les paraules per a això. La primera, un [tuit de Greg Isenberg](https://x.com/gregisenberg/status/2110414696037716372) que tradueixo:

> Els harnesses d'agents són els nous GPT wrappers, però en el bon sentit, sobretot els verticals. Els millors equips tracten el model com una peça intercanviable i assignen un model diferent a cada feina. Fan servir prompts portables en comptes de fine-tuning, i fan A/B testing sobre el que els usuaris fan amb la sortida: l'editen, l'exporten, la comparteixen? Un harness vertical és bàsicament quatre coses: els connectors per a les dades d'aquella indústria, els evals escrits per gent que en sap de l'ofici, les regles sobre què l'agent pot tocar i què no, i una pantalla neta perquè un humà ho revisi. El model és, com a molt, un 20% de tot plegat.

La segona, un [tuit de @poteto](https://x.com/poteto/status/2111133080526495985) amb una idea senzilla: si vols confiar en la feina dels agents, inverteix la piràmide. Més esforç a dalt de tot, al codi, i el mínim a la revisió humana. Les dues juntes diuen una cosa que el repo ja intentava fer sense saber-ho: un harness vertical és el lloc on les regles deixen de ser peticions i es converteixen en barreres, perquè l'agent pugui treballar sol de debò.

Vaig començar aquest post el 17 d'octubre. Les dues setmanes següents van posar a prova gairebé tot el que hi deia, i ho he deixat dins.

**En resum**

- Un harness és la bastida al voltant d'un model: el bucle, les eines, la gestió de context, els guardrails. Claude Code, Cursor i Devin en són. Els verticals hi afegeixen quatre peces: connectors, evals d'experts, regles de permisos i una pantalla de revisió.
- El criteri per decidir què va on és la piràmide invertida: codi que fa impossible el camí incorrecte, anàlisi estàtica, prosa només per al mínim, i la revisió humana al final.
- Vaig auditar el repo amb dades (409 commits i la taula d'incidents): les regles que vivien al codi no han tornat a fallar, les que només eren prosa, sí. Vaig convertir cinc regles en codi (algunes, ho vaig saber després, només en eines), vaig posar evals a la prosa que quedava i una pantalla per a l'humà.
- Les barreres són codi, i el codi falla. El hook que havia de protegir l'arbre rebutjava tots els commits, bons i dolents. La barrera contra duplicats, la primera versió, un revisor extern la va declarar no fiable. Cap de les dues fallades la va veure qui l'havia escrit.
- El model sí que és una peça intercanviable, però només ho saps si tens evals per tasca. Els models gratuïts encerten l'estratègia de recerca i fallen llegint actes del segle XVIII, on el millor model en llegeix sis de sis i el meu habitual, tres. I l'eval de lectura va trobar dos errors a l'arbre.
- Quan vaig deixar els agents sols, el que més els frenava no era el model ni les barreres, sinó una regla meva que els feia parar: 61 hores aturats esperant que algú escrivís "continua".
- Per deixar treballar agents sols calen barreres, barreres provades, una pantalla suficient i mesurar quant de temps treballen de debò. L'eval és l'única peça que millora amb cada model nou.

## El terme i el debat

El terme el va consolidar Anthropic quan va reanomenar el Claude Code SDK com a Claude Agent SDK: "el harness d'agent que impulsa Claude Code pot impulsar molts altres tipus d'agents". La definició és seca: l'agent és el comportament emergent, el harness és la maquinària que el produeix. Un LLM cru és una CPU sense res al voltant: el context és la RAM, les eines els perifèrics, i el harness el sistema operatiu.

El debat interessant és si aquesta maquinària ha de ser generalista o vertical. L'argument en contra dels verticals és la lliçó amarga de sempre: cada component d'un harness codifica una suposició sobre què el model no sap fer sol, i aquestes suposicions caduquen a cada generació de models. Manus va reconstruir el seu framework quatre o cinc vegades, cada cop després de trobar una manera millor de donar forma al context.

Però l'evidència empírica també és contundent en l'altre sentit: canviar només la infraestructura que envolta el model, amb els mateixos pesos, va fer saltar LangChain del top 30 al top 5 de Terminal Bench 2.0 (de 52,8 a 66,5), tocant només el prompt, les eines i un middleware que obliga l'agent a verificar abans de sortir. I el mercat: Harvey (legal) ha passat de 3.000 a 15.500 milions de dòlars de valoració en 19 mesos integrant advocats en l'enginyeria i en l'avaluació, que són els qui jutgen la feina. La frase que més m'ha servit és de Prithvi Rajasekaran, a l'[enginyeria d'Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps): "l'espai de combinacions interessants de harness no s'encongeix quan milloren els models; es mou". La lectura que en faig jo és que un component de harness només val la pena quan la tasca supera el que el model fa de manera fiable en solitari, i que això canvia a cada model.

## Les quatre peces contra el meu repo

El repo de genealogia no va néixer d'aquest marc, però hi encaixa amb una precisió una mica incòmoda. L'he auditat peça a peça:

| Element | Al meu repo | Com era a mitjan octubre |
|---|---|---|
| Connectors de dades | Validador i editor del GEDCOM, descarregador de l'arxiu diocesà amb límits d'ús respectats, índexs i cerques | Fort: eines pròpies amb anys de regles de cost apreses a cop sec |
| Evals d'experts | El linter al CI amb ratchet, nivells de prova T0/T1/T2 per integrar qualsevol troballa | Fort en estructura, feble en conducta: validaven l'arbre, no la feina de llegir |
| Regles de permisos | Un document de convencions que deia "mai toquis el fitxer de l'arbre a mà" | Mitjà: confiança i verificació a posteriori, cap frontera real |
| Pantalla de revisió | Un estat de la recerca en markdown que era un mur de text | El més feble: la revisió hi era per accident |

T0, T1 i T2 són els meus nivells de prova: un índex mai confirma res, una imatge llegida sí, i dues fonts independents tanquen una línia. Rellegit ara, aquest sistema és literalment un eval de domini escrit per algú que sap de l'ofici: l'equivalent genealògic d'allò que Harvey demana als advocats que integra a l'avaluació.

La taula diu on era fort, però no per què. Això m'ho va respondre la piràmide.

## La piràmide invertida

El tuit plantejava quatre capes, de més a menys esforç:

1. **Codi.** Millores que eliminin categories senceres de problemes. Els agents copien el que ja existeix i agafen el camí més curt, així que fes que el camí fàcil sigui el correcte.
2. **Anàlisi estàtica.** Linters, tests, CI.
3. **Prosa.** Regles, documents d'instruccions, skills, el mínim indispensable.
4. **Revisió humana.** La que menys escala, al final de tot.

Vaig demanar a un agent (Claude Code, el mateix amb qui escric les eines) que revisés el meu harness amb aquest criteri, i amb dades: els 409 commits que tenia llavors el repo i la taula d'incidents que fa mesos que mantinc, on cada regla del projecte té al costat l'incident real que la va fer néixer. El patró era net. Quan la regla vivia al codi (el format de l'arbre, la pausa mínima entre peticions a l'arxiu) el problema no havia tornat. On només vivia en prosa (el número de sessió, la mida dels lots de lectura, "tota afirmació forta porta la imatge de l'acta") tornava una vegada i una altra.

Era el que ja passava amb gedlint sense que jo ho hagués dit així. El linter de l'arbre és la capa 2 d'aquesta piràmide, i funciona perquè no demana res a l'agent: si el commit trenca una regla, el build es posa vermell. Tot el que no passava per allà depenia de la bona voluntat.

## De prosa a barrera

Vaig recórrer la piràmide de dalt a baix.

### Codi: que el camí fàcil sigui el correcte

El precedent ja hi era. Al [primer post](/blog/myheritage-agents-autonoms) explicava que l'agent no edita el GEDCOM (el fitxer de text estàndard on viu l'arbre) a mà: només fa operacions atòmiques que verifiquen la integritat abans d'escriure. Això és el camí fàcil convertit en l'únic camí. Vaig aplicar la mateixa idea a quatre regles que només eren prosa:

- **El número de sessió el calcula una eina** que compta les sessions fusionades i les que estan en curs, i reserva el número pujant la branca de seguida. Hi havia hagut cinc col·lisions, inclòs un dia amb tres "Sessió 17".
- **Un sol agent alhora a l'arxiu diocesà**, amb un bloqueig compartit entre totes les còpies de treball, en lloc d'una frase que diu "màxim un agent".
- **Lots de lectura de 25 pàgines com a màxim**, amb el briefing de cada lot ja escrit. La regla venia d'un subagent que es va penjar gairebé dues hores intentant llegir 176 pàgines d'un sol cop.
- **Tancar una tasca exigeix la prova.** La porta de sortida acceptava qualsevol text. Ara demana la ruta de la imatge de l'acta o l'enllaç a l'arxiu, i comprova que existeix.

### Anàlisi estàtica: el que no es pot saltar sense que es vegi

**Els llindars biològics del linter, actius.** La configuració tenia escrita, però comentada, la secció d'edat màxima de vida, edat mínima de pares i finestra entre germans. Activada, els 522 diagnòstics que l'arbre ja arrossegava han anat al baseline i el ratchet fa la seva feina: el build només falla amb violacions noves. El que era documentació és una barrera.

**Una comprovació d'estat net.** La llista de coses que una sessió ha de complir per tancar era prosa. Ara és una ordre que comprova l'arbre, la cua de treball, tots els tests de les eines, els guions llargs (una mania d'estil del projecte), que cada negatiu estigui al registre de negatius i cada unitat tancada al diari, i que cada imatge citada a l'arbre sigui al repo. Corre a cada PR i, abans de cada push, sobre els commits que es pugen. És la cinquena regla que passa a codi, i des de llavors ha anat creixent: ara també valida la wiki de context que mantenen els agents (llocs, fets, institucions), amb les seves fonts i els seus enllaços a l'arbre.

**El fitxer de l'arbre, protegit.** Un hook de git que rebutja el commit si l'edició deixa errors d'integritat o línies massa llargues. La regla "un sol escriptor del fitxer" passa de prosa a barrera real: pots desobeir-la, però el commit no passa. (Spoiler: no funcionava. Hi arribo més avall.)

**Permisos al harness.** La configuració dels agents ara té regles: editar l'arbre a mà, denegat; pujar a main, pregunta; forçar la pujada, denegat. Més endavant ho vaig portar un pas més enllà amb agents per rol: un *lector* i un *verificador* que només poden llegir, que no poden fer commits, ni esborrar, ni tocar l'arbre, i que carreguen sempre la skill de verificar actes. Els incidents de seguretat d'agents que s'han fet públics a l'octubre són fallades de frontera, no de capacitat.

### Prosa: el mínim, i provada

Hi ha coneixement que no es pot codificar: com es desbloqueja una línia genealògica, quina estratègia toca davant un cognom que canvia per una pubilla. Això continua sent prosa, a la skill d'estratègia del projecte. Però la prosa també es pot provar.

La skill ja tenia sis casos d'exemple amb la resposta esperada, que ningú executava mai. Ara tenen un runner: cada cas es passa pel harness complet, amb el repo com a context, i es puntua. Primer baseline, amb una rúbrica de paraules clau: 4 de 6.

I dos dels sis fallats ensenyen més que els sis aprovats. Un fallava per literalitat de la rúbrica (el model deia "agnatícia" i l'eval buscava "patrilineal"). L'altre és or: l'eval demanava com desbloquejar l'origen d'una besàvia, i el model va llegir l'estat de la recerca, va veure que aquesta qüestió ja estava resolta amb fonts des de fa dies, i va redirigir la resposta cap al bloqueig real. L'eval era vell; el model, correcte. Quan un eval falla, la primera pregunta és si falla l'eval.

Per acabar-ho d'arrodonir, model com a jutge. La rúbrica de paraules clau és barata, però literal, així que una segona crida avalua la resposta contra el criteri d'expert, amb permís explícit per premiar qui detecta que la pregunta està desactualitzada. Jutge diferent del generador, sortida en JSON, veredicte en una taula.

La prosa també s'ha d'aprimar. Fa uns dies vaig passar una auditoria al document d'instruccions i a les skills contra el codi real: hi havia llistes d'eines incompletes, una ruta de configuració que ja no existia i paràgrafs sencers d'arqueologia (proves de sessions passades) que no prescrivien res. Els vaig treure. Cada línia de prosa que sobra és context que l'agent llegeix a cada sessió i una ocasió més de contradir el codi.

### L'humà: una pantalla suficient

Un tauler HTML generat des de les fonts vives del repo: la cua de treball amb allò que està encallat i per què, l'estat de les comprovacions, els murs de pedra documentals i la cobertura de cada branca. Ara és mòbil primer, perquè és on el miro, i té un bloc "el bucle ara" que diu en una línia si els agents treballen, quin ha estat l'últim commit, quines decisions m'esperen i quan s'ha tocat l'arxiu per últim cop.

I una regla nova al document d'instruccions que ho lliga tot: l'usuari no està dins del bucle. El que veu dels agents és només el missatge, i ha de ser suficient: què s'està fent i per què, els codis interns traduïts, i la part humana al final. Cap codi intern sense traduir: un "W713" sol no diu res a ningú.

### No tota regla mereix una barrera

També vaig descartar una regla després de provar-la en lloc de discutir-la. Volia un avís per a les notes de l'arbre que diuen "T1" sense citar document i imatge. Prototip: 38 avisos, quasi tots documents familiars perfectament legítims (llibre de família, registre del cementiri). Massa soroll per a una barrera. Una barrera amb massa falsos positius s'acaba apagant, i llavors el gate no serveix, com deia a gedlint.

## Les barreres també són codi

Aquí hi ha el que més m'ha ensenyat. Quan vaig passar l'agent a revisar el harness, la primera troballa no venia de la taula. El hook del qual presumia més amunt tenia una cometa mal posada: passava la ruta de l'eina i el seu argument com un sol nom de fitxer. Python no el trobava i el hook rebutjava qualsevol commit que toqués l'arbre, estigués bé o malament. Era així des del dia que el vaig escriure. Les dues edicions de l'arbre que hi va haver mentrestant se l'havien hagut de saltar, i cap agent no ho va dir.

Ho vaig arreglar, però no era l'últim error del hook. Un control que ningú prova no protegeix res: ensenya als agents a saltar-se'l. És el mateix error que vaig descriure a gedlint, un gate que es trenca en silenci, aplicat aquesta vegada al meu propi codi.

Les eines noves van tenir un destí semblant. El primer que va atrapar la comprovació d'estat net va ser el meu codi: l'eina d'escriptura de l'agent havia convertit un caràcter escapat en un guió llarg literal, i el push va ser rebutjat. La primera passada pel CI en va trobar dues més: els tests de les eines no havien corregut mai allà, i l'escaneig de privacitat marcava com a personal el correu fictici dels tests nous.

### El revisor que no era jo

Per a l'última capa, la revisió, vaig invertir la feina. Un subagent independent, sense el context de qui havia escrit el codi, amb instruccions de refutar, no de confirmar. Va tornar amb una troballa crítica que jo no havia vist: el meu arranjament del hook continuava rebutjant tota edició de l'arbre real, ara per un altre motiu. L'arbre arrossega tres línies llargues que el linter ja té acceptades al baseline, i el meu control les tornava a jutjar a cada commit. Els tests passaven perquè només feien servir arbres sintètics. La solució és la mateixa idea del ratchet del CI: rebutjar només les línies llargues noves. Aquesta vegada ho vaig provar sobre l'arbre real en un clon temporal.

Va trobar també que el control del push jutjava la còpia de treball i no els commits que es pugen, que una eina saltava el bloqueig de l'arxiu, i un error de paràmetres a l'eina de la cua que ignorava en silenci la ruta del fitxer quan anava abans de la subcomanda. Aquest últim el va descobrir de la manera més convincent possible: el revisor va modificar sense voler la cua real de treball, se'n va adonar, ho va desfer i ho va reportar.

I em va corregir un recompte. Jo havia marcat com a "fet complir pel codi" regles que ara tenen una eina, però que res no obliga a fer servir. Una eina disponible fa que el camí correcte sigui el fàcil, que no és poc, però no és una barrera. El número de sessió i els lots de 25 pàgines, dues de les meves cinc "barreres", eren d'aquestes. Amb aquest criteri més estricte, de les 26 regles de la taula d'incidents, 7 les feia complir el codi o el CI, 7 tenien una eina o un control parcial, i 12 encara eren prosa. Ara la taula té una columna que ho diu.

El tauler de revisió, la pantalla del primer dia, va passar pel mateix revisor abans de fusionar-se, i el servidor del mode viu tenia dos forats. Servia qualsevol fitxer del repo, inclòs `.git` amb tot l'historial, cosa que amb Tailscale vol dir a qualsevol dispositiu de la meva xarxa. I no comprovava la capçalera `Host`, de manera que una web qualsevol oberta al navegador podria haver llegit l'arbre, amb dades de persones vives, a través de localhost (el que es coneix com a *DNS rebinding*). Cap dels dos era difícil d'arreglar, i cap dels dos el veu un humà mirant la pantalla. Que una pantalla sigui suficient per decidir no equival a una revisió.

### La segona barrera, la mateixa història

Una setmana després es va repetir el patró amb una barrera nova, i aquesta vegada el primer avís el vaig donar jo. Mirant l'arbre vaig veure que un agent havia creat dues vegades el mateix avantpassat, un Joan Monpeó del segle XVIII, a partir de la mateixa acta de matrimoni. El linter no ho veia: els dos registres eren correctes per separat.

La resposta va ser la de sempre, passar-ho a codi: una ordre per fusionar duplicats que es nega a fer-ho si perdria dades, un validador que avisa quan dues persones amb el mateix nom citen la mateixa acta, i l'eina de crear individus que es nega a crear-ne un si ja n'hi ha un candidat. Abans de donar-la per bona la vaig fer revisar per un model d'un altre laboratori, amb el raonament al màxim i instruccions de refutar. Veredicte: "no és fiable per a producció". Sis defectes reproduïts, entre ells que un paràmetre havia anat a parar a la subordre equivocada i havia trencat la creació d'individus, i que la fusió podia deixar referències penjades.

Corregits els sis, un segon revisor va trobar un duplicat real que s'escapava de totes les barreres: una Tecla Reig que el mateix bateig havia generat dues vegades amb el cognom escrit diferent. El validador agrupava per cognom, i la grafia el desarmava. Ara agrupa per acta citada. I la lliçó no es va quedar al repo: dues de les regles que van sortir d'aquí (enllaços duplicats i possibles germans duplicats) són ara part de gedlint, a la versió 0.12, per a qualsevol arbre.

Dues barreres, la mateixa lliçó: qui escriu la barrera no és qui la pot validar.

## El model, una peça intercanviable (si ho pots mesurar)

El tuit d'Isenberg deia que els bons equips assignen un model diferent a cada feina. Jo ho feia per intuïció. Ara ho faig amb evals, i els resultats no són els que esperava.

Per a l'estratègia de recerca (el joc de sis casos de més amunt, ara amb el jutge), tres models gratuïts arriben a sis de sis, igual que GLM 5.3, el de pagament que faig servir habitualment. Per llegir premsa impresa, un model gratuït va llegir 25 pàgines de diaris antics en sis minuts i mig sense cap error de lectura. Si m'hagués aturat aquí, hauria passat tota la feina als models gratuïts.

Però vaig construir un segon eval, aquest de lectura d'actes manuscrites: sis actes de les Borges del Camp entre 1774 i 1863, amb la resposta correcta transcrita per mi, imatge a imatge. Aquí el panorama canvia del tot. Dels vuit models gratuïts, només quatre accepten imatges, i cap s'acosta al de pagament: tres no acaben gairebé cap cas a temps, i el quart en llegeix bé dues. GLM 5.3 en llegeix bé una de sis amb l'agent genèric i tres de sis amb un agent *lector* fet a mida (només lectura i la skill de verificar actes carregada sempre). Claude Sonnet, sis de sis. Els anys escrits en lletres ("diset", "seixanta-tres") i els cognoms són el punt feble de tots.

I la troballa que més em va agradar no era sobre els models. En transcriure la resposta correcta, vaig descobrir que l'arbre tenia dos errors: dues dates de bateig equivocades (una per tres dies, l'altra per deu) i, de propina, un padrí amb l'ofici i el poble canviats. Estaven validats, amb la imatge citada, perquè un agent els havia llegit malament i ningú ho havia revisat. L'eval va servir per avaluar models i, de passada, va auditar l'arbre.

D'aquí surt el criteri: un model barat per a l'estratègia i la premsa, el millor que tingui a mà per llegir manuscrits, i sempre un verificador independent que llegeix la mateixa acta abans d'integrar res. Una lectura d'un sol lector, sigui quin sigui el model, no entra a l'arbre. En estratègia, el model és potser aquell 20%; llegint manuscrits del segle XVIII, és gairebé tot. Sense l'eval no sabria quin és quin.

## La regla que feia parar l'agent

Fins aquí, tot anava d'impedir que l'agent fes coses incorrectes. Quan vaig mesurar com treballava de veritat, el problema era el contrari.

Vaig analitzar una sessió de 106 hores (gairebé 2.000 missatges i 55 subagents). L'agent s'havia aturat 71 vegades per voluntat pròpia, esperant que jo escrivís "continua", i havia passat 61 hores parat, nits incloses. No era cap limitació del model: el protocol de sessió deia, en prosa, que parés després de completar tres unitats de feina. L'agent obeïa. Unes altres 14 hores les havia passat fent `sleep` mentre esperava subagents, i els lots de lectura anaven en sèrie quan podien anar en paral·lel. L'arxiu diocesà, que jo protegia tant, només s'havia fet servir 64 minuts en total.

La solució va tenir tres parts. Primer, condicions de sortida explícites: el bucle només para si la cua és buida, si cal una decisió meva, si un recurs ha caigut o si jo deixo un fitxer `STOP`. Prohibit acabar amb "digues continua". Segon, un plugin del harness que, quan la sessió queda inactiva sense cap d'aquestes condicions, la reenganxa; i si la reenganxa tres vegades seguides sense cap commit nou, para, perquè un bucle que no avança tampoc és autonomia. Tercer, una eina que mesura l'autonomia llegint la base de dades de les sessions: missatges meus, "continues", hores esperant, unitats tancades per hora. El punt de partida d'octubre: 158 hores esperant-me en set sessions, i 0,33 unitats per hora activa a la sessió gran.

La mesura amb el plugin encara està pendent, i per això no en dono cap xifra. Però el canvi de pregunta ja ha valgut la pena. Sense mesurar, el meu harness optimitzava una cosa (que l'agent no s'equivoqui) i ignorava l'altra (que l'agent treballi). Una barrera mal posada no deixa passar el que és correcte, i una regla de "para i pregunta" també és una barrera.

### El harness de dins

L'altra cosa que frenava el bucle és més prosaica. El meu harness vertical no viu sol: corre dins d'un harness generalista (opencode, en el meu cas), i les manies d'aquell són també les meves.

Els lectors d'un llibre de baptismes del Catllar fallaven sistemàticament amb un error de mida de petició. Vaig trigar a trobar per què: el harness redueix les imatges de més de 2.000 píxels i, si són allargades, les reenvia en PNG de 3,5 MB en lloc de JPEG. Vint-i-cinc pàgines d'aquestes fan petar qualsevol petició. Ara l'eina de lots en prepara una còpia JPEG de mig MB, i el model la llegeix igual de bé.

Uns altres lectors van demanar-me una vintena de permisos en mitja hora, un per fitxer. Les còpies de treball de cada sessió (els worktrees de git) eren carpetes germanes del repo, fora del projecte, i el harness ho tractava com un accés a un directori extern. Les vaig moure a dins del repo. I en un dels evals, un agent sense rol definit va intentar esborrar els seus retalls amb `rm`; el permís era "pregunta", no hi havia ningú per respondre, i la sessió va quedar penjada sense veredicte. Un permís "pregunta" en un agent desatès és un "no" que, a més, l'atura. Els agents lector i verificador ho prohibeixen explícitament.

Aquests són exactament els components que caducaran amb la propera versió del harness, els que la lliçó amarga diu que s'han de podar. Hi estic d'acord. Però mentre hi són, costen hores, i l'única manera de veure'ls és que algú (normalment jo, mirant el mòbil) es pregunti per què el bucle s'ha aturat.

## Què m'emporto

Per deixar treballar agents de forma autònoma calen quatre coses, i totes són feina de dalt de la piràmide.

**Barreres, no peticions.** Si una regla importa, que la faci complir el codi: l'eina que calcula el número en lloc de la frase que diu "mira el diari", el bloqueig en lloc de "màxim un agent". La prosa es queda per al coneixement que no es pot codificar, i aquesta també té evals.

**Barreres provades, per algú altre.** El codi d'una barrera és codi com qualsevol altre, i necessita el seu test i el seu revisor. Una regla escrita és una petició; un hook sense test és una regla escrita amb pretensions. Cal provar-les sobre dades reals i no només sintètiques, i deixar que un revisor, millor si és un altre model, intenti refutar-les.

**Una pantalla suficient, i saber què no veu.** L'esforç humà no ha d'anar a llegir cada PR, sinó a dissenyar l'entorn perquè l'agent faci el correcte per defecte i a comprovar de tant en tant que l'entorn fa el que diu.

**Mesurar l'autonomia, no suposar-la.** Quantes hores treballa l'agent, quantes espera, per què para. Les regles que el frenen també són regles, i sense dades no les veus.

La regla de decisió que jo en trauria: especialitza el harness exactament on la tasca està més enllà del que el model fa sol, i poda la resta a cada model nou. Tècniques concretes caduquen: la còpia JPEG, les rutes de les còpies de treball, segurament el plugin del bucle. Els connectors, les fronteres i la pantalla són estructurals, però l'única peça que es fa més forta amb cada model que surt és l'eval, perquè cada model nou és una passada gratis contra el teu criteri, i de vegades, com va passar amb les actes de les Borges, una passada contra les teves pròpies dades. Els actius més duradors del meu repo no són tècnics sinó epistèmics: el registre de cerques tancades sense resultat, la font oral documentada, els nivells de prova, la wiki on els agents destil·len el context que l'arbre no sap guardar. Gent que sap de l'ofici escrivint els criteris amb què es jutja la feina. El mateix que monetitzen Harvey i els seus. El model arriba i passa; el criteri es queda.

El flux de feina d'aquest projecte (worktrees, sessions paral·leles, revisió) el vaig explicar a [Com programo ara](/blog/com-programo-ara), i la filosofia de verificació, a [Cobertura no és verificació](/blog/cobertura-no-es-verificacio).
