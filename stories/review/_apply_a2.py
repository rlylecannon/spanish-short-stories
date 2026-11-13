import json, copy
SRC='/sessions/practical-fervent-clarke/mnt/outputs/stories/all-stories.json'
OUT='/sessions/practical-fervent-clarke/mnt/outputs/stories/review/'
allst=json.load(open(SRC,encoding='utf-8'))
stories={s['id']:copy.deepcopy(s) for s in allst if s['id'].startswith('a2-')}
changes=[]
def S(s): return stories[s]
def line(sid,i,es=None,en=None,reason=''):
    L=S(sid)['lines'][i]
    if es is not None and es!=L[0]:
        changes.append(dict(id=sid,field='lines.es',index=i,old=L[0],new=es,reason=reason)); L[0]=es
    if en is not None and en!=L[1]:
        changes.append(dict(id=sid,field='lines.en',index=i,old=L[1],new=en,reason=reason)); L[1]=en
def field(sid,f,new,reason,index=None):
    s=S(sid)
    if index is None:
        old=s[f]; s[f]=new; changes.append(dict(id=sid,field=f,old=old,new=new,reason=reason))
    else:
        old=s[f][index]; s[f][index]=new; changes.append(dict(id=sid,field=f,index=index,old=old,new=new,reason=reason))
def conc(sid,k,new,reason):
    old=S(sid)['concepts'][k]; S(sid)['concepts'][k]=new
    changes.append(dict(id=sid,field='concepts.'+k,old=old,new=new,reason=reason))
def quiz(sid,i,new,reason):
    old=S(sid)['quiz'][i]; S(sid)['quiz'][i]=new
    changes.append(dict(id=sid,field='quiz',index=i,old=old,new=new,reason=reason))
def vocab(sid,i,new,reason):
    v=S(sid)['vocab']
    if i is None:
        v.append(new); changes.append(dict(id=sid,field='vocab',index=len(v)-1,old=None,new=new,reason=reason))
    else:
        old=v[i]; v[i]=new; changes.append(dict(id=sid,field='vocab',index=i,old=old,new=new,reason=reason))

# ---------- a2-01
line('a2-01',1,'Ese día era la <b>boda</b> de su hermana en Valencia.',"That day was her sister's wedding in Valencia.",
     "'Su hermana tenía una boda' sounds like she was attending someone else's wedding; it is her own wedding.")
line('a2-01',11,'—Ayer compré dos <b>billetes</b> de autobús, pero mi amigo no puede venir.',
     "\"Yesterday I bought two bus tickets, but my friend can't come.\"",
     "Pablo is still speaking but the line had no dialogue dash (and no quotes in English), so learners lose track of the speaker.")
line('a2-01',17,'Ana miró su teléfono y vio un mensaje de su madre.','Ana looked at her phone and saw a message from her mother.',
     "'Ana vio su teléfono' is unnatural (= she caught sight of it); mirar + ver keeps the irregular 'vio' and teaches the look/see contrast.")
line('a2-01',22,'—¡Pablo! —dijo Marta—. ¡Eres el primo de Javier, mi novio!',"\"Pablo!\" said Marta. \"You're the cousin of Javier, my groom!\"",
     "Javier was never introduced, so the twist was unreadable; naming him as the groom makes the inference fair and supports quiz Q5.")
quiz('a2-01',4,{"q":"¿Qué descubrimos al final de la historia?","options":["Pablo no conoce a nadie en la boda","Ana no quiere hablar con Pablo","Pablo es de la familia del novio","Marta está enfadada con Ana"],"answer":2},
     "Old key said Pablo is a 'friend' of the groom's family; the text says he is the groom's cousin (family). Stem reworded to match.")
field('a2-01','prompt',"Tell about a time you were late for something important. Where were you going, what happened first, and how did the day end? Write 4-6 sentences in Spanish in the past tense, using primero, luego and después. Starter: «El año pasado llegué tarde a… Primero, perdí… Luego…»",
      "Added a starter and asked explicitly for the sequence words the story teaches.")
conc('a2-01','grammar',"Regular and irregular preterite (llegó, corrió, perdió, vio, dijo); sequence words primero, luego, después; ir a + infinitive for near future (voy a llegar) vs ir a + place (voy a Valencia); reflexive verbs (se sentó, se casa, me llamo).",
     "Removed 'fue' (not in the story); added the ir a + place contrast and reflexives, which the grammar notes teach from this story.")

# ---------- a2-02
for i,(old,new) in {4:('Doña Lupe','doña Lupe'),8:('Doña Lupe','doña Lupe'),21:('Doña Lupe','doña Lupe')}.items():
    L=S('a2-02')['lines'][i][0]
    line('a2-02',i,L.replace(old,new),None,"Spelling: 'doña' is lowercase before a name (RAE), and the other A2 stories already write 'don Rafael', 'doña Elena'.")
line('a2-02',10,'En la panadería, el <b>panadero</b> tomó los mangos y le dio un pan dulce.',None,
     "'el panadero' is in the vocab list but was never bolded.")
line('a2-02',14,'Sofía abrió la puerta con la llave y oyó un ruido pequeño.','Sofía opened the door with the key and heard a small noise.',
     "Plot hole: the key from the box is never used (the door 'opened by itself'). Now the key pays off and 'abrió' is recycled.")
line('a2-02',19,'Después, toda su familia salió de la casa.','Then her whole family came out of the house.',
     "'Detrás de ella ... salió de la casa' is spatially contradictory (she is at the door, facing the house); 'Después' also recycles a target sequence word.")
quiz('a2-02',0,{"q":"¿Qué hay dentro de la caja azul?","options":["Un perro","Un papel y una llave","Unos mangos","Una cinta roja"],"answer":1},
     "'¿Qué hay primero dentro...' is ungrammatical/unclear.")
field('a2-02','prompt',"Describe a surprising gift you gave or received. What was it, who gave it to you, and how did you feel? Write 4-6 sentences in Spanish in the past tense. Starter: «Para mi cumpleaños, mi tía me dio… Primero abrí… Luego…»",
      "Added a starter and asked for the past tense (the story's target).")
conc('a2-02','grammar',"Preterite of regular -ar/-er/-ir verbs (abrió, caminó, corrió) and irregular ser (fue), ver (vio), dar (dio), decir (dijo), oír (oyó); tú commands in the clues (ve, busca, lleva); object pronouns (le dio, te lo regala); time words ayer, por la mañana.",
     "Removed 'ir' (no preterite of ir in the text); added tú commands, which the grammar notes teach from this story.")

# ---------- a2-03
line('a2-03',26,'Esa noche, toda la familia cenó junta alrededor de la <b>mesa</b>.','That night, the whole family had dinner together around the table.',
     "'comió junto a la mesa' means 'ate next to the table'; the English 'together' was not in the Spanish.")
quiz('a2-03',3,{"q":"¿Qué hizo la abuela cuando Mateo salió a buscar los vasos?","options":["Llamó a la madre de Mateo","Cerró un frasco pequeño","Escribió el secreto en el cuaderno","Cortó más cebolla"],"answer":1},
     "Old Q4 ('¿Qué falta en el cuaderno?') had giveaway distractors (la carne, el teléfono) and duplicated Q5. New item checks a key detail and the clue to the secret.")
quiz('a2-03',4,{"q":"¿Por qué la abuela no escribe el secreto en el cuaderno?","options":["Se le olvidó escribirlo","Es un ingrediente muy caro","Mateo no sabe leer su letra","Así sus nietos siempre la visitan"],"answer":3},
     "Replaced joke distractors ('No tiene lápiz', 'No sabe escribir') with plausible ones; answer moved off index 0 (keys were 0,2,3,0,0).")
field('a2-03','prompt',"Write about a time you cooked something for someone. What did you make, what did you buy, what did you do first, and how did it taste? Write 4-6 sentences in Spanish in the past tense. Starter: «El domingo pasado preparé… para… Primero compré… Luego corté…»",
      "Old prompt was in the present tense, so it did not elicit the preterite the story teaches. Added a starter.")
conc('a2-03','grammar',"Preterite of regular verbs (cortó, cocinó, probó, tomé, entraron) and irregular ones (fue, puso, hice, dijo); ser vs estar (está rico / no es igual / estoy en la puerta); falta + noun; sequence words primero, luego, después, cuando.",
     "'tomó' was listed as irregular (it is regular); added ser vs estar and falta, which the grammar notes teach from this story.")

# ---------- a2-04
line('a2-04',0,'Cuando Tomás era pequeño, vivía en un barrio pequeño de Medellín.','When Tomás was little, he lived in a small neighborhood in Medellín.',
     "Tomás is twelve, so 'cuando era niño' (when he was a child) is odd; 'pequeño' = when he was little.")
line('a2-04',13,'«Cuando éramos pequeños, ella siempre tiraba a la izquierda», pensó.','"When we were little, she always kicked to the left," he thought.',
     "Same logic fix as line 0; also echoes line 0 for repetition.")
quiz('a2-04',4,{"q":"¿Cómo supo Tomás adónde iba a tirar Camila?","options":["La conoce muy bien","El árbitro se lo dijo","Vio un video","Camila se lo dijo"],"answer":0},
     "'adónde tiraba' is ambiguous (habit vs this kick); 'iba a tirar' is the correct past-future and models a structure from the story.")
field('a2-04','prompt',"Describe a game or sport you played when you were little. Where did you play, who played with you, and what happened in one special match? Write 4-6 sentences in Spanish: use the imperfect for what you usually did and the preterite for what happened once. Starter: «Cuando era pequeño/a, siempre jugaba… Un día…»",
      "Made the imperfect/preterite contrast explicit and added a starter.")

# ---------- a2-05
line('a2-05',9,'«¡Perdón! Mi mamá <b>cambió</b> de número ayer y creo que lo anoté mal. Ahora estoy solo en la calle y mi teléfono casi no tiene <b>batería</b>».',
     "\"Sorry! My mom changed her number yesterday and I think I wrote it down wrong. Now I'm alone in the street and my phone is almost out of battery.\"",
     "Plot hole: changing number does not explain why the text reached Valentina; 'lo anoté mal' makes the wrong number logical.")
line('a2-05',22,None,"Nicolás's mother hurried out of the car with the keys in her hand.",
     "'got out running' is unidiomatic English for 'bajó corriendo'.")
line('a2-05',23,'—¡Hijo, perdón! Estaba trabajando y mi teléfono nuevo no tenía batería.',None,
     "'no tenía batería en mi teléfono nuevo' is awkward; the phone is the natural subject.")
field('a2-05','prompt',"Imagine you receive a text from a wrong number. Write the message and your answer, then tell in 4-6 sentences in Spanish what happened next. Use the imperfect for the scene and the preterite for the events. Starter: «Eran las nueve de la noche y yo estaba en casa. De repente, llegó un mensaje…»",
      "Added a starter and an explicit imperfect/preterite instruction.")

# ---------- a2-06
vocab('a2-06',0,["el apartamento","apartment (in Chile: el departamento)"],"Story is set in Santiago; Chileans say 'departamento'. Gloss flags the regional variant without changing the text.")
vocab('a2-06',9,["la bombilla","light bulb (in Chile: la ampolleta)"],"In Chile 'bombilla' is the metal straw for mate; light bulb is 'ampolleta'. Gloss prevents a real-world misunderstanding.")
field('a2-06','prompt',"Describe in Spanish a time you moved house or stayed in a new place. What did you take with you, who helped you, and was there a problem? Write 4-6 sentences in the past tense. Starter: «Hace dos años me mudé a… Mi amigo… me ayudó. El problema era que…»",
      "Added a starter and a 'problem' slot to elicit preterite + imperfect.")

# ---------- a2-07
line('a2-07',13,'—Es muy bonita, pero es más vieja que yo —dijo—. <b>Ven</b> conmigo a la tienda.',None,
     "Bolded 'Ven' so the new voseo gloss (vení) is attached to the word in the text.")
vocab('a2-07',None,["ven (vos: vení)","come! (in Buenos Aires people say vení; also tocá, tomá)"],
      "Review flag: the Buenos Aires story uses tú forms consistently; this gloss tells learners the vos forms they will actually hear there.")
quiz('a2-07',3,{"q":"¿Por qué Julieta salió corriendo el jueves?","options":["Tenía miedo de Mateo","Su madre la llamó","Fue a buscar ayuda para él","Tenía que volver a casa"],"answer":2},
     "Replaced the implausible distractor 'Quería comprar una moneda'.")
field('a2-07','prompt',"Write in Spanish about a musician, street performer or artist you have seen. Where were they, what did they usually do, and what happened that day? Write 4-6 sentences. Starter: «Un día, en la plaza de mi ciudad, había un músico que tocaba… De repente…»",
      "Added a starter and a slot for habitual imperfect vs one-off preterite (the story's contrast).")
conc('a2-07','grammar',"Imperfect for habits (tocaba, llegaba, se sentaba) contrasted with preterite for one-time events (se rompió, salió, aceptó); indirect object pronouns (le dijo, me contó, le cambió); double pronouns (se la mostró, pagártelo); comparisons (más vieja que, más bonita que); ir a + infinitive; tú commands (ven, toca, toma). Buenos Aires note: locals use vos (vení, tocá, tomá); this story uses tú forms, and the vocab list glosses the vos form.",
     "Note now points to the vos gloss; added pagártelo.")

# ---------- a2-08
line('a2-08',6,'—Si hay niebla, camina despacio y sigue el <b>río</b> —le explicó a Andrés—. Lo importante es no correr.',
     "\"If there is fog, walk slowly and follow the river,\" he explained to Andrés. \"The important thing is not to run.\"",
     "Jairo used singular tú commands while 'les explicó' addressed both cousins (in Colombia the plural is ustedes: caminen, sigan). Addressing Andrés keeps the tú commands correct.")
line('a2-08',20,'La señora les dio <b>chocolate</b> caliente con queso. —Es una costumbre de aquí. Pruébalo —le dijo a Andrés.',
     "The woman gave them hot chocolate with cheese. \"It's a local custom. Try it,\" she said to Andrés.",
     "Same singular/plural issue: 'Pruébalo' to two people. Addressing Andrés, who tastes it next, keeps the tú command correct.")
vocab('a2-08',12,["perdido/a","lost"],"The text uses the adjective 'perdidos', not the verb perderse.")
quiz('a2-08',0,{"q":"¿Por qué querían levantarse temprano?","options":["Porque Jairo quería salir temprano","Porque Valeria quería ver salir el sol","Porque Andrés tenía hambre","Porque el valle cerraba a las siete"],"answer":1},
     "Distractor used B1 verb 'exigió'; replaced with an A2-level plausible option.")
field('a2-08','prompt',"Write in Spanish about a trip or walk in nature (real or imagined). Where were you, what was the weather like, what did you see, and did anything go wrong? Write 5-7 sentences. Starter: «El verano pasado fui a… Hacía sol y había… Pero de repente…»",
      "Added a starter that models imperfect background + preterite event.")
conc('a2-08','grammar',"Preterite for the sequence of events (llegaron, gritó, vieron, cubrió) with imperfect for background (había montañas, caminaba, estaba asustado, se oía); comparatives and superlatives (las más altas del mundo, mejor que, tan asustado que); tú commands (camina, sigue, recuerda, escucha, pruébalo); reflexive verbs (levantarnos, se paró, se puso nervioso, se quedó, se rió).",
     "Removed examples not in the story (se levantó, había niebla, para ti, por/para).")

# ---------- a2-09
line('a2-09',4,'De repente, un señor con mucha prisa <b>chocó</b> con ella y le tiró su café en la <b>camisa</b> blanca.',
     'Suddenly, a man in a big hurry bumped into her and spilled his coffee on her white shirt.',
     "'su café cayó sobre su camisa' has two ambiguous 'su'; 'le tiró su café' is clearer and sets up the phrase Daniela repeats in line 15.")
line('a2-09',15,'—Lo siento —contestó Daniela—. Mi alarma no sonó, un señor me tiró un café encima y después ayudé a una señora. Nunca he llegado tarde a una entrevista.',
     "\"I'm sorry,\" Daniela answered. \"My alarm didn't ring, a man spilled coffee on me, and then I helped a lady. I have never been late to an interview.\"",
     "Flagged error: 'se me cayó un café' means 'I dropped a coffee', contradicting the plot (a man spilled his coffee on her).")
line('a2-09',19,'—Hoy quería ver cómo tratan los candidatos a una desconocida —explicó doña Elena—. Tú me ayudaste sin saber quién era.',None,
     "'una persona extraña' means 'a strange/odd person'; 'stranger' is 'una desconocida'.")
line('a2-09',21,'—¿Ha trabajado antes con clientes? —preguntó la señora Ortega.',None,
     "Register: Ortega uses usted in line 14 (Llega tarde, tiene) but switched to tú here; now consistent usted.")
line('a2-09',24,'—Daniela, tenemos una buena <b>noticia</b> —dijo la señora Ortega—. El <b>puesto</b> es suyo.',None,
     "Register: Ortega's 'tuyo' broke her usted register; 'suyo' is consistent and fits the story's usted/tú teaching point.")
field('a2-09','prompt',"Imagine your own interview day, or a day when everything went wrong. Write in Spanish what happened and how you solved it, in 5-7 sentences. Include one sentence with 'Nunca he…' or 'He…'. Starter: «Mi alarma no sonó y me desperté tarde. Mientras esperaba el autobús…»",
      "Added a starter and a present-perfect slot, which the story teaches.")
conc('a2-09','grammar',"Preterite and imperfect together in a longer narrative; present perfect (he llegado, ha pasado, ha trabajado, he trabajado); llevar + time + gerund (llevo veinte minutos buscándola); connectors porque, aunque (with indicative), mientras, por eso; indirect object pronouns (le tiró, me tiró, me ayudaste); reflexive past (se despertó, se vistió, se sentó, se puso nerviosa); usted vs tú (Ortega uses usted, Elena uses tú).",
     "Removed 'se me cayó' (no longer in the text) and 'para ti' (never was); added llevar + gerund and the usted/tú contrast.")
conc('a2-09','skills',"Following a plot with a surprise twist, making an inference about why a decision was made, and noticing who uses formal usted (the interviewer) and who uses tú (the founder, the man in the metro).",
     "Made the register point concrete now that Ortega is consistently usted.")

# ---------- a2-10
line('a2-10',3,'Todos los vecinos hacían <b>faroles</b> de papel y los llevaban por las calles al <b>anochecer</b>.',None,
     "'el anochecer' is in the vocab list but was never bolded.")
line('a2-10',6,'Su primo Pablo la ayudó. Durante cuatro días trabajaron en el <b>granero</b> con papel, <b>pegamento</b> y mucha paciencia.',None,
     "'el pegamento' is in the vocab list but was never bolded.")
line('a2-10',15,'La panadera trajo papel y pegamento. El <b>carpintero</b> <b>reparó</b> la pata. Los niños <b>pintaron</b> el papel nuevo.',
     'The baker brought paper and glue. The carpenter repaired the leg. The children painted the new paper.',
     "'las estrellas' (which stars?) were never introduced; 'el papel nuevo' links back to the problem in line 13.")
line('a2-10',23,'Ella sonrió con lágrimas en los ojos. Aunque llovió la noche anterior, esa fue la mejor noche de su vida.',None,
     "'noche' (A1 word, not in vocab list) was bolded as if it were new vocabulary.")
field('a2-10','prompt',"Write in Spanish about a festival or celebration you went to. Where was it, what did people usually do, and what happened that day? Write 5-7 sentences, using the imperfect for what people did and the preterite for what happened. Starter: «Cada año, en mi ciudad, la gente… El año pasado…»",
      "Old prompt was in the present tense, so it did not elicit the story's past tenses. Added a starter.")
conc('a2-10','grammar',"Preterite and imperfect woven together in a longer story (empezó, cayó, trabajaron / viajaba, hacían, cantaba); present perfect (he visto) and past perfect (había aprendido); connectors mientras, porque, aunque (with indicative); object pronouns (le dijo, la ayudó, se lo contó); comparisons (más bonito que, el más grande); near future ir a; tú command (no llores); time and purpose phrases (por la mañana, para todos, para arreglarlo).",
     "'trabajaban' is not in the text; added the past perfect, which the grammar notes teach from this story.")

order=[s['id'] for s in allst if s['id'].startswith('a2-')]
fixed=[stories[i] for i in order]
json.dump(fixed,open(OUT+'a2-stories-fixed.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
json.dump(changes,open(OUT+'a2-story-changes.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
# sanity
orig={s['id']:s for s in allst}
for s in fixed:
    assert len(s['lines'])==len(orig[s['id']]['lines'])
    for a,b in zip(s['lines'],orig[s['id']]['lines']):
        assert a[0].count('<b>')==a[0].count('</b>')
print(len(changes),'changes')
