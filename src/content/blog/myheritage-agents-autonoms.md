---
title: "De MyHeritage als agents autònoms: com he transformat la meva recerca genealògica"
description: "Del SaaS a un repositori git amb agents d'IA, linter de CI i nivells de prova: com he reprès el meu arbre genealògic com un projecte d'enginyeria de dades."
date: 2026-10-01
---

Fa un any vaig començar a digitalitzar un arbre genealògic que vaig trobar a casa dels avis. [MyHeritage](https://www.myheritage.com) em va ajudar a arrencar-lo: hi vaig posar quatre noms i de sobte tenia branques senceres via Smart Matches, alertes automàtiques, un arbre que creixia sol. Però el ritme era desesperantment lent: moltes hores picant dades a mà davant la pantalla per avançar poc.

Darrere d'aquesta comoditat aparent, la realitat era una altra: una quantitat ingent de feina mecànica, una taxa de frustració alta i la sensació constant de xocar contra murs de pedra.

Aquest setembre he reprès el projecte amb un enfocament radicalment diferent: agents autònoms d'intel·ligència artificial que treballen hores seguides, pràcticament desatesos, mentre jo decideixo quines hipòtesis perseguir i tracto la genealogia com un projecte d'enginyeria de dades i recerca històrica. El contrast amb aquell arbre trobat en un calaix és tan gran que val la pena documentar-lo.

---

## 1. El punt de partida: la il·lusió de l'automatització a MyHeritage

Quan comences amb MyHeritage, la sensació inicial és màgica: hi poses quatre noms i de sobte el sistema et proposa branques senceres a través dels Smart Matches i Record Matches. Però quan vols fer recerca seriosa i rigorosa a Catalunya o a la península, topes de cara amb la realitat.

La feina manual no desapareix: es disfressa. Els motors comercials només troben el que ja està preindexat o el que altres usuaris han pujat als seus arbres (sovint amb errors arrossegats de generació en generació). Qualsevol línia que s'allunyi dels camins més transitats requereix anar a arxius diocesans, descarregar pàgines una a una i transcriure a mà lletra processal o itàlica del segle XIX.

L'ecosistema, a sobre, és tancat i les dades són brutes. L'exportació [GEDCOM](https://gedcom.io) de MyHeritage és un camp de mines: camps propietaris (`_MARNM`), cadenes de caràcters UTF-8 trencades entre línies `CONC/CONT`, enllaços a fotos allotjades en servidors que caduquen al cap de pocs dies, i desenes de grafies diferents per al mateix municipi.

I encara hi ha els murs de pedra inevitables. Si el rector d'una parròquia no tenia un índex alfabètic al final del llibre, o si el registre civil d'un avantpassat és anterior a 1870, la plataforma es queda cega. M'hi vaig quedar bloquejat mesos sencers en línies directes tan bàsiques com els avis o el matrimoni d'uns besavis.

---

## 2. El canvi de paradigma: genealogia com a codi i agents d'IA

En reprendre la recerca, vaig decidir canviar completament les regles del joc. L'arbre ja no és un fitxer atrapat en un servei SaaS: és un repositori privat de codi amb control de versions git. Les dades no s'editen alegrement: s'aplica una metodologia científica de nivells de prova (T0 pista d'índex, T1 acta original transcrita, T2 dues fonts independents creuades).

Una integració contínua (CI) amb un *ratchet* vigila cada canvi: un *linter* en Rust ([`gedlint`](https://github.com/pmontp19/gedlint)) valida cada commit via GitHub Actions. La gràcia del sistema de trinquet (*ratchet*) és que no exigeix un arbre perfecte el primer dia, sinó que impedeix que entri cap error o advertència nova, forçant una millora contínua de la neteja de dades.

I tot això ho executa un equip multiagent autònom: agents d'IA (utilitzant entorns com [Claude Code](https://www.claude.com/product/claude-code), OpenCode, Codex i Antigravity) que actuen com a assistents d'investigació, analistes paleogràfics i enginyers de dades, compartint *skills* i protocols comuns.

---

## 3. Les tècniques que han marcat la diferència

### A. Enginyeria de context: el pipeline de tires de marges (Strips)
Els llibres sacramentals històrics solen tenir centenars de pàgines per volum. Fer que un model multimodal inspeccioni desenes de pàgines completes és inviable per cost, latència i saturació de context visual (*lost in the middle*).

La solució és pura **enginyeria de context**: un script retalla exclusivament la franja lateral del marge (el 20-30% on el rector anotava el nom del batejat o els contraents) i munta tires condensades de 4 pàgines per làmina. Això redueix dràsticament el consum de tokens i permet que un agent de visió escanegi desenes d'anys de registres en pocs minuts, localitzant la pàgina exacta abans de demanar la descàrrega sencera en alta resolució.

### B. El poder del Full-Text Search per IA (FamilySearch HTR)
Fins fa molt poc, si un llibre no estava indexat manualment per voluntaris, simplement no existia a les cerques. Això ha canviat radicalment aquest 2026. L'ús de la nova cerca full-text d'IA de [FamilySearch](https://www.familysearch.org) (reconeixement HTR sobre microfilms manuscrits no indexats) ens ha permès desbloquejar branques esquives en altres comunitats autònomes o arxius notarials llunyans, trobant notes marginals manuscrites que cap cercador convencional havia catalogat mai.

### C. Cirurgia atòmica sobre el graf i normalització del parentiu català (`ged.py`)
Deixar que un model de llenguatge editi un fitxer GEDCOM a mà és una recepta per a la corrupció de referències creuades (`FAMC`, `FAMS`, `CHIL`, `HUSB`, `WIFE`). Per garantir edicions quirúrgiques segures, vam crear una eina nativa en Python pur. L'agent només fa operacions atòmiques (`add-indi`, `link`, `validate`) que verifiquen la integritat byte a byte abans d'escriure a disc.

A més, el motor de càlcul de relacions s'ha adaptat a la **terminologia genuïna de parentiu en català**:
- Distingeix estrictament entre **germans** (de pare/consanguinis o de mare/uterins) i **germanastres** (parentiu pur d'afinitat sense sang, fills de cònjuges diferents d'unions prèvies).
- Resol les branques col·laterals asimètriques amb denominacions tradicionals catalanes com l'**oncle valencià** (cosí germà del pare o de la mare) i el **nebot valencià** (fill del cosí germà), bandejant calcs absurds de l'anglès.
- Anomena amb precisió l'**oncle avi** (i no pas "besoncle"), l'**oncle besavi**, el **nebot net** i les generacions ascendents fins a **rerebesavis** (quadravis) sense deformacions com "trastavi".

### D. La skill d'estratègies genealògiques: Ahnentafel, agnació i xarxa FAN
En lloc de deixar que cada agent improvisi, hem empaquetat el coneixement metodològic en una *skill* modular compartida entre entorns:
- **Ahnentafel directa (amplitud BFS)** per cobrir capes equilibrades d'avantpassats (2^n).
- **Línia agnatícia / patrilineal (profunditat DFS)** amb una atenció clau a la tradició successòria catalana: **hereus, pubilles i cabalers**. Si una pubilla heretava el mas, els capítols matrimonials notarials sovint obligaven el marit a canviar o anteposar el cognom de la casa, alterant la continuïtat biològica del cromosoma Y sota el mateix cognom registrat.
- **Xarxa FAN (recerca en clúster)**: Davant d'un bloqueig o homonímia, l'agent analitza els padrins de bateig de tots els fills d'una parella, els testimonis de casament i els marmessors testamentaris. Els patrons de padrins forasters revelen gairebé sempre la parròquia d'origen de la mare.
- **El factor fills**: Com canvia l'estratègia quan hi ha descendència (fent servir la fertilitat i l'onomàstica tradicional com a brúixola) versus parelles sense fills, on cal saltar immediatament a testaments, capbreus i dispenses de consanguinitat.

### E. El protocol "de menys a més" i el valor dels negatius

Un agent autònom no ha d'operar a cegues. El nostre protocol estableix cinc fases progressives:
1. Validació prèvia interna (arbre local i catàleg de negatius).
2. Consultes puntuals d'índex T0 a baix cost.
3. Inspecció visual compacta de tires de marges (T0+).
4. Descàrrega d'alta resolució i transcripció literal de l'acta sencera (T1).
5. Corroboració per una segona font independent (T2) i commit amb traçabilitat.

I al centre de tot plegat: **el registre de negatius**. Registrar exactament quins llibres, municipis i rangs d'anys ja s'han revisat sense èxit estalvia desenes d'hores i evita bucles infinits de cerques redundants en sessions posteriors.

---

## 4. La convergència amb el món físic: documents de família

Un dels aprenentatges més potents d'aquest procés ha estat adonar-me que la IA més avançada necessita connectar-se amb els papers vells del calaix.

Els documents originals que es conserven a casa són mines d'or de primer ordre:
- El **llibre de família original dels avis**, que confirma de cop dates de naixement civils, municipis d'origen i defuncions sense haver d'esperar certificats d'arxiu.
- Un **DNI històric d'un besavi** de mitjan segle XX, que aporta la professió, la filiació materna contrastada i el domicili exacte d'aquella dècada.
- **Títols de propietat de sepultures de cementiris municipals**, que permeten situar branques senceres de besavis i oncles avis inhumats conjuntament.

Aquesta documentació domèstica primària serveix per validar i tancar com a T2 hipòtesis que sovint teníem encallades només a través d'actes parroquials antigues.

---

El sistema es va posar a prova real en quatre episodis concrets, cadascun d'una mena diferent de problema: escala, quan calia fer córrer diversos agents en paral·lel; dades heretades, quan calia netejar fantasmes de l'arbre antic; disciplina, quan calia normalitzar centenars de valors sense editar-los a mà; i rigor documental, quan calia decidir com escriure una data incerta. Són el nucli dur de tot el que he après.

## 5. Orquestració multiagent: cinc PR en un dia (i què va fallar)

El 14 de setembre de 2026 el sistema es va posar a prova de veritat: tres sessions d'agents en paral·lel (worktrees independents), cinc pull requests obertes el mateix dia i una verificació d'arxiu que ho travessava tot. El balanç: 551 individus, 141 famílies, zero errors de validació, avisos reduïts de 52 a 41. Però el més valuós van ser les lliçons, perquè gairebé totes van venir d'incidents reals:

1. **Els números de sessió col·lideixen**: tres sessions van titular la seva entrada "Sessió 17" el mateix dia. La regla que n'ha sortit és mecànica: el número surt de llegir el DIARI a `origin/main` amb fetch previ i sumar-hi u, mai de la memòria de la sessió.
2. **Els fitxers d'estat compartits són el coll d'ampolla**: quatre de cinc PR tocaven el DIARI i dues l'ESTAT; una va donar conflicte real de fusió. Cada sessió escriu el seu informe propi i només proposa l'entrada de diari; l'orquestrador integra en fusionar.
3. **Les branques envelleixen en hores**: les sessions filles partien d'un main sense les PR germanes i arrossegaven supòsits obsolets (recomptes, fitxers encara no fusionats). Rebase obligatori a l'inici i dependències declarades al briefing.
4. **El revisor automàtic també s'ha de revisar**: [CodeRabbit](https://www.coderabbit.ai) va caçar errors reals (un nivell de prova incoherent, una cobertura exagerada, una identitat mal argumentada), però també va demanar canvis contra la convenció del repo. Cada troballa es verifica contra la metodologia abans d'aplicar-se, i els descartes queden motivats per escrit.
5. **Missatge abans que presa**: quan calia afegir una verificació a la branca d'una sessió activa, un missatge directe la va integrar en minuts sense conflictes. Prendre la branca d'un altre només si és inactiva.

La conclusió m'interessa més que la tècnica: l'orquestrador humà ja no pica dades, resol conflictes de coneixement entre agents. I el sistema, amb totes les seves regles apreses a cops, millora sol a cada sessió.

---

## 6. Caça de fantasmes: el Consistency Checker invertit

Els Smart Matches no només afegeixen persones: de vegades en fusionen dues en una. El patró que ens ha netejat l'arbre aquesta setmana és invertir el Consistency Checker: en comptes d'acceptar l'aparellament automàtic, buscar la incoherència biològica i resoldre-la amb acta T1.

El cas canònic: dos presumptes germans separats per 117 dies. Impossible biològicament. L'anàlisi del cognom matern ho confirmava (deu germans amb un cognom, un amb un altre) i descartava la hipòtesi d'una segona muller intercalada (la primera continuava tenint fills sense interrupció). Decisió: desvincular sense inventar cap muller fictícia, deixar l'individu orfe amb NOTE de raonament i anar a l'acta. El baptisme va confirmar els pares reals, una parella diferent del mateix poble.

El mateix patró, aplicat amb l'arbre familiar de 1974 com a testimoni T1, va eliminar duplicats i fantasmes arrossegats de generació en generació: una Maria Rosa duplicada, dues germanes que eren confluència de noms de germanes reals, una Tecla fusionada amb el seu propi duplicat. En cada cas, la regla és la mateixa: cap fusió o desvinculació sense acta llegida i notes NOTE de traçabilitat a banda i banda.

I aquí una cosa ha portat a l'altra: les regles de coherència nascudes per caçar aquests casos al validador local (espaiat de germans, homònims vius, longevitat, matrimonis impossibles) es van proposar al linter del CI, van tornar com a regles noves i els seus propis falsos positius, un cop corregits, van netejar el baseline. La història completa de com s'ha anat construint el linter dona per un post sencer; aquí en queda l'esquelet: cada error real genera regla, cada regla genera falsos positius, cada correcció neteja deute.

---

## 7. Normalització massiva amb mapa idempotent

Quan el linter va marcar una vintena de famílies amb grafies inconsistents als fills, la temptació era editar a mà. El patró que funciona és el contrari: mapa declaratiu versionat.

Primer, inventari extractiu que lliga cada valor amb el seu context. Després, distinció explícita entre el mecànic i el que exigeix acta: en el nostre cas, 11 canvis NORMALITZAR aprovats per l'usuari amb l'eina de preguntes, i 9 casos VERIFICAR T1 que queden pendents perquè toquen identitat (noms primers, cognoms materns amb variant documental, famílies amb incògnita). La decisió de format es pren amb l'humà, no s'assumeix.

Després, dry-run obligatori, còpia de seguretat, aplicació, validació doble i notes NOTE de traçabilitat per fitxa. La propietat que ho fa robust: el mapa és idempotent i re-aplicable. Després d'un merge amb conflicte, es torna a aplicar i els valors nous queden normalitzats sense reeditar a mà. És el mateix patró que ja havia servit per a la normalització de topònims: escriure la decisió una vegada, al repo, i deixar que el script la garanteixi per sempre.

---

## 8. Rigor BIRT vs. BAPM i l'àncora com a pista

Tres lliçons de paleografia pràctica que han canviat com escrivim dates.

Primera: un baptisme no és un naixement. Quan l'acta diu "batejat el 19 de maig" sense data de naixement, el BIRT queda sense data i el BAPM porta el dia. Conservar una data de naixement heretada d'un arbre imprès al costat d'un baptisme d'acta és barrejar nivells de prova.

Segona: els llibres no sempre van en ordre cronològic. Un tram sencer anava organitzat per cognom, no per data. Qui busca per any en aquell tram, no troba; qui sap com està ordenat, sí.

Tercera: l'àncora de l'índex és una pista, mai una coordenada. En una sola setmana hem vist àncores errònies en data i pàgina, un matrimoni datat un mes més tard a l'índex que a l'acta, i una entrada d'índex que situava un baptisme en una pàgina on hi havia tres actes d'altres famílies. La regla que n'ha sortit: calibrar sempre amb capçaleres d'any reals i dues mostres, i escriure el calibratge a l'informe perquè la següent sessió no repeteixi la cacera.

---

## 9. Què he après sobre el paper humà

Els quatre episodis anteriors comparteixen una lliçó de fons: la intel·ligència artificial no fa màgia per si sola. Sense regles clares i sense supervisió metodològica, els agents poden confondre persones homònimes o inventar connexions aparentment plausibles.

La clau de l'èxit ha estat una divisió de funcions molt neta:
- **L'agent** assumeix la feina intensiva: descàrrega estructurada, retall i muntatge de tires de marges, lectura paleogràfica preliminar, manteniment del graf GEDCOM i compliment automàtic de les regles de CI.
- **L'humà (manager)** aporta el context insubstituïble: la memòria oral familiar (les anècdotes dels avis, els oficis i negocis tradicionals, les rutes migratòries que cap document eclesiàstic recull d'entrada), la decisió de quines hipòtesis prioritzar i el judici crític per discernir quan una prova documental és realment concloent.

Passar de la dependència passiva d'eines comercials a la direcció activa d'un equip d'agents autònoms sobre dades pròpies ha estat el salt més gran que he fet mai en genealogia. Ja no estic omplint buits en una web aliena: estic construint un corpus històric familiar rigorós, auditable, lliure i perenne.

Del calaix de casa a un corpus auditable en un repositori git: el mateix arbre, un any de diferència, un ofici nou pel mig.
