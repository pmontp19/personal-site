---
title: "El meu VPS invisible: guia de camp"
description: "Un tuit sobre tancar tots els ports d'un VPS em va fer l'auditoria. Escanejos des de fora, la trampa del loopback, el DNAT de Docker i la cursa sshd-tailscaled de l'arrencada."
date: 2026-11-07
draft: true
---

Un tuit d'en [Flavio Copes](https://x.com/flaviocopes) de dijous: *«Every open port on your VPS is being scanned right now. I closed all of them, even SSH»*. L'[article de Tailscale](https://flaviocopes.com/tailscale/) que l'acompanya explica com deixar un servidor sense cap port obert a internet i entrar-hi igualment, per una xarxa privada.

En comptes de seguir el tutorial com un receptari, em vaig fer la pregunta contrària: **si el tuit parlés del meu VPS, on seria jo?** Vaig agafar un dels meus servidors, un Ubuntu 24.04 amb Docker, túnels i serveis que corren de matinada, i li vaig fer l'auditoria sencera. Aquest post és la guia de camp del que hi vaig trobar i del que hi vaig corregir. Els passos es poden aplicar a qualsevol VPS, però els resultats que hi mostro són d'una màquina concreta: tot el que explico ho he comprovat, amb la sortida real de les ordres.

## Primer, saber on ets

Abans de tancar res, cal saber què hi ha obert. Tres fonts, de la més immediata a la més incòmoda.

**Què escolta la màquina** (i en quina adreça):

```bash
ss -tulpn
```

La columna d'adreça ho és tot: `127.0.0.1` és local, `100.x.y.z` és la IP de la tailnet de Tailscale, `0.0.0.0` vol dir «qualsevol adreça IPv4 local» i `::` (o `[::]`) indica escolta a totes les adreces IPv6. Cal justificar aquestes escoltes i comprovar per separat què és accessible des d'internet, tant per IPv4 com per IPv6.

**Què deixa entrar el firewall**, amb les polítiques per defecte, que sovint valen més que les regles:

```bash
sudo ufw status verbose
```

Si la política d'entrada no és `deny`, aquest és el primer canvi que cal fer. A partir d'aquí, cada excepció hauria de tenir un motiu escrit al costat.

**Què veuen els altres.** El que tu veus localment i el que veu un escàner des de Bombai no són el mateix. Per escanejar des de fora sense muntar res, [check-host.net](https://check-host.net) té una API tan honesta com bruta:

```bash
# prova TCP des de nodes repartits pel món
curl -s -H 'Accept: application/json' \
  'https://check-host.net/check-tcp?host=203.0.113.10:22&max_nodes=3'
# ...i uns segons després, el resultat
curl -s -H 'Accept: application/json' \
  'https://check-host.net/check-result/<request_id>'
```

Quan un node retorna `Connection timed out`, no ha rebut resposta abans que s'acabés el temps d'espera. Això és compatible amb un filtratge silenciós, però no demostra per si sol que el tallafoc del VPS n'hagi estat la causa; convé contrastar-ho des de més d'un node. La [InternetDB de Shodan](https://internetdb.shodan.io) és una altra consulta útil: la seva base de dades s'actualitza setmanalment amb informació recent, però el resultat no garanteix que aquella IP s'hagi escanejat durant l'última setmana.

```bash
curl -s https://internetdb.shodan.io/203.0.113.10
```

## La trampa del loopback

Aquí vaig caure jo. En la meva màquina, una prova des del mateix servidor contra la seva IP pública va indicar que el port estava **obert**, tot i que volia comprovar si era accessible des d'internet:

```bash
timeout 5 bash -c 'echo > /dev/tcp/203.0.113.10/3200' && echo OBERT
OBERT
```

Una connexió a la IP pròpia pot seguir una ruta local, segons com estiguin configurades les adreces i les rutes; en altres xarxes, el NAT de loopback del router també pot intervenir. Per això, que la connexió funcioni des del servidor no demostra que el port sigui accessible des d'internet. **Cal comprovar-ho des d'un node extern**, com ara check-host.net (que, per cert, limita les peticions anònimes: ves amb compte amb les ganes).

## El DNAT de Docker, la trampa de l'article

L'article d'en Flavio en posa una de bona: **les regles habituals d'ufw no sempre protegeixen els ports publicats per Docker**. Quan un contenidor publica un port, Docker crea regles de `nat` que poden desviar el trànsit abans que passi per les regles d'entrada d'ufw. Així, pots tenir `deny incoming` i, alhora, una base de dades publicada i accessible des d'internet.

Una primera pista és consultar les regles DNAT:

```bash
sudo iptables -t nat -S DOCKER | grep DNAT
```

Aquestes regles mostren quines adreces i ports del host es tradueixen als contenidors, però la sortida sola no sempre permet saber si un port és públic. Comprova també com s'ha publicat el port (`docker ps` o la configuració de Compose) i fes una prova des d'un node extern. Si el port s'ha publicat sense restringir l'adreça del host, Docker normalment l'exposa a totes les interfícies. En aquest cas, una regla d'ufw pot no ser suficient: limita la publicació o configura el filtratge a `DOCKER-USER` si Docker fa servir el backend d'iptables. Docker també pot fer servir nftables, on aquesta cadena no és l'opció aplicable.

## Tot allò que escolta i ningú no pot explicar per què

Amb la sortida de `ss -tulpn` al davant, l'exercici honest és simple: per cada procés que escolta — sobretot els que ho fan a `0.0.0.0` — preguntar-se qui és i per què hi és. En un servidor que porta uns anys vivint sempre hi surten coses: un agent d'una plataforma que es va provar i es va abandonar, una eina d'administració que ja no s'obre ningú, un dimoni que la distro hi va posar «per si de cas». Es desinstal·len amb el seu gestor (`pm2 delete` i `npm uninstall -g`, `systemctl disable --now` i esborrar la unitat, el `snap remove` o l'`apt purge` que toqui).

El punt no és que siguin perillosos **avui** amb el firewall ben posat, sinó que cada servei que ningú pot justificar amplia la superfície d'atac: una regla que s'obre per error, un dimoni que escolta en una interfície inesperada o un paquet vulnerable que continua instal·lat anys després d'haver-lo deixat d'usar. **El servidor més segur és el que té menys coses**, i allò que no serveix pot acabar esdevenint un vector d'atac.

## La cursa de l'arrencada (el descobriment valent)

La meva màquina ja complia la tesi de l'article per bona part: sshd no escoltava a la IP pública, sinó només a la de la tailnet:

```text
# /etc/ssh/sshd_config.d/ssh-tailscale.conf
ListenAddress 100.x.y.z
ListenAddress fd7a:115c:a1e0::133:fb4c
```

El kernel nou d'un `apt upgrade` demanava un reinici, i el reinici em va donar la lliçó del dia: **`ssh.service` mort a l'arrencada**.

```text
sshd[1174]: error: Bind to port 22 on 100.x.y.z failed: Cannot assign requested address.
sshd[1174]: fatal: Cannot bind any address.
```

La cursa és aquesta: `ssh.service` només té `After=network.target`, però sshd escolta en una IP que **només existeix quan tailscaled configura la interfície**. En el meu cas, el servei de Tailscale ja havia començat, però les adreces encara no estaven assignades quan sshd va intentar fer el bind; en no poder-lo fer, va sortir. A més, la unitat d'Ubuntu porta `RestartPreventExitStatus=255`: aquest codi de sortida queda **exclòs dels reintents**. Així, sshd es queda aturat fins que l'inicies de nou.

La solució és un drop-in de systemd (`/etc/systemd/system/ssh.service.d/tailscale.conf`) que espera que les adreces ja estiguin assignades:

```ini
[Unit]
After=tailscaled.service
Wants=tailscaled.service

[Service]
# esperar (màx. 60 s) que tailscaled hagi assignat les adreces a tailscale0
ExecStartPre=/bin/sh -c 'n=0; until ip -4 addr show dev tailscale0 2>/dev/null | grep -q "inet 100." && ip -6 addr show dev tailscale0 2>/dev/null | grep -q "fd7a:115c:a1e0"; do n=$((n+1)); [ $n -ge 60 ] && exit 1; sleep 1; done'
# permetre reintentos també quan sshd surt amb 255 (bind fallit)
RestartPreventExitStatus=
RestartSec=3
```

`systemctl daemon-reload`, i el següent reinici ja és tranquil. La moral per a qui posa SSH només a la IP de la VPN: **prova un reboot d'assaig abans de donar-ho per tancat**, i recorda que la consola web del proveïdor és la teva xarxa de seguretat si alguna cosa d'això es gira.

## Què queda pendent

- Un **tallafoc del proveïdor sense regles d'entrada**, com a segona capa. Això afegeix protecció si algú modifica ufw per error. Tailscale sol funcionar encara que el UDP 41641 estigui bloquejat, perquè pot recórrer als seus relays DERP; però sense trànsit UDP directe pot perdre rendiment. No donis per fet que qualsevol tallafoc deixarà passar el trànsit entrant només perquè els dos extrems iniciïn connexions de sortida.
- Fer **`apt upgrade` regularment**: `unattended-upgrades` cobreix les actualitzacions de seguretat configurades per a la distribució, però no necessàriament els paquets de tots els repositoris de tercers (com ara Docker).

## El resultat, per als escàners

Al final, les proves TCP que vaig fer des de nodes externs a la IP pública van retornar `Connection timed out`. Això és coherent amb un filtratge silenciós, tot i que el timeout, per si sol, no n'identifica la causa. Al meu cas, també tinc permesa l'entrada UDP al port de Tailscale per facilitar connexions directes. No és un servei TCP convencional: Tailscale pot fer servir un relay DERP quan no pot establir una connexió UDP directa.

La guia de camp, en una llista:

```bash
ss -tulpn                          # què escolta en IPv4 i IPv6, i en quina adreça
sudo ufw status verbose            # polítiques per defecte, no només regles
sudo iptables -t nat -S DOCKER | grep DNAT   # la trampa de Docker
curl -s https://internetdb.shodan.io/<la-teva-ip>        # què veuen els altres
# escaneig extern per port (check-host.net), i confiar només en això
```

I les dues regles que ho resumeixen: **cap servei escoltant a totes les interfícies que no sàpigues justificar** — i el que no serveix, fora — i els serveis privats, com SSH, panells i bases de dades, a la IP de la tailnet o a `127.0.0.1`. Gràcies a en Flavio per l'empenta.
