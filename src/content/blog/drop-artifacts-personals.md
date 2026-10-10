---
title: "drop: el meu Artifacts personal"
description: "Per què m'he fet un servei per publicar l'HTML que em generen els agents a una URL privada, com és per dins, com el va construir un equip d'agents i com el faig servir."
date: 2026-10-10
draft: true
hairline:
  name: versions
  alt: "Una safata amb sis versions idèntiques d'una pàgina web, dretes una darrere l'altra i lleugerament inclinades enrere; la del fons, la més nova, està aixecada per sobre de les altres i és l'única ressaltada."
---

Els agents em generen cada dia dashboards, infografies i petits informes en HTML. Amb els Artifacts de Claude Code és trivial: l'agent puja un fitxer i surt una URL privada, amb versions, sense aprovacions pel mig. El problema és que viu a la infraestructura d'un tercer i només serveix per a aquell agent.

Jo tinc més agents: al portàtil, a OpenClaw al servidor de casa, i els que vindran. Tots viuen a la meva tailnet, la xarxa privada de [Tailscale](https://tailscale.com) que uneix els meus dispositius. Volia el mateix model per a tots ells, a casa, amb una regla clara: **res surt a internet si no ho decideixo jo**. Així va néixer drop.

## Per què em va sorgir

Quan un agent em fa un informe, el vull veure al mòbil, el vull poder tornar a obrir la setmana vinent i, de tant en tant, el vull enviar a algú. Les dues primeres coses demanen que l'agent pugui deixar-lo en algun lloc sense preguntar-me res. La tercera demana just el contrari: que res surti a internet sense que jo ho hagi mirat.

Tot el disseny penja d'aquestes dues meitats: **l'agent puja sense demanar permís, i el que es publica a internet ho decideix un humà**. Per no embolicar-me, distingeixo dos verbs: *pujar* és deixar una versió privada dins la tailnet; *publicar* és fer-ne una còpia visible des de fora.

No em protegeixo d'un agent maliciós, sinó dels accidents: un agent que publica per un `--public` inventat, que canvia el que veu un tercer o que esborra una cosa per error. Un agent amb control del meu navegador pot fer el que faig jo, i ho accepto. Aquesta honestedat simplifica molt el disseny.

## Com és per dins

drop corre en un servidor amb tres peces:

- **L'ingest** és l'únic codi propi. Rep un `.html` o un `.zip`, el valida, el desa com a versió nova i retorna la URL.
- **Caddy** serveix els fitxers directament del disc, sense passar per codi meu. Si l'ingest cau, tot el que ja hi ha segueix viu. La zona privada només escolta a la IP de Tailscale; la pública surt per un túnel de Cloudflare.
- **Una UI** petita on veig els drops, en previsualitzo les versions i decideixo què es publica.

Cada pujada crea una versió nova i immutable (`v1`, `v2`, `v3`...), i un enllaç `current` apunta a la més recent. Si l'agent la fa malbé, torna a l'anterior. La clau és la publicació: la URL pública no apunta a `current`, sinó a una versió concreta. Una versió publicada no canvia sota els peus de qui la mira, encara que l'agent hi pugi deu versions més.

Hi ha dos tokens. El de l'agent pot pujar, llistar i tornar enrere. El meu, que només viu al navegador, és l'únic que pot publicar i esborrar. Quan un agent intenta una acció d'humà, rep un error que li diu que m'ho demani.

## Com ha anat

Abans d'escriure codi vaig fer revisar el document de disseny dues vegades: primer Claude i després un «oracle», un agent amb el model més gran que només llegeix. Entre les dues passades van sortir 61 punts. Dos eren greus: la zona privada només la protegia el DNS (qualsevol que conegués la IP del servidor hi podia arribar), i el meu token vivia en un fitxer que els agents podien llegir. Arreglar-ho va costar uns paràgrafs del document. Un cop implementat, hauria costat una migració.

La implementació la va fer un equip d'agents un dissabte al matí. Una sessió feia de manager: no escrivia codi, repartia la feina, verificava tests i lint, i feia els commits. Cada peça la construïa un agent i l'atacava un altre, un revisor que no havia vist el procés. En van sortir unes 8.400 línies i més de 300 tests.

El que més valor va aportar van ser els revisors. Van trobar errors que els tests de l'autor no veien: una URL pública que sobrevivia a l'esborrament del drop, pujades tallades que es quedaven penjades per sempre, o el mateix exemple de la documentació per als agents, que no funcionava. Els bons els van trobar executant coses, no llegint codi.

Encara no està acabat del tot. Comprovar des de fora que la zona privada no respon és feina meva: un agent que comprova la seva pròpia seguretat des de dins de la xarxa no demostra res. Ho faré amb el mòbil fora de casa.

## Com el faig servir

Als agents els dono el token d'agent i una línia de documentació. Quan acaben un informe, el pugen amb la CLI de drop i em retornen la URL. L'obro al mòbil o al portàtil, sempre dins la tailnet. Si l'agent el refà, la mateixa URL mostra la versió nova, i si la nova és pitjor, l'anterior encara hi és.

Quan vull compartir alguna cosa, obro la UI, la previsualitzo i la publico. Abans de publicar, drop hi busca coses que no haurien de sortir (emails, IBAN, claus d'API) i m'avisa. No és una garantia, és una segona mirada. La URL pública caduca sola, i la puc renovar o despublicar quan vulgui.

El resultat és el que buscava: els agents treballen sense demanar-me res, i jo només intervinc en l'únic moment que importa, quan alguna cosa surt a internet.
