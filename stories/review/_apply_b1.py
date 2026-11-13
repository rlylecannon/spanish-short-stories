import json, copy, re
SRC='/sessions/practical-fervent-clarke/mnt/outputs/stories/all-stories.json'
OUT='/sessions/practical-fervent-clarke/mnt/outputs/stories/review/'
data=json.load(open(SRC,encoding='utf-8'))
orig={s['id']:s for s in data if s['id'].startswith('b1-')}
S={k:copy.deepcopy(v) for k,v in orig.items()}
changes=[]
def L(sid,i,lang,old,new,reason):
    s=S[sid]; cur=s['lines'][i][lang]
    assert cur.count(old)==1,(sid,i,old,cur)
    nv=cur.replace(old,new)
    s['lines'][i][lang]=nv
    changes.append({'id':sid,'field':'lines.es' if lang==0 else 'lines.en','index':i,'old':cur,'new':nv,'reason':reason})
def F(sid,field,new,reason,index=None):
    s=S[sid]
    if index is None:
        old=s[field]; s[field]=new
        changes.append({'id':sid,'field':field,'old':old,'new':new,'reason':reason})
    else:
        old=s[field][index]; s[field][index]=new
        changes.append({'id':sid,'field':field,'index':index,'old':old,'new':new,'reason':reason})
def VADD(sid,entry,reason):
    S[sid]['vocab'].append(entry)
    changes.append({'id':sid,'field':'vocab','index':len(S[sid]['vocab'])-1,'old':None,'new':entry,'reason':reason})
def VSET(sid,es,new,reason):
    v=S[sid]['vocab']; k=[i for i,x in enumerate(v) if x[0]==es]; assert len(k)==1,(sid,es)
    F(sid,'vocab',new,reason,k[0])
def C(sid,key,val,reason):
    c=dict(S[sid]['concepts']); c[key]=val
    F(sid,'concepts',c,reason)

# ---------- global orthography ----------
for sid in sorted(S):
    for i in range(len(S[sid]['lines'])):
        es=S[sid]['lines'][i][0]
        for a,b_ in (('sólo','solo'),('Sólo','Solo')):
            if a in S[sid]['lines'][i][0]:
                L(sid,i,0,a,b_,'Orthography: the RAE (2010) no longer accents the adverb solo, and the level mixed sólo (b1-02/04/05) with solo (b1-08/09/10). Normalised to solo.')
        if re.search(r'\brió\b',S[sid]['lines'][i][0]):
            L(sid,i,0,'rió','rio','Orthography: rio (preterite of reír) is monosyllabic and has had no written accent since the 2010 Ortografía.')

# ---------- b1-01 ----------
L('b1-01',0,1,'as she did every day since she had started living alone','as she had done every day since she started living alone','English tense: "every day since…" needs the past perfect.')
L('b1-01',2,0,'un hostal de Lavapiés','un <b>hostal</b> de Lavapiés','"el hostal" is in the vocab list but was never bolded.')
L('b1-01',13,0,'no hace falta','<b>no hace falta</b>','"no hace falta" is in the vocab list but was not bolded.')
L('b1-01',14,0,'hablaron durante dos horas. Inés le enseñó','hablaron durante dos horas. Después, Inés le enseñó','Logic: they were sitting in a café, so showing him the neighborhood needs a time shift. "Después" makes the walk explicit and matches the grammar-file translation ("showed him").')
L('b1-01',14,1,'Inés told him about the neighborhood','Afterwards, Inés showed him the neighborhood','Mistranslation: enseñar el barrio = show someone the neighborhood (same fix as the grammar/B1 report).')
VSET('b1-01','temblar',['tembloroso/a','trembling, shaky'],'The bolded form is the adjective temblorosas, so gloss that word.')
F('b1-01','quiz',{'q':'Cuando Inés dice «No, hijo, no hace falta», quiere decir que…','options':['no necesita ninguna recompensa','no tiene hambre','no quiere hablar más con Tomás','Tomás es su hijo de verdad'],'answer':0},'The quiz had no vocabulary-in-context item. Replaced the easiest recall question (where the wallet was) with one on "no hace falta" and affectionate "hijo". A distractor tests literal reading.',0)
F('b1-01','prompt','Have you ever lost something important, or found something that belonged to someone else? In Spanish (4-6 sentences), say what happened and how you felt. Use the imperfect for the background and the preterite for the events. Starter: «Era un día de… y yo estaba en… De repente vi/perdí…»','The prompt had no model, starter or grammar cue. Added a starter and a cue for preterite vs. imperfect.')

# ---------- b1-02 ----------
L('b1-02',3,0,'te considera de confianza','te considera de <b>confianza</b>','"la confianza" is in the vocab list but was not bolded.')
L('b1-02',3,1,'it means they consider you a friend','it means they see you as someone they trust','Translation: de confianza = trusted, close. "A friend" also gave away Ben\'s joke in the next line.')
L('b1-02',5,0,'describía perfectamente sus primeras citas','describía perfectamente sus primeros encuentros','"Citas" reads as romantic dates, which these meetings are explicitly not. "Encuentros" is accurate.')
L('b1-02',5,1,'described her first dates perfectly','described their first meetings perfectly','Follows the Spanish fix. "Her first dates" was misleading.')
L('b1-02',6,1,'Her boss had asked her to present','Her boss had suggested that she present','Translation: proponer = suggest (same fix as the grammar/B1 report).')
L('b1-02',8,0,'—Lo vas a hacer muy bien —dijo él—.','—Lo harás muy bien —dijo él—.','The target grammar is the future tense, but the story had only two simple-future forms (seré, enseñaré). This adds a natural third.')
L('b1-02',8,1,'“You\'re going to do it very well,” he said. “Here you talk to me without any trouble. Look, if you like,','“You\'ll do it really well,” he said. “Here you talk to me without any trouble. If you like,','Matches the Spanish change. Also removed "Look,", which is not in the Spanish.')
L('b1-02',13,0,'Aunque te advierto que no es tan bueno como el mate.','Aunque te advierto que no te gustará tanto como el mate.','Adds a fourth natural future (gustará) for the target structure.')
L('b1-02',13,1,'“Although I warn you it isn\'t as good as mate.”','“Although I warn you, you won\'t like it as much as mate.”','Matches the Spanish change.')
VSET('b1-02','dar vergüenza',['dar vergüenza','to make (someone) embarrassed'],'Gloss fix from the B1 vocab review: "le daba vergüenza" = he felt embarrassed, not "it was embarrassing".')
VADD('b1-02',['de pronto','suddenly'],'Bolded in line 10 but missing from the list.')
VADD('b1-02',['¡qué bárbaro!','wow! / awesome! (Río de la Plata)'],'Regionalism used in line 5 without a gloss.')
VADD('b1-02',['el mate','mate (herbal tea shared from a gourd)'],'Central cultural word that was never glossed.')
F('b1-02','quiz',{'q':'«Se le trababa la lengua» significa que, al hablar con extranjeros, Ana…','options':['se ponía nerviosa y no le salían las palabras','hablaba demasiado rápido','no sabía nada de inglés','le dolía la boca'],'answer':0},'Replaced a question that overlapped with Q3 by a vocabulary-in-context item on the story\'s key idiom. The distractor "no sabía nada de inglés" is refuted by "Su inglés era correcto".',0)
F('b1-02','quiz',{'q':'¿Qué le explicó Ana a Ben sobre el mate?','options':['Que es una sopa típica','Que debía pagarlo él','Que se comparte con personas de confianza','Que no se puede beber por la tarde'],'answer':2},'The stem "¿Qué quiso decir Ana con el mate?" was awkward Spanish.',1)
F('b1-02','prompt','You are starting a language exchange next week. In Spanish (4-6 sentences), say who your partner will be, where you will meet and what you will teach each other. Use the future tense. Starter: «El jueves conoceré a mi compañero de intercambio. Nos veremos en…»','The old prompt elicited the conditional ("would be"), but the story\'s target is the future. Added a starter.')
C('b1-02','grammar','Future tense (seré, enseñaré, harás, gustará) alongside ir a + infinitive (voy a poder); preterite/imperfect contrast; pluperfect (había propuesto, se había mudado); aunque + indicative; reflexive verbs (acostumbrarse, acordarse, equivocarse).','The concepts listed podré and iré, which do not occur in the text.')

# ---------- b1-03 ----------
L('b1-03',4,0,'Si fuera usted, pensaría','Si yo fuera usted, pensaría','Without the subject, "si fuera usted" is ambiguous for learners ("if it were you"). The model formula is "si yo fuera usted".')
L('b1-03',6,1,'She thought about her husband, who had built that oven and she cried.','She thought about her late husband, who had built that oven, and she cried.','The translation left out "difunto" (late) and a comma.')
L('b1-03',8,0,'todos los pedidos a tiempo','todos los <b>pedidos</b> a tiempo','The story alternates "pedido" with "encargo". Bolded and glossed so the synonym is clear.')
L('b1-03',12,0,'—Es para el horno nuevo —explicó','—Es para arreglar el horno —explicó','Consistency: the last line says the oven was "reparado por todos", not replaced.')
L('b1-03',12,1,'“It\'s for the new oven,” explained','“It\'s to fix the oven,” explained','Matches the Spanish change.')
L('b1-03',13,0,'el techo de La Espiga volvió a llenarse de humo','la chimenea de La Espiga volvió a echar humo','"El techo se llenó de humo" suggests a fire. The intended image is smoke from the chimney.')
L('b1-03',13,1,'the roof of La Espiga filled with smoke again','smoke rose from La Espiga\'s chimney again','Matches the Spanish change.')
VADD('b1-03',['el pedido','order (from a customer)'],'Newly bolded synonym of encargo.')
VADD('b1-03',['sentirse','to feel'],'Bolded in line 10 (se sentía) but missing from the list.')
F('b1-03','quiz',{'q':'Cuando la señora Lupe dice «ahora nos toca a nosotros», quiere decir que…','options':['ahora los vecinos quieren comprar la panadería','ahora es el turno de los vecinos de ayudar a Remedios','ahora los vecinos van a tocar el horno','ahora les toca pagar el pan más caro'],'answer':1},'The technician-detail question had a giveaway distractor ("…inmediatamente y gratis"). Replaced it with a vocabulary-in-context/inference item on "tocar a alguien". Q3 still covers the technician\'s advice.',1)
F('b1-03','prompt','Think of a small local business you like. In Spanish (4-6 sentences), imagine it is in trouble and say what you and your neighbours would do. Use si + imperfect subjunctive and the conditional. Starter: «Si la panadería de mi barrio tuviera problemas, yo…»','There was no starter, and the prompt did not cue the target hypothetical structure.')
C('b1-03','grammar','Conditional for advice and polite proposals (pensaría, podríamos); si + imperfect subjunctive in hypotheticals (si yo fuera usted, si cada uno nos prestara); present perfect for recent events with present relevance (se ha agrietado, me han quitado, lo hemos hablado); pluperfect (había construido, había hecho); relative clauses with que.','The concepts named "quien", which does not occur, and left out the four present-perfect examples.')

# ---------- b1-04 ----------
L('b1-04',0,0,'él revisaba <b>suero</b>','él revisaba <b>sueros</b>','"Revisar suero" with no article or plural is unnatural. "Revisaba sueros" = checked IV drips.')
VSET('b1-04','el suero',['el suero','IV drip (plural: los sueros)'],'Follows the plural in the text.')
VADD('b1-04',['preocupado/a','worried'],'Bolded in line 2 but missing from the list.')
VADD('b1-04',['tocar','to touch'],'Bolded in line 6 but missing from the list.')
F('b1-04','prompt','Imagine you meet a stranger who teaches you something unexpected at an unusual hour. In Spanish (4-6 sentences), say who they are, what they teach you and how you would feel afterwards. Starter: «Si una noche conociera a…, le preguntaría… y me enseñaría…»','Added a starter that models si + imperfect subjunctive + conditional, the story\'s key structure.')

# ---------- b1-05 ----------
L('b1-05',0,0,'Valeria se había <b>enfadado</b> con él por una tontería, la venta de la casa de sus padres,','Valeria se había <b>enojado</b> con él por la venta de la casa de sus padres,','Regional consistency: Ecuadorian characters say enojarse, not peninsular enfadarse. Also removed "por una tontería", because calling the sale of the parents\' house a trifle contradicts the serious apology in lines 11-12.')
L('b1-05',0,1,'Valeria had gotten angry with him over something silly, the sale of their parents\' house,','Valeria had gotten angry with him over the sale of their parents\' house,','Matches the Spanish change.')
L('b1-05',7,0,'cambiaba la cámara','cambiaba la <b>cámara</b>','"Cámara" (inner tube) is a false friend for English speakers, so it is now bolded and glossed.')
L('b1-05',13,0,'cada uno había <b>echado de menos</b>','cada uno había <b>extrañado</b>','Regional consistency: extrañar is the Latin American (Ecuadorian) verb. Echar de menos is peninsular.')
L('b1-05',17,0,'nadie pincharía la rueda del otro','ninguno de los dos dejaría al otro solo con una rueda pinchada','"Nadie pincharía la rueda del otro" means nobody would puncture the other\'s tire (deliberate sabotage). That is not the intended image, and it did not match the English.')
L('b1-05',17,1,'neither of them would let the other get a flat','neither of them would leave the other alone with a flat tire','Matches the Spanish change.')
VSET('b1-05','enfadarse',['enojarse','to get angry (Spain: enfadarse)'],'Follows the regional fix.')
VSET('b1-05','las alforjas',['las alforjas','panniers (bike bags)'],'Gloss fix from the B1 vocab review.')
VSET('b1-05','el repuesto',['el repuesto','spare (here, a spare inner tube)'],'Clarifies what the spare is.')
VSET('b1-05','echar de menos',['extrañar','to miss (Spain: echar de menos)'],'Follows the regional fix.')
VADD('b1-05',['la cámara','inner tube (of a tire)'],'Newly bolded false friend.')
F('b1-05','quiz',{'q':'¿Por qué habían dejado de hablarse los hermanos?','options':['Por un conflicto sobre la venta de la casa de sus padres','Porque vivían en países distintos','Por una deuda de dinero','Porque Nicolás había perdido la bicicleta'],'answer':0},'The correct option said "malentendido", but the text describes a real grievance (he signed without consulting her), not a misunderstanding.',0)
F('b1-05','prompt','Imagine you took a long trip with someone you had argued with. In Spanish (4-6 sentences), say what would happen, what each of you would say, and how the trip could change things. Use the conditional and one si + imperfect subjunctive. Starter: «Si hiciera un viaje con mi…, al principio no hablaríamos mucho, pero…»','Added a model starter.')
C('b1-05','vocabulary','Travel, cycling and coastal words; family and reconciliation vocabulary; phrases such as extrañar, darse cuenta de, dar el primer paso (Latin American enojarse/extrañar, with the Spain equivalents glossed).','Follows the regional vocabulary fix.')

# ---------- b1-06 ----------
L('b1-06',0,0,'Lupe se había mudado a un apartamento más pequeño','Lupe se había mudado a un departamento más pequeño','Regional consistency (Oaxaca): Mexican Spanish says departamento.')
L('b1-06',0,0,'A ella no le apetecía mucho,','Ella no tenía muchas ganas,','"Apetecer" is peninsular. A Mexican narrator would say "no tenía muchas ganas".')
L('b1-06',1,0,'revistas amarillas','revistas amarillentas','Yellowed paper is "amarillento". "Revistas amarillas" means yellow magazines.')
L('b1-06',14,0,'Cuando termines de leerlas, dijo Marisol, Elena quiere que la llames,','—Cuando termines de leerlas —dijo Marisol—, Elena quiere que la llames,','Punctuation: this direct speech was unmarked, unlike every other line, so learners could not see who was speaking.')
L('b1-06',14,1,'When you finish reading them, Marisol said, Elena wants you to call her, because her father still has the guitar and a pile of songs for you.','“When you finish reading them,” Marisol said, “Elena wants you to call her, because her father still has the guitar and a pile of songs for you.”','Matches the Spanish punctuation fix.')
VADD('b1-06',['mija','dear, sweetie (from mi hija; Mexico/Latin America)'],'Regional term of endearment used twice without a gloss.')
VADD('b1-06',['el departamento','apartment (Mexico)'],'Regional word introduced by the fix.')
F('b1-06','quiz',{'q':'¿Dónde encontró Marisol las cartas de Tomás?','options':['Dentro del libro de recetas','En el departamento de Lupe','Debajo de un baúl en el desván','En una caja de la cocina'],'answer':2},'Follows apartamento → departamento.',1)
F('b1-06','quiz',{'q':'¿Qué sugiere el consejo de Lupe «no vendas la casa todavía»?','options':['Que la casa ahora vale más dinero','Que ahora ve la casa como un lugar con recuerdos valiosos','Que quiere vivir otra vez allí con Tomás','Que quiere regalar la casa a Elena'],'answer':1},'The stem was ungrammatical ("¿Qué sugiere que Lupe diga…?"). Also replaced the implausible distractor "Que odia a su familia".',4)
F('b1-06','prompt','Imagine you find an old photograph of a family member with someone you don\'t know. In Spanish (4-6 sentences), describe the photo, what you would ask, and what you hope to discover. Use espero que / no creo que + subjunctive. Starter: «En la foto, mi abuelo está con… No creo que… Espero que mi familia me cuente…»','Added a grammar cue and a starter matching the story\'s subjunctive targets.')

# ---------- b1-07 ----------
F('b1-07','quiz',{'q':'«Daniela se quedó helada» significa que…','options':['no pudo reaccionar por la sorpresa','tenía mucho frío en la sala','se comió un helado','se enojó con Camilo'],'answer':0},'Replaced the easiest recall item with a vocabulary-in-context question (helada = frozen with shock). The other four questions already cover the plot.',0)
F('b1-07','quiz',{'q':'¿Por qué le gustó la idea a doña Beatriz?','options':['Porque pensó que los zapatos eran muy baratos','Porque quería comprar zapatos para turistas','Porque conocía a la mamá de Camilo','Porque vio una forma de que la familia acompañara a niños y ancianos'],'answer':3},'Sequence of tenses: vio … acompañara (not acompañe).',3)
VADD('b1-07',['salir perfecto / bien','to turn out perfectly / well'],'"Salga" is bolded in line 2 but was missing from the list.')
F('b1-07','prompt','Describe in Spanish (4-6 sentences) a moment when something went wrong in front of other people but turned out better than expected. End with two pieces of advice for a friend in the same situation, using commands (respira, no te preocupes) or quiero que + subjunctive. Starter: «Una vez, en una reunión importante, … Mi consejo: no tengas miedo y…»','The old prompt elicited only past narration, but the target grammar is commands and the subjunctive. Added a starter.')
C('b1-07','grammar','Present subjunctive after quiero que, si prefieren que and espero que, and after cuando for the future (cuando mi hijo sea famoso); affirmative and negative commands (respira, no cuentes, ponte, imaginen, observen); reported commands (le dijo que se los quitara); cuanto más… más; conditional for conjecture (obedecería).','The concepts listed "para que", which does not occur. Added cuando + subjunctive, which does.')

# ---------- b1-08 ----------
L('b1-08',0,0,'Se sentó en su escritorio','Se sentó a su escritorio','"Sentarse en el escritorio" means sitting on top of the desk. "A su escritorio" = at his desk.')
L('b1-08',0,0,'sin discursos ni pastel','sin discursos ni torta','Regional consistency (Valparaíso): cake is "torta" in Chile.')
L('b1-08',1,0,'lo esperan en el salón','lo esperan en la sala','Chilean usage: a classroom is la sala (de clases). Salón is Mexican/Caribbean.')
L('b1-08',1,1,'"Good morning, professor,"','"Good morning, Profesor,"','In English "professor" means a university lecturer. Kept the Spanish form of address.')
L('b1-08',4,0,'Al abrir la puerta del salón, un grito de «¡Sorpresa!» lo hizo dar un salto. El salón estaba','Al abrir la puerta de la sala, un grito de «¡Sorpresa!» lo hizo dar un salto. La sala estaba','Chilean usage (see line 1).')
L('b1-08',4,0,'sentadas al fondo, a decenas de adultos','sentados al fondo, a decenas de adultos','Agreement error: adultos is masculine (sentados).')
L('b1-08',5,1,'"Do you remember me, professor?"','"Do you remember me, Profesor?"','See line 1.')
L('b1-08',11,0,'no tienen quién los ayude','no tienen quien los ayude','The relative "quien" after tener takes no accent (cf. "El coronel no tiene quien le escriba").')
VSET('b1-08','secarse',['secarse (los ojos)','to dry (one\'s eyes)'],'Clarification from the B1 vocab review.')
VSET('b1-08','el timbre',['el timbre','bell (school bell here; also doorbell)'],'Clarification from the B1 vocab review.')
F('b1-08','quiz',{'q':'Cuando Aurelio piensa que ya no tendrá motivo para «madrugar», quiere decir que ya no tendrá que…','options':['acostarse tarde','trabajar los sábados','corregir exámenes','levantarse temprano'],'answer':3},'Replaced a pure recall item (what was in the box) with a vocabulary-in-context question.',2)
F('b1-08','prompt','Think of a teacher or mentor who made a difference in your life. In Spanish (4-6 sentences), say who it was and what they taught you, then write them a short thank-you message with two wishes or pieces of advice (Espero que…, Ojalá…, No tenga miedo de…). Starter: «Querida profesora: Quiero darle las gracias porque…»','Added a starter and a cue for the subjunctive and command targets.')
C('b1-08','grammar','Present subjunctive after quiero que, espero que, ojalá and aunque (aunque les dé vergüenza); affirmative and negative ustedes commands (hagan, no tengan, devuélvanle) and usted commands (no se preocupe, dígame); pluperfect (había enseñado, había pedido); reported speech (dijo que, explicó que).','"Affirmative commands … (no tengan)" was inaccurate, because no tengan is negative.')

# ---------- b1-09 ----------
L('b1-09',11,0,'como si les diera pena romper el hechizo','como si nadie quisiera romper el hechizo','In Costa Rica (and Mexico/Central America) "dar pena" usually means "to be embarrassed", which misreads here. "Como si nadie quisiera" keeps the imperfect subjunctive and is unambiguous.')
L('b1-09',11,1,'as if they were sorry to break the spell','as if nobody wanted to break the spell','Matches the Spanish change.')
VSET('b1-09','ojalá',['ojalá','I hope, if only'],'Completes the gloss (ojalá + imperfect subjunctive = if only).')
F('b1-09','quiz',{'q':'«Tenía fama de gruñón» quiere decir que los vecinos pensaban que el señor Gutiérrez…','options':['era muy famoso en la ciudad','era antipático y siempre estaba de mal humor','cocinaba muy bien','trabajaba en la compañía eléctrica'],'answer':1},'Replaced the easiest recall question with a vocabulary-in-context item (fama ≠ famous trap).',0)
F('b1-09','prompt','Describe in Spanish (4-6 sentences) a time when an unexpected event, like a storm, a blackout or a delay, brought you closer to other people. Say what someone asked everyone to do (nos pidió que…, quería que…) and what you did together. Starter: «Una noche hubo un apagón en mi barrio. Al principio… pero luego un vecino nos pidió que…»','Added a starter and a cue for the subjunctive targets.')

# ---------- b1-10 ----------
L('b1-10',2,0,'Joaquín cumplió treinta años','Joaquín cumplió veinticuatro años','Timeline error: the letters began when he was twelve (line 11 photo) and have lasted twelve years, so he turns 24, not 30.')
L('b1-10',2,1,'Joaquín turned thirty','Joaquín turned twenty-four','Matches the Spanish fix.')
L('b1-10',4,0,'un acento de otro lado del mar','un acento del otro lado del mar','Missing article: "del otro lado del mar".')
L('b1-10',4,1,'when the doorbell rang','when the bell on the door rang','"Campanilla" is a shop-door bell, not an electric doorbell.')
L('b1-10',8,0,'una persona que había conocido solo en papel','una persona que conocía solo por sus cartas','"Conocer en papel" is a calque. "Por sus cartas" is natural.')
L('b1-10',8,1,'a person he had known only on paper. Marta explained that she had saved up for a year and that she hadn\'t wanted to warn him','a person he knew only through letters. Marta explained that she had saved up for a year and that she didn\'t want to let him know in advance','Matches the Spanish fix. Avisar here = let someone know, not warn (fix from the grammar report).')
L('b1-10',9,0,'—Llevaba tanto tiempo imaginando este momento que casi me da','—Llevo tanto tiempo imaginando este momento que casi me da','Tense clash (llevaba … me da). She is speaking in the moment, so present llevo.')
L('b1-10',9,1,'I\'d been imagining this moment for so long that I almost panicked,','I\'ve been imagining this moment for so long that I\'m almost panicking,','Matches the Spanish fix.')
L('b1-10',15,1,'because homesickness began before leaving','because missing a place begins even before you leave it','"Homesickness" is wrong here: she is missing Montevideo, not home. Añoranza here = longing.')
L('b1-10',16,0,'—pidió—. Joaquín obedeció.','—pidió. Joaquín obedeció.','Dialogue punctuation: no closing dash when the speech ends with the narrator\'s tag.')
VSET('b1-10','la campanilla',['la campanilla','little bell (on a shop door)'],'Gloss fix from the B1 vocab review.')
VSET('b1-10','la añoranza',['la añoranza','longing, missing (a place or person)'],'"Homesickness" is misleading in this context.')
VSET('b1-10','avisar',['avisar','to let (someone) know, to warn'],'The main sense in the story is "let know".')
VADD('b1-10',['la rambla','promenade along the water (Montevideo)'],'Regional landmark word with no gloss.')
VADD('b1-10',['el candombe','Afro-Uruguayan drumming tradition'],'Cultural term with no gloss.')
F('b1-10','quiz',{'q':'Cuando Marta dice que «la añoranza empezaba antes de irse», quiere decir que…','options':['estaba cansada del viaje','ya extrañaba la ciudad aunque todavía estaba allí','quería volver pronto a Granada','tenía miedo del avión'],'answer':1},'Replaced an easy recall item with a vocabulary-in-context/attitude question.',1)
F('b1-10','prompt','Imagine a friend you have only known online or by letter surprises you with a visit. In Spanish (4-6 sentences), say what you would do together and one thing you hope will happen. Starter: «Si mi amigo/a viniera a verme, lo/la llevaría a… Espero que…»','Added a starter modelling si + imperfect subjunctive + conditional and espero que + subjunctive.')

def VDEL(sid,es,reason):
    v=S[sid]['vocab']; k=[i for i,x in enumerate(v) if x[0]==es]; assert len(k)==1,(sid,es)
    old=v.pop(k[0])
    changes.append({'id':sid,'field':'vocab','index':k[0],'old':old,'new':None,'reason':reason})
VDEL('b1-02','aunque','Removed to stay within the 20-item vocab limit: aunque is A2 core, not bolded, and needs no gloss at B1.')
VDEL('b1-03','sin embargo','Removed to stay within the 20-item limit: an A2 connector, not bolded in this story, and already glossed in b1-01.')
VDEL('b1-10','el desconocido','Removed to stay within the 20-item limit: it is not bolded in the text and is recycled from b1-09 (extraños/desconocidos).')

# ---------- write ----------
fixed=[S['b1-%02d'%i] for i in range(1,11)]
for s in fixed:
    assert len(s['lines'])==len(orig[s['id']]['lines'])
    assert set(s)==set(orig[s['id']])
    for es,en in s['lines']:
        assert es.count('<b>')==es.count('</b>')
json.dump(fixed,open(OUT+'b1-stories-fixed.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
json.dump(changes,open(OUT+'b1-story-changes.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(len(changes))
from collections import Counter
print(Counter(c['id'] for c in changes))
for s in fixed: print(s['id'],[q['answer'] for q in s['quiz']])
