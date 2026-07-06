---
title: "Incendis Catalunya: una integració de Home Assistant feta (gairebé) del tot amb agents d'IA"
description: "He construït i publicat ha-incendiscat, una integració de Home Assistant per seguir incendis forestals a Catalunya en temps real — i he desglossat quant m'ha costat en tokens fer-ho amb Claude Code i OpenCode."
date: 2026-07-06
---

L'estiu del 2021 un incendi va cremar durant dies entre la Ribera d'Ebre, la Terra Alta i el Priorat — un dels [incendis forestals](https://interior.gencat.cat/ca/incendis-forestals/inici/index.html) més grans que recordo a Catalunya. No és un fet aïllat: cada estiu el país viu sota l'amenaça del foc, i la resposta institucional (Bombers, Agents Rurals amb el Pla Alfa) genera dades públiques en temps real que gairebé ningú fa servir fora dels seus propis visors.

Jo tinc [Home Assistant](https://www.home-assistant.io/) a casa. Vaig pensar: per què no portar aquesta informació allà on ja miro l'estat de la meva llar?

## Home Assistant, en dues línies

Home Assistant és una plataforma d'automatització de la llar, de codi obert i local-first: centralitza sensors, dispositius i integracions de tercers, i deixa definir automacions ("si passa X, fes Y"). Cada font de dades s'hi connecta com una *integració*; jo n'he construït una de nova, distribuïble via [HACS](https://hacs.xyz/).

## Què fa Incendis Catalunya

`ha-incendiscat` connecta Home Assistant amb dues fonts públiques:

- El [visor d'actuacions](https://experience.arcgis.com/experience/f6172fd2d6974bc0a8c51e3a6bc2a735) dels Bombers de la Generalitat — incendis actius en temps real (ubicació, fase, vehicles desplegats).
- El [Pla Alfa](https://experience.arcgis.com/experience/2cf7ebbe492f401db826cb21eae9bfae) dels Agents Rurals — nivell de risc d'incendi diari (0-4) per municipi.

Amb això genera un mapa amb els focs actius, sensors agregats (nombre d'incendis, distància al més proper, vehicles desplegats, risc Pla Alfa), un `binary_sensor` que s'activa quan hi ha un incendi dins del teu radi d'alerta, events per enganxar-hi automacions, i un blueprint llest per rebre una notificació push al mòbil.

Cap de les dues fonts és una API oficial — són FeatureServers d'ArcGIS pensats per alimentar visors web, no per integrar-se en altres sistemes. Poden canviar d'esquema sense avís, així que bona part del disseny és tolerància a fallades: llegir camps amb valors per defecte, marcar el servei com a "degradat" després de tres errors seguits del mateix tipus, i no esborrar mai dades ja carregades.

## Com s'ha construït

Vaig començar pel que sol quedar-se pel camí: documents de disseny abans de codi. Vaig estudiar dues integracions HACS que ataquen el mateix problema en altres territoris — [`ha-wildfire-monitor`](https://github.com/johnbr/ha-wildfire-monitor) (Califòrnia, API REST de CAL FIRE) i [`ha-pyrovigil`](https://github.com/Duarte-Mercedes-Santos/ha-pyrovigil) (Portugal, el mateix patró ArcGIS FeatureServer que Catalunya) — i en vaig treure un pla de 16 tasques.

Cada tasca és un commit: model de dades i client ArcGIS, coordinador amb polling i events, sensors i binary_sensors, entitats de geolocalització per cada foc, flux de configuració en dos passos, client del Pla Alfa, entitats de diagnòstic, traduccions (ca/es/en), blueprint de notificació, README. Després, una ronda només d'enduriment: revisió de codi, hardening del client ArcGIS, neteja general.

El bug més interessant no va sortir de cap revisió, va sortir d'usar-ho de debò: vaig muntar una instància de Home Assistant aïllada per provar la integració abans d'instal·lar-la a casa, i allà vaig descobrir que la vista d'ArcGIS dels Bombers no permet detectar baixes de forma incremental — un incendi que es resol simplement deixa d'aparèixer, no queda marcat com a tancat. Vaig haver de canviar l'estratègia de sincronització a "descarregar-ho tot cada cicle i comparar amb l'anterior", perquè amb sincronització incremental un incendi resolt es quedava viu per sempre a Home Assistant.

També vaig canviar de nom a mitja implementació. El projecte es deia "Bombers de Catalunya" (domini `bomberscat`) i sonava com si fos l'app oficial del cos de bombers, quan l'objectiu real és alertar d'incendis forestals per a qui viu a prop. Domini, entitats, events i repositori de GitHub es van rebatejar a "Incendis Catalunya" (`incendiscat`). La carpeta de desenvolupament encara es diu `ha-bomberscat`; el nom real ja és un altre.

## Claude Code i OpenCode: quant costa fer això amb IA

Tot el codi d'aquest projecte l'he escrit conversant amb agents, no picant-lo línia a línia. Val la pena desglossar-ho perquè els números sorprenen.

[Claude Code](https://claude.com/claude-code) ha fet el gruix de la feina: 13 sessions repartides en 4 dies, gairebé totes amb Sonnet 5, amb Opus 4.8 puntualment per a un checklist de pre-llançament, un dubte semàntic sobre nivells de risc, i una revisió de codi. En total, **~138 milions de tokens** processats — però un **96% (~132M) són lectures de cache**: el codi i els docs ja escrits, rellegits a cada torn sense tornar-los a pagar sencers. Fora del cache, la feina real és ~570.000 tokens d'entrada nova, ~835.000 de sortida generada, i ~4,1M escrits a cache. A sobre, dos subagents de recerca puntuals (per estudiar CI/CD de referència i mapes tipus flightradar per mostrar els focs com una targeta).

[OpenCode](https://opencode.ai/) hi ha entrat només dues vegades, i amb un model gratuït (`nemotron-3-ultra-free`): un cop per netejar referències internes a "Task N" que havien quedat als docstrings (l'`AGENTS.md` del projecte demana explícitament no referenciar-les mai als comentaris, perquè el pla evoluciona i la referència queda òrfena), i un altre per mirar analítiques de la integració a HACS. En total, ~1,3 milions de tokens — pràcticament testimonial comparat amb Claude Code.

La feina de fons —les 16 tasques, el bug de sincronització trobat usant-ho de debò, el canvi de nom a mig camí— s'ha fet gairebé tota dins d'una conversa contínua amb Claude Code, on jo enviava captures de pantalla ("per què surt -1km?", "per què veig 0 incendis?") i l'agent iterava fins que la interfície feia el que tocava. OpenCode ha quedat per feina puntual i de baix risc. La lliçó no és quin agent és millor: és que el gruix del cost, en temps i en tokens, és la iteració amb l'ús real, no escriure la primera versió del codi.

---

Codi obert, llicència MIT, instal·lable via HACS: [github.com/pmontp19/ha-incendiscat](https://github.com/pmontp19/ha-incendiscat)

Si vius a prop d'una zona forestal, m'agradaria saber si la feu servir.
