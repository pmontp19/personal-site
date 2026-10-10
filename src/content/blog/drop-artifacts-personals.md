---
title: "drop: el meu Artifacts personal, construït per un equip d'agents i revisat per un altre"
description: "Com he dissenyat i construït drop, un servei per publicar HTML generat per agents a una URL privada i fer-lo públic només quan jo ho decideixo: les decisions d'arquitectura, el que van trobar els revisors i què he après de dirigir l'equip."
date: 2026-10-10
draft: true
---

Els agents m'ajunten cada dia dashboards, infografies i petits informes en HTML. Amb els Artifacts de Claude Code és trivial: l'agent publica un fitxer i surt una URL privada, amb versions, sense aprovacions pel mig. El problema és que viu a la infraestructura d'un tercer i només serveix per a un agent concret. Jo volia el mateix model a casa, pels agents que ja corren a la meva tailnet (el portàtil, OpenClaw al servidor de casa, el que vingui), i amb una regla molt clara: **res surt a internet si no ho decideixo jo**.

Així va néixer drop. Aquest post explica com és per dins, què vaig decidir abans d'escriure codi, i què van trobar els revisors quan un equip d'agents el va construir en un matí.

**En resum**

- drop publica un `.html` o un `.zip` a `https://<slug>.p.<domini>`, només visible dins la tailnet. Versions immutables, rollback, i un acte humà separat per fer-ne una versió pública.
- L'**ingest** (únic codi propi) valida i escriu a disc. El **serving** és Caddy llegint el disc: si l'ingest cau, els artefactes segueixen vius.
- Dos tokens: l'agent publica i fa rollback, però no pot esborrar ni publicar a internet. Això només ho fa l'humà des de la UI.
- Abans de programar vaig fer revisar el disseny dues vegades (jo i un «oracle»): 61 punts de revisió, entre ells dos forats que invalidaven la promesa central.
- La implementació la va fer un equip d'agents en cinc onades, amb un revisor independent per unitat. Els revisors van trobar errors reals que els tests de l'autor no veien.
- Encara no és «acabat»: la verificació amb un dispositiu extern és meva i està pendent. Això és una decisió, no un oblit.

## El que volia, en una frase

L'agent ha de poder publicar sense demanar permís, i el que surt a internet ho decideix un humà. Tot el disseny penja d'aquestes dues meitats, que a la pràctica es contradiuen: si l'agent pot publicar tot, què impedeix que publiqui a internet per accident?

El model d'amenaces el vaig deixar escrit a la primera pàgina del disseny: **un sol usuari, i em protegeixo dels accidents, no d'un agent maliciós**. Que un agent publiqui a internet per un `--public` al·lucinat, que canviï el que veu un tercer o que esborri una cosa per error. Un agent amb control del meu navegador pot fer el que faig jo; ho accepto i ho dic. Aquesta honestedat simplifica molt: no munto defenses contra un adversari que ja té el meu perfil de Chrome.

## Dues decisions d'arquitectura

### Ingest i serving separats

Només l'ingest té codi propi: rep el fitxer, valida, descomprimeix, escriu a disc i retorna la URL. Servir és Caddy llegint directament del disc, sense passar per cap codi meu. Tres motius: si l'ingest cau els artefactes segueixen vius, el component que serveix contingut no té superfície d'atac pròpia, i el que es podria substituir per una eina OSS és justament el que no escric.

### Versions immutables i symlinks atòmics

```text
$DROP_ROOT/
  drops/<slug>/
    v1/  v2/  v3/       immutables un cop creats
    current -> v3       symlink relatiu
    meta.json
  public/
    <public_slug> -> ../drops/<slug>/v3     versió CONGELADA
    <public_slug>.json  {slug, version, created_at, expires_at}
  .incoming/<random>/   extraccions en curs
```

Cada pujada s'extreu a `.incoming/`, es valida sencera, se'n calcula el sha256 de l'arbre (paths ordenats més contingut, no el del zip, perquè la CLI rezipa cada cop i els timestamps canvien el hash) i es fa un `rename` a `v<n>`. Per repuntar `current` creo un symlink temporal i el `rename`o a sobre. Mai `ln -sfn`: fa `unlink` i després `symlink`, i entremig hi ha una finestra on la URL dona 404.

La clau de seguretat és la **publicació**: el symlink públic no apunta a `current`, apunta a una `v<n>` concreta. Una versió publicada no pot canviar sota els peus de qui la veu. Només desapareix quan jo esborro el slug sencer, i aleshores primer s'esborra la publicació. Aquest és l'invariant que anomeno R28 i que tota la resta protegeix.

## Dos tokens

| | agent | humà |
|---|---|---|
| `POST /drop` (pujar) | sí | sí |
| rollback, llistar | sí | sí |
| `DELETE /drops/:slug` | no | sí |
| publicar / despublicar | no | sí |

L'agent rep `drop_a_<40 hex>` i l'humà `drop_h_<40 hex>`. L'ingest en compara el sha256 amb el hash del seu prefix, en temps constant. El token humà només viu al `localStorage` de la UI: mai a la config de la CLI ni a l'entorn dels agents. Quan un agent intenta una acció humana rep un `403` amb un `hint` que li diu què fer: obrir la UI. Fins i tot el `drop publish` de la CLI no crida l'API: obre la pantalla de previsualització al navegador.

## Revisar el disseny abans d'escriure codi

El 8 de setembre vaig demanar a Claude una revisió crítica del meu document de disseny. En va sortir una llista numerada, R1 a R61, ordenada per severitat. Dos dels bloquejants em van fer canviar coses que jo donava per bones:

**R1: la zona privada només la protegia el DNS.** Caddy corria a un VPS amb IP pública. Si escolta a `0.0.0.0:443`, el routing és per SNI i `Host`, no per IP de destí. Algú que conegui la IP pot fer `curl --resolve vendes-q3.drop.exemple:443:<IP>` i rebre l'artefacte privat. La IP no és secreta (logs de certificats, DNS històric). La correcció: `bind` a la IP de tailnet als sites privats, i una prova d'acceptació que he de fer des d'una xarxa sense Tailscale: el handshake TLS ha de fallar.

**R2: el token humà vivia al mateix disc que l'agent.** Els agents corren com el mateix usuari Unix que jo. Si `drop publish` funciona des del terminal, el token humà és en un fitxer llegible i tota la separació de rols és decorativa. Per això `publish` obre el navegador i el token només toca el `localStorage` de la UI.

Després d'aplicar-ho, i amb l'ajuda d'un «oracle» (un agent amb el model més gran, només lectura) per fer una segona passada, van sortir més punts. El que més m'agrada és **R49, un TOCTOU a publicar**. El `POST /publish` agafava per defecte la versió `current`. L'humà previsualitza la v3, un agent puja la v4 entre mig, l'humà fa clic a «publicar» i el servidor publica la v4, que ningú no ha mirat. Trenca el principi «sé exactament què comparteixo». El fix: `version` obligatori, i més endavant també el `sha256` de la previsualització, de manera que la publicació queda lligada als bytes que l'humà va veure, no a una versió abstracta.

Altres de la llista que no hauria vist sol:

- **R51:** `current.tmp-${pid}` dins Docker és sempre `current.tmp-1`. Un orfe d'un crash feia fallar tots els commits següents. Sufix aleatori.
- **R54:** Cloudflare pot alterar els bytes públics (injecta scripts amb Rocket Loader i Email Obfuscation) o servir còpies després de despublicar (Always Online). Caldria desactivar-ho i comprovar-ho amb `curl -I`.
- **R55:** un artefacte públic pot omplir de cookies el domini compartit amb la UI i provocar un `431`. Caddy treu la capçalera `Cookie` abans de l'ingest.
- **R60:** els ports que publica Docker se salten `ufw`. Un firewall no és un control per a contenidors.

La regla que me'n porto: el disseny es revisa amb un adversari abans del codi, perquè un forat de disseny costa tres línies de document i, un cop implementat, costa una migració.

## Construir-lo: una matinada, cinc onades

El dissabte 3 d'octubre vaig dir, més o menys, «si està tot ok, comença la implementació amb un equip d'agents, Opus per a les tasques crítiques i Sonnet per a les repetitives, amb punts de control». La sessió principal va fer de **manager**: no escriu codi, reparteix tasques, valida i fa els commits. Els treballadors mai no fan commit.

| Onada | Què | Model |
|---|---|---|
| 1 | Scaffold, `src/shared` (slug, errors, tipus d'API) | Opus |
| 2 | `store/` (versions, locks, recuperació) ‖ `zip/` (extracció validada) | Opus |
| 3 | Rutes de l'ingest, UI estàtica | Opus |
| 4 | CLI ‖ UI de detall ‖ backend de publicació | Sonnet / Opus |
| 5 | Deploy, UI de publicar, documentació | Sonnet |

El flux de cada unitat era el mateix: el treballador implementa, **un revisor independent** (un altre agent, sense haver vist el procés) l'ataca, el treballador corregeix i el revisor torna a revisar fins que no queda res crític ni obligatori. El manager verifica per ell mateix `lint`, `typecheck`, tests i e2e abans d'acceptar.

Al final eren 8.400 línies de TypeScript, JS i CSS (tests inclosos), més de 300 tests i 9 e2e. Però el que vull ensenyar no són els números sinó el que van trobar els revisors.

## El que van trobar els revisors

Cap d'aquests errors el detectaven els tests escrits pel mateix agent que va fer la feina.

- **Una URL pública que no mor (R28).** `deleteSlug` esborrava només la *primera* publicació d'un slug. Si un crash entre «escriure la nova» i «esborrar la vella» en deixava dues, esborrar el slug deixava un symlink públic penjat. I com que la numeració tornava a `v1`, un agent hi podia pujar contingut nou que aleshores sortia a una URL ja pública. Ara esborra totes les publicacions i qualsevol symlink de `public/` que apunti a `../drops/<slug>/` (amb la barra final, perquè `a` no casi amb `ab`).
- **Un descriptor de fitxer filtrat al zip.** El revisor va reproduir amb un script que un component de path de 256 bytes feia petar l'extracció amb un 500 i deixava un fd obert. Ara es rebutgen paths de més de 1.024 bytes i components de més de 255, i hi ha un test que compta `/dev/fd` després de 50 rondes d'entrades corruptes.
- **Una regex amb `/i` obria la porta a un token equivocat.** El flag servia per acceptar `bearer` en minúscula, però també aplicava al prefix: `Bearer DROP_A_...` es llegia com a token d'agent i es comparava contra el hash humà. No explotable amb una config vàlida, però trencava la separació que el comentari prometia. Ara `/^[Bb]earer +(drop_([ah])_[0-9a-f]{40})$/`.
- **Pujades que no acaben mai.** Un body chunked tallat tres bytes abans del final deixava la petició penjada per sempre, perquè `pipeline` sobre un stream ja destruït no es resol mai. Ara hi ha una comprovació explícita i un límit de temps de 10 minuts. Una prova flaky a CI va destapar que hi havia dos camins que acabaven diferent (keep-alive o close): ara en queda un de sol.
- **Despublicar retornava 204 amb la URL encara viva.** `readPublicationFile` tractava qualsevol error de lectura com «no està publicat», també `EACCES` o `EIO`. Decisió: falla tancat, un error de lectura és «despublicat».
- **Un `..` a la UI.** `encodeURIComponent("..")` es queda com `..`, de manera que `#/drop/..` feia un fetch a `/drops/..`, que el navegador normalitza a `/`. Ara qualsevol slug fora de `/^[a-z0-9-]{1,50}$/` mostra «No trobat».
- **El snippet per als agents estava trencat.** `curl -F "label=<text>"` interpreta el `<` com «llegeix aquest fitxer». Un revisor va executar el comandament, va veure un `curl: (26)` i ho va canviar per `--form-string`. Un agent que copiï el snippet de la documentació ho hauria fet servir tal qual.

També va aparèixer una revisió externa de la PR, després de fusionar-la: un cas de pestanya vella en què, després d'esborrar i recrear un slug, «Renovar» podia lligar-se als bytes nous. Va portar el `sha256` obligatori a totes les publicacions, renovacions incloses.

## Zip-slip: la part que no deixo a la sort

El zip és l'únic lloc on l'entrada d'un tercer (o d'un agent distret) es converteix en fitxers al meu disc, així que és el codi amb les regles més dures. L'extracció només crea fitxers regulars i directoris. Cada path es resol i es comprova dins del destí abans d'obrir res. Es rebutgen `..`, paths absoluts, `\`, bytes nuls o de control, symlinks, duplicats (també després de normalitzar a NFC) i extensions fora d'una whitelist. Els límits es compten en streaming sobre els bytes reals, no sobre la capçalera del zip, perquè una capçalera pot mentir.

Les proves són una quarantena de zips maliciosos fets a mà, commitejats al repo: `traversal.zip`, `symlink.zip`, `fifo.zip`, `rtl-override.zip`, `forged-size.zip`, `nfc-duplicate.zip`, `encrypted.zip`... `store/` i `zip/` tenen una porta de 100% de cobertura de branques. I, tenint en compte que un agent ha escrit els tests, tinc apuntat el que els agents no poden fer per mi: **una revisió humana línia a línia de `src/server/zip/`**. Això és exactament el problema del [post de mutation testing](/blog/cobertura-no-es-verificacio): un 100% de cobertura diu que s'han executat les línies, no que algú s'hagi equivocat intentant trencar-les.

## Què no he verificat, i per què

La verificació de l'exposició (que des d'una xarxa externa la zona privada no respongui, que el túnel de Cloudflare no deixi passar un host privat, que l'ACL de Tailscale digui el que crec) és meva. L'`AGENTS.md` del projecte ho prohibeix explícitament als agents: **cap verificació amb un dispositiu extern des d'un agent**. Un agent que comprova la seva pròpia seguretat des de dins de la xarxa que vol provar no demostra res.

Per això a la llista de tasques hi ha un `[~]` ben visible: els fitxers de desplegament estan fets i validats en local (Caddy valida la config, els contenidors arrenquen i els healthchecks funcionen), però falta que jo ho comprovi amb el mòbil fora de casa. Altres límits que he deixat escrits:

- L'escàner de la previsualització (emails, IBAN, claus `sk-`, `AKIA`, tokens de GitHub, JWT, més els meus patrons) és una **ajuda**, no una garantia. Accepta falsos positius.
- La tailnet és accés de lectura (R61): qualsevol procés d'un dels meus nodes pot llegir els artefactes privats. Ho vaig decidir perquè qualsevol agent de la tailnet ha de poder publicar. Publicar encara demana el token d'agent.
- Si l'ingest cau, les publicacions caducades segueixen vives fins que torni, perquè el sweeper viu dins l'ingest.

## Què m'enduc

1. **Revisa el disseny amb un adversari abans del codi.** Els dos bloquejants més greus (R1, R2) eren a un document, no a un fitxer. Corregir-los va costar uns paràgrafs.
2. **El revisor ha de ser un altre agent, i ha d'executar coses.** Els errors bons (el fd filtrat, el `curl: (26)`, el body que penja) es van trobar reproduint, no llegint. Un revisor que només mira codi troba estil.
3. **El manager no escriu.** Quan la sessió que coordina no implementa, manté el context net per decidir. I els commits els fa ella, que és qui ha verificat.
4. **Els invariants van al principi.** «Una versió publicada no canvia» és una frase. Com que estava escrita a l'`AGENTS.md`, cada revisor la va utilitzar per jutjar els canvis dels altres.
5. **L'últim pas és humà.** Aprofitar els agents no vol dir deixar que certifiquin ells mateixos que no tenen cap forat cap enfora.

El repositori de drop és privat de moment. Quan la verificació externa estigui feta i hagi pensat què en puc compartir, li afegiré el seu lloc a la secció de projectes.
