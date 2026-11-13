/* ===== Speak: read-aloud scoring, avatar role-play, optional AI chat. Injected inside the app IIFE (uses esc, ic, store, hasTTS, speakPlain). =====
   Public API: const SP = { mount(root, story), stopListen(), listen(cb, onState, opt), align(target, heard) }.
     mount(root, s) renders the Speaking tab for story s into the element root and returns { stop } (stop = halt
       recognition, speech and the talking animation); called by app.js when the Speaking tab opens.
     stopListen() is also called by app.js when leaving a page, and by warmup.js; listen() is also used by warmup.js
       for "say it" and tutor-chat voice input; align() is used by warmup.js to score a spoken word (pct >= .5 passes).
   Modes (tabs, order per level in LVL): read aloud (word-by-word scoring), speak freely (retell, optional AI feedback),
     scripted role-play (tap or say a reply), open role-play chat (needs AI; tab hidden until AI.onReady fires).
   Depends on shared-scope names: esc, ic, store (not used directly here), hasTTS, cancelTTS, speakPlain(text, done, rate,
     voiceObj), voices (browser voice list), quoteEs, quoteEn, Art.scene, PROG (PROG.mark(id,'spoke')), teardown, AI,
     and DATA fields: DATA.partners, DATA.scenes, DATA.dialogues, DATA.goals. window.SpeechRecognition is optional;
     without it the read/free/role modes still work for listening and tapping.
   DATA shapes:
     DATA.partners[storyId] = { name, g: 'f'|'m', role }                 conversation partner for the story
     DATA.dialogues[storyId] = { steps: [ { say, en, r: [[spanishReply, english, nextStepIndex], ...], end?: true } ] }
        (same shape as the built-in DIALOGUES below; nextStepIndex points into steps; a step with end:true has no replies)
     DATA.goals[storyId] = { goal, goalEs, opener, openerEn, scene }      open role-play goal, first line, scene description
   localStorage: 'sff-spk-en' = '1' | '0' (show English translations in the Speaking tab; default on for A1/A2 only).
   Also records PROG 'spoke' for a story (stored by app.js in 'sff-prog') when read-aloud scores >= 90% or the chat goal is
   completed; progress.js uses that flag as can-do evidence. ===== */
const SP = (() => {
  // SpeechRecognition constructor (prefixed in Chrome/Safari), undefined if the browser has none.
  const SRc = window.SpeechRecognition || window.webkitSpeechRecognition;
  // Normalize text for comparing what was said with what was shown: digits to Spanish words, lower case, strip accents
  // (NFD then remove combining marks, so "está" == "esta", "ñ" -> "n"), turn anything not a-z/0-9/space into a space
  // (punctuation, ¿¡, dashes), collapse whitespace.
  const norm = t => digits(String(t)).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  /* digits -> Spanish words (recognizers often write "7" for "siete") */
  const U = ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciseis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidos','veintitres','veinticuatro','veinticinco','veintiseis','veintisiete','veintiocho','veintinueve'];
  const TN = ['','','','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'], HN = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
  // Integer to unaccented Spanish words: 0-29 from U, tens + ' y ' + unit up to 99, 'cien'/'ciento ...' for hundreds,
  // 'mil' for 1000-1999 and '<n> mil ...' up to 9999. Numbers of 10000 and above stay as digits.
  const n2s = n => n < 30 ? U[n] : n < 100 ? TN[Math.floor(n / 10)] + (n % 10 ? ' y ' + U[n % 10] : '') : n === 100 ? 'cien' : n < 1000 ? HN[Math.floor(n / 100)] + (n % 100 ? ' ' + n2s(n % 100) : '') : n === 1000 ? 'mil' : n < 10000 ? (n < 2000 ? 'mil' : n2s(Math.floor(n / 1000)) + ' mil') + (n % 1000 ? ' ' + n2s(n % 1000) : '') : String(n);
  // Replace digits with words in a string. Clock times H:MM become "H MM" in words (minutes dropped when 00); the
  // first regex handles times so the minutes are not read as a separate number, the second replaces remaining digit runs.
  const digits = t => String(t).replace(/(\d+):(\d{2})/g, (m, h, mi) => n2s(+h) + (+mi ? ' ' + n2s(+mi) : '')).replace(/\d+/g, m => n2s(+m));
  // Display form of a story line: typographic Spanish quotes, HTML tags removed, whitespace collapsed (what the learner sees).
  const disp = t => quoteEs(String(t)).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  // Speakable form of a line (used for text-to-speech and for scoring): tags removed, dashes/guillemets/quotes become spaces.
  const clean = t => String(t).replace(/<[^>]+>/g, '').replace(/[—«»"“”]/g, ' ').replace(/\s+/g, ' ').trim();
  // Levenshtein edit distance between two strings (classic DP table).
  const lev = (a, b) => { const m = a.length, n = b.length, d = []; for (let i = 0; i <= m; i++) { d[i] = [i]; } for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
  // Word match used everywhere: identical, or both longer than 4 letters and one edit apart. The fuzziness forgives small
  // recognizer slips (a dropped plural s, one wrong letter) on longer words; short words must match exactly because one
  // edit would turn them into different words (e.g. casa/cosa, tu/tú).
  const eq = (a, b) => a === b || (a.length > 4 && b.length > 4 && lev(a, b) <= 1);
  /* align target words to heard words (LCS); returns array of booleans per target word */
  // LCS (longest common subsequence) over normalized words using eq(): L[i][j] = best match count for the first i target and
  // first j heard words, then a backtrace marks which target words were matched. Order matters, but extra or missing heard
  // words are tolerated. On ties the backtrace skips a target word first. ok is per normalized token, pct = share heard.
  // Used for matching a spoken reply to the role-play choices (a reply counts at pct >= .6).
  function align(target, heard) {
    const T = norm(target).split(' ').filter(Boolean), H = norm(heard).split(' ').filter(Boolean);
    const L = Array.from({ length: T.length + 1 }, () => new Array(H.length + 1).fill(0));
    for (let i = 1; i <= T.length; i++) for (let j = 1; j <= H.length; j++) L[i][j] = eq(T[i - 1], H[j - 1]) ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
    const ok = new Array(T.length).fill(false); let i = T.length, j = H.length;
    while (i > 0 && j > 0) { if (eq(T[i - 1], H[j - 1])) { ok[i - 1] = true; i--; j--; } else if (L[i - 1][j] >= L[i][j - 1]) i--; else j--; }
    return { ok, pct: T.length ? ok.filter(Boolean).length / T.length : 0 };
  }
  /* like align(), but per DISPLAY word (what the learner sees). A word that norm() splits into several tokens (10:30, abre-latas, a.m.) counts once;
     a word with no speakable token (a lone dash) is null = neutral; ok[k] is true when at least half of word k's tokens were heard. */
  // Same LCS as align(), but the tokens are tagged with the display word they came from (own[i] = word index). Scoring per
  // display word keeps the on-screen colouring one-to-one with what the learner sees, instead of per normalized token.
  // Tokenless words (cnt = 0) return null so punctuation-only "words" are neither right nor wrong and not counted in pct.
  function alignWords(words, heard) {
    const T = [], own = []; words.forEach((w, k) => norm(w).split(' ').filter(Boolean).forEach(t => { T.push(t); own.push(k); }));
    const H = norm(heard).split(' ').filter(Boolean);
    const L = Array.from({ length: T.length + 1 }, () => new Array(H.length + 1).fill(0));
    for (let i = 1; i <= T.length; i++) for (let j = 1; j <= H.length; j++) L[i][j] = eq(T[i - 1], H[j - 1]) ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
    const hit = new Array(words.length).fill(0), cnt = new Array(words.length).fill(0); T.forEach((t, i) => cnt[own[i]]++);
    let i = T.length, j = H.length;
    while (i > 0 && j > 0) { if (eq(T[i - 1], H[j - 1])) { hit[own[i - 1]]++; i--; j--; } else if (L[i - 1][j] >= L[i][j - 1]) i--; else j--; }
    const ok = words.map((_, k) => cnt[k] === 0 ? null : hit[k] * 2 >= cnt[k]), counted = ok.filter(v => v !== null);
    return { ok, pct: counted.length ? counted.filter(Boolean).length / counted.length : 0 };
  }
  /* recognition. one-shot by default; opt.continuous = keep listening until finishListen(). cb({text, alts}) or cb({error}) */
  // live = the active SpeechRecognition object (only one at a time), or null.
  let live = null;
  // Abort the current recognizer without firing its callbacks. Handlers are detached BEFORE abort() because abort() makes
  // the browser deliver a late 'aborted' error and an onend; those would call the old session's callback and could reset
  // UI that now belongs to a newer session. Since onend is detached, _off() (set in listen) is called by hand to tell the
  // caller the state is 'off'.
  function stopListen() { if (live) { const r = live; live = null; r.onresult = r.onerror = r.onend = r.onstart = null; try { r.abort(); } catch (e) {} if (r._off) r._off(); } } // detach first: a late 'aborted' error or onend from the old recognizer must not touch the new session's UI
  // Ask the recognizer to stop listening but still deliver what it heard (stop, not abort): the Stop button in continuous mode.
  function finishListen() { if (live) { try { live.stop(); } catch (e) {} } }
  // Start one recognition session (Spanish, es-ES, up to 5 alternative transcripts). Replaces any session in progress and
  // silences text-to-speech so the app does not hear itself. cb gets exactly one call: { text, alts } (alts = alternative
  // transcripts, best first) or { error } (SpeechRecognition error code, or 'no-speech' / 'start-failed').
  // onState('on'|'off') reports mic state; opt.onInterim(textSoFar) receives live partial text.
  // `got` = something was heard or an error was reported; `done` = cb already called, so onend cannot call it twice.
  // One-shot mode answers on the first final result; continuous mode collects results and answers on end (see finishListen).
  function listen(cb, onState, opt) {
    opt = opt || {}; stopListen(); if (hasTTS) cancelTTS();
    const r = new SRc(); live = r; r._off = () => { try { onState && onState('off'); } catch (e) {} }; r.lang = 'es-ES'; r.maxAlternatives = 5; r.continuous = !!opt.continuous; r.interimResults = !!opt.onInterim; let got = false, done = false; const fin = [];
    r.onstart = () => onState && onState('on');
    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const res = e.results[i]; if (res.isFinal) { got = true; fin.push([...res].map(a => a.transcript)); if (!opt.continuous) { done = true; cb({ alts: fin[0], text: fin[0][0] }); } } else interim += res[0].transcript; }
      if (opt.onInterim) opt.onInterim(fin.map(f => f[0]).join(' ') + ' ' + interim);
    };
    r.onerror = e => { if (done) return; done = true; got = true; cb({ error: e.error }); };
    r.onend = () => { if (live === r) live = null; onState && onState('off'); if (done) return; done = true; if (opt.continuous && fin.length) { const joined = fin.map(f => f[0]).join(' '); cb({ alts: [joined], text: joined }); } else if (!got) cb({ error: 'no-speech' }); };
    try { r.start(); } catch (e) { done = true; if (live === r) live = null; r._off(); cb({ error: 'start-failed' }); }
  }
  // User-facing text for a recognition error code; 'aborted' gives '' because we cause it ourselves.
  const errMsg = e => e === 'not-allowed' || e === 'service-not-allowed' ? 'The microphone is blocked here. Allow it in your browser (lock icon in the address bar) and in your system privacy settings. You can still listen and tap replies.' : e === 'no-speech' ? 'I did not hear anything. Tap the mic and try again.' : e === 'network' ? 'Speech recognition needs an internet connection.' : e === 'audio-capture' ? 'No microphone found.' : e === 'aborted' ? '' : 'Speech recognition did not start (' + e + ').';

  /* ---------- avatar ---------- */
  // SVG avatar of one standing person drawn by Art.scene from a character c ({ ink, skinK, hairK, outfit }).
  const avatar = (c) => `<div class="av">${Art.scene({ vb: [55, 24, 90, 90], ink: c.ink, items: [{ t: 'person', x: 100, y: 200, s: 1, skin: c.skinK, hair: c.hairK, outfit: c.outfit, pose: 'stand' }] }, {})}</div>`;
  // Default look and name per partner gender: tomas = male (Roberto), sofia = female (Amanda). ink = two-colour palette,
  // skinK/hairK/outfit = keys understood by Art.scene. Used when a story has no scene or no named partner.
  const CHARS = {
    tomas: { name: 'Roberto', ink: ['#17356e', '#f0675a'], skinK: 'd', hairK: 'curly', outfit: 'apron' },
    sofia: { name: 'Amanda', ink: ['#6b1424', '#f2b705'], skinK: 'b', hairK: 'long', outfit: 'tee' },
  };
  // Fallback partner gender by story id ('f'/'m'), for stories (A1-B2) missing from DATA.partners.
  const GEN = { 'a1-01':'f','a1-02':'f','a1-03':'f','a1-04':'f','a1-05':'f','a1-06':'f','a1-07':'f','a1-08':'f','a1-09':'f','a1-10':'m','a2-01':'f','a2-02':'f','a2-03':'m','a2-04':'m','a2-05':'f','a2-06':'f','a2-07':'m','a2-08':'m','a2-09':'f','a2-10':'f','b1-01':'f','b1-02':'f','b1-03':'f','b1-04':'m','b1-05':'m','b1-06':'f','b1-07':'m','b1-08':'m','b1-09':'f','b1-10':'f','b2-01':'m','b2-02':'f','b2-03':'f','b2-04':'f','b2-05':'f','b2-06':'f','b2-07':'f','b2-08':'m','b2-09':'m','b2-10':'f' };
  // Heuristic for whether a scene person looks female: a dress, or one of these hair styles. Used to pick which person in
  // the story's scene the partner is drawn from.
  const FEM_HAIR = ['long', 'bun', 'ponytail', 'bob', 'braids', 'hijab', 'turban'];
  const isFem = p => p.outfit === 'dress' || FEM_HAIR.includes(p.hair);
  // Build the conversation partner for story st: { g, name, ink, skinK, hairK, outfit }.
  // Gender g comes from DATA.partners, else GEN, else 'f'; name from DATA.partners if present. If the story has a scene,
  // the look is copied from the first scene person whose isFem matches g (else from the first person, skin only);
  // otherwise the CHARS default is used.
  const charFor = (st) => { const pt = (DATA.partners || {})[st.id], g = (pt && pt.g) || GEN[st.id] || 'f', base0 = g === 'm' ? CHARS.tomas : CHARS.sofia, base = pt ? { ...base0, name: pt.name } : base0, sc = DATA.scenes[st.id];
    if (!sc) return { ...base, g }; const ps = sc.items.filter(i => i.t === 'person'), m = ps.find(p => isFem(p) === (g === 'f'));
    const ink = sc.ink || base.ink;
    return m ? { g, name: base.name, ink, skinK: m.skin || base.skinK, hairK: m.hair || base.hairK, outfit: m.outfit || base.outfit } : { g, name: base.name, ink, skinK: (ps[0] && ps[0].skin) || base.skinK, hairK: base.hairK, outfit: base.outfit }; };
  // Browser voices do not expose gender, so FV / MV guess it from well-known voice names (female / male lists, case-insensitive).
  const FV = /m[oó]nica|paulina|marisol|sabina|dalia|elvira|helena|luc[ií]a|elena|\bfemale\b|mujer|sof[ií]a|camila|lupe|esperanza|laura|mar[ií]a|salom[eé]|catalina|valentina|soledad|francisca|ang[eé]lica|ximena|valeria|paloma|alba\b|estrella|noelia|paola|marina|renata|lola|elisa|abril|carmen|flo\b|sandy|shelley|grandma|google espa|siri.*(female|voice 1)|samantha|female/i,
    MV = /jorge|diego|juan|carlos|pablo|[aá]lvaro|jaime|ra[uú]l|enrique|\bmale\b|hombre|tom[aá]s|alonso|gonzalo|arnau|andr[eé]s|eddy|reed|neil|ricardo|marcelo|alejandro|luis|mauricio|nicol[aá]s|rodrigo|lorenzo|grandpa|rocko|nacho|pedro|santiago|manuel|miguel|sergio|emilio|fernando|male/i;
  // voiceFallback is set by voiceFor when no voice of the wanted gender exists (drives the on-screen note).
  let voiceFallback = false;
  // Choose a TTS voice for gender g, as { v: voice, pitch? } for speakPlain. Order: a voice matching g and not the other
  // gender; else a voice with no known gender, pitch-shifted (lower for 'm', higher for 'f'); else any voice not of the
  // other gender, or the first voice; pitch is shifted in both fallback cases.
  const voiceFor = g => {
    const vs = voices || [], mine = g === 'm' ? MV : FV, other = g === 'm' ? FV : MV; voiceFallback = false;
    const hit = vs.find(v => mine.test(v.name) && !other.test(v.name)); if (hit) return { v: hit };
    const neutral = vs.find(v => !MV.test(v.name) && !FV.test(v.name)); // unknown gender: better than a voice of the other gender
    voiceFallback = true;
    if (neutral) return { v: neutral, pitch: g === 'm' ? .8 : 1.25 };
    const any = vs.find(v => !other.test(v.name)) || vs[0] || null;
    return { v: any, pitch: g === 'm' ? .75 : 1.3 };
  };
  // CURG = gender of the current partner (set in mount), so talk() picks the matching voice.
  let CURG = 'f';
  // Leftover handle for a mouth-animation timer: only ever cleared in this file, never assigned an interval.
  let mouthT = null;
  // Speak text in the partner's voice and show the 'talking' CSS state on the avatar (.av inside root) until it ends;
  // calls done when finished (immediately if speech synthesis is unavailable). ¿ and ¡ are removed for the voice.
  function talk(root, text, done) {
    const m = root.querySelector('.av'); clearInterval(mouthT);
    if (!hasTTS) { done && done(); return; }
    if (m) m.classList.add('talking');
    speakPlain(clean(text).replace(/[¿¡]/g, ''), () => { if (m) m.classList.remove('talking'); done && done(); }, null, voiceFor(CURG));
  }

  /* ---------- scripted dialogues ---------- */
  // Built-in scripted dialogues keyed by story id; DATA.dialogues[id] takes priority (same shape, see header).
  // Each step: say (Spanish line), en (translation), r = replies [spanish, english, index of the next step], end: true
  // on the last step. (`who` is informational only and is not read by the code.)
  const DIALOGUES = {
    'a1-01': { who: 'tomas', steps: [
      { say: '¡Buenos días! Soy Roberto. Hoy yo preparo el desayuno. ¿Tienes hambre?', en: 'Good morning! I’m Roberto. Today I’m making breakfast. Are you hungry?', r: [['Sí, tengo hambre.', 'Yes, I’m hungry.', 1], ['No, no tengo hambre.', 'No, I’m not hungry.', 2]] },
      { say: '¡Muy bien! Hay café, huevos, pan y leche. ¿Qué quieres?', en: 'Great! There is coffee, eggs, bread and milk. What do you want?', r: [['Quiero café, por favor.', 'I want coffee, please.', 3], ['Quiero huevos y pan.', 'I want eggs and bread.', 3], ['Quiero leche.', 'I want milk.', 3]] },
      { say: '¿No tienes hambre? Pero hay un olor muy bueno. ¿Quieres un café?', en: 'You’re not hungry? But there is a very nice smell. Do you want a coffee?', r: [['Sí, quiero un café.', 'Yes, I want a coffee.', 3], ['No, gracias.', 'No, thank you.', 4]] },
      { say: '¡Perfecto! Aquí tienes. El desayuno está en la mesa. ¿Está rico?', en: 'Perfect! Here you go. Breakfast is on the table. Is it tasty?', r: [['Sí, está muy rico.', 'Yes, it’s very tasty.', 4], ['Gracias, Roberto.', 'Thank you, Roberto.', 4]] },
      { say: '¡Gracias a ti! Mamá está cansada, pero ahora sonríe. ¡Buen día!', en: 'Thanks to you! Mom is tired, but now she’s smiling. Have a good day!', end: true },
    ] },
  };
  // Last-resort small-talk dialogue for stories with no scripted dialogue; N = partner name.
  const genericFor = (N) => ({ who: 'x', steps: [
    { say: `¡Hola! Me llamo ${N}. ¿Cómo estás?`, en: `Hi! My name is ${N}. How are you?`, r: [['Estoy bien, gracias.', 'I’m fine, thanks.', 1], ['Estoy cansado.', 'I’m tired.', 1], ['Estoy muy contento.', 'I’m very happy.', 1]] },
    { say: 'Me gusta leer cuentos en español. ¿Y a ti?', en: 'I like reading stories in Spanish. And you?', r: [['Sí, me gusta mucho.', 'Yes, I like it a lot.', 2], ['Me gusta un poco.', 'I like it a little.', 2]] },
    { say: '¿Qué hay en la historia de hoy?', en: 'What is in today’s story?', r: [['Hay una familia.', 'There is a family.', 3], ['Hay mucha comida.', 'There is a lot of food.', 3], ['No sé. Voy a leer.', 'I don’t know. I’m going to read.', 3]] },
    { say: '¡Muy bien! Hablas muy bien español. ¡Hasta luego!', en: 'Very good! You speak Spanish very well. See you later!', end: true },
  ] });

  /* ---------- mounting ---------- */
  // Per-level setup. n = story lines per read-aloud passage (A1 reads one line at a time); order = tab order, the first
  // tab opens by default. (`tr` is not read anywhere in this file.)
  const LVL = {
    A1: { n: 1, tr: true, order: ['read', 'role', 'chat'] },
    A2: { n: 3, tr: true, order: ['read', 'free', 'role', 'chat'] },
    B1: { n: 4, tr: false, order: ['free', 'read', 'role', 'chat'] },
    B2: { n: 5, tr: false, order: ['free', 'role', 'chat', 'read'] },
    C1: { n: 6, tr: false, order: ['free', 'role', 'chat', 'read'] },
    C2: { n: 6, tr: false, order: ['free', 'role', 'chat', 'read'] },
  };
  // Tab label per mode: [icon name for ic(), text].
  const MODE = { read: ['volume', 'Read aloud'], free: ['mic', 'Speak freely'], role: ['cards', 'Role-play'], chat: ['pencil', 'Open role-play'] };
  // Retell prompt for "Speak freely" by level (A1 has none and uses the A2 text).
  const FREE_PROMPT = { A2: 'Tell what happened in the story in 2–3 simple sentences.', B1: 'Retell the story in your own words. Aim for 30–60 seconds.', C1: 'Retell the story and explain what it shows about its characters and setting. Aim for about a minute and a half.', C2: 'Retell the story, then give your reading of what it implies. Aim for two minutes.', B2: 'Summarize the story, then say what you think about it. Aim for about a minute.' };
  // Render the Speaking tab for story s into root and return { stop }. PC = the partner character, L = this level's config.
  // The mode functions read/free/role/chat below each draw into #spk-body and are looked up by name from the tab buttons.
  function mount(root, s) { const PC = charFor(s); CURG = PC.g;
    const hasSR = !!SRc, L = LVL[s.level] || LVL.A1;
    root.innerHTML = `
      <div class="spk-modes" role="tablist">${L.order.map((m, i) => `<button class="${i ? '' : 'on'}" data-m="${m}" role="tab" aria-selected="${i ? 'false' : 'true'}" ${m === 'chat' ? 'hidden' : ''}>${ic(MODE[m][0], 16)} ${MODE[m][1]}</button>`).join('')}</div>
      <div class="spk-entr"><button type="button" class="spk-entog" id="spk-entog" aria-pressed="true">${ic('book',14)} <span>English: On</span></button></div>
      <p class="spk-note mute" id="spk-note"></p>
      <div id="spk-body"></div>`;
    const body = root.querySelector('#spk-body'), note = root.querySelector('#spk-note');
    // Status note under the tabs: warns when no voice of the partner's gender exists (voiceFor sets voiceFallback), and
    // says whether voice recognition is supported.
    const setNote = () => { voiceFor(CURG);
    note.textContent = (voiceFallback ? 'Note: this device has no ' + (CURG === 'm' ? 'male' : 'female') + ' Spanish voice, so the voice may sound slightly different. Install one in your system settings for a more natural voice. ' : '') + (hasSR ? 'Tip: use headphones, speak clearly, and allow the microphone when your browser asks.' : 'Your browser does not support voice recognition (try Chrome, Edge or Safari). You can still listen and tap replies.'); };
    // Browsers load their voice list asynchronously, so re-check the note a few times (skipped once root has left the page).
    setNote(); [500, 1300, 3100].forEach(t => setTimeout(() => { if (root.isConnected) setNote(); }, t));
    // EN = show English translations. Saved choice in 'sff-spk-en' ('1'/'0'); if none, default on for A1/A2 and off above.
    let EN = true; try { const v = localStorage.getItem('sff-spk-en'); EN = v == null ? (s.level === 'A1' || s.level === 'A2') : v === '1'; } catch (e) {}
    const entog = root.querySelector('#spk-entog');
    // Apply the English on/off state to the toggle, translation blocks (.rden) and "Hide/Show translation" buttons.
    // keep = true applies without saving (used for the initial render so the default is not stored as a choice).
    const setEN = (v, keep) => { EN = !!v; if (!keep) { try { localStorage.setItem('sff-spk-en', EN ? '1' : '0'); } catch (e) {} } root.classList.toggle('spk-noen', !EN); entog.setAttribute('aria-pressed', EN); entog.querySelector('span').textContent = 'English: ' + (EN ? 'On' : 'Off'); root.querySelectorAll('.rden').forEach(e => e.hidden = !EN); root.querySelectorAll('[data-tg]').forEach(b => b.textContent = (EN ? 'Hide' : 'Show') + ' translation'); };
    entog.onclick = () => setEN(!EN); setEN(EN, true);
    // stopAll: stop recognition, speech and any avatar animation; run on every tab switch and by the returned { stop }.
    // Tab click: stop, mark the tab, then call the mode function (read/free/role/chat) named by data-m.
    let mode = L.order[0]; const stopAll = () => { stopListen(); if (hasTTS) cancelTTS(); clearInterval(mouthT); };
    const modes = root.querySelectorAll('.spk-modes button');
    modes.forEach(b => b.onclick = () => { stopAll(); modes.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); }); b.classList.add('on'); b.setAttribute('aria-selected', 'true'); mode = b.dataset.m; ({ read, free, role, chat })[mode](); });
    /* AI available? */
    teardown.push(AI.onReady(() => { const cb = root.querySelector('[data-m=chat]'); if (cb) cb.hidden = false; const fa = root.querySelector('#fr-ai'); if (fa) fa.hidden = false; }));

    /* ---- read aloud (line by line at A1, longer passages above) ---- */
    // Split the story into passages of L.n lines. A1 (n = 1) is one-shot recognition; longer passages use continuous
    // recognition with a Stop button (multi). Each draw() shows one passage with word-level feedback.
    function read() {
      const chunks = []; for (let i = 0; i < s.lines.length; i += L.n) chunks.push(s.lines.slice(i, i + L.n));
      const multi = L.n > 1; let ri = 0;
      const draw = () => {
        stopListen(); if (hasTTS) cancelTTS();
        if (ri >= chunks.length) {
          body.innerHTML = `<div class="qw rv rd"><div class="hd">${esc(s.title)}<span class="ic"></span></div><div class="end qres"><div class="big">✓</div><p><b>You read all ${chunks.length} ${multi ? 'passages' : 'lines'} aloud.</b></p><div class="qact"><button class="btn" id="rd-again">Read again</button></div></div></div>`;
          body.querySelector('#rd-again').onclick = () => { ri = 0; draw(); }; return;
        }
        // text = speakable passage (for TTS); dw = display words, the unit that gets coloured and scored.
        const c = chunks[ri], text = c.map(l => clean(l[0])).join(' '), dw = c.map(l => disp(l[0])).join(' ').split(' ').filter(Boolean);
        const en = esc(quoteEn(c.map(l => l[1]).join(' ')));
        body.innerHTML = `<div class="qw rv rd"><div class="hd">${esc(s.title)}<span class="ic"></span></div><div class="bd">
          <div class="ql">${multi ? 'PART' : 'LINE'} ${ri + 1} OF ${chunks.length}</div><div class="ring">${ri + 1}</div>
          <p class="rdh">${multi ? `Read this passage aloud${hasSR ? ': tap <b>Say it</b>, read, then tap <b>Stop</b>' : ''}.` : `Tap ▶ to hear it, then ${hasSR ? '<b>Say it</b>' : 'read it aloud'}.`} ${hasSR ? 'Green words you said; orange words need another try.' : ''}</p>
          <div class="spk-txt rdt">${dw.map(w => `<span>${esc(w)}</span>`).join(' ')}</div>
          <div class="spk-en rden" ${EN ? '' : 'hidden'}>${en}</div>
          <div class="spk-act"><button class="spk-ib" data-l aria-label="Listen" title="Listen">${ic('play', 14)}</button>${hasSR ? `<button class="btn sm" data-s>${ic('mic', 14)} Say it</button>` : ''}<button class="rdtg" data-tg>${EN ? 'Hide' : 'Show'} translation</button><span class="spk-res" aria-live="polite"></span></div><div class="spk-fb" hidden></div></div>
          ${ri > 0 ? '<button class="nv l" id="pv" aria-label="Previous">‹</button>' : ''}<button class="nv r" id="nx" aria-label="Next">›</button></div>`;
        const row = body.querySelector('.bd'), res = row.querySelector('.spk-res'), sb = row.querySelector('[data-s]'), fb = row.querySelector('.spk-fb');
        row.querySelector('[data-tg]').onclick = () => setEN(!EN);
        body.querySelector('#nx').onclick = () => { ri++; draw(); };
        const pv = body.querySelector('#pv'); if (pv) pv.onclick = () => { ri--; draw(); };
        row.querySelector('[data-l]').onclick = () => { stopListen(); speakPlain(text.replace(/[¿¡]/g, '')); };
        row.querySelectorAll('.spk-txt span').forEach(x => { x.style.cursor = 'pointer'; x.title = 'Tap to hear this word'; x.onclick = () => { stopListen(); speakPlain(x.textContent.replace(/[.,!?¿¡;:]/g, ''), null, .6); }; });
        if (sb) sb.onclick = () => {
          if (multi && live) { finishListen(); return; }
          res.textContent = ''; row.querySelectorAll('.spk-txt span').forEach(x => x.className = '');
          listen(r => {
            if (r.error) { res.textContent = errMsg(r.error); return; }
            // Score every alternative transcript; a word counts as said if ANY alternative heard it (recognizers often
            // rank the right word second). null (tokenless word) stays null. pct = said / scored words.
            const als = r.alts.map(a => alignWords(dw, a)); const ok = dw.map((_, k) => als[0].ok[k] === null ? null : als.some(a => a.ok[k]));
            const cnt = ok.filter(v => v !== null), best = { ok, pct: cnt.filter(Boolean).length / (cnt.length || 1) };
            row.querySelectorAll('.spk-txt span').forEach((x, k) => x.className = best.ok[k] === null ? '' : best.ok[k] ? 'ok' : 'miss');
            // Score bands: >= 90% "Perfecto" (and the story is marked 'spoke' for can-do progress), >= 70% "Muy bien", else retry.
            const p = Math.round(best.pct * 100);
            res.textContent = (p >= 90 ? '¡Perfecto! ' : p >= 70 ? '¡Muy bien! ' : 'Almost. Listen, then try again. ') + p + '%';
            if (p >= 90) { try { PROG.mark(s.id, 'spoke'); } catch (e) {} }
            // Missed words for the "Practice" buttons: unique, punctuation stripped, at most 12.
            const bad = [...new Set(dw.filter((w, k) => best.ok[k] === false).map(w => w.replace(/[.,!?;:¿¡«»"“”—]/g, '')).filter(Boolean))].slice(0, 12);
            fb.hidden = false;
            fb.innerHTML = (multi ? '' : `<div>You said: <i>“${esc(digits(r.text))}”</i></div>`) + (bad.length ? `<div class="spk-fixrow">Practice: ${bad.map(w => `<button class="spk-wd" data-w="${esc(w)}">${ic('volume', 13)} ${esc(w)}</button>`).join('')}<span class="mute"> tap to hear each word slowly, then try again</span></div>` : '<div>All words matched. Nice! Tap › for the next one.</div>');
            fb.querySelectorAll('.spk-wd').forEach(b => b.onclick = () => { stopListen(); speakPlain(b.dataset.w, null, .6); });
          }, st => { sb.classList.toggle('rec', st === 'on'); sb.innerHTML = ic('mic', 14) + (st === 'on' && multi ? ' Stop' : ' Say it'); if (st === 'on') res.textContent = 'Listening…'; else if (res.textContent === 'Listening…') res.textContent = ''; }, { continuous: multi });
        };
      };
      draw();
    }

    /* ---- speak freely (retell) ---- */
    // Retell mode: the learner speaks without a script. keys = story vocab headwords (leading article dropped, first word of
    // the normalized form kept as k); afterwards each key is ticked if any heard word matches it with eq(). With AI on,
    // the transcript can be sent for JSON feedback { praise, fixes[{said, better, why}], model }.
    function free() {
      const keys = s.vocab.map(v => ({ w: v[0], k: norm(v[0]).replace(/^(el|la|los|las|un|una)\s+/, '').split(' ')[0] })).filter(x => x.k);
      const lvl = s.level;
      body.innerHTML = `<div class="spk-prompt"><b>${esc(FREE_PROMPT[lvl] || FREE_PROMPT.A2)}</b><div class="mute" style="font-size:.82rem;margin-top:4px">No script. Try to use some of these story words:</div><div class="spk-keys">${keys.map((x, i) => `<button class="spk-k" data-i="${i}">${esc(x.w)}</button>`).join('')}</div></div>
        ${hasSR ? `<div class="spk-act"><button class="btn" id="fr-go">${ic('mic', 14)} Start speaking</button><span class="spk-res" id="fr-st" aria-live="polite"></span></div>` : '<p class="mute">Voice recognition is not available in this browser. Try Chrome, Edge or Safari.</p>'}
        <div class="spk-tr" id="fr-tr" hidden></div><div id="fr-out"></div>`;
      body.querySelectorAll('.spk-k').forEach(b => b.onclick = () => speakPlain(keys[+b.dataset.i].w.replace(/^(el|la|los|las)\s+/, ''), null, .7));
      const go = body.querySelector('#fr-go'); if (!go) return; const st = body.querySelector('#fr-st'), tr = body.querySelector('#fr-tr'), out = body.querySelector('#fr-out');
      go.onclick = () => {
        if (live) { finishListen(); return; }
        out.innerHTML = ''; tr.hidden = false; tr.textContent = '…'; const t0 = Date.now();
        listen(r => {
          if (r.error) { tr.hidden = true; st.textContent = errMsg(r.error); return; }
          const said = digits(r.text), H = norm(said).split(' ').filter(Boolean), secs = Math.max(1, Math.round((Date.now() - t0) / 1000));
          tr.textContent = said; st.textContent = '';
          const used = keys.map(x => H.some(h => eq(x.k, h)));
          const nUsed = used.filter(Boolean).length;
          out.innerHTML = `<div class="spk-stats"><span><b>${H.length}</b> words</span><span><b>${secs}s</b></span><span><b>${nUsed}</b>/${keys.length} story words</span></div>
            <div class="spk-keys">${keys.map((x, i) => `<span class="spk-k ${used[i] ? 'ok' : 'no'}">${esc(x.w)}</span>`).join('')}</div>
            <div class="spk-act"><button class="btn ghost sm" id="fr-again">Try again</button>${AI.on() ? `<button class="btn sm" id="fr-ai">Get feedback from ${PC.name}</button>` : ''}</div><div id="fr-fb"></div>`;
          out.querySelector('#fr-again').onclick = () => { out.innerHTML = ''; tr.hidden = true; };
          const ai = out.querySelector('#fr-ai');
          if (ai) ai.onclick = async () => {
            const fbx = out.querySelector('#fr-fb'); fbx.textContent = PC.name + ' is reading…'; ai.disabled = true;
            try {
              const prompt = `A ${lvl} Spanish learner was asked: "${FREE_PROMPT[lvl] || FREE_PROMPT.A2}" after reading the story "${s.title}" (${s.titleEn}). Their speech was transcribed (it may lack punctuation and accents; do not penalize that): "${said}". Reply with JSON only: {"praise":"one warm sentence in English about what they did well","fixes":[{"said":"short phrase they said","better":"corrected Spanish","why":"short English reason"}],"model":"a natural ${lvl}-level Spanish version of what they meant, 2-4 sentences"}. Give at most 3 fixes. If nothing needs fixing return an empty fixes array.`;
              const j = AI.json(await AI.ask(prompt));
              fbx.innerHTML = `<div class="spk-ai"><p>${esc(j.praise || '')}</p>${(j.fixes || []).map(f => `<div class="spk-fixc"><s>${esc(f.said)}</s> → <b>${esc(f.better)}</b><br><small>${esc(f.why)}</small></div>`).join('')}<div class="spk-model"><div class="spk-part">A model version</div><div>${esc(j.model || '')}</div><button class="spk-ib" id="fr-hear" aria-label="Listen">${ic('play', 14)}</button></div></div>`;
              const h = fbx.querySelector('#fr-hear'); if (h) h.onclick = () => speakPlain(j.model || '');
            } catch (e) { fbx.textContent = 'Feedback is not available right now. Try again in a moment.'; }
            ai.disabled = false;
          };
        }, st2 => { go.classList.toggle('rec', st2 === 'on'); go.innerHTML = ic('mic', 14) + (st2 === 'on' ? ' Stop' : ' Start speaking'); if (st2 === 'on') st.textContent = 'Listening… Tap Stop when you finish.'; else if (/^Listening/.test(st.textContent)) st.textContent = ''; }, { continuous: true, onInterim: tx => { tr.textContent = digits(tx); } });
      };
    }

    /* ---- role-play ---- */
    // Scripted role-play. Dialogue source priority: DATA.dialogues[id], built-in DIALOGUES[id], then genericFor(name).
    // Each step shows the partner's line (spoken via talk) and reply choices; picking reply k jumps to step st.r[k][2].
    function role() {
      const D = (DATA.dialogues && DATA.dialogues[s.id]) || DIALOGUES[s.id] || genericFor(PC.name), C = PC; let step = 0;
      const draw = () => {
        const st = D.steps[step];
        body.innerHTML = `<div class="spk-stage"><div class="spk-av">${avatar(C)}<b>${C.name}</b></div><div class="spk-bub"><div class="es">${esc(st.say)}</div><div class="en spk-en">${esc(st.en)}</div><button class="btn ghost sm" data-again>${ic('play', 14)} Hear again</button></div></div>` +
          (st.end ? `<div class="spk-end"><b>¡Muy bien!</b> You finished the conversation.<br><button class="btn" data-restart>Start over</button></div>` :
            `<div class="spk-rl">Your turn: ${hasSR ? 'say one of these, or tap it.' : 'tap a reply.'}</div><div class="spk-rep">${st.r.map((r, k) => `<button class="spk-r" data-k="${k}"><b>${esc(r[0])}</b><small>${esc(r[1])}</small></button>`).join('')}</div>${hasSR ? `<div class="spk-act"><button class="btn" data-mic>${ic('mic', 14)} Answer by voice</button><span class="spk-res" aria-live="polite"></span></div>` : ''}`);
        const say = () => talk(body, st.say); say();
        body.querySelector('[data-again]').onclick = say;
        const pick = k => { stopAll(); step = st.r[k][2]; draw(); };
        body.querySelectorAll('.spk-r').forEach(b => b.onclick = () => pick(+b.dataset.k));
        const rs = body.querySelector('[data-restart]'); if (rs) rs.onclick = () => { step = 0; draw(); };
        const mb = body.querySelector('[data-mic]');
        if (mb) mb.onclick = () => { const res = body.querySelector('.spk-res');
          listen(r => {
            if (r.error) { res.textContent = errMsg(r.error); return; }
            // Find the reply choice that best matches any alternative transcript; accept it only at >= 60% word match, then
            // highlight it and advance after 500 ms. Otherwise show what was heard.
            let bi = -1, bp = 0; st.r.forEach((x, k) => r.alts.forEach(a => { const p = align(x[0], a).pct; if (p > bp) { bp = p; bi = k; } }));
            if (bi >= 0 && bp >= .6) { body.querySelectorAll('.spk-r')[bi].classList.add('hit'); setTimeout(() => pick(bi), 500); }
            else res.textContent = 'I heard “' + r.text + '”. Try saying one of the answers above.';
          }, stt => { mb.classList.toggle('rec', stt === 'on'); const rs = body.querySelector('.spk-res'); if (stt === 'on') rs.textContent = 'Listening…'; else if (rs && rs.textContent === 'Listening…') rs.textContent = ''; });
        };
      };
      draw();
    }

    /* ---- open role-play with a goal (needs AI; the scripted role-play is the offline version) ---- */
    // Open role-play: the learner types or speaks freely to reach a goal while the AI plays the partner. G = DATA.goals[id]
    // (or a generic goal). The AI must answer JSON { es, en, fix, done }; done:true completes the goal and marks 'spoke'.
    // hist = conversation sent with each prompt; busy blocks overlapping turns; done locks the form after success.
    function chat() {
      const lv = s.level, vocab = s.vocab.map(v => v[0]).join(', ');
      const G = (DATA.goals && DATA.goals[s.id]) || { goal: 'Have a short conversation with ' + PC.name + '.', goalEs: '', opener: 'Hola. ¿Qué te gusta de la historia?', openerEn: 'Hi. What do you like about the story?', scene: 'A friendly character from the story.' };
      let hist = [], busy = false, done = false;
      // System prompt for the partner: stays in character, level-appropriate Spanish, 1-2 sentence turns, JSON-only replies.
      const sys = `You are ${PC.name} in an open role-play. Scene: ${G.scene} A ${lv} Spanish learner has just read the story "${s.title}" (${s.titleEn}) and is talking to you. The learner's goal: "${G.goal}". Stay in character. Speak ONLY simple Spanish at ${lv} level (${lv === 'A1' ? 'present tense, very short sentences' : lv === 'A2' ? 'present and simple past, short sentences' : 'natural but clear sentences'}). Useful words: ${vocab}. Keep each turn to 1–2 sentences. Be cooperative but make the learner do the work; the goal should take about 3–6 turns. Reply with JSON only: {"es":"your Spanish reply","en":"English translation","fix":"if the learner made a mistake, one short kind correction in English with the corrected Spanish, else empty string","done":true or false}. Set done to true ONLY in the turn when the learner has clearly achieved the goal; then wrap up warmly in your reply.`;
      body.innerHTML = `<div class="spk-goal" id="spk-goal"><div><span class="gk">GOAL</span> <b>${esc(G.goal)}</b></div>${G.goalEs ? `<div class="gs">${esc(G.goalEs)}</div>` : ''}<div class="gst" id="spk-gst">○ Not yet</div></div>
        <div class="spk-stage"><div class="spk-av">${avatar(PC)}<b>${PC.name}</b></div><div class="spk-bub"><div class="es">${esc(G.opener)}</div><div class="en spk-en">${esc(G.openerEn)}</div></div></div><div class="spk-log" id="spk-log" aria-live="polite"></div>
        <form class="spk-form" id="spk-form"><input id="spk-in" lang="es" autocomplete="off" placeholder="Escribe en español…"><button class="btn" type="submit">Send</button>${hasSR ? `<button class="btn ghost" type="button" data-mic aria-label="Answer by voice">${ic('mic', 14)}</button>` : ''}</form><p class="spk-res mute" id="spk-st"></p><div class="spk-act"><button class="btn ghost sm" id="spk-rs">Start over</button></div>`;
      const log = body.querySelector('#spk-log'), inp = body.querySelector('#spk-in'), stx = body.querySelector('#spk-st'), gst = body.querySelector('#spk-gst'), frm = body.querySelector('#spk-form');
      hist.push({ who: PC.name, text: G.opener });
      // Append a chat bubble (cls 'me' or 'bot') with optional English line and correction, and scroll it into view.
      const add = (cls, es, en, fix) => { const d = document.createElement('div'); d.className = 'spk-msg ' + cls; d.innerHTML = `<div class="es">${esc(es)}</div>${en ? `<div class="spk-en">${esc(en)}</div>` : ''}${fix ? `<div class="spk-fix">${esc(fix)}</div>` : ''}`; log.appendChild(d); d.scrollIntoView({ block: 'nearest' }); };
      // One learner turn: send the whole conversation to AI, retry once on an empty/bad reply (rate-limit and permission
      // errors are not retried), show the reply and speak it. On a failure other than those two, the learner's message
      // is removed from hist and put back in the input so it can be resent.
      async function turn(text) {
        if (busy || done || !text.trim()) return; busy = true; add('me', text); hist.push({ who: 'Learner', text }); inp.value = ''; stx.textContent = PC.name + ' is thinking…';
        try {
          const prompt = sys + '\n\nConversation so far:\n' + hist.map(h => h.who + ': ' + h.text).join('\n') + '\n\nReply as ' + PC.name + ' now. JSON only.';
          let j = null, lastErr = null;
          for (let k = 0; k < 2 && !j; k++) {
            try {
              const raw = String(await AI.ask(prompt)).replace(/```(?:json)?/g, '').trim();
              // Models sometimes ignore "JSON only": if the reply is short (< 400 chars) and contains Spanish letters, use it as
              // the plain Spanish reply, stripping a leading "Name:" label (up to 20 letters/spaces before the colon).
              try { j = AI.json(raw); } catch (pe) { if (raw && raw.length < 400 && /[a-záéíóúñ]/i.test(raw)) j = { es: raw.replace(/^\s*[\w\u00C0-\u017F ]{1,20}:\s*/, ''), en: '', fix: '', done: false }; else throw pe; }
              if (!j || !j.es) { j = null; throw new Error('empty'); }
            } catch (e2) { lastErr = e2; if (e2 && (e2.code === 'rate_limited' || e2.code === 'not_granted' || e2.code === 'timeout')) throw e2; }
          }
          if (!j) throw lastErr || new Error('fail');
          hist.push({ who: PC.name, text: j.es }); add('bot', j.es, j.en, j.fix); stx.textContent = ''; talk(body, j.es);
          if (j.done) { done = true; gst.textContent = '✓ Goal complete. ¡Muy bien!'; gst.classList.add('ok'); frm.hidden = true; try { PROG.mark(s.id, 'spoke'); } catch (e) {} }
        } catch (e) { stx.textContent = e && e.code === 'rate_limited' ? 'Too many messages. Wait a moment and try again.' : e && e.code === 'not_granted' ? 'Chat needs your permission. Reload and choose Allow when asked.' : PC.name + ' did not reply. Send your message again, or use the scripted Role-play tab.'; if (e && e.code !== 'rate_limited' && e.code !== 'not_granted') { hist.pop(); inp.value = text; } }
        busy = false;
      }
      frm.onsubmit = e => { e.preventDefault(); turn(inp.value); };
      const mb = body.querySelector('[data-mic]');
      if (mb) mb.onclick = () => listen(r => { if (r.error) { stx.textContent = errMsg(r.error); return; } turn(r.text); }, st => { mb.classList.toggle('rec', st === 'on'); if (st === 'on') stx.textContent = 'Listening…'; else if (stx.textContent === 'Listening…') stx.textContent = ''; });
      body.querySelector('#spk-rs').onclick = () => { stopAll(); chat(); };
      talk(body, G.opener);
    }
    // Open the default tab and hand back the stop handle.
    ({ read, free, role, chat })[mode]();
    return { stop: stopAll };
  }
  // Public API (see header).
  return { mount, stopListen, listen, align };
})();
