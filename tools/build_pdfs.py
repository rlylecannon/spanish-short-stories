#!/usr/bin/env python3
"""Generate all free PDF resources from stories/all-stories.json + art/scenes-*.json.
usage: python3 build_pdfs.py OUT_DIR   (writes OUT_DIR/stories, levels, vocab, guides)"""
# PURPOSE: build the free printable PDFs offered on the site (per-story PDFs, per-level readers and vocabulary lists, two guides).
# INPUTS: stories/all-stories.json (uses lines [[es, en], ...], vocab [[word, gloss], ...], quiz [{q, options, answer}], prompt,
#   title, titleEn, teaser, level, id) and art/scenes-*.json (rendered to PNG through art/render.js).
# OUTPUTS under OUT_DIR: stories/<id>.pdf, levels/<level>-reader.pdf, vocab/<level>-vocabulary.pdf,
#   guides/how-to-learn-with-stories.pdf, guides/classroom-guide.pdf. Scratch files go to /tmp/pdf-art (scenes.json, png/).
# USAGE: python3 tools/build_pdfs.py OUT_DIR      (OUT_DIR is required)
# SAFE TO RE-RUN: yes; it only reads the project and overwrites the PDFs in OUT_DIR (and the /tmp/pdf-art scratch folder).
# REQUIREMENTS / CAVEATS:
#   - Python package reportlab, plus `node` and ImageMagick (`convert`, used by art/render.js) on PATH.
#   - The DejaVu font directory is hard-coded to the Linux path /usr/share/fonts/truetype/dejavu/; on macOS or Windows
#     registerFont fails until D is changed to a directory holding those eight .ttf files.
#   - Every story id needs a scene in art/scenes-*.json, otherwise its PNG is missing and the PDF build fails.
#   - It does NOT filter by live level like build_site.py does; a level outside A1-C2 raises KeyError in LVNAME/LVCOL.
#   - Counts in the text are hard-coded: "Story N of 10", "10 stories" per level, "(60)" story PDFs, "five-question quiz".
#   - The quiz here is the story's own comprehension quiz (s['quiz']), not the grammar quiz in grammar-quiz/.
import json, os, re, subprocess, sys, glob
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
                                Image, Table, TableStyle, KeepTogether, HRFlowable)

# ROOT = project root (parent of tools/); OUT = output directory from the command line.
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = sys.argv[1]
# Fonts: DejaVu Serif/Sans (cover Spanish accents) registered under short names, then grouped into families so
# <b>/<i> inside Paragraph text pick the bold/italic faces. D is the Linux install path (see header caveat).
D = '/usr/share/fonts/truetype/dejavu/'
for n, f in [('Serif', 'DejaVuSerif.ttf'), ('Serif-B', 'DejaVuSerif-Bold.ttf'), ('Serif-I', 'DejaVuSerif-Italic.ttf'), ('Serif-BI', 'DejaVuSerif-BoldItalic.ttf'),
             ('Sans', 'DejaVuSans.ttf'), ('Sans-B', 'DejaVuSans-Bold.ttf'), ('Sans-I', 'DejaVuSans-Oblique.ttf'), ('Sans-BI', 'DejaVuSans-BoldOblique.ttf')]:
    pdfmetrics.registerFont(TTFont(n, D + f))
pdfmetrics.registerFontFamily('Serif', normal='Serif', bold='Serif-B', italic='Serif-I', boldItalic='Serif-BI')
pdfmetrics.registerFontFamily('Sans', normal='Sans', bold='Sans-B', italic='Sans-I', boldItalic='Sans-BI')

# Palette, per-level badge colours / names, and the paragraph styles (st) used throughout; S is a ParagraphStyle shortcut.
ORANGE = colors.HexColor('#e8731f'); INK = colors.HexColor('#1d1d1d'); MUTE = colors.HexColor('#666666'); LINE = colors.HexColor('#cccccc')
LVCOL = {'A1': '#8fe38f', 'A2': '#ffd37a', 'B1': '#a9d4ff', 'B2': '#f5b27a', 'C1': '#c9b5f0', 'C2': '#f2a7c3'}
LVNAME = {'A1': 'Beginner', 'A2': 'Elementary', 'B1': 'Intermediate', 'B2': 'Upper intermediate', 'C1': 'Advanced', 'C2': 'Proficient'}
S = lambda name, **k: ParagraphStyle(name, **k)
st = {
 'title': S('t', fontName='Serif-B', fontSize=26, leading=30, spaceAfter=4),
 'sub': S('s', fontName='Serif', fontSize=13, leading=17, textColor=MUTE, spaceAfter=10),
 'h2': S('h2', fontName='Serif-B', fontSize=15, leading=19, textColor=ORANGE, spaceBefore=12, spaceAfter=8),
 'h3': S('h3', fontName='Serif-B', fontSize=12.5, leading=16, spaceBefore=8, spaceAfter=4),
 'body': S('b', fontName='Serif', fontSize=11.5, leading=18, spaceAfter=6),
 'en': S('e', fontName='Serif-I', fontSize=10.5, leading=15, textColor=MUTE, spaceAfter=9, leftIndent=10),
 'small': S('sm', fontName='Sans', fontSize=9, leading=12, textColor=MUTE),
 'sans': S('sa', fontName='Sans', fontSize=10.5, leading=15, spaceAfter=4),
 'q': S('q', fontName='Sans-B', fontSize=10.5, leading=14, spaceBefore=8, spaceAfter=3),
 'opt': S('o', fontName='Sans', fontSize=10.5, leading=14, leftIndent=14),
 'cell': S('c', fontName='Sans', fontSize=10, leading=13),
}

# x(): make story text safe for reportlab's Paragraph mini-markup. <b>..</b> is swapped to control-character placeholders
# (\x01/\x02) first so it survives escaping of & < >; other tags are therefore shown literally, not interpreted.
# plain(): strip all tags.
def x(t):
    """escape text but keep <b>…</b>; newlines -> <br/>"""
    t = t.replace('<b>', '\x01').replace('</b>', '\x02')
    t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return t.replace('\x01', '<b>').replace('\x02', '</b>').replace('\n', '<br/>')
def plain(t): return re.sub(r'<[^>]+>', '', t)

# footer(): page footer (copyright, fiction note, page number), run on every page via PageTemplate onPage.
# mkdoc(): a Letter-size document with one full-page frame inside the margins.
def footer(canv, doc):
    canv.saveState(); canv.setFont('Sans', 8); canv.setFillColor(MUTE)
    canv.drawString(2 * cm, 1.2 * cm, 'Stories first. Fluency follows.  ·  \u00a9 2026 Ruthie D. Lyle, PhD. All rights reserved. Free for personal and classroom use.')
    canv.drawString(2 * cm, 0.8 * cm, 'Fiction: characters are invented; places and history are real.')
    canv.drawRightString(letter[0] - 2 * cm, 1.2 * cm, str(doc.page)); canv.restoreState()
def mkdoc(path, title):
    d = BaseDocTemplate(path, pagesize=letter, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=2 * cm, title=title, author='Stories first. Fluency follows.')
    d.addPageTemplates([PageTemplate(id='p', frames=[Frame(d.leftMargin, d.bottomMargin, d.width, d.height, id='f')], onPage=footer)])
    return d

# Load the data, then rasterise every scene once up front: scenes are dumped to a scratch JSON and art/render.js (node)
# writes /tmp/pdf-art/png/<id>.png. pic(id, w) returns it as a 4:3 reportlab Image of width w.
stories = json.load(open(os.path.join(ROOT, 'stories/all-stories.json'), encoding='utf-8'))
scenes = {}
for f in glob.glob(os.path.join(ROOT, 'art/scenes-*.json')): scenes.update(json.load(open(f)))
# render illustrations to PNG
tmp = '/tmp/pdf-art'; os.makedirs(tmp, exist_ok=True)
json.dump(scenes, open(tmp + '/scenes.json', 'w'))
subprocess.run(['node', os.path.join(ROOT, 'art/render.js'), tmp + '/scenes.json', tmp + '/png'], check=True, stdout=subprocess.DEVNULL)
def pic(sid, w=11 * cm):
    return Image(f'{tmp}/png/{sid}.png', width=w, height=w * 0.75)

# story_flow(): the list of flowables for one story: level badge, title, teaser, picture, Spanish text, optionally the
# translation page, a two-column vocabulary table (list split in half), and optionally quiz + writing lines + answer key.
# The level readers call it with with_quiz=False. `compact` is accepted but unused. Story number = last two digits of the id.
def story_flow(s, with_trans=True, with_quiz=True, compact=False):
    f = []
    lvl = s['level']; num = int(s['id'][-2:])
    badge = Table([[Paragraph(f'<font color="#1d1d1d"><b>{lvl}</b></font> &nbsp;{LVNAME[lvl]} · Story {num} of 10', st['sans'])]],
                  style=[('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(LVCOL[lvl])), ('BOX', (0, 0), (-1, -1), .5, INK), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)], hAlign='LEFT')
    f += [badge, Spacer(1, 8), Paragraph(x(s['title']), st['title']), Paragraph(f"({x(s['titleEn'])})", st['sub']), Paragraph(x(s['teaser']), st['sans']), Spacer(1, 6)]
    f += [pic(s['id'], 8.5 * cm), Spacer(1, 4)]
    f += [Paragraph('Spanish story', st['h2'])]
    for es, en in s['lines']: f.append(Paragraph(x(es), st['body']))
    if with_trans:
        f += [PageBreak(), Paragraph('Spanish story with English translation', st['h2'])]
        for es, en in s['lines']:
            f.append(Paragraph(x(es), st['body'])); f.append(Paragraph(x(en), st['en']))
    f += [Paragraph('Key vocabulary', st['h2'])]
    v = s['vocab']; half = (len(v) + 1) // 2
    rows = []
    for i in range(half):
        a = v[i]; b = v[i + half] if i + half < len(v) else ['', '']
        rows.append([Paragraph(f'<b>{x(a[0])}</b> – {x(a[1])}', st['cell']), Paragraph(f'<b>{x(b[0])}</b> – {x(b[1])}' if b[0] else '', st['cell'])])
    f.append(Table(rows, colWidths=[8.5 * cm, 8.5 * cm], style=[('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BOTTOMPADDING', (0, 0), (-1, -1), 3), ('LINEBELOW', (0, 0), (-1, -1), .25, LINE)]))
    if with_quiz:
        f += [PageBreak(), Paragraph('Comprehension quiz', st['h2']), Paragraph('Circle the best answer. The answer key is on the last page.', st['small'])]
        for i, q in enumerate(s['quiz']):
            blk = [Paragraph(f'{i + 1}. {x(q["q"])}', st['q'])]
            for j, o in enumerate(q['options']): blk.append(Paragraph(f'{"abcd"[j]})&nbsp; {x(o)}', st['opt']))
            f.append(KeepTogether(blk))
        f += [Paragraph('Writing practice', st['h2']), Paragraph(x(s['prompt']), st['sans']), Paragraph('Answer in Spanish. Try to use at least three words from the vocabulary list.', st['small']), Spacer(1, 6)]
        f.append(Table([[''] for _ in range(7)], rowHeights=[22] * 7, colWidths=[17 * cm], style=[('LINEBELOW', (0, 0), (-1, -1), .5, LINE)]))
        f += [PageBreak(), Paragraph('Answer key', st['h2'])]
        # (answer key: q["answer"] is the index of the correct option; letters a-d)
        for i, q in enumerate(s['quiz']): f.append(Paragraph(f'{i + 1}. <b>{"abcd"[q["answer"]]})</b> {x(q["options"][q["answer"]])}', st['sans']))
    return f

# ---------- per-story PDFs ----------
os.makedirs(OUT + '/stories', exist_ok=True)
for s in stories:
    d = mkdoc(f'{OUT}/stories/{s["id"]}.pdf', s['title'] + ' – ' + s['titleEn'])
    d.build(story_flow(s))
print('story PDFs:', len(stories))

# ---------- level readers ----------
os.makedirs(OUT + '/levels', exist_ok=True); os.makedirs(OUT + '/vocab', exist_ok=True)
# For each level: a reader (cover + contents + every story with translation, no quiz, stories separated by page breaks;
# the final PageBreak is dropped with f[:-1]) and a vocabulary list grouped by story (vocab entries are [word, gloss]).
for lvl in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
    ss = [s for s in stories if s['level'] == lvl]
    d = mkdoc(f'{OUT}/levels/{lvl.lower()}-reader.pdf', f'{lvl} Reader – 10 Spanish short stories')
    f = [Spacer(1, 3 * cm), Paragraph(f'{lvl} Reader', st['title']), Paragraph(f'{LVNAME[lvl]} · 10 Spanish short stories with translations and vocabulary', st['sub']), Spacer(1, 10)]
    f += [Paragraph('In this book', st['h2'])]
    for s in ss: f.append(Paragraph(f'{int(s["id"][-2:])}. {x(s["title"])} <font color="#666666">– {x(s["titleEn"])}</font>', st['sans']))
    f += [Spacer(1, 14), Paragraph('Read the Spanish first without the translation, then check it. Stories get gradually harder from 1 to 10, so go in order.', st['small']), PageBreak()]
    for s in ss: f += story_flow(s, with_trans=True, with_quiz=False) + [PageBreak()]
    d.build(f[:-1])
    # vocabulary list
    d = mkdoc(f'{OUT}/vocab/{lvl.lower()}-vocabulary.pdf', f'{lvl} Vocabulary list')
    f = [Paragraph(f'{lvl} vocabulary list', st['title']), Paragraph('Every key word from the ten stories, grouped by story. Cover one column and test yourself.', st['sub'])]
    for s in ss:
        f.append(Paragraph(f'{int(s["id"][-2:])}. {x(s["title"])} <font color="#666666" size="10">({x(s["titleEn"])})</font>', st['h3']))
        rows = [[Paragraph(f'<b>{x(a)}</b>', st['cell']), Paragraph(x(b), st['cell'])] for a, b in s['vocab']]
        f.append(Table(rows, colWidths=[8 * cm, 9 * cm], style=[('LINEBELOW', (0, 0), (-1, -1), .25, LINE), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
    d.build(f)
print('level PDFs: 6 readers + 6 vocab lists')

# ---------- guides ----------
os.makedirs(OUT + '/guides', exist_ok=True)
# bullets(): turn strings (which may contain <b>) into hanging-indent bullet paragraphs. The guide text below is hard-coded prose.
def bullets(items): return [Paragraph('•&nbsp; ' + t, ParagraphStyle('bl', parent=st['sans'], leftIndent=14, firstLineIndent=-10, spaceAfter=5)) for t in items]
d = mkdoc(OUT + '/guides/how-to-learn-with-stories.pdf', 'How to learn Spanish with stories')
f = [Paragraph('How to learn Spanish with stories', st['title']), Paragraph('A free, one-page method you can start today', st['sub']),
     Paragraph('Why stories work', st['h2']),
     Paragraph('Stories give words a context, so you remember them because of what happened, not because of a list. You also meet grammar the way native speakers use it, inside real sentences, which means you absorb patterns before you have to name them.', st['sans']),
     Paragraph('Start with a level check', st['h2']),
     Paragraph('On the website, take the level check to find your starting level. It takes about 10 minutes and you can retake it any time. If you only have this PDF, start with the first A1 story.', st['sans']),
     Paragraph('The routine (20\u201330 minutes per story)', st['h2'])]
f += bullets(['<b>Listen and read.</b> Tap a word for its meaning, or play the audio and follow the text. Aim for the main idea, not every word.',
              '<b>Read again with the translation.</b> Compare the two languages.',
              '<b>Review.</b> Study the bold vocabulary, then recall each meaning before you check it.',
              '<b>Quiz.</b> Answer the comprehension and grammar questions, then reread what you missed.',
              '<b>Write.</b> Answer the story prompt in your own words. Reuse words from the story.',
              '<b>Speak.</b> Read aloud, retell the story, then try the role-play.',
              '<b>Come back later.</b> A reread after a few days feels easier. That is progress.'])
f += [Paragraph('Which level should I start with?', st['h2'])]
# _rng(level): "about N-M words" for the level table below: min story length rounded DOWN and max rounded UP to a multiple
# of 10 (the -(-x // 10) idiom is ceiling division). Counted the same way as in build_site.py.
import re as _re
def _rng(lv):
    ns = [len(_re.findall(r"[\wáéíóúüñÁÉÍÓÚÜÑ]+", _re.sub('<[^>]+>', '', ' '.join(l[0] for l in s_['lines'])))) for s_ in stories if s_['level'] == lv]
    return f"about {int(min(ns) // 10 * 10):,}\u2013{int(-(-max(ns) // 10) * 10):,} words"
rows = [[Paragraph('<b>Level</b>', st['cell']), Paragraph('<b>You can…</b>', st['cell']), Paragraph('<b>Stories use…</b>', st['cell'])],
        ['A1', 'greet people and talk about daily life in simple sentences', 'present tense, short sentences, ' + _rng('A1')],
        ['A2', 'tell what happened yesterday and describe people and places', 'past tenses (preterite and imperfect), ' + _rng('A2')],
        ['B1', 'follow longer stories and explain your opinions', 'all common past tenses, future, conditional, the present subjunctive, ' + _rng('B1')],
        ['B2', 'read complex texts and understand implied meaning', 'advanced subjunctive, passive, idioms, ' + _rng('B2')],
        ['C1', 'follow demanding texts and use Spanish flexibly', 'subjunctive in all tenses, passives, formal connectors, idiom, ' + _rng('C1')],
        ['C2', 'understand almost everything and catch irony and subtext', 'literary and legal registers, irony, dialect, ' + _rng('C2')]]
rows = [rows[0]] + [[Paragraph(f'<b>{a}</b>', st['cell']), Paragraph(b, st['cell']), Paragraph(c, st['cell'])] for a, b, c in rows[1:]]
f.append(Table(rows, colWidths=[1.6 * cm, 7.2 * cm, 8.2 * cm], style=[('GRID', (0, 0), (-1, -1), .4, LINE), ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f1ec')), ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
f += [Spacer(1, 8), Paragraph('If you are unsure, start with the first A1 story. If it feels too easy, jump ahead; if the next level feels too hard, go back one level and read more stories there. Reading many easy stories builds fluency faster than struggling through hard ones.', st['sans'])]
d.build(f)

d = mkdoc(OUT + '/guides/classroom-guide.pdf', 'Classroom guide – using the stories with a class')
f = [Paragraph('Classroom guide', st['title']), Paragraph('Free for teachers, tutors and homeschool families', st['sub']),
     Paragraph('What you can print', st['h2'])]
f += bullets(['<b>Story PDFs</b> (60): the story, a translation page, key vocabulary, a five-question quiz, a writing prompt and an answer key.',
              '<b>Level readers</b> (6): all ten stories of a level in one book, ready to copy for a class set.',
              '<b>Vocabulary lists</b> (6): every key word of a level, grouped by story.'])
f += [Paragraph('A 45-minute lesson with one story', st['h2'])]
f += bullets(['<b>Warm-up (5 min).</b> Show the illustration. Students predict what happens, in English or in simple Spanish.',
              '<b>Listen (5 min).</b> Play the audio once with books closed, then once while students follow the text.',
              '<b>Read in pairs (10 min).</b> Students read aloud in turns and underline anything they cannot guess.',
              '<b>Vocabulary (5 min).</b> Go through the bold words. Students use two of them in their own sentence.',
              '<b>Quiz (10 min).</b> Students answer individually, then compare. Discuss the questions they disagreed on.',
              '<b>Write and share (10 min).</b> Students answer the writing prompt, then read a sentence to a partner.'])
f += [Paragraph('Tips', st['h2'])]
f += bullets(['Keep the stories in order within each level. They get gradually harder and recycle vocabulary.',
              'For mixed-level classes, give stronger students the next level and let them read a story to the group.',
              'Use the translation page as a support, not a first step. Ask students to read the Spanish first.',
              'Answers to the quizzes are on the last page of each story PDF. Remove that page before copying for students.'])
d.build(f)
print('guides: 2')
