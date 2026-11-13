# Spanish Short Stories

60 original Spanish short stories from A1 to C2, free to read. Each story has read-aloud, a dictionary and verb conjugation lookup, quizzes, grammar notes, flashcards, speaking and writing practice, a placement test and a personal notebook. Everything runs in the browser: there are no accounts, no ads and no tracking, and progress is saved on the learner's own device.

*Stories first. Fluency follows.*

## Try it or build it
The built site is in [`free-spanish-stories/`](free-spanish-stories/): one `index.html` plus the free PDFs in `resources/`. Open it from any web server (opening the file directly works for reading, but the microphone features need HTTPS).

```bash
python3 tools/build_site.py free-spanish-stories      # rebuild index.html from the sources
cd free-spanish-stories && python3 -m http.server 8000
```

A map of the code, the data files, how the page is assembled, how to test, and the known open issues is in [`docs/CODE-GUIDE.md`](docs/CODE-GUIDE.md). Optional AI features (open role-play, detailed writing feedback) need a small backend; see [`docs/AI-BACKEND.md`](docs/AI-BACKEND.md).

## Licensing
This repository has two kinds of material, and they are not under the same terms.

**Source code: GNU Affero General Public License v3 (AGPL-3.0-only).** The full text is in [`LICENSE`](LICENSE). It covers the program code:
`site-src/` (the app, styles and conjugation engine), `art/art.js` and `art/render.js` (the illustration renderer), `tools/`, and the code inside the built `free-spanish-stories/index.html`. You may use, study, change and share this code. If you distribute a modified version, or run one as a service that others use over a network, you must offer your users the complete source under the same license.

**Content: all rights reserved, free for personal and classroom use.** This covers the stories, translations, glosses, grammar notes, quiz questions, dialogues, dictionary data, placement tests, the illustration scene files (`art/scenes-*.json`), the PDFs, and the documents in `docs/`. © 2026 Ruthie D. Lyle, PhD. Learners and teachers may read, print and share these for personal and classroom use. They may not be sold or republished elsewhere without permission. The content is not covered by the AGPL.

The built page contains both the code and the content, so the page as a whole is a combination of the two sets of terms above.

The names "Spanish Short Stories" and "Stories first. Fluency follows." are not licensed for use as the name of a different product.

## Third-party material
The site loads no external scripts, fonts or services. It uses the visitor's system fonts, and the PDFs embed DejaVu fonts (permissive Bitstream Vera/DejaVu license). The flags and illustrations are drawn by the code in this repository. The small interface icons in `tools/build_site.py` follow a common open icon-set style; their original source has not been confirmed, so credit and license details will be added here once it is.

## A note on how the content was made
The stories and learning materials were created with AI assistance. The glosses and grammar notes have not yet had a native-speaker review (see [`docs/NATIVE-REVIEW-GUIDE.md`](docs/NATIVE-REVIEW-GUIDE.md)). Corrections are welcome.

## Contributing
Bug reports and suggestions are welcome. Contributions to the code are accepted under the same AGPL-3.0 terms.
