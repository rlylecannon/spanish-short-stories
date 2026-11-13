/* ============ notebook (inserted inside the app IIFE; uses store, S, byId, LV, M, esc, num) ============
 *
 * PURPOSE
 *   The learner's notebook: saved words, sentences and grammar notes (from stories, flashcards, quizzes, writing
 *   fixes and the verb helper), reviewed with a Leitner-style spaced-repetition system, shown in a slide-in drawer
 *   (tabs Review / My notes / Progress) with a CSV export.
 *
 * PUBLIC API (returned object NB; callers are app.js and lookup.js)
 *   mount()        build drawer/toast/popover DOM and listeners (once at startup; needs the #nb-nav button).
 *   spans(html)    wrap each sentence of story HTML in <span class="sn">.
 *   decorate(s)    prepare the rendered story s (tappable words, sentence tools, save buttons, saved marks).
 *   open(tab)      open the drawer; flashMiss(s, w), addNote, addFix, addMiss  add items from other features;
 *   toggleWord, isSaved, matchVocab, showTools, cur() (the story being shown).
 *
 * DEPENDENCIES (shared scope of the app IIFE)
 *   store (get/set wrapper around localStorage; set returns false when storage is blocked), S (stories),
 *   byId (story id -> story), LV (level names), esc (HTML escape), ic (icon helper), LK (lookup.js, for word wrapping).
 *
 * STORAGE
 *   localStorage 'sff-notebook' = array of items; 'sff-nb-days' = { 'YYYY-MM-DD': reviewsThatDay } used for the
 *   streak and the weekly chart. The notebook is per device (it is not part of progress sync).
 *
 * ITEM SHAPE
 *   { id, type ('word'|'sentence'|'grammar'), storyId, level, es, en, ctx (example sentence), ctxEn, cloze (the word to
 *     blank for sentence cards), added, box (0..5), due (ms timestamp), reviews, correct, last }
 *   id = type:storyId:normalisedKey (see mkid). Special keys: 'g' = the story's grammar note, 'v:<inf>' = a verb note,
 *   'q:<question>' = a missed quiz question, 'fix:<sentence>' = a writing correction.
 *
 * SPACED REPETITION
 *   box = Leitner box. A correct answer moves up one box (max 5) and the card is due INT[box] days later;
 *   a wrong answer moves down one box (min 0) and the card returns in 10 minutes. box >= 4 counts as mastered.
 *   A review session uses up to 15 due cards (or 12 random ones in practice mode); missed cards get one retry round.
 */
// Everything is private to this IIFE; only the object returned at the bottom is public.
const NB = (function () {
  // INT[box] = days until a card in that box is due again (box 0 = due immediately); DAY = milliseconds per day.
  const KEY = 'sff-notebook', DKEY = 'sff-nb-days', INT = [0, 1, 3, 7, 14, 30], DAY = 864e5;
  // items is the whole notebook in memory (newest first); anything that is not an array (corrupt storage) resets to empty.
  let items = store.get(KEY, []); if (!Array.isArray(items)) items = [];
  // persisted = false when storage refused the write (the drawer then warns); tab = current drawer tab;
  // sess = the running review session or null; filt = filters of the My notes tab.
  let csvText = null; // CSV text currently shown in the export box (null = hidden); cleared whenever the cards change
  let persisted = true, tab = 'review', sess = null, filt = { type: 'all', level: 'all', q: '' };
  const T = { word: 'Word', sentence: 'Sentence', grammar: 'Grammar' };
  const nowT = () => Date.now();
  // Normalise text for ids and answer checking: lowercase, no accents or punctuation, single spaces. ñ is swapped for a
  // placeholder (\u0001) first so it stays distinct from n (the range in the 2nd replace is the combining-accent block).
  const norm = s => String(s).toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\u0001 ]/g, '').replace(/\s+/g, ' ').trim();
  const plain = h => String(h).replace(/<[^>]+>/g, '');
  const LEG = new Map(); // new long-key id -> the old truncated id that earlier versions saved
  // Small 32-bit string hash (djb2: h*33 + char) written in base 36; only used to make long ids unique.
  const hash36 = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  // Build an item id from type, story id and a key. Keys up to 60 normalised characters are used as they are. Longer keys
  // (long sentences) are cut at 60 chars plus '~' plus a hash of the full text, so two long sentences with the same first 60
  // chars no longer collide. Earlier versions saved just the truncated id, so LEG remembers new id -> old id and find()
  // still matches cards saved before the hash existed.
  const mkid = (t, sid, k) => {
    const n = norm(k), base = t + ':' + sid + ':';
    if (n.length <= 60) return base + n;
    const id = base + n.slice(0, 60) + '~' + hash36(n); LEG.set(id, base + n.slice(0, 60)); return id;
  };
  const find = id => items.find(x => x.id === id || (LEG.has(id) && x.id === LEG.get(id))); // cards saved before the hash was added still match
  const sty = x => byId[x.storyId] || { title: '(story removed)', level: x.level || '' }; // a saved card whose story no longer exists must not break the drawer
  // Items whose due time has passed, most overdue first.
  const dueList = () => items.filter(x => x.due <= nowT()).sort((a, b) => a.due - b.due);
  // Mastered = in box 4 or 5.
  const mastered = x => x.box >= 4;
  // Local-calendar date key YYYY-MM-DD (local, not UTC, so a review done in the evening counts for the user's today).
  const dayKey = t => { const d = new Date(t), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }; // local day, so evening reviews count for today
  // Today at 12:00 local time. Stepping back whole days (t - DAY) from noon never skips or repeats a date, even on
  // daylight-saving days that are 23 or 25 hours long (stepping from midnight could).
  const noonT = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); }; // stepping back a day from noon is safe across DST changes
  // el = cached DOM elements (filled by mount); popFor = element the word popover belongs to.
  let el = {}, popFor = null;

  // Save items to storage and refresh everything that shows them: badge, open drawer, 'saved' marks on the story page.
  function persist() { csvText = null; persisted = store.set(KEY, items); badge(); if (el.drawer && el.drawer.classList.contains('open')) render(); refreshMarks(); }
  // Add a new item (returns false if the same id exists). New cards start in box 0 and are due immediately.
  function add(e) {
    const id = mkid(e.type, e.storyId, e.key); if (find(id)) return false;
    items.unshift({ id, type: e.type, storyId: e.storyId, level: byId[e.storyId].level, es: e.es, en: e.en || '', ctx: e.ctx || '', ctxEn: e.ctxEn || '', cloze: e.cloze || '', added: nowT(), box: 0, due: nowT(), reviews: 0, correct: 0, last: 0 });
    persist(); return true;
  }
  const has = (t, sid, k) => !!find(mkid(t, sid, k));
  // Delete by id (find() also resolves legacy ids).
  function remove(id) { const it = find(id); items = items.filter(x => x !== it && x.id !== id); persist(); }

  /* ---------- helpers for story text ---------- */
  // Wrap each sentence of an HTML string in <span class="sn"> (sentence boundaries = . ! ? or … followed by whitespace;
  // the \u0001 marks are temporary split points). Whitespace pieces are kept, newlines become <br>.
  function spans(html) { // wrap each sentence in <span class="sn">; keep line breaks
    const parts = String(html).replace(/([.!?…])(\s+)/g, '$1\u0001$2\u0001').split('\u0001');
    return parts.map(p => /^\s+$/.test(p) ? p.replace(/\n/g, '<br>') : (p.trim() ? `<span class="sn">${p}</span>` : p)).join('');
  }
  // Articles/clitics ignored when matching vocabulary entries.
  const STOPW = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'se', 'me', 'te', 'lo', 'le']);
  // Split text into lowercase word tokens (letters incl. accents, digits, underscore).
  const toks = t => (String(t).toLowerCase().match(/[\wáéíóúüñ]+/g) || []);
  // Find the story vocabulary pair [spanish, english] that best matches a tapped/bold text. Matching is by word stem: each
  // Spanish vocab word (minus stopwords) is cut to its first max(3, length - 3) letters, so inflected forms still match
  // (habl- matches hablo, hablamos). The longest matching stem wins; null if nothing matches.
  function matchVocab(vocab, text) {
    const tk = toks(text); let best = null, bl = 0;
    vocab.forEach(v => {
      const core = toks(v[0]).filter(w => !STOPW.has(w));
      core.forEach(w => { const st = w.slice(0, Math.max(3, w.length - 3)); if (tk.some(t => t.startsWith(st)) && st.length > bl) { bl = st.length; best = v; } });
    });
    return best;
  }

  /* ---------- floating UI ---------- */
  // Small message at the bottom, auto-hides after 2.6 s; optional 'Open notebook' link.
  function toast(msg, withOpen) {
    el.toast.innerHTML = esc(msg) + (withOpen ? ' <a data-act="open-nb">Open notebook</a>' : '');
    el.toast.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.toast.hidden = true, 2600);
  }
  // Update the nav button badge: number of due cards (highlighted), or the total saved when none is due; hidden when empty.
  function badge() {
    const d = dueList().length, b = el.badge; if (!b) return;
    b.hidden = !items.length; b.textContent = d || items.length; b.classList.toggle('due', d > 0);
    el.btn.title = items.length ? `My notebook · ${items.length} saved${d ? ' · ' + d + ' due' : ''}` : 'My notebook';
  }
  // Open the drawer (optionally on tab t), show the backdrop, render, focus the first button.
  function openNB(t) { if (t) tab = t; el.drawer.classList.add('open'); el.back.hidden = false; el.drawer.setAttribute('aria-hidden', 'false'); render(); el.drawer.querySelector('button')?.focus(); }
  function closeNB() { el.drawer.classList.remove('open'); el.back.hidden = true; el.drawer.setAttribute('aria-hidden', 'true'); }
  function closePop() { el.pop.hidden = true; popFor = null; }

  /* ---------- saving from the story page ---------- */
  // Save the bold word bEl of story s with its sentence as context; uses the story's vocab pair when one matches, otherwise
  // the tapped text and the optional user-typed meaning.
  function saveWordFrom(s, bEl, extraEn) {
    const sn = bEl.closest('.sn'), p = bEl.closest('p.es');
    const text = bEl.textContent.trim(), v = matchVocab(s.vocab, text);
    const ctx = sn ? sn.textContent.trim() : '', ctxEn = pairEn(p, sn);
    return add({ type: 'word', storyId: s.id, key: v ? v[0] : text, es: v ? v[0] : text, en: v ? v[1] : (extraEn || ''), ctx, ctxEn });
  }
  // English translation of sentence sn: the English paragraph is the next sibling of p.es (stored as p._en by decorate()).
  // It is split into sentences the same way; if the counts agree the matching sentence is used, otherwise the whole paragraph.
  function pairEn(p, sn) {
    if (!p || !p._en) return '';
    const es = [...p.querySelectorAll('.sn')], en = p._en.textContent.replace(/([.!?…])\s+/g, '$1\u0001').split('\u0001').filter(Boolean);
    const i = sn ? es.indexOf(sn) : 0;
    return en.length === es.length && i >= 0 ? en[i] : p._en.textContent;
  }
  // Save a sentence. The key includes the paragraph index so identical sentences in different paragraphs stay distinct;
  // cloze = the first bold word in the sentence (used as the blank on the card).
  function saveSentenceFrom(s, p, sn) {
    const li = [...document.querySelectorAll('#story p.es')].indexOf(p), es = sn.textContent.trim();
    const b = sn.querySelector('b');
    return add({ type: 'sentence', storyId: s.id, key: li + ':' + es, es, en: pairEn(p, sn), cloze: b ? b.textContent.trim() : '' });
  }
  // One grammar note per story (key 'g'), text = the story's grammar concept.
  function saveGrammar(s) { return add({ type: 'grammar', storyId: s.id, key: 'g', es: s.concepts.grammar, en: '', ctx: s.title }); }

  // Sync the story page with the notebook: highlight saved bold words, update the + / check buttons next to the vocab list and the
  // grammar button, and tell an open sentence toolbar to repaint. refreshMarks.story is where the current story is remembered.
  function refreshMarks() {
    const s = refreshMarks.story; if (!s) return;
    document.querySelectorAll('#story b.vw').forEach(b => { const v = matchVocab(s.vocab, b.textContent); b.classList.toggle('saved', !!v && has('word', s.id, v[0])); });
    document.querySelectorAll('.vsave[data-vi]').forEach(btn => { const v = s.vocab[+btn.dataset.vi]; const on = has('word', s.id, v[0]); btn.classList.toggle('on', on); btn.textContent = on ? '✓' : '＋'; btn.title = on ? 'In your notebook (tap to remove)' : 'Save to notebook'; });
    const g = document.getElementById('savegram'); if (g) { const on = has('grammar', s.id, 'g'); g.textContent = on ? '✓ Grammar note saved' : '＋ Save grammar note'; g.classList.toggle('on', on); }
    const lt = document.querySelector('.lt'); if (lt) lt.dispatchEvent(new Event('nbrefresh'));
  }

  // Make the freshly rendered story s interactive: remember it, link each English paragraph to its Spanish one (p._en), mark bold
  // words, make all words tappable (LK.wrap), open the sentence toolbar when a sentence is tapped, and wire the save buttons.
  function decorate(s) {
    refreshMarks.story = s;
    const story = document.getElementById('story'); if (!story) return;
    story.querySelectorAll('p.es').forEach(p => { p._en = p.nextElementSibling; });
    story.querySelectorAll('p.es b').forEach(b => { b.classList.add('vw'); });
    story.querySelectorAll('p.es').forEach(p => LK.wrap(p, s));
    story.querySelectorAll('p.es').forEach(p => p.addEventListener('click', e => {
      if (e.target.closest('.w')) return;
      const sn = e.target.closest('.sn') || p.querySelector('.sn'); showTools(s, p, sn);
    }));
    document.querySelectorAll('.vsave[data-vi]').forEach(btn => btn.onclick = () => {
      const v = s.vocab[+btn.dataset.vi], id = mkid('word', s.id, v[0]);
      if (find(id)) { remove(id); toast('Removed from notebook'); } else { add({ type: 'word', storyId: s.id, key: v[0], es: v[0], en: v[1] }); toast('Saved “' + v[0] + '”', true); }
    });
    const g = document.getElementById('savegram');
    if (g) g.onclick = () => { const id = mkid('grammar', s.id, 'g'); if (find(id)) { remove(id); toast('Removed from notebook'); } else { saveGrammar(s); toast('Grammar note saved', true); } };
    refreshMarks();
  }

  // Show the floating toolbar after paragraph p for sentence sn: save/unsave the sentence and save its bold words (the buttons
  // toggle and the label counts words not yet saved).
  function showTools(s, p, sn) {
    document.querySelectorAll('.lt').forEach(x => x.remove());
    document.querySelectorAll('.sn.sel').forEach(x => x.classList.remove('sel'));
    sn.classList.add('sel');
    const bs = [...sn.querySelectorAll('b')];
    const bar = document.createElement('div'); bar.className = 'lt';
    const paint = () => {
      const sid = mkid('sentence', s.id, ([...document.querySelectorAll('#story p.es')].indexOf(p)) + ':' + sn.textContent.trim());
      const saved = !!find(sid), newW = bs.filter(b => { const v = matchVocab(s.vocab, b.textContent); return !has('word', s.id, v ? v[0] : b.textContent.trim()); }).length;
      bar.innerHTML = `<button data-k="s" class="${saved ? 'on' : ''}">${saved ? '✓ Sentence saved' : '＋ Save sentence'}</button>${bs.length ? `<button data-k="w" ${newW ? '' : 'class="on"'}>${newW ? '＋ Save ' + newW + ' word' + (newW > 1 ? 's' : '') : '✓ Words saved'}</button>` : ''}<button data-k="x" aria-label="Close">×</button>`;
    };
    paint();
    bar.addEventListener('nbrefresh', paint);
    bar.addEventListener('click', e => {
      e.stopPropagation(); const k = e.target.dataset.k; if (!k) return;
      if (k === 'x') { bar.remove(); sn.classList.remove('sel'); return; }
      if (k === 's') {
        const id = mkid('sentence', s.id, ([...document.querySelectorAll('#story p.es')].indexOf(p)) + ':' + sn.textContent.trim());
        if (find(id)) { remove(id); toast('Removed from notebook'); } else { saveSentenceFrom(s, p, sn); toast('Sentence saved', true); }
      }
      if (k === 'w') { let n = 0; bs.forEach(b => { if (saveWordFrom(s, b)) n++; }); if (n) toast(n + ' word' + (n > 1 ? 's' : '') + ' saved', true); }
    });
    p.after(bar);
  }

  // Popover for a bold vocabulary word with a save/remove button (and a meaning field when the word is not in the vocab list).
  // Not exported or called anywhere in this file.
  function showPop(s, b) {
    const v = matchVocab(s.vocab, b.textContent), key = v ? v[0] : b.textContent.trim(), saved = has('word', s.id, key);
    popFor = b;
    el.pop.innerHTML = `<div class="pw">${esc(v ? v[0] : b.textContent.trim())}</div><div class="pm">${v ? esc(v[1]) : '<input id="pop-en" placeholder="Meaning (optional)" maxlength="60">'}</div>
      <button class="pb ${saved ? 'on' : ''}" data-act="pop-save">${saved ? '✓ In notebook · remove' : '＋ Save word'}</button>`;
    el.pop.hidden = false;
    const r = b.getBoundingClientRect(), w = 230, left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    el.pop.style.left = left + 'px'; el.pop.style.top = (r.bottom + 8 > innerHeight - 130 ? Math.max(8, r.top - 118) : r.bottom + 8) + 'px';
    el.pop.onclick = e => {
      if (e.target.dataset.act !== 'pop-save') return; e.stopPropagation();
      const id = mkid('word', s.id, key);
      if (find(id)) { remove(id); toast('Removed from notebook'); } else { saveWordFrom(s, b, (document.getElementById('pop-en') || {}).value); toast('Saved “' + key + '”', true); }
      closePop();
    };
  }
  // Save or remove a word chosen from the lookup popover; returns true if it is now saved.
  function toggleWord(s, wEl, es, en) {
    const id = mkid('word', s.id, es);
    if (find(id)) { remove(id); toast('Removed from notebook'); return false; }
    const sn = wEl.closest('.sn'), p = wEl.closest('p.es');
    add({ type: 'word', storyId: s.id, key: es, es, en, ctx: sn ? sn.textContent.trim() : '', ctxEn: pairEn(p, sn) });
    toast('Saved “' + es + '”', true); return true;
  }
  // True if the key is saved; keys starting 'v:' are verb notes, which are stored as grammar items.
  const isSaved = (s, k) => has(k.startsWith('v:') ? 'grammar' : 'word', s.id, k);
  // Save a verb note (stored as a grammar item); toasts only when newly added.
  function addNote(s, key, es, en) { if (!s) return; if (add({ type: 'grammar', storyId: s.id, key, es, en: en || '', ctx: s.title })) toast('Verb note saved', true); }
  // Save a corrected sentence from the writing feature (key 'fix:...').
  function addFix(s, es, en) { if (!s || !es) return false; return add({ type: 'sentence', storyId: s.id, key: 'fix:' + es, es, en: en || '', ctx: s.title }); }
  // Save a missed quiz question; en holds the right answer plus the explanation if any.
  function addMiss(s, q) { if (!s || !q) return false; const ok = q.options[q.answer]; return add({ type: 'grammar', storyId: s.id, key: 'q:' + q.q, es: q.q, en: 'Answer: ' + ok + (q.why ? ' · ' + q.why : ''), ctx: s.title }); }
  // Save a word missed in flashcards.
  function flashMiss(s, w) { if (add({ type: 'word', storyId: s.id, key: w[0], es: w[0], en: w[1] })) toast('Added “' + w[0] + '” to your notebook', true); }

  /* ---------- review ---------- */
  // Count one more review for today in sff-nb-days.
  function logDay() { const d = store.get(DKEY, {}), k = dayKey(nowT()); d[k] = (d[k] || 0) + 1; store.set(DKEY, d); }
  // Consecutive days with reviews. If nothing is done yet today, count back from yesterday so the streak is not shown as lost
  // before today's review.
  function streak() { const d = store.get(DKEY, {}); let n = 0, t = noonT(); if (!d[dayKey(t)]) t -= DAY; while (d[dayKey(t)]) { n++; t -= DAY; } return n; }
  // Record a review result and reschedule the card (see SPACED REPETITION above). A wrong card is queued for the one retry
  // round unless that round is already running. Then saves.
  function grade(x, ok) {
    x.reviews++; x.last = nowT();
    if (ok) { x.correct++; if (!(sess.all && x.due > nowT())) { x.box = Math.min(5, x.box + 1); x.due = nowT() + INT[x.box] * DAY; } } // practising a card that is not due yet must not move it up a box else { x.box = Math.max(0, x.box - 1); x.due = nowT() + 10 * 60000; }
    logDay(); sess.total++; if (ok) sess.correct++; else if (!sess.retried && !sess.retry.includes(x)) sess.retry.push(x);
    persist();
  }
  // Start a review: up to 15 due cards, or (practice mode, all = true) 12 random cards from the whole notebook. Session fields:
  // queue, i (index), correct, total, retry (missed cards), retried (retry round running), st ('ask' | 'shown' | 'checked'),
  // val / ok (typed answer and result), mx / mm (current card and its frozen mode), done.
  function startSession(all) {
    let q = all ? items.slice().sort(() => Math.random() - .5).slice(0, 12) : dueList().slice(0, 15);
    if (!q.length) return;
    sess = { queue: q, i: 0, correct: 0, total: 0, retry: [], retried: false, st: 'ask', val: '', ok: null, all: !!all }; render();
  }
  // Card type: words are typed from the English once the card reaches box 2 (and has a meaning), else flip cards;
  // sentences with a cloze word are fill-in-the-blank, other sentences flip; grammar is always flip.
  // All answers accepted for a typed card, as normalised strings: the whole entry, the entry without a "(note)", each part of
  // "a / b" or "a, b, c", and the feminine of "jubilado/a" (-o + a). A leading article is optional in every case.
  function accepted(t) {
    const out = new Set(), add = s => { const n = norm(s); if (n) { out.add(n); out.add(norm(String(s).replace(/^(el|la|los|las|un|una)\s+/i, ''))); } };
    add(t);
    const t2 = String(t).replace(/\s*\([^)]*\)/g, ''); add(t2);
    const parts = t2.split(/\s*[\/,;]\s*/).map(p => p.trim()).filter(Boolean);
    parts.forEach((p, i) => { add(p); if (i > 0 && /^[a-záéíóúñ]{1,2}$/i.test(p) && /o$/i.test(parts[0])) add(parts[0].replace(/o$/i, p)); });
    return out;
  }
  const mode = x => x.type === 'word' ? (x.box >= 2 && x.en ? 'typed' : 'flip') : x.type === 'sentence' ? (x.cloze ? 'cloze' : 'flip') : 'flip';
  // Advance; at the end of the queue run one retry round with the missed cards, then finish.
  function nextCard() {
    sess.i++; sess.st = 'ask'; sess.val = ''; sess.ok = null; sess.mx = null;
    if (sess.i >= sess.queue.length) {
      if (sess.retry.length && !sess.retried) { sess.queue = sess.retry.slice(); sess.retry = []; sess.retried = true; sess.i = 0; sess.banner = 'Let’s try the ones you missed once more.'; }
      else sess.done = true;
    }
    render();
  }
  // HTML for the current card in its current state (sess.st). The mode is frozen per card (sess.mx / sess.mm): grading
  // changes x.box, which could change mode(x) (e.g. flip -> typed at box 2) and swap the card's layout in mid-review.
  function cardHtml(x) {
    if (sess.mx !== x) { sess.mx = x; sess.mm = mode(x); } const m = sess.mm, st = sty(x), src = `<div class="src">${x.level} · ${esc(st.title)}</div>`;
    const chk = (v, correct) => `<div class="res ${correct ? 'ok' : 'bad'}">${correct ? '✓ Correct' : '✗ Not quite'}</div>`;
    if (x.type === 'word' && m === 'flip') return `${src}<div class="q">What does this mean?</div><div class="big">${esc(x.es)}</div>${sess.st === 'ask' ? `<button class="nbb" data-act="show">Show meaning</button>` : `<div class="ans">${esc(x.en || '—')}</div>${x.ctx ? `<div class="ctx">${esc(x.ctx)}<small>${esc(x.ctxEn)}</small></div>` : ''}${rate()}`}`;
    if (x.type === 'word' && m === 'typed') {
      if (sess.st === 'ask') return `${src}<div class="q">Type the Spanish word</div><div class="big">${esc(x.en)}</div><input id="nb-in" class="nbin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe aquí…"><button class="nbb" data-act="check">Check</button><button class="lnk" data-act="skip">I don’t know</button>`;
      return `${src}<div class="q">${esc(x.en)}</div>${chk(sess.val, sess.ok)}<div class="ans">${esc(x.es)}</div>${sess.ok ? '' : `<div class="you">You wrote: ${esc(sess.val || '—')}</div>`}${x.ctx ? `<div class="ctx">${esc(x.ctx)}<small>${esc(x.ctxEn)}</small></div>` : ''}<button class="nbb" data-act="next">Next</button>`;
    }
    if (x.type === 'sentence' && m === 'cloze') {
      // Blank out the cloze word; its regex special characters are escaped first.
      // Whole-word match first (so "la" does not blank the end of "Clara"); fall back to a plain first match.
      const clz = x.cloze.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); let blank = x.es;
      try { blank = x.es.replace(new RegExp('(^|[^\\p{L}])' + clz + '(?![\\p{L}])', 'u'), '$1＿＿＿＿'); } catch (e) {}
      if (blank === x.es) blank = x.es.replace(new RegExp(clz), '＿＿＿＿');
      if (sess.st === 'ask') return `${src}<div class="q">Fill in the missing word</div><div class="big sm">${esc(blank)}</div><div class="hint">${esc(x.en)}</div><input id="nb-in" class="nbin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe aquí…"><button class="nbb" data-act="check">Check</button><button class="lnk" data-act="skip">I don’t know</button>`;
      return `${src}<div class="q">Fill in the missing word</div>${chk(sess.val, sess.ok)}<div class="big sm">${esc(x.es)}</div><div class="hint">${esc(x.en)}</div>${sess.ok ? '' : `<div class="you">You wrote: ${esc(sess.val || '—')}</div>`}<button class="nbb" data-act="next">Next</button>`;
    }
    if (x.type === 'sentence') return `${src}<div class="q">Say this in Spanish</div><div class="big sm">${esc(x.en || '—')}</div>${sess.st === 'ask' ? `<button class="nbb" data-act="show">Show sentence</button>` : `<div class="ans sm">${esc(x.es)}</div>${rate()}`}`;
    return `${src}<div class="q">Grammar · what did you learn in “${esc(st.title)}”?</div>${sess.st === 'ask' ? `<div class="big sm" style="color:var(--mute)">Try to recall the grammar before you look.</div><button class="nbb" data-act="show">Show grammar note</button>` : `<div class="ans sm">${esc(x.es)}</div><a class="lnk" href="#story-${x.storyId}" data-act="open-story" data-id="${x.storyId}">Open the story to see it in context ›</a>${rate()}`}`;
  }
  // Self-grading buttons for flip cards: 'Not yet' (wrong) / 'Got it' (correct).
  const rate = () => `<div class="rate"><button data-act="again">Not yet</button><button data-act="good" class="g">Got it</button></div>`;

  /* ---------- drawer ---------- */
  // Human text for when a card is due: days rounded up.
  const when = t => { const sd = x => { const d = new Date(x); d.setHours(0, 0, 0, 0); return d.getTime(); }, d = Math.round((sd(t) - sd(nowT())) / DAY); return t <= nowT() ? 'soon' : d <= 0 ? 'later today' : d === 1 ? 'tomorrow' : 'in ' + d + ' days'; }; // by calendar day, so a card due in 10 minutes is not 'tomorrow'
  // Mastery meter: box filled dots out of 5.
  const dots = x => '●'.repeat(x.box) + '○'.repeat(5 - x.box);
  // Redraw the whole drawer for the current tab (review / browse / progress). Large template-string HTML, no framework.
  function render() {
    const d = el.drawer, dl = dueList(), ms = items.filter(mastered).length;
    const tabs = [['review', 'Review'], ['browse', 'My notes'], ['progress', 'Progress']];
    let body = '';
    if (tab === 'review') {
      if (sess && !sess.done) {
        const x = sess.queue[sess.i];
        body = `<div class="prog"><i style="width:${sess.i / sess.queue.length * 100}%"></i></div><div class="cnt">${sess.i + 1} / ${sess.queue.length}${sess.banner && sess.retried ? ' · ' + esc(sess.banner) : ''}</div><div class="card nbcard">${cardHtml(x)}</div><button class="lnk" data-act="end">End session</button>`;
      } else if (sess && sess.done) {
        body = `<div class="card nbcard center"><div class="big">🎉 Session done</div><p>You reviewed <b>${sess.total}</b> cards and got <b>${sess.correct}</b> right.</p><p style="color:var(--mute);font-size:.85rem">Cards you know come back later. Cards you miss come back sooner.</p><button class="nbb" data-act="end">Back to notebook</button></div>`;
      } else if (!items.length) {
        body = `<div class="empty-nb"><div style="font-size:2.4rem">📓</div><h3>Your notebook is empty</h3><p>It fills up as you read. There are three ways to add things yourself:</p><ul><li><b>Words:</b> tap a <b>bold word</b> in a story, then “Save word”.</li><li><b>Sentences:</b> tap any sentence, then “Save sentence”. Great for learning sentence structure.</li><li><b>Grammar:</b> open “Key Spanish concepts” and save the grammar note.</li></ul><p>Missed flashcards are added automatically. Your notebook is saved on this device only, even when your progress syncs.</p></div>`;
      } else {
        body = `<div class="tiles"><div><b>${items.length}</b><span>saved</span></div><div class="${dl.length ? 'hot' : ''}"><b>${dl.length}</b><span>due now</span></div><div><b>${ms}</b><span>mastered</span></div></div>
          ${dl.length ? `<button class="nbb big" data-act="start">Start review · ${Math.min(dl.length, 15)} card${Math.min(dl.length, 15) > 1 ? 's' : ''}</button>` : `<div class="ok-msg">✓ You’re all caught up. Next review ${when(Math.min(...items.map(x => x.due)))}.</div><button class="nbb ghost" data-act="practice">Practice anyway</button>`}
          <div class="streak">🔥 ${streak()}-day review streak</div>`;
      }
    } else if (tab === 'browse') {
      const q = norm(filt.q);
      const list = items.filter(x => (filt.type === 'all' || x.type === filt.type) && (filt.level === 'all' || x.level === filt.level) && (!q || norm(x.es + ' ' + x.en + ' ' + x.ctx).includes(q)));
      body = `<div class="flt"><input id="nb-q" placeholder="Search my notes" value="${esc(filt.q)}"><div>${[['all', 'All'], ['word', 'Words'], ['sentence', 'Sentences'], ['grammar', 'Grammar']].map(c => `<button class="fc ${filt.type === c[0] ? 'on' : ''}" data-act="ft" data-v="${c[0]}">${c[1]}</button>`).join('')}</div><div>${['all', ...LV].map(c => `<button class="fc ${filt.level === c ? 'on' : ''}" data-act="fl" data-v="${c}">${c === 'all' ? 'All levels' : c}</button>`).join('')}</div></div>
        <div class="nblist">${list.length ? list.map(x => `<div class="it"><div class="tt"><span class="ty ${x.type}">${T[x.type]}</span> ${x.type === 'grammar' ? esc(x.es) : '<b>' + esc(x.es) + '</b>'}${x.en ? `<small>${esc(x.en)}</small>` : ''}</div><div class="mm"><a href="#story-${x.storyId}" data-act="open-story" data-id="${x.storyId}">${x.level} · ${esc(sty(x).title)}</a><span title="Mastery">${dots(x)}</span><button data-act="del" data-id="${esc(x.id)}" aria-label="Delete">×</button></div></div>`).join('') : `<div class="empty">${items.length ? 'Nothing matches.' : 'Nothing saved yet.'}</div>`}</div>
        ${items.length ? `<div class="exp"><button class="lnk" data-act="csv">Export my notebook (CSV)</button></div>` : ''}${csvText ? `<div class="csvbox"><textarea id="nb-csv" readonly rows="7">${esc(csvText)}</textarea><button class="nbb ghost" data-act="csvcopy">Copy to clipboard</button><div class="hint2" id="nb-csvmsg">Paste into a spreadsheet or a text file.</div></div>` : ''}`;
    } else {
      const days = store.get(DKEY, {}), last7 = [...Array(7)].map((_, i) => { const t = noonT() - (6 - i) * DAY; return [new Date(t).toLocaleDateString(undefined, { weekday: 'narrow' }), days[dayKey(t)] || 0]; }), mx = Math.max(1, ...last7.map(x => x[1]));
      const byType = t => items.filter(x => x.type === t).length;
      const stories = S.filter(s => items.some(x => x.storyId === s.id));
      body = `<div class="tiles"><div><b>${byType('word')}</b><span>words</span></div><div><b>${byType('sentence')}</b><span>sentences</span></div><div><b>${byType('grammar')}</b><span>grammar</span></div></div>
        <h4>Reviews this week · 🔥 ${streak()}-day streak</h4><div class="wk">${last7.map(d => `<div><i style="height:${Math.max(3, d[1] / mx * 46)}px"></i><span>${d[0]}</span></div>`).join('')}</div>
        <h4>By level</h4>${LV.map(lv => { const a = items.filter(x => x.level === lv), m = a.filter(mastered).length; return `<div class="lvr"><span class="lvb lv${lv}">${lv}</span><div class="pbar"><i style="width:${a.length ? m / a.length * 100 : 0}%"></i></div><small>${a.length} saved · ${m} mastered</small></div>`; }).join('')}
        <h4>By story</h4>${stories.length ? stories.map(s => { const a = items.filter(x => x.storyId === s.id), m = a.filter(mastered).length; return `<a class="sr" href="#story-${s.id}" data-act="open-story" data-id="${s.id}"><span class="lvb lv${s.level}">${s.level}</span><span class="st">${esc(s.title)}<div class="pbar"><i style="width:${m / a.length * 100}%"></i></div></span><small>${a.length} saved<br>${m} mastered</small></a>`; }).join('') : '<div class="empty">Save words, sentences or grammar notes while you read and they’ll show up here by story.</div>'}
        <p style="font-size:.75rem;color:var(--mute)">Mastered = reviewed correctly 4+ times in a row at growing gaps (1, 3, 7, 14 days).</p>`;
    }
    d.innerHTML = `<div class="nbh"><b>${ic('notebook', 20)} My notebook</b><button data-act="close" aria-label="Close notebook">×</button></div><div class="nbt">${tabs.map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-act="tab" data-v="${t[0]}">${t[1]}${t[0] === 'review' && dueList().length ? ` <i>${dueList().length}</i>` : ''}</button>`).join('')}</div>${persisted ? '' : '<div class="warn">Your browser is blocking saved data, so the notebook will be lost when you close this page.</div>'}<div class="nbb-body">${body}</div>`;
    // Re-focus the answer box (Enter checks) and keep the caret in the search box while the list re-renders on each keystroke.
    const inp = d.querySelector('#nb-in'); if (inp) { inp.focus(); inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); act('check'); } }; }
    const sq = d.querySelector('#nb-q'); if (sq) sq.oninput = e => { filt.q = e.target.value; const pos = e.target.selectionStart; render(); const n = el.drawer.querySelector('#nb-q'); n.focus(); n.setSelectionRange(pos, pos); };
  }
  // Single dispatcher for every data-act button in the drawer (t = the clicked element, for its data-* attributes).
  function act(a, t) {
    const x = sess && sess.queue ? sess.queue[sess.i] : null;
    if (a === 'close') closeNB();
    else if (a === 'tab') { tab = t.dataset.v; render(); }
    else if (a === 'start') startSession(false);
    else if (a === 'practice') startSession(true);
    else if (a === 'end') { sess = null; render(); }
    else if (a === 'show') { sess.st = 'shown'; render(); }
    else if (a === 'again') { grade(x, false); nextCard(); }
    else if (a === 'good') { grade(x, true); nextCard(); }
    else if (a === 'skip') { sess.val = ''; sess.ok = false; sess.st = 'checked'; grade(x, false); render(); }
    else if (a === 'check') {
      const v = (el.drawer.querySelector('#nb-in') || {}).value || ''; if (!v.trim()) return;
      // Typed answers ignore case, accents and punctuation (norm) and the leading article; target is the cloze word for cloze cards.
      const target = (sess.mx === x ? sess.mm : mode(x)) === 'cloze' ? x.cloze : x.es;
      sess.val = v; sess.ok = accepted(target).has(norm(v)); sess.st = 'checked'; grade(x, sess.ok); render();
    } else if (a === 'next') nextCard();
    else if (a === 'ft') { filt.type = t.dataset.v; render(); }
    else if (a === 'fl') { filt.level = t.dataset.v; render(); }
    else if (a === 'del') { remove(t.dataset.id); }
    else if (a === 'csv') exportCsv();
    else if (a === 'csvcopy') { const ta = el.drawer.querySelector('#nb-csv'), m = el.drawer.querySelector('#nb-csvmsg'); ta.select(); (navigator.clipboard ? navigator.clipboard.writeText(csvText) : Promise.reject()).then(() => { m.textContent = 'Copied!'; }, () => { m.textContent = 'Press Ctrl/Cmd+C to copy the selected text.'; }); }
    else if (a === 'open-story') { closeNB(); }
    else if (a === 'open-nb') openNB();
  }
  // Build a CSV of all items; q() quotes every field and doubles embedded quotes. next_review is the local date of the due time.
  function exportCsv() {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = [['type', 'level', 'story', 'spanish', 'english', 'example', 'mastery_box', 'next_review']].concat(items.map(x => [x.type, x.level, sty(x).title, x.es, x.en, x.ctx, x.box, dayKey(x.due)]));
    csvText = rows.map(r => r.map(q).join(',')).join('\n'); render();
  }
  // Insert the DOM (backdrop, drawer, toast, popover), the badge on #nb-nav, and the global listeners (outside click, Escape, scroll,
  // hashchange, which also forgets the current story).
  function mount() {
    document.body.insertAdjacentHTML('beforeend', `<div id="nb-back" hidden></div><aside id="nb" role="dialog" aria-label="My notebook" aria-hidden="true"></aside><div id="nb-toast" hidden></div><div id="nb-pop" hidden></div>`);
    const nn0 = document.getElementById('nb-nav'); const bd = document.createElement('b'); bd.id = 'nb-badge'; bd.hidden = true; nn0.appendChild(bd);
    el = { btn: nn0, badge: bd, back: document.getElementById('nb-back'), drawer: document.getElementById('nb'), toast: document.getElementById('nb-toast'), pop: document.getElementById('nb-pop') };
    const nn = document.getElementById('nb-nav'); if (nn) nn.onclick = e => { e.preventDefault(); openNB(); };
    el.back.onclick = closeNB;
    el.drawer.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (!t) return; if (t.dataset.act !== 'open-story') e.preventDefault(); act(t.dataset.act, t); });
    el.toast.addEventListener('click', e => { if (e.target.dataset.act === 'open-nb') openNB(); });
    document.addEventListener('click', e => { if (!el.pop.hidden && !el.pop.contains(e.target) && !(popFor && popFor.contains(e.target))) closePop(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); closeNB(); } });
    window.addEventListener('scroll', closePop, { passive: true });
    window.addEventListener('hashchange', () => { closePop(); refreshMarks.story = null; });
    badge();
  }
  return { mount, spans, decorate, flashMiss, open: openNB, toggleWord, isSaved, addNote, addFix, addMiss, matchVocab, showTools, cur: () => refreshMarks.story };
})();
