# Grammar map v2: A1–B2 (all 40 stories)

Files: `map2.json` (machine-readable), `plan2.py` (source of the map), `build_map2.py` (applies the edits in memory, checks every `old` substring, protected lines and token counts against `stories/all-stories.json`, then writes map2.json) and `gen_md2.py` (writes this page). No story, card or quiz file was changed.

**How to read it**
- "line N" is the 0-based index into the story's `lines` array. Evidence marked `[after edit]` exists only once the proposed edit is applied.
- Counts are measured with a regex per topic (stored as `pattern` in map2.json) on the tag-free text. Kept B1/B2 topics reuse the verified evidence of `new-stories/map/map.json` (2 quotes re-worded to match the text as implemented: b2-04 line 7, b2-08 line 10).
- Status: **keep** = topic string unchanged; **introduces / recycles** = new slot. `role` in map2.json gives introduces/recycles for every topic.
- Dedupe is counted on fine-grained *headline groups* (estar, time, tener, ir a, reflexives, tú commands, preterite/imperfect contrast …), the units the audits counted. The 15 families of categories.json are too coarse for this (one family holds gustar, ir a, querer, tener que and the future). Both views are tabled below.
- Every edit replaces text inside one line: line count, plot and `<b>` markup are unchanged. No edited line is quoted by an example of a topic that stays on that story (the `protected_lines` list per story).

**Totals:** 126 topic slots (A1 31, A2 30, B1 33, B2 32); **26 edits in 15 stories** (a1-07, a1-08, a1-09, a2-03, a2-04, a2-05, a2-06, a2-08, a2-10, b1-03, b1-05, b1-06, b1-09, b1-10, b2-04); every story has 3–4 topics; every topic has ≥3 verified tokens after edits; no headline group is in more than 2 stories of a level or more than 3 across A1+A2. Build check: 0 problems.

## A1 map

| Story | Topics after (status · tokens now→after edits) | Dropped | Edits |
|---|---|---|---|
| a1-01 ¿Dónde está el flan? | **Telling time: Son las…** (kept · introduces · 3)<br>**Hay: there is / there are** (kept · introduces · 3)<br>**Estar for location and feelings** (kept · introduces · 3) | Present tense and tener | – |
| a1-02 La comanda de la mesa seis | **Ser for days, prices, descriptions** (kept · introduces · 4)<br>**Gustar: liking things** (kept · introduces · 3)<br>**Personal a before people** (kept · introduces · 3) | Tener: having things | – |
| a1-03 La niña nueva | **Ser vs. estar** (kept · introduces · 4)<br>**Gustar to say what you like** (kept · recycles · 3)<br>**Tener: possession and hunger** (kept · introduces · 5) | Telling time: son las / a las | – |
| a1-04 La torta de la ventana | **Colors: agreement and position** (kept · introduces · 10)<br>**Querer and poder + infinitive** (kept · introduces · 3)<br>**Negatives with no** (kept · introduces · 4) | Ir a + place; ¿Dónde está…? and porque | – |
| a1-05 Churros a las nueve | **Querer, necesitar, poder + infinitive** (kept · recycles · 4)<br>**Ir: voy a + place** (kept · introduces · 3)<br>**Numbers and prices: ¿Cuánto es?** (NEW · introduces · 4) | Hay and no hay; Time with a las | – |
| a1-06 Una mesa para todos | **Reflexive verbs** (kept · introduces · 5)<br>**Present tense: yo form** (kept · introduces · 4)<br>**Possessives: mi, su** (NEW · introduces · 5) | Estar for location; Me gusta | – |
| a1-07 La llama del camino | **Hay: there is / there are** (kept · recycles · 7)<br>**Reflexive: se sienta, se llama** (kept · recycles · 6)<br>**Muy and mucho** (NEW · introduces · 2→4) | Estar for place and state; Present tense with vivir and leer | 2 |
| a1-08 El mapa del coco | **Tener que + infinitive** (kept · introduces · 3→4)<br>**Comparing with más … que** (kept · introduces · 5)<br>**Tener: age and having** (kept · recycles · 6)<br>**¿Por qué? and porque** (kept · introduces · 4) | – | 1 |
| a1-09 Una llamada de viernes | **Ir a + infinitive: the near future** (kept · introduces · 4)<br>**Question words** (kept · recycles · 5)<br>**Demonstratives: este, esta, estas** (NEW · introduces · 1→3) | Ser for time, estar for feelings; El sábado: on Saturday | 2 |
| a1-10 Un sábado en el mar | **Days and times of day** (kept · recycles · 5)<br>**Possessives: mi, tu, su** (kept · recycles · 3)<br>**Stem-changing verbs: quiere, encuentra** (NEW · introduces · 3) | Ir a + infinitive; Estar for location | – |

Notes for the cards:
- **a1-03:** No longer "introduces nothing new": first tener card (a1-01/a1-02 no longer headline it) and first ser/estar contrast.
- **a1-08:** The edit adds hay que next to tener que (gap: tener que/hay que); keep the topic string, add one hay que line to the card explanation.
- **a1-09:** a1-09 keeps ir a + infinitive; a1-10 no longer headlines it.

<details><summary>Why each topic was dropped</summary>

- a1-01 · *Present tense and tener*: tener is headlined in a1-03 (introduces) and a1-08 (recycles); regular present is in essentials-a1.
- a1-02 · *Tener: having things*: tener capped at 2 A1 stories (a1-03, a1-08).
- a1-03 · *Telling time: son las / a las*: time capped at 2 A1 stories (a1-01, a1-10); here only 2 tokens.
- a1-04 · *Ir a + place*: ir a capped (a1-05 place, a1-09 infinitive, a2-01).
- a1-04 · *¿Dónde está…? and porque*: questions/porque headlined in a1-08 and a1-09; estar location in a1-01/a1-03; also cuts a1-04 from 5 topics to 3.
- a1-05 · *Hay and no hay*: hay capped at 2 (a1-01, a1-07).
- a1-05 · *Time with a las*: time capped at 2 (a1-01, a1-10).
- a1-06 · *Estar for location*: estar capped at 2 (a1-01, a1-03).
- a1-06 · *Me gusta*: gustar capped at 2 in A1 (a1-02, a1-03); a2-03 takes gustar-type verbs.
- a1-07 · *Estar for place and state*: estar capped at 2 (a1-01, a1-03).
- a1-07 · *Present tense with vivir and leer*: present-tense slots: a1-06 (yo form) and a1-10 (stem-changers).
- a1-09 · *Ser for time, estar for feelings*: time and estar both over-taught; slot freed for demonstratives.
- a1-09 · *El sábado: on Saturday*: time capped at 2 A1 stories; overlaps a1-10 days.
- a1-10 · *Ir a + infinitive*: a1-09 and a1-10 both led on ir a; kept in a1-09.
- a1-10 · *Estar for location*: estar capped at 2 (a1-01, a1-03).

</details>

## A2 map

| Story | Topics after (status · tokens now→after edits) | Dropped | Edits |
|---|---|---|---|
| a2-01 El tren de las nueve | **Regular preterite: -ó and -ió** (kept · introduces · 21)<br>**Irregular preterite: vio, dijo** (kept · introduces · 5)<br>**Ir a + infinitive, and ir a + place** (kept · recycles · 3) | Reflexive verbs: se sentó, se casa | – |
| a2-02 La caja azul | **Tú commands: ve, busca, lleva** (kept · introduces · 4)<br>**Object pronouns: le dio, te lo regala** (kept · introduces · 3)<br>**Sequence and time words** (kept · introduces · 6) | Preterite of regular and irregular verbs | – |
| a2-03 El secreto de la abuela | **Irregular preterite: fue, puso, hice, dijo** (kept · recycles · 8→10)<br>**Ser vs estar** (kept · recycles · 6)<br>**Gustar-type verbs: faltar, encantar** (NEW · introduces · 3→4) | Regular preterite: cortó, cocinó, probó; Falta, lo siento, decirlo | 2 |
| a2-04 El penalti | **Imperfect for description and habit** (kept · introduces · 10)<br>**Background plus interruption** (kept · introduces · 3)<br>**Saber vs conocer** (NEW · introduces · 2→4) | Preterite for events, even irregular; Estar + gerund (ongoing action) | 2 |
| a2-05 Número equivocado | **Imperfect for scene-setting** (kept · recycles · 9)<br>**Estar + gerund** (kept · introduces · 2→3)<br>**Courtesy conditional: podría, te gustaría** (NEW · introduces · 0→3) | Preterite for sudden events; Reflexive verbs | 2 |
| a2-06 La lámpara de la abuela | **Tú commands with pronouns** (kept · recycles · 3)<br>**Por vs para: por la tarde, para ti** (NEW · introduces · 7)<br>**Simple future: dará, seré** (NEW · introduces · 0→3) | Object pronouns: le, la, gustar; Reflexives and ponerse a; Ir a + infinitive | 2 |
| a2-07 El músico de San Telmo | **Imperfect habit vs preterite event** (kept · recycles · 11)<br>**Indirect and double pronouns** (kept · recycles · 5)<br>**Comparatives: más ... que** (kept · recycles · 4) | Tú commands: ven, toma, toca | – |
| a2-08 La niebla en el valle | **Negative words: nadie, nada** (NEW · introduces · 2→3)<br>**Obligation: hay que, tener que, deber** (NEW · recycles · 0→3)<br>**Ustedes for "you all"** (NEW · introduces · 3) | Preterite vs imperfect; Tú commands; Reflexives and impersonal se; Comparatives and superlatives | 2 |
| a2-09 Un café, una camisa y una entrevista | **Present perfect: he/has/ha + participle** (kept · introduces · 3)<br>**Reflexives: se despertó, se vistió** (kept · recycles · 5)<br>**Usted vs tú** (kept · introduces · 7) | Preterite and imperfect together | – |
| a2-10 La noche de los faroles | **Comparatives and superlatives** (kept · recycles · 5)<br>**Perfect tenses: he visto, había aprendido** (kept · recycles · 3)<br>**Demonstratives: este, ese, aquel** (NEW · recycles · 3→4) | Preterite vs imperfect; Object pronouns: se lo, le, la | 1 |

Notes for the cards:
- **a2-01:** Card already teaches yo/tú endings (-é/-aste, -í/-iste) since the audit-2 patch; keep that text.
- **a2-03:** The kept irregular-preterite card now carries the essentials gap "irregular stems": puso (u), hice (i), dijo (j), tuve (u, after edit). Add the stem rule to the explanation.
- **a2-04:** saber vs conocer: sé (fact), supiste (found out), conozco/conocían (people). The old "Preterite for events" examples (puso, supiste, quise) stay in the text.
- **a2-06:** Future card contrasts ir a (Vamos a subir, Voy a comprar: plans) with simple future (te dará, estaré, seré: promise/prediction).
- **a2-08:** Was the story with no new grammar. Now: negative words, obligation (hay que/deber/tener que), and ustedes as plural "you" (no vosotros in Colombia).
- **a2-10:** este pueblo / esta vez (here-now), ese año (that), aquella noche (distant past, after edit).

<details><summary>Why each topic was dropped</summary>

- a2-01 · *Reflexive verbs: se sentó, se casa*: reflexives capped at 3 across A1+A2 (a1-06, a1-07, a2-09).
- a2-02 · *Preterite of regular and irregular verbs*: preterite forms headlined in a2-01 (introduces) and a2-03 (irregular stems).
- a2-03 · *Regular preterite: cortó, cocinó, probó*: regular preterite is a2-01; a2-03 keeps the irregular/stem card.
- a2-03 · *Falta, lo siento, decirlo*: replaced by the gustar-type card, which keeps the falta material.
- a2-04 · *Preterite for events, even irregular*: preterite forms capped at 2 (a2-01, a2-03); slot freed for saber vs conocer (supiste/conozco already in the text).
- a2-04 · *Estar + gerund (ongoing action)*: only 2 tokens here; topic kept in a2-05 (3 after edit).
- a2-05 · *Preterite for sudden events*: pret/impf contrast capped at 2 (a2-04, a2-07).
- a2-05 · *Reflexive verbs*: reflexives capped (kept in a2-09 only at A2).
- a2-06 · *Object pronouns: le, la, gustar*: object pronouns capped at 2 (a2-02, a2-07).
- a2-06 · *Reflexives and ponerse a*: reflexives capped.
- a2-06 · *Ir a + infinitive*: ir a capped at 3 across A1+A2 (a1-05, a1-09, a2-01); the card keeps ir a as the contrast for the future.
- a2-07 · *Tú commands: ven, toma, toca*: tú commands capped at 2 (a2-02, a2-06); also removes the tú/vos clash with the voseo role-play.
- a2-08 · *Preterite vs imperfect*: pret/impf contrast capped at 2.
- a2-08 · *Tú commands*: tú commands capped at 2.
- a2-08 · *Reflexives and impersonal se*: reflexives capped; impersonal se is introduced in b1-04.
- a2-08 · *Comparatives and superlatives*: comparatives capped at 3 across A1+A2 (a1-08, a2-07, a2-10).
- a2-09 · *Preterite and imperfect together*: pret/impf contrast capped at 2.
- a2-10 · *Preterite vs imperfect*: pret/impf contrast capped at 2.
- a2-10 · *Object pronouns: se lo, le, la*: object pronouns capped at 2.

</details>

## B1 map

| Story | Topics after (status · tokens now→after edits) | Dropped | Edits |
|---|---|---|---|
| b1-01 La cartera verde | **Preterite vs. imperfect** (kept · recycles · 6)<br>**Present perfect vs. preterite** (kept · introduces · 4)<br>**Pluperfect for earlier events** (kept · introduces · 4)<br>**Future in the past** (kept · introduces · 3) | – | – |
| b1-02 El chivito de la tormenta | **Future tense** (kept · introduces · 9)<br>**Si-clauses with present** (kept · introduces · 5)<br>**Object pronoun order: se lo, te la** (kept · introduces · 3) | – | – |
| b1-03 El horno de doña Remedios | **Conditional tense** (kept · introduces · 3)<br>**Present perfect vs. preterite** (kept · recycles · 4)<br>**Relative clauses: que, en que** (kept · introduces · 8)<br>**Ser and estar: listo, rico** (NEW · introduces · 1→3) | – | 2 |
| b1-04 El paciente de la habitación 12 | **Impersonal se: se puede, se cura** (kept · introduces · 3)<br>**Verb phrases: llevar + gerund, seguir, volver a** (kept · introduces · 3)<br>**Pluperfect for background** (kept · recycles · 7) | – | – |
| b1-05 Dos ruedas junto al mar | **Por vs. para** (kept · introduces · 9)<br>**Conditional tense** (kept · recycles · 5)<br>**Reported speech** (kept · introduces · 3)<br>**Connectors: por eso, así que, a pesar de** (NEW · introduces · 4→5) | – | 1 |
| b1-06 La foto del desván | **Subjunctive after opinion and wish** (kept · introduces · 4)<br>**Negative commands** (kept · introduces · 3)<br>**Acabar de and dejar de** (NEW · recycles · 2→4) | Reported speech | 1 |
| b1-07 Los zapatos que hablaban | **Commands** (kept · introduces · 10)<br>**Present subjunctive after wishes** (kept · introduces · 3)<br>**Subjunctive after para que, antes de que** (kept · introduces · 3) | – | – |
| b1-08 La última tiza | **Si + imperfect subjunctive + conditional** (kept · introduces · 3)<br>**Subjunctive after cuando, aunque, ojalá** (kept · introduces · 3)<br>**Relative clauses: donde, que, lo que** (kept · recycles · 6) | – | – |
| b1-09 Una noche sin luz | **Reported commands** (kept · introduces · 3)<br>**Verbs of change: ponerse, quedarse, convertirse** (kept · introduces · 3)<br>**Accidental se: se le olvidó, se le acabó** (NEW · introduces · 0→3) | Commands with ustedes and usted | 2 |
| b1-10 La mano que toca | **Passive and impersonal se** (kept · introduces · 3)<br>**Por vs. para** (kept · recycles · 6)<br>**Future of probability: ¿será…?** (NEW · introduces · 0→3) | Subjunctive after wishes and hasta que | 2 |

Notes for the cards:
- **b1-05:** Por eso (line 0) is also por/para evidence; the connectors card should treat it as a fixed connector.
- **b1-10:** Real future (verás, mandaré, encontraremos, iré) sits next to the probability future (será, vivirá) in the same story.

<details><summary>Why each topic was dropped</summary>

- b1-06 · *Reported speech*: reported speech/commands headlined in b1-05 and b1-09; third B1 slot.
- b1-09 · *Commands with ustedes and usted*: commands headlined in b1-06 (negative) and b1-07 (full system, already with usted/ustedes forms); third B1 slot.
- b1-10 · *Subjunctive after wishes and hasta que*: wish-subjunctive headlined in b1-06 and b1-07; hasta que occurs only once here.

</details>

## B2 map

| Story | Topics after (status · tokens now→after edits) | Dropped | Edits |
|---|---|---|---|
| b2-01 La carta sin sello | **Subjunctive after conjunctions (para que, sin que, antes de que...)** (kept · introduces · 4)<br>**Aunque: indicative vs subjunctive** (kept · introduces · 4)<br>**Si + imperfect subjunctive, conditional** (kept · recycles · 6) | – | – |
| b2-02 El horno del patio | **Concession: aunque, por mucho que** (kept · introduces · 4)<br>**Verb phrases: seguir, acabar + gerund; soler** (kept · introduces · 5)<br>**Subjunctive after no es que, temer que, a que** (kept · introduces · 4) | – | – |
| b2-03 La mochila equivocada | **Como si + imperfect subjunctive** (kept · introduces · 4)<br>**Passive: ser + participle and se** (kept · introduces · 8)<br>**Imperfect subjunctive in subordinate clauses** (kept · introduces · 4) | – | – |
| b2-04 Una frase de más | **Indicative vs subjunctive: opinion, doubt and emotion** (kept · introduces · 5)<br>**Discourse markers: sin embargo, en cambio, en cuanto a** (kept · introduces · 5)<br>**Ojalá and como si with pluperfect** (kept · introduces · 3)<br>**Mixed conditionals: si hubiera…, ahora sería** (NEW · introduces · 1→3) | – | 2 |
| b2-05 Lo que nadie vio en Corrientes | **Si + pluperfect subjunctive, conditional perfect** (kept · introduces · 5)<br>**Reported speech with tense shifts** (kept · introduces · 8)<br>**Ojalá and aunque + pluperfect subjunctive** (kept · introduces · 4) | – | – |
| b2-06 El reloj de las cuatro y diez | **Estar + participle: resulting state** (kept · introduces · 4)<br>**Reported speech with tense shifts** (kept · recycles · 6)<br>**Subjunctive in time clauses: cuando, hasta que, mientras** (kept · introduces · 4)<br>**Verb + preposition: depender de, pensar en** (NEW · introduces · 5) | – | – |
| b2-07 Lo de siempre | **Cleft sentences** (kept · introduces · 5)<br>**Si + pluperfect subjunctive, conditional perfect** (kept · recycles · 3)<br>**Verb phrases: llevar + gerund, llevar sin, ir + gerund** (kept · introduces · 6) | – | – |
| b2-08 La segunda parte del juramento | **Verbs of change: volverse, hacerse, convertirse** (kept · introduces · 3)<br>**Relative clauses with prepositions; cuyo** (kept · introduces · 5)<br>**Lo + adjective and lo + adjective + que** (kept · introduces · 3) | – | – |
| b2-09 Sin novedad en la sala siete | **Subjunctive in relative clauses** (kept · introduces · 3)<br>**Discourse markers: ahora bien, de modo que, por cierto** (kept · recycles · 6)<br>**Conditional of conjecture** (kept · introduces · 3) | – | – |
| b2-10 Capitolio, 1938 | **Subjunctive: whatever, whoever** (kept · introduces · 4)<br>**Cleft sentences** (kept · recycles · 4)<br>**Conditional perfect of conjecture** (kept · recycles · 5) | – | – |

Notes for the cards:
- **b2-04:** Line 9 already contrasts mixed ("Si hubieras leído…, no me pedirías") with third conditional ("Si lo hubiera leído, quizá te habría pedido"): use both in the card.
- **b2-06:** Other verb + preposition tokens in B2 that can be recycled without a headline: b2-02 se dio cuenta de, tardaría en, se atreve a, renunció a.

## Headline slots per group, before → after

Number of stories that headline the group (before = current `grammar/<lv>.json`). Groups with no change at 1 are omitted.

| Group | A1 before → after (stories) | A2 before → after (stories) | A1+A2 |
|---|---|---|---|
| commands | 0 → 0 (–) | 4 ⚠ → 2 (02, 06) | 4 → 2 |
| comparatives | 1 → 1 (08) | 3 ⚠ → 2 (07, 10) | 4 → 3 |
| courtesy conditional | 0 → 0 (–) | 0 → 1 (05) | 0 → 1 |
| demonstratives | 0 → 1 (09) | 0 → 1 (10) | 0 → 2 |
| estar + gerund | 0 → 0 (–) | 2 → 1 (05) | 2 → 1 |
| formality | 0 → 0 (–) | 1 → 2 (08, 09) | 1 → 2 |
| future | 0 → 0 (–) | 0 → 1 (06) | 0 → 1 |
| gustar | 3 ⚠ → 2 (02, 03) | 0 → 1 (03) | 3 → 3 |
| hay | 3 ⚠ → 2 (01, 07) | 0 → 0 (–) | 3 → 2 |
| imperfect | 0 → 0 (–) | 2 → 2 (04, 05) | 2 → 2 |
| ir a | 4 ⚠ → 2 (05, 09) | 2 → 1 (01) | 6 → 3 |
| muy/mucho | 0 → 1 (07) | 0 → 0 (–) | 0 → 1 |
| negation | 1 → 1 (04) | 0 → 1 (08) | 1 → 2 |
| numbers/prices | 0 → 1 (05) | 0 → 0 (–) | 0 → 1 |
| object pronouns | 0 → 0 (–) | 5 ⚠ → 2 (02, 07) | 5 → 2 |
| obligation | 1 → 1 (08) | 0 → 1 (08) | 1 → 2 |
| perfect | 0 → 0 (–) | 2 → 2 (09, 10) | 2 → 2 |
| por/para | 0 → 0 (–) | 0 → 1 (06) | 0 → 1 |
| possessives | 1 → 2 (06, 10) | 0 → 0 (–) | 1 → 2 |
| present tense | 3 ⚠ → 2 (06, 10) | 0 → 0 (–) | 3 → 2 |
| pret vs impf | 0 → 0 (–) | 6 ⚠ → 2 (04, 07) | 6 → 2 |
| preterite forms | 0 → 0 (–) | 4 ⚠ → 2 (01, 03) | 4 → 2 |
| querer/poder | 2 → 2 (04, 05) | 0 → 0 (–) | 2 → 2 |
| questions | 3 ⚠ → 2 (08, 09) | 0 → 0 (–) | 3 → 2 |
| reflexive | 2 → 2 (06, 07) | 5 ⚠ → 1 (09) | 7 → 3 |
| saber/conocer | 0 → 0 (–) | 0 → 1 (04) | 0 → 1 |
| ser/estar | 6 ⚠ → 2 (01, 03) | 1 → 1 (03) | 7 → 3 |
| tener | 4 ⚠ → 2 (03, 08) | 0 → 0 (–) | 4 → 2 |
| time | 5 ⚠ → 2 (01, 10) | 1 → 1 (02) | 6 → 3 |

| Group | B1 before → after (stories) | B2 before → after (stories) |
|---|---|---|
| accidental se | 0 → 1 (09) | 0 → 0 (–) |
| clefts | 0 → 0 (–) | 2 → 2 (07, 10) |
| commands | 3 ⚠ → 2 (06, 07) | 0 → 0 (–) |
| concession | 0 → 0 (–) | 2 → 2 (01, 02) |
| conditional | 2 → 2 (03, 05) | 0 → 0 (–) |
| conjecture | 0 → 1 (10) | 2 → 2 (09, 10) |
| connectors | 0 → 1 (05) | 2 → 2 (04, 09) |
| impersonal/passive se | 2 → 2 (04, 10) | 0 → 0 (–) |
| mixed conditionals | 0 → 0 (–) | 0 → 1 (04) |
| pluperfect | 2 → 2 (01, 04) | 0 → 0 (–) |
| pluperfect subjunctive (ojalá/como si/aunque) | 0 → 0 (–) | 2 → 2 (04, 05) |
| por/para | 2 → 2 (05, 10) | 0 → 0 (–) |
| present perfect | 2 → 2 (01, 03) | 0 → 0 (–) |
| relatives | 2 → 2 (03, 08) | 1 → 1 (08) |
| reported speech | 3 ⚠ → 2 (05, 09) | 2 → 2 (05, 06) |
| ser/estar | 0 → 1 (03) | 1 → 1 (06) |
| si + pluperfect subjunctive | 0 → 0 (–) | 2 → 2 (05, 07) |
| subjunctive: conjunctions | 2 → 2 (07, 08) | 2 → 2 (01, 06) |
| subjunctive: noun clauses | 0 → 0 (–) | 2 → 2 (02, 04) |
| subjunctive: wish/opinion | 3 ⚠ → 2 (06, 07) | 0 → 0 (–) |
| verb + preposition | 0 → 0 (–) | 0 → 1 (06) |
| verb phrases | 1 → 2 (04, 06) | 2 → 2 (02, 07) |

⚠ = over the cap before (more than 2 stories per level). After: max 2 per level everywhere; max 3 across A1+A2 (time, ser/estar, gustar, ir a, reflexive, comparatives at exactly 3).

## Slots per categories.json family, before → after

| Family | A1 | A2 | B1 | B2 |
|---|---|---|---|---|
| Commands & formality | 0 → 0 | 5 → 4 | 3 → 2 | 0 → 0 |
| Comparing things | 1 → 1 | 3 → 2 | 0 → 0 | 0 → 0 |
| Conditionals & si-clauses | 0 → 0 | 0 → 1 | 5 → 6 | 5 → 6 |
| Passive voice | 0 → 0 | 0 → 0 | 0 → 0 | 1 → 1 |
| Past tenses | 0 → 0 | 14 → 7 | 1 → 1 | 1 → 1 |
| Perfect tenses | 0 → 0 | 2 → 2 | 4 → 4 | 0 → 0 |
| Por & para | 0 → 0 | 0 → 1 | 2 → 2 | 0 → 0 |
| Present tense & basics | 11 → 12 | 0 → 2 | 0 → 0 | 0 → 0 |
| Pronouns & personal a | 1 → 1 | 5 → 2 | 1 → 1 | 0 → 0 |
| Questions & negation | 4 → 3 | 0 → 1 | 0 → 0 | 0 → 0 |
| Reflexives & se | 2 → 2 | 5 → 1 | 3 → 4 | 1 → 1 |
| Relative clauses & connectors | 0 → 0 | 0 → 0 | 2 → 3 | 6 → 6 |
| Reported speech | 0 → 0 | 0 → 0 | 3 → 2 | 2 → 2 |
| Ser vs. estar | 7 → 3 | 1 → 1 | 0 → 1 | 1 → 1 |
| Subjunctive | 0 → 0 | 0 → 0 | 5 → 4 | 11 → 11 |
| Time & days | 5 → 2 | 1 → 1 | 0 → 0 | 0 → 0 |
| Verb phrases & near future | 10 → 7 | 4 → 5 | 2 → 3 | 2 → 3 |

## Gaps now covered

| Level | Gap | Story | Topic | Tokens now → after | Edits |
|---|---|---|---|---|---|
| A1 | muy vs mucho | a1-07 | Muy and mucho | 2 → 4 | 2 |
| A1 | demonstratives este/esta | a1-09 | Demonstratives: este, esta, estas | 1 → 3 | 2 |
| A1 | tener que / hay que | a1-08 | Tener que + infinitive | 3 → 4 | 1 |
| A1 | numbers / prices | a1-05 | Numbers and prices: ¿Cuánto es? | 4 → 4 | 0 |
| A2 | saber vs conocer | a2-04 | Saber vs conocer | 2 → 4 | 2 |
| A2 | demonstratives este/ese/aquel | a2-10 | Demonstratives: este, ese, aquel | 3 → 4 | 1 |
| A2 | courtesy conditional | a2-05 | Courtesy conditional: podría, te gustaría | 0 → 3 | 2 |
| A2 | simple future basics | a2-06 | Simple future: dará, seré | 0 → 3 | 2 |
| A2 | por vs para | a2-06 | Por vs para: por la tarde, para ti | 7 → 7 | 0 |
| A2 | gustar-type verbs | a2-03 | Gustar-type verbs: faltar, encantar | 3 → 4 | 1 |
| A2 | irregular preterite stems | a2-03 | Irregular preterite: fue, puso, hice, dijo | 8 → 10 | 1 |
| A2 | (essentials) negatives, obligation | a2-08 | Negative words: nadie, nada | 2 → 3 | 1 |
| B1 | accidental se | b1-09 | Accidental se: se le olvidó, se le acabó | 0 → 3 | 2 |
| B1 | connectors (sin embargo, por eso, a pesar de) | b1-05 | Connectors: por eso, así que, a pesar de | 4 → 5 | 1 |
| B1 | ser/estar with meaning change | b1-03 | Ser and estar: listo, rico | 1 → 3 | 2 |
| B1 | future of probability | b1-10 | Future of probability: ¿será…? | 0 → 3 | 2 |
| B1 | acabar de / dejar de | b1-06 | Acabar de and dejar de | 2 → 4 | 1 |
| B2 | verb + preposition | b2-06 | Verb + preposition: depender de, pensar en | 5 → 5 | 0 |
| B2 | mixed conditionals | b2-04 | Mixed conditionals: si hubiera…, ahora sería | 1 → 3 | 2 |

Also fixed from the audit findings:
- **a1-03** now introduces something: the first tener card and the first ser/estar contrast (a1-01/a1-02 no longer headline tener).
- **a1-09 / a1-10** no longer share ir a: a1-09 keeps it, a1-10 takes stem-changing verbs (quiere, encuentra; essentials-a1 topic).
- **a2-01** card already teaches yo/tú preterite endings (patched in audit 2); keep that text.
- **a2-08** (no new grammar before) now carries negative words, obligation (hay que, deber, tener que) and ustedes.
- **Por/para and gustar-type verbs** each get an A2 story card (a2-06, a2-03), not just the essentials deck.
- **B1 dedupe**: reported speech (b1-06), usted/ustedes commands (b1-09) and wish-subjunctive (b1-10) were third B1 slots; replaced by acabar de/dejar de, accidental se and the probability future. The rest of the B1/B2 map is unchanged (4th topics added in b1-03, b1-05, b2-04, b2-06).

## Partly covered or not covered

- **B2 estar + gerund / participle nuance**: no new slot (no room without dropping a working topic). Covered by b2-06 *Estar + participle: resulting state* (estaba parado, está roto) and A2 *Estar + gerund* (a2-05). The aspectual nuance (*está siendo*, *estar + gerund* for annoyance) is not headlined anywhere.
- **hay que** (A1) is folded into the kept a1-08 string *Tener que + infinitive* (1 token after edit + 3 tener que); add one line to the card explanation rather than a new string.
- **irregular preterite stems** (A2) ride on the kept a2-03 string: puso, hice, dijo, tuve (after edit). estuve/pude/vine are not in that story (pudo appears in a2-09, vine nowhere).
- **gustar-type**: faltar and encantar only; doler appears at B1 (b1-02 *me duele la rodilla*, b1-04 *¿Le duele algo?*), interesar nowhere.
- **aquel** has 1 token at A2 (a2-10, after edit); este/ese carry the card.
- **Ustedes** (a2-08) rests on exactly 3 tokens (Ustedes son, los está buscando, Los busqué).
- **Estar + gerund** (a2-05) has 3 tokens after edit; *estaba en su sala, tomando té* is a progressive with a locative in between.
- Still absent from story headlines (not requested here): present perfect subjunctive (haya + participle) and future perfect at B1/B2, as noted in map.md.

## All 26 edits

`old` occurs exactly once in the tag-free line (checked before and after the other edits of the same story). EN is the suggested replacement for the whole English line unless marked.

| Story | Line | Old (tag-free) | Suggested Spanish | Suggested English | For topic |
|---|---|---|---|---|---|
| a1-07 | 6 | quince —dice Killa. | quince. ¡Es muy vieja! —dice Killa. | "This is an Inca city from the fifteenth century. It's very old!" says Killa. | Muy and mucho |
| a1-07 | 7 | Marina está | Marina está muy | But today there are lots of clouds. Marina is very sad. | Muy and mucho |
| a1-08 | 6 | castillo de San Felipe. | castillo de San Felipe. ¡Hay que empezar allí! | They go to the huge San Felipe castle. They have to start there! | Tener que + infinitive |
| a1-09 | 20 | ¡Sorpresa! | ¡Sorpresa! Estas flores son para ti. | "Surprise! These flowers are for you. I'm going to spend the weekend here," he says. | Demonstratives: este, esta, estas |
| a1-09 | 22 | El sábado no va | Este sábado no va | This Saturday she is not going to be alone. | Demonstratives: este, esta, estas |
| a2-03 | 17 | —Tomé el autobús | —Tuve que tomar el autobús | "I had to take the six o'clock bus this morning," she said. "It's Sunday, and on Sundays we eat together." | Irregular preterite: fue, puso, hice, dijo |
| a2-03 | 27 | probó el plato y | probó el plato. —¡Me encanta! —dijo, y | Mateo's mother tasted the dish. "I love it!" she said, and cried with joy. | Gustar-type verbs: faltar, encantar |
| a2-04 | 5 | del campeonato del barrio. | del campeonato del barrio. Todos conocían a los dos hermanos. | Last Saturday, their teams played the final of the neighborhood championship. Everybody knew the two siblings. | Saber vs conocer |
| a2-04 | 13 | «Cuando éramos pequeños | «Yo sé adónde va a tirar: cuando éramos pequeños | "I know where she's going to kick: when we were little, she always kicked to the left," he thought. | Saber vs conocer |
| a2-05 | 9 | Ahora estoy solo en la calle | ¿Me podría ayudar? Ahora estoy esperando solo en la calle | "Sorry! My mom changed her number yesterday and I think I wrote it down wrong. Could you help me? I'm waiting alone in the street and my phone is almost out of battery." | Courtesy conditional: podría, te gustaría |
| a2-05 | 25 | ¿Quieres cenar con nosotros? | ¿Te gustaría cenar con nosotros? Podríamos pedir unas empanadas. | His mother looked at Valentina and smiled. "Thank you so much. Would you like to have dinner with us? We could order some empanadas." | Courtesy conditional: podría, te gustaría |
| a2-06 | 13 | Esta lámpara va a darte luz y alegría | Esta lámpara te dará luz y alegría, y yo siempre estaré contigo | Camila recognized her grandmother's handwriting. The letter said: "For your first home. This lamp will give you light and joy, and I will always be with you." | Simple future: dará, seré |
| a2-06 | 23 |  —pensó. | . Aquí seré feliz —pensó. | "Now I have a home. I'll be happy here," she thought. | Simple future: dará, seré |
| a2-08 | 14 | ¿Qué hacemos? | No veo nada. ¿Qué tenemos que hacer? | Andrés got nervous. "I can't see anything. What do we have to do? We're lost." | Negative words: nadie, nada |
| a2-08 | 6 | Si hay niebla, camina despacio y sigue el | Si hay niebla, hay que caminar despacio. Debes seguir el | "If there is fog, you have to walk slowly. You must follow the river," he explained to Andrés. "The important thing is not to run." | Obligation: hay que, tener que, deber |
| a2-10 | 23 | esa fue la mejor noche | aquella fue la mejor noche | She smiled with tears in her eyes. Although it rained the night before, that was the best night of her life. | Demonstratives: este, ese, aquel |
| b1-03 | 7 | Mientras tanto, Iván tenía una idea. | Mientras tanto, Iván, que siempre había sido muy listo, tenía una idea. | Meanwhile Iván, who had always been very clever, had an idea. The next morning he went out into the street with a notebook and began knocking on doors. He spoke with Señora Graciela, who had a big oven in her patio, with Don Chema, the butcher, and with the Santiago sisters, who made empanadas for the neighborhood parties. | Ser and estar: listo, rico |
| b1-03 | 10 | probando la masa. | probando la masa: en todas las cocinas estaba rica. | For three days, the whole neighborhood turned into a bakery. Remedios went from house to house tasting the dough: in every kitchen it was delicious. Although she was tired, she felt more supported than ever. | Ser and estar: listo, rico |
| b1-05 | 14 | vieron el cartel de Montañita, | vieron el cartel de Montañita, a pesar de estar | The last four days of the trip were nothing like the first. They pedaled side by side, took turns carrying the heavy bags and laughed at the most ridiculous falls. When they finally saw the sign for Montañita, despite being exhausted and sunburned, neither wanted the trip to end. | Connectors: por eso, así que, a pesar de |
| b1-06 | 12 | Mi padre lloró al ver esta foto. | Mi padre acaba de ver esta foto y no ha dejado de llorar. | The next day, Marisol's phone rang while she was putting away the plates. It was a message from a woman named Rocío: "My father has just seen this photo and hasn't stopped crying. He wrote to Lupe for years, but his letters never got a reply. He always thought she wanted nothing to do with him." | Acabar de and dejar de |
| b1-09 | 1 | Su computadora tenía poca batería, y ya había perdido media hora de trabajo porque no había guardado el archivo. | A su computadora se le estaba acabando la batería, y ya había perdido media hora de trabajo porque se le había olvidado guardar el archivo. | At seven o'clock sharp, a long thunderclap made the windows shake and all the lights went out at once. Soledad, an engineering student who was preparing for an exam the next day, let out a cry of rage. Her computer's battery was running out, and she had already lost half an hour of work because she had forgotten to save the file. | Accidental se: se le olvidó, se le acabó |
| b1-09 | 7 | —Mi congelador se va a descongelar | —Se me va a descongelar el congelador | "My freezer is going to defrost on me and I'm not going to waste so much food. I have rice, beans and chicken for twenty people. Somebody help me cook, because I can't do it alone." | Accidental se: se le olvidó, se le acabó |
| b1-10 | 8 | —¿Y qué es «la mano que toca»? ¿Alguien que toca la guitarra? | —¿Y qué será «la mano que toca»? ¿Será alguien que toca la guitarra? | They walked slowly. There were shops selling woven textiles, cafés and lots of wooden doors, all alike. After an hour, Itzel began to fear that the house was no longer there. "And what can 'the hand that knocks' be? Could it be someone who plays the guitar?" | Future of probability: ¿será…? |
| b1-10 | 10 | A Itzel el corazón le latía muy fuerte. | A Itzel el corazón le latía muy fuerte. ¿Quién vivirá aquí ahora? | Three houses further on they found a green door with a bronze hand and a sign: "Café La Pila." Itzel's heart was pounding. Who could be living here now? "You knock," said Bayron. "It's your story." | Future of probability: ¿será…? |
| b2-04 | 4 | —Matizar y falsear son vecinos muy cercanos, Ramiro. | —Matizar y falsear son vecinos muy cercanos, Ramiro. Si el autor hubiera querido matizar, no estaríamos hablando de esto. | (replace the last sentence of the English paragraph) "Nuancing and falsifying are very close neighbors, Ramiro. If the author had wanted to nuance it, we wouldn't be talking about this." | Mixed conditionals: si hubiera…, ahora sería |
| b2-04 | 5 | de aquellas líneas. | de aquellas líneas, y sabía que, si no las hubiera recibido, hoy sería una traductora muy distinta. | (replace the last sentence of the English paragraph) She could still feel the blush those lines had caused, and she knew that if she had not received them she would be a very different translator today. | Mixed conditionals: si hubiera…, ahora sería |

No `old` substring contains `<b>` markup, so each edit is a plain find-and-replace in the raw line and every bolded word stays bolded (checked: tag-free raw line after edit = tag-free line after edit). Where the line carries markup, `line_after_raw` in map2.json gives the full raw line after the edit.

## Topic strings to add to `grammar-quiz/categories.json`

- Numbers and prices: ¿Cuánto es? → Present tense & basics
- Possessives: mi, su → Present tense & basics
- Muy and mucho → Present tense & basics
- Demonstratives: este, esta, estas → Present tense & basics
- Stem-changing verbs: quiere, encuentra → Present tense & basics
- Gustar-type verbs: faltar, encantar → Verb phrases & near future
- Saber vs conocer → Present tense & basics
- Courtesy conditional: podría, te gustaría → Conditionals & si-clauses
- Por vs para: por la tarde, para ti → Por & para
- Simple future: dará, seré → Verb phrases & near future
- Negative words: nadie, nada → Questions & negation
- Obligation: hay que, tener que, deber → Verb phrases & near future
- Ustedes for "you all" → Commands & formality
- Demonstratives: este, ese, aquel → Present tense & basics
- Ser and estar: listo, rico → Ser vs. estar
- Connectors: por eso, así que, a pesar de → Relative clauses & connectors
- Acabar de and dejar de → Verb phrases & near future
- Accidental se: se le olvidó, se le acabó → Reflexives & se
- Future of probability: ¿será…? → Conditionals & si-clauses
- Mixed conditionals: si hubiera…, ahora sería → Conditionals & si-clauses
- Verb + preposition: depender de, pensar en → Verb phrases & near future

Each new topic needs a card in `grammar/<lv>.json` (explain + 3 examples quoted from the evidence lines) and grammar-quiz items. Dropped strings can stay in categories.json; their gq items should be re-anchored or retired.

**Dropped headline strings:** Commands with ustedes and usted; Comparatives and superlatives; El sábado: on Saturday; Estar + gerund (ongoing action); Estar for location; Estar for place and state; Falta, lo siento, decirlo; Hay and no hay; Ir a + infinitive; Ir a + place; Me gusta; Object pronouns: le, la, gustar; Object pronouns: se lo, le, la; Present tense and tener; Present tense with vivir and leer; Preterite and imperfect together; Preterite for events, even irregular; Preterite for sudden events; Preterite of regular and irregular verbs; Preterite vs imperfect; Reflexive verbs; Reflexive verbs: se sentó, se casa; Reflexives and impersonal se; Reflexives and ponerse a; Regular preterite: cortó, cocinó, probó; Reported speech; Ser for time, estar for feelings; Subjunctive after wishes and hasta que; Telling time: son las / a las; Tener: having things; Time with a las; Tú commands; Tú commands: ven, toma, toca; ¿Dónde está…? and porque.
