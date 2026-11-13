# Brief: replace one story with a gripping new one (Spanish learning site, CEFR graded)

You are a CEFR-trained Spanish teacher AND a gifted short-story writer for learners (graded-reader author). Base dir (bash): /sessions/practical-fervent-clarke/mnt/outputs . Goal: the reader should WANT to find out what happens (a real hook, a clue trail or surprise, an emotional or funny payoff). Not a lesson in disguise.

## What to replace
You receive: the OLD story id (keep the same id and level), a GENRE + PLACE + premise, and must write ONE new story. Read first:
- stories/all-stories.json (find the OLD story: its structure, <b> markup, line count, word count, vocab, quiz, prompt, concepts) and also skim 3-4 other stories of the same level for format and difficulty.
- grammar/<level>.json → the OLD story's grammar topics (list of {topic, explain, examples}). The NEW story MUST naturally use and repeat (3+ natural occurrences each, clearly visible) the SAME grammar topics, using the SAME topic strings, so the lesson sequence stays intact. Rewrite the explain text only if needed; write fresh examples quoting the NEW story's lines (plus constructed ones where cleaner).
- grammar-quiz/gq-<level>.json → format of grammar questions for the old story (8 per story: 4 core + 4 extras with "x": true).
- dialogues/all-dialogues.json (format; a2-02 is a good model) and tools/validate_dialogues.py.
- art/scenes-<level>.json (scene format) and art/art.js (read which object names 'n', outfits, poses, hair, accessories exist — only use ones that exist).
- photo-brief/photo-prompts.csv (columns id,filename,story,country,city,landmark,culture,use,prompt,caption).
- dict/dict.json: word-lookup dictionary: key = inflected form (lowercase), value = list of [lemma, pos, gloss]; pos in noun/verb/adj/adv/prep/conj/pron/det/interj/name/num/other; verb lemma must be an infinitive.
- All titles of the other 39 stories (avoid repeating their plots, character names, openings): list them from all-stories.json.

## Writing rules
- Level fit: keep to the old story's word count ±10% and the level's vocabulary/structure range; mostly high-frequency words; new useful words bolded with <b>…</b> (same density as existing stories at that level; bold only the first occurrence of a new word). Vocab list [[es,en]] must cover every bolded word with correct, sense-specific glosses (nouns with article).
- Natural, correct, idiomatic Spanish of the story's country (use local vocabulary there, gloss regionalisms; never Spain-only words in Latin America; keep tú/usted/vos consistent). English translation line-by-line: natural, accurate tense, not stiff.
- History/place/food content must be FACTUALLY accurate (real places, real dishes, real well-attested history). Anything legendary is framed as "dice la leyenda" / "según cuentan". Invent only fictional characters; do not put real living people in the story. Culture should feel specific and respectful; include small authentic details (a dish, a street, a custom).
- Mystery: plant fair clues in the text so the reader could solve it; payoff must follow from the clues; keep the tone warm/light at A1–A2.
- Fresh character names, not used elsewhere in the library; a mix of male and female characters. Never repeat plots like: birthday surprise, child short of money, envelope/letter with a secret, kind neighbour.
- Learning design: recycle common words from the level's earlier stories, repeat target grammar naturally, vary sentence rhythm, end with a satisfying last line.
- Line format: same as existing stories at this level: "lines":[[spanishHTML, english],...]; at A1/A2 about one sentence or short exchange per line; at B1/B2 a short paragraph per line, like the existing ones. Dialogue lines use curly/long dash as existing stories do (copy their punctuation convention, e.g. "— Hola —dice Ana.").
- Quiz: 4 comprehension questions (options 4, answer index), answerable only by reading, one clearly correct answer, plausible distractors, varied types (detail, inference, vocabulary-in-context, and at B1/B2 tone/intent).
- Writing prompt in English with a Spanish sentence starter and the target tense named.
- concepts: {grammar, vocabulary, skills} short and accurate.

## Deliverable: ONE file new-stories/<ID>.json with these keys
- "story": {id, level, title, titleEn, teaser (English, 1 sentence, hooks without spoiling), emoji, lines, vocab, quiz:[{q,options,answer}], prompt, concepts}
- "grammar": list of {topic, explain, examples:[[es,en],...]} (same topics as old, 2-4 examples each; explain ≤ A1 60 / A2 70 / B1 80 / B2 90 words incl. a short "Watch out" line for English speakers; every sentence correct)
- "gq": 8 questions {topic,q,options[4],answer,why}; 4 core (one per topic, varied formats, if the old story has fewer than 4 topics cover them evenly) + 4 with "x": true in different formats. Each has exactly ONE defensible answer; distractors are plausible learner errors; "why" teaches. Questions about the story may quote its lines.
- "dialogue": role-play script in the exact format of dialogues/all-dialogues.json (same number of steps as a comparable story at that level; the partner talks about the new story; replies at the level; check with tools/validate_dialogues.py by writing a temp file {ID: dialogue} and running it)
- "scene": art scene spec like art/scenes-<level>.json entries (items, vb [x,y,w,h in the 400x300 canvas, 4:3], country, ink [two hex colors suited to the country]) depicting the key moment (people + objects that exist in art.js; keep important elements within vb; do not overlap faces; check by running art code with node if possible: node -e "const A=require('./art/art.js'); ..." and look at the output with ImageMagick convert if useful)
- "culture": {country, city, landmark, caption, culture (demonym), prompt, use:"Hybrid (drawn characters added)"} matching a photo-prompt row (caption = one short sentence about the real place shown)
- "gen": "m" or "f" — gender of the protagonist (drives avatar/voice)
- "dict": {form: [[lemma,pos,gloss],...]} for EVERY word form in the story's Spanish lines (and bolded words) that is NOT already a key in dict/dict.json (lowercase forms, accents kept, 1-2 readings, English gloss)

When done: validate that the JSON loads; check word count, line count, that every bolded word is in vocab, that every grammar topic appears ≥3 times in the story, and that gq topics ⊆ grammar topics. Reply with 3 lines: title, word count, and one-sentence pitch of the hook. Do NOT edit any other files.
