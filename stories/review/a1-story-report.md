# A1 story review (a1-01 to a1-10)

Files: `a1-stories-fixed.json` (10 stories, all fields), `a1-story-changes.json` (113 changes, each with a reason). `_apply_a1.py` regenerates both from `all-stories.json`.
Constraints kept: line counts and order, plots, titles, names, and `<b>` markup style. `validate.py` passes (A1 word budgets, max 14 words per sentence, 5 quiz questions, 12-20 vocab items). The only warnings are the existing heuristic ones about infinitives in the vocab list (llover, levantarse…), which the text uses in conjugated forms.

Ratings are for the stories as they were before these fixes. Average is **3.6 / 5**. I estimate about 4.1 after the fixes; the remaining weaknesses are structural (see the level-wide notes).

## Change totals
| Field | Changes |
|---|---|
| lines | 47 (17 change the Spanish wording; 7 change only the English; 23 only add `<b>` markup) |
| vocab | 45 (14 are gloss fixes from `grammar-quiz/review/a1-vocab-fixes.json` that had never been applied to the story file; 31 are words that were missing) |
| quiz | 5 |
| prompt | 10 (every prompt now has a model or sentence starter that elicits the target grammar) |
| teaser / concepts | 2 / 4 |

## Per story

**a1-01 El desayuno de Tomás: 3/5.** Short sentences fit the very first story well, and *estar* for location and *hay* are well repeated. However, Lucía is never introduced, the "Pero hay un olor" contrast had nothing to contrast with, and the teaser ("Everyone is hungry") is not in the text. The prompt ("What do you have for breakfast?") did not elicit *hay* or *estar*. Fixes: "Lucía busca en el baño. No está." (now a 5th *estar* token), "Today I'm making breakfast!", a teaser that matches the text, a new prompt using *hay/está*, and glosses for ruido, sala, buscar and sonreír. The ending is still flat: Papá never reacts.

**a1-02 Las uvas de doña Elena: 3.5/5.** It is warm and culturally specific (soles, market stall), with a real small act of kindness. Personal *a* comes up naturally. But the price exchange did not match: the lady asked about "la naranja" and got a per-kilo answer. *Gustar*, the headline structure, appeared only once, and *sol*/*soles* (sun vs. currency) was unglossed. Fixes: "¿Cuánto es el kilo de naranjas? / Son tres soles", "Sí, me gustan mucho, pero…", "le da las uvas", and the prompt now contrasts *gusta/gustan*. The story is at the top of its word budget (91/92), so it cannot carry more repetition.

**a1-03 La niña nueva: 4/5.** This is the best-designed early story. There is a relatable emotional problem (a nervous new girl), a clean *ser* vs. *estar* contrast, five natural *tener* tokens, and a me-too moment that turns the story. One weakness: the arc never closes on *estar* (she starts *nerviosa* and never becomes anything else). The last line is now "…tiene una amiga y está contenta." *Largo* (a false friend of "large") and *juntas* are now glossed. *Bocadillo* is Spain-only, which is worth knowing for a Chilean character, but it is fine.

**a1-04 El paraguas rojo: 3.5/5.** The search structure ("No está en la sala. No está en la cocina.") is excellent pattern drilling, and the umbrella-in-the-backpack twist is genuinely funny. *Poder* + infinitive appeared only once, and the English "Today it rains a lot" was stiff. Quiz Q5 keyed an ungrammatical answer ("Lo da a Sara"). Fixes: "…no tiene paraguas y no puede ir a casa", "le da … a Sara", and a new Q5 ("¿Quién tiene el paraguas azul al final?").

**a1-05 Un pastel para la abuela: 4/5.** It has clear cause and effect, real numbers, a money problem that A1 learners can follow, and a satisfying ending. There are two small issues: *querer* appeared only once, and it is never explained how don Luis knows it is the grandmother's birthday. Line 8 is now "Quiero comprar los huevos, pero no puedo". Note that this replaces the clean "No puedo comprar…" model in grammar/a1.json, so the editor should pick the example accordingly. *necesitar*, *triste* and *¡Toma!* are now glossed.

**a1-06 El autobús de las siete: 3.5/5.** It is a good first-person routine text with five reflexive tokens and a gentle human moment. But the title's "las siete" never appeared in the text, the three bolded reflexive verbs had no vocab entries, "Mañana yo llevo café para Don Julio" was stiff, and the quiz tested reasons twice and never tested the routine. Fixes: "Por eso tomo el autobús de las siete", "Mañana le llevo un café a don Julio" (lowercase *don*), a new Q1 asking what time she gets up, and reflexive verbs added to the vocab. *Pan dulce* is a Mexican term in a Valencia setting; I left it, but *una magdalena* would be more authentic.

**a1-07 Un día de lluvia en Bogotá: 3/5.** The Bogotá details (chocolate caliente, calle Veinte) are good, and *estar* comes up 6 times. But the teaser contradicted the text ("no free tables", a coat that never appears) and the concepts listed *porque*, which does not occur. "La lluvia es fuerte" was stiff. There are also two small logic wrinkles I left alone: Tomás knows which building is Ana's, and he is wet despite carrying a big umbrella. *Libre* (a false friend) and *la ropa* (singular agreement) are now glossed. *Leo ese libro* for "I'm reading" is fine at A1.

**a1-08 Las flores de la señora Elena: 3/5.** It is a kind story with good *más … que* examples and a useful *tener que*. However, Nico says "no tengo dinero" right after we learn he has 20 pesos, "De nada" answers a thank-you nobody gave, and quiz Q5 used the subjunctive ("quiere que Nico venga"), which is far above A1. Fixes: "no tengo mucho dinero", "Y tienes que venir otra vez mañana —dice ella.", and a new Q5. *Tener que* still appears only twice in the text, plus once in the quiz. The plot closely overlaps a1-05 (see below).

**a1-09 Una llamada de viernes: 4.5/5.** This is the strongest story in the level. It is almost all dialogue, has five natural *ir a* + infinitive tokens, a real twist (he is already outside her building), and a comprehension question (Q4) that rewards understanding the twist. The fixes are small: "con una risa" was a calque, so it is now "con una sonrisa"; "ríe" is now "se ríe"; and pantalla, película, aburrido and delante de are glossed.

**a1-10 Un sábado en el mar: 4/5.** It has good *ir a* density, a planning dialogue, a small crisis (the lost tickets) and a touching last image. It is long for A1 (181 words, at the top of its budget), several speaker tags are implicit, and *recuerdos* is abstract. The English "bigger than in my memories" is now "bigger than I remember", and encontrar, temprano and recuerdo are glossed.

## Level-wide observations

1. **Plot and theme repetition.** Three of the ten stories turn on a birthday (05, 08, 09). Two have the same plot: a child is short of money for a family member's birthday, a kind neighbour fills the gap, and the ending is tears of joy (05, 08). Swapping the occasion in a1-08 (for example Mother's Day, or simply "un regalo") would add variety without changing the illustrations much.
2. **Name collisions.** Elena appears three times (doña Elena in 02, la señora Elena in 08, a sister in 10). Lucía, Tomás and Ana each appear twice as different people. Learners who read in order will assume a shared world. I left the names as instructed, but this is worth fixing at the source.
3. **Grammar repetition is uneven.** The best stories (03, 06, 07, 09) give 4-6 natural tokens of the target. Others gave 1-2. I raised the weakest (gustar in 02, poder in 04, querer in 05, estar in 01 and 03), but the word budgets prevent more. *Tener que* in 08 and *más … que* in 08 and 10 remain under-repeated.
4. **Vocab lists were incomplete.** Bolded words often had no entry (the reflexives in 06), and frequent words were missing (triste, pantalla, película, encontrar). Every bolded word now has an entry. Recycled words (café, mesa, paraguas, cumpleaños) are re-listed across stories; that is acceptable spaced review.
5. **Recycling is good.** Food, house, family, weather and *estar* recur naturally across 01-07, and *ir a* links 09 and 10. However, gender, articles and *hace* + weather are never targeted (see the curriculum gaps in `a1-report.md`).
6. **Quizzes** are almost all literal recall, with sound keys and good answer spread. Only 06 Q1 (new), 09 Q4 and 04 Q5 (new) require inference or tracking the plot. Next time, add one "why / what changed" item per story.
7. **Prompts** previously named a topic but rarely modelled the grammar. All 10 now include a model sentence with the target structure.
8. **English translations** were mostly accurate. The recurring flaw was the simple present for ongoing or planned actions ("Today I make…", "Today it rains…", "Tomorrow he comes back"); those are fixed.

## Lines quoted in grammar/a1.json that changed (update the examples)
| Story, line | Topic | Old (Spanish / English) | New |
|---|---|---|---|
| a1-01 L6 | Present tense and tener | Lucía busca en el baño. | Lucía busca en el baño. No está. / Lucía looks in the bathroom. He isn't there. |
| a1-01 L9 | Present tense and tener | (English) He has breakfast on the table. | He has breakfast ready on the table. |
| a1-01 L10 | Present tense and tener | (English) Today I make breakfast! | "Today I'm making breakfast!" he says. (the grammar file already used this) |
| a1-02 L4 | Ser for days, prices | — ¿Cuánto es la naranja? —pregunta una señora. | — ¿Cuánto es el kilo de naranjas? —pregunta una señora. / "How much is a kilo of oranges?" asks a lady. |
| a1-02 L5 | Ser for days, prices | — Son tres soles el kilo, señora. | — Son tres soles, señora. / "Three soles, ma'am." |
| a1-02 L9 | Tener: having things | — Sí, pero no tengo dinero —dice el niño. | — Sí, me gustan mucho, pero no tengo dinero. / "Yes, I really like them, but I don't have any money." (also a 2nd example for Gustar) |
| a1-04 L12 | ¿Dónde está…? | (English) The red umbrella is right there! | There's the red umbrella! |
| a1-04 L14 | Negatives with no | Su amiga Sara no tiene paraguas. | Su amiga Sara no tiene paraguas y no puede ir a casa. / Her friend Sara has no umbrella and can't go home. |
| a1-05 L8 | Querer, necesitar, poder | — No puedo comprar los huevos —dice triste. | — Quiero comprar los huevos, pero no puedo —dice triste. / "I want to buy the eggs, but I can't," he says sadly. |
| a1-07 L13 | Estar for place and state | Afuera la lluvia es fuerte, pero ellos están contentos. | Afuera llueve mucho, pero ellos están contentos. / Outside it's raining hard, but they are happy. |
| a1-08 L15 | Tener que + infinitive | —De nada. Tienes que venir otra vez mañana —sonríe ella. | —Y tienes que venir otra vez mañana —dice ella. / "And you have to come again tomorrow," she says. |
| a1-10 L19 | Más … que and tener | (English) It is bigger than in my memories. | "It's bigger than I remember," he says. |

Other lines with changed Spanish that are not quoted in the grammar file: a1-02 L11, a1-03 L15, a1-04 L15, a1-06 L4, L8 and L15, a1-08 L9, a1-09 L11 and L21. Dialogues and role-plays keyed to these lines should be checked, especially a1-02 L4-5 and L9, a1-06 L15, and a1-08 L15.
