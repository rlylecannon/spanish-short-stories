/* ===== Warm up: one ordered ladder of guided micro-units (a "thinking" approach to Spanish). Injected inside the app IIFE
   (uses esc, ic, store, speakPlain, SP, AI, byId). Each story points to a place on the ladder ("through unit N").
   Units without `steps` are listed as "coming soon". Offline-first; the AI tutor chat is optional.
   Public API: const WU = { panel(host, story, onChange), page(), count(story), through(story) }.
     panel: renders the story's required units into host (the "Warm up" toolbar panel on a story page; app.js);
            onChange() is called after a unit is finished or skipped so app.js can refresh the badge.
     page:  the standalone #warmup page (all units, app.js router).   count: number of units still up next for a story
            (the badge on the Warm up button).   through: ladder prefix length a story needs (see through()).
   Depends on shared-scope names: esc, ic, store, speakPlain, app, SP (SP.listen / SP.align / SP.stopListen), AI.
   localStorage: 'sff-wu' = { unitId: { at: ms timestamp, how: 'done' | 'skipped' } } (also synced by progress.js).
   Data shapes (all built in this file, not from DATA):
     unit  = { id 'u1', t title, min minutes, steps: [step...], chat?: { opener, focus, facts } }; a unit with no `steps`
             is a placeholder shown under "Coming soon". chat = optional AI tutor after the steps; `facts` is the only
             material the tutor is allowed to teach.
     step  = one of the objects made by the helper constructors below (field `t` is the type) ===== */
const WU = (() => {
  const KEY = 'sff-wu';
  // Step constructors (compact helpers for the LADDER data):
  //  I(heading, body, examples [[spanish, gloss]...], pad)  info card; pad 'vowels' adds the vowel-sound pad
  //  Q(question, options[], answerIndex, feedback)          multiple choice
  //  T(question, acceptedAnswers[], feedback, hint)         typed answer, compared after norm(); feedback starts "Yes: <answer>"
  //  S(word, prompt)                                        say-it (speech recognition optional; can be skipped)
  //  ST(word, syllables[], stressedIndex, feedback)         tap the stressed syllable
  const I = (h, b, ex, pad) => ({ t: 'info', h, b, ex: ex || [], pad });
  const Q = (q, o, a, ok) => ({ t: 'mc', q, o, a, ok });
  const T = (q, acc, ok, hint) => ({ t: 'type', q, acc, ok, hint });
  const S = (w, q) => ({ t: 'say', w, q });
  const ST = (w, syl, a, ok) => ({ t: 'stress', w, syl, a, ok });

  // The ordered ladder of units; position in this array (1-based) is the unit number a story's "through" value refers to.
  const LADDER = [
    { id: 'u1', t: 'Think, don’t memorize', min: 2, steps: [
      I('Notice patterns, don’t memorize words', 'You do not need to cram lists. Spanish and English share thousands of word roots, and Spanish follows regular patterns. Your job is to notice the pattern, then rebuild the word in your head.'),
      I('Look for pieces you recognize', 'When you meet a word you do not know, scan its spelling for a familiar beginning or ending. “Importante” starts like “important”. “Información” ends like “-ation”. Then check the words around it for clues.', [['importante', 'looks like: important'], ['la información', 'looks like: information']]),
      I('Smart guessing is a skill', 'Guessing from clues is a real language skill, not cheating. Strong readers do it all the time. Try it now.'),
      Q('What do you think “importante” means?', ['important', 'imported', 'impossible'], 0, 'Yes. You just read a Spanish word you had never studied.'),
      Q('And “el hospital”?', ['the hotel', 'the hospital', 'the host'], 1, 'Right. The spelling and the context did the work.')
    ] },
    { id: 'u2', t: 'Vowels: five pure sounds', min: 4, steps: [
      I('Five vowels, five steady sounds', 'Spanish has five vowel sounds and each one never changes. Say them short, clean and steady. Try the vowel buttons first, then tap each word below to hear it. You will also see marks over some letters, like the one in sí. Unit 3 explains what they do.', [['casa', 'a = “ah”, like father'], ['mesa', 'e = “eh”, like bet'], ['sí', 'i = “ee”, like see'], ['poco', 'o = a steady “oh”, with no glide'], ['uno', 'u = “oo”, like flute']], 'vowels'),
      I('Say every vowel fully', 'In English, a vowel in a weak syllable gets muffled into a short “uh”. Spanish never does this. Every vowel is pronounced in full, even in syllables that are not stressed.', [['animal', 'English muffles it: AN-uh-mul. Spanish: a-ni-MAL, with a full “ah”, “ee” and “ah”.'], ['normal', 'English: NOR-mul. Spanish: nor-MAL, with a full “ah” at the end.']]),
      S('casa', 'Say it: every vowel clear.'), S('mesa', 'Say it.'), S('animal', 'Say it: a-ni-MAL, every vowel in full.'), S('normal', 'Say it: nor-MAL.'),
      Q('How many different sounds can the letter “a” make in Spanish?', ['One: always “ah”', 'Two', 'It depends on the stress'], 0, 'Spanish vowels never change.'),
      Q('How do you say “normal” in Spanish?', ['nor-MAL, with a full “ah” at the end', 'NOR-mul, with a muffled “uh” at the end'], 0, 'Yes. Spanish pronounces the last vowel in full.'),
      I('One vowel can change the meaning', 'Because vowels are steady, a single vowel can carry meaning: it can show gender or who is doing the action (he or she).', [['chico', 'boy'], ['chica', 'girl'], ['hablo', 'I speak'], ['habla', 'he or she speaks']]),
      Q('Which one means “she speaks”?', ['hablo', 'habla', 'hablan'], 1, 'The ending -a points to he or she.'),
      Q('Which one means “girl”?', ['chico', 'chica'], 1, 'The vowel -a often marks the feminine.')
    ] },
    { id: 'u3', t: 'Stress and accent marks', min: 5, steps: [
      I('Rule 1: vowel, n or s', 'If a word ends in a vowel, -n or -s, the stress falls on the second-to-last syllable.', [['casa', 'CA-sa'], ['hablan', 'HA-blan'], ['orden', 'OR-den'], ['lunes', 'LU-nes']]),
      I('Rule 2: any other consonant', 'If a word ends in any other consonant, the stress falls on the last syllable.', [['hablar', 'ha-BLAR'], ['ciudad', 'ciu-DAD'], ['hotel', 'ho-TEL'], ['animal', 'a-ni-MAL']]),
      ST('casa', ['ca', 'sa'], 0, 'It ends in a vowel, so the stress is on the second-to-last syllable: CA-sa.'),
      ST('hablan', ['ha', 'blan'], 0, 'It ends in n, so HA-blan.'),
      ST('ciudad', ['ciu', 'dad'], 1, 'It ends in d, so the stress is on the last syllable: ciu-DAD.'),
      ST('hotel', ['ho', 'tel'], 1, 'It ends in l, so ho-TEL.'),
      ST('hablar', ['ha', 'blar'], 1, 'It ends in r, so ha-BLAR.'),
      ST('orden', ['or', 'den'], 0, 'It ends in n, so OR-den.'),
      I('The accent mark shows an exception', 'If a word does not follow the rule, it wears an accent mark, and you stress that vowel. The mark is a map for your voice.', [['está', 'es-TÁ'], ['inglés', 'in-GLÉS'], ['teléfono', 'te-LÉ-fo-no'], ['canción', 'can-CIÓN']]),
      Q('Why does “canción” need an accent mark?', ['Its stress is on the last syllable, which breaks the rule for words ending in n', 'Because it is a noun', 'Because it is long'], 0, 'Yes. Without the mark you would say CAN-cion.'),
      Q('Where is the stress in “teléfono”?', ['te', 'lé', 'fo'], 1, 'The accent mark tells you: te-LÉ-fo-no.'),
      Q('Does “hotel” need an accent mark?', ['No: it ends in l, so the stress already falls on the last syllable, as the rule says', 'Yes'], 0, 'No mark is needed, because the stress already follows the rule.'),
      I('Accent marks have other jobs', 'Besides showing stress, an accent mark can tell two look-alike words apart, and it marks question words.', [['sí', 'yes (si = if)'], ['él', 'he (el = the)'], ['tú', 'you (tu = your)'], ['qué', 'what? (que = that)'], ['cómo', 'how? (como = like, as)']]),
      Q('Which one means “he”?', ['el', 'él'], 1, 'Yes. “Él” with the mark means he. “El” without it means the.'),
      Q('Which one means “yes”?', ['si', 'sí'], 1, 'Yes. “Sí” with the mark means yes. “Si” without it means if.'),
      S('teléfono', 'Say it with the stress on lé.'), S('canción', 'Say it with the stress on the last syllable.'), S('inglés', 'Say it.')
    ], chat: { opener: 'Pick any Spanish word you know and tell me where the stress goes. I will tell you if it needs an accent mark.', focus: 'stress rules and accent marks', facts: 'Words ending in a vowel, n or s are stressed on the second-to-last syllable. Words ending in any other consonant are stressed on the last syllable. A written accent mark shows that the word breaks the rule and marks the stressed vowel.' } },
    { id: 'u4', t: 'Word keys 1: -ción, -dad, -encia', min: 5, steps: [
      I('You already know thousands of words', 'English -tion becomes Spanish -ción. These nouns are all feminine: la nación, la acción.', [['la nación', 'nation'], ['la acción', 'action'], ['la condición', 'condition'], ['la información', 'information'], ['la estación', 'station (an e is added in front)']]),
      T('Spanish for “action”?', ['accion', 'la accion'], 'Yes: acción.', 'Change -tion to -ción.'),
      T('Spanish for “tradition”?', ['tradicion', 'la tradicion'], 'Yes: tradición.', 'Change -tion to -ción.'),
      T('Spanish for “education”?', ['educacion', 'la educacion'], 'Yes: educación.', 'Change -tion to -ción.'),
      T('Spanish for “situation”?', ['situacion', 'la situacion'], 'Yes: situación.', 'Change -tion to -ción.'),
      I('-ty becomes -dad', 'English -ty becomes -dad. These nouns are feminine too.', [['la ciudad', 'city'], ['la realidad', 'reality'], ['la universidad', 'university'], ['la posibilidad', 'possibility']]),
      T('Spanish for “community”?', ['comunidad', 'la comunidad'], 'Yes: comunidad.', 'Change -ty to -dad. Note: one m in Spanish.'),
      T('Spanish for “identity”?', ['identidad', 'la identidad'], 'Yes: identidad.', 'Change -ty to -dad.'),
      T('Spanish for “activity”?', ['actividad', 'la actividad'], 'Yes: actividad.', 'Change -ty to -dad.'),
      I('-ence and -ance become -encia and -ancia', 'Swap the final -e for -ia. These are feminine as well.', [['la diferencia', 'difference'], ['la distancia', 'distance'], ['la paciencia', 'patience'], ['la importancia', 'importance']]),
      T('Spanish for “experience”?', ['experiencia', 'la experiencia'], 'Yes: experiencia.', 'Change -ence to -encia.'),
      T('Spanish for “tolerance”?', ['tolerancia', 'la tolerancia'], 'Yes: tolerancia.', 'Change -ance to -ancia.'),
      Q('Which is right?  ___ diferencia', ['el', 'la'], 1, 'These nouns are feminine: la diferencia.'),
      Q('Which is right?  ___ ciudad', ['el', 'la'], 1, 'Nouns ending in -dad are feminine: la ciudad.'),
      S('información', 'Say it: in-for-ma-CIÓN.'), S('ciudad', 'Say it: ciu-DAD.')
    ], chat: { opener: 'Give me an English word ending in -tion, -ty or -ence, and tell me how you would say it in Spanish. I will check it.', focus: 'turning English -tion, -ty, -ence/-ance into Spanish -ción, -dad, -encia/-ancia', facts: 'English -tion becomes -ción. English -ty becomes -dad. English -ence or -ance becomes -encia or -ancia. These nouns are all feminine (la). Sometimes a double letter becomes a single letter, and sometimes an e is added in front (station becomes estación).' } },
    { id: 'u5', t: 'Word keys 2: -al, -ible, -ico, false friends', min: 5, steps: [
      I('-al stays the same', 'Words ending in -al keep their spelling. Say them with the stress on the last syllable.', [['normal', 'normal'], ['final', 'final'], ['legal', 'legal'], ['natural', 'natural'], ['hospital', 'hospital']]),
      I('-ible and -able keep their endings', 'They keep the ending. Double letters often become single.', [['terrible', 'terrible'], ['flexible', 'flexible'], ['probable', 'probable'], ['posible', 'possible: only one s'], ['imposible', 'impossible']]),
      I('-ic and -ical become -ico and -ica', 'Use -ico for masculine and -ica for feminine. An accent mark often appears, to keep the English stress.', [['mágico', 'magic'], ['fantástico', 'fantastic'], ['histórico', 'historic'], ['práctico', 'practical'], ['la música', 'music']]),
      T('Spanish for “possible”?', ['posible'], 'Yes: posible, with one s.', 'Keep the ending, but drop one s.'),
      T('Spanish for “romantic”?', ['romantico', 'romantica'], 'Yes: romántico (or romántica).', 'Change -ic to -ico.'),
      T('Spanish for “electric”?', ['electrico', 'electrica'], 'Yes: eléctrico (or eléctrica).', 'Change -ic to -ico.'),
      T('Spanish for “normal”?', ['normal'], 'Yes: normal. Nothing changes.', 'It keeps its spelling.'),
      I('Careful: false friends', 'A few words look similar but mean something different. Learn these early.', [['embarazada', 'pregnant (not embarrassed)'], ['actualmente', 'currently (not actually)'], ['la librería', 'bookstore (not library: biblioteca)'], ['el éxito', 'success (not exit: salida)'], ['sensible', 'sensitive (not sensible: sensato)'], ['la carpeta', 'folder (not carpet: alfombra)']]),
      Q('You see “librería”. What is it?', ['a library', 'a bookstore'], 1, 'A library is una biblioteca.'),
      Q('“Éxito” means…', ['exit', 'success'], 1, 'The exit is la salida.'),
      Q('“Actualmente” means…', ['actually', 'currently'], 1, 'For “actually” say en realidad.'),
      Q('A “carpeta” is a…', ['carpet', 'folder'], 1, 'A carpet is una alfombra.')
    ], chat: { opener: 'Try me: give me an English word ending in -al, -ible or -ic, and tell me its Spanish form. Or ask about a false friend.', focus: 'words that look alike in English and Spanish (-al, -ible/-able, -ic endings), and false friends', facts: 'English -al, -ible and -able words keep their spelling in Spanish (normal, terrible, flexible), though double letters become single (posible). English -ic becomes -ico or -ica, often with an accent mark (mágico). False friends: embarazada = pregnant, actualmente = currently, librería = bookstore, éxito = success, sensible = sensitive, carpeta = folder.' } },
    // u6-u11 have no steps yet: they show as "Coming soon" and are ignored by upNext/count.
    { id: 'u6', t: 'Verb anatomy 1: the infinitive and -o' },
    { id: 'u7', t: 'Verb anatomy 2: he, she, they, we, you' },
    { id: 'u8', t: 'Hook words: quiero, puedo, tengo que, voy a' },
    { id: 'u9', t: 'Pronoun ping-pong: lo, la, me, te' },
    { id: 'u10', t: 'The opposite vowel: commands' },
    { id: 'u11', t: 'The opposite vowel: the subjunctive' }
  ];
  // Number of units in the ladder (the standalone page lists all of them).
  const TOTAL = LADDER.length;
  /* how far up the ladder a story needs: A1 builds step by step, A2 and up need the pronoun and command units, B1+ the subjunctive */
  // The story's requirement as a ladder prefix length (units 1..N). n = the story number (last two digits of its id).
  // A1: story 1 needs 5 units, 2 needs 6, 3 needs 7, later ones 8; A2: story 1 needs 8, others 10; B1: stories 1-5 need
  // 10, later ones 11; B2 and above need 11.
  function through(s) {
    const n = +String(s.id).slice(-2), lv = s.level;
    if (lv === 'A1') return n === 1 ? 5 : n === 2 ? 6 : n === 3 ? 7 : 8;
    if (lv === 'A2') return n === 1 ? 8 : 10;
    if (lv === 'B1') return n < 6 ? 10 : 11;
    return 11;
  }
  // Progress helpers. doneMap = saved map from KEY; isDone also counts units the learner skipped ("I know this");
  // built = has steps; upNext(th) = built, not-done units within the first th; count(s) = badge number for a story.
  const doneMap = () => store.get(KEY, {});
  const isDone = u => !!doneMap()[u.id];
  const built = u => !!u.steps;
  const upNext = th => LADDER.slice(0, th).filter(u => built(u) && !isDone(u));
  const count = s => upNext(through(s)).length;
  // Normalize typed or heard text for answer comparison: lower case, accents stripped, punctuation to spaces (the same
  // as speak.js's norm but without digit-to-word conversion), so "Acción" == "accion".
  const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // Record a unit as finished ('done') or skipped ('skipped') with a timestamp.
  const mark = (u, how) => { const m = doneMap(); m[u.id] = { at: Date.now(), how: how || 'done' }; store.set(KEY, m); };
  // Speak text aloud (¿ ¡ removed); never throws.
  const hear = t => { try { speakPlain(String(t).replace(/[¿¡]/g, '')); } catch (e) {} };
  // Is speech recognition available? (If not, "Say it" buttons are simply not shown.)
  const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  /* ---------- list view ---------- */
  // Show the unit list for the first th units: "Up next" cards, collapsible "Done" and "Coming soon" groups.
  // opts = { standalone (the #warmup page wording), onChange (called after skipping a unit) }. "I know this" marks a unit
  // 'skipped'. Cards are built once as strings; handlers are attached afterwards through the data-u unit id.
  function list(host, th, opts) {
    opts = opts || {};
    const up = upNext(th), dn = LADDER.slice(0, th).filter(u => built(u) && isDone(u)), soon = LADDER.slice(0, th).filter(u => !built(u));
    const card = (u, k) => `<div class="wu-card"><div class="wu-n">${LADDER.indexOf(u) + 1}</div><div class="wu-t"><b>${esc(u.t)}</b><small>${u.min} min · ${u.steps.length} steps</small></div><div class="wu-a"><button class="btn sm wu-go" data-u="${u.id}">${k === 'done' ? 'Review' : 'Start'}</button>${k === 'up' ? `<button class="btn ghost sm wu-skip" data-u="${u.id}" title="Mark as known">I know this</button>` : ''}</div></div>`;
    host.innerHTML = `<div class="wu-head"><span class="wu-eyebrow">${ic('sparkle', 14)} Warm up</span><h3>${opts.standalone ? 'Start here: think your way into Spanish' : 'Warm up for this story'}</h3><p class="mute">${opts.standalone ? 'Short, guided units that show how Spanish is built, so the stories feel decodable. Optional: skip anything you already know.' : 'Optional. These short units give you the tools this story uses. Skip any you already know.'}</p></div>` +
      (up.length ? `<h4 class="wu-sec">Up next · ${up.length}</h4>${up.map(u => card(u, 'up')).join('')}` : `<p class="wu-caught"><b>You are all caught up.</b> ${soon.length ? 'More units are on the way.' : ''}</p>`) +
      (dn.length ? `<details class="wu-done"><summary>Done · ${dn.length}</summary>${dn.map(u => card(u, 'done')).join('')}</details>` : '') +
      (soon.length ? `<details class="wu-soon"><summary>Coming soon · ${soon.length}</summary><ol start="${LADDER.indexOf(soon[0]) + 1}">${soon.map(u => `<li>${esc(u.t)}</li>`).join('')}</ol></details>` : '');
    host.querySelectorAll('.wu-go').forEach(b => b.onclick = () => run(host, th, opts, LADDER.find(u => u.id === b.dataset.u)));
    host.querySelectorAll('.wu-skip').forEach(b => b.onclick = () => { mark(LADDER.find(u => u.id === b.dataset.u), 'skipped'); list(host, th, opts); opts.onChange && opts.onChange(); });
  }

  /* ---------- runner ---------- */
  // Play unit u inside host, one step at a time (draw() renders step i). State: i = step index; asked = number of
  // scored questions; right = questions answered correctly on the FIRST try; mis = total wrong attempts. When the steps
  // run out: the AI tutor chat if the unit has one and AI.on(), otherwise finish().
  function run(host, th, opts, u) {
    let i = 0, right = 0, asked = 0, mis = 0;
    const steps = u.steps.slice();
    // HTML helpers: tut = tutor speech-bubble wrapper; bar = back button + "n / total" label + progress bar;
    // exHtml = tappable example list [[spanish, gloss]...] (each button speaks its Spanish).
    const tut = html => `<div class="wu-tut"><span class="wu-who">${ic('sparkle', 12)} Your tutor</span>${html}</div>`;
    const bar = () => `<div class="wu-top"><button class="btn ghost sm" id="wu-back">‹ All units</button><span class="wu-prog" aria-live="polite">${u.t} · ${Math.min(i + 1, steps.length)} / ${steps.length}</span></div><div class="wu-bar"><i style="width:${Math.round(i / steps.length * 100)}%"></i></div>`;
    const exHtml = ex => ex.length ? `<div class="wu-ex">${ex.map((e, k) => `<button class="wu-hear" data-k="${k}"><span>${ic('volume', 14)} <b>${esc(e[0])}</b></span><small>${esc(e[1])}</small></button>`).join('')}</div>` : '';
    // Vowel pad data: [letter, example word, English sound hint, transcripts the recognizer may produce for that spoken vowel].
    // A single spoken vowel is often written as "ah", "ha", "hi" etc., so any of these counts as correct.
    const VW = [['a', 'casa', 'ah', ['a', 'ah', 'ha']], ['e', 'mesa', 'eh', ['e', 'eh', 'he', 'ay']], ['i', 'sí', 'ee', ['i', 'ee', 'hi', 'y']], ['o', 'poco', 'oh', ['o', 'oh', 'ho']], ['u', 'uno', 'oo', ['u', 'oo', 'hu', 'woo']]];
    // Wrap the first occurrence of vowel v in word w with <mark> (v is always one of the single letters in VW, so safe in a RegExp).
    const hl = (w, v) => esc(w).replace(new RegExp('(' + v + ')', 'i'), '<mark>$1</mark>');
    const padHtml = () => `<div class="wu-pad" role="group" aria-label="Vowel practice"><div class="wu-padh">Vowel pad: tap a vowel to hear it</div><div class="wu-keys">${VW.map((v, k) => `<button class="wu-key" data-k="${k}" aria-label="Vowel ${v[0]}">${v[0]}</button>`).join('')}</div><div class="wu-padw" id="wu-padw" aria-live="polite">Pick a vowel.</div><div class="wu-act"><button class="btn ghost sm" id="wu-all">${ic('volume', 14)} Hear all five</button>${hasSR ? `<button class="btn sm" id="wu-psay" disabled>${ic('mic', 14)} Say it</button>` : ''}</div><div class="wu-fb" id="wu-pfb" aria-live="polite"></div></div>`;
    // Make the vowel pad work: tapping a key selects (sel) and speaks a vowel; "Hear all five" chains speakPlain
    // callbacks so each key lights up in turn; "Say it" listens and checks the transcripts against VW[sel][3].
    const padWire = () => {
      let sel = -1; const w = host.querySelector('#wu-padw'), fb = host.querySelector('#wu-pfb'), sb = host.querySelector('#wu-psay');
      host.querySelectorAll('.wu-key').forEach(b => b.onclick = () => { sel = +b.dataset.k; const v = VW[sel]; host.querySelectorAll('.wu-key').forEach(x => x.classList.toggle('on', x === b)); w.innerHTML = `<b class="wu-big">${v[0]}</b> = “${v[2]}” as in <b>${hl(v[1], v[0])}</b>`; fb.textContent = ''; if (sb) sb.disabled = false; hear(v[0]); });
      host.querySelector('#wu-all').onclick = () => { let k = 0; const nx = () => { if (k >= 5) return; const b = host.querySelectorAll('.wu-key')[k]; if (!b) return; b.classList.add('on'); speakPlain(VW[k][0], () => { b.classList.remove('on'); k++; nx(); }); }; nx(); };
      if (sb) sb.onclick = () => { if (sel < 0) return; const v = VW[sel]; SP.listen(r => { if (r.error) { fb.textContent = 'I could not hear that. Check your microphone, or just say it aloud.'; return; } const ok = r.alts.some(a => v[3].includes(norm(a))); fb.innerHTML = ok ? '<b>✓</b> Clear and steady. That is ' + v[0] + '.' : 'I heard “' + esc(r.text) + '”. Listen again, keep the sound short and steady, and retry.'; }, s2 => { sb.classList.toggle('rec', s2 === 'on'); if (s2 === 'on') fb.textContent = 'Listening…'; else if (fb.textContent === 'Listening…') fb.textContent = ''; }); };
    };
    // Attach the "All units" back button (stops any listening, returns to the list). Call after every innerHTML render.
    const wire = () => { host.querySelector('#wu-back').onclick = () => { try { SP.stopListen(); } catch (e) {} list(host, th, opts); }; };
    // Continue button HTML (its id wu-next is wired by the caller to go); go = advance one step and redraw.
    const nextBtn = (label) => `<div class="wu-act"><button class="btn" id="wu-next">${label || 'Continue'}</button></div>`;
    const go = () => { i++; draw(); };
    // Mark the unit done, notify onChange, and show the summary (first-try score if any questions were asked) with a
    // button to the next unfinished built unit within th, or to repeat this one.
    function finish() {
      mark(u); opts.onChange && opts.onChange();
      const nx = LADDER.slice(LADDER.indexOf(u) + 1, th).find(x => built(x) && !isDone(x));
      host.innerHTML = `<div class="wu-top"><button class="btn ghost sm" id="wu-back">‹ All units</button></div><div class="wu-end"><div class="big">✓</div><h3>${esc(u.t)}: done</h3><p>${asked ? `You got <b>${right} of ${asked}</b> on the first try.` : 'Nice work.'} ${mis ? 'Repeat the unit any time.' : ''}</p><div class="wu-act">${nx ? `<button class="btn" id="wu-nx">Next: ${esc(nx.t)}</button>` : ''}<button class="btn ghost" id="wu-again">Repeat this unit</button></div></div>`;
      wire(); const n = host.querySelector('#wu-nx'); if (n) n.onclick = () => run(host, th, opts, nx);
      host.querySelector('#wu-again').onclick = () => run(host, th, opts, u);
    }
    // Optional AI tutor chat that ends a unit (only reached when AI.on()). The prompt restricts the tutor to the unit's
    // `facts`; the reply must be JSON { reply, done }. done:true (or 6 tutor replies) only prompts the learner to press
    // "Finish unit"; it never finishes the unit automatically.
    function chat() {
      const C = u.chat; let busy = false, turns = 0, hist = [{ who: 'Tutor', text: C.opener }];
      host.innerHTML = bar() + tut(`<p>${esc(C.opener)}</p>`) + `<div class="wu-log" id="wu-log" aria-live="polite"></div><form class="wu-form" id="wu-form"><input id="wu-in" autocomplete="off" placeholder="Type here…"><button class="btn" type="submit">Send</button>${hasSR ? `<button class="btn ghost" type="button" id="wu-mic" aria-label="Answer by voice">${ic('mic', 14)}</button>` : ''}</form><p class="mute wu-st" id="wu-st"></p><div class="wu-act"><button class="btn ghost" id="wu-fin">Finish unit</button></div>`;
      wire();
      const log = host.querySelector('#wu-log'), inp = host.querySelector('#wu-in'), st = host.querySelector('#wu-st');
      const add = (c, t) => { const d = document.createElement('div'); d.className = 'wu-msg ' + c; d.textContent = t; log.appendChild(d); d.scrollIntoView({ block: 'nearest' }); return d; };
      async function send(text) {
        if (busy || !text.trim()) return; busy = true; const bub = add('me', text); hist.push({ who: 'Learner', text }); inp.value = ''; st.textContent = 'Your tutor is thinking…';
        const prompt = `You are a warm, encouraging Spanish tutor for a total beginner who speaks English. Teaching focus: ${C.focus}. Use ONLY these facts: ${C.facts} Do not teach anything beyond them. Reply in English with a little Spanish, in 1–3 short sentences, and end with one small follow-up question or task. If the learner is right, say so and why; if wrong, give a gentle hint, not the full answer first. Reply with JSON only: {"reply":"...","done":true or false}. Set done to true once the learner has answered correctly twice.\n\nConversation:\n` + hist.map(h => h.who + ': ' + h.text).join('\n') + '\n\nReply as the tutor now. JSON only.';
        // Up to 2 attempts. A non-JSON reply shorter than 500 chars is accepted as the plain reply text. Rate-limit and
        // permission errors stop retrying. On failure the learner's message is removed and restored in the input to resend.
        let j = null;
        for (let k = 0; k < 2 && !j; k++) { try { const raw = String(await AI.ask(prompt)).replace(/```(?:json)?/g, '').trim(); try { j = AI.json(raw); } catch (pe) { if (raw && raw.length < 500) j = { reply: raw, done: false }; } if (!j || !j.reply) j = null; } catch (e) { if (e && (e.code === 'rate_limited' || e.code === 'not_granted' || e.code === 'timeout')) break; } }
        if (j) { hist.push({ who: 'Tutor', text: j.reply }); add('bot', j.reply); st.textContent = ''; turns++; if (j.done || turns >= 6) st.textContent = 'Great work. Tap Finish unit when you are ready.'; }
        else { st.textContent = 'The tutor did not reply. Send it again, or finish the unit.'; hist.pop(); if (bub) bub.remove(); inp.value = text; }
        busy = false;
      }
      host.querySelector('#wu-form').onsubmit = e => { e.preventDefault(); send(inp.value); };
      const mb = host.querySelector('#wu-mic'); if (mb) mb.onclick = () => SP.listen(r => { if (r.error) { st.textContent = 'I could not hear that. Try typing.'; return; } send(r.text); }, s2 => { mb.classList.toggle('rec', s2 === 'on'); if (s2 === 'on') st.textContent = 'Listening…'; else if (st.textContent === 'Listening…') st.textContent = ''; });
      host.querySelector('#wu-fin').onclick = finish;
    }
    // Render the current step by its type (info / mc / type / say / stress). Each branch returns after wiring its buttons;
    // wrong answers are counted in `mis` and only a first-try correct answer adds to `right`.
    function draw() {
      try { SP.stopListen(); } catch (e) {}
      if (i >= steps.length) { if (u.chat && AI.on()) { chat(); return; } finish(); return; }
      const s = steps[i];
      if (s.t === 'info') {
        host.innerHTML = bar() + tut(`<h4>${esc(s.h)}</h4><p>${esc(s.b)}</p>${s.pad === 'vowels' ? padHtml() : ''}${exHtml(s.ex)}`) + nextBtn(); wire();
        if (s.pad === 'vowels') padWire();
        host.querySelectorAll('.wu-hear').forEach(b => b.onclick = () => hear(s.ex[+b.dataset.k][0].replace(/^(el|la|los|las) /, '')));
        host.querySelector('#wu-next').onclick = go; return;
      }
      if (s.t === 'mc') {
        asked++; let first = true;
        host.innerHTML = bar() + tut(`<p><b>${esc(s.q)}</b></p>`) + `<div class="wu-opts">${s.o.map((o, k) => `<button class="wu-o" data-k="${k}">${esc(o)}</button>`).join('')}</div><div class="wu-fb" aria-live="polite"></div>`; wire();
        host.querySelectorAll('.wu-o').forEach(b => b.onclick = () => {
          const k = +b.dataset.k, fb = host.querySelector('.wu-fb');
          if (k === s.a) { b.classList.add('ok'); if (first) right++; fb.innerHTML = `<b>✓</b> ${esc(s.ok)}${nextBtn()}`; host.querySelectorAll('.wu-o').forEach(x => x.disabled = true); host.querySelector('#wu-next').onclick = go; }
          else { first = false; mis++; b.classList.add('bad'); b.disabled = true; fb.textContent = 'Not quite. Try another.'; }
        });
        return;
      }
      if (s.t === 'type') {
        asked++; let tries = 0, first = true;
        host.innerHTML = bar() + tut(`<p><b>${esc(s.q)}</b></p>`) + `<form class="wu-form" id="wu-form"><input id="wu-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer"><button class="btn" type="submit">Check</button></form><div class="wu-fb" aria-live="polite"></div>`; wire();
        // ans = the answer to reveal after two wrong tries, derived from the feedback text: drop a leading "Yes:", cut at the
        // first . , or (, then drop a leading el/la. A typed answer is correct if norm() equals a norm()ed entry of s.acc.
        const inp = host.querySelector('#wu-in'), fb = host.querySelector('.wu-fb'), ans = s.ok.replace(/^Yes: ?/, '').split(/[.,(]/)[0].replace(/^(el|la) /, '').trim(); inp.focus();
        host.querySelector('#wu-form').onsubmit = e => {
          e.preventDefault(); const v = norm(inp.value); if (!v) return;
          if (s.acc.some(a => norm(a) === v)) { if (first) right++; inp.disabled = true; fb.innerHTML = `<b>✓</b> ${esc(s.ok)} <button class="wu-hear one" id="wu-h">${ic('volume', 14)} Hear it</button>${nextBtn()}`; host.querySelector('#wu-next').onclick = go; host.querySelector('#wu-h').onclick = () => hear(ans); }
          else { first = false; tries++; mis++; if (tries >= 2) { inp.disabled = true; fb.innerHTML = `The answer is <b>${esc(ans)}</b>. ${esc(s.hint)}${nextBtn()}`; host.querySelector('#wu-next').onclick = go; } else fb.textContent = 'Not quite. Hint: ' + s.hint; }
        };
        return;
      }
      if (s.t === 'say') {
        host.innerHTML = bar() + tut(`<p>${esc(s.q)}</p><div class="wu-word">${esc(s.w)}</div><div class="wu-act"><button class="btn ghost" id="wu-l">${ic('volume', 14)} Hear it</button>${hasSR ? `<button class="btn" id="wu-s">${ic('mic', 14)} Say it</button>` : ''}</div><div class="wu-fb" aria-live="polite"></div>`) + nextBtn(hasSR ? 'Skip / next' : 'Next'); wire();
        host.querySelector('#wu-l').onclick = () => hear(s.w);
        // "Say it" is not scored toward the unit: the best of the heard alternatives is aligned to the target word and >= 50%
        // shows a pass message and renames the button to Continue (the step can be skipped either way).
        const sb = host.querySelector('#wu-s'), fb = host.querySelector('.wu-fb');
        if (sb) sb.onclick = () => SP.listen(r => { if (r.error) { fb.textContent = 'I could not hear that. Check your microphone, or just say it aloud and continue.'; return; } const p = Math.max.apply(null, r.alts.map(a => SP.align(s.w, a).pct)); fb.innerHTML = p >= .5 ? '<b>✓</b> Good. That matched.' : 'I heard “' + esc(r.text) + '”. Listen again and try once more.'; if (p >= .5) { host.querySelector('#wu-next').textContent = 'Continue'; } }, s2 => { sb.classList.toggle('rec', s2 === 'on'); if (s2 === 'on') fb.textContent = 'Listening…'; else if (fb.textContent === 'Listening…') fb.textContent = ''; });
        host.querySelector('#wu-next').onclick = go; return;
      }
      if (s.t === 'stress') {
        asked++; let first = true;
        host.innerHTML = bar() + tut(`<p><b>Tap the syllable that is stressed.</b></p><div class="wu-sylls">${s.syl.map((y, k) => `<button class="wu-syl" data-k="${k}">${esc(y)}</button>`).join('<span>·</span>')}</div>`) + `<div class="wu-fb" aria-live="polite"></div>`; wire();
        host.querySelectorAll('.wu-syl').forEach(b => b.onclick = () => {
          const k = +b.dataset.k, fb = host.querySelector('.wu-fb');
          if (k === s.a) { b.classList.add('ok'); if (first) right++; host.querySelectorAll('.wu-syl').forEach(x => x.disabled = true); fb.innerHTML = `<b>✓</b> ${esc(s.ok)} <button class="wu-hear one" id="wu-h">${ic('volume', 14)} Hear it</button>${nextBtn()}`; host.querySelector('#wu-next').onclick = go; host.querySelector('#wu-h').onclick = () => hear(s.w); }
          else { first = false; mis++; b.classList.add('bad'); b.disabled = true; fb.textContent = 'Not that one. Remember the two rules.'; }
        });
        return;
      }
    }
    draw();
  }

  /* ---------- public ---------- */
  // Story page panel: units needed for story s (first through(s) units). onChange lets app.js refresh the badge.
  function panel(host, s, onChange) { list(host, through(s), { onChange }); }
  // The standalone #warmup page: all TOTAL units, standalone wording.
  function page() {
    app.innerHTML = `<div class="wrap"><div class="crumbs"><a href="#stories">Home</a><span>›</span>Warm up</div><div class="card wu-panel wu-page" id="wu-host"></div></div>`;
    list(app.querySelector('#wu-host'), TOTAL, { standalone: true });
  }
  return { panel, page, count, through };
})();
