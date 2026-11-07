---
title: "El meu VPS invisible: guia de camp"
description: "Un tuit sobre tancar tots els ports d'un VPS em va fer l'auditoria. Escanejos des de fora, la trampa del loopback, el DNAT de Docker i la cursa sshd-tailscaled de l'arrencada."
date: 2026-11-07
draft: true
---

Un tuit d'en [Flavio Copes](https://x.com/flaviocopes) de dijous: *«Every open port on your VPS is being scanned right now. I closed all of them, even SSH»*. L'[article de Tailscale](https://flaviocopes.com/tailscale/) que l'acompanya explica com deixar un servidor sense cap port obert a internet i entrar-hi igualment, per una xarxa privada.

En comptes de seguir el tutorial com un receptari, em vaig fer la pregunta contrària: **si el tuit parlés del meu VPS, on hi seria jo?** Vaig agafar un dels meus servidors, un Ubuntu 24.04 amb Docker, túnels i serveis que corren de matinada, i li vaig fer l'auditoria sencera. Aquest post és la guia de camp del que vaig trobar i del que vaig arreglar, vàlid per a qualsevol VPS: tot el que hi ha aquí baix l'he executat contra una màquina real, amb la sortida real dels comandos.

## Primer, saber on ets

Abans de tancar res, cal saber què hi ha obert. Tres fonts, de la més immediata a la més incòmoda.

**Què escolta la màquina** (i en quina adreça):

```bash
ss -tulpn
```

La columna d'adreça ho és tot: `127.0.0.1` és local, la `100.x.y.z` és la IP de la tailnet de Tailscale, i `0.0.0.0` és «qualsevol que truqui». Aquesta última categoria és la que cal justificar una a una.

**Què deixa entrar el firewall**, amb les polítiques per defecte, que sovint valen més que les regles:

```bash
sudo ufw status verbose
```

Si la política d'entrada no és `deny`, aquest és el primer arreglet. A partir d'aquí, cada excepció hauria de tenir un motiu escrit al costat.

**Què veuen els altres.** El que tu veus localment i el que veu un escàner des de Bombai no són el mateix. Per escanejar des de fora sense muntar res, [check-host.net](https://check-host.net) té una API tan honesta com bruta:

```bash
# prova TCP des de nodes repartits pel món
curl -s -H 'Accept: application/json' \
  'https://check-host.net/check-tcp?host=203.0.113.10:22&max_nodes=3'
# ...i uns segons després, el resultat
curl -s -H 'Accept: application/json' \
  'https://check-host.net/check-result/<request_id>'
```

Quan el port està bé tancat, la resposta és una llista de `Connection timed out`: no hi ha ni rebuig, ni banner, ni res. Filtrat. La [InternetDB de Shodan](https://internetdb.shodan.io) també serveix per saber què han vist els seus escàners a la teva IP durant l'última setmana:

```bash
curl -s https://internetdb.shodan.io/203.0.113.10
```

## La trampa del loopback

Aquí vaig caure jo, i caigueren bé: des del mateix servidor, una prova contra la teva pròpia IP pública sempre sembla dir que els ports estan **oberts**, fins i tot amb el firewall denegant-ho tot:

```bash
timeout 5 bash -c 'echo > /dev/tcp/203.0.113.10/3200' && echo OBERT
OBERT
```

Fals positiu garantit: un paquet cap a una adreça pròpia no surt mai de la màquina, el kernel l'encamina per `lo`, i ufw — com tothom — accepta el trànsit de loopback incondicionalment. La prova contra la teva pròpia IP pública no prova res del que t'importa. **L'única evidència vàlida ve d'un node extern**, i d'aquí el check-host.net (que, per cert, limita les peticions anònimes: ves amb compte amb les ganes).

## El DNAT de Docker, la trampa de l'article

L'article en Flavio en posa una de bona: **ufw no veu Docker**. Quan un contenidor publica un port, és Docker qui esciu les regles de `nat` i aquestes no negocien amb ufw: pots tenir el firewall amb `deny incoming` i una base de dades publicada responent a internet.

La manera ràpida de saber si te'n cases és llegir els destins del DNAT:

```bash
sudo iptables -t nat -S DOCKER | grep DNAT
```

Cada línia diu a quina adreça local respon el contenidor. Si tot apunta a `127.0.0.1` o a una adreça privada teva, perfecte. **Si en veus cap amb `0.0.0.0` o la IP pública, aquest contenidor és públic**, t'agradi o no, i cap regla d'ufw el farà marxa enrere.

## Tot allò que escolta i ningú no pot explicar per què

Amb la sortida de `ss -tulpn` al davant, l'exercici honest és simple: per cada procés que escolta — sobretot els que ho fan a `0.0.0.0` — preguntar-se qui és i per què hi és. En un servidor que porta uns anys vivint sempre hi surten coses: un agent d'una plataforma que es va provar i es va abandonar, una eina d'administració que ja no s'obre ningú, un dimoni que la distro hi va posar «per si de cas». Es desinstal·len amb el seu gestor (`pm2 delete` i `npm uninstall -g`, `systemctl disable --now` i esborrar la unitat, el `snap remove` o l'`apt purge` que toqui).

El punt no és que siguin perillós **avui** amb el firewall ben posat: és que cada servei que ningú pot justificar és superfície d'atac esperant el dia que algú estriqui una regla, que un dimoni faci un bind que no toca o que un paquet amb una vulnerabilitat segueixi instal·lat anys després d'haver-lo deixat d'usar. **El servidor més segur és el que té menys coses**, i allò que no serveix sempre pot esdevenir un vector.

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

La cursa és aquesta: `ssh.service` només té `After=network.target`, però sshd escolta a una IP que **només existeix quan tailscaled configura la interfície**. Tailscaled es marca «ready» uns mil·lisegons abans d'assignar les adreces, sshd arriba, no pot fer el bind, i surt. I per si fos poc, la unitat d'Ubuntu porta `RestartPreventExitStatus=255`: el codi exacte d'aquest error queda **exclòs dels reintentos**. sshd mort fins a nova ordre.

La solució és un drop-in de systemd (`/etc/systemd/system/ssh.service.d/tailscale.conf`) que espera a que les IPs hi siguin de veritat:

```ini
[Unit]
After=tailscaled.service
Wants=tailscaled.service

[Service]
# esperar (màx 60s) a que tailscaled hagi assignat les IPs a tailscale0
ExecStartPre=/bin/sh -c 'n=0; until ip -4 addr show dev tailscale0 2>/dev/null | grep -q "inet 100." && ip -6 addr show dev tailscale0 2>/dev/null | grep -q "fd7a:115c:a1e0"; do n=$((n+1)); [ $n -ge 60 ] && exit 1; sleep 1; done'
# permetre reintentos també quan sshd surt amb 255 (bind fallit)
RestartPreventExitStatus=
RestartSec=3
```

`systemctl daemon-reload`, i el següent reinici ja és tranquil. La moral per a qui posa SSH només a la IP de la VPN: **prova un reboot d'assaig abans de donar-ho per tancat**, i recorda que la consola web del proveïdor és la teva xarxa de seguretat si alguna cosa d'això es gira.

## El que queda pendent

- Un **cloud firewall del proveïdor sense cap regla d'entrada** — la segona capa de l'article. Que trenqui tot a nivell de datacenter encara que algú estriqui ufw. El UDP 41641 de Tailscale no en pateix: ambdós costats fan dial-out, i un firewall stateful deixa passar el que és resposta d'una connexió establerta.
- L'**`apt upgrade` regular**: `unattended-upgrades` cobreix la seguretat de la distro, però els paquets de repositoris de tercers (Docker, per exemple) no hi caiguen mai.

## El resultat, per als escàners

Al final, des de nodes externs, cada port de la IP pública respon el mateix: `Connection timed out`. Ni rebuig ni banner ni res. L'única cosa oberta és el UDP de WireGuard, que és exactament el disseny: no és una porta, és una paret que només reconeix claus.

La guia de camp, en una llista:

```bash
ss -tulpn                          # què escolta, i en quina adreça
sudo ufw status verbose            # polítiques per defecte, no només regles
sudo iptables -t nat -S DOCKER | grep DNAT   # la trampa de Docker
curl -s https://internetdb.shodan.io/<la-teva-ip>        # què veuen els altres
# escaneig extern per port (check-host.net), i confiar només en això
```

I les dues regles que ho resumeixen: **cap servei a `0.0.0.0` que no sàpigues justificar** — i el que no serveix, fora — i tot el que és teu, SSH, panells i bases de dades, a la IP de la tailnet o a `127.0.0.1`. Gràcies a en Flavio per l'empenta.
