# B2 grammar audit — report

Scope: 10 stories (b2-01…b2-10), 40 grammar topics / 84 examples, 40 quiz questions, 183 vocab glosses.
Outputs: `b2-grammar-fixed.json`, `b2-gq-fixed.json` (40 corrected + 40 extras flagged `"x": true`), `b2-vocab-fixes.json`, `b2-essentials.json`.
Validation: `validate_gquiz.py` reports only the expected "need 3-4 questions" (8 per story with the extras). The 4 core questions and the 4 extras for each story pass every other check when validated separately.

## Errors found, by type

| Type | Count |
|---|---|
| Explanation factually wrong or inaccurate | 11 |
| Explanation vague, muddled or oversimplified (rewritten) | 9 |
| Translation that gets the meaning wrong | 4 |
| Translation needing a minor accuracy/naturalness fix | 8 |
| Example not illustrating its topic / sentence fragment / claim with no example | 6 |
| Quiz: wrong key | 1 |
| Quiz: two defensible answers | 8 |
| Quiz: misleading or wrong "why" | 2 |
| Quiz: implausible or nonsense distractors | 8 questions |
| Quiz: format monotony (about 20/40 were "Which sentence is correct?") | rebalanced |
| Vocab glosses fixed | 4 (all minor) |

27 of the 40 original questions were rewritten (new question, options or context). The other 13 were kept, some with a better "why". Every topic now has a "Watch out" line covering the typical English-speaker mistake. Every explanation is 90 words or fewer.

## 10 most important corrections (before → after)

1. **b2-10 Conditional of conjecture (wrong analysis + wrong quiz key).** "Nadie sabía a quién habría votado Evaristo" = "whom Evaristo *would have* voted for" → Evaristo had already voted by post, so this is a **conjecture**: "who he *might have* voted for". Also "habría elegido a Remedios" = "he had probably chosen", not "would have chosen". The quiz key now matches.
2. **b2-06 Reported speech.** "The preterite **or imperfect** becomes pluperfect" → the imperfect (like the pluperfect and the conditional) does **not** change. Only present → imperfect, preterite/perfect → pluperfect and future → conditional shift.
3. **b2-07 Reported speech.** "preferí becomes habría preferido" → wrong. The conditional perfect *habría preferido* stays as it is; a preterite becomes *había preferido*.
4. **b2-09 Si-clauses.** "Inside reported speech, si + imperfect indicative + conditional is used instead" → wrong. Hypothetical si + imperfect subjunctive stays unchanged (the story itself says *respondió que, si alguien lograra repararlo, le erigiría…*). Si + imperfect indicative is only the backshift of a **real** condition (*si se lo cuento… → si se lo contaba…*).
5. **Como si (b2-02, b2-03).** The old text implied the tense after como si follows the main verb ("with a past main verb it is the imperfect") → como si takes **only** the imperfect or pluperfect subjunctive, whatever the main verb is (*habla como si fuera…*). The present subjunctive is never used. The quiz now tests this with a present main verb.
6. **b2-05 Q1, two correct answers.** "Si me lo hubieras dicho, me ___ (ahorrar)": the key was *habría ahorrado*, but the distractor *hubiera ahorrado* is also correct → that distractor is replaced with *había ahorrado*, and the "why" mentions both valid forms.
7. **b2-05 Q4 / b2-07 Q1, future kept in reported speech.** *Comunicó que no habrá despidos* and *anunció que saldrá el domingo* can both be correct when the event is still in the future → context added ("story told in the past, that Sunday is long gone"), and the explanations now give the rule.
8. **b2-01 Deber de.** The "why" said *debió esconder* = "should have hidden" and marked it wrong as a guess. The RAE accepts deber + infinitive for conjecture, so it was ambiguous → the question now asks for the meaning of *debió de esconder*. The explanation gives the norm and real usage, and notes that *deber de* for obligation is the form to avoid.
9. **b2-09 translation.** "pensó que sería la radio" = "thought it **would be** the radio" → "thought it **must be** the radio" (conditional of conjecture).
10. **b2-06 Q2.** *Dijo que encontró un resguardo* was keyed wrong, but it is normal in speech → that distractor is removed and the "why" notes the colloquial option. Similar fixes: b2-07 Q3 (the mixed conditional *si existiera… habría usado* is defensible), b2-04 Q3 (*por mucho que lo intentó* is a factual indicative), b2-08 Q1 (*tomaban* is defensible).

Also notable: b2-01 *Aunque él ya no esté* was translated "even **if**" when Elvira knows Tomás is dead. It is now "even **though**", and the explanation teaches the "conceded known fact" use of aunque + subjunctive. In b2-04, *es posible que* now includes *haya mentido* and the contrast with *a lo mejor* + indicative. In b2-02, ser/estar no longer relies on "permanent vs temporary" alone and adds the adjectives that change meaning (listo, malo, rico). In b2-06, the unsupported claim about *el único que* + subjunctive was replaced by *mientras* + indicative/subjunctive and a real relative-clause example.

## Renamed topics
None. All 40 topic strings are unchanged. Some explanations were broadened inside their topic (b2-06 "Ser vs estar" now covers estar vs ser + participle), but no title was misleading enough to rename.

## Vocab
The glosses are generally accurate and fit their context. Four minor fixes: *postrado* (he is in an armchair, so not "bedridden"), *el fogón*, *el áncora* (watch part = pallet fork), and *advertir* (adds "to notice").

## Curriculum gaps (not covered by the 10 B2 stories)
Six gaps are fully written up in `b2-essentials.json` (explanation, 3 examples, 2 questions each):
1. Subjunctive after conjunctions: para que, sin que, antes de que, a menos que, con tal de que, en caso de que (plus cuando/hasta que contrasted with habits).
2. Indicative vs subjunctive with opinion, doubt and emotion (creo que / no creo que, me alegra que, es verdad que).
3. Relative clauses with a preposition (en el que, con quien, el cual) and *cuyo*.
4. Verbs of change: ponerse, volverse, hacerse, quedarse, convertirse en.
5. Lo + adjective, and lo + adjective + que ("how + adj"); lo de.
6. Passive voice: ser + participle vs estar + participle vs passive se.

Further gaps that are not written up:
- discourse markers and connectors (sin embargo, no obstante, por lo tanto, en cambio, es decir, de hecho)
- verbal periphrases (llevar + gerund, acabar de, volver a, dejar de, ponerse a, seguir + gerund)
- future and future perfect of probability for the present (only the conditional is taught)
- quizá / tal vez + either mood
- sequence of tenses as a stand-alone, systematic topic
- indirect questions in reported speech (preguntó si…)
- accidental se (se me olvidó)
- por vs para at B2 (cause vs purpose, por + infinitive)
- independent que + subjunctive (¡Que te vaya bien!)
- diminutives and augmentatives

The stories cover si-clauses heavily: 8 of the 40 topics are si + subjunctive. A few of those slots could go to the gaps above.
