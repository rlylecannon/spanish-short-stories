# Placement test: scoring rule

The bank (`bank.json`) has 44 items: A1 10, A2 12, B1 12, B2 10. Each item is scored 1 (correct) or 0. A skipped item counts as 0.

## Administration (adaptive by band)

1. Present items band by band in order: A1, A2, B1, B2. Within a band, mix the order of the grammar, vocab and reading items, but keep any two items that share a passage next to each other.
2. **Early stop inside a band:** stop the band after **two consecutive misses**. If the learner has also answered fewer than half of that band's items correctly at that point, stop the whole test. Otherwise, mark the band as "incomplete" and move on.
3. **Stop between bands:** do not show the next band if the current band's score is **below 50%**.
4. Compute the score for each band only from the items shown: `pct = correct / shown`. If a band stopped early, count the items it did not show as wrong, so `pct = correct / band size`. This stops a learner from scoring 2/2 on a band they never really attempted.

## Recommended level

Let `pct[L]` be the band percentage. A band is **passed** when `pct ≥ 70%`. It is **failed** when `pct < 50%` or the band was never shown.

- **Recommended level** = the highest band L that is passed, as long as every lower band is also passed.
  - If the next band above L is failed, or L = B2: **confidence = high**.
  - If the next band is 50–69%: **confidence = medium**, since the learner is on the border with the next level.
- If a band scores 50–69% and is the highest band reached, recommend that band with **confidence = low**. Note: if A1 is 50–69% and A2 is below 50%, recommend A1 with low confidence.
- If A1 is below 50%: **Below A1**.
- If the results are inconsistent (a higher band passed while a lower band failed, for example A2 < 50% but B1 ≥ 70%), recommend the **lower** band with **confidence = low** and suggest a retake.

Optional per-skill note: if a learner passes a band overall but gets every reading item in it wrong, show "Your grammar is ahead of your reading. Start with the audio on."

## What to tell the learner

| Result | Message (English UI) | Start story |
|---|---|---|
| Below A1 | "Welcome! You're just starting out, and that's the perfect place to begin. Our first story uses very simple Spanish with an English line under every sentence, so turn on the translations and the audio." | a1-01 |
| A1 (high/medium) | "Nice work! You know the Spanish basics: present tense, ser and estar, numbers and time. Start with our A1 stories to build speed and vocabulary." | a1-01 |
| A1 (low) | "You've got some of the basics, and a few gaps are normal. Start at A1 and use the grammar notes under each story." | a1-01 |
| A2 (high/medium) | "Great! You can handle everyday Spanish and you're ready for stories told in the past. Begin with A2." | a2-01 |
| A2 (low) | "You're between A1 and A2. Try the first A2 story. If it feels hard, go back to a few A1 stories first." | a2-01 |
| B1 (high/medium) | "Impressive! You can follow real narratives with different tenses and the subjunctive. B1 stories will stretch you just enough." | b1-01 |
| B1 (low) | "You're close to B1. Start the first B1 story with translations on, and check the grammar notes when a structure feels new." | b1-01 |
| B2 (any) | "Excellent! You're reading at an upper-intermediate level and picking up tone and implication. Jump into the B2 stories." | b2-01 |

Medium confidence adds: "You scored well on the next level too, so if this feels easy, move up after two or three stories."
Low confidence adds: "This is our best guess. Your story quiz scores will tell us quickly if you should move."

## Example
A1 9/10 (90%), A2 10/12 (83%), B1 7/12 (58%), B2 not shown, or shown with 3/10 (30%).
A2 is the highest band passed, with every band below it passed, and the next band (B1) scored 58%. Result: **A2, confidence = medium**. Start the learner at a2-01.
