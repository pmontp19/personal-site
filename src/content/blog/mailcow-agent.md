---
title: "mailcow-agent: l'API d'AgentMail sobre el meu propi servidor de correu"
description: "Per què he fet un servei que dona bústies de correu als agents sobre mailcow, per què copia l'API d'AgentMail en lloc d'inventar-ne una, i com l'especificació d'un altre va fer de revisor d'un projecte fet en poques hores amb un agent."
date: 2026-11-06
draft: false
hairline:
  name: bustia
  alt: "Un bloc de quinze bústies de replà, cadascuna amb una placa de punts que diu quina clau l'ha creada. En triar-ne una, només s'obren les bústies de la mateixa clau, amb una carta a dins; les altres queden tancades."
---

L'agent familiar de casa té una bústia pròpia per gestionar factures i notificacions de l'escola. De moment, només hi podem escriure la meva dona i jo: no vull que un correu de desconeguts li coli instruccions.

És un cas concret d'una necessitat cada cop més comuna: els agents han de poder donar-se d'alta a serveis, rebre codis de verificació, llegir factures o enviar-me resums. Donar-los la meva bústia no és una opció: un agent amb accés al meu correu ho pot llegir tot, i qualsevol que m'escrigui li pot donar instruccions.

[AgentMail](https://agentmail.to) resol això com a servei: una API per crear bústies per a agents, enviar, rebre i reaccionar amb webhooks. Està ben pensat, però les bústies viuen a la infraestructura d'un tercer. Jo ja tinc un servidor de correu, un [mailcow](https://mailcow.email), i la mateixa regla que a [pdrop](/blog/pdrop): **res surt a internet si no ho decideixo jo**. Així va néixer mailcow-agent.

**En resum**

- L'API és la d'AgentMail, copiada: els seus SDK, la CLI i el servidor MCP funcionen només canviant-los l'adreça.
- L'especificació d'AgentMail va fer de revisor, i va trobar errors que els tests de l'agent no veien.
- Cada agent té la seva clau, i només veu les bústies que ha creat ell. A la meva xarxa, fins i tot se la pot fer sol.

## Per què copiar una API

El primer impuls era fer una API pròpia, petita i a la meva mida. Hauria estat un error. Una API pròpia vol dir escriure els clients, la documentació i el servidor MCP, i que cap agent la conegui.

Copiar la d'AgentMail ho dona tot fet. El SDK de Python, el de TypeScript, el de Go, la CLI i el servidor MCP són oberts i accepten una URL base. Si el meu servei respon igual que AgentMail, tot això funciona sense tocar res:

```python
client = AgentMail(
    api_key="…",
    environment=AgentMailEnvironment(http="https://mailcow-agent.<tailnet>.ts.net", websockets=""),
)
inbox = client.inboxes.create(request=CreateInboxRequest(username="sales-bot"))
```

I l'avantatge més gran no era el codi estalviat: AgentMail publica l'especificació sencera, l'OpenAPI de l'API i l'AsyncAPI dels WebSockets. No calia decidir com havia de ser cada resposta. Ja estava escrit.

## Com és per dins

mailcow-agent és un sol procés de Python i un fitxer SQLite, al costat de mailcow. El correu de debò el continua fent mailcow: MX, filtre de correu brossa, DKIM, cues i TLS. El servei només hi afegeix la capa que parla amb els agents.

Crear una bústia és crear un compte de mailcow amb la seva API, i la puc obrir des del webmail com qualsevol altra. Rebre és IMAP: un fil per bústia escolta amb IDLE i emet `message.received`. Enviar és SMTP com la mateixa bústia. Els esdeveniments surten per webhooks signats com els d'AgentMail o per WebSocket, que és el que va millor a casa: l'agent obre la connexió i no cal cap URL pública. No hi ha Redis, ni Postgres, ni cap cua externa. Per a les bústies d'uns quants agents, SQLite en té de sobres.

El servei només escolta a la meva tailnet, la xarxa privada de [Tailscale](https://tailscale.com) on ja viuen els meus agents.

## L'especificació com a revisor

Ara els agents escriuen el codi i també els tests, i ja vaig explicar per què [la cobertura no és verificació](/blog/cobertura-no-es-verificacio). Aquí tenia una cosa millor que els tests de l'autor: un contracte escrit per algú altre.

Cada resposta dels tests es valida contra l'OpenAPI: codi d'estat, tipus de contingut i esquema JSON. Si un camp no hi és o té el tipus que no toca, el test falla, encara que el test no ho miri. Un altre test recorre les 149 operacions de l'especificació, i cadascuna o està implementada o és en una llista d'excepcions amb el motiu. N'hi ha 16; AgentID n'és un exemple, perquè depèn dels serveis d'AgentMail i no té sentit en un servidor propi.

Els tests de l'agent passaven tots. Llavors hi vam posar [Schemathesis](https://schemathesis.readthedocs.io), que genera peticions a partir de l'especificació i les llança contra cada operació. A la primera passada va trobar una adreça amb un salt de línia que injectava capçaleres i tombava el servei amb un error 500. També caràcters de control que trencaven la cerca, i dos `client_id` buits que es trepitjaven. Cap test els havia buscat, perquè cap test sabia que calia.

## Com ha anat

Tot el projecte va sortir d'una sola sessió de Claude Code al núvol, amb la manera de treballar que explicava a [com programo ara](/blog/com-programo-ara). En poques hores: 19 commits, unes 7.300 línies de codi i 3.500 de tests.

Primer vam aixecar el nucli —l'API i la compatibilitat amb MCP— i el vam passar per dues revisions, de seguretat i d'arquitectura. La de seguretat va partir d'una premissa concreta: qualsevol pot escriure a una bústia. Va trobar, entre altres coses, que un correu malformat podia aturar la sincronització i que es confiava en el `From`, una capçalera falsificable. Vam corregir els problemes i afegir un test de regressió per a cada un.

Després vaig fer un pla per a les peces que faltaven, amb els tests definits abans d'implementar-les. El vam repartir en quatre branques paral·leles: rebots, text dels adjunts, desplegament i claus per agent. En uns vint minuts vam integrar-les totes, tot i haver de resoldre conflictes en tres fitxers.

La decisió que més m'agrada del pla és una que diu que no. AgentMail ofereix accés per IMAP i SMTP, i el pla ho tenia dissenyat. Ho vaig ajornar: els meus agents fan servir el SDK o l'MCP, i si vull llegir la bústia d'un agent ja la tinc al webmail. Ho faré el dia que una eina que només parli IMAP ho necessiti.

## Una clau per agent

Aquí és on m'he separat d'AgentMail. A AgentMail, una clau d'organització pot crear bústies, però també les veu totes. Si li dono una d'aquestes claus a un agent perquè es creï la seva bústia, pot llegir el correu de tots els altres.

mailcow-agent hi afegeix les claus de provisió: poden crear bústies i claus, però només veuen les bústies que han creat elles o les seves claus filles. Per a les altres, la resposta és un 404. Cada agent té la seva clau a l'entorn i, en arrencar, demana la bústia amb un `client_id` fix. Cada execució obté la mateixa bústia, i mai la d'un altre agent.

Per explicar-ho als agents, cada instància serveix un `/skill.md`, com fa AgentMail, amb l'adreça del servidor ja posada: com autenticar-se, com obtenir la bústia, exemples amb els SDK i l'MCP, i unes regles de seguretat. N'hi ha prou amb donar a l'agent l'enllaç i una clau.

I si no vull que l'agent enviï res pel seu compte, una clau amb `draft_create` i sense `draft_send` ni `message_send` només pot deixar esborranys. És la manera més senzilla de posar una persona entre l'agent i el món.

## Que s'apuntin sols

Tot i això, encara m'havia de posar jo pel mig: crear una clau per a cada agent abans que pogués fer res. Quan ho vaig provar, no tenia gaire sentit. Són agents meus, a la meva xarxa, i soc jo qui els diu que es creïn una bústia quan necessitin enviar un correu.

AgentMail ja ho preveu: té una alta per a agents, `POST /v0/agent/sign-up`, que no demana cap clau. L'agent tria un nom i rep una clau i una bústia. Per evitar abusos, si hi ha una persona vinculada, l'agent només li pot escriure fins que ella el verifica amb un codi rebut per correu; sense cap persona vinculada, no pot enviar. A casa no em cal aquest pas: l'accés a la tailnet ja limita quins agents poden arribar al servei.

Així que mailcow-agent implementa la mateixa ruta, sense el codi. Està apagada per defecte, perquè si un dia el servei sortís a internet, qualsevol podria crear bústies al meu domini. L'agent rep una clau de provisió amb un límit de tres bústies, i el `/skill.md` li explica com fer-ho. Ara n'hi ha prou amb dir-li a un agent «llegeix el `/skill.md` i fes-te una bústia».

Per no perdre el fil de qui s'ha apuntat, hi ha una pàgina `/admin` que només obro jo. No cal ni la clau d'administrador: `tailscale serve` diu al servei qui fa la petició, i si soc jo, entro directament. Hi veig les bústies i les claus, qui ha creat cada una i quan s'han fet servir per última vegada, i en puc revocar una amb un clic. El correu de cada bústia no hi és: per llegir-lo, mailcow ja deixa a l'administrador entrar al webmail com si fos l'agent.

![La pàgina /admin de mailcow-agent amb dades de prova: cinc bústies d'agents a agents.montpeo.com amb els seus missatges, i les claus de provisió de cada agent, dues d'elles creades per l'alta autònoma.](/images/blog/mailcow-agent-admin.webp)

## Com el faig servir

Ara ja ho fan servir dos agents: el familiar, amb aquesta restricció de remitents, i el de genealogia, que també té la seva pròpia bústia.

Aquesta API va sortir en poques hores, i no perquè l'agent sigui ràpid, sinó perquè algú altre ja havia escrit el contracte i els tests el feien complir. Ara cada agent té la seva bústia al meu servidor, i cap no pot llegir la dels altres. La pròxima vegada que un agent necessiti una cosa nova, primer buscaré si algú ja n'ha escrit l'especificació.
