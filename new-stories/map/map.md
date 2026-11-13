# B1/B2 grammar map: redesign

Files: `map.json` (machine-readable), `plan.py` (the source of the map), `build_map.py` (checks every quote and edit against `stories/all-stories.json`, then writes map.json) and `gen_md.py` (writes this page).

**How to read it:**
- "line N" is the 0-based index into the story's `lines` array. Each entry is a paragraph.
- An evidence quote marked `[after edit]` exists only once the proposed edit is applied.
- Every edit replaces text *within* one line, so line counts and plot are unchanged.
- `old` is the exact tag-free substring to replace. `old_raw` and `suggest_es_raw` keep the `<b>` vocab markup; two edits touch a bolded word, and in both the word is kept.

**Totals:** 20 stories, 61 topic slots (31 at B1, 30 at B2), and **18 edits in 12 stories** (b1-01, b1-02, b1-03, b1-04, b1-06, b1-07, b1-08, b1-09, b2-03, b2-04, b2-08, b2-09).
- Every topic now has at least 3 verified tokens.
- 48 of the 61 topic slots need no edit at all.
- No topic string is a headline in more than 2 stories per level.

## B1 map

| Story | Role | Target topics (status · tokens now → after edits) | Edits | Old topics |
|---|---|---|---|---|
| b1-01 La cartera verde | consolidates | **Preterite vs. imperfect** (recycled · 6→6)<br>**Present perfect vs. preterite** (introduces · 2→4)<br>**Pluperfect for earlier events** (introduces · 4→4)<br>**Future in the past** (introduces · 3→3) | 2 | Preterite vs. imperfect; Pluperfect for earlier events; Relative clauses: que, donde; Future in the past |
| b1-02 El chivito de la tormenta | consolidates | **Future tense** (introduces · 9→9)<br>**Si-clauses with present** (introduces · 5→5)<br>**Object pronoun order: se lo, te la** (introduces · 2→3) | 1 | Future tense; Pluperfect (había + participle); Reflexive verbs; Si-clauses with present |
| b1-03 El horno de doña Remedios | consolidates | **Conditional tense** (introduces · 2→3)<br>**Present perfect vs. preterite** (recycled · 4→4)<br>**Relative clauses: que, en que** (introduces · 8→8) | 1 | Si + imperfect subjunctive; Conditional tense; Pluperfect; Present perfect |
| b1-04 El paciente de la habitación 12 | introduces | **Impersonal se: se puede, se cura** (introduces · 3→3)<br>**Verb phrases: llevar + gerund, seguir, volver a** (introduces · 2→3)<br>**Pluperfect for background** (recycled · 7→7) | 1 | Pluperfect for background; Si + imperfect subjunctive + conditional; Relative clauses: donde, que, lo que; Imperfect vs. preterite |
| b1-05 Dos ruedas junto al mar | consolidates | **Por vs. para** (introduces · 9→9)<br>**Conditional tense** (recycled · 5→5)<br>**Reported speech** (introduces · 3→3) | – | Pluperfect; Hypotheticals about the past; Deber in the conditional; Si + imperfect subjunctive |
| b1-06 La foto del desván | introduces | **Subjunctive after opinion and wish** (introduces · 4→4)<br>**Negative commands** (introduces · 2→3)<br>**Reported speech** (recycled · 5→5) | 1 | Pluperfect; Reported speech; Subjunctive after opinion and wish; Negative commands |
| b1-07 Los zapatos que hablaban | introduces | **Commands** (introduces · 10→10)<br>**Present subjunctive after wishes** (introduces · 3→3)<br>**Subjunctive after para que, antes de que** (introduces · 1→3) | 2 | Present subjunctive after wishes; Commands; Reported commands; Conditional for speculation |
| b1-08 La última tiza | introduces | **Si + imperfect subjunctive + conditional** (introduces · 0→3)<br>**Subjunctive after cuando, aunque, ojalá** (introduces · 3→3)<br>**Relative clauses: donde, que, lo que** (recycled · 6→6) | 3 | Subjunctive after wishes and ojalá; Commands with ustedes and usted; Pluperfect; Reported speech |
| b1-09 Una noche sin luz | introduces | **Reported commands** (introduces · 2→3)<br>**Commands with ustedes and usted** (recycled · 3→3)<br>**Verbs of change: ponerse, quedarse, convertirse** (introduces · 3→3) | 1 | Subjunctive after quiero que; Indirect commands with que; Cuando + subjunctive for the future; Imperatives and ojalá |
| b1-10 La mano que toca | recycles | **Passive and impersonal se** (introduces · 3→3)<br>**Subjunctive after wishes and hasta que** (recycled · 4→4)<br>**Por vs. para** (recycled · 6→6) | – | Conditional sentences (si + present); Subjunctive after wishes and hasta que; Commands; Pluperfect and reported feeling |

**The B1 progression:**
1. **Consolidation (01–05).** Preterite/imperfect, the present perfect in Madrid (01) and again in Oaxaca (03), and the pluperfect (01, 04 only). Then the future and real si-clauses (02), the conditional (03, 05), relatives with que (03), impersonal se and verb phrases (04), and por/para (05). Reported speech gets a first look in 05.
2. **Subjunctive block (06–08).** Present subjunctive after wish, doubt and importance, linked to negative commands (06). Next comes the full command system with wishes, para que and antes de que (07). Hypothetical si + imperfect subjunctive arrives only after that (08), together with cuando, aunque and ojalá, and donde, lo que and quien relatives.
3. **Extension and recycling (09–10).** Reported commands, ustedes commands and verbs of change (09). Then passive se, subjunctive with hasta que, and por/para recycled (10).

**What changed against the audit findings:**
- The pluperfect is a headline in 2 stories, down from 8.
- The present perfect is a headline in 2, up from 1, and first appears in the Madrid story.
- si + imperfect subjunctive is a headline in 1 story, down from 3, and now comes after the present subjunctive.
- The past conditional (old b1-05) is no longer a B1 headline.
- The thin topics the audit flagged (b1-04 si-clause, b1-05 hypotheticals, b1-07 speculation and reported commands, b1-09 que + subjunctive, cuando and ojalá) are dropped or moved to stories that support them.
- b1-10 keeps "wishes and hasta que". Its 3+ count rests on the wish tokens, because hasta que itself occurs only once.

## B2 map

| Story | Role | Target topics (status · tokens now → after edits) | Edits | Old topics |
|---|---|---|---|---|
| b2-01 La carta sin sello | consolidates | **Subjunctive after conjunctions (para que, sin que, antes de que...)** (introduces · 4→4)<br>**Aunque: indicative vs subjunctive** (introduces · 4→4)<br>**Si + imperfect subjunctive, conditional** (recycled · 6→6) | – | Si + imperfect subjunctive, conditional; Aunque: indicative vs subjunctive; Por + adjective + que + subjunctive; Deber de for conjecture |
| b2-02 El horno del patio | consolidates | **Concession: aunque, por mucho que** (introduces · 4→4)<br>**Verb phrases: seguir, acabar + gerund; soler** (introduces · 5→5)<br>**Subjunctive after no es que, temer que, a que** (introduces · 4→4) | – | Como si + imperfect subjunctive; Si-clauses with imperfect subjunctive; Ojalá and por... que concessions; Ser vs estar with adjectives |
| b2-03 La mochila equivocada | introduces | **Como si + imperfect subjunctive** (introduces · 4→4)<br>**Passive: ser + participle and se** (introduces · 6→8)<br>**Imperfect subjunctive in subordinate clauses** (introduces · 4→4) | 2 | Imperfect subjunctive in subordinate clauses; Si + imperfect subjunctive, conditional; Passive se; Como si + imperfect subjunctive |
| b2-04 Una frase de más | introduces | **Indicative vs subjunctive: opinion, doubt and emotion** (introduces · 5→5)<br>**Discourse markers: sin embargo, en cambio, en cuanto a** (introduces · 5→5)<br>**Ojalá and como si with pluperfect** (introduces · 2→3) | 1 | Si + pluperfect subjunctive, conditional perfect; Ojalá and como si with pluperfect; Concession: aunque, por mucho que; Subjunctive after es posible que |
| b2-05 Lo que nadie vio en Corrientes | introduces | **Si + pluperfect subjunctive, conditional perfect** (introduces · 5→5)<br>**Reported speech with tense shifts** (introduces · 8→8)<br>**Ojalá and aunque + pluperfect subjunctive** (introduces · 4→4) | – | Si + pluperfect subjunctive, conditional perfect; Ojalá and aunque + pluperfect subjunctive; Impersonal and passive se; Reported speech: conditional as future |
| b2-06 El reloj de las cuatro y diez | consolidates | **Estar + participle: resulting state** (introduces · 4→4)<br>**Reported speech with tense shifts** (recycled · 6→6)<br>**Subjunctive in time clauses: cuando, hasta que, mientras** (introduces · 4→4) | – | Si + pluperfect subjunctive, conditional perfect; Reported speech and tense shifts; Subjunctive in time and relative clauses; Ser vs estar |
| b2-07 Lo de siempre | recycles | **Cleft sentences** (introduces · 5→5)<br>**Si + pluperfect subjunctive, conditional perfect** (recycled · 3→3)<br>**Verb phrases: llevar + gerund, llevar sin, ir + gerund** (introduces · 6→6) | – | Reported speech with tense shifts; Cleft sentences; Si + pluperfect subjunctive; Subjunctive after wishes, even if |
| b2-08 La segunda parte del juramento | introduces | **Verbs of change: volverse, hacerse, convertirse** (introduces · 3→3)<br>**Relative clauses with prepositions; cuyo** (introduces · 4→5)<br>**Lo + adjective and lo + adjective + que** (introduces · 2→3) | 2 | Pluperfect and reported speech; Cleft sentences; Si + pluperfect subjunctive, conditional perfect; Quien and lo que in relative clauses |
| b2-09 Sin novedad en la sala siete | introduces | **Subjunctive in relative clauses** (introduces · 3→3)<br>**Discourse markers: ahora bien, de modo que, por cierto** (recycled · 6→6)<br>**Conditional of conjecture** (introduces · 2→3) | 1 | Conditional of conjecture; Subjunctive in relative clauses; Si-clauses with pluperfect and imperfect subjunctive; Reported speech with tense shifts |
| b2-10 Capitolio, 1938 | recycles | **Subjunctive: whatever, whoever** (introduces · 4→4)<br>**Cleft sentences** (recycled · 4→4)<br>**Conditional perfect of conjecture** (recycled · 5→5) | – | Si + pluperfect subjunctive, conditional perfect; Cleft sentences; Conditional of conjecture; Subjunctive: whatever, whoever |

**The B2 progression:**
1. **Subjunctive consolidation (01–04).** Conjunctions (para que, sin que, hasta que) and aunque, with si + imperfect recycled once (01). Then por mucho que, verb phrases and no es que / temer que (02). Then como si, the ser and se passive, and the imperfect subjunctive after past triggers (03). Then opinion, doubt and emotion, contrast markers, and the pluperfect subjunctive *form* through ojalá and como si (04).
2. **Hypothetical past and reported speech (05–07).** si + pluperfect subjunctive with reported speech (05). estar + participle, reported speech and requests, and time clauses (06). Clefts, with si + pluperfect recycled, and llevar/ir + gerund (07).
3. **Advanced syntax (08–10).** Verbs of change, preposition + relative and cuyo, and lo + adjective (08). Relative subjunctive, discourse markers and conditional of conjecture (09). Reduplicated subjunctive (*diga lo que diga*), clefts and conjecture about the past (10).

**What changed against the audit findings:**
- si + pluperfect subjunctive is a headline in 2 stories, down from 7.
- Reported speech is a headline in 2, down from 5.
- si + imperfect subjunctive is a headline in 1, down from 3.
- como si is a headline in 1, down from 3.
- Clefts are a headline in 2, down from 3.
- Every area the audit listed as never covered now has a story: para que/sin que/antes de que (01), opinion and doubt (04), cuyo/preposition + relative (08), verbs of change (08), the ser passive (03), lo + adjective (08) and verb phrases (02, 07).

## Topic families

Every topic uses one of the 15 existing families, apart from **2 proposed new families**:
- **"Por & para"**: b1-05 and b1-10. None of the existing 15 families fits prepositions.
- **"Passive voice"**: b2-03, the ser + participle passive.

The passive is split on purpose:
- Passive and impersonal *se* stays under "Reflexives & se", as in categories.json today.
- estar + participle goes under "Ser vs. estar".

Family load: Subjunctive 16, Conditionals & si-clauses 10, Relative clauses & connectors 8, Reported speech 5, Perfect tenses 4, Verb phrases & near future 4, Reflexives & se 4, Commands & formality 3, Past tenses 2, Por & para 2, Pronouns & personal a 1, Passive voice 1, Ser vs. estar 1.

**Topic strings to add to `grammar-quiz/categories.json`** (string → family):
- Present perfect vs. preterite → Perfect tenses
- Object pronoun order: se lo, te la → Pronouns & personal a
- Relative clauses: que, en que → Relative clauses & connectors
- Impersonal se: se puede, se cura → Reflexives & se
- Verb phrases: llevar + gerund, seguir, volver a → Verb phrases & near future
- Por vs. para → Por & para
- Subjunctive after para que, antes de que → Subjunctive
- Subjunctive after cuando, aunque, ojalá → Subjunctive
- Verbs of change: ponerse, quedarse, convertirse → Reflexives & se
- Passive and impersonal se → Reflexives & se
- Subjunctive after conjunctions (para que, sin que, antes de que...) → Subjunctive
- Verb phrases: seguir, acabar + gerund; soler → Verb phrases & near future
- Subjunctive after no es que, temer que, a que → Subjunctive
- Passive: ser + participle and se → Passive voice
- Indicative vs subjunctive: opinion, doubt and emotion → Subjunctive
- Discourse markers: sin embargo, en cambio, en cuanto a → Relative clauses & connectors
- Estar + participle: resulting state → Ser vs. estar
- Subjunctive in time clauses: cuando, hasta que, mientras → Subjunctive
- Verb phrases: llevar + gerund, llevar sin, ir + gerund → Verb phrases & near future
- Verbs of change: volverse, hacerse, convertirse → Reflexives & se
- Relative clauses with prepositions; cuyo → Relative clauses & connectors
- Lo + adjective and lo + adjective + que → Relative clauses & connectors
- Discourse markers: ahora bien, de modo que, por cierto → Relative clauses & connectors
- Conditional perfect of conjecture → Conditionals & si-clauses

**Old B1/B2 topic strings no longer used as headlines.** Their quiz items and explanations need re-anchoring or retiring. The category keys can stay, since they are harmless:
- Conditional for speculation; Conditional sentences (si + present); Cuando + subjunctive for the future; Deber de for conjecture; Deber in the conditional; Hypotheticals about the past; Imperatives and ojalá; Imperfect vs. preterite; Impersonal and passive se; Indirect commands with que; Ojalá and por... que concessions; Passive se; Pluperfect; Pluperfect (había + participle); Pluperfect and reported feeling; Pluperfect and reported speech; Por + adjective + que + subjunctive; Present perfect; Quien and lo que in relative clauses; Reflexive verbs; Relative clauses: que, donde; Reported speech and tense shifts; Reported speech: conditional as future; Ser vs estar; Ser vs estar with adjectives; Si + imperfect subjunctive; Si + pluperfect subjunctive; Si-clauses with imperfect subjunctive; Si-clauses with pluperfect and imperfect subjunctive; Subjunctive after es posible que; Subjunctive after quiero que; Subjunctive after wishes and ojalá; Subjunctive after wishes, even if; Subjunctive in time and relative clauses

## By the end of B1 a learner will have met

This builds on A1/A2: present, ser/estar, gustar, ir a, reflexives, preterite (regular and irregular), imperfect, estar + gerund, tú commands, object and double pronouns, comparatives, and a first look at he/había + participle in a2-09/10.
- **Past narration:**
  - preterite vs. imperfect (01);
  - present perfect vs. preterite, including Peninsular vs. American use (01, 03);
  - pluperfect (01, 04).
- **Future and conditional:**
  - simple future (02);
  - future in the past (01);
  - conditional for advice and hypotheses (03, 05).
- **Conditions:**
  - real si + present (02, with plenty more recycling in b1-10);
  - hypothetical si + imperfect subjunctive + conditional (08).
- **Present subjunctive:**
  - wishes (querer/esperar que), importance and doubt with no creo que (06, 07, 10);
  - purpose and time with para que and antes de que (07);
  - cuando, aunque and ojalá (08);
  - hasta que (10).
- **Commands:**
  - negative tú commands (06);
  - the full tú/usted/ustedes system with attached pronouns (07, 09).
- **Reported speech:**
  - statements with backshift (05, 06);
  - reported commands with que + imperfect subjunctive (09, for recognition).
- **se:** impersonal (04) and passive (10).
- **Relatives:** que and en que, defining and non-defining (03); donde, lo que and quien (08).
- **Other:**
  - object pronoun order se lo / te la (02);
  - verb phrases llevar + gerund, seguir and volver a (04);
  - por vs. para (05, 10);
  - verbs of change ponerse, quedarse and convertirse (09).

**Compared with the Plan Curricular B1 grammar inventory (Instituto Cervantes; summarised, so check the exact section numbers before quoting):**
- **Covered:** pretérito perfecto/indefinido/imperfecto/pluscuamperfecto contrasts; futuro simple; condicional simple; imperativo afirmativo and negativo with pronouns; presente de subjuntivo in sustantivas (deseo, duda, valoración) and adverbiales (finales, temporales, concesivas con aunque); condicionales reales and irreales (si + imperfecto de subjuntivo); estilo indirecto with tense shifts; se impersonal and pasiva refleja; relativos que/donde/quien/lo que; por/para; pronombres combinados; perífrasis (llevar + gerundio, seguir + gerundio, volver a); verbos de cambio ponerse/quedarse.
- **Not covered:**
  - *pretérito perfecto de subjuntivo* (haya + participle) has **0 tokens in all 20 B1/B2 stories**. It is the largest gap at both levels.
  - futuro perfecto (habrá + participle) also has 0 tokens.
  - acabar de and dejar de have 0 and 1 tokens respectively (b1-06, dejé de preguntar).
  - *lo + adjective* (lo bueno es que…) is often listed at B1 but here is first a headline at b2-08.
  - ser vs. estar with adjectives that change meaning is not a headline anywhere at B1/B2 any more.

## By the end of B2 a learner will have met

Everything above, plus:
- **Imperfect subjunctive:**
  - after past triggers (03);
  - como si (03);
  - concessives with aunque, por mucho que and por + adjective + que (01, 02);
  - no es que, temer que and a que (02);
  - opinion, doubt and emotion, contrasting indicative and subjunctive (04);
  - conjunctions para que, sin que and hasta que (01);
  - time clauses with cuando, hasta que and mientras in past narrative (06);
  - relative clauses with an unknown or non-existent antecedent (09);
  - reduplicated forms such as diga lo que diga and fuera quien fuera (10).
- **Pluperfect subjunctive and conditional perfect:** ojalá and como si (04), si-clauses (05, 07) and aunque (05).
- **Reported speech** with full backshift, reported questions, thoughts and requests (05, 06).
- **Passive:**
  - ser + participle with por (03);
  - pasiva refleja (03);
  - estar + participle for a resulting state (06).
- **Relatives:** preposition + article + que, con quien, and cuyo (08).
- **Information structure:** clefts (07, 10) and lo + adjective / lo + adjective + que (08).
- **Verbs of change** volverse, hacerse and convertirse (08).
- **Verb phrases:**
  - seguir and acabar + gerund, soler (02);
  - llevar + gerund, llevar sin + infinitive, ir + gerund (07).
- **Conjecture:** conditional (serían las tres, 09) and conditional perfect (habría escrito, 10).
- **Discourse markers:** sin embargo, en cambio, en cuanto a, por su parte (04); ahora bien, de modo que, por cierto, peor aún (09).

**Compared with the Plan Curricular B2 inventory (summarised):**
- **Covered:** pluscuamperfecto de subjuntivo; condicional compuesto (hypothesis and probability); oraciones concesivas (aunque + subjuntivo, por mucho que); finales and temporales with subjuntivo; subjuntivo with verbs of opinion; relativas with preposition and cuyo; voz pasiva con ser and estar + participio; verbos de cambio; perífrasis; estructuras enfáticas (relieve: fue … quien); conectores discursivos.
- **Not covered:**
  - haya + participle (again absent).
  - futuro perfecto of probability (habrá salido).
  - *se* for involuntary events: there are 2 natural tokens (b2-09 se le escapó la risa, b2-10 se le ocurrió), but it is not a headline.
  - consecutive connectors (de ahí que + subjunctive, así que): only de modo que occurs.
  - ponerse and quedarse as change verbs are not revisited at B2.

## Essentials decks: what stays uncovered

- **essentials-b1:**
  - Covered: Por vs. para (05, 10); Present perfect vs. preterite (01, 03); Object pronoun order (02); Passive and impersonal se (04, 10).
  - Partly covered: *Subjunctive after para que, antes de que, sin que*. para que and antes de que are in 07, but **sin que** is not at B1; it is first a headline at b2-01. *Verb phrases: llevar + gerund, acabar de, volver a, dejar de*. llevar and volver a are in 04, but **acabar de** (0 tokens anywhere) and **dejar de** (1 token, b1-06) are uncovered.
- **essentials-b2:** all 6 topics are now covered by stories.
  - conjunctions (01);
  - opinion/doubt/emotion (04);
  - preposition + relative and cuyo (08);
  - verbs of change (08 for volverse and hacerse; ponerse and quedarse only at b1-09);
  - lo + adjective (08);
  - the passive: ser and se at 03, estar + participle at 06.

## Edits required: 18

| Story | Line | Topic | Replace | With | English |
|---|---|---|---|---|---|
| b1-01 | 7 | Present perfect vs. preterite | ¿Usted es Gustavo Montoya? | ¿Usted es Gustavo Montoya? Creo que he encontrado algo suyo. | "Are you Gustavo Montoya? I think I've found something of yours." |
| b1-01 | 10 | Present perfect vs. preterite | Quería devolvérsela hoy mismo, porque sé | He venido en persona porque quería devolvérsela hoy mismo; sé | "I've come in person because I wanted to return it to you today; I know what it feels like when you lose something important." |
| b1-02 | 11 | Object pronoun order: se lo, te la | —Leche, azúcar, | —Se lo digo: leche, azúcar, | "I'll tell you: milk, sugar, …" |
| b1-03 | 5 | Conditional tense | Un horno eléctrico no hace el mismo pan | Un horno eléctrico no haría el mismo pan | "An electric oven wouldn't make the same bread." |
| b1-04 | 15 | Verb phrases: llevar + gerund, seguir, volver a | Esa semana llamó a su hermana | Esa semana volvió a llamar a su hermana | "That week he called his sister again" |
| b1-06 | 11 | Negative commands | —Todavía no —respondió Marisol—. | —Todavía no, no le digas nada —respondió Marisol—. | "Not yet, don't tell her anything," Marisol replied. |
| b1-07 | 1 | Subjunctive after para que, antes de que | Habla despacio, sonríe | Habla despacio para que te entiendan, sonríe | "Speak slowly so they understand you, smile…" |
| b1-07 | 14 | Subjunctive after para que, antes de que | —Vuelve ya —le dijo—. | —Vuelve ya, antes de que cambien de opinión —le dijo—. | "Come back now, before they change their minds," she said. |
| b1-08 | 5 | Si + imperfect subjunctive + conditional | Hoy soy ingeniera. | Si no fuera por usted, hoy no sería ingeniera. | "If it weren't for you, I wouldn't be an engineer today." |
| b1-08 | 9 | Si + imperfect subjunctive + conditional | porque cada uno de ustedes me enseñó algo a mí. | porque cada uno de ustedes me enseñó algo a mí. Si volviera a empezar, elegiría otra vez esta escuela. | "…because each of you taught me something. If I started again, I would choose this school again." |
| b1-08 | 12 | Si + imperfect subjunctive + conditional | en los libros que había prometido leer. | en los libros que había prometido leer. Si se quedara en casa, tendría tiempo para todos ellos. | "…the books he had promised to read. If he stayed at home, he would have time for all of them." |
| b1-09 | 5 | Reported commands | Soledad se arrodilló a su lado y le propuso | Soledad se arrodilló a su lado, le dijo que no tuviera miedo y le propuso | "Soledad knelt beside him, told him not to be afraid and suggested…" |
| b2-03 | 4 | Passive: ser + participle and se | el sepulcro del apóstol se descubrió en el siglo IX | el sepulcro del apóstol fue descubierto en el siglo IX | "the apostle's tomb was discovered in the 9th century" |
| b2-03 | 9 | Passive: ser + participle and se | el Pórtico de la Gloria, obra del Maestro Mateo en el siglo XII, | el Pórtico de la Gloria, que fue esculpido por el Maestro Mateo en el siglo XII, | "the Pórtico de la Gloria, which was carved by Master Mateo in the 12th century," |
| b2-04 | 7 | Ojalá and como si with pluperfect | le parecía casi cómica su propia cautela. | le parecía casi cómica su propia cautela, como si la hubiera escrito otra persona. | "…his own caution seemed almost comic, as if someone else had written it." |
| b2-08 | 6 | Relative clauses with prepositions; cuyo | sacó un sobre amarillento, atado con una goma elástica ya reseca. | sacó un sobre amarillento, cuya goma elástica estaba ya reseca. | "…took out a yellowed envelope whose rubber band had long since dried out." |
| b2-08 | 10 | Lo + adjective and lo + adjective + que | Era menos épica, pero más cierta | Lo curioso es que era menos épica, pero más cierta | "The odd thing is that it was less heroic, but truer" |
| b2-09 | 4 | Conditional of conjecture | Luego, extrañada, quiso saber | Luego, extrañada —¿qué le importaría a un guardia una caja rota?—, quiso saber | "Then, puzzled (what could a broken box matter to a guard?), she wanted to know…" |

## Problems and follow-ups

- **b1-08 depends entirely on edits for its main new topic.** si + imperfect subjunctive has 0 natural tokens; all 3 come from edits. No B1 story after b1-06 contains a natural hypothetical si-clause, so placing it after the present subjunctive (as the audit asks) costs 3 sentences. The cheaper alternative is b1-03 (2 natural tokens plus 1 edit), but that keeps it before the subjunctive.
- **b1-05 still contains a B2 sentence in its text:** *Si hubiera sido más paciente, no habríamos perdido tres años*. It is no longer a headline and is left in the text for recognition. If you want B1 texts free of it, a possible rewrite is *Si no hubiera sido tan orgullosa…*. That is the same structure, so it would need a real rewrite, which was not proposed here.
- **b1-03 keeps the present perfect in Mexican speech.** It is defensible for continuing situations, but the explanation must say so. Its role is recycling; b1-01 (Madrid) is the main presentation.
- **The commands family has 3 B1 headlines** with distinct topic strings: negative (06), the full system (07), and ustedes/usted with pronouns (09). **The subjunctive family dominates both levels by design**, with 5 of 31 slots at B1 and 11 of 30 at B2. No single topic string exceeds 2 headlines.
- **Borderline evidence:**
  - b1-07 counts *una manera de que la familia acompañe* (a noun complement, not a conjunction) as the third purpose token.
  - b2-08 verbs of change has exactly 3 tokens. An optional 4th: line 4 *vi cómo Catalina bajaba la vista* → *vi cómo Catalina se ponía roja y bajaba la vista*.
  - b1-01 "Present perfect vs. preterite" counts the contrasting preterite *¿Dónde la encontró?*. It has 3 present-perfect tokens after edits.
- **Downstream work this map creates (not done here):**
  - rewrite `grammar/b1.json` and `grammar/b2.json` (explanations and examples quoted from the stories);
  - rebuild the gq-b1 and gq-b2 quiz items for the changed topics;
  - add the new strings to categories.json;
  - apply the edits to all-stories.json, keeping the English translation of each edited line in step (the suggested English is the clause only);
  - re-check the vocab lists and quizzes that quote edited lines.
- `new-stories/b2-05.json` differs from the b2-05 text in all-stories.json. This map uses all-stories.json, which was modified more recently.
