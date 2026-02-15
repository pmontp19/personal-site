---
title: "QA per a agents d'IA: on la visió es troba amb la realitat"
description: "Com validar programàticament que el teu agent d'IA ha completat una tasca, i el meu recorregut per trobar l'equilibri entre control i cost amb Playwright MCP, Chrome DevTools MCP i agent-browser de Vercel."
date: 2026-02-01
---

La fase de QA per als agents d'IA que programen és on la visió es troba amb la realitat, especialment per a tasques complexes de frontend. Validar programàticament (m'encanta aquesta paraula!) que el teu agent ha completat una tasca requereix més que un simple missatge de "èxit". 🎯

El meu recorregut automatitzant aquestes validacions ha estat una recerca de l'equilibri entre control i cost:

## Playwright MCP

El meu punt de partida. Potent, però exposar el conjunt complet d'eines va provocar un [consum massiu de tokens](https://testomat.io/blog/playwright-mcp-modern-test-automation-from-zero-to-hero/) i una complexitat innecessària perquè l'agent hi navegues. 💸

## Chrome DevTools MCP

Això semblava un superpoder. [Excel·leix en depurar problemes de rendiment](https://developer.chrome.com/blog/chrome-devtools-mcp) i sembla perfecte per al control granular. 🛠️

Segons el [repositori oficial](https://github.com/ChromeDevTools/chrome-devtools-mcp), permet analitzar peticions de xarxa, fer captures de pantalla i comprovar missatges de la consola del navegador amb stack traces mapejats al codi font.

## agent-browser de Vercel

Aquest és el meu punt dolç actual. [Increïblement eficient en tokens](https://github.com/vercel-labs/agent-browser). Tot i que li falten algunes de les funcions de DevTools, és més que suficient per a la majoria de validacions de frontend. 🏎️

[Reddit](https://www.reddit.com/r/nextjs/comments/1qbz5sf/vercels_agentbrowser_an_alternative_to/) ho explica bé: hi ha moltes maneres de donar control de navegador a un agent d'IA, però agent-browser és una alternativa més lleugera a Playwright.

[Pulumi](https://www.pulumi.com/blog/self-verifying-ai-agents-vercels-agent-browser-in-the-ralph-wiggum-loop/) ho descriu perfectament: l'automatització de navegador canvia les regles del joc. L'IA verifica la seva pròpia feina. Construeix un component, llança un navegador, prova la interacció, confirma el resultat.

## La màgia de veure un navegador operat automàticament

He de confessar que sempre hi ha un cert plaer en veure un navegador operat automàticament, és com màgia cada cop. 🪄

## No és una substitució

Bromes a part, això no és un reemplaçament per a la suite completa de tests, des de regressió visual i E2E fins a tests d'integració i unitaris. Ho veig com una altra eina perquè els agents verifiquin la seva feina, de la mateixa manera que jo testo les meves implementacions de forma "artesanal".
