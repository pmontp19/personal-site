---
title: "No tenia un problema de genealogia, tenia un problema de software"
description: "Com vaig passar d'un script de Python a gedlint, un linter en Rust per a GEDCOM amb regles, reparacions i un ratchet per adoptar-lo sobre un arbre brut."
date: 2026-10-03
draft: false
---

L'arbre que vaig exportar de MyHeritage tenia 509 individus i cap garantia de ser un fitxer correcte. Al [post anterior](/blog/myheritage-agents-autonoms) deia, de passada, que un linter validava cada commit. Aquest és el post d'aquest linter: [gedlint](https://github.com/pmontp19/gedlint).

Arreglar l'arbre era feina de genealogia: fonts, dates, identitats. Que un fitxer sigui correcte i continuï sent-ho és un problema de software, i el vaig tractar com a tal.

## El problema

El GEDCOM brut venia amb línies òrfenes sense nivell, UTF-8 trencat entre dues línies `CONC`, camps propietaris, comes als cognoms i un `_UPD` per registre. Tenir el fitxer no volia dir tenir un fitxer bo.

Vaig començar amb un script de Python (`gedcheck.py`). Funcionava, però era a mida d'un sol arbre. Vaig mirar el mercat: validadors n'hi ha (Java, .NET, Python, JS, Go), alguns amb `--fix`, i a Rust només un parser abandonat des del 2021 (la comparativa és al README). Ningú feia, alhora, el que jo necessitava:

1. Comportament de `clippy`: categories i severitats configurables.
2. Reparacions (`--fix`) amb nivell de seguretat.
3. Regles pensades per als defectes reals de l'export de MyHeritage.
4. Un sol binari, en streaming, sense runtime.
5. Que corri al navegador sense enviar res enlloc.
6. Que es pugui adoptar sobre un arbre brut, sense arreglar-ho tot el primer dia.

"Cap eina feia les sis" és el que puc defensar. Així que en vaig fer una.

## 48 hores per a un MVP

El 6 de setembre: un POC i un MVP amb motor en streaming i 21 tests (un per regla). A la nit, v0.2.0 amb regles de cardinalitat i CI, i poc després un `AGENTS.md`. El 7, binaris precompilats, una GitHub Action i anotacions inline al diff.

El CI no és un extra. Un linter que ningú executa és un script. Quan el vaig connectar a l'arbre es va posar vermell durant tot el dia, i un dels errors era del linter: la regla E005 només disparava a la primera línia del fitxer perquè un flag no es tornava a posar a `false`. Arreglada, va trobar 140 casos reals, `CONT` niuats sota un `CONC`. Eren les mateixes 140 línies que una reescriptura d'historial a l'arbre va reintroduir el 10 de setembre, i que el CI va caçar sol.

Una decisió del primer dia encara mana: **zero dependències**. Ni `clap`, ni `serde`. Arguments i JSON a mà. Sembla excessiu, però el resultat és un sol binari minúscul, sense runtime, i és el que va fer possible el visor web.

## Disseny: de script a linter

Quan va funcionar, vaig escriure l'[RFC 014](https://github.com/pmontp19/gedlint/blob/main/docs/rfc-014-contract.md), inspirada en Biome. El que més m'agrada és el que **no** n'agafo:

> No CST, no per-rule query engine. GEDCOM is a line-oriented format with an explicit level column. The single streaming pass is what makes gedlint viable on large files, WASM-portable and dependency-free.

Sí que en prenc les **metadades de les regles com a dades**, els grups, l'aplicabilitat de les reparacions (segura o potencialment incorrecta) i la configuració per nom de regla. GEDCOM no té sintaxi de comentaris, així que no hi ha `// gedlint-ignore`: la configuració i el baseline són l'única manera de silenciar res.

`RULES` és la font única de veritat de `--explain`, del validador de configuració, de la pàgina de referència i de la fitxa del visor. Un test falla el build si el motor emet un codi que el registre no coneix, o a l'inrevés. La documentació no pot divergir perquè no hi ha dues còpies.

## El ratchet

Això és el que separa un linter útil d'un que acabes silenciant. Quan l'arbre ja tenia 544 individus, gedlint donava 1.014 diagnòstics en la configuració per defecte, 516 dels quals eren etiquetes de vendor. Si el CI falla amb 1.014 troballes el primer dia, l'única sortida és apagar-ho tot, i llavors el gate no serveix.

Ho vaig veure aviat, perquè l'arbre ja venia brut. La solució és el baseline ([#22](https://github.com/pmontp19/gedlint/issues/22), obert el 7 de setembre i fusionat el 8):

```
gedlint --write-baseline gedlint.baseline.json arbre/*.ged
gedlint --baseline gedlint.baseline.json arbre/*.ged
```

- Cada entrada s'identifica per **(codi de regla, empremta del missatge)** més un recompte, **mai per número de línia**: inserir deu línies al principi no invalida res.
- Una troballa coincideix mentre el recompte no s'esgoti. Les sobrants són noves i fan fallar el build.
- Les que ja no hi són es reporten com a progrés, i `--write-baseline` les poda. El trinquet només va en una direcció.

<figure style="margin:1.5rem 0">
<svg viewBox="0 0 640 190" role="img" aria-labelledby="ratchet-t" style="width:100%;height:auto;font-family:var(--mono);font-size:13px">
<title id="ratchet-t">El baseline casa les troballes per regla i empremta, no per línia. Una troballa nova fa fallar el build.</title>
<g fill="none" stroke="currentColor" stroke-width="1" style="color:var(--line)">
<rect x="10" y="30" width="230" height="90"/>
<rect x="350" y="30" width="280" height="150"/>
</g>
<g fill="currentColor" style="color:var(--muted)">
<text x="10" y="18">gedlint.baseline.json</text>
<text x="350" y="18">arbre editat (+10 línies al principi)</text>
</g>
<g fill="currentColor" dominant-baseline="middle">
<text x="24" y="62">E005 · h1:a91f · x3</text>
<text x="24" y="92">U502 · h1:77e0 · x2</text>
<text x="364" y="62">l.22  E005  h1:a91f</text>
<text x="364" y="92">l.41  U502  h1:77e0</text>
</g>
<g fill="none" stroke="currentColor" stroke-width="1" style="color:var(--muted)">
<path d="M240 62 H350 M240 92 H350"/>
</g>
<g fill="currentColor" font-size="11" text-anchor="middle" style="color:var(--muted)">
<text x="295" y="55">coincideix</text>
<text x="295" y="85">coincideix</text>
</g>
<g fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--accent)">
<rect x="358" y="112" width="264" height="32"/>
</g>
<g fill="currentColor" dominant-baseline="middle" style="color:var(--accent)">
<text x="372" y="128">l.57  W301  h1:3c07  NOU</text>
<text x="364" y="164">build en vermell</text>
</g>
</svg>
<figcaption>La clau és (regla, empremta), no la línia: les dues troballes antigues segueixen casant tot i desplaçades. Només la nova trenca el build.</figcaption>
</figure>

Així es veu a la terminal, amb un arbre sintètic: un `W301` nou apareix, les dues troballes antigues queden com a baselined.

```text
$ gedlint --baseline gedlint.baseline.json arbre.ged
WARN  [W301:suspicious] line 7: @I1@: died (1890) before being born (1900)

arbre.ged: 1 new diagnostics (0 errors, 1 warnings, 0 infos), 2 baselined, 0 resolved, 21 lines, 2 INDI, 0 FAM [GEDCOM 5.5.1]
$ echo $?
1
```

El gate deixa de ser "cap error" i passa a ser "res de nou". Un `W301` (mort abans del naixement) introduït per una edició no queda enterrat entre centenars de troballes antigues. I un import rutinari de MyHeritage que torni a posar comes als cognoms fa fallar el build: la resposta correcta és netejar les dades, no regenerar el baseline.

La configuració de l'arbre és curta:

```toml
[lints]
presets = ["recommended", "hispanic-naming", "hygiene"]

[lints.rules]
"U502" = "off"
"W306" = "info"
```

Els rulesets `hispanic-naming` i `hygiene` són opt-in perquè codifiquen convencions, no l'especificació.

## Privacitat com a requisit

L'arbre són persones vives. Això va condicionar el disseny, i una vegada el va haver de corregir.

**El visor web.** Perquè el motor no depèn de res ni toca fs ni xarxa, el mateix codi compila a `wasm32`. El visor ([pmontp19.github.io/gedlint](https://pmontp19.github.io/gedlint)) el fa córrer dins el navegador, amb una CSP `connect-src 'none'`: l'arbre no surt de la pestanya. Va arribar el mateix 8 de setembre, al vespre.

**El baseline que filtrava.** El 10 de setembre ([#61](https://github.com/pmontp19/gedlint/issues/61)) em vaig adonar que l'empremta normalitzava dígits i referències, però deixava passar text lliure. Un baseline generat sobre un arbre real estava a punt de ser commitejat, i contenia cognoms i el cos d'una nota. El baseline és un fitxer que et diuen que commitegis, així que ha de tenir les propietats de privacitat d'un lockfile. L'endemà ho vaig arreglar: ara l'empremta és un hash i res no reconstrueix mai un missatge a partir d'ell.

## Les regles neixen d'errors reals

Cada error real genera una regla, cada regla genera falsos positius i cada correcció neteja deute. Alguns exemples:

- La regla de coherència genealògica (W308 a W312) va néixer de casos caçats a mà a l'arbre. Després vaig comparar les 36 comprovacions del Consistency Checker de MyHeritage amb les meves i vaig tancar els buits, tot offline.
- Una auditoria contra corpus externs (FamilySearch 7.0, Habsburg amb 34.020 individus, fitxers de tortura) va destapar falsos positius que ara són tests.
- Una regla de línia massa llarga (W713) va caçar un off-by-one **meu** a `ged.py`, l'script que normalitza l'arbre: partia les línies a 255 sense comptar el terminador, i el límit de la spec l'inclou. Un bug d'una eina descobert per la regla de l'altra.
- Un `--fix` que modificava un fitxer "net" ([#44](https://github.com/pmontp19/gedlint/issues/44)): les reparacions no consultaven la configuració. Ara tota reparació queda gated per config, i un test ho lliga.
- Un gate que es trenca en silenci ([#60](https://github.com/pmontp19/gedlint/issues/60)): un script de l'Action va petar i el pas va acabar amb `success`. El pitjor mode de fallada d'un gate és un build verd que no ha validat res.

## Què falta

- Més reparacions segures. Les d'identitat (dates, vincles, fusions) no ho han de ser mai: `--fix` no toca semàntica.
- Més corpus d'arbres no anglòfons, per no sobreajustar a l'exportador de MyHeritage ni a les convencions ibèriques.
- Un baseline és còmode, i la comoditat el pot convertir en un cementiri. Les sessions on es revisen les entrades són on es guanya o es perd el trinquet.

Tot el codi de gedlint l'han escrit agents, principalment GLM i Opus, sota les meves issues i les meves regles. El flux de feina el descric a [Com programo ara](/blog/com-programo-ara).

Si el teu arbre viu en un GEDCOM: `cargo install --git github.com/pmontp19/gedlint`, o arrossega el fitxer al visor web. Els falsos positius i les regles noves es poden obrir com a issue, amb recomptes i codis, sense dades.
