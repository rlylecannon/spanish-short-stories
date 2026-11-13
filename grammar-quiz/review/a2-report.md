# A2 grammar and quiz audit

Scope: 10 stories, 40 grammar topics, 89 example sentences, 40 quiz questions, 160 vocab glosses.
Output: corrected grammar file, corrected quiz file plus 40 extra practice questions (`"x": true`), vocab fixes, and a 6-topic "Level essentials" deck.

## Errors found, by type

| Type | Count | Notes |
|---|---|---|
| Example translations that don't match the Spanish | 54 of 89 | Most (about 45) were full story lines pasted against a fragment, e.g. `Me llamo Pablo` = "Calm down. My name is Pablo and I'm going to Valencia too." About 8 were real meaning errors (see below). |
| Examples that don't illustrate the topic | 2 | a2-01 irregular preterite (example used regular *perdió/encontró*); a2-03 ser vs estar (`¿Cuál fue el secreto?`). |
| Explanations that were wrong or misleading | 9 | Listed below. |
| Explanations rewritten for clarity, a contrast, or a "watch out" line | 40 of 40 | All are now 70 words or fewer, except 2 at 71. |
| Quiz: wrong key or wrong meaning in the key | 1 | a2-09 *se me cayó un café*. |
| Quiz: more than one defensible answer | 2 clear, 4 borderline | Clear: a2-07 *Vení conmigo* (correct voseo in Buenos Aires), a2-10 *hicieron / empezó*. Borderline: a2-01 *llegaba/corría*, a2-03 *es rica*, a2-04 *quería*, a2-08 "He heard only the wind". |
| Quiz: factual error in the question | 1 | a2-02 called the box note "Doña Lupe's note". It is the grandfather's. |
| Quiz: implausible or joke distractors | 7 | e.g. "marrying herself to five people", "Ayer ... hoy", "Lo is just a filler word", "se lo contó a la noticia". |
| Quiz: predictable answer keys | all 10 stories | In every story the keys ran 0, 1, 2, 3 in order. The keys are now balanced: 20 at each index. |
| Quiz: weak format variety | 3 stories | a2-03, a2-07 and a2-10 had three "choose the sentence" questions each. Each now has fill-in or meaning items too. |
| Vocab glosses | 4 | Wrong sense or misleading (see `a2-vocab-fixes.json`). The other 156 are fine. |

## 10 most important corrections (before -> after)

1. **a2-09 *se me cayó un café*.** Before: translated as "a coffee spilled on me", the explanation said "something happened to me", and the quiz key was "A coffee fell on me by accident". After: "I dropped a coffee (by accident)". The coffee is the subject and *me* is the person affected. *Me caí* = "I fell" was added as a contrast.
2. **a2-07 quiz "Come with me".** Before: *Vení conmigo* was a distractor, but it is the correct vos command in Buenos Aires, where the story takes place. After: the distractor is *Vene conmigo*, and the explanation now mentions that Buenos Aires uses vos forms (*vení, tocá*).
3. **a2-10 quiz (preterite vs imperfect).** Before: *hicieron / empezó* was also grammatical, because the sentence had no habit marker. After: the stem says *Cada año ... ese viernes ...*, and the distractors are *hicieron/empezaba*, *hacían/empezaba* and *hacieron/empezó*.
4. **a2-08 tú commands.** Before: "A negative instruction can use no + infinitive: no correr". That teaches a wrong command rule. After: in *Lo importante es no correr*, *correr* is an infinitive; a negative tú command has its own form (*no corras*).
5. **a2-01 irregular preterite.** Before: the example *Perdió el tren, pero encontró un buen amigo* has only regular verbs, and its English was the wrong line. After: a *dijo* example, plus the warning about *dijeron* (not *dijieron*) and *vio* (not *vió*).
6. **a2-01 reflexives.** Before: "se casa is 'gets married', not 'marries someone else'". That is misleading, because *casarse con alguien* is how you say "marry someone". After: *casarse* = get married; *casarse con* = marry someone. The silly distractor was replaced with the real confusion *casa* (house).
7. **a2-06 tú commands with pronouns.** Before: "dime + lo = dímelo". After: *di + me + lo*, with the indirect pronoun first. The explanation also says *la prueba* means "she tries it".
8. **a2-03 ser vs estar.** Before: the example *¿Cuál fue el secreto?* doesn't show the contrast. After: *¿Por qué no está en el cuaderno?* (location), plus *está rica* (tastes good) vs *es rico* (is rich).
9. **a2-02 sequence words.** Before: "Por la mañana means 'in the morning' in general terms" (vague). After: *por la mañana* when there is no clock time, *de la mañana* only after a clock time (*a las seis de la mañana*). A new extra question tests this.
10. **a2-05 *bajó corriendo*.** Before: "got out running" (unidiomatic, and it hides the structure). After: "hurried out of the car (lit. got out running)". The explanation now covers gerunds of manner and the warning that Spanish does not use the progressive for plans (*trabajo mañana*).

Other explanation fixes:
- a2-02 *le dio* now warns against *la dio*.
- a2-05 adds that *había* has no plural (not *habían*).
- a2-06 adds *mudarse* vs *moverse*.
- a2-09 removes the irrelevant "Porque introduces a reason" and separates *llevar* + gerund from the present perfect.
- a2-10 fixes the typo "A mayor" and adds the irregular participles (*visto, hecho, dicho, puesto*).

## Renamed topics
None. All topic strings are unchanged, and `validate_gquiz.py` checks quiz topics against the original `grammar/a2.json`. The titles were all accurate.

## Validation
`validate_gquiz.py` on the full file reports only "need 3-4 questions" for each story, which is expected with 8 questions per story. The validator skips the remaining checks for a story once the count check fails. So I also validated the 40 core questions and the 40 extras as separate files, and both passed every check: 4 distinct options, valid index, topic matches, topic coverage.

## Issues in the stories themselves (not changed here, for the story author)
- **a2-09:** the man's coffee spills on Daniela, but she later says *se me cayó un café* ("I dropped a coffee"), and the English renders it as "a coffee spilled on me". Either change the Spanish to *un señor me tiró un café encima* or accept a white lie and fix the English.
- **a2-01:** "Ana saw her phone" reads better as "Ana looked at her phone".
- **a2-07:** the story is set in Buenos Aires but uses tú (*ven, toca, tocas*). This is fine as a teaching choice, but now flagged in the explanation.

## Curriculum gaps (essential A2 not covered by these 10 stories)
Covered: regular and irregular preterite (partly), imperfect, preterite vs imperfect, estar + gerund, ir a, positive tú commands, object and double pronouns, reflexives, comparatives and superlatives, present and past perfect, usted vs tú, a single short ser/estar contrast, gustar (one sentence only).

Not covered or barely touched:
1. **Por vs para.** Written up in essentials.
2. **Gustar-type verbs** with the full pronoun set and plural agreement (*encantar, interesar, doler*). Written up in essentials.
3. **The irregular preterite stem group** (*tuve, estuve, pude, vine, puse*, and *-eron* after j). Written up in essentials.
4. **Obligation** (*tener que, hay que, deber*). Written up in essentials.
5. **Negative words and double negation** (*no ... nada/nadie/nunca*). Written up in essentials.
6. **Hace + time** ("ago") and *desde hace* + present ("for"). Written up in essentials.
7. Negative tú commands (*no corras, no llores*). These appear in the stories but are never taught.
8. Stem-changing *-ir* verbs in the preterite (*pidió, durmió, sintió*).
9. Comparisons of equality (*tan ... como, tanto/a/os/as ... como*).
10. A fuller treatment of ser vs estar, including adjectives that change meaning (*listo, aburrido*) and *estar* + participle (*está parado*).
11. Direct object pronouns taught systematically, including the personal *a*.
12. Possessive pronouns (*el puesto es tuyo*), demonstratives, and *me gustaría* / the polite conditional.
13. Simple future (recognition level), *acabar de* + infinitive, *soler* + infinitive.
