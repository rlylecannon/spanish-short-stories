#!/usr/bin/env python3
"""Assemble the free Spanish stories site.  usage: build_site.py OUT_DIR  (writes OUT_DIR/index.html)"""
# PURPOSE: build the whole site as ONE self-contained HTML file (no external assets): CSS, art renderer, conjugation engine,
#   app code and all data are inlined. The data is injected as `const DATA = {...}` for the code in site-src/ to read.
# INPUTS (all under the project root, found relative to this file, so the current directory does not matter):
#   stories/all-stories.json, grammar/*.json, grammar-quiz/{all-gq.json,categories.json,essentials-{a1,a2,b1,b2}.json},
#   dialogues/{all-dialogues.json,partners.json,goals.json}, art/scenes-*.json, art/art.js, dict/dict.json,
#   placement/{bank.json,cando.json}, photo-brief/photo-prompts.csv + photo-brief/new/*.json, optional site-config.json,
#   site-src/{base.css,extra.css,app.js,ai.js,notebook.js,progress.js,warmup.js,speak.js,lookup.js,conj.js}.
# OUTPUTS: OUT_DIR/index.html (OUT_DIR is created if missing) AND, as a side effect that does not depend on OUT_DIR,
#   <project>/_publish/page.html (a fragment for hosting as an Artifact; see the bottom of this file).
# USAGE: python3 tools/build_site.py free-spanish-stories        (OUT_DIR is required; a missing argument raises IndexError)
# SAFE TO RE-RUN: yes. It only reads sources and overwrites index.html and _publish/page.html. Run tools/check_js.sh on the result.
# ASSEMBLY ORDER: load + filter data -> icons -> quiz shuffle and category tags -> filter by live story ids
#   -> read CSS/JS -> splice sub-scripts into app.js at /*__NAME__*/ placeholders -> format the HTML template -> write files.
# CAVEATS: the <meta name="description"> text says "60 free ... stories" literally; it is not computed from the data.
import json, glob, os, re, statistics, sys
# ROOT = project root (the parent of tools/). OUT = target directory given on the command line.
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = sys.argv[1]
# stories: list of dicts (id like 'a1-01', level, title, titleEn, teaser, lines, vocab, quiz, prompt...). Each entry of
# `lines` is [spanish_html, english]; the Spanish side may contain inline tags such as <b>.
stories = json.load(open(f'{ROOT}/stories/all-stories.json', encoding='utf-8'))
# scenes: merge of every art/scenes-<level>.json into one {story id: scene spec} dict (schema: see art/art.js).
# NB: unlike the other loads, this open() passes no encoding=, so it uses the locale default.
scenes = {}
for f in glob.glob(f'{ROOT}/art/scenes-*.json'): scenes.update(json.load(open(f)))
# Only stories at these levels are published; anything else in all-stories.json is dropped here (and, via flt below,
# so is its data in the other story-keyed dicts).
LIVE_LEVELS = ('A1','A2','B1','B2','C1','C2')
stories = [x for x in stories if x['level'] in LIVE_LEVELS]
# strip: remove HTML tags (naive regex: any <...>) so word counts ignore markup.
strip = lambda t: re.sub(r'<[^>]+>', '', t)
# meta[level] = {name, words: [min, max]}: the shortest and longest story (Spanish word count) in each level, rounded
# to the nearest 10 by r(); the app shows it as "N-M words per story". The regex counts runs of word characters incl. accented letters.
NAMES = {'A1': 'Beginner', 'A2': 'Elementary', 'B1': 'Intermediate', 'B2': 'Upper intermediate', 'C1': 'Advanced', 'C2': 'Proficient'}
meta = {}
for lv in NAMES:
    wc = [len(re.findall(r"[\wáéíóúüñÁÉÍÓÚÜÑ]+", strip(' '.join(l[0] for l in s['lines'])))) for s in stories if s['level'] == lv]
    r = lambda n: int(round(n / 10.0) * 10)
    meta[lv] = {'name': NAMES[lv], 'words': [r(min(wc)), r(max(wc))]}
# grammar: merge of grammar/*.json into {story id: [grammar topic entries]} (glob order is arbitrary; keys do not collide).
grammar = {}
for f in glob.glob(f'{ROOT}/grammar/*.json'): grammar.update(json.load(open(f, encoding='utf-8')))

# ---- icons: ICONS = inner SVG path data for 24x24 stroked line icons; FILLED = solid icons (play/pause/stop).
# svg(name, size) renders an icon for the Python-side HTML template (nav, footer). ICON_JS is the same set serialised as a
# JS `ic(name, size)` helper that is spliced into app.js at the /*__ICONS__*/ placeholder.
ICONS = {
 'bulb': '<path d="M3 12h1m8-9v1m8 8h1m-15.4-6.4.7.7m12.1-.7-.7.7"/><path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0-1 3a2 2 0 0 1-4 0a3.5 3.5 0 0 0-1-3"/><path d="M9.7 17h4.6"/>',
 'book': '<path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6v13"/><path d="M12 6v13"/><path d="M21 6v13"/>',
 'volume': '<path d="M15 8a5 5 0 0 1 0 8"/><path d="M17.7 5a9 9 0 0 1 0 14"/><path d="M6 15h-2a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-4.5a.8.8 0 0 1 1.5.5v14a.8.8 0 0 1-1.5.5l-3.5-4.5"/>',
 'download': '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M7 11l5 5l5-5"/><path d="M12 4v12"/>',
 'search': '<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M21 21l-6-6"/>',
 'notebook': '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-11a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1m3 0v18"/><path d="M13 8h2"/><path d="M13 12h2"/>',
 'menu': '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
 'check': '<path d="M5 12l5 5l10-10"/>',
 'check-circle': '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0"/><path d="M9 12l2 2l4-4"/>',
 'arrow': '<path d="M5 12h14"/><path d="M13 18l6-6"/><path d="M13 6l6 6"/>',
 'pencil': '<path d="M4 20h4l10.5-10.5a2.828 2.828 0 1 0-4-4l-10.5 10.5v4"/>',
 'quiz': '<path d="M9 5h-2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2"/><path d="M9 14l2 2l4-4"/>',
 'mic': '<path d="M9 5a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3z"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M8 21h8"/><path d="M12 17v4"/>',
 'dots': '<path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/><path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/>',
 'sparkle': '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.7 1.8l1.8.7l-1.8.7L19 21l-.7-1.8l-1.8-.7l1.8-.7z"/>',
 'sliders': '<path d="M4 8h10"/><path d="M18 8h2"/><path d="M16 8m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M4 16h2"/><path d="M10 16h10"/><path d="M8 16m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/>',
 'cards': '<path d="M3 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1"/><path d="M18 7l3 1v10l-3 1"/>',
}
FILLED = {'play': '<path d="M7 4v16l13-8z"/>', 'pause': '<path d="M6 5h4v14h-4z"/><path d="M14 5h4v14h-4z"/>', 'stop': '<path d="M5 5h14v14h-14z"/>'}
def svg(n, s=18):
    if n in FILLED: return f'<svg class="ic" width="{s}" height="{s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{FILLED[n]}</svg>'
    return f'<svg class="ic" width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[n]}</svg>'
ICON_JS = 'const ICP = ' + json.dumps({**ICONS, **FILLED}) + ';\nconst ICF = ' + json.dumps(list(FILLED)) + ';\nconst ic = (n, s = 18) => ICF.includes(n) ? `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICP[n]}</svg>` : `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICP[n]}</svg>`;\n'

# dictionary: dict/dict.json, the word lookup data used by site-src/lookup.js (injected as DATA.dict).
dictionary = json.load(open(f'{ROOT}/dict/dict.json', encoding='utf-8'))
import csv
# culture: {story id: {country, city, landmark, caption}} from the photo-brief CSV; JSON files in photo-brief/new/
# (sorted by name, each a list of rows with the same columns) are applied afterwards and override/add by id.
culture = {r['id']: {'country': r['country'], 'city': r['city'], 'landmark': r['landmark'], 'caption': r['caption']} for r in csv.DictReader(open(f'{ROOT}/photo-brief/photo-prompts.csv', encoding='utf-8'))}
import glob as _g
for _f in sorted(_g.glob(f'{ROOT}/photo-brief/new/*.json')):
    for _r in json.load(open(_f, encoding='utf-8')):
        culture[_r['id']] = {'country': _r['country'], 'city': _r['city'], 'landmark': _r['landmark'], 'caption': _r['caption']}
# gq: grammar quiz, {story id: [question {topic, q, options[4], answer (index), why}]}.
# Options are shuffled at build time so the answer position varies. The RNG is seeded per question with
# "<story id>-<question index>", so the order is deterministic: identical on every build, and one question's shuffle
# never depends on another's. _o is a permutation of 0..3 (new slot j shows old option _o[j]); the stored `answer`
# is remapped to _o.index(old answer), the slot where the correct option landed. Assumes exactly 4 options per question.
import random as _r
gq = json.load(open(f'{ROOT}/grammar-quiz/all-gq.json', encoding='utf-8'))
for _sid, _qs in gq.items():
    for _i, _q in enumerate(_qs):
        _rng = _r.Random(f'{_sid}-{_i}'); _o = list(range(4)); _rng.shuffle(_o)
        _q['options'] = [_q['options'][k] for k in _o]; _q['answer'] = _o.index(_q['answer'])
# Tag each question with a display category: categories.json maps grammar topic -> category; unknown topics become 'Other'.
cats = json.load(open(f'{ROOT}/grammar-quiz/categories.json', encoding='utf-8'))
for _qs in gq.values():
    for _q in _qs: _q['cat'] = cats.get(_q['topic'], 'Other')
# Remaining data files, injected as-is: dialogues = {story id: role-play script with steps}; essentials = per-level
# "grammar essentials" topic lists (A1-B2 only); partners/goals = role-play partner and goal info per story;
# placement = level-check question bank + can-do statements; cfg = optional site-config.json ({} if absent).
dialogues = json.load(open(f'{ROOT}/dialogues/all-dialogues.json', encoding='utf-8'))
essentials = {lv: json.load(open(f'{ROOT}/grammar-quiz/essentials-{lv}.json', encoding='utf-8'))['topics'] for lv in ('a1','a2','b1','b2')}
partners = json.load(open(f'{ROOT}/dialogues/partners.json', encoding='utf-8'))
placement = {'bank': json.load(open(f'{ROOT}/placement/bank.json', encoding='utf-8')), 'cando': json.load(open(f'{ROOT}/placement/cando.json', encoding='utf-8'))}
import os
cfg = json.load(open(f'{ROOT}/site-config.json')) if os.path.exists(f'{ROOT}/site-config.json') else {}
goals = json.load(open(f'{ROOT}/dialogues/goals.json', encoding='utf-8'))
# flt: keep only entries whose key is the id of a published story (those that passed LIVE_LEVELS above). Applied to every
# story-keyed dict so orphaned or not-yet-live data never ships; NOT applied to culture, dictionary, essentials or placement.
_ids = {x['id'] for x in stories}
flt = lambda d: {k: v for k, v in d.items() if k in _ids}
gq, grammar, dialogues, scenes, partners, goals = flt(gq), flt(grammar), flt(dialogues), flt(scenes), flt(partners), flt(goals)
# data: the object injected as DATA; its top-level keys are what the site-src/*.js code reads (DATA.stories, DATA.gq, ...).
data = {'cfg': cfg, 'goals': goals, 'placement': placement, 'partners': partners, 'essentials': essentials, 'gq': gq, 'dialogues': dialogues, 'culture': culture, 'stories': stories, 'scenes': scenes, 'meta': meta, 'grammar': grammar, 'dict': dictionary}
# CSS: base.css, extra.css, then a11y.css (later rules win). art = renderer source; app = main app source, into which the other
# site-src scripts are spliced by plain str.replace() on /*__NAME__*/ markers (a marker missing from app.js silently
# does nothing). conj.js (conjugation engine) is NOT spliced: it becomes its own <script> block before app.js.
css = open(f'{ROOT}/site-src/base.css', encoding='utf-8').read() + open(f'{ROOT}/site-src/extra.css', encoding='utf-8').read() + open(f'{ROOT}/site-src/a11y.css', encoding='utf-8').read()
art = open(f'{ROOT}/art/art.js', encoding='utf-8').read()
app = open(f'{ROOT}/site-src/app.js', encoding='utf-8').read()
app = app.replace('/*__ICONS__*/', ICON_JS)
app = app.replace('/*__AI__*/', open(f'{ROOT}/site-src/ai.js', encoding='utf-8').read())
app = app.replace('/*__NOTEBOOK__*/', open(f'{ROOT}/site-src/notebook.js', encoding='utf-8').read())
app = app.replace('/*__PROGRESS__*/', open(f'{ROOT}/site-src/progress.js', encoding='utf-8').read())
app = app.replace('/*__WARMUP__*/', open(f'{ROOT}/site-src/warmup.js', encoding='utf-8').read())
app = app.replace('/*__SPEAK__*/', open(f'{ROOT}/site-src/speak.js', encoding='utf-8').read())
app = app.replace('/*__LOOKUP__*/', open(f'{ROOT}/site-src/lookup.js', encoding='utf-8').read())
conj = open(f'{ROOT}/site-src/conj.js', encoding='utf-8').read()
# dj: the data as a JSON string embedded in an inline <script>. ensure_ascii=False keeps Spanish text as real characters
# (smaller, readable). Every "</" is rewritten to "<\/": story text contains HTML such as </b>, and a literal "</script"
# inside the data would end the script block early. "\/" is a valid JSON/JS escape for "/", so the parsed value is unchanged.
dj = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
# The page template (an f-string: {expr} is substituted, so literal JS/CSS braces inside it must be doubled as {{ }}).
# Script blocks run in this order: DATA, art.js (Art), conj.js (Conj), app.js (uses all three). The <main id="app"> is empty;
# app.js renders the views into it.
html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stories first. Fluency follows. – Free Spanish short stories</title>
<meta name="description" content="60 free Spanish short stories from A1 to C2 with audio, translation, quizzes, flashcards, writing practice and free PDFs.">
<style>{css}</style></head><body>
<a class="skip" href="#app">Skip to content</a>
<nav aria-label="Main"><div class="brand"><a class="logo" href="#stories">Stories first. Fluency follows<span class="or">.</span><span class="free-tag">100% free</span></a><span class="nq" title="Attributed to Frederick Douglass">“Once you learn to read, you will be forever free.”</span></div>
<div class="menu" id="menulist"><a class="nl" href="#stories">Stories</a><a class="nl" href="#progress">My level</a><a class="nl" href="#learn">How to learn</a><a class="nl" href="#classroom">Classroom</a><a class="nl pdf m" href="#resources">{svg('download', 16)} Free Resources</a></div>
<a class="nl ic" id="nb-nav" href="#" aria-label="Notebook" title="Notebook">{svg('notebook', 20)}<span class="lbl">Notebook</span></a><a class="nl ic" id="lk-nav" href="#" aria-label="Lookup" title="Lookup">{svg('search', 20)}<span class="lbl">Lookup</span></a>
<a class="nl pdf d" href="#resources">{svg('download', 16)} Resources</a><button id="menu" aria-label="Menu" aria-expanded="false">{svg('menu', 22)}</button></nav>
<main id="app" tabindex="-1"></main>
<footer>Free for everyone: no sign-up, no ads, no purchases. PDFs are free to download and print for personal and classroom use.<br>
<a href="#stories">Stories</a><a href="#learn">How to learn</a><a href="#classroom">Classroom</a><a href="#resources">Resources</a><br>
<small class="copy">© 2026 Ruthie D. Lyle, PhD. Stories, illustrations and other content: all rights reserved, free for personal and classroom use. The source code is free software under the <a href="https://github.com/rlylecannon/spanish-short-stories">GNU AGPL v3</a>. These stories are fiction: the characters are invented, while the places and history are real.</small><br>
<small>Your quiz scores, drafts and progress are saved on your device.<span id="syncnote"></span></small></footer>
<script>try{{if(window.claude&&claude.use)document.getElementById("syncnote").textContent=" If you are signed in to Claude, your progress also follows you across devices."}}catch(e){{}}</script>
<button id="top" onclick="scrollTo(0,0)" aria-label="Back to top">↑</button>
<script>const DATA={dj};</script>
<script>{art}</script>
<script>{conj}</script>
<script>{app}</script>
</body></html>'''
# Write the page and print its size in KB plus the per-level word-count ranges (meta) as a quick sanity check.
os.makedirs(OUT, exist_ok=True)
open(f'{OUT}/index.html', 'w', encoding='utf-8').write(html)
print('wrote', f'{OUT}/index.html', f'{len(html) // 1024} KB', meta)

# hosted fragment for the Artifact tool (no doctype/html/head/body; title + style first)
# SIDE EFFECT: every build also writes <project>/_publish/page.html (inside the project folder, regardless of OUT_DIR).
# It is index.html reduced to a fragment: a fixed <title>, the FIRST <style> block (non-greedy), then everything between
# <body> and the LAST </body> (greedy, re.S), i.e. nav, main, footer and all the scripts. <head> metas are dropped.
pub = os.path.join(ROOT, '_publish'); os.makedirs(pub, exist_ok=True)
frag = '<title>Free Spanish Stories</title>\n' + re.search(r'<style>.*?</style>', html, re.S).group(0) + '\n' + re.search(r'<body>(.*)</body>', html, re.S).group(1)
open(os.path.join(pub, 'page.html'), 'w', encoding='utf-8').write(frag)
print('fragment', len(frag) // 1024, 'KB')
