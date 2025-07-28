
---
title: "Autenticació i seguretat a les aplicacions web"
description: "Com protegir els teus tokens d'accés i de refresc amb HTTP Only Cookies i encriptació"
date: 2025-07-27
---

Avui toca parlar de seguretat. Un dels últims projectes on he treballat tenia estandard de seguretat empresarial, i em va tocar revisar la part d'autenticació. I sí, alguns dèien allò de "és una eina interna, no cal tanta seguretat". Aquí explico com millorar la seguretat dels _access tokens_ i _refresh tokens_ a les aplicacions web.

## El problema inicial: la vulnerabilitat dels tokens a JavaScript

Com fem molts, vam començar amb una solució senzilla. Enviar i guardar els tokens d'accés i de refresc al client, accessibles via JavaScript. Això facilita molt la implementació, però també obre la porta a un munt de problemes de seguretat. Si un atacant aconsegueix injectar codi JavaScript maliciós a la nostra aplicació, pot robar els nostres tokens i fer el que vulgui amb ells. I si els guardem al `localStorage`, encara pitjor: es queden allà per sempre, accessibles fins i tot després de tancar el navegador.

## La solució: les HTTP Only Cookies!

Després d'avaluar les opcions, la solució estava clara: moure els nostres tokens a les cookies. Concretament "HTTP Only Cookies". Això ja és un gran avanç, perquè la propietat `HttpOnly` fa que el JavaScript no pugui llegir la cookie, protegint-nos molt millor dels atacs XSS.

Però la cosa no s'atura aquí. Val la pena afegir el següent:

* **`Secure`**: Aquesta propietat assegura que la cookie només s'enviarà a través de connexions xifrades (HTTPS). Imprescindible per evitar que algú intercepti els nostres tokens en trànsit.
* **`SameSite=Strict`**: Aquesta és la clau per lluitar contra els atacs de Cross-Site Request Forgery (CSRF). Amb `Strict`, el navegador només enviarà la cookie si la sol·licitud prové del mateix lloc web que la va originar. Adéu, peticions falsificades!

Per cert, el projecte on estava requeria cross-domain en algunes parts, així que vam haver de fer servir `SameSite=Lax` en comptes de `Strict`. Això permet certes redireccions entre dominis, però encara manté una bona protecció contra CSRF.

## Anant un pas més enllà: l'encriptació dels tokens

Amb les HTTP Only, Secure i SameSite=Strict cookies ja estàvem més tranquils. Però calia un pas més: encriptar els tokens d'accés *abans* de guardar-los a la cookie!

Per què aquest "extra mile"? Doncs perquè, fins i tot amb tot l'anterior, un token robat (potser des d'una aplicació mòbil) podria ser re-utilitzat en altres serveis. Encriptant-los, si un token es filtra, només es podrà utilitzar amb el servei que el va emetre. Això redueix dràsticament l'impacte d'un possible atac de "replay". La seguretat no és mai suficient!

## Rotació de tokens: la darrera línia de defensa

Més enllà de l'encriptació, implementar rotació automàtica de refresh tokens redueix la finestra d'oportunitat per atacants. Cada cop que s'utilitza un refresh token, se'n genera un de nou i s'invalida l'anterior.

A més cal afegir una data d'expiració als access tokens. Així, si un atacant aconsegueix robar un access token, només tindrà accés durant un temps limitat. I si el refresh token també té una data d'expiració, encara millor!

## La implementació delegada

Amb tot aquesta teoria, la implementació calia modificar tant el client com el servidor. Com sempre dic, el core del nostres projectes no és l'autenticació, però és fonamental que estigui ben implementada. 

Així que es pot delegar la responsabilitat de la gestió d'autenticació al projecte [oauth2-proxy](https://oauth2-proxy.github.io/oauth2-proxy/), que és un projecte open source que implementa OAuth2 i OpenID Connect. Això ens permet centrar-nos en la nostra aplicació sense preocupar-nos de la seguretat de l'autenticació.

Emparellat amb una instància de Redis per emmagatzemar els tokens, encripta i envia, i rep i desencripta els tokens sense problemes. Així, el client només ha de preocupar-se d'enviar les cookies correctes i gestionar l'estat de la sessió.

## Punts complementaris per una autenticació top

Més enllà del que hem implementat, hi ha altres coses que, com bons enginyers, tenim a la llista per seguir millorant la nostra seguretat. Aquí en teniu alguns exemples que he après:

* Autenticació Multifactor (MFA).
* Polítiques de contrasenyes robustes.
* Ús de funcions de hash fortes per a les contrasenyes.
* Límit d'intents fallits i bloqueig de comptes.
* Recuperació de contrasenyes segura.
* Gestió de sessions robusta (ID de sessió nous després de l'inici de sessió, invalidació en tancar sessió).
* Gestió d'identitats i accessos (IAM) centralitzada amb protocols estàndard (OAuth2, OpenID Connect).

La seguretat és un viatge, no una destinació. Sempre hi ha coses per aprendre i millorar.