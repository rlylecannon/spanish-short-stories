# Code guide for the Spanish Stories site

Written 12 Nov 2026 for anyone who picks this project up later. The source files also carry comments; this page is the map.

## What it is
A static site (one `index.html` plus PDFs) with 60 Spanish short stories, A1 to C2. Each story has read-aloud, a dictionary and conjugation lookup, quizzes, grammar notes, flashcards, speaking practice, a writing check, a placement test and a notebook. Everything runs in the browser; progress is saved in `localStorage`. Optional AI features need a small backend (see `AI-BACKEND.md`).

## Folder map
| Folder / file | What it holds |
|---|---|
| `free-spanish-stories/` | The built site: `index.html` and `resources/` (74 PDFs). This is the only folder to publish. |
| `site-src/` | The app source: `app.js` (main app and router), `base.css`, `extra.css`, `a11y.css` (accessibility and phone-layout overrides, loaded last so it wins), and the injected modules `ai.js`, `notebook.js`, `progress.js`, `warmup.js`, `speak.js`, `lookup.js`, plus `conj.js` (conjugation engine, its own script block). |
| `art/` | `art.js` (SVG scene renderer), `scenes-*.json` (scene data per story), `render.js`. |
| `tools/` | `build_site.py` (assembles the site), `build_pdfs.py`, tests and one-off data scripts (see below). |
| `stories/all-stories.json` | The 60 stories (text, English, vocab, quiz). The per-part files next to it are earlier drafts. |
| `grammar/`, `grammar-quiz/`, `dialogues/`, `placement/`, `dict/`, `photo-brief/` | Data read by `build_site.py`. The build uses `grammar/*.json`, `grammar-quiz/all-gq.json`, `dialogues/all-dialogues.json`, `dialogues/partners.json`, `dialogues/goals.json`, `placement/bank.json` and `placement/cando.json`, `dict/dict.json` and the photo-brief CSV/JSON for culture captions. |
| `_bak/`, `_mock/`, `_probe/`, `audit*/`, `new-stories/`, `recycle/` | Scratch and history from earlier editing passes. Not used by the build. |
| `docs/` | This guide, `AI-BACKEND.md`, `NATIVE-REVIEW-GUIDE.md` and design comparison pages. |

## Build and run
```bash
python3 tools/build_site.py free-spanish-stories     # writes free-spanish-stories/index.html
cd free-spanish-stories && python3 -m http.server 8000   # then open http://localhost:8000
```
`build_site.py` also writes `_publish/page.html` (a fragment for the hosted artifact). Changing any file in `site-src/`, `art/` or the data folders means rebuilding. The PDFs are built separately by `tools/build_pdfs.py`, which needs `node`, ImageMagick and DejaVu fonts (the font path is hard-coded for Linux, so it will not run unchanged on a Mac).

## How the page is put together
1. `build_site.py` loads all the data into one `DATA` object and writes it into the page as `const DATA = {...}`.
2. It then pastes the CSS and four script blocks: `DATA`, `art.js`, `conj.js`, and `app.js`. `app.js` contains placeholders (`/*__ICONS__*/`, `/*__AI__*/`, `/*__NOTEBOOK__*/`, `/*__PROGRESS__*/`, `/*__WARMUP__*/`, `/*__SPEAK__*/`, `/*__LOOKUP__*/`) that the build replaces with the matching files. They all end up in one function scope, so the injected files use names defined in `app.js` (`esc`, `ic`, `store`, `byId`, `hasTTS`, `speakPlain`, `cancelTTS`, `teardown` and others). To find where a name comes from, search `app.js` first.
3. A hash router (`route()` in `app.js`) draws each page into `#app`. Before every page it stops audio, runs the `teardown` callbacks (each page registers its own cleanup there) and stops the microphone.
4. State is saved with the `store` helper in `localStorage`. Main keys: `sff-scores`, `sff-gscores`, `sff-gstats`, `sff-missed`, `sff-gseen`, `sff-draft-<story>`, `sff-posts-<story>`, `sff-notebook`, `sff-nb-days`, `sff-pl-open`, `sff-rate`, `sff-voice`, `sff-spk-en`, `sff-lookups`.
5. Optional AI goes through one function, `AI.ask(prompt)` in `ai.js`. Without an endpoint, the AI buttons stay hidden and the offline versions are used.

## Testing without a build system
- `tools/test_conj.js` tests the conjugation engine (190 checks). It was written for Node (`node tools/test_conj.js`). If Node is not installed, run it with macOS's built-in JavaScriptCore: `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`. It has no `require` or `console`, so put `var module={exports:{}}, console={log:print};` before the contents of `conj.js`, then `var C = module.exports;`, then the test file without its first line.
- `tools/check_js.sh <built index.html>` syntax-checks every script block (needs Node).
- `tools/validate_dialogues.py` and `tools/validate_gquiz.py` check data files. Read the caveat on `validate_gquiz.py` below before trusting it.

## Conventions worth knowing
- A story line is `[spanish, english]`. A quiz question is `{q, options[4], answer, ...}`; the build shuffles grammar-quiz options with a seed per question, so the order is stable between builds.
- Level codes are `A1 A2 B1 B2 C1 C2`; story ids look like `a1-01`.
- Anything shown to the learner that comes from data or from user text goes through `esc()` before it is put into `innerHTML`. Keep doing that.
- Do not insert comments or code inside the backtick HTML templates in `app.js`; the text becomes part of the page.

## Scripts that are not safe to re-run
These were one-off patch scripts. Treat them as history:
- `tools/ui_batch.py` patches source files by string anchors and double-patches on a second run.
- `tools/merge_c12.py` rebuilds the C1 and C2 stories from `new-stories/c12` and would discard later edits.
- `tools/apply_recycle.py` and `tools/apply_review_c12.py` apply reviewed patches to the data files; `apply_recycle.py` does not handle C1/C2 or the partners/goals files.

## Styling notes
- CSS is `base.css`, then `extra.css`, then `a11y.css` (later rules win). Put new overrides in `a11y.css` rather than editing the older files.
- Brand colours: `--orange` and `--blue` are used for text, so they are the darker accessible values (`#b85000`, `#1565b8`; 4.8:1 or better on the page background). The dark themes override them with brighter values. `--orangeF` and `--blueF` are for fills that carry white text and stay dark in every theme. Check contrast before changing any of these.
- The dark theme is applied two ways, `prefers-color-scheme: dark` and `data-theme="dark"` on the root element, so every dark override needs both selectors.
- A rule in the dark themes sets the text colour of everything inside a `.qw` card; later rules that need another colour there must repeat the dark prefix to win (see section 7 of `a11y.css`).

## Known open issues (as of 12 Nov 2026)
Found by code review and not fixed. None stops the site loading. (The learner-facing problems from the same review, such as nouns showing conjugation tables, typed notebook answers like "jubilado/a", the missing stem changes in `moler` and `absolver`, the stuck "Listening…" text and keyboard access, were fixed on 12 Nov.)

Conjugation and lookup
- `delinquir`, `argüir` and `erguir` conjugate wrongly. None is used anywhere in the content.
- `guess()` can rank nonsense forms first (for example "durmiendar"). Lookup now ignores guesses that are not known verbs.
- `identify()` does not strip "-nos" endings, so `identify('irse', 'vámonos')` finds nothing.

Speaking and chat
- Speaking chat: "Start over" during a reply in flight lets the old reply speak into the new session. The 500 ms timer that picks the next role-play reply can double-advance after a manual tap.
- A voice literally named "…Female" can be skipped for the female role, because the male-voice pattern also matches "female" (suspected).

Notebook
- `matchVocab` uses a prefix match, so a short vocab word can match an unrelated bold word and save the wrong entry.
- A legacy truncated id can match a different long key with the same first 60 characters (cards saved before the hash was added).
- The CSV export does not protect against spreadsheet formula injection (cells starting with `=`).

App
- A quiz answer followed by a tab click within 380 ms can redraw the quiz over the flashcards. After the quiz auto-advances, keyboard focus is lost.
- The "end each sentence with punctuation" writing goal only checks the last character.
- A few small tap targets remain: the Previous/Next story links under the "Your path" card (inline-styled, about 20 px tall) and the logo link (34 px tall).
- `sn` can be null for a paragraph with no sentence spans, which would throw in `showTools` (suspected).

Tools
- `validate_gquiz.py` expects 3 or 4 questions per story (there are now 8), so its per-story check always fails and the rest never runs; it also only loads grammar for A1 to B2.
- `build_pdfs.py` ignores `<i>` tags (story a1-07 prints them literally) and hard-codes a Linux font path. `build_site.py` opens files without an explicit encoding.
