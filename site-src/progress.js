/* ===== Find your level (placementPage), can-do progress, optional name, optional sync =====
   Pasted into app.js's IIFE scope (not a module). Names provided to app.js: myName(), placementPage(), progressPage()
   (the router calls placementPage for #placement and progressPage for #progress; the home page uses myName and sff-place).
   Names used from app.js: store, esc, app (the page container), S (stories), byId, M (level meta, M[level].name),
   PROG, scores(), route(), window.claude (optional sync).
   DATA fields: DATA.placement = { bank, cando }, built from placement/bank.json and placement/cando.json.
     bank item: { id 'P-A1-01', level 'A1'..'C2', skill 'grammar'|'vocab'|'reading', q, options[], answer (index into
                  options), why, topic, passage? }. Items sharing the same `passage` text are asked together (reading).
     cando level: { level, levelGoal, checkpoint: {passStories, passComp}, statements: [ { id 'A1-R1', level,
                  skill 'reading'|'listening'|'speaking'|'writing'|'grammar', text,
                  evidence: { stories: [story ids], quiz: 'comp'|'gram'|null, minScorePct, speak: bool } } ] }.
   localStorage keys (via store, JSON):
     sff-name       string, optional first name (max 30 chars)
     sff-place      latest placement result { level 'A1'..'C2'|'Below A1', conf 'high'|'medium'|'low', at: ms timestamp,
                    pct: {band: integer percent | null if band not shown} }
     sff-place-hist array of up to 10 past results (same shape as sff-place), oldest first
     sff-place-seen { itemId: times shown }, used so retakes prefer questions seen less often
     sff-cando      { statementId: 1 } goals the learner ticked by hand
     sff-pl-open    { level: 1|0 } which level panels are expanded on the progress page (UI state only, not synced)
   Optional cross-device sync (SYNC_KEYS below) works only for signed-in Claude viewers; everything always stays in
   localStorage as well. ===== */
// Placement bank and can-do goals; the fallback keeps the page working if DATA.placement is missing.
const PL = DATA.placement || { bank: [], cando: { levels: [] } };
// localStorage key names (see header for value shapes).
const NAME_K = 'sff-name', PLACE_K = 'sff-place', CANDO_K = 'sff-cando', HIST_K = 'sff-place-hist', SEEN_K = 'sff-place-seen';
// Every localStorage key included in cross-device sync (placement/can-do/name plus progress keys owned by app.js and warmup.js).
const SYNC_KEYS = ['sff-name', 'sff-place', 'sff-place-hist', 'sff-place-seen', 'sff-cando', 'sff-prog', 'sff-scores', 'sff-gscores', 'sff-gstats', 'sff-missed', 'sff-gseen', 'sff-last', 'sff-wu'];
// The learner's saved first name ('' if none); also used by app.js for the home greeting.
const myName = () => String(store.get(NAME_K, '') || '').trim().slice(0, 30);
// CEFR bands in ascending order; the placement quiz walks through them in this order.
const PLV = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
// Fisher-Yates shuffle on a copy (input array is not modified).
const shuffleA = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
// First story to recommend for each result level (story ids from DATA.stories).
const START = { A1: 'a1-01', A2: 'a2-01', B1: 'b1-01', B2: 'b2-01', C1: 'c1-01', C2: 'c2-01' };
// Result messages keyed by plScore().key: the level, 'none' (below A1), or '<level>low' for a borderline result.
// Note: plScore currently only produces conf 'low' (key 'A1low') for A1; the other *low messages are for future use.
const PMSG = {
  none: 'Welcome! You are just starting out, and that is a great place to begin. Our first story uses very simple Spanish with an English line under every sentence, so turn on the translations and the audio.',
  A1: 'Nice work! You know the Spanish basics: present tense, ser and estar, numbers and time. Start with our A1 stories to build speed and vocabulary.',
  A1low: 'You have some of the basics, and a few gaps are normal. Start at A1 and use the grammar notes under each story.',
  A2: 'Great! You can handle everyday Spanish and you are ready for stories told in the past. Begin with A2.',
  A2low: 'You are between A1 and A2. Try the first A2 story. If it feels hard, go back to a few A1 stories first.',
  B1: 'Impressive! You can follow real narratives with different tenses and the subjunctive. B1 stories will stretch you just enough.',
  B1low: 'You are close to B1. Start the first B1 story with translations on, and check the grammar notes when a structure feels new.',
  B2: 'Excellent! You are reading at an upper-intermediate level and picking up tone and implication. Jump into the B2 stories.',
  B2low: 'You are close to B2. Start with the first B2 story and use the grammar notes when a structure feels new.',
  C1: 'Outstanding! You read demanding texts, follow shifts of register and catch implied meaning. The C1 stories will challenge you with real documents, regional voices and layered plots.',
  C1low: 'You are close to C1. Begin with the first C1 story, keep the translation handy, and check the grammar notes after each story.',
  C2: 'Exceptional! You handle literary, legal and journalistic Spanish, irony and dialect. The C2 stories are written for you.'
};

/* ---- optional sync (signed-in Claude viewers only; everything also stays on this device) ---- */
// Sync state: on = remote doc found and merged; status = text shown in the "Your progress" box; doc = remote db document
// handle; timer = debounce timer for pushes; busy is declared but not used elsewhere in this file.
const SYNC = { on: false, status: 'Saved on this device', doc: null, timer: null, busy: false };
// Generic "never lose progress" merge of a local (a) and remote (b) value: missing side loses; numbers take the max;
// plain objects merge key by key; arrays keep the longer one; anything else keeps the local value (a).
const mergeVal = (a, b) => {
  if (a === undefined) return b; if (b === undefined) return a;
  if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) { const o = { ...a }; for (const k in b) o[k] = mergeVal(a[k], b[k]); return o; }
  if (Array.isArray(a) && Array.isArray(b)) return a.length >= b.length ? a : b;
  return a;
};
// Snapshot of all synced localStorage keys that currently have a value (the payload stored remotely).
const snapKeys = () => { const o = {}; SYNC_KEYS.forEach(k => { const v = store.get(k, undefined); if (v !== undefined) o[k] = v; }); return o; };
// Write the snapshot { v: 1, t: ms timestamp, keys } to the remote doc; on failure only the status text changes (data is local anyway).
// Refreshes the status line if the progress page is showing.
async function syncPush() { if (!SYNC.on || !SYNC.doc) return; try { await SYNC.doc.set({ v: 1, t: Date.now(), keys: snapKeys() }); SYNC.status = 'Synced to your Claude account'; } catch (e) { SYNC.status = 'Saved on this device (sync unavailable)'; } if (/^#progress/.test(location.hash)) progressStatus(); }
// Debounce: many store.set calls in a row become one push 1.5 s after the last.
const schedulePush = () => { clearTimeout(SYNC.timer); SYNC.timer = setTimeout(syncPush, 1500); };
// Wrap store.set (app-wide, since store is shared) so any write to a synced key schedules a push once sync is on.
{ const _set = store.set.bind(store); store.set = (k, v) => { const r = _set(k, v); if (SYNC.on && SYNC_KEYS.includes(k)) schedulePush(); return r; }; }
// Start-up sync (runs 600 ms after load; silently does nothing outside Claude or when signed out).
// Needs claude.use('user') (id) and claude.use('db'); each wait is capped at 10 s by `race` so a slow runtime cannot hang start-up.
// Remote doc: collection 'data/users/<id>', doc 'progress'. Remote and local values are merged key by key (rules below),
// written straight to localStorage (bypassing the wrapped store.set so the merge does not trigger its own push), then pushed.
async function syncInit() {
  try {
    if (!window.claude || !claude.use) return;
    const race = p => Promise.race([p, new Promise(r => setTimeout(() => r(null), 10000))]);
    const [user, db] = await race(Promise.all([claude.use('user'), claude.use('db')])) || [];
    if (!user || !db || !user.id) return;
    const id = await user.id(); if (!id) return;
    const doc = db.collection('data/users/' + id).doc('progress'); SYNC.doc = doc;
    let remote = null; try { const snap = await race(doc.get()); remote = snap && (typeof snap.data === 'function' ? snap.data() : (snap.data !== undefined ? snap.data : snap)); } catch (e) {}
    const rk = (remote && remote.keys) || {};
    // Per-key merge, l = local, r = remote:
    //  sff-place: the newer result (larger .at) wins; sff-place-hist: union deduplicated by .at, oldest first, last 10 kept;
    //  sff-place-seen: per-item max count; name / last story / can-do ticks: local wins if set, else remote;
    //  sff-missed: local if it has entries, else remote; sff-gstats: per category keep the side with more attempts (.a);
    //  everything else: mergeVal (numbers max, objects merged, longer array).
    SYNC_KEYS.forEach(k => {
      const l = store.get(k, undefined), r = rk[k]; let m;
      if (k === PLACE_K) m = (l && r) ? ((l.at || 0) >= (r.at || 0) ? l : r) : (l || r);
      else if (k === HIST_K) m = [...(Array.isArray(l) ? l : []), ...(Array.isArray(r) ? r : [])].filter((x, i, a) => x && a.findIndex(y => y && y.at === x.at) === i).sort((a, b) => a.at - b.at).slice(-10);
      else if (k === SEEN_K) { m = { ...(r || {}) }; Object.keys(l || {}).forEach(id => { m[id] = Math.max(m[id] || 0, l[id]); }); }
      else if (k === NAME_K || k === 'sff-last' || k === CANDO_K) m = l !== undefined ? l : r;
      else if (k === 'sff-missed') m = (l && Object.keys(l).length) ? l : r;
      else if (k === 'sff-gstats') { m = { ...(r || {}) }; Object.keys(l || {}).forEach(c => { if (!m[c] || (l[c].a || 0) >= (m[c].a || 0)) m[c] = l[c]; }); }
      else m = mergeVal(l, r);
      if (m !== undefined) try { localStorage.setItem(k, JSON.stringify(m)); } catch (e) {}
    });
    SYNC.on = true; SYNC.status = 'Synced to your Claude account'; await syncPush();
    // Re-render the current page (home, stories list or progress) so merged data shows, but not while the user is typing in a field.
    if ((/^#(progress|stories)?$/.test(location.hash) || !location.hash) && !(document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) && !(fl && fl.size) && !fq && !(window.scrollY > 40)) route();
  } catch (e) { SYNC.on = false; }
}
setTimeout(syncInit, 600);

/* ---- name ---- */
// HTML for the optional name field (shared by the placement intro and the progress page); wire it with wireName().
function nameBox(after) {
  return `<div class="plname"><label for="plnm">What should we call you? <small>(optional, saved on your device${SYNC.on ? ' and your account' : ''})</small></label><div class="plrow"><input id="plnm" maxlength="30" placeholder="Your first name" value="${esc(myName())}" autocomplete="given-name"><button class="btn sm" id="plsave">Save</button></div></div>`;
}
// Attach save handlers (button click or Enter) to the nameBox; cb, if given, runs after saving (e.g. re-render the page).
function wireName(cb) { const i = document.getElementById('plnm'), b = document.getElementById('plsave'); if (!i || !b) return; const save = () => { store.set(NAME_K, i.value.trim().slice(0, 30)); b.textContent = 'Saved ✓'; cb && cb(); }; b.onclick = save; i.onkeydown = e => { if (e.key === 'Enter') save(); }; }

/* ---- placement history (latest result = current level) ---- */
// Results history, oldest first, max 10. Also folds in the current sff-place if it is missing from sff-place-hist
// (e.g. data saved before history existed).
function placeHist() { let h = store.get(HIST_K, []); if (!Array.isArray(h)) h = []; const p = store.get(PLACE_K, null); if (p && !h.some(x => x && x.at === p.at)) h = [...h, p].sort((a, b) => a.at - b.at); return h.slice(-10); }

/* ---- placement quiz ---- */
// #placement route: intro screen (explanation, optional name, last result) that starts runPlacement().
function placementPage() {
  const prev = store.get(PLACE_K, null);
  app.innerHTML = `<div class="wrap pl pla"><div class="crumbs">Home<span>›</span>Find your level</div><h1 class="lib-h1"><span class="or">Find</span> your level</h1>
    <div class="qw pl-card"><div class="hd">Level check<span class="ic"></span></div><div class="bd pl-intro">
      <p>A short Spanish check, about 10 minutes. It starts easy and gets harder, and it stops by itself when the questions become too difficult. If you do not know an answer, tap <b>I don't know</b>. Do not guess wildly: an honest result puts you at the right story.</p>
      ${nameBox()}
      ${prev ? `<p class="pl-last">Your last result: <b>${esc(prev.level)}</b> (${esc(new Date(prev.at).toLocaleDateString())}). <a href="#progress">See my progress</a></p>` : ''}
      <div class="qact"><button class="btn" id="plgo">Start the quiz</button></div></div></div></div>`;
  wireName(); document.getElementById('plgo').onclick = () => { const i = document.getElementById('plnm'); if (i && i.value.trim() !== myName()) store.set(NAME_K, i.value.trim().slice(0, 30)); runPlacement(); };
}
// The adaptive placement quiz. Bands are taken in order A1..C2; the quiz stops by itself (see endBand), then plResult() shows the outcome.
// Locals: order[band] = question list for that band; size[band] = number of bank items in the band; SEEN = persisted show counts;
// st = run state { bi band index, qi question index in band, n answered, correct/shown per band, miss = consecutive misses, stopped }.
function runPlacement() {
  // Build each band's question order: items with the same `passage` form one group (kept adjacent so a reading text is
  // followed by all its questions); groups are shuffled, then stably sorted by the average times-seen of the group so
  // retakes favour questions the learner has seen least.
  const order = {}, size = {}, SEEN = store.get(SEEN_K, {}) || {};
  PLV.forEach(b => { const items = PL.bank.filter(x => x.level === b), groups = [], by = new Map(); items.forEach(it => { if (it.passage) { if (!by.has(it.passage)) { by.set(it.passage, []); groups.push(by.get(it.passage)); } by.get(it.passage).push(it); } else groups.push([it]); }); const cnt = g => g.reduce((n, it) => n + (SEEN[it.id] || 0), 0) / g.length; order[b] = shuffleA(groups).sort((x, y) => cnt(x) - cnt(y)).flat(); size[b] = items.length; });
  const st = { bi: 0, qi: 0, n: 0, correct: {}, shown: {}, miss: 0, stopped: false }; PLV.forEach(b => { st.correct[b] = 0; st.shown[b] = 0; });
  // Close the current band. Band score = correct / max(shown, 60% of band size): the 60% floor stops a learner who only
  // answered a few easy items from "passing" a band. Score < 50% (or the last band) ends the quiz; otherwise go up a band.
  const endBand = () => { const b = PLV[st.bi], pct = st.correct[b] / Math.max(st.shown[b], Math.round(size[b] * .6)); st.miss = 0; st.qi = 0; if (pct < .5 || st.bi >= PLV.length - 1) { st.stopped = true; } else st.bi++; };
  // Record one answer (ok = correct; "I don't know" counts as wrong): bump the item's seen count, update the tallies,
  // then end the band after 3 misses in a row or when the band's questions run out; finally redraw.
  const answer = ok => { const b = PLV[st.bi]; const cit = order[b][st.qi]; if (cit && cit.id) { SEEN[cit.id] = (SEEN[cit.id] || 0) + 1; store.set(SEEN_K, SEEN); } st.shown[b]++; st.n++; if (ok) { st.correct[b]++; st.miss = 0; } else st.miss++; st.qi++;
    if (st.miss >= 3 || st.qi >= order[b].length) endBand(); draw(); };
  // Render the current question (or the result once stopped). `ring` shows the question number; `ql` the skill label.
  function draw() {
    if (st.stopped) return plResult(st, size);
    const b = PLV[st.bi], it = order[b][st.qi];
    app.innerHTML = `<div class="wrap pl pla"><div class="qw"><div class="hd">Level check<span class="ic"></span></div><div class="bd">
      <div class="ql">${esc((it.skill || '').toUpperCase())}${it.topic ? '' : ''}</div><div class="ring">${st.n + 1}</div>
      ${it.passage ? `<div class="pl-pass">${esc(it.passage)}</div>` : ''}
      <div class="qt">${esc(it.q)}</div>
      ${it.options.map((o, j) => `<label><input type="radio" name="q" data-j="${j}"> ${esc(o)}</label>`).join('')}
      <div class="pl-dk"><button class="rdtg" id="pldk">I don't know</button><button class="rdtg" id="plend">Finish and see my level</button></div>
      </div></div></div>`;
    // `picked` makes the first choice final. Arrow keys are blocked on the radios because the browser would otherwise
    // move the selection and fire change, registering an unintended answer. The 380 ms delay lets the selection show before
    // advancing; the timer callback bails out if the quiz ended or the question's button is no longer in the DOM
    // (the user left the page or the screen was redrawn), so a stale timer never answers a question that is gone.
    let picked = false; const dk = document.getElementById('pldk');
    radioArrows(app); // Arrow keys move focus only; picking an answer (Space or click) is what advances
    app.querySelectorAll('input').forEach(r => r.onchange = () => { if (picked) return; picked = true; const j = +r.dataset.j; setTimeout(() => { if (st.stopped || !document.body.contains(dk)) return; answer(j === it.answer); }, 380); });
    document.getElementById('pldk').onclick = () => { if (!picked) { picked = true; answer(false); } };
    // "Finish" before any answer returns to the intro; otherwise it stops the quiz and scores what was answered.
    document.getElementById('plend').onclick = () => { if (st.n === 0) { placementPage(); return; } st.stopped = true; draw(); };
    window.scrollTo(0, 0);
  }
  draw();
}
// Turn a finished run into { level, conf, key, pct }. pct[band] = correct / max(shown, 60% of band size), or null if the
// band was never shown. A band passes at >= 70%. Level = highest band in an unbroken run of passes from A1 (the loop stops
// at the first band that is not passed). conf: 'high' if there is no higher band, or it was not shown / scored < 50%;
// 'medium' if the next band scored 50-69% (borderline). If A1 itself is not passed: A1 at >= 50% is 'A1' with conf 'low',
// otherwise 'Below A1'. `key` selects the message in PMSG.
function plScore(st, size) {
  const pct = {}; PLV.forEach(b => pct[b] = st.shown[b] ? st.correct[b] / Math.max(st.shown[b], Math.round(size[b] * .6)) : null);
  let top = -1; for (let i = 0; i < PLV.length; i++) { if (pct[PLV[i]] !== null && pct[PLV[i]] >= .7) top = i; else break; }
  let level, conf, key;
  if (top < 0) { const a = pct.A1; if (a !== null && a >= .5) { level = 'A1'; conf = 'low'; key = 'A1low'; } else { level = 'Below A1'; conf = 'high'; key = 'none'; } }
  else { level = PLV[top]; const nx = PLV[top + 1], np = nx ? pct[nx] : null; conf = (!nx || np === null || np < .5) ? 'high' : 'medium'; key = level; }
  if (level === 'A2' && conf === 'low') key = 'A2low'; if (level === 'B1' && conf === 'low') key = 'B1low';
  return { level, conf, key, pct };
}
// Result screen. Saves the result once (st.saved guards re-renders) as sff-place and appended to sff-place-hist (last 10);
// rec.pct stores whole-number percents (null = band not shown). prevR = the result before this one, for the comparison line.
// Bar colours: >= 70 'hi', >= 50 'mid', else 'low' (same 70/50 thresholds as plScore).
function plResult(st, size) {
  const r = plScore(st, size), startId = START[r.level] || 'a1-01', startS = byId[startId];
  const rec = { level: r.level, conf: r.conf, at: Date.now(), pct: Object.fromEntries(PLV.map(b => [b, r.pct[b] === null ? null : Math.round(r.pct[b] * 100)])) };
  const old = placeHist(); if (!st.saved) { st.saved = true; store.set(PLACE_K, rec); store.set(HIST_K, [...old, rec].slice(-10)); }
  const prevR = old.length ? old[old.length - (st.saved && old[old.length - 1] && old[old.length - 1].at === rec.at ? 2 : 1)] : null;
  const nm = myName();
  app.innerHTML = `<div class="wrap pl pla"><div class="qw"><div class="hd">Your result<span class="ic"></span></div><div class="end qres"><div class="big">${r.level === 'Below A1' ? '🌱' : '✓'}</div>
    <h2 class="pl-lv">${nm ? esc(nm) + ', your' : 'Your'} level today: ${esc(r.level)}</h2>
    <p>${esc(PMSG[r.key])}</p>
    ${prevR ? `<p class="mute">Last time (${esc(new Date(prevR.at).toLocaleDateString())}): <b>${esc(prevR.level)}</b>. ${prevR.level === r.level ? 'Same level today.' : PLV.indexOf(r.level) > PLV.indexOf(prevR.level) ? 'Up a level.' : 'A short quiz is only a guide, and some days go differently. Your story work matters more.'}</p>` : ''}
    ${r.conf === 'medium' ? '<p class="mute">You scored well on the next level too. If this feels easy, move up after two or three stories.</p>' : ''}${r.conf === 'low' ? '<p class="mute">This is our best guess. Your story quiz scores will tell us quickly if you should move.</p>' : ''}
    <div class="qareas pl-bars">${PLV.map(b => { const p = rec.pct[b]; return `<div class="qar"><b>${b}</b><span class="qab"><i class="${p === null ? '' : p >= 70 ? 'hi' : p >= 50 ? 'mid' : 'low'}" style="width:${p || 0}%"></i></span><span class="qal">${p === null ? 'not shown' : p + '%'}</span></div>`; }).join('')}</div>
    <div class="qact">${startS ? `<a class="btn" href="#story-${startId}">Start: ${esc(startS.title)}</a>` : ''}<a class="btn ghost" href="#progress">My can-do goals</a><button class="btn ghost" id="plre">Retake</button></div>
    <p class="mute" style="font-size:.8rem;margin-top:14px">A short quiz is only a guide. You can start at any level.</p></div></div></div>`;
  document.getElementById('plre').onclick = placementPage; window.scrollTo(0, 0);
}

/* ---- can-do progress ---- */
// Goals the learner has ticked by hand: { statementId: 1 }.
const cdState = () => store.get(CANDO_K, {});
// Has the learner "earned" a can-do statement automatically? Returns { ok, frac (0-1 progress), read, need, ids }.
// Needs: read/listened to min(3, number of evidence stories) of the evidence stories (PROG 'listen' flag for listening goals,
// 'read' otherwise); if evidence.quiz is set, an average quiz score >= minScorePct (default 70) over the attempted stories
// (score / number of questions; grammar goals use sff-gscores and the DATA.gq question count, fallback 4; others use the
// story quiz length, fallback 5); if evidence.speak, at least one evidence story marked 'spoke'.
// Writing goals ignore quiz/speak: they need the reading count plus a saved draft (>= 20 chars) or a board post.
function evidenceOf(stt) {
  const e = stt.evidence || {}, ids = e.stories || [], need = Math.min(3, ids.length) || 1;
  const mk = stt.skill === 'listening' ? 'listen' : 'read', read = ids.filter(id => PROG.get(id)[mk]).length;
  const gsc = store.get('sff-gscores', {}), isG = stt.skill === 'grammar', sc = isG ? gsc : scores(), att = ids.filter(id => sc[id] != null);
  const den = id => isG ? (((DATA.gq || {})[id] || []).filter(q => !q.x).length || 4) : ((byId[id] && byId[id].quiz.length) || 5);
  const avg = att.length ? att.reduce((a, id) => a + sc[id] / den(id), 0) / att.length : null;
  let parts = [Math.min(1, read / need)], ok = read >= need;
  if (e.quiz) { const mn = (e.minScorePct || 70) / 100; parts.push(avg === null ? 0 : Math.min(1, avg / mn)); ok = ok && avg !== null && avg >= mn; }
  if (e.speak) { const sp = ids.some(id => PROG.get(id).spoke); parts.push(sp ? 1 : 0); ok = ok && sp; }
  if (stt.skill === 'writing') { const w = ids.some(id => String(store.get('sff-draft-' + id, '')).length >= 20 || (store.get('sff-posts-' + id, []) || []).length); parts = [Math.min(1, read / need), w ? 1 : 0]; ok = read >= need && w; }
  return { ok, frac: parts.reduce((a, b) => a + b, 0) / parts.length, read, need, ids };
}
// Update the sync status text in place (element id plsync) without re-rendering the page.
function progressStatus() { const el = document.getElementById('plsync'); if (el) el.textContent = SYNC.status; }
// Is a level panel open? Uses the saved sff-pl-open choice if there is one for that level; otherwise only the learner's
// current level (A1 when no placement result) starts open.
const plOpen = (lv, cur) => { const m = store.get('sff-pl-open', null); if (m && lv in m) return !!m[lv]; return lv === (cur || 'A1'); };
// #progress route: starting level, next story, sync status, level history, name box, and one collapsible panel per CEFR level.
// Per level: stories read, quiz average over attempted stories, and a "checkpoint" reached when read >= passStories,
// average >= passComp %, and at least min(5, passStories) stories were attempted. A can-do row counts as done when earned
// (evidenceOf) or self-ticked. `next` = first unread story, searching the learner's placed level first, then the rest in order.
  function progressPage() {
  const place = store.get(PLACE_K, null), man = cdState(), nm = myName();
  const levels = (PL.cando.levels || []).map(L => {
    const stories = S.filter(x => x.level === L.level), read = stories.filter(x => PROG.get(x.id).read).length, sc = scores();
    const att = stories.filter(x => sc[x.id] != null), avg = att.length ? att.reduce((a, x) => a + sc[x.id] / (x.quiz.length || 5), 0) / att.length : null;
    const cp = L.checkpoint || { passStories: 7, passComp: 70 }, reached = read >= cp.passStories && avg !== null && avg * 100 >= cp.passComp && att.length >= Math.min(5, cp.passStories);
    const rows = L.statements.map(s => { const ev = evidenceOf(s), self = !!man[s.id]; return { s, ev, self, done: ev.ok || self }; });
    return { L, read, avg, cp, reached, rows, got: rows.filter(r => r.done).length };
  });
  const cur = place && place.level && PLV.includes(place.level) ? place.level : null;
  const next = (() => { const order = cur ? [cur, ...PLV.filter(x => x !== cur)] : PLV; for (const lv of order) { const x = S.find(s => s.level === lv && !PROG.get(s.id).read); if (x) return x; } return null; })();
  app.innerHTML = `<div class="wrap pl"><div class="crumbs">Home<span>›</span>My level</div><h1 class="lib-h1"><span class="or">${nm ? 'Hola, ' + esc(nm) : 'My'}</span> ${nm ? '' : 'level'}</h1>
    <p class="lib-sub">Your can-do goals follow the CEFR levels. They tick themselves as you read, take the quizzes, speak and write, and you can also tick one yourself when you know you can do it.</p>
    <p class="lib-sub pl-note"><b>Quizzes are practice. The level check sets your level.</b> Take the level check again any time to see how far you have come.</p>
    <div class="pl-top">
      <div class="pl-box pla"><small>STARTING LEVEL</small><b>${cur ? esc(cur) + ` <em>${esc(place.conf || '')} confidence</em>` : 'Not set yet'}</b><a class="btn sm" href="#placement">${place ? 'Retake the level check' : 'Find your level'}</a></div>
      ${next ? `<div class="pl-box"><small>NEXT STORY</small><b>${esc(next.title)}</b><a class="btn sm" href="#story-${next.id}">Continue (${next.level})</a></div>` : ''}
      <div class="pl-box"><small>YOUR PROGRESS</small><b id="plsync">${esc(SYNC.status)}</b><span class="mute" style="font-size:.78rem">${SYNC.on ? 'Follows you to any device where you are signed in to Claude.' : 'Stays in this browser. Signed-in Claude viewers also get sync.'}</span></div>
    </div>
    ${(() => { const h = placeHist(); return h.length > 1 ? `<div class="pl-hist"><small>YOUR LEVEL OVER TIME</small><div class="plh-row">${h.map((x, i) => `<span class="plh ${i === h.length - 1 ? 'now' : ''}"><b>${esc(x.level)}</b><em>${esc(new Date(x.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}</em></span>`).join('<i class="plh-a">›</i>')}</div></div>` : ''; })()}
    ${nameBox()}
    <div class="pl-tools"><button type="button" class="linkb" id="pl-open-all">Expand all</button> · <button type="button" class="linkb" id="pl-close-all">Collapse all</button></div>
    ${levels.map(v => `<details class="pl-lvl ${cur === v.L.level ? 'cur' : ''}" data-lv="${v.L.level}" ${plOpen(v.L.level, cur) ? 'open' : ''}><summary><div class="pl-lh"><i class="lv${v.L.level}">${v.L.level}</i><div><b>${M[v.L.level].name}</b><small>${esc(v.L.levelGoal)}</small></div></div><span class="pl-sc ${v.reached ? 'ok' : ''}">${v.reached ? '✓ ' : ''}${v.got}/${v.rows.length}<em>goals</em></span></summary>
      <div class="pl-cp"><span class="pgs"><i style="width:${Math.min(100, Math.round(v.read / v.cp.passStories * 100))}%"></i><span>${v.read} of ${v.cp.passStories} stories read${v.avg !== null ? ' · quiz average ' + Math.round(v.avg * 100) + '%' : ''}</span></span>
        <span class="pl-flag ${v.reached ? 'on' : ''}">${v.reached ? '✓ Level checkpoint reached' : `Checkpoint: read ${v.cp.passStories} stories with a ${v.cp.passComp}% quiz average`}</span></div>
      <ul class="pl-cd">${v.rows.map(r => `<li class="${r.done ? 'done' : ''}"><label><input type="checkbox" data-cd="${r.s.id}" ${r.self ? 'checked' : ''}><span class="pl-t">${esc(r.s.text)}</span></label><span class="pl-m"><span class="pl-sk">${esc(r.s.skill)}</span>${r.ev.ok ? '<em class="ok">earned</em>' : r.self ? '<em class="ok">self-checked</em>' : `<span class="pgs mini"><i style="width:${Math.round(r.ev.frac * 100)}%"></i></span>`}</span></li>`).join('')}</ul>
      <div class="pl-sum">${v.got} of ${v.rows.length} can-do goals reached${v.reached && PLV[PLV.indexOf(v.L.level) + 1] ? ` · <a href="#stories-${PLV[PLV.indexOf(v.L.level) + 1].toLowerCase()}">Try ${PLV[PLV.indexOf(v.L.level) + 1]} stories</a>` : ''}</div></details>`).join('')}
    </div>`;
  wireName(progressPage);
  // Remember open/closed per level. Listens for clicks on the <summary> (a real user action) rather than the details
  // 'toggle' event, which also fires for programmatic changes and the initial default-open, which would then stick.
  // The setTimeout(0) lets the browser flip d.open first so the new state is read.
  app.querySelectorAll('details.pl-lvl').forEach(d => { const sm = d.querySelector('summary'); if (sm) sm.addEventListener('click', () => setTimeout(() => { const m = store.get('sff-pl-open', {}); m[d.dataset.lv] = d.open ? 1 : 0; store.set('sff-pl-open', m); }, 0)); }); // user clicks only, so the default-open level does not become sticky
  // Expand all / Collapse all: set every panel and persist the choice for each level.
  const setAll = o => { const m = store.get('sff-pl-open', {}); app.querySelectorAll('details.pl-lvl').forEach(d => { d.open = o; m[d.dataset.lv] = o ? 1 : 0; }); store.set('sff-pl-open', m); };
  const oa = app.querySelector('#pl-open-all'), ca = app.querySelector('#pl-close-all'); if (oa) oa.onclick = () => setAll(true); if (ca) ca.onclick = () => setAll(false);
  // Self-tick a can-do goal: store/remove it in sff-cando, then re-render so counts update.
  app.querySelectorAll('[data-cd]').forEach(c => c.onchange = () => { const m = cdState(); if (c.checked) m[c.dataset.cd] = 1; else delete m[c.dataset.cd]; store.set(CANDO_K, m); progressPage(); });
}
