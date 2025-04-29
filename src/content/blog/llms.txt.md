---
title: "LLMS.txt"
description: "Com adherir-se a la tendència del llms.txt."
date: 2025-04-29
---

Com un `robots.txt` o `sitemap.xml` però per donar context a un LLM. Aquesta és la premisa del `llms.txt` que va proposar [Jeremy Howard](https://x.com/jeremyphoward/status/1905763202471989625) i [Stripe](https://x.com/jeremyphoward/status/1901796294257225857) ja ha implementat.

I això és el que he replicat en aquest web. De moment només hi copia el contingut del blog amb tots els posts, al moment de fer el build del projecte i servir a `/llms.txt`. 

Ho he pogut replicar aquí gràcies a aquest post d'[alexop.dev](https://alexop.dev/posts/how-i-added-llms-txt-to-my-astro-blog/) on hi dona sentit.

La idea és que puguis donar context a un LLM que facis servir i puguis preguntar sobre els teus posts, per exemple de quins temes parlo, resumeix, etc.

I amb [l'objectiu que tenia inicialment](/blog/perque-comencar/), que demà, les aranyes robots dels que entrenen models, puguin adoptar l'estandard i llegir fàcilment el meu blog.

[Web de l'estàndard](https://llmstxt.org)