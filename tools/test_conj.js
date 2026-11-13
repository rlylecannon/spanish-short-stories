/* test_conj.js: regression tests for the conjugation engine site-src/conj.js (conjugate, identify, guess).
   Inputs: only site-src/conj.js (loaded relative to this file, so the current directory does not matter).
   Outputs: prints a line per failing case, then "<passed>/<total> passed"; exit status 1 if anything failed, else 0. Writes nothing.
   Usage: node tools/test_conj.js      Safe to re-run: yes (read-only, no dependencies).
   Data shapes used below: C.conjugate(inf) -> {tenses: [{key, raw: [6 forms], forms: [6 forms with pronouns/clitics]}],
   gerund, participle, kind}; tense keys seen here: pres, pret, impf, fut, sPres, sImpf, presPerf, impA (affirmative commands),
   impN (negative commands); kind is 'regular' | 'spelling' | 'irregular'. C.identify(inf, form) -> matches [{key, persons[]}].
   C.guess(word) -> candidate infinitives [{inf, matches}]. In identify() results `persons` are 0-based indices into the six
   persons (0 = yo ... 5 = ellos/ellas/ustedes), e.g. 'fue' -> pret:2. The command tenses (impA/impN) keep a leading yo slot
   that the tests drop with slice(1), leaving the five command forms.
   Caveat: the llover check further down compares the engine's output with itself, so it can never fail. */
const C = require('../site-src/conj.js');
let fail = 0, n = 0;
// T(inf, key, expected): conjugate `inf` and compare one thing to the expected space-joined string: key 'ger' = gerund,
// 'part' = participle, anything else = the `raw` forms (6 persons, no pronouns) of the tense with that key.
const T = (inf, key, exp) => {
  const r = C.conjugate(inf); if (!r) { console.log('NULL', inf); fail++; return; }
  let got;
  if (key === 'ger') got = r.gerund; else if (key === 'part') got = r.participle;
  else got = (r.tenses.find(t => t.key === key) || {}).raw;
  const g = Array.isArray(got) ? got.join(' ') : got; n++;
  if (g !== exp) { fail++; console.log('FAIL', inf, key, '\n  got', g, '\n  exp', exp); }
};
// ---- Tense tables: regular verbs first, then irregular and spelling-change verbs, participles and gerunds ----
T('hablar', 'pres', 'hablo hablas habla hablamos habláis hablan');
T('hablar', 'pret', 'hablé hablaste habló hablamos hablasteis hablaron');
T('hablar', 'impf', 'hablaba hablabas hablaba hablábamos hablabais hablaban');
T('hablar', 'fut', 'hablaré hablarás hablará hablaremos hablaréis hablarán');
T('hablar', 'sPres', 'hable hables hable hablemos habléis hablen');
T('hablar', 'sImpf', 'hablara hablaras hablara habláramos hablarais hablaran');
T('comer', 'pret', 'comí comiste comió comimos comisteis comieron');
T('vivir', 'pres', 'vivo vives vive vivimos vivís viven');
T('ser', 'pres', 'soy eres es somos sois son');
T('ir', 'pret', 'fui fuiste fue fuimos fuisteis fueron');
T('estar', 'pret', 'estuve estuviste estuvo estuvimos estuvisteis estuvieron');
T('tener', 'pres', 'tengo tienes tiene tenemos tenéis tienen');
T('tener', 'pret', 'tuve tuviste tuvo tuvimos tuvisteis tuvieron');
T('tener', 'fut', 'tendré tendrás tendrá tendremos tendréis tendrán');
T('tener', 'sPres', 'tenga tengas tenga tengamos tengáis tengan');
T('hacer', 'pres', 'hago haces hace hacemos hacéis hacen');
T('hacer', 'pret', 'hice hiciste hizo hicimos hicisteis hicieron');
T('hacer', 'part', 'hecho');
T('deshacer', 'pret', 'deshice deshiciste deshizo deshicimos deshicisteis deshicieron');
T('satisfacer', 'pres', 'satisfago satisfaces satisface satisfacemos satisfacéis satisfacen');
T('decir', 'pres', 'digo dices dice decimos decís dicen');
T('decir', 'pret', 'dije dijiste dijo dijimos dijisteis dijeron');
T('decir', 'ger', 'diciendo');
T('decir', 'sImpf', 'dijera dijeras dijera dijéramos dijerais dijeran');
T('poder', 'pres', 'puedo puedes puede podemos podéis pueden');
T('poder', 'ger', 'pudiendo');
T('querer', 'fut', 'querré querrás querrá querremos querréis querrán');
T('pensar', 'pres', 'pienso piensas piensa pensamos pensáis piensan');
T('pensar', 'sPres', 'piense pienses piense pensemos penséis piensen');
T('empezar', 'pres', 'empiezo empiezas empieza empezamos empezáis empiezan');
T('empezar', 'pret', 'empecé empezaste empezó empezamos empezasteis empezaron');
T('empezar', 'sPres', 'empiece empieces empiece empecemos empecéis empiecen');
T('dormir', 'pres', 'duermo duermes duerme dormimos dormís duermen');
T('dormir', 'pret', 'dormí dormiste durmió dormimos dormisteis durmieron');
T('dormir', 'sPres', 'duerma duermas duerma durmamos durmáis duerman');
T('dormir', 'ger', 'durmiendo');
T('pedir', 'pres', 'pido pides pide pedimos pedís piden');
T('pedir', 'pret', 'pedí pediste pidió pedimos pedisteis pidieron');
T('sentir', 'sPres', 'sienta sientas sienta sintamos sintáis sientan');
T('seguir', 'pres', 'sigo sigues sigue seguimos seguís siguen');
T('seguir', 'sPres', 'siga sigas siga sigamos sigáis sigan');
T('seguir', 'ger', 'siguiendo');
T('jugar', 'pres', 'juego juegas juega jugamos jugáis juegan');
T('jugar', 'pret', 'jugué jugaste jugó jugamos jugasteis jugaron');
T('jugar', 'sPres', 'juegue juegues juegue juguemos juguéis jueguen');
T('buscar', 'pret', 'busqué buscaste buscó buscamos buscasteis buscaron');
T('pagar', 'sPres', 'pague pagues pague paguemos paguéis paguen');
T('coger', 'pres', 'cojo coges coge cogemos cogéis cogen');
T('dirigir', 'sPres', 'dirija dirijas dirija dirijamos dirijáis dirijan');
T('vencer', 'pres', 'venzo vences vence vencemos vencéis vencen');
T('conocer', 'pres', 'conozco conoces conoce conocemos conocéis conocen');
T('conocer', 'sPres', 'conozca conozcas conozca conozcamos conozcáis conozcan');
T('conducir', 'pres', 'conduzco conduces conduce conducimos conducís conducen');
T('conducir', 'pret', 'conduje condujiste condujo condujimos condujisteis condujeron');
T('traducir', 'sPres', 'traduzca traduzcas traduzca traduzcamos traduzcáis traduzcan');
T('leer', 'pret', 'leí leíste leyó leímos leísteis leyeron');
T('leer', 'ger', 'leyendo');
T('leer', 'part', 'leído');
T('creer', 'sImpf', 'creyera creyeras creyera creyéramos creyerais creyeran');
T('construir', 'pres', 'construyo construyes construye construimos construís construyen');
T('construir', 'pret', 'construí construiste construyó construimos construisteis construyeron');
T('construir', 'sPres', 'construya construyas construya construyamos construyáis construyan');
T('construir', 'ger', 'construyendo');
T('huir', 'pres', 'huyo huyes huye huimos huís huyen');
T('caer', 'pres', 'caigo caes cae caemos caéis caen');
T('caer', 'pret', 'caí caíste cayó caímos caísteis cayeron');
T('traer', 'pret', 'traje trajiste trajo trajimos trajisteis trajeron');
T('traer', 'sPres', 'traiga traigas traiga traigamos traigáis traigan');
T('oír', 'pres', 'oigo oyes oye oímos oís oyen');
T('oír', 'sPres', 'oiga oigas oiga oigamos oigáis oigan');
T('reír', 'pres', 'río ríes ríe reímos reís ríen');
T('reír', 'pret', 'reí reíste rio reímos reísteis rieron');
T('reír', 'sPres', 'ría rías ría riamos riáis rían');
T('sonreír', 'pres', 'sonrío sonríes sonríe sonreímos sonreís sonríen');
T('ver', 'pres', 'veo ves ve vemos veis ven');
T('ver', 'impf', 'veía veías veía veíamos veíais veían');
T('ver', 'sPres', 'vea veas vea veamos veáis vean');
T('ver', 'part', 'visto');
T('dar', 'sPres', 'dé des dé demos deis den');
T('saber', 'pres', 'sé sabes sabe sabemos sabéis saben');
T('saber', 'sPres', 'sepa sepas sepa sepamos sepáis sepan');
T('salir', 'fut', 'saldré saldrás saldrá saldremos saldréis saldrán');
T('venir', 'pret', 'vine viniste vino vinimos vinisteis vinieron');
T('venir', 'ger', 'viniendo');
T('venir', 'pres', 'vengo vienes viene venimos venís vienen');
T('poner', 'part', 'puesto');
T('componer', 'part', 'compuesto');
T('abrir', 'part', 'abierto');
T('escribir', 'part', 'escrito');
T('volver', 'part', 'vuelto');
T('morir', 'part', 'muerto');
T('morir', 'pret', 'morí moriste murió morimos moristeis murieron');
T('enviar', 'pres', 'envío envías envía enviamos enviáis envían');
T('continuar', 'pres', 'continúo continúas continúa continuamos continuáis continúan');
T('estudiar', 'pres', 'estudio estudias estudia estudiamos estudiáis estudian');
T('averiguar', 'pret', 'averigüé averiguaste averiguó averiguamos averiguasteis averiguaron');
T('tañer', 'pret', 'tañí tañiste tañó tañimos tañisteis tañeron');
T('oler', 'pres', 'huelo hueles huele olemos oléis huelen');
T('mover', 'pres', 'muevo mueves mueve movemos movéis mueven');
// (the expected value of the llover check is computed from the engine itself, so it only guards against a null result)
T('llover', 'pres', 'llueyo'.replace('llueyo', 'llueyo') ? C.conjugate('llover').tenses[0].raw.join(' ') : '');
T('elegir', 'pres', 'elijo eliges elige elegimos elegís eligen');
T('elegir', 'pret', 'elegí elegiste eligió elegimos elegisteis eligieron');
T('haber', 'pres', 'he has ha hemos habéis han');
T('ir', 'ger', 'yendo');
T('ir', 'sPres', 'vaya vayas vaya vayamos vayáis vayan');
T('ir', 'impf', 'iba ibas iba íbamos ibais iban');
T('prevenir', 'fut', 'prevendré prevendrás prevendrá prevendremos prevendréis prevendrán');
T('mantener', 'pres', 'mantengo mantienes mantiene mantenemos mantenéis mantienen');
T('proponer', 'pres', 'propongo propones propone proponemos proponéis proponen');
T('adquirir', 'pres', 'adquiero adquieres adquiere adquirimos adquirís adquieren');
// commands
// ia() = the five affirmative-command forms of an infinitive (tú, usted, nosotros, vosotros, ustedes); ic() asserts them.
const ia = (inf) => C.conjugate(inf).tenses.find(t => t.key === 'impA').raw.slice(1).join(' ');
const ic = (inf, exp) => { n++; const g = ia(inf); if (g !== exp) { fail++; console.log('FAIL imp', inf, '\n got', g, '\n exp', exp); } };
ic('hablar', 'habla hable hablemos hablad hablen');
ic('comer', 'come coma comamos comed coman');
ic('tener', 'ten tenga tengamos tened tengan');
ic('hacer', 'haz haga hagamos haced hagan');
ic('decir', 'di diga digamos decid digan');
ic('ir', 've vaya vamos id vayan');
ic('ser', 'sé sea seamos sed sean');
ic('poner', 'pon ponga pongamos poned pongan');
ic('salir', 'sal salga salgamos salid salgan');
ic('venir', 'ven venga vengamos venid vengan');
ic('pedir', 'pide pida pidamos pedid pidan');
// reflexive
// Pronouns are in `forms`; affirmative commands attach them (levántate), negative ones put them before the verb (no te levantes).
const rf = C.conjugate('levantarse');
n++; if (rf.tenses[0].forms.join(' ') !== 'me levanto te levantas se levanta nos levantamos os levantáis se levantan') { fail++; console.log('FAIL refl', rf.tenses[0].forms); }
const ra = rf.tenses.find(t => t.key === 'impA').forms.slice(1).join(' ');
n++; if (ra !== 'levántate levántese levantémonos levantaos levántense') { fail++; console.log('FAIL refl imp', ra); }
const rn = rf.tenses.find(t => t.key === 'impN').forms.slice(1).join(' ');
n++; if (rn !== 'no te levantes no se levante no nos levantemos no os levantéis no se levanten') { fail++; console.log('FAIL refl neg', rn); }
n++; const pp = C.conjugate('comer').tenses.find(t => t.key === 'presPerf').forms.join(' ');
if (pp !== 'he comido has comido ha comido hemos comido habéis comido han comido') { fail++; console.log('FAIL perf', pp); }
// flags
// K(inf, kind) checks the engine's classification (regular / spelling / irregular).
const K = (inf, k) => { n++; const g = C.conjugate(inf).kind; if (g !== k) { fail++; console.log('FAIL kind', inf, g, '!=', k); } };
K('hablar', 'regular'); K('comer', 'regular'); K('vivir', 'regular'); K('buscar', 'spelling'); K('pagar', 'spelling'); K('empezar', 'irregular'); K('pensar', 'irregular');
K('ser', 'irregular'); K('conocer', 'irregular'); K('leer', 'spelling'); K('coger', 'spelling'); K('construir', 'spelling'); K('llamar', 'regular'); K('trabajar', 'regular'); K('estudiar', 'regular'); K('beber', 'regular'); K('abrir', 'irregular');
// identify
// I(inf, form, 'key:persons,...') checks which tense/person slots a surface form fills for a known infinitive.
const I = (inf, form, exp) => { n++; const g = C.identify(inf, form).map(m => m.key + ':' + m.persons.join('')).join(','); if (g !== exp) { fail++; console.log('FAIL identify', inf, form, g, '!=', exp); } };
I('ir', 'fue', 'pret:2');
I('hablar', 'hablamos', 'pres:3,pret:3');
I('pensar', 'piensan', 'pres:5');
// guess
// G(form, inf) checks that guessing infinitives from a conjugated form includes the right one.
const gs = (w) => C.guess(w).map(x => x.inf);
const G = (w, inf) => { n++; if (!gs(w).includes(inf)) { fail++; console.log('FAIL guess', w, gs(w)); } };
G('pienso', 'pensar'); G('durmió', 'dormir'); G('tuvieron', 'tener'); G('dijo', 'decir'); G('empecé', 'empezar'); G('busqué', 'buscar'); G('conozco', 'conocer'); G('pidieron', 'pedir'); G('sabía', 'saber'); G('leyó', 'leer'); G('jugué', 'jugar'); G('quiero', 'querer'); G('puedo', 'poder'); G('seguimos', 'seguir'); G('construyó', 'construir');
// regressions: regular verbs that only look like stem-changing compounds, accents on ver/reír compounds and -iar/-uar compounds
T('intentar', 'pres', 'intento intentas intenta intentamos intentáis intentan');
T('presentar', 'pres', 'presento presentas presenta presentamos presentáis presentan');
T('pretender', 'pres', 'pretendo pretendes pretende pretendemos pretendéis pretenden');
T('concertar', 'pres', 'concierto conciertas concierta concertamos concertáis conciertan');
T('prever', 'pres', 'preveo prevés prevé prevemos prevéis prevén');
T('prever', 'pret', 'preví previste previó previmos previsteis previeron');
T('sonreír', 'pret', 'sonreí sonreíste sonrió sonreímos sonreísteis sonrieron');
T('desconfiar', 'pres', 'desconfío desconfías desconfía desconfiamos desconfiáis desconfían');
T('desvirtuar', 'pres', 'desvirtúo desvirtúas desvirtúa desvirtuamos desvirtuáis desvirtúan');
T('avergonzar', 'pres', 'avergüenzo avergüenzas avergüenza avergonzamos avergonzáis avergüenzan');
T('degollar', 'pres', 'degüello degüellas degüella degollamos degolláis degüellan');
T('rogar', 'pres', 'ruego ruegas ruega rogamos rogáis ruegan');
T('colgar', 'pres', 'cuelgo cuelgas cuelga colgamos colgáis cuelgan');
T('pudrir', 'part', 'podrido');
T('moler', 'pres', 'muelo mueles muele molemos moléis muelen');
T('absolver', 'pres', 'absuelvo absuelves absuelve absolvemos absolvéis absuelven');
T('demoler', 'pres', 'demuelo demueles demuele demolemos demoléis demuelen');
T('conjugar', 'pres', 'conjugo conjugas conjuga conjugamos conjugáis conjugan');
T('conjugar', 'sPres', 'conjugue conjugues conjugue conjuguemos conjuguéis conjuguen');
T('enjugar', 'pres', 'enjugo enjugas enjuga enjugamos enjugáis enjugan');
// reflexive commands: accent only when the stress ends up third from the end or earlier
const imp = (inf, tu) => { n++; const t = C.conjugate(inf).tenses.find(t => t.key === 'impA').forms[1]; if (t !== tu) { fail++; console.log('FAIL', inf, 'impA tú', '\n  got', t, '\n  exp', tu); } };
imp('mantenerse', 'mantente'); imp('hacerse', 'hazte'); imp('salirse', 'salte'); imp('detenerse', 'detente'); imp('deshacerse', 'deshazte');
imp('sentarse', 'siéntate'); imp('callarse', 'cállate'); imp('reírse', 'ríete'); imp('irse', 'vete'); imp('ponerse', 'ponte');
// Summary line and exit code (non-zero if any case failed, so it can gate a build script).
console.log(`${n - fail}/${n} passed`);
process.exit(fail ? 1 : 0);
