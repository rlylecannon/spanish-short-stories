/* Rule-based Spanish conjugation engine (original code). Exposes Conj.{conjugate, identify, guess}.
 *
 * PURPOSE
 *   Conjugates any Spanish infinitive from rules (regular endings, stem-change lists, spelling rules) plus a
 *   small table of truly irregular verbs (SPECS), so tables work for verbs that are not in the dictionary.
 *
 * LOADING / PUBLIC API
 *   Stand-alone UMD file: in the browser it is its own <script> block and sets window.Conj; under Node it is
 *   module.exports (tools/test_conj.js requires it). It has no dependencies. Returned object:
 *     conjugate(inf)       -> null if inf is not a verb, else (cached, treat as read-only) an object:
 *         { inf, base, refl, type ('ar'|'er'|'ir'), kind ('regular'|'spelling'|'irregular'), irregular, notes[],
 *           gerund, gerundIrr, participle, participleIrr, persons, refl_pron,
 *           tenses: [{ group, key, label, forms, raw, marks }] }
 *         forms = display strings (with reflexive pronoun / enclitics), raw = bare forms, marks = one number
 *         per person: 0 regular, 1 irregular, 2 regular but needs a spelling change. A null entry means
 *         "no such form" (e.g. no yo command). Tense keys are listed in LABELS (pres, pret, impf, fut, cond,
 *         presPerf, pluperf, futPerf, condPerf, sPres, sImpf, sPresPerf, sPluperf, impA, impN).
 *     identify(inf, form)  -> [{ key, tense, persons[], clitic? }]: which tenses/persons of a KNOWN infinitive
 *                             produce this surface form (also accepts forms with attached pronouns).
 *     guess(word)          -> up to 6 [{ inf, matches }]: best-guess infinitives for an unknown conjugated form.
 *     PERSONS, LABELS, scKind(base)  (helpers exposed for callers).
 *   In the app, lookup.js (LK) is the consumer.
 *
 * HOW IT WORKS
 *   build() produces the forms three times: 'naive' (pure regular endings glued on), 'spell' (plus spelling
 *   rules from join()) and 'full' (plus stem changes, SPECS irregulars and irregular participles).
 *   conjugate() compares the three to set marks: full != spell -> 1 (irregular); spell != naive -> 2 (spelling
 *   change only); otherwise 0. The UI colours forms by these marks.
 *
 * SPECS ENTRY FIELDS (irregular verb table; see findSpec for how entries are matched)
 *   roots     infinitive(s) or infinitive endings this entry describes.
 *   exact     1 = base must equal the root exactly (no prefixed compounds such as "contener").
 *   prefixes  allowed prefixes, matched as base === prefix + root ('' = the bare verb). Without exact or
 *             prefixes, any base that merely ends with the root matches (tener -> contener, mantener).
 *   h         per-root text substituted for '#' in the entry's strings (hacer/facer -> h/f; bendecir/maldecir
 *             -> ben/mal; -ducir -> du). Whatever precedes the root (the prefix) is re-attached automatically.
 *   pres/pret/impf/subj   full lists of 6 forms (yo, tú, él, nosotros, vosotros, ellos) that replace the regular ones.
 *   yo        only the yo form of the present (tengo); the subjunctive stem is then derived from it.
 *   pretStem  stem of the irregular preterite; endings are E.pretIrr (-e -iste -o -imos -isteis -ieron;
 *             after a stem ending in j the -ieron ending loses its i: dijeron).
 *   fut       stem for future and conditional (tendr-, har-); default is the whole infinitive.
 *   subjStem  stem for the whole present subjunctive (sep-, oig-); subjOvr = explicit subjunctive list
 *             used when there is no subj list (reír).
 *   imp       tú command (null = the verb has none); impP = the tú command used when a prefix is present
 *             (tener -> ten, but mantener -> mantén needs the written accent); impNos / impVos = override of
 *             the affirmative nosotros / vosotros commands (ir: vamos / id).
 *   part, ger participle and gerund.
 *   sc        stem-change kind for the present (see SC below), overriding scKind().
 *   notes     explanatory sentences shown to the learner under the verb.
 */
// UMD wrapper: browser gets window.Conj, Node (the test script) gets module.exports.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Conj = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // VOW = all vowel letters (incl. accented and ü); STR = the strong vowels a, e, o (used to tell diphthongs from hiatus).
  const VOW = 'aeiouáéíóúü', STR = 'aeoáéó';
  const isV = c => !!c && VOW.includes(c);
  const PERSONS = ['yo', 'tú', 'él / ella / usted', 'nosotros', 'vosotros', 'ellos / ellas / ustedes'];
  const REFL = ['me', 'te', 'se', 'nos', 'os', 'se'];
  // ACC adds a written accent to a vowel; accLast() accents the final letter of a word.
  const ACC = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
  const accLast = s => s.slice(0, -1) + (ACC[s.slice(-1)] || s.slice(-1));

  // Regular endings. pres/pret/impf/subj are indexed by conjugation type, each list in person order
  // (yo, tú, él, nosotros, vosotros, ellos). pretIrr = the unaccented endings of the irregular -uve/-ije type
  // preterite (used with SPECS pretStem). impS (-ra subjunctive) is derived from the preterite instead.
  const E = {
    pres: { ar: ['o', 'as', 'a', 'amos', 'áis', 'an'], er: ['o', 'es', 'e', 'emos', 'éis', 'en'], ir: ['o', 'es', 'e', 'imos', 'ís', 'en'] },
    pret: { ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'], er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
    impf: { ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'], er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'], ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    fut: ['é', 'ás', 'á', 'emos', 'éis', 'án'], cond: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
    subj: { ar: ['e', 'es', 'e', 'emos', 'éis', 'en'], er: ['a', 'as', 'a', 'amos', 'áis', 'an'], ir: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
    pretIrr: ['e', 'iste', 'o', 'imos', 'isteis', 'ieron']
  };

  /* ---------- stem-change lists ---------- */
  // SC maps an infinitive to its present-tense stem-change kind, e.g. pensar -> 'e>ie' (pienso), contar ->
  // 'o>ue' (cuento), pedir -> 'e>i' (pido). The vowel changes only when it is stressed (yo, tú, él, ellos).
  const SC = {};
  // addSC(kind, 'verb verb ...') registers a space-separated list of verbs under a stem-change kind.
  const addSC = (k, s) => s.split(/\s+/).forEach(v => { if (v) SC[v] = k; });
  // Stem-change verbs, one list per kind. The lists contain the base verbs; scKind() also finds prefixed
  // compounds (see SC_PREFIX). Note the -ir verbs in e>ie / o>ue (sentir, dormir) also get i / u in some
  // forms (SC_IR).
  addSC('e>ie', `pensar cerrar empezar comenzar despertar sentar recomendar atravesar confesar negar regar acertar calentar temblar apretar gobernar nevar fregar segar sembrar tropezar tentar mentar serrar helar merendar manifestar plegar quebrar renegar enterrar enmendar entender perder querer defender encender atender extender descender ascender tender contender cegar sentir preferir mentir divertir convertir advertir sugerir herir hervir referir transferir invertir requerir consentir arrepentir discernir diferir inferir conferir interferir`);
  addSC('o>ue', `contar costar encontrar mostrar probar recordar volar sonar soñar rodar rogar colgar forzar almorzar acordar acostar apostar aprobar comprobar demostrar renovar tostar volcar torcer cocer mover poder volver devolver envolver resolver disolver doler llover morder soler dormir morir soltar esforzar avergonzar trocar degollar holgar amoblar engrosar consolar`);
  // freír is deliberately removed from this list by the .replace below, so it gets no e>i stem change here.
  addSC('e>i', `pedir servir seguir repetir elegir vestir medir competir conseguir corregir despedir impedir perseguir reñir teñir gemir concebir derretir rendir proseguir regir expedir embestir ceñir constreñir freír`.replace(' freír', ''));
  // Single or odd stem changes: jugar u>ue (juego), errar e>ye (yerro), oler o>hue (huelo), adquirir i>ie (adquiero).
  addSC('e>ie', 'encomendar'); addSC('u>ue', 'jugar'); addSC('e>ye', 'errar'); addSC('o>hue', 'oler'); addSC('i>ie', 'adquirir inquirir');
  // Compounds inherit the stem change of their base verb (desacordar <- acordar, reconsiderar-type
  // verbs), so instead of listing every compound, scKind() guesses: if the verb starts with one of these prefixes
  // and the rest (at least 4 letters) is in SC, it is assumed to change too.
  const SC_PREFIX = ['re', 'des', 'a', 'en', 'con', 'de', 'pre', 'sobre', 'ex', 'in', 'pro', 'trans', 'dis', 'em', 'es'];
  // Deny list for the prefix guess: these look like prefix + stem-changing verb but are regular
  // (intentar = in+tentar, presentar = pre+sentar, contentar = con+tentar, dispensar = dis+pensar,
  // pretender = pre+tender, derogar = de+rogar).
  const SC_NOT = new Set('intentar presentar contentar dispensar pretender derogar conjugar enjugar'.split(' '));
  addSC('e>ie', 'concertar reventar');
  addSC('o>ue', 'moler absolver'); // moler (muelo) and absolver (absuelvo); the prefix rule then covers demoler, remoler
  // Stem-change kind for an infinitive (null if none): exact list hit, then deny list, then prefix guess.
  function scKind(base) {
    if (SC[base]) return SC[base];
    if (SC_NOT.has(base)) return null;
    for (const p of SC_PREFIX) if (base.startsWith(p) && base.length - p.length >= 4 && SC[base.slice(p.length)]) return SC[base.slice(p.length)];
    return null;
  }
  // For each kind: the stem vowel that changes (SC_FROM) and what it becomes (SC_TO), e.g. 'e>ie': e -> ie.
  const SC_FROM = { 'e>ie': 'e', 'o>ue': 'o', 'e>i': 'e', 'u>ue': 'u', 'e>ye': 'e', 'o>hue': 'o', 'i>ie': 'i' };
  const SC_TO = { 'e>ie': 'ie', 'o>ue': 'ue', 'e>i': 'i', 'u>ue': 'ue', 'e>ye': 'ye', 'o>hue': 'hue', 'i>ie': 'ie' };
  const SC_IR = { 'e>ie': 'i', 'e>i': 'i', 'o>ue': 'u' }; // stem used in gerund, 3rd-person preterite, nos/vos subjunctive for -ir verbs
  // Replace the LAST occurrence of `from` in the stem with `to` (pens + e>ie -> piens); the stressed vowel is the last one in the stem.
  function repLast(stem, from, to) { const i = stem.lastIndexOf(from); return i < 0 ? stem : stem.slice(0, i) + to + stem.slice(i + 1); }

  // Verbs in -iar whose stressed i takes a written accent in the present (enviar -> envío), unlike
  // estudiar -> estudio. Everything not listed is treated as non-accented. Compounds with des-/re- are also looked up.
  const IAR_ACC = new Set('enviar guiar confiar fiar esquiar variar vaciar enfriar ampliar criar resfriar espiar liar desviar extraviar fotografiar contrariar ansiar rociar repatriar expatriar aliar porfiar desafiar amnistiar vaciar telegrafiar'.split(' '));
  // (Currently not referenced anywhere: -uar verbs are handled in build() by the rule stem ends in u, not cu/gu.)
  const UAR_ACC = new Set('continuar actuar graduar situar efectuar acentuar evaluar insinuar habituar puntuar valuar redituar atenuar fluctuar devaluar conceptuar'.split(' '));
  // Hiatus verbs that need an accent inside the stem: [letters in the stem, accented replacement],
  // e.g. aislar ai -> aí (aíslo), prohibir hi -> hí (prohíbo). rehuir has an empty list = no change.
  const ACCMAP = { aislar: ['ai', 'aí'], aunar: ['au', 'aú'], prohibir: ['hi', 'hí'], reunir: ['eu', 'eú'], rehusar: ['hu', 'hú'], aullar: ['au', 'aú'], maullar: ['au', 'aú'], ahumar: ['hu', 'hú'], enraizar: ['ai', 'aí'], desahuciar: ['hu', 'hú'], rehuir: [] };
  // -cer verbs with a vowel before -cer that still change c -> z like consonant+cer verbs
  // (mecer -> mezo, cocer -> cuezo) instead of taking -zco like conocer.
  const CONS_CER = new Set('mecer remecer cocer recocer escocer'.split(' '));

  /* ---------- irregular specs ---------- */
  // (The comment below describes the SPECS table; see also the header of this file for every field.)
  // strings: '#' = root letter(s) (for hacer/facer and ben/mal-decir); prefix is prepended automatically.
  const SPECS = [
    { roots: ['ser'], exact: 1, pres: ['soy', 'eres', 'es', 'somos', 'sois', 'son'], pret: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'], impf: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'], subj: ['sea', 'seas', 'sea', 'seamos', 'seáis', 'sean'], imp: 'sé', part: 'sido', ger: 'siendo', notes: ['Completely irregular: ser is one of the most irregular verbs in Spanish.'] },
    { roots: ['ir'], exact: 1, pres: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'], pret: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'], impf: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'], subj: ['vaya', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan'], imp: 've', impNos: 'vamos', impVos: 'id', part: 'ido', ger: 'yendo', notes: ['Completely irregular. The preterite of ir is identical to the preterite of ser.'] },
    { roots: ['estar'], exact: 1, pres: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'], pretStem: 'estuv', subj: ['esté', 'estés', 'esté', 'estemos', 'estéis', 'estén'], imp: 'está', notes: ['Irregular yo form (estoy), written accents on most present forms, and the irregular preterite stem estuv-.'] },
    { roots: ['dar'], exact: 1, pres: ['doy', 'das', 'da', 'damos', 'dais', 'dan'], pret: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'], subj: ['dé', 'des', 'dé', 'demos', 'deis', 'den'], imp: 'da', notes: ['Irregular yo form (doy) and an -er/-ir style preterite (di, diste, dio…).'] },
    { roots: ['haber'], exact: 1, pres: ['he', 'has', 'ha', 'hemos', 'habéis', 'han'], pretStem: 'hub', fut: 'habr', subj: ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'], imp: null, notes: ['Auxiliary verb for the perfect tenses (he comido). Irregular present, preterite stem hub-, future stem habr-.'] },
    { roots: ['saber'], exact: 1, yo: 'sé', pretStem: 'sup', fut: 'sabr', subjStem: 'sep', notes: ['Irregular yo form (sé), preterite stem sup-, future stem sabr-, subjunctive stem sep-.'] },
    { roots: ['caber'], exact: 1, yo: 'quepo', pretStem: 'cup', fut: 'cabr', notes: ['Irregular yo form (quepo), preterite stem cup-, future stem cabr-.'] },
    { roots: ['poder'], exact: 1, pretStem: 'pud', fut: 'podr', ger: 'pudiendo', notes: ['Irregular preterite stem pud-, future stem podr-, and the gerund pudiendo.'] },
    { roots: ['querer'], exact: 1, pretStem: 'quis', fut: 'querr', notes: ['Irregular preterite stem quis-, future stem querr-.'] },
    { roots: ['andar'], prefixes: ['', 'des'], pretStem: 'anduv', notes: ['Irregular preterite stem anduv-.'] },
    { roots: ['tener'], sc: 'e>ie', yo: 'tengo', pretStem: 'tuv', fut: 'tendr', imp: 'ten', impP: 'tén', notes: ['Irregular yo form (tengo), preterite stem tuv-, future stem tendr-, irregular tú command (ten).'] },
    { roots: ['venir'], sc: 'e>ie', yo: 'vengo', pretStem: 'vin', fut: 'vendr', imp: 'ven', impP: 'vén', ger: 'viniendo', notes: ['Irregular yo form (vengo), preterite stem vin-, future stem vendr-, irregular tú command (ven).'] },
    { roots: ['poner'], yo: 'pongo', pretStem: 'pus', fut: 'pondr', imp: 'pon', impP: 'pón', part: 'puesto', notes: ['Irregular yo form (pongo), preterite stem pus-, future stem pondr-, participle puesto.'] },
    { roots: ['hacer', 'facer'], h: ['h', 'f'], yo: '#ago', pret: ['#ice', '#iciste', '#izo', '#icimos', '#icisteis', '#icieron'], fut: '#ar', imp: '#az', part: '#echo', notes: ['Irregular yo form (hago), irregular preterite (hice, hizo…), future stem har-, participle hecho.'] },
    { roots: ['bendecir', 'maldecir'], exact: 1, h: ['ben', 'mal'], yo: '#digo', pretStem: '#dij', ger: '#diciendo', sc: 'e>i', notes: ['Like decir in the present and preterite, but regular in the future, conditional, command and participle.'] },
    { roots: ['decir'], yo: 'digo', sc: 'e>i', pretStem: 'dij', fut: 'dir', imp: 'di', impP: 'dice', part: 'dicho', notes: ['Stem change e → i, irregular yo form (digo), preterite stem dij-, future stem dir-, participle dicho.'] },
    { roots: ['salir'], yo: 'salgo', fut: 'saldr', imp: 'sal', notes: ['Irregular yo form (salgo), future stem saldr-, irregular tú command (sal).'] },
    { roots: ['valer'], yo: 'valgo', fut: 'valdr', imp: 'vale', notes: ['Irregular yo form (valgo) and future stem valdr-.'] },
    { roots: ['traer'], yo: 'traigo', pretStem: 'traj', ger: 'trayendo', part: 'traído', notes: ['Irregular yo form (traigo), preterite stem traj-, gerund trayendo.'] },
    { roots: ['caer'], yo: 'caigo', ger: 'cayendo', part: 'caído', notes: ['Irregular yo form (caigo); i → y in some preterite forms and the gerund.'] },
    { roots: ['ver'], prefixes: ['', 'pre', 'entre', 're', 'ante'], pres: ['veo', 'ves', 've', 'vemos', 'veis', 'ven'], pret: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'], impf: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'], subjStem: 've', imp: 've', impP: 'vé', part: 'visto', ger: 'viendo', notes: ['Irregular yo form (veo), irregular imperfect (veía…), participle visto.'] },
    { roots: ['oír'], prefixes: ['', 'des', 'entre'], pres: ['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen'], pret: ['oí', 'oíste', 'oyó', 'oímos', 'oísteis', 'oyeron'], subjStem: 'oig', fut: 'oir', imp: 'oye', part: 'oído', ger: 'oyendo', notes: ['Irregular yo form (oigo), y in several forms (oyes, oyó, oyendo), accents on oí, oíste, oímos.'] },
    { roots: ['reír'], pres: ['río', 'ríes', 'ríe', 'reímos', 'reís', 'ríen'], pret: ['reí', 'reíste', 'rio', 'reímos', 'reísteis', 'rieron'], subjStem: 'rí', subjOvr: ['ría', 'rías', 'ría', 'riamos', 'riáis', 'rían'], fut: 'reir', imp: 'ríe', part: 'reído', ger: 'riendo', notes: ['Stem change e → i with written accents (río, ríes…).'] },
    { roots: ['ducir'], yo: '#zco', pretStem: '#j', h: ['du'], notes: ['Verbs in -ducir: irregular yo form (-zco), preterite stem -duj-.'] },
    { roots: ['asir'], prefixes: ['', 'des'], yo: 'asgo', notes: ['Irregular yo form (asgo).'] }
  ];
  // Find the irregular spec for an infinitive: first matching entry wins. Returns { sp, pref, h } where pref is
  // the prefix in front of the root (e.g. 'con' for contener) and h the text replacing '#' in the entry's strings.
  function findSpec(base) {
    for (const sp of SPECS) {
      for (let i = 0; i < sp.roots.length; i++) {
        const r = sp.roots[i];
        if (sp.exact ? base === r : sp.prefixes ? sp.prefixes.some(p => base === p + r) : base.endsWith(r)) {
          // decir must not claim bendecir / maldecir: they have their own entry (regular future, command and participle).
          if (sp.roots[0] === 'decir' && /^(ben|mal)decir$/.test(base)) continue;
          let h = sp.h ? sp.h[i] : '';
          // All -ducir verbs share one root, so '#' always means 'du' (conducir -> conduzco, condujo).
          if (sp.roots[0] === 'ducir') h = 'du';
          return { sp, pref: sp.exact ? '' : base.slice(0, base.length - r.length), h };
        }
      }
    }
    return null;
  }

  /* ---------- orthography ---------- */
  // Maps accented ending vowels to plain ones so that e.g. the preterite ending é counts as an 'e' ending in join().
  const ACCR = { 'á': 'a', 'é': 'e', 'ó': 'o' };
  // Glue a stem and an ending, applying Spanish spelling rules when opt.spell is set. c = flags describing the
  // infinitive (car, gar, zar, guar, gerGir, guir, consC, uir; built in build()). e0 = first letter of the
  // ending without accent. Rules, in order (only one of the first group applies):
  // - c -> qu before e (to keep the k sound): tocar -> toqué
  // - g -> gu before e: pagar -> pagué;  z -> c before e: empezar -> empecé;  gu -> gü before e: averiguar -> averigüé
  // - g -> j before a/o (-ger/-gir verbs): coger -> cojo;  gu -> g before a/o (-guir): seguir -> sigo
  // - c -> z before a/o after a consonant (-cer/-cir): vencer -> venzo
  function join(stem, end, c, opt) {
    let s = stem, e = end;
    if (opt.spell) {
      const e0 = (ACCR[e[0]] || e[0]);
      if (c.car && s.endsWith('c') && e0 === 'e') s = s.slice(0, -1) + 'qu';
      else if (c.gar && s.endsWith('g') && e0 === 'e') s += 'u';
      else if (c.zar && s.endsWith('z') && e0 === 'e') s = s.slice(0, -1) + 'c';
      else if (c.guar && s.endsWith('gu') && e0 === 'e') s = s.slice(0, -2) + 'gü';
      else if (c.gerGir && s.endsWith('g') && (e0 === 'a' || e0 === 'o')) s = s.slice(0, -1) + 'j';
      else if (c.guir && s.endsWith('gu') && (e0 === 'a' || e0 === 'o')) s = s.slice(0, -1);
      else if (c.consC && s.endsWith('c') && (e0 === 'a' || e0 === 'o')) s = s.slice(0, -1) + 'z';
      // No-op placeholder: this flag is never set anywhere.
      else if (c.sc_gar_zar_ok) { /* placeholder */ }
      // Unstressed i between two vowels becomes y: leer + ió -> leyó, leyeron (not after gu/qu: seguió).
      // vowel-ending stems: unstressed i between vowels becomes y
      if (/^(ie|ió)/.test(e) && s.length && 'aeou'.includes(s.slice(-1)) && !/(g|q)u$/.test(s)) e = 'y' + e.slice(1);
      // After a stem ending in a/e/o the i of -iste/-imos/-isteis is stressed and gets an accent (hiatus): leer -> leíste, leímos.
      if (/^i(ste|mos|steis)$/.test(e) && /[aeo]$/.test(s)) e = 'í' + e.slice(1);
      // -uir verbs add y before a, e, o: construir -> construyo, construyes.
      // -uir verbs: add y before a, e, o
      if (c.uir && /^[aeo]/.test(e)) s += 'y';
      // The i of -ió / -ieron / -iendo is dropped after ñ, ll (tañó, bulleron) and after j in irregular j-stems (dijeron).
      // i drops after ñ, ll, and irregular j-stems
      if (/^(ie|ió)/.test(e) && (/(ñ|ll)$/.test(s) || (opt.pretJ && s.endsWith('j')))) e = e.slice(1);
      if (opt.pretJ && s.endsWith('j') && /^i[eó]/.test(e)) e = e.slice(1);
    }
    return s + e;
  }

  /* ---------- core builder ---------- */
  // Normalise an infinitive: strip a reflexive -se (levantarse -> levantar, refl = true), reject non-verbs
  // (null) and split into type (ar/er/ir; -ír counts as ir) and stem. Note the -se regex also accepts -ír + se.
  function analyse(inf) {
    let b = inf.trim().toLowerCase(), refl = false;
    if (/(ar|er|ir|ír)se$/.test(b)) { refl = true; b = b.slice(0, -2); }
    if (!/(ar|er|ir|ír)$/.test(b) || b.length < 2) return null;
    let type = b.slice(-2).replace('ír', 'ir'); if (b.endsWith('ír')) type = 'ir';
    const stem = b.slice(0, -2);
    const vowelBefore = /[aeiouáéíóú](cer|cir)$/.test(b);
    return { inf: b, refl, type, stem };
  }

  // Build every simple form (present, preterite, imperfect, future, conditional, subjunctive, -ra subjunctive,
  // gerund, participle) for one infinitive in the given mode: 'naive' | 'spell' | 'full' (see header). Only 'full'
  // uses SPECS, stem changes, -zco verbs and irregular participles. Returns the lists plus the flags used for notes.
  function build(base, type, stem, mode) {
    // mode: 'naive' | 'spell' | 'full'
    const opt = { spell: mode !== 'naive' };
    const full = mode === 'full';
    const found = full ? findSpec(base) : null;
    const spec = found ? found.sp : null;
    // R: take a SPECS string and put the prefix back and replace '#' with the root letters (found.h).
    const R = s => !s ? s : (found ? found.pref + s.replace(/#/g, found.h) : s);
    // Accented replacements for the endings of ver, used for compounds (prever -> prevés, previó).
    const VER_ACC = { ves: 'vés', ve: 'vé', veis: 'véis', ven: 'vén', vi: 'ví', vio: 'vió' };
    // monoFix: ver / vi / vio / ves / ve / ven are one syllable so they carry no accent, but once a prefix is
    // added the word is no longer a monosyllable and the usual accent rules apply (ves -> prevés, vio -> previó).
    // sonreír-type verbs (prefix other than f, i.e. not freír) likewise need rió in the preterite.
    // compounds of ver (prever, rever…) and polysyllabic -reír verbs (sonreír) are no longer monosyllables, so they need written accents
    const monoFix = s => {
      if (!found || !found.pref || typeof s !== 'string') return s;
      if (spec.roots[0] === 'ver') return s.replace(/(ves|ve|veis|ven|vi|vio)$/, m => VER_ACC[m]);
      if (spec.roots[0] === 'reír' && found.pref !== 'f') return s.replace(/rio$/, 'rió');
      return s;
    };
    // rs: R applied to a spec list (and monoFix for each element) or to a single string.
    const rs = (v) => Array.isArray(v) ? v.map(x => monoFix(R(x))) : R(v);
    // c: spelling flags derived from the infinitive ending.
    const c = {
      car: /car$/.test(base), gar: /gar$/.test(base), zar: /zar$/.test(base), guar: /guar$/.test(base),
      gerGir: /g(er|ir)$/.test(base), guir: /guir$/.test(base),
      cerCir: /(cer|cir)$/.test(base)
    };
    // consC: -cer/-cir after a consonant (or in CONS_CER) -> c becomes z before a/o (vencer -> venzo).
    c.consC = c.cerCir && (CONS_CER.has(base) || !/[aeiouáéíóú](cer|cir)$/.test(base));
    // zc: -cer/-cir after a vowel without an explicit yo form -> yo ends in -zco (conocer -> conozco, whole present subjunctive too).
    const zc = c.cerCir && !c.consC && !(spec && spec.yo);
    // uir: -uir verbs, excluding -guir/-quir (seguir, delinquir) where the u is silent.
    c.uir = /uir$/.test(base) && !/(gu|qu)ir$/.test(base);
    if (!opt.spell) { c.uir = false; }
    // sck: stem-change kind; only in 'full' mode. A spec's sc overrides the list lookup.
    const sck = full ? (spec && spec.sc ? spec.sc : scKind(base)) : null;
    // scStem: stem with the stressed-vowel change (pens -> piens). Special case: o>ue after g (avergonzar -> avergüenzo,
    // the regex turns go+consonants into güe+consonants so the g stays hard).
    const scStem = sck ? (sck === 'o>ue' && /go[^aeiouáéíóú]*$/.test(stem) ? stem.replace(/go([^aeiouáéíóú]*)$/, 'güe$1') : repLast(stem, SC_FROM[sck], SC_TO[sck])) : stem;
    // scIrStem: for -ir verbs, the weaker stem (e>ie / e>i -> i, o>ue -> u) used where the stress is NOT on the stem:
    // él/ellos preterite, nosotros/vosotros subjunctive and the gerund (sintió, durmiendo).
    const scIrStem = sck && type === 'ir' && SC_IR[sck] ? repLast(stem, SC_FROM[sck], SC_IR[sck]) : stem;
    // pretJ: the irregular preterite stem ends in j (dij-, traj-, cond-uj-) which drops the i of -ieron.
    const pretJ = !!(spec && (spec.pretStem || '').replace(/#/g, '').endsWith('j'));
    // accI: true when the verb needs the accented í/ú in the stressed present forms: -iar verbs listed in IAR_ACC
    // (envío), -uar verbs (continúo; not -cuar/-guar), and ACCMAP verbs (aíslo).
    const accI = opt.spell && ((type === 'ar' && ((stem.endsWith('i') && (IAR_ACC.has(base) || ['des', 're'].some(p => base.startsWith(p) && base.length - p.length >= 5 && IAR_ACC.has(base.slice(p.length))))) || (stem.endsWith('u') && !/(c|g)u$/.test(stem)))) || !!(ACCMAP[base] && ACCMAP[base].length));
    // accS: apply that accent to a stem.
    const accS = s => { if (!accI) return s; const m = ACCMAP[base]; if (m && m.length) { const k = s.lastIndexOf(m[0]); return k < 0 ? s : s.slice(0, k) + m[1] + s.slice(k + m[0].length); } return s.slice(0, -1) + (s.slice(-1) === 'i' ? 'í' : 'ú'); };
    const J = (s, e, o) => join(s, e, c, o || opt);

    // Persons are indexed 0..5 (yo, tú, él, nosotros, vosotros, ellos). Indices [0,1,2,5] are the stressed-stem forms
    // that take the stem change; 3 and 4 (nosotros, vosotros) keep the plain stem.
    // ----- present -----
    let pres;
    if (spec && spec.pres) pres = rs(spec.pres);
    else {
      pres = E.pres[type].map((e, i) => {
        const st = [0, 1, 2, 5].includes(i) ? scStem : stem;
        let s = st;
        if ([0, 1, 2, 5].includes(i)) s = accS(s);
        return J(s, e);
      });
      if (zc && full) pres[0] = stem.slice(0, -1) + 'zc' + 'o';
      if (spec && spec.yo) pres[0] = R(spec.yo);
    }
    // Order: spec's full list, else spec's pretStem + irregular endings, else regular endings (with the -ir stem for él/ellos).
    // ----- preterite -----
    let pret;
    if (spec && spec.pret) pret = rs(spec.pret);
    else if (spec && spec.pretStem) { const ps = R(spec.pretStem); pret = E.pretIrr.map((e, i) => ps.endsWith('j') && /^ie/.test(e) ? ps + e.slice(1) : ps + e); }
    else pret = E.pret[type].map((e, i) => J([2, 5].includes(i) && type === 'ir' ? scIrStem : stem, e));
    // ----- imperfect -----
    const impf = spec && spec.impf ? rs(spec.impf) : E.impf[type].map(e => J(stem, e));
    // Future and conditional both attach to the same stem: the whole infinitive unless the spec gives one (tendr-).
    // ----- future / conditional -----
    const fstem = spec && spec.fut ? R(spec.fut) : base.replace(/ír$/, 'ir');
    const fut = E.fut.map(e => fstem + e), cond = E.cond.map(e => fstem + e);
    // The subjunctive comes from the yo form of the present minus -o (tengo -> teng-; also -zco and -uir verbs, oír, ver)
    // when yoBased; otherwise from the stem with the stem change on persons 0,1,2,5 and the -ir stem on 3,4 (durmamos).
    // ----- present subjunctive -----
    let subj;
    if (spec && spec.subj) subj = rs(spec.subj);
    else if (spec && spec.subjOvr) subj = rs(spec.subjOvr);
    else {
      const yo = pres[0];
      const yoBased = (spec && (spec.yo || spec.subjStem)) || zc || c.uir || (found && /^(oír|ver)$/.test(spec.roots[0]));
      subj = E.subj[type].map((e, i) => {
        let s;
        if (spec && spec.subjStem) s = R(spec.subjStem);
        else if (yoBased && yo.endsWith('o')) {
          s = yo.slice(0, -1);
          if (c.uir && opt.spell && !s.endsWith('y')) s += 'y';
        } else if (!yoBased) {
          s = [0, 1, 2, 5].includes(i) ? scStem : ([3, 4].includes(i) && type === 'ir' ? scIrStem : stem);
          if ([0, 1, 2, 5].includes(i)) s = accS(s);
        } else s = stem;
        return J(s, e);
      });
      if (c.uir && opt.spell) subj = E.subj[type].map(e => J(stem + 'y', e).replace(/yy/, 'y'));
    }
    // Built from the ellos preterite minus -ron (hablaron -> habla + ra...). The nosotros form gets a written accent on
    // the vowel before -ramos (habláramos).
    // ----- imperfect subjunctive (-ra) -----
    const impS = pret[5].endsWith('ron') ? (() => { const st = pret[5].slice(0, -3); return ['ra', 'ras', 'ra', 'ramos', 'rais', 'ran'].map((e, i) => (i === 3 ? accLast(st) : st) + e); })() : [];
    // Gerund: -ando, or -iendo via join() (so leyendo, tañendo come out right). Participle: spec, irrPart(), or regular -ado/-ido (-ído after a/e/o: leído).
    // ----- gerund / participle -----
    let ger, part;
    if (spec && spec.ger) ger = R(spec.ger);
    else if (type === 'ar') ger = stem + 'ando';
    else ger = J(scIrStem, 'iendo');
    if (full) {
      part = spec && spec.part ? R(spec.part) : irrPart(base);
    }
    if (!part) part = type === 'ar' ? stem + 'ado' : stem + (opt.spell && /[aeo]$/.test(stem) ? 'ído' : 'ido');
    return { pres, pret, impf, fut, cond, subj, impS, ger, part, spec, found, sck, c, zc, accI, pretJ };
  }
  // Irregular participles by infinitive ending, so compounds work too (descubrir -> descubierto, componer -> compuesto,
  // reescribir -> reescrito). bendecir / maldecir are excluded (regular bendecido). ver compounds -> visto.
  function irrPart(base) {
    const r = [[/abrir$/, 'abierto'], [/cubrir$/, 'cubierto'], [/scribir$/, 'scrito'], [/poner$/, 'puesto'], [/volver$/, 'vuelto'], [/solver$/, 'suelto'],
      [/romper$/, 'roto'], [/pudrir$/, 'podrido'], [/decir$/, 'dicho'], [/morir$/, 'muerto'], [/freír$/, 'frito'], [/imprimir$/, 'impreso'], [/hacer$/, 'hecho']];
    for (const [re, rep] of r) if (re.test(base) && !(rep === 'dicho' && /^(ben|mal)decir$/.test(base))) return base.replace(re, rep);
    if (/^(pre|entre|re)?ver$/.test(base)) return base.replace(/ver$/, 'visto');
    return null;
  }

  // Despite its name, returns the syllable nuclei of a word as [start, end) index pairs: runs of vowels are grouped as
  // diphthongs unless an accented í/ú is present or two strong vowels (a, e, o) meet (hiatus: le-er, ca-er).
  // The number of groups = the number of syllables.
  function accentStress(word) {
    // add written accent where needed when a pronoun is attached (stress stays on the original syllable)
    const groups = []; let i = 0;
    while (i < word.length) {
      if (!isV(word[i])) { i++; continue; }
      let j = i + 1;
      while (j < word.length && isV(word[j]) && !'íú'.includes(word[j]) && !'íú'.includes(word[j - 1]) && !(STR.includes(word[j - 1]) && STR.includes(word[j]))) j++;
      groups.push([i, j]); i = j;
    }
    return groups;
  }
  // DEACC removes a written accent from a vowel.
  const DEACC = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
  // Attach a pronoun to an affirmative command and fix the written accent. Steps: find the stressed syllable (the one
  // with a written accent, else the default stress: second-to-last syllable when the word ends in a vowel, n or s,
  // otherwise the last); inside it the accent goes on the existing accent, else the strong vowel, else the last vowel;
  // count the syllables after it (including the pronoun's). Two or more -> accent needed (siéntate, cállate),
  // otherwise the accent is removed (dé + se = dese, mantén + te = mantente).
  function addEnclitic(form, pron) {
    // form: imperative without pronoun; returns it with the pronoun attached and the written accent the spelling rules require.
    // The stressed syllable stays where it was; it takes an accent only if it ends up third from the end or earlier (siéntate, cállate, ríete),
    // and an accent the bare form needed only for final stress is dropped (mantén + te = mantente, haz + te = hazte, dé + se = dese).
    const w = form;
    const g = accentStress(w); if (!g.length) return w + pron;
    let sIdx = g.findIndex(([a, b]) => /[áéíóú]/.test(w.slice(a, b)));
    if (sIdx < 0) {
      const last = w.slice(-1);
      sIdx = (isV(last) || last === 'n' || last === 's') ? g.length - 2 : g.length - 1;
      if (sIdx < 0) return w + pron;
    }
    const [a, b] = g[sIdx]; const seg = w.slice(a, b); let pos = a;
    const k = seg.search(/[áéíóú]/);
    if (k >= 0) pos = a + k;
    else if (seg.length > 1) { const k2 = [...seg].findIndex(ch => STR.includes(ch)); pos = a + (k2 >= 0 ? k2 : seg.length - 1); }
    const after = (g.length - 1 - sIdx) + Math.max(1, accentStress(pron).length);
    const ch = DEACC[w[pos]] || w[pos];
    return w.slice(0, pos) + (after >= 2 ? (ACC[ch] || ch) : ch) + w.slice(pos + 1) + pron;
  }

  /* ---------- public: conjugate ---------- */
  // Tense table: [group, key, English label]. The order is the display order. group: ind / perf / subj / imp.
  const LABELS = [
    ['ind', 'pres', 'Present'], ['ind', 'pret', 'Preterite'], ['ind', 'impf', 'Imperfect'], ['ind', 'fut', 'Future'], ['ind', 'cond', 'Conditional'],
    ['perf', 'presPerf', 'Present perfect'], ['perf', 'pluperf', 'Pluperfect'], ['perf', 'futPerf', 'Future perfect'], ['perf', 'condPerf', 'Conditional perfect'],
    ['subj', 'sPres', 'Present subjunctive'], ['subj', 'sImpf', 'Imperfect subjunctive'], ['subj', 'sPresPerf', 'Present perfect subjunctive'], ['subj', 'sPluperf', 'Pluperfect subjunctive'],
    ['imp', 'impA', 'Commands (affirmative)'], ['imp', 'impN', 'Commands (negative)']
  ];
  // Results are cached per infinitive (key '*' marks the reflexive version); callers must not modify the returned object.
  const cache = {};
  // Main entry point. Builds the three modes, then assembles all 15 tenses, commands, notes and the kind summary.
  function conjugate(inf) {
    const a = analyse(inf); if (!a) return null;
    const key = a.inf + (a.refl ? '*' : ''); if (cache[key]) return cache[key];
    const naive = build(a.inf, a.type, a.stem, 'naive'), spell = build(a.inf, a.type, a.stem, 'spell'), full = build(a.inf, a.type, a.stem, 'full');
    // (Not used below: the compound tenses use hb.)
    const haber = a.inf === 'haber' ? null : conjugateRaw('haber');
    const pr = i => a.refl ? REFL[i] + ' ' : '';
    // mark: 1 if the full form differs from the spelling-only form (irregular), 2 if only the spelling form differs from the naive one, else 0.
    const mark = (f, s, n) => f.map((x, i) => x !== s[i] ? 1 : (s[i] !== n[i] ? 2 : 0));
    const T = {};
    T.pres = { raw: full.pres, m: mark(full.pres, spell.pres, naive.pres) };
    T.pret = { raw: full.pret, m: mark(full.pret, spell.pret, naive.pret) };
    T.impf = { raw: full.impf, m: mark(full.impf, spell.impf, naive.impf) };
    T.fut = { raw: full.fut, m: mark(full.fut, spell.fut, naive.fut) };
    T.cond = { raw: full.cond, m: mark(full.cond, spell.cond, naive.cond) };
    T.sPres = { raw: full.subj, m: mark(full.subj, spell.subj, naive.subj) };
    T.sImpf = { raw: full.impS, m: mark(full.impS, spell.impS, naive.impS) };
    // Compound tenses = a form of haber + the participle (marks all 0: only the participle can be irregular, tracked as partIrr).
    const hb = conjugateRaw('haber');
    const withHaber = (hf, p) => hf.map(h => h + ' ' + p);
    const part = full.part, partIrr = part !== spell.part ? 1 : (part !== naive.part ? 2 : 0);
    T.presPerf = { raw: withHaber(hb.pres, part), m: [0, 0, 0, 0, 0, 0] };
    T.pluperf = { raw: withHaber(hb.impf, part), m: [0, 0, 0, 0, 0, 0] };
    T.futPerf = { raw: withHaber(hb.fut, part), m: [0, 0, 0, 0, 0, 0] };
    T.condPerf = { raw: withHaber(hb.cond, part), m: [0, 0, 0, 0, 0, 0] };
    T.sPresPerf = { raw: withHaber(hb.subj, part), m: [0, 0, 0, 0, 0, 0] };
    T.sPluperf = { raw: hb.impS.map(h => h + ' ' + part), m: [0, 0, 0, 0, 0, 0] };
    // Affirmative commands by person [yo (none), tú, usted, nosotros, vosotros, ustedes]. tú = the él present form unless the
    // spec says otherwise (hablar: habla; tener: ten; spec.imp null = no command). Usted/nosotros/ustedes borrow the
    // present subjunctive. Vosotros = infinitive with -r replaced by -d (hablad; oír -> oíd).
    // commands
    const sp = full.spec, f = full.found;
    let tu = full.pres[2];
    if (sp && sp.imp !== undefined) tu = sp.imp === null ? null : (f.pref && sp.impP ? f.pref + sp.impP.replace(/#/g, f.h) : f.pref + sp.imp.replace(/#/g, f.h));
    if (sp && sp.roots[0] === 'ver' && f.pref) tu = f.pref + 'vé';
    // (vos is not used below; vos2 is the value actually used.)
    const vos = sp && sp.impVos ? sp.impVos : a.inf.slice(0, -1).replace(/ír$/, 'ír') + 'd';
    const vos2 = a.inf.endsWith('ír') ? a.inf.slice(0, -2) + 'íd' : a.inf.slice(0, -1) + 'd';
    const nosAff = sp && sp.impNos ? sp.impNos : full.subj[3];
    // (Unused helper.)
    const nosForm = (s) => s;
    let affRaw = [null, tu, full.subj[2], nosAff, sp && sp.impVos ? sp.impVos : vos2, full.subj[5]];
    // Reflexive display forms: nosotros drops the final s before nos (levantemos -> levantémonos); vosotros drops the d
    // (levantad -> levantaos, with -id verbs -> -íos: vestíos); the rest go through addEnclitic (levántate, levántese).
    let affDisp = affRaw.map((w, i) => {
      if (!w) return null;
      if (!a.refl) return w;
      if (i === 3) return addEnclitic(w.replace(/s$/, ''), 'nos');
      if (i === 4) return /id$/.test(w) ? w.slice(0, -2) + 'íos' : w.slice(0, -1).replace(/d$/, '') + 'os';
      return addEnclitic(w, ['', 'te', 'se', '', '', 'se'][i]);
    });
    // Special case: irse -> idos (vosotros).
    if (a.refl && a.inf === 'ir') affDisp[4] = 'idos';
    // Negative commands: no + pronoun + present subjunctive (no te levantes); no yo form.
    const negRaw = [null, full.subj[1], full.subj[2], full.subj[3], full.subj[4], full.subj[5]];
    const negDisp = negRaw.map((w, i) => w ? 'no ' + pr(i) + w : null);
    T.impA = { raw: affRaw, disp: affDisp, m: [0, tu !== null && tu !== spell.pres[2] ? 1 : (full.pres[1] !== spell.pres[1] || 0) ? 1 : 0, 0, 0, 0, 0] };
    // The marks set on the previous line are replaced here: each command is compared with the regular formation
    // (tú with the regular él present, the rest with the regular subjunctive); vosotros is never marked.
    // mark commands irregular when they differ from regular formation
    const regTu = spell.pres[2], regUd = spell.subj[2];
    T.impA.m = affRaw.map((w, i) => !w ? 0 : (i === 1 ? (w !== regTu ? 1 : (full.pres[2] !== spell.pres[2] ? 1 : 0)) : i === 2 ? (w !== regUd ? 1 : 0) : i === 3 ? (w !== spell.subj[3] ? 1 : 0) : i === 4 ? 0 : (w !== spell.subj[5] ? 1 : 0)));
    T.impN = { raw: negRaw, disp: negDisp, m: negRaw.map((w, i) => !w ? 0 : (w !== spell.subj[i] ? 1 : (spell.subj[i] !== naive.subj[i] ? 2 : 0))) };

    // Final per-tense objects: forms = display (reflexive pronoun prefixed, or the special command display), raw = bare.
    const tenses = LABELS.map(([g, k, label]) => {
      const t = T[k];
      const disp = t.disp || t.raw.map((w, i) => w == null ? null : pr(i) + w);
      return { group: g, key: k, label, forms: disp, raw: t.raw, marks: t.m };
    });
    // Learner-facing notes: the spec's own notes first, then generated ones for stem change, -zco, spelling changes, participle.
    // notes
    const notes = [];
    if (sp) sp.notes.forEach(n => notes.push(n));
    const sck = full.sck;
    if (sck && !(sp && sp.sc === 'e>i' && sp.roots[0] === 'decir')) {
      const ir = a.type === 'ir' && SC_IR[sck];
      notes.push(`Stem change ${sck.replace('>', ' → ')}: the vowel in the stem changes when it is stressed (yo, tú, él/ella/usted, ellos).` + (ir ? ` Because it is an -ir verb, the stem also changes to ${SC_IR[sck]} in the él/ellos preterite, the gerund and the nosotros/vosotros subjunctive.` : ''));
    }
    if (full.zc) notes.push('Irregular yo form: -zco (also used in the whole present subjunctive).');
    const c = full.c;
    if (c.car) notes.push('Spelling change: c → qu before e (to keep the k sound), e.g. yo form of the preterite.');
    if (c.gar) notes.push('Spelling change: g → gu before e (to keep the hard g sound).');
    if (c.zar) notes.push('Spelling change: z → c before e.');
    if (c.guar) notes.push('Spelling change: gu → gü before e (so the u is pronounced).');
    if (c.gerGir && !full.sp) notes.push('Spelling change: g → j before o and a (to keep the soft Spanish j sound).');
    if (c.guir) notes.push('Spelling change: gu → g before o and a.');
    if (c.consC && c.cerCir) notes.push('Spelling change: c → z before o and a.');
    if (c.uir && !(full.sp)) notes.push('-uir verbs add a y before a, e, o (construyo) and change i → y between vowels (construyó, construyendo).');
    if (full.accI) notes.push('Written accent on the í/ú in the yo, tú, él and ellos forms of the present (envío, continúo).');
    if (/^[^]*[aeo]er$/.test(a.inf) && !sp) notes.push('i → y between vowels (leyó, leyeron, leyendo), with a written accent on leí, leíste…');
    if (/(ñ|ll)(er|ir)$/.test(a.inf)) notes.push('The i of -ió / -ieron / -iendo is dropped after ñ and ll (tañó, bulleron).');
    if (partIrr === 1 && !(sp && sp.part)) notes.push(`Irregular participle: ${part}.`);
    // irregular = anything marked 1 (or irregular gerund / participle); kind = 'spelling' when only 2-marks exist.
    const irregular = tenses.some(t => t.marks.some(m => m === 1)) || partIrr === 1 || full.ger !== spell.ger;
    const spelling = !irregular && tenses.some(t => t.marks.some(m => m === 2));
    const kind = irregular ? 'irregular' : (spelling ? 'spelling' : 'regular');
    const res = {
      inf: a.refl ? a.inf + 'se' : a.inf, base: a.inf, refl: a.refl, type: a.type, kind, irregular, notes,
      gerund: full.ger, gerundIrr: full.ger !== spell.ger ? 1 : 0, participle: part, participleIrr: partIrr,
      persons: PERSONS, refl_pron: REFL, tenses
    };
    cache[key] = res; return res;
  }
  // Internal: the raw 'full' build() result (lists of forms without marks); used to get haber's forms for compound tenses.
  function conjugateRaw(inf) { const a = analyse(inf); const f = build(a.inf, a.type, a.stem, 'full'); return f; }

  /* ---------- identify a surface form for a known infinitive ---------- */
  // Remove written accents from a string.
  const deacc = x => x.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
  // Which tense(s) and person(s) of a known infinitive give this surface form? Tries the form as is, then (up to 3 times)
  // strips a trailing clitic pronoun and retries both with and without accents, marking hits clitic: true.
  function identify(inf, form) {
    const w0 = form.toLowerCase();
    let m = identify0(inf, w0);
    if (m.length) return m;
    // attached pronouns: hablarlo, dímelo, levantándose, devuélvanle…
    let w = w0;
    for (let k = 0; k < 3; k++) {
      // Regex: at least 2 characters (lazy, so the shortest stem) followed by one object/reflexive pronoun at the very end of the word.
      const mm = w.match(/^(.{2,}?)(me|te|se|nos|os|lo|la|le|los|las|les)$/);
      if (!mm) break; w = mm[1];
      const cand = [w, deacc(w)];
      // Pronouns can move the written accent (ayúdame vs ayuda), hence the accent-stripped candidate.
      // restore the stressed vowel when pronouns moved the accent (e.g. dime → di, ayúdame → ayuda)
      for (const c of cand) { const r = identify0(inf, c); if (r.length) return r.map(x => Object.assign({}, x, { clitic: true })); }
      // Gerund with attached pronoun (levantándose): strip the accent, since the bare gerund has none.
      if (/(ándo|iéndo)$/.test(w)) { const r = identify0(inf, deacc(w) + ''); if (r.length) return r.map(x => Object.assign({}, x, { clitic: true })); }
    }
    return [];
  }
  // Exact-match search over all tenses of the conjugation for the lowercase word w. Returns merged entries
  // [{ key, tense, persons[] }] (one per tense; persons lists every person with that form).
  function identify0(inf, w) {
    const r = conjugate(inf); if (!r) return [];
    const out = [];
    // hay is the impersonal present of haber.
    if (r.base === 'haber' && w === 'hay') out.push({ key: 'pres', tense: 'Present (impersonal “there is / there are”)', person: 2, personLabel: PERSONS[2] });
    // -se imperfect subjunctive (hablase) is not in the tables; derive it by rewriting the -ra forms (hablara -> hablase).
    const rs = r.tenses.find(t => t.key === 'sImpf');
    if (rs) rs.raw.forEach((x, i) => { if (x && x.replace(/ra(s|mos|is|n)?$/, m => ({ ra: 'se', ras: 'ses', ramos: 'semos', rais: 'seis', ran: 'sen' }[m])) === w && x !== w) out.push({ key: 'sImpf', tense: 'Imperfect subjunctive (-se form)', person: i, personLabel: PERSONS[i] }); });
    const nm = { ind: 'indicative', perf: 'perfect', subj: 'subjunctive', imp: 'command' };
    // Skip the compound tenses and negative commands: a perfect form is several words and negative commands duplicate the present subjunctive.
    r.tenses.forEach(t => {
      if (t.group === 'perf' || t.key === 'sPresPerf' || t.key === 'sPluperf' || t.key === 'impN') return;
      t.raw.forEach((x, i) => { if (x === w) out.push({ key: t.key, tense: t.label, person: i, personLabel: PERSONS[i] }); });
    });
    if (r.gerund === w) out.push({ key: 'ger', tense: 'Gerund', person: -1, personLabel: '' });
    if (r.participle === w) out.push({ key: 'part', tense: 'Past participle', person: -1, personLabel: '' });
    if (r.base === w) out.push({ key: 'inf', tense: 'Infinitive', person: -1, personLabel: '' });
    // Last resort: match a preterite while ignoring written accents (users often type hablo for habló).
    if (!out.length) { const pr = r.tenses.find(t => t.key === 'pret'); pr.raw.forEach((x, i) => { if (deacc(x) === deacc(w) && x !== w) out.push({ key: 'pret', tense: 'Preterite', person: i, personLabel: PERSONS[i] }); }); }
    // Merge duplicates: same tense, several persons -> one entry with a persons list.
    // merge duplicates (same tense, several persons)
    const merged = [];
    out.forEach(o => {
      const m = merged.find(x => x.key === o.key);
      if (m) { if (o.person >= 0) { m.persons.push(o.person); } } else merged.push({ key: o.key, tense: o.tense, persons: o.person >= 0 ? [o.person] : [] });
    });
    // Affirmative commands repeat forms of other tenses (habla), so show them only when nothing else matches.
    // drop command duplicates of the present/subjunctive when another reading exists
    const nonImp = merged.filter(m => m.key !== 'impA');
    return nonImp.length ? nonImp : merged;
  }

  /* ---------- guess infinitive(s) for a typed conjugated form ---------- */
  // Every ending a conjugated form can have (from the tables above, plus -ando/-iendo/-yendo/-ado/-ido and -ra forms),
  // longest first, used by guess() to cut a typed word into stem + ending.
  const SUFFIXES = (() => {
    const s = new Set(['ando', 'iendo', 'yendo', 'ado', 'ido', 'ído', 'ó', 'é', 'í']);
    [E.pres, E.pret, E.impf, E.subj].forEach(g => Object.values(g).forEach(a => a.forEach(e => s.add(e))));
    E.fut.concat(E.cond, E.pretIrr, ['ra', 'ras', 'ramos', 'rais', 'ran', 'ieron', 'ió']).forEach(e => s.add(e));
    return [...s].filter(Boolean).sort((a, b) => b.length - a.length);
  })();
  // Heuristic for unknown forms: for every ending the word has, undo the common stem alterations to get possible
  // infinitive stems, add -ar/-er/-ir (-ír for stems ending in í), add a fixed list of very common irregular verbs,
  // then keep only the infinitives for which identify() really finds this form. Returns at most 6.
  function guess(word) {
    const w = word.trim().toLowerCase(); if (!w || /\s/.test(w)) return [];
    const cands = new Set();
    // addStem: candidate infinitives from a stem (the last one also handles í -> -ír verbs such as reír).
    const addStem = st => { ['ar', 'er', 'ir'].forEach(t => cands.add(st + t)); cands.add(st.replace(/í$/, 'i') + 'ír'); };
    SUFFIXES.forEach(sf => {
      if (!w.endsWith(sf)) return; const st = w.slice(0, -sf.length); if (st.length < 1) return;
      const variants = new Set([st]);
      // Undo stem changes: ie -> e (piens -> pens), ue -> o (cuent -> cont), i -> e (pid -> ped).
      variants.add(st.replace(/ie([^ie]*)$/, 'e$1')); variants.add(st.replace(/ue([^ue]*)$/, 'o$1')); variants.add(st.replace(/i([^i]*)$/, 'e$1'));
      // More stem-change undoing (u -> o: durm -> dorm; hue -> o) and spelling undoing (qu -> c, gu -> g: toqu -> toc).
      variants.add(st.replace(/u([^u]*)$/, 'o$1')); variants.add(st.replace(/hue([^ue]*)$/, 'o$1')); variants.add(st.replace(/qu$/, 'c')); variants.add(st.replace(/gu$/, 'g'));
      // Undo spelling changes: c -> z (empec -> empez), j -> g (coj -> cog), zc -> c (conozc -> conoc), y dropped (ley -> le), g -> gu.
      variants.add(st.replace(/c$/, 'z')); variants.add(st.replace(/j$/, 'g')); variants.add(st.replace(/zc$/, 'c')); variants.add(st.replace(/y$/, '')); variants.add(st.replace(/y$/, 'i')); variants.add(st.replace(/g$/, 'gu'));
      // Accent/diaeresis undoing (ü -> u, í/ú -> i/u) and -go yo stems (teng -> ten via ng -> n; dig -> dec via ig -> ec).
      variants.add(st.replace(/ü$/, 'u')); variants.add(st.replace(/í$/, 'i')); variants.add(st.replace(/ú$/, 'u')); variants.add(st.replace(/ig$/, 'e')); variants.add(st.replace(/ng$/, 'n')); variants.add(st.replace(/ig$/, 'ec'));
      variants.forEach(v => { if (v) addStem(v); });
      // irregular stems (tuv→tener etc.): try derived infinitives via tiny map
    });
    // Very common irregular infinitives that are always tried (their stems are too different to derive) and sorted first.
    const FIXED = new Set(['ir', 'ser', 'estar', 'tener', 'hacer', 'decir', 'poder', 'poner', 'querer', 'saber', 'venir', 'ver', 'dar', 'salir', 'traer', 'caer', 'oír', 'haber', 'caber', 'andar', 'conducir', 'traducir', 'producir', 'reír', 'valer', 'oler', 'jugar']);
    FIXED.forEach(v => cands.add(v));
    const res = [];
    cands.forEach(c => { try { const m = identify(c, w); if (m.length) res.push({ inf: c, matches: m }); } catch (e) { } });
    // prefer: shorter edit distance to form, then irregular specs
    // Sort: FIXED verbs first, then by how close the infinitive's length is to the word's length (a cheap proxy for edit distance).
    res.sort((x, y) => (FIXED.has(y.inf) ? 1 : 0) - (FIXED.has(x.inf) ? 1 : 0) || Math.abs(x.inf.length - w.length) - Math.abs(y.inf.length - w.length));
    return res.slice(0, 6);
  }
  return { conjugate, identify, guess, PERSONS, LABELS, scKind };
});
