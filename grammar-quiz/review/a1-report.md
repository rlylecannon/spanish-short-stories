# A1 grammar and quiz audit

Scope: 10 stories, 40 grammar topics (`grammar/a1.json`), 40 quiz questions (`gq-a1.json`), 10 vocab lists.
Outputs: `a1-grammar-fixed.json`, `a1-gq-fixed.json` (40 corrected + 40 extras with `"x": true`), `a1-vocab-fixes.json`, `a1-essentials.json`.

## Errors found, by type

| Type | Count |
|---|---|
| Example where the Spanish is a fragment but the English translates the whole sentence (mismatch) | 17 (a1-04 ×1, a1-05 ×1, a1-06 ×3, a1-07 ×2, a1-08 ×2, a1-09 ×4, a1-10 ×4) |
| Example that doesn't show the topic (`corre a casa` under "Ir: voy a"; `El sábado es mi cumpleaños` under "el = on", where *el sábado* is actually the subject) | 2 |
| Explanation factually wrong or misleading | 4 |
| Explanation vague or not teaching (story-specific remarks like "the sentence starts with the time words, so read them first") | 5 |
| Explanation missing the key English contrast or common mistake | 40/40 (a "Watch out" line was added to every topic) |
| Quiz: two defensible answers | 4 |
| Quiz: broken logic in the keyed answer | 1 |
| Quiz: the keyed answer is itself ungrammatical | 1 |
| Quiz: duplicates another story's test / doesn't exercise the topic | 1 |
| Quiz: weak distractor | 1 |
| Quiz: format changed so each story has varied formats | 5 |
| Vocab glosses fixed or clarified | 14 (4 wrong or misleading, 10 clarifications) |

None of the 40 quiz keys pointed at a wrong option outright. The problems were ambiguity and broken questions. Answer positions were rebalanced: they had been skewed toward index 1 and are now 20/20/20/20.

## 10 most important corrections

1. **a1-01 "Present tense and tener" (explanation):** "Verbs in -ir like sonreír also end in -e" → removed. *Sonreír* is irregular (sonrío, sonríe), so it is the wrong model. Replaced with the regular -ar/-er/-ir endings and tengo/tienes/tiene, plus the note that the present also means "I'm making".
2. **a1-02 "Ser … prices" (explanation):** "use 'son' for plural or for amounts of money" → "the verb agrees with the amount: *Es un sol* / *Son tres soles*; English 'It's three soles' ≠ *Es tres soles*."
3. **a1-04 quiz `¿Dónde está…? and porque`:** keyed answer "¿Dónde está mi paraguas? / Porque está allí" (*because* does not answer *where*) → a two-blank completion: `¿___ mi paraguas rojo? … Quiero el rojo ___ es mi favorito` (Dónde está / porque).
4. **a1-10 quiz `Más … que and tener`:** every option began "Abuelo tiene…", so even the key lacked the required article → rewritten as "Which sentence is correct?" using *El abuelo tiene ochenta años* against *es ochenta años* / *más grande de* / *grande más que*.
5. **a1-03 quiz `Ser vs. estar`:** "She is from Chile and she is nervous": *Es de Chile y es nerviosa* is also correct (nervous by nature) → the prompt now says "nervous **today**", and the "why" explains the difference.
6. **a1-02 quiz `Personal a`:** *Mateo ve un niño pequeño* (the distractor) is acceptable to many natives, because an indefinite object makes the *a* optional → new format: "Which sentence needs personal *a*?" (*Mateo mira ___ su abuela* vs. three sentences about things).
7. **a1-06 quiz `Estar for location`:** *La parada es cerca de…* is colloquially used in parts of Latin America → now *La parada está **en** mi calle* vs. *es en*, which is clearly wrong for a physical object.
8. **a1-02 quiz `Ser … prices`:** *¿Cuánto ___ las naranjas?* (*son* keyed). Colloquial *¿Cuánto son?* and *¿A cuánto están?* make this murky → *—¿Cuánto es? —___ tres soles.* (Son).
9. **a1-09 "El sábado" example:** *El sábado es mi cumpleaños* was used to illustrate "el = on", but there *el sábado* is the subject ("Saturday is my birthday") → replaced with *¿qué vas a hacer el sábado?* and *Los sábados como con mi familia* (every Saturday). The new watch-out is "never *en el sábado*".
10. **a1-10 "Days and times of day" + quiz:** the key *a las ocho el viernes por la noche* was awkward and didn't teach the real rule → the explanation now contrasts *de la noche* (after a clock time) with *por la noche* (no clock time), and the quiz tests it (*El viernes por la noche*).

Other notable fixes:
- a1-09 "Question words" quiz duplicated a1-08's *por qué/porque* test. It is now a dialogue-matching question (*Estoy bien…* → *¿Qué tal estás?*).
- a1-07 "Estar" now teaches that *la ropa* is singular (*su ropa está mojada*).
- a1-04 and a1-05 now teach *a + el = al*.
- a1-07 "Present tense" no longer implies that *estoy leyendo* is wrong.

## Vocab (see `a1-vocab-fixes.json`)

Wrong or misleading:
- a1-07 *el chocolate* "hot chocolate" → "chocolate (chocolate caliente = hot chocolate)"
- a1-09 *la tortilla* "omelet" → "Spanish omelet (egg and potato)"
- a1-09 *sonar* "to ring" → "to ring; to sound" (the story uses *Suena aburrido*)
- a1-08 *el vecino* → *la vecina* "neighbor (female)" (the story only has *su vecina*). This is the one headword I changed.

Clarifications:
- *la profesora*, *la amiga*: "(female)"
- *el hambre*: feminine noun
- *la librería*: not "library"
- *el pescado*: fish as food
- *el billete*: Latin America *el boleto*
- *preparar*: also "to pack"
- *el peso*, *la portada*, *el niño*: sense clarified

## Renamed topics

None. All 40 topic strings are unchanged, so the topic cross-check in the validator still matches `grammar/a1.json`.

## Curriculum gaps

These core A1 points are never taught explicitly, though most of them already appear in the story texts:
1. Noun gender and articles (el/la/un/una/los/las). **Entry written.**
2. Plurals and adjective agreement and position. **Entry written.**
3. Full regular present tense, including nosotros/ellos/usted (only yo/tú/él forms are taught). **Entry written.**
4. *Ser* conjugation and uses (identity, job without an article). **Entry written.**
5. Possessive adjectives mi/tu/su/nuestro. **Entry written.**
6. Stem-changing verbs e→ie, o→ue (quiere, puede, cuestan, sienta all appear but are never explained). **Entry written.**
7. Subject pronouns and *tú* vs. *usted*.
8. Numbers 0–100 (used for prices, ages and times).
9. Demonstratives *este/ese* (*este azul*, *ese libro* appear).
10. *Hacer* for weather (*hace sol / frío*), since only *llueve* and *hay sol* appear.
11. *Muy* vs. *mucho*.
12. Dates and months.
13. *Por/para* basics (*para ti*, *por una hora* appear).
14. Direct-object pronouns *lo/la/los* (they appear in *no lo tengo* and *los encuentra*, so this is an A1→A2 bridge).

Imbalance: *tener* is a topic in 5 stories, *estar* in 4 (plus 3 ser/estar or ¿dónde está? topics), *ir* in 4 and time-telling in 4, while gender, agreement and articles get none. Future A1 stories could swap some of the repeated topics for gaps 7–11.

## Note outside scope

Some story-line translations are stiff. For example, a1-01 *¡Hoy yo preparo el desayuno!* → "Today I make breakfast!" should be "Today I'm making breakfast!". The grammar examples use the corrected English, but `all-stories.json` lines were not edited.

## Validation

`tools/validate_gquiz.py` on `a1-gq-fixed.json` reports only the expected "need 3-4 questions" for each story (each now has 8). That check skips the remaining checks for the story, so I also ran the validator separately on the 40 main questions and on the 40 extras: both pass (4 distinct options, valid index, topics match the grammar list, topic coverage).
