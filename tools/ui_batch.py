#!/usr/bin/env python3
"""One-off edit script: UI batch (nav, section strip, finish card, progress, icons, sheets, dark mode)."""
# ONE-OFF SOURCE PATCHER (an earlier UI pass; already applied). Do NOT run it again. It is kept as a record of what changed.
# PURPOSE: edit the site sources in place by exact-string anchors: swap emoji for SVG icons, add the section-progress strip
#   (#secnav), finish card, "continue" card, nav/menu wiring and a dark-mode theme.
# FILES IT REWRITES (paths under the project root R, found from this file's location): site-src/app.js, site-src/notebook.js,
#   site-src/lookup.js, site-src/base.css, site-src/extra.css, AND tools/build_site.py itself (icons block, /*__ICONS__*/
#   injection and a new <nav>).
# USAGE: python3 tools/ui_batch.py     (no arguments)
# SAFE TO RE-RUN: NO. It patches by string anchors and has no "already applied" check, so a second run double-patches or fails
#   half-way. Specifically: most replacements go through sub1(), which asserts the anchor text exists (AssertionError
#   "missing: <label>") and replaces only the first match, but app.js, notebook.js and lookup.js are each written as soon as their
#   section finishes, so a failure later leaves earlier files already modified; the plain .replace() / re.sub() steps never fail,
#   and the CSS section appends a second copy of the dark-mode block to extra.css. Some anchors it needs are already gone
#   (site-src/app.js no longer contains the '👆 Tap any word' text, so the app.js section stops there before writing anything;
#   build_site.py has no bare "<nav>", so that section would raise ValueError), but do not rely on that as a safeguard.
# NOTE: the nav markup and icon table it inserts into build_site.py no longer match the current build_site.py, which has been
#   edited since; treat tools/build_site.py, not this script, as the source of truth.
import re, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# rd/wr: read/write a project file by path relative to R (UTF-8). Nothing is written until each section's wr() call.
def rd(p): return open(os.path.join(R, p), encoding='utf-8').read()
def wr(p, s): open(os.path.join(R, p), 'w', encoding='utf-8').write(s)
# sub1: replace the FIRST occurrence of `old` with `new`, asserting that `old` is present; `label` names the step in the error.
def sub1(s, old, new, label):
    assert old in s, 'missing: ' + label
    return s.replace(old, new, 1)

# ---------------------------------------------------------------- app.js
a = rd('site-src/app.js')
a = sub1(a, "  const esc = t =>", "/*__ICONS__*/\n  const esc = t =>", 'esc')
a = sub1(a, "  const scores = () => store.get('sff-scores', {});",
 "  const scores = () => store.get('sff-scores', {});\n  let secRefresh = null;\n  const PROG = { get: id => (store.get('sff-prog', {}))[id] || {}, mark(id, k) { const x = store.get('sff-prog', {}); (x[id] = x[id] || {})[k] = 1; store.set('sff-prog', x); secRefresh && secRefresh(); } };", 'scores')
# hooks
a = sub1(a, "store.set('sff-scores', all); quiz();", "store.set('sff-scores', all); secRefresh && secRefresh(); quiz();", 'quiz hook')
a = sub1(a, "      if (ci >= deck.length) {\n", "      if (ci >= deck.length) {\n        PROG.mark(s.id, 'cards');\n", 'cards hook')
a = sub1(a, "saveT = setTimeout(() => { $('wsaved').textContent", "saveT = setTimeout(() => { setTimeout(() => secRefresh && secRefresh(), 0); $('wsaved').textContent", 'write hook')
a = sub1(a, "store.set(pkey, posts); draw();", "store.set(pkey, posts); secRefresh && secRefresh(); draw();", 'post hook')
a = a.replace("color:#222", "color:var(--ink)")

# play / stop buttons use icons
a = sub1(a, """const setUI = on => { play.innerHTML = on ? '<span aria-hidden="true">❚❚</span> Pause' : '<span aria-hidden="true">▶</span> Play';""",
 """const setUI = on => { play.innerHTML = on ? ic('pause', 16) + ' Pause' : ic('play', 16) + ' Play';""", 'setUI')

# --- story(): crumbs + back link
a = sub1(a, """<div class="crumbs"><a href="#stories">Home</a><span>›</span><a href="#stories">Spanish Stories</a><span>›</span><a href="#stories-${lv.toLowerCase()}">${lv}</a><span>›</span>${esc(s.title)}</div>""",
 """<div class="crumbs"><a href="#stories">Home</a><span>›</span><a href="#stories">Spanish Stories</a><span>›</span><a href="#stories-${lv.toLowerCase()}">${lv}</a><span>›</span>${esc(s.title)}</div>
    <a class="backlink" href="#stories-${lv.toLowerCase()}">‹ ${lv} stories</a>""", 'crumbs')
# toolbar icons
a = sub1(a, '''<button data-p="tips" aria-expanded="false">💡 Tips</button><button data-p="gr" aria-expanded="false">📖 Before You Read</button><button data-p="audio" aria-expanded="false">🔊 Audio</button><button data-p="dl" aria-expanded="false">⬇ Downloads</button></div>''',
 '''<button data-p="tips" aria-expanded="false">${ic('bulb')} Tips</button><button data-p="gr" aria-expanded="false">${ic('book')} Before You Read</button><button data-p="audio" aria-expanded="false">${ic('volume')} Audio</button><button data-p="dl" aria-expanded="false">${ic('download')} Downloads</button></div>
    <div class="secnav" id="secnav" aria-label="Story sections"><a href="#story" data-s="read">${ic('book', 16)}<span>Read</span><i class="ck">${ic('check', 12)}</i></a><a href="#part1" data-s="quiz">${ic('quiz', 16)}<span>Quiz</span><i class="ck">${ic('check', 12)}</i></a><a href="#part1" data-s="cards">${ic('cards', 16)}<span>Cards</span><i class="ck">${ic('check', 12)}</i></a><a href="#wr" data-s="write">${ic('pencil', 16)}<span>Write</span><i class="ck">${ic('check', 12)}</i></a></div>''', 'toolbar')
# hint
a = sub1(a, '👆 Tap any word', 'Tap any word', 'hint')
# finish card after the story section; part1 id; tab icons
a = sub1(a, '''      <div class="part">Part 1</div>''', '''      <section class="card finish" id="storyend"><div class="fin-ic">${ic('check-circle', 30)}</div><div class="fin-t"><h3>You finished the story</h3><p>Now check what you understood.</p></div><div class="fin-b"><button class="btn" id="fin-quiz">Take the quiz</button>${next ? `<a class="btn ghost" href="#story-${next.id}">Next story</a>` : nextLevel ? `<a class="btn ghost" href="#story-${nextLevel.id}">Next level</a>` : ''}</div></section>

      <div class="part" id="part1">Part 1</div>''', 'part1')
a = sub1(a, '📝 Comprehension Quiz', "${ic('quiz', 16)} Comprehension Quiz", 'tab1')
a = sub1(a, '🗂 Vocabulary Flashcards', "${ic('cards', 16)} Vocabulary Flashcards", 'tab2')
a = sub1(a, '<span class="eyebrow">📖 Before You Read</span>', '<span class="eyebrow">${ic(\'book\', 14)} Before You Read</span>', 'eyebrow')
a = sub1(a, "🔑 Key Ideas in This Story", "Key Ideas in This Story", 'key')
# stop button label
a = sub1(a, '■ Stop</button>', "${ic('stop', 14)} Stop</button>", 'stop')
# wiring after audio/practice/writing
a = sub1(a, "    const tb = app.querySelector('#tb');", """    store.set('sff-last', s.id);
    { const h = app.querySelector('#taphint'); if (h) { if (store.get('sff-hint', false)) h.remove(); else { store.set('sff-hint', true); h.querySelector('#hintx').onclick = () => h.remove(); } } }
    {
      const refresh = () => {
        const p = PROG.get(s.id), sc = scores()[s.id], dr = store.get('sff-draft-' + s.id, ''), po = store.get('sff-posts-' + s.id, []);
        const stt = { read: !!p.read, quiz: sc != null, cards: !!p.cards, write: !!((po && po.length) || (typeof dr === 'string' && dr.trim().length >= 20)) };
        app.querySelectorAll('#secnav a').forEach(x => x.classList.toggle('done', !!stt[x.dataset.s]));
      };
      secRefresh = refresh; refresh();
      const go = el => el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const toPractice = k => { const b = app.querySelector('.tabs button[data-t=' + k + ']'); b && b.click(); go(app.querySelector('#part1')); };
      app.querySelector('#secnav').addEventListener('click', e => { const x = e.target.closest('a'); if (!x) return; e.preventDefault(); const k = x.dataset.s; if (k === 'read') go(app.querySelector('#story')); else if (k === 'write') go(app.querySelector('#wr')); else toPractice(k === 'quiz' ? 'quiz' : 'cards'); });
      const fq = app.querySelector('#fin-quiz'); if (fq) fq.onclick = () => toPractice('quiz');
      const end = app.querySelector('#storyend');
      if (end && 'IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { PROG.mark(s.id, 'read'); o.disconnect(); } }, { threshold: .6 }).observe(end);
    }
    const tb = app.querySelector('#tb');""", 'wiring')
# (Slice out the single old hint line starting at its anchor up to the next newline, then delete that one occurrence.)
# remove the old hint code block (store check on click)
old_h = a[a.index("    { const h = app.querySelector('#taphint'); if (h) { if (store.get('sff-hint', false)) h.remove(); else app.querySelector('#hintx')"):]
old_h = old_h[:old_h.index("\n")+1]
a = a.replace(old_h, '', 1)

# --- library: continue card + progress
a = sub1(a, """      <div class="path">${LV.map(lv => `<a href="#stories-${lv.toLowerCase()}"><i class="lv${lv}">${lv}</i><b>${M[lv].name}</b><small>${LVSHORT[lv]}<br>${M[lv].words[0]}–${M[lv].words[1]} words per story</small></a>`).join('')}</div>""",
 """      ${(() => { const l = byId[store.get('sff-last', '')]; return l ? `<a class="continue" href="#story-${l.id}"><span class="cin">${ic('play', 16)}</span><span><small>Continue where you left off</small><b>${esc(l.title)}</b><em>${l.level} · story ${num(l)} of 10</em></span><span class="cgo">${ic('arrow', 18)}</span></a>` : ''; })()}
      <div class="path">${LV.map(lv => { const rd = S.filter(x => x.level === lv && PROG.get(x.id).read).length; return `<a href="#stories-${lv.toLowerCase()}"><i class="lv${lv}">${lv}</i><b>${M[lv].name}</b><small>${LVSHORT[lv]}<br>${M[lv].words[0]}–${M[lv].words[1]} words per story</small><em class="pgs"><i style="width:${rd * 10}%"></i><span>${rd}/10 read</span></em></a>`; }).join('')}</div>""", 'library path')
a = sub1(a, """${done[s.id] != null ? `<span class="dn">✓ ${done[s.id]}/5</span>` : ''}""",
 """${done[s.id] != null ? `<span class="dn">${ic('check', 12)} Quiz ${done[s.id]}/5</span>` : PROG.get(s.id).read ? `<span class="dn rd">${ic('check', 12)} Read</span>` : ''}""", 'card badge')

# --- bottom init: menu + navh
a = sub1(a, "  NB.mount(); LK.mount();", """  NB.mount(); LK.mount();
  { const nav = document.querySelector('nav'), mb = document.getElementById('menu');
    const navh = () => document.documentElement.style.setProperty('--navh', nav.offsetHeight + 'px');
    if (mb) { mb.onclick = () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); navh(); }; nav.addEventListener('click', e => { if (e.target.closest('.menu a')) { nav.classList.remove('open'); navh(); } }); }
    navh(); window.addEventListener('resize', navh); }""", 'init')
wr('site-src/app.js', a)

# ---------------------------------------------------------------- notebook.js
n = rd('site-src/notebook.js')
n = sub1(n, """document.body.insertAdjacentHTML('beforeend', `<button id="nb-btn" aria-label="Open notebook"><span aria-hidden="true">📓</span><em>Notebook</em><b id="nb-badge" hidden></b></button><div id="nb-back" hidden>""", """document.body.insertAdjacentHTML('beforeend', `<div id="nb-back" hidden>""", 'nb mount')
n = sub1(n, "el = { btn: document.getElementById('nb-btn'), badge: document.getElementById('nb-badge'),", "const nn0 = document.getElementById('nb-nav'); const bd = document.createElement('b'); bd.id = 'nb-badge'; bd.hidden = true; nn0.appendChild(bd);\n    el = { btn: nn0, badge: bd,", 'el')
n = sub1(n, "    el.btn.onclick = () => openNB();\n", "", 'btn onclick')
n = n.replace("<b>📓 My notebook</b>", "<b>${ic('notebook', 20)} My notebook</b>")
wr('site-src/notebook.js', n)

# ---------------------------------------------------------------- lookup.js
l = rd('site-src/lookup.js')
l = sub1(l, '<button id="lk-btn" aria-label="Open dictionary and verb helper" title="Dictionary & verb helper">🔎</button>', '', 'lk-btn')
l = sub1(l, "    document.getElementById('lk-btn').onclick = () => open();\n", "", 'lk-btn click')
l = l.replace("<b>🔎 Lookup</b>", "<b>${ic('search', 20)} Lookup</b>")
l = l.replace('aria-label="Hear it">🔊</button>', 'aria-label="Hear it">${ic(\'volume\', 18)}</button>')
l = sub1(l, "function closePop() { if (pop) pop.hidden = true; popFor = null; }", "function closePop() { if (pop) pop.hidden = true; if (popFor) popFor.classList.remove('sel'); popFor = null; }", 'closePop')
l = sub1(l, "    ri = ri || 0; popFor = w;", "    ri = ri || 0; if (popFor) popFor.classList.remove('sel'); popFor = w; w.classList.add('sel');", 'sel')
wr('site-src/lookup.js', l)

# ---------------------------------------------------------------- build_site.py
b = rd('tools/build_site.py')
icons = r'''
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
 'cards': '<path d="M3 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1"/><path d="M18 7l3 1v10l-3 1"/>',
}
FILLED = {'play': '<path d="M7 4v16l13-8z"/>', 'pause': '<path d="M6 5h4v14h-4z"/><path d="M14 5h4v14h-4z"/>', 'stop': '<path d="M5 5h14v14h-14z"/>'}
def svg(n, s=18):
    if n in FILLED: return f'<svg class="ic" width="{s}" height="{s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{FILLED[n]}</svg>'
    return f'<svg class="ic" width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[n]}</svg>'
ICON_JS = 'const ICP = ' + json.dumps({**ICONS, **FILLED}) + ';\nconst ICF = ' + json.dumps(list(FILLED)) + ';\nconst ic = (n, s = 18) => ICF.includes(n) ? `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICP[n]}</svg>` : `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICP[n]}</svg>`;\n'
'''
b = sub1(b, "dictionary = json.load(", icons + "\ndictionary = json.load(", 'icons')
b = sub1(b, "app = app.replace('/*__NOTEBOOK__*/'", "app = app.replace('/*__ICONS__*/', ICON_JS)\napp = app.replace('/*__NOTEBOOK__*/'", 'icons inject')
# Replace the whole <nav>...</nav> block in build_site.py's template with nav_new (a slice from the first '<nav>' to
# '</nav>'; b.index raises ValueError if there is no bare '<nav>'). Braces in nav_new are single because it is spliced into
# the f-string template as-is, so {svg(...)} is evaluated at build time.
nav_old = b[b.index('<nav>'):b.index('</nav>') + 6]
nav_new = '''<nav><a class="logo" href="#stories">Stories first. Fluency follows<span class="or">.</span><span class="free-tag">100% free</span></a>
<div class="menu" id="menulist"><a class="nl" href="#stories">Read Stories</a><a class="nl" href="#learn">How to learn</a><a class="nl" href="#classroom">Classroom</a><a class="nl pdf m" href="#resources">{svg('download', 16)} Free Resources</a></div>
<a class="nl ic" id="nb-nav" href="#" aria-label="Notebook">{svg('notebook', 20)}<span class="lbl">Notebook</span></a><a class="nl ic" id="lk-nav" href="#" aria-label="Lookup">{svg('search', 20)}<span class="lbl">Lookup</span></a>
<a class="nl pdf d" href="#resources">{svg('download', 16)} Free Resources</a><button id="menu" aria-label="Menu" aria-expanded="false">{svg('menu', 22)}</button></nav>'''
b = b.replace(nav_old, nav_new)
wr('tools/build_site.py', b)

# ---------------------------------------------------------------- CSS: dark-mode tokens via replacements
# Dark mode, step 1: replace hard-coded light colours in both CSS files with CSS variables (--card, --soft, --ink, ...).
# The (?![0-9a-fA-F]) lookahead stops "#fff" from matching the start of a longer hex such as #fff1e3; the (?<![-\w])
# lookbehind makes "color:#222" skip properties like background-color:. The tuples map groups of near-identical tints
# (orange, grey, green, blue, purple backgrounds) onto one variable each.
for f in ('site-src/base.css', 'site-src/extra.css'):
    c = rd(f)
    c = re.sub(r'background:#fff(?![0-9a-fA-F])', 'background:var(--card)', c)
    for hexes, var in ((('fff1e3', 'fff8f0', 'fde3cf', 'fff4e5'), 'tintO'), (('f6f5f2', 'faf8f4', 'f4f3f0', 'f3f1ec', 'f1efe9', 'fffdf9', 'e6e3dd', 'eee'), 'soft'),
                       (('e5f6e5',), 'tintG'), (('e8f1fb', 'f0f8ff', 'dcefff'), 'tintB'), (('f3e8fb', 'ece4ff'), 'tintP')):
        for h in hexes: c = re.sub(r'background:#%s(?![0-9a-fA-F])' % h, 'background:var(--%s)' % var, c)
    c = c.replace('background:var(--ink);color:#fff', 'background:var(--inkbg);color:var(--onink)')
    c = c.replace('background:#222;color:#fff', 'background:var(--inkbg);color:var(--onink)')
    c = re.sub(r'background:#222(?![0-9a-fA-F;]*color)', 'background:var(--inkbg)', c)
    c = re.sub(r'(?<![-\w])color:#(111|222|1d1d1d)(?![0-9a-fA-F])', 'color:var(--ink)', c)
    c = re.sub(r'(?<![-\w])color:#333(?![0-9a-fA-F])', 'color:var(--ink2)', c)
    c = c.replace('rgba(250,249,247,.95)', 'var(--navbg)')
    wr(f, c)
# Step 2: define the new variables (light values) by extending base.css's :root rule.
base = rd('site-src/base.css')
base = base.replace(':root{--bg:#faf9f7;--card:#fff;--line:#e4e2dd;--ink:#1d1d1d;--mute:#666;', ':root{--bg:#faf9f7;--card:#fff;--line:#e4e2dd;--ink:#1d1d1d;--ink2:#333;--inkbg:#1d1d1d;--onink:#fff;--soft:#f4f3f0;--tintO:#fff1e3;--tintG:#e5f6e5;--tintB:#e8f1fb;--tintP:#f3e8fb;--navbg:rgba(250,249,247,.95);--mute:#666;', 1)
wr('site-src/base.css', base)

# Step 3: the dark palette (DARK_VARS) and a few extra dark-only overrides (DARK_RULES), appended to extra.css below.
DARK_VARS = '--bg:#14130f;--card:#1e1d19;--line:#36342e;--ink:#f1ede6;--ink2:#d9d5cc;--inkbg:#f1ede6;--onink:#1d1d1d;--soft:#27251f;--tintO:#3b2a1a;--tintG:#1f3322;--tintB:#1b2a3d;--tintP:#2e2140;--navbg:rgba(20,19,15,.95);--mute:#a8a49a;--orange:#ff9650;--blue:#6cb8ff;color-scheme:dark'
DARK_RULES = '''
.illus,.gc .th,.sc .th,.nextcard .th,.th{background:#fffdf9!important}
.co,.lkirr,.irr,.gt.co b.hl,.gt.co .ges,.gt.co h4{color:#ffb27a}.cb,.lkspl,.gt.cb b.hl,.gt.cb .ges,.gt.cb h4{color:#8cc4ff}.cg,.lkreg,.gt.cg b.hl,.gt.cg .ges,.gt.cg h4{color:#8fe38f}.cp,.gt.cp b.hl,.gt.cp .ges,.gt.cp h4{color:#d6b0f7}
.stitle .hint{color:#f3c595}.tpan,.card{border-color:var(--line)}
.gt{background:var(--card)}.gt .gx,.gk{background:var(--soft)}
.qw,.qw *{color:var(--ink)}.qw{background:var(--card)}
input,textarea,select{background:var(--soft);color:var(--ink);border-color:var(--line)}
.btn.ghost{color:var(--ink);border-color:var(--line)}
.toolbar button,.sbb,.secnav a{color:var(--ink)}
'''
ex = rd('site-src/extra.css')
ex += '\n/* ---- dark mode (follows the system, or the host page theme) ---- */\n@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + DARK_VARS + '}' + ''.join('\n:root:not([data-theme="light"]) ' + ln for ln in []) + '}\n'
# scoped(rules, sel): prefix every selector of each simple "sel{decls}" rule with `sel` (regex ([^{}]+)\{([^{}]*)\} only handles
# flat, un-nested rules). Used so the dark rules apply both under the system preference (:root:not([data-theme="light"]) inside
# a prefers-color-scheme media query) and when the host forces :root[data-theme="dark"].
# rules need duplicating under both selectors
def scoped(rules, sel):
    out = []
    for r in re.findall(r'([^{}]+)\{([^{}]*)\}', rules):
        sels = ','.join(sel + ' ' + s.strip() for s in r[0].split(','))
        out.append(sels + '{' + r[1] + '}')
    return '\n'.join(out)
ex += '@media (prefers-color-scheme: dark){' + scoped(DARK_RULES, ':root:not([data-theme="light"])') + '}\n'
ex += ':root[data-theme="dark"]{' + DARK_VARS + '}\n' + scoped(DARK_RULES, ':root[data-theme="dark"]') + '\n'
wr('site-src/extra.css', ex)
print('ok')
