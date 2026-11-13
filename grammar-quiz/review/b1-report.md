# B1 grammar audit: report

Files in this folder: `b1-grammar-fixed.json`, `b1-gq-fixed.json` (40 rewritten/fixed questions + 40 extras with `"x": true`), `b1-vocab-fixes.json`, `b1-essentials.json`.
Validation: `validate_gquiz.py` only reports "need 3-4 questions" (expected, 8 per story). The 40 core questions and the 40 extras each pass on their own: topics, 4 distinct options, answer index. Correct answers are spread evenly (20 at each of positions 0-3).

## Errors found, by type

| Type | Count |
|---|---|
| Explanation factually wrong or misleading | 8 |
| Explanation too thin to teach the point (rewritten, "watch out" line added) | 12 (all 40 now have a contrast or watch-out line; all ≤ 78 words) |
| Wrong English translation of an example | 4 (+2 stylistic) |
| Example that doesn't illustrate its topic | 3 |
| Example formatting (fragment, missing ¡ / capital / full stop) | 9 |
| Quiz: wrong answer key | 0 |
| Quiz: ambiguous (a distractor is also correct or defensible) | 12 |
| Quiz: implausible or garbage distractor ("…sabor a.", "…pronto que.", "miedos a.", "a usted") | 9 |
| Quiz: "why" wrong or not teaching | 2 (b1-08 ustedes, b1-03 conditional) |
| Vocab gloss misleading | 3, plus 6 clarifications |

## 10 most important corrections

1. **b1-02 Reflexive quiz** (the flagged distractor): *Tengo que acostumbrarte al sabor* is grammatical ("get you used to"). Replaced it with *…acostumbrarme el sabor* (missing *a*). Also removed the garbage option *…al sabor a.*
2. **b1-04 Relative clauses quiz**: *Nada que usted podría curar* is correct Spanish, so the question had two right answers. Rewritten as a gap: *Nada que usted ___ curar* (pueda / puede / podrá / pudo).
3. **b1-04 / b1-05 / b1-08 Pluperfect quizzes**: *se cayó en la calle antes*, *lo dejó en el hotel antes* and *Enseñó matemáticas durante 38 años* are all acceptable Spanish. Rewritten with *ya* + a past reference point (*Cuando… ya ___*) so only *había + participle* fits.
4. **b1-01 Future in the past / b1-06 Reported speech**: *Prometió que le mandará / escribirá* is acceptable if the event is still in the future now. The frame now forces a closed past (*Hace años… y lo hizo*; "Lupe tells the story today").
5. **b1-05 Hypotheticals quiz**: *Si fuera más paciente, no habríamos perdido* is a valid mixed conditional (a permanent trait). Replaced with *habría sido / había sido / haya sido*.
6. **b1-09 Indirect commands, grammar**: the example *Que no vamos a volver a ser extraños* (indicative, "that we won't…") was presented as an indirect command. It is now used as the contrast in the watch-out line, and two real examples were added (*Que nadie use el ascensor*, *¡Que descanses!*).
7. **b1-07 Commands, grammar**: *observen* was listed as a **usted** command; it is **ustedes**. Also: *para que* was listed among "wish" verbs (b1-07 subjunctive); *cuanto más… más* was taught under "Conditional for speculation". It was replaced by real conjecture (*Serían las diez*).
8. **b1-07 Reported commands, grammar**: the explanation was garbled ("…or a pronoun combination (se los quitara)"). Rewritten: present vs imperfect subjunctive depending on the reporting verb, plus the key contrast *dijo que + indicative* (information) vs *+ subjunctive* (order).
9. **b1-01 Relative clauses, grammar**: *que* was illustrated with a *donde* example. Translation fix: *Inés le enseñó el barrio* = "showed him the neighborhood", not "told him about". Watch-out added: Spanish never drops *que* ("the man I met").
10. **Translations**: *su difunto marido* "her husband" → "her **late** husband" (b1-03). *había propuesto* "had asked her" → "had suggested" (b1-02). *no quiso avisarle* "she hadn't wanted to warn him" → "she didn't want to let him know in advance" (b1-10). b1-04: a hypothetical *si*-clause was called a "wish"; it is a condition.

Other notable quiz fixes: b1-03 *Si fuera usted, compraba* (colloquially acceptable) was removed. b1-02 *Si quieres, ensayaríamos* (borderline polite conditional) was removed. b1-08 *Explicó que han encontrado* (borderline) was replaced. b1-08: the odd "why" said "negatives keep the pronouns before the verb" on a question with no pronoun; it now explains *tengan / tienen / tengas*. Each story's 8 questions now mix gap-fill, choose-the-sentence, EN→ES, ES→EN meaning, find-the-error, transform/report and "why / what's the difference" formats. Each extra uses a different format from the core question on the same topic.

## Renamed topics
None. All topic strings are unchanged. With the explanations fixed, no title is wrong. "Conditional for speculation" (b1-07) is now accurate because the off-topic *cuanto más* material was removed.

## Vocab (see b1-vocab-fixes.json)
Misleading glosses: *dar vergüenza* "to be embarrassing" → "to make (someone) embarrassed"; *las alforjas* "saddlebags" → "panniers (bike bags)"; *la campanilla* "doorbell" → "little bell (shop door)". Clarified: *el repuesto*, *secarse*, *el timbre*, *la añoranza*, *avisar*, *el banco* (also "bank").
Optional orthography note: the stories use *sólo* with an accent. Since 2010 the RAE recommends *solo*. It isn't wrong, so I didn't change it.

## Curriculum gaps (B1 essentials not covered by b1-01…b1-10)
Written up in `b1-essentials.json` (6 entries, 3 examples + 2 questions each):
1. **Por vs. para**: not taught anywhere in A1-B2.
2. **Present perfect vs. preterite**: the contrast itself, including finished-time markers and the regional note. b1-03 only presents the perfect on its own.
3. **Subjunctive after para que / antes de que / sin que**: plus the same-subject infinitive rule.
4. **Object pronoun order (se lo, me la) with infinitives and commands**: it appears in the stories (*devolvérsela*, *se los quitara*) but is never explained at B1.
5. **Passive and impersonal se**: only taught at B2, but needed at B1 (*se comparte*, *se dice*).
6. **Verb phrases**: *llevar* + gerund, *acabar de*, *volver a*, *dejar de* (*llevaba tres años trabajando* appears in b1-04 but is not taught).

Further gaps, not written up: subjunctive after emotions (*me alegra que*, *me sorprende que*); relative clauses with prepositions (*en el que*, *con quien*, *lo cual*); ser/estar with participles (*está cerrada* vs *fue cerrada*); future/conditional of probability (*serán las diez*), which is only touched on in b1-07; accidental *se* (*se me olvidó*); reported questions (*preguntó si…*); *aunque* + indicative vs subjunctive; vosotros command forms.
