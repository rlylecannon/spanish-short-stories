/* ============ dictionary + verb helper (inserted in the app IIFE after NB) ============
 *
 * PURPOSE
 *   Lookup feature: (1) a popover shown when the reader taps any word in a story (meaning, tense/person of verb
 *   forms, save-to-notebook, speak, jump to the conjugation) and (2) a slide-in drawer where the user searches
 *   Spanish or English words and views full conjugation tables.
 *
 * PUBLIC API (returned object LK)
 *   mount()   build the drawer / popover DOM and attach global listeners (call once at startup).
 *   wrap(p, s)  make every word of a story paragraph element p tappable (story s); called by NB.decorate().
 *   open(o)   open the drawer: { verb, hilite, level } shows that verb's conjugation (hilite = tapped form to
 *             outline, level = CEFR level that picks the default tenses); { q } pre-fills a search.
 *   pop       = showPop(s, wordEl, readingIndex), the word popover.
 *   isVerb(w) true if w is an infinitive that has a gloss and can be conjugated.
 *
 * DEPENDENCIES (names from the surrounding app IIFE / page)
 *   DATA.dict, window.Conj (conj.js; every use is guarded because it may be missing), NB (notebook.js:
 *   matchVocab, isSaved, toggleWord, showTools, addNote, cur), esc (HTML escape), ic (icon svg
 *   helper), localStorage. Expects an element #lk-nav in the page (optional) to open the drawer.
 *   localStorage key sff-lookups = the 10 most recently opened verbs.
 *
 * DATA SHAPES
 *   DATA.dict   { surfaceForm: [[lemma, pos, gloss], ...] } - keyed by the lowercase word as it appears in the
 *               stories (one form may have several readings). pos is a key of POSN (noun, verb, adj, ...).
 *               readings() may add a 4th element 'guess' when the infinitive was guessed by Conj.guess().
 *   IDX         { 'lemma|pos': { lemma, pos, gloss } } one entry per lemma (first reading wins).
 *   NI          { normalisedForm: [exact forms] } for accent-insensitive lookup.
 *   st          drawer state: q (search text), verb (infinitive being conjugated or null), hilite (form to outline),
 *               sel (user-chosen tense keys or null), level, all (show all tenses).
 */
// Everything is private to this IIFE; only the object returned at the bottom is public.
const LK = (function () {
  // D = the dictionary, C = the conjugation engine, RKEY = localStorage key for the recent-verbs list.
  const D = DATA.dict || {}, C = window.Conj, RKEY = 'sff-lookups';
  // Compact person labels for table rows and notes (same order as Conj.PERSONS).
  const PERS_SHORT = ['yo', 'tú', 'él / ella / Ud.', 'nosotros', 'vosotros', 'ellos / Uds.'];
  // Part-of-speech code -> English label shown in italics ('other' shows nothing).
  const POSN = { noun: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', conj: 'conjunction', pron: 'pronoun', det: 'determiner', interj: 'interjection', name: 'name', num: 'number', other: '' };
  // Glosses for very common verbs (including reflexive ones) that may be missing from DATA.dict; stored as one
  // string 'infinitive:gloss;infinitive:gloss' and parsed here (split at the FIRST colon) into { infinitive: gloss }.
  const COMMON = `hablar:to speak, to talk;comer:to eat;vivir:to live;ser:to be;estar:to be;tener:to have;hacer:to do, to make;ir:to go;ver:to see;dar:to give;saber:to know (a fact);conocer:to know (a person or place);poder:to be able to, can;querer:to want, to love;decir:to say, to tell;venir:to come;poner:to put;salir:to go out, to leave;llegar:to arrive;pasar:to pass, to happen, to spend (time);deber:to owe, should;parecer:to seem;quedar:to stay, to be left;creer:to believe, to think;llevar:to carry, to wear;dejar:to leave, to let;seguir:to follow, to continue;encontrar:to find;llamar:to call;pensar:to think;volver:to return;tomar:to take, to drink;esperar:to wait, to hope;buscar:to look for;entrar:to enter;trabajar:to work;escribir:to write;perder:to lose;producir:to produce;ocurrir:to occur;entender:to understand;pedir:to ask for, to order;recibir:to receive;recordar:to remember;terminar:to finish;permitir:to allow;aparecer:to appear;conseguir:to get, to achieve;comenzar:to begin;servir:to serve;sacar:to take out;necesitar:to need;mantener:to maintain, to keep;resultar:to turn out;leer:to read;caer:to fall;cambiar:to change;presentar:to present;crear:to create;abrir:to open;considerar:to consider;oír:to hear;acabar:to finish;convertir:to turn into;ganar:to win, to earn;formar:to form;traer:to bring;partir:to leave, to split;morir:to die;aceptar:to accept;realizar:to carry out;suponer:to suppose;comprender:to understand;lograr:to achieve;explicar:to explain;preguntar:to ask;tocar:to touch, to play;reconocer:to recognize;estudiar:to study;alcanzar:to reach;nacer:to be born;dirigir:to direct;correr:to run;utilizar:to use;pagar:to pay;ayudar:to help;gustar:to be pleasing, to like;jugar:to play;escuchar:to listen;cumplir:to fulfil, to turn (age);ofrecer:to offer;descubrir:to discover;levantar:to lift, to raise;intentar:to try;usar:to use;empezar:to begin;olvidar:to forget;cantar:to sing;bailar:to dance;caminar:to walk;cocinar:to cook;beber:to drink;dormir:to sleep;despertar:to wake up;levantarse:to get up;sentarse:to sit down;lavar:to wash;comprar:to buy;vender:to sell;viajar:to travel;mirar:to look at, to watch;sentir:to feel;vestir:to dress;reír:to laugh;sonreír:to smile;llorar:to cry;amar:to love;odiar:to hate;limpiar:to clean;preparar:to prepare;visitar:to visit;contar:to count, to tell;costar:to cost;mostrar:to show;enviar:to send;construir:to build;elegir:to choose;repetir:to repeat;sonar:to sound, to ring;soñar:to dream;volar:to fly;nadar:to swim;vender:to sell;romper:to break;cerrar:to close;prohibir:to forbid;huir:to flee;ducharse:to take a shower;acostarse:to go to bed;llamarse:to be called;sentirse:to feel (oneself);preocuparse:to worry;quedarse:to stay;irse:to leave, to go away`.split(';').reduce((o, x) => { const i = x.indexOf(':'); if (i > 0) o[x.slice(0, i)] = x.slice(i + 1); return o; }, {});

  // Normalise for accent-insensitive matching: lowercase, strip accents, drop punctuation. ñ is first swapped for a
  // placeholder (\u0001) so it survives accent stripping (año stays different from ano); the range in the second
  // replace is the Unicode combining-marks block that NFD splits accents into.
  const norm = s => String(s).toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\u0001 ]/g, '').trim();
  // IDX and NI are keyed by arbitrary words, so they are prototype-less objects (a word like 'constructor' or
  // '__proto__' must not hit Object.prototype). D is a normal object from DATA, so has() checks own properties only.
  const IDX = Object.create(null), NI = Object.create(null), has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  // Build the indexes: NI maps normalised form -> exact dictionary keys; IDX has one entry per lemma+pos.
  Object.entries(D).forEach(([f, rs]) => {
    (NI[norm(f)] = NI[norm(f)] || []).push(f);
    rs.forEach(r => { const k = r[0] + '|' + r[1]; if (!IDX[k]) IDX[k] = { lemma: r[0], pos: r[1], gloss: r[2] }; });
  });
  // Fill in COMMON verbs as dictionary entries when the dictionary has no such verb.
  Object.entries(COMMON).forEach(([v, g]) => { const k = v + '|verb'; if (!IDX[k]) IDX[k] = { lemma: v, pos: 'verb', gloss: g }; });
  // Strip the reflexive -se (levantarse -> levantar).
  const baseOf = l => l.replace(/(ar|er|ir|ír)se$/, '$1');
  // English gloss of a verb: tries the infinitive, its non-reflexive base, then the reflexive version; '' if unknown.
  const vgloss = inf => (IDX[inf + '|verb'] || IDX[baseOf(inf) + '|verb'] || IDX[inf.replace(/(ar|er|ir|ír)$/, '$1se') + '|verb'] || {}).gloss || '';
  // A verb is 'known' if we have an English gloss for it (used to filter Conj.guess results).
  const knownVerb = inf => !!vgloss(inf);
  // Looks like an infinitive: 2+ letters then -ar/-er/-ir/-ír, optional reflexive -se; the second regex lists the
  // short verbs (ir, ser, ver, dar, oír, reír) that have fewer than 2 letters before the ending.
  const isInf = q => /^[a-záéíóúüñ]{2,}(ar|er|ir|ír)(se)?$/.test(q) || /^(ir|ser|ver|dar|oír|oir|reír|reir)(se)?$/.test(q); // short verbs (ir, ser, ver, dar, oír) have fewer than 2 letters before the ending
  // Parts of speech for which a differing surface form is shown as 'form of <lemma>' (plurals, feminines).
  // Words that look like infinitives but are not verbs (and may be missing from the dictionary), plus any dictionary word whose only readings are not verbs.
  const NOT_INF = new Set('mujer lugar taller ayer cualquier primer tercer mar par azar hogar carácter cráter alcázar'.split(' '));
  const isInfWord = q => isInf(q) && !NOT_INF.has(q.replace(/se$/, '')) && !(has(D, q) && !knownVerb(q));
  const PLU = { noun: 1, adj: 1 };

  /* ---------- analysis of a tapped / typed form ---------- */
  // Possible dictionary readings [lemma, pos, gloss] for a tapped word, best source first: exact entry; entry that
  // matches ignoring accents/case; a guessed verb from Conj.guess() (tagged 'guess'); otherwise an 'other' placeholder.
  function readings(form) {
    const f = form.toLowerCase();
    if (has(D, f)) return D[f];
    const alt = (NI[norm(f)] || [])[0]; if (alt) return D[alt];
    if (C) { const g = C.guess(f).filter(x => knownVerb(x.inf))[0]; if (g) return [[g.inf, 'verb', vgloss(g.inf), 'guess']]; }
    return [[f, 'other', '']];
  }
  // Describe a verb form: asks Conj.identify what tense/person it is (label e.g. 'preterite · yo') and whether this
  // particular form is marked irregular (mark 1) in the conjugation table. Returns null if Conj is missing / not a verb.
  function verbInfo(lemma, form) {
    if (!C) return null;
    const base = baseOf(lemma), conj = C.conjugate(lemma); if (!conj) return null;
    const ids = C.identify(base, form.toLowerCase());
    let label = '', formIrr = false;
    if (ids.length) {
      const m = ids[0];
      const per = m.persons.length ? m.persons.slice(0, 3).map(i => PERS_SHORT[i]).join(' / ') : '';
      label = m.tense.toLowerCase() + (per ? ' · ' + per : '');
      const t = conj.tenses.find(t => t.key === m.key);
      if (t && m.persons.some(i => t.marks[i] === 1)) formIrr = true;
      if (m.key === 'ger' && conj.gerundIrr) formIrr = true;
      if (m.key === 'part' && conj.participleIrr === 1) formIrr = true;
    }
    return { conj, label, formIrr };
  }

  /* ---------- popover ---------- */
  // Popover state: pop element, the word span it belongs to, and the scroll position when it opened (popY).
  let pop, popFor = null, popY = 0;
  // Read text aloud at 0.8x through the app's shared speakPlain (stops story audio, uses the learner's chosen voice,
  // and cancels via cancelTTS so an older audio chain cannot carry on afterwards).
  function speak(t) { speakPlain(t, null, 0.8); }
  // Gather what the popover needs for word span w of story s: its text, readings, and (if the word is inside a bold
  // vocabulary word of the story) the matching vocab pair [spanish, english] so saving uses the story's own wording.
  function entryFor(s, w) {
    const form = w.textContent, b = w.closest('b.vw'), rs = readings(form);
    return { form, rs, vocab: b ? NB.matchVocab(s.vocab, b.textContent) : null };
  }
  function closePop() { if (pop) pop.hidden = true; if (popFor) popFor.classList.remove('sel'); popFor = null; }
  // Show the popover for word span w; ri = which reading to show (the 'Also: ...' button toggles between the first two).
  // Builds the HTML, positions it near the word (centred, clamped to the viewport, below the word unless there is no
  // room) and wires the buttons through data-act: spk, alt, save, conj, sent.
  function showPop(s, w, ri) {
    ri = ri || 0; if (popFor) popFor.classList.remove('sel'); popFor = w; w.classList.add('sel');
    const e = entryFor(s, w), r = e.rs[ri] || e.rs[0], [lemma, pos, gloss] = r;
    const saveEs = e.vocab ? e.vocab[0] : lemma, saveEn = e.vocab ? e.vocab[1] : gloss;
    const saved = NB.isSaved(s, saveEs);
    let detail = '', irr = '';
    if (pos === 'verb') {
      const vi = verbInfo(lemma, e.form);
      if (vi) {
        detail = vi.label ? `<div class="lkd">${esc(vi.label)}</div>` : '';
        const k = vi.conj.kind;
        irr = k === 'irregular' ? `<span class="lkirr">⚠ irregular verb${vi.formIrr ? ' · this form is irregular' : ''}</span>` : k === 'spelling' ? '<span class="lkspl">spelling-change verb</span>' : '<span class="lkreg">regular verb</span>';
      }
    } else if (norm(lemma.replace(/^(el|la|los|las|un|una) /, '')) !== norm(e.form) && PLU[pos]) detail = `<div class="lkd">form of <b>${esc(lemma)}</b></div>`;
    const other = e.rs.length > 1 ? `<button class="lkalt" data-act="alt" data-ri="${ri === 0 ? 1 : 0}">Also: ${esc(e.rs[ri === 0 ? 1 : 0][0])} · ${esc(e.rs[ri === 0 ? 1 : 0][2])}</button>` : '';
    const guess = r[3] === 'guess' ? '<div class="lkd">(best guess: not in this story’s word list)</div>' : '';
    pop.innerHTML = `<div class="lkh"><span class="lkw">${esc(e.form)}</span><button class="lkspk" data-act="spk" aria-label="Hear it">${ic('volume', 18)}</button></div>
      <div class="lkm"><b>${esc(lemma)}</b> ${POSN[pos] ? `<i>${POSN[pos]}</i>` : ''} ${gloss ? '· ' + esc(gloss) : ''}</div>${detail}${guess}${irr}${other}
      <div class="lkb"><button class="pb ${saved ? 'on' : ''}" data-act="save">${saved ? '✓ In notebook' : '＋ Notebook'}</button>${pos === 'verb' ? '<button class="pb ghost" data-act="conj">Conjugate ›</button>' : ''}<button class="pb ghost" data-act="sent">Sentence</button></div>`;
    pop.hidden = false; popY = window.scrollY;
    // Popover width <= 290px with an 8px margin to the screen edge; 170 is a fallback height before it has been measured.
    const rect = w.getBoundingClientRect(), pw = Math.min(290, innerWidth - 16), left = Math.max(8, Math.min(innerWidth - pw - 8, rect.left + rect.width / 2 - pw / 2));
    pop.style.width = pw + 'px'; pop.style.left = left + 'px';
    const ph = pop.offsetHeight || 170;
    pop.style.top = (rect.bottom + 8 + ph > innerHeight ? Math.max(8, rect.top - ph - 8) : rect.bottom + 8) + 'px';
    // Phones (<= 600px wide): scroll the page just enough that the tapped word stays above the popover; 92 is the
    // space reserved at the bottom of the viewport, 12 a gap. popY is updated so this scroll does not close the popover.
    if (innerWidth <= 600) { const r2 = w.getBoundingClientRect(), lim = innerHeight - 92 - (pop.offsetHeight || 150) - 12; if (r2.bottom > lim) { window.scrollBy(0, r2.bottom - lim); popY = window.scrollY; } }
    pop.onclick = ev => {
      const a = ev.target.closest('[data-act]'); if (!a) return; ev.stopPropagation();
      const act = a.dataset.act;
      if (act === 'spk') speak(e.form);
      else if (act === 'alt') showPop(s, w, +a.dataset.ri);
      else if (act === 'save') { NB.toggleWord(s, w, saveEs, saveEn); showPop(s, w, ri); }
      else if (act === 'conj') { closePop(); open({ verb: lemma, hilite: e.form.toLowerCase(), level: s.level }); }
      else if (act === 'sent') { closePop(); NB.showTools(s, w.closest('p.es'), w.closest('.sn') || w.closest('p.es').querySelector('.sn')); }
    };
  }
  // Make every word in paragraph p tappable: replace each text node's words with <span class="w"> elements whose click
  // opens the popover. The text nodes are collected first and replaced afterwards (changing the DOM while the tree walker
  // is running would break it); already wrapped text and non-text such as <b> markup are preserved.
  function wrap(p, s) {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      if (n.parentElement.closest('.w')) return;
      const txt = n.nodeValue; if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(txt)) return;
      const frag = document.createDocumentFragment(); let last = 0;
      // Used only for its callback: visits every run of letters (a word) and copies the text between words unchanged.
      txt.replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g, (m, i) => {
        if (i > last) frag.appendChild(document.createTextNode(txt.slice(last, i)));
        const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = m;
        sp.addEventListener('click', ev => { ev.stopPropagation(); showPop(s, sp); });
        frag.appendChild(sp); last = i + m.length; return m;
      });
      if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
  }

  /* ---------- drawer ---------- */
  // Which tenses are shown first, by CEFR level: beginners see only the present; B2 and up see everything.
  const TENSE_DEFAULT = { A1: ['pres'], A2: ['pres', 'pret', 'impf', 'fut'], B1: ['pres', 'pret', 'impf', 'fut', 'cond', 'presPerf', 'sPres', 'impA'], B2: 'all', C1: 'all', C2: 'all' };
  // Tense groups in display order [Conj group key, heading].
  const GROUPS = [['ind', 'Indicative'], ['perf', 'Perfect'], ['subj', 'Subjunctive'], ['imp', 'Commands']];
  // Drawer elements and state (see header).
  let drawer, back, st = { q: '', verb: null, hilite: '', sel: null, level: 'A1', all: false };
  // Recent verbs list, persisted in localStorage; every access is try/catch'd because storage can be blocked.
  const recent = () => { try { return JSON.parse(localStorage.getItem(RKEY)) || []; } catch (e) { return []; } };
  const pushRecent = v => { try { const r = [v].concat(recent().filter(x => x !== v)).slice(0, 10); localStorage.setItem(RKEY, JSON.stringify(r)); } catch (e) { } };

  // Drawer search. Result rows are { lemma, pos, gloss, note }, de-duplicated by lemma|pos, in this order: (1) dictionary hits
  // for the typed form, exact or accent-insensitive (note says which tense a verb form is); (2) the typed infinitive; (3) lemmas
  // whose normalised name equals the query; (4) if still no verb, guessed infinitives for a conjugated form (up to 3);
  // (5) fewer than 5 results and an English query: reverse search of the glosses. Max 14.
  function search(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const out = [], seen = new Set();
    // add: push a reading once (key lemma|pos).
    const add = (r, note) => { const k = r[0] + '|' + r[1]; if (seen.has(k)) return; seen.add(k); out.push({ lemma: r[0], pos: r[1], gloss: r[2], note: note || '' }); };
    const nq = norm(q);
    const forms = has(D, q) ? [q] : (NI[nq] || []);
    // Note text for verb forms, e.g. 'tienes = present · tú'. (The ... && false part is always true.)
    forms.forEach(f => D[f].forEach(r => add(r, f !== r[0] && !(r[1] === 'verb' && false) ? (r[1] === 'verb' ? (() => { const vi = verbInfo(r[0], f); return vi && vi.label ? f + ' = ' + vi.label : ''; })() : '') : '')));
    if (isInfWord(q) && C && C.conjugate(q)) add([q, 'verb', vgloss(q)]);
    Object.values(IDX).forEach(e => { if (norm(e.lemma.replace(/^(el|la|los|las) /, '')) === nq) add([e.lemma, e.pos, e.gloss]); });
    if (C && !out.some(o => o.pos === 'verb') && /^[a-záéíóúüñ]+$/.test(q) && q.length > 2) {
      C.guess(q).filter(g => knownVerb(g.inf)).slice(0, 3).forEach(g => { const m = g.matches[0]; add([g.inf, 'verb', vgloss(g.inf)], q + ' = ' + m.tense.toLowerCase() + (m.persons.length ? ' · ' + PERS_SHORT[m.persons[0]] : '')); });
    }
    // English -> Spanish: score each gloss part (split at , or ;, ignoring a leading to/a/an/the): 3 = equals the query, 2 = starts with
    // it or contains it as a whole word, 1 = starts with it (only for queries longer than 3 letters). Best score, then shorter lemma.
    if (out.length < 5 && /^[a-z' ]+$/.test(q) && q.length > 1) {
      const qq = q.replace(/^to /, ''), hits = [];
      Object.values(IDX).forEach(e => {
        const parts = e.gloss.toLowerCase().split(/[,;]/).map(x => x.trim().replace(/^(to|a|an|the) /, ''));
        let sc = 0; if (parts.includes(qq)) sc = 3; else if (parts.some(p => p.startsWith(qq + ' ') || p.split(' ').includes(qq))) sc = 2; else if (qq.length > 3 && parts.some(p => p.startsWith(qq))) sc = 1;
        if (sc) hits.push([sc, e]);
      });
      hits.sort((a, b) => b[0] - a[0] || a[1].lemma.length - b[1].lemma.length).slice(0, 12).forEach(h => add([h[1].lemma, h[1].pos, h[1].gloss]));
    }
    return out.slice(0, 14);
  }
  // Set of tense keys currently shown: all, the user's chip selection, or the level default.
  function selSet(conj) {
    if (st.all) return new Set(conj.tenses.map(t => t.key));
    const d = st.sel || TENSE_DEFAULT[st.level] || TENSE_DEFAULT.A1; return d === 'all' ? new Set(conj.tenses.map(t => t.key)) : new Set(d);
  }
  // One search result row; verb rows are clickable (data-act=pick) to open the conjugation.
  const rowHtml = (r, hil) => `<div class="lkr ${r.pos === 'verb' ? 'v' : ''}" ${r.pos === 'verb' ? `data-act="pick" data-v="${esc(r.lemma)}"` : ''}><div><b>${esc(r.lemma)}</b> ${POSN[r.pos] ? `<i>${POSN[r.pos]}</i>` : ''}<div class="lkg">${esc(r.gloss || (r.pos === 'verb' ? 'No English gloss in this mini-dictionary yet' : ''))}</div>${r.note ? `<small>${esc(r.note)}</small>` : ''}</div>${r.pos === 'verb' ? '<span class="lkgo">Conjugate ›</span>' : ''}</div>`;
  // HTML of the conjugation view: header, kind badge, notes, gerund/participle, tense chips and one table per selected tense.
  // Cell classes come from Conj marks: 1 -> irr (irregular), 2 -> spl (spelling change); hit = the cell equals the form the user tapped
  // (compared with raw, which has no reflexive pronoun).
  function conjView() {
    const conj = C && C.conjugate(st.verb); if (!conj) return '<p class="lkd">That doesn’t look like a Spanish verb. Try the form ending in -ar, -er or -ir, such as hablar.</p>';
    const sel = selSet(conj), cur = NB.cur && NB.cur();
    const kind = conj.kind === 'irregular' ? '<span class="lkirr">⚠ Irregular</span>' : conj.kind === 'spelling' ? '<span class="lkspl">Regular with spelling changes</span>' : '<span class="lkreg">✓ Regular</span>';
    const chips = GROUPS.map(([g, gl]) => `<div class="tg"><span>${gl}</span>${conj.tenses.filter(t => t.group === g).map(t => `<button class="lkc ${sel.has(t.key) ? 'on' : ''}" data-act="tense" data-k="${t.key}">${esc(t.label.replace(' subjunctive', '').replace('Commands ', 'Cmd '))}</button>`).join('')}</div>`).join('');
    const hil = st.hilite;
    const cards = conj.tenses.filter(t => sel.has(t.key)).map(t => `<div class="tc"><h5>${esc(t.label)}</h5><table>${t.forms.map((f, i) => f == null ? '' : `<tr><th>${PERS_SHORT[i]}</th><td class="${t.marks[i] === 1 ? 'irr' : t.marks[i] === 2 ? 'spl' : ''} ${hil && t.raw[i] === hil ? 'hit' : ''}">${esc(f)}</td></tr>`).join('')}</table></div>`).join('');
    const addNote = cur && conj.kind !== 'regular' ? `<button class="nbb ghost" data-act="note">${NB.isSaved(cur, 'v:' + conj.base) ? '✓ Note saved to notebook' : '＋ Save a note about this verb'}</button>` : '';
    return `<button class="lnk" data-act="back">‹ Back to search</button>
      <div class="lkt"><h3>${esc(conj.inf)}</h3><div class="lkg">${esc(vgloss(conj.inf) || '')}</div><div>${kind}</div></div>
      ${conj.notes.length ? `<ul class="lkn">${conj.notes.slice(0, 4).map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '<p class="lkd">All forms follow the regular -' + conj.type + ' pattern.</p>'}
      <div class="lknf"><span>Gerund: <b class="${conj.gerundIrr ? 'irr' : ''}">${esc(conj.gerund)}</b></span><span>Participle: <b class="${conj.participleIrr === 1 ? 'irr' : ''}">${esc(conj.participle)}</b></span></div>
      <div class="tsel">${chips}<button class="lnk" data-act="alltenses">${st.all ? 'Show fewer tenses' : 'Show all tenses'}</button></div>
      <div class="legend"><span class="irr">orange</span> = irregular form · <span class="spl">dotted</span> = spelling change${hil ? ' · <span class="hit">outlined</span> = the word you tapped' : ''}</div>
      <div class="tcs">${cards || '<p class="lkd">Choose a tense above.</p>'}</div>${addNote}`;
  }
  // Redraw the drawer body: conjugation view, search results, or (empty query) the help text plus recent and sample verbs.
  function render() {
    let body = '';
    if (st.verb) body = conjView();
    else {
      const res = search(st.q);
      if (!st.q.trim()) {
        const rc = recent();
        body = `<div class="lkhint"><p><b>Look up any word.</b> Type Spanish (<i>tienes</i>, <i>pez</i>) or English (<i>to eat</i>, <i>fish</i>).</p><p><b>Conjugate any verb.</b> Type an infinitive such as <i>hablar</i> or <i>ir</i> to see every tense, with irregular forms highlighted.</p><p>Tip: while reading, tap any word in a story.</p></div>${rc.length ? `<h4>Recent verbs</h4><div class="rcs">${rc.map(v => `<button class="lkc" data-act="pick" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>` : ''}<h4>Try</h4><div class="rcs">${['ser', 'tener', 'ir', 'hacer', 'poder', 'dormir', 'empezar', 'conocer'].map(v => `<button class="lkc" data-act="pick" data-v="${v}">${v}</button>`).join('')}</div>`;
      } else body = res.length ? `<div class="lkres">${res.map(r => rowHtml(r)).join('')}</div>` : `<p class="lkd">No match for “${esc(st.q)}”. Try the infinitive of a verb, or check the spelling. The dictionary covers the words in the 60 stories; any verb can be conjugated.</p>`;
    }
    drawer.querySelector('.lkbody').innerHTML = body;
  }
  // Open the drawer. o.verb = conjugate that verb (remembered in recent list); o.q = show search results for q; the level
  // falls back to the current story's level (NB.cur()) for the default tenses.
  function open(o) {
    o = o || {};
    if (o.level) st.level = o.level; else { const c = NB.cur && NB.cur(); st.level = c ? c.level : 'A1'; }
    if (o.verb) { st.verb = o.verb; st.hilite = o.hilite || ''; st.sel = null; st.all = false; pushRecent(o.verb); }
    else if (o.q !== undefined) { st.q = o.q; st.verb = null; }
    drawer.classList.add('open'); back.hidden = false; drawer.setAttribute('aria-hidden', 'false');
    drawer.querySelector('#lk-q').value = st.verb ? '' : st.q;
    render(); if (!o.verb) drawer.querySelector('#lk-q').focus();
  }
  function close() { drawer.classList.remove('open'); back.hidden = true; drawer.setAttribute('aria-hidden', 'true'); }
  // Create the drawer and popover DOM, then attach listeners: search input, Enter (open the verb if the text is an infinitive or the
  // only result is a verb), delegated drawer clicks via data-act, click-outside / Escape / scroll(>80px) / hashchange closing the popover.
  function mount() {
    document.body.insertAdjacentHTML('beforeend', `<div id="lk-back" hidden></div><aside id="lk" role="dialog" aria-label="Dictionary and verb helper" aria-hidden="true"><div class="nbh"><b>${ic('search', 20)} Lookup</b><button data-act="close" aria-label="Close">×</button></div><div class="lksearch"><input id="lk-q" type="search" placeholder="Spanish or English word, or any verb…" autocomplete="off" autocapitalize="off" spellcheck="false"></div><div class="lkbody"></div></aside><div id="lk-pop" hidden></div>`);
    drawer = document.getElementById('lk'); back = document.getElementById('lk-back'); pop = document.getElementById('lk-pop');
    const nv = document.getElementById('lk-nav'); if (nv) nv.onclick = e => { e.preventDefault(); open(); };
    back.onclick = close;
    drawer.querySelector('#lk-q').oninput = e => { st.q = e.target.value; st.verb = null; render(); };
    drawer.querySelector('#lk-q').onkeydown = e => { if (e.key === 'Enter') { const q = st.q.trim().toLowerCase(); if (isInfWord(q) && C && C.conjugate(q)) open({ verb: q }); else { const r = search(q).find(x => x.pos === 'verb'); if (r && search(q).length === 1) open({ verb: r.lemma }); } } };
    drawer.addEventListener('click', e => {
      const a = e.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act;
      if (act === 'close') close();
      else if (act === 'pick') { st.hilite = ''; open({ verb: a.dataset.v }); }
      else if (act === 'back') { st.verb = null; drawer.querySelector('#lk-q').value = st.q; render(); drawer.querySelector('#lk-q').focus(); }
      else if (act === 'tense') { const conj = C.conjugate(st.verb), s = selSet(conj); s.has(a.dataset.k) ? s.delete(a.dataset.k) : s.add(a.dataset.k); st.sel = [...s]; st.all = false; render(); }
      else if (act === 'alltenses') { st.all = !st.all; if (!st.all) st.sel = null; render(); }
      else if (act === 'note') { const conj = C.conjugate(st.verb), cur = NB.cur(); NB.addNote(cur, 'v:' + conj.base, conj.inf + ': ' + (conj.kind === 'irregular' ? 'irregular. ' : '') + conj.notes.slice(0, 2).join(' '), vgloss(conj.inf)); render(); }
    });
    document.addEventListener('click', e => { if (pop && !pop.hidden && !pop.contains(e.target) && !(popFor && popFor.contains(e.target))) closePop(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); close(); } });
    window.addEventListener('scroll', () => { if (pop && !pop.hidden && Math.abs(window.scrollY - popY) > 80) closePop(); }, { passive: true });
    window.addEventListener('hashchange', closePop);
  }
  // Public helper: a known, conjugatable infinitive.
  const isVerb = w => { w = String(w).toLowerCase(); return isInf(w) && !!vgloss(w) && !!(C && C.conjugate(w)); };
  return { mount, wrap, open, pop: showPop, isVerb };
})();
