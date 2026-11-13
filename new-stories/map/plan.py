# Source of truth for the B1/B2 grammar map. build_map.py verifies it against stories/all-stories.json and emits map.json.
# Evidence: (line, quote). Each quote must occur in the tag-stripped line AFTER the edits below are applied.
# Edits: (line, old, new_es, new_en). old = exact substring of the tag-stripped line (insertions repeat the anchor text).
T = {}
def t(sid, role, *topics): T[sid] = {'role': role, 'topics': list(topics)}
def tp(topic, family, new, ev, edits=(), status='introduces', note=''):
    return dict(topic=topic, family=family, new=new, ev=list(ev), edits=list(edits), status=status, note=note)

# ---------------- B1 ----------------
t('b1-01','consolidates',
 tp('Preterite vs. imperfect','Past tenses',False,[
   (0,'Era una mañana fría'),(0,'paseaba por el parque del Retiro'),(1,'De repente vio algo verde'),
   (2,'Se sentó y la abrió'),(5,'llegó a un edificio estrecho'),(5,'un joven pálido hablaba con la dueña')],status='recycled',
   note='Recycled from A2 (a2-04/08/10). The opening story re-anchors the narrative pair.'),
 tp('Present perfect vs. preterite','Perfect tenses',True,[
   (7,'Creo que he encontrado algo suyo'),(10,'He tenido suerte de verla'),(10,'He venido en persona'),
   (9,'¿Dónde la encontró?')],
   edits=[(7,'¿Usted es Gustavo Montoya?','¿Usted es Gustavo Montoya? Creo que he encontrado algo suyo.','"Are you Gustavo Montoya? I think I\'ve found something of yours."'),
          (10,'Quería devolvérsela hoy mismo, porque sé','He venido en persona porque quería devolvérsela hoy mismo; sé','"I\'ve come in person because I wanted to return it to you today; I know what it feels like when you lose something important."')],
   note='Inés (Madrid) uses the Peninsular same-day perfect. Gustavo (Chilean) answers with the preterite (¿Dónde la encontró?), which gives a built-in regional contrast. This replaces b1-03 as the main presentation of the present perfect.'),
 tp('Pluperfect for earlier events','Perfect tenses',False,[
   (11,'su abuela había nacido en Madrid'),(11,'se había marchado a Chile'),(11,'Él había viajado hasta allí'),(14,'donde había vivido su abuela')]),
 tp('Future in the past','Conditionals & si-clauses',False,[
   (3,'ahora estaría muy preocupado'),(15,'le mandaría una postal'),(15,'lo haría')]),
)
t('b1-02','consolidates',
 tp('Future tense','Verb phrases & near future',False,[
   (2,'me levantaré a las cinco'),(2,'iré a la feria'),(2,'compraré el mejor lomo'),(2,'Los jueces probarán'),(2,'no podrán hablar'),
   (2,'pagaremos el alquiler'),(4,'Los organizadores pondrán'),(5,'tendrás más experiencia'),(13,'Que ganarás otra vez')]),
 tp('Si-clauses with present','Conditionals & si-clauses',False,[
   (2,'Si ganamos, pagaremos'),(3,'si el pan está frío, el chivito está triste'),(9,'Si te portás bien, te presto la mitad'),
   (12,'si venís todos los jueves'),(13,'Si llevás el carbón')],note='Real conditions only. Hypothetical si comes in b1-08.'),
 tp('Object pronoun order: se lo, te la','Pronouns & personal a',True,[
   (1,'se lo llevó a su abuela'),(11,'Se lo digo'),(12,'te la cuento')],
   edits=[(11,'—Leche, azúcar,','—Se lo digo: leche, azúcar,','"I\'ll tell you: milk, sugar, …"')],
   note='Covers the essentials-b1 topic "Object pronoun order: se lo, me la".'),
)
t('b1-03','consolidates',
 tp('Conditional tense','Conditionals & si-clauses',False,[
   (4,'pensaría en comprar un horno eléctrico'),(5,'Un horno eléctrico no haría el mismo pan'),(8,'podríamos entregar todos los pedidos')],
   edits=[(5,'Un horno eléctrico no hace el mismo pan','Un horno eléctrico no haría el mismo pan','"An electric oven wouldn\'t make the same bread."')],
   note='The current grammar example already quotes "no haría", so this edit also fixes the mismatch the audit found between example and text. Si yo fuera usted and Si … nos prestara stay in the text for recognition only.'),
 tp('Present perfect vs. preterite','Perfect tenses',True,[
   (4,'La pared de atrás se ha agrietado'),(5,'ya me han quitado la mitad de los clientes'),(12,'Lo hemos hablado entre todos'),(12,'Usted nos ha dado pan durante cuarenta años')],
   status='recycled',note='Second exposure. The explanation should say that Mexican speakers keep the perfect for situations that continue into the present (nos ha dado pan durante cuarenta años) and use the preterite for finished events.'),
 tp('Relative clauses: que, en que','Relative clauses & connectors',True,[
   (1,'la época del año en que La Espiga vendía'),(2,'Su nieto Iván, que la ayudaba'),(6,'su difunto marido, que había construido ese horno'),
   (7,'la señora Graciela, que tenía un horno grande'),(7,'las hermanas Santiago, que hacían empanadas'),(9,'Don Chema, que nunca había hecho pan'),
   (11,'personas que esperaban con sonrisas'),(13,'el barrio que la rodeaba')]),
)
t('b1-04','introduces',
 tp('Impersonal se: se puede, se cura','Reflexives & se',True,[
   (6,'se puede tocar el cielo'),(13,'se cura más rápido'),(13,'se siente vivo')],
   note='The same line also has impersonal 3rd person plural: a uno lo cuidan / lo escuchan.'),
 tp('Verb phrases: llevar + gerund, seguir, volver a','Verb phrases & near future',True,[
   (0,'llevaba tres años trabajando'),(9,'sigue llegando'),(15,'volvió a llamar a su hermana')],
   edits=[(15,'Esa semana llamó a su hermana','Esa semana volvió a llamar a su hermana','"That week he called his sister again"')],
   note='Partly covers the essentials-b1 verb-phrase topic. acabar de and dejar de are still not a headline topic anywhere.'),
 tp('Pluperfect for background','Perfect tenses',False,[
   (1,'se había caído en la calle'),(1,'se había lastimado la cadera'),(1,'Los médicos habían dicho'),(7,'nunca había levantado la vista'),
   (8,'astrónomos que habían vivido siglos atrás'),(10,'se había convertido en un amigo'),(15,'había abierto una ventana')],status='recycled',
   note='Second and last pluperfect headline at B1 (it used to be a headline in 8 of 10 stories).'),
)
t('b1-05','consolidates',
 tp('Por vs. para','Por & para',True,[
   (0,'por la venta de la casa'),(0,'Por eso'),(1,'un lunes por la mañana'),(14,'quemados por el sol'),
   (2,'para volver a casa'),(6,'traje uno para ti'),(8,'para pasar la noche'),(14,'para llevar las alforjas pesadas'),(15,'para volver a alguien')],
   note='Essentials-b1 topic. Por = cause, time of day, agent. Para = purpose, recipient.'),
 tp('Conditional tense','Conditionals & si-clauses',False,[
   (9,'no le hablaría de nada importante'),(9,'Solo le diría'),(16,'deberíamos hacer otro viaje'),(17,'adónde irían'),(17,'ninguno de los dos dejaría')],
   status='recycled',note='Replaces "Hypotheticals about the past", which is a B2 structure. The line "Si hubiera sido más paciente, no habríamos perdido tres años" stays in the text for recognition only.'),
 tp('Reported speech','Reported speech',False,[
   (6,'Papá siempre decía que si uno quiere llegar lejos'),(8,'les contó que había perdido a su propio hermano'),(15,'Dijo que el mejor camino para volver a alguien es')],
   note='First look: decir/contar que + statement, with little tense change.'),
)
t('b1-06','introduces',
 tp('Subjunctive after opinion and wish','Subjunctive',False,[
   (10,'No creo que ella conteste pronto'),(10,'espero que lo haga'),(11,'Es importante que no se haga ilusiones'),(14,'Rocío quiere que la llames')],
   note='The present subjunctive starts here (wish, doubt, importance).'),
 tp('Negative commands','Commands & formality',False,[
   (3,'no te rías de mí'),(11,'no le digas nada'),(15,'no vendas la casa todavía')],
   edits=[(11,'—Todavía no —respondió Marisol—.','—Todavía no, no le digas nada —respondió Marisol—.','"Not yet, don\'t tell her anything," Marisol replied.')],
   note='Links the new subjunctive form to negative tú commands.'),
 tp('Reported speech','Reported speech',False,[
   (4,'Contó que Octavio había sido su primer amor'),(5,'Octavio me dijo que se iba a trabajar'),(5,'Prometió que me escribiría'),
   (5,'y que volvería cuando tuviera'),(8,'le pidió que investigara')],status='recycled',
   note='Second exposure, now with tense shifts (iba a, escribiría, volvería, había sido).'),
)
t('b1-07','introduces',
 tp('Commands','Commands & formality',False,[
   (1,'Respira hondo'),(1,'no cuentes el chiste'),(4,'Imaginen que van caminando'),(4,'Observen, por favor'),(5,'Gire a la derecha'),
   (7,'¡Ponte la bufanda'),(7,'llama a tu abuela'),(9,'¡Ayúdame, por favor!'),(13,'Piense en los niños'),(14,'Vuelve ya')],
   note='The full system: tú, usted and ustedes, affirmative and negative, with pronouns attached (Ponte, Ayúdame).'),
 tp('Present subjunctive after wishes','Subjunctive',False,[
   (2,'Quiero que todo salga perfecto'),(10,'Si prefieren que nos vayamos'),(15,'espero que por fin se tome el jugo')]),
 tp('Subjunctive after para que, antes de que','Subjunctive',True,[
   (1,'para que te entiendan'),(13,'una manera de que la familia acompañe a la gente'),(14,'antes de que cambien de opinión')],
   edits=[(1,'Habla despacio, sonríe','Habla despacio para que te entiendan, sonríe','"Speak slowly so they understand you, smile…"'),
          (14,'—Vuelve ya —le dijo—.','—Vuelve ya, antes de que cambien de opinión —le dijo—.','"Come back now, before they change their minds," she said.')],
   note='Purpose and time conjunctions (essentials-b1). There is also a bonus token: Cuando mi hijo sea famoso (line 15).'),
)
t('b1-08','introduces',
 tp('Si + imperfect subjunctive + conditional','Conditionals & si-clauses',False,[
   (5,'Si no fuera por usted, hoy no sería ingeniera'),(9,'Si volviera a empezar, elegiría otra vez esta escuela'),(12,'Si se quedara en casa, tendría tiempo para todos ellos')],
   edits=[(5,'Hoy soy ingeniera.','Si no fuera por usted, hoy no sería ingeniera.','"If it weren\'t for you, I wouldn\'t be an engineer today."'),
          (9,'porque cada uno de ustedes me enseñó algo a mí.','porque cada uno de ustedes me enseñó algo a mí. Si volviera a empezar, elegiría otra vez esta escuela.','"…because each of you taught me something. If I started again, I would choose this school again."'),
          (12,'en los libros que había prometido leer.','en los libros que había prometido leer. Si se quedara en casa, tendría tiempo para todos ellos.','"…the books he had promised to read. If he stayed at home, he would have time for all of them."')],
   note='Moved here from b1-03/04/05 so that it comes after the present subjunctive (b1-06/07). No story after b1-06 has a natural token, so all 3 tokens come from edits.'),
 tp('Subjunctive after cuando, aunque, ojalá','Subjunctive',True,[
   (10,'aunque les dé vergüenza'),(10,'cuando alguien los ayude'),(11,'Ojalá pueda venir los sábados')]),
 tp('Relative clauses: donde, que, lo que','Relative clauses & connectors',False,[
   (3,'el pasillo, donde los murales'),(4,'adultos que él reconocía'),(4,'lo que más lo desconcertó'),(8,'la primera que él había usado'),
   (11,'a quienes no tienen quien los ayude'),(11,'algo que él no esperaba')],status='recycled',
   note='Extends b1-03 (que) with donde, lo que and quien.'),
)
t('b1-09','introduces',
 tp('Reported commands','Reported speech',False,[
   (2,'gritaba que no usaran el ascensor'),(2,'que bajaran con cuidado'),(5,'le dijo que no tuviera miedo')],
   edits=[(5,'Soledad se arrodilló a su lado y le propuso','Soledad se arrodilló a su lado, le dijo que no tuviera miedo y le propuso','"Soledad knelt beside him, told him not to be afraid and suggested…"')],
   note='The story also has reported statements: Decía que la oscuridad le daba miedo (5), contó que su esposa había fallecido (8).'),
 tp('Commands with ustedes and usted','Commands & formality',False,[
   (3,'¡Cálmense todos!'),(9,'prométanme una cosa'),(12,'escriba su nombre abajo')],status='recycled',
   note='Pronouns attach to ustedes commands (Cálmense, prométanme).'),
 tp('Verbs of change: ponerse, quedarse, convertirse','Reflexives & se',True,[
   (0,'el cielo se puso negro'),(8,'el edificio entero se convirtió en una cocina improvisada'),(10,'Gonzalo se quedó dormido')],
   note='The B1 half of the verbs-of-change topic. volverse and hacerse follow in b2-08.'),
)
t('b1-10','recycles',
 tp('Passive and impersonal se','Reflexives & se',True,[
   (13,'Se pone sobre el aserrín'),(13,'se llena de colores'),(16,'no se hacen para durar')],
   note='Essentials-b1 string. There is also a bonus token: sin ser vistas (6) previews the ser passive.'),
 tp('Subjunctive after wishes and hasta que','Subjunctive',False,[
   (1,'espero que veas los volcanes'),(6,'Espero que la casa todavía exista'),(14,'quiero que la haga usted'),(14,'hasta que la terminemos juntas')],
   status='recycled'),
 tp('Por vs. para','Por & para',True,[
   (2,'por primera vez'),(3,'Por eso la llamamos Antigua'),(7,'por esa calle'),(6,'para que las monjas pudieran cruzar'),(9,'para tocar'),(16,'para durar')],
   status='recycled'),
)

# ---------------- B2 ----------------
t('b2-01','consolidates',
 tp('Subjunctive after conjunctions (para que, sin que, antes de que...)','Subjunctive',True,[
   (2,'hasta que terminara el invierno'),(3,'para que nunca llegaran a su destino'),(7,'sin que le temblara la voz'),(8,'para que algún futuro archivista tuviera')],
   note='Essentials-b2 string. sin que is new at this level.'),
 tp('Aunque: indicative vs subjunctive','Subjunctive',False,[
   (1,'aunque se sentía un poco culpable'),(3,'aunque nunca se puede estar seguro'),(4,'aunque te advierto'),(7,'Aunque él ya no esté para oírlo')]),
 tp('Si + imperfect subjunctive, conditional','Conditionals & si-clauses',False,[
   (2,'si ella aún quisiera verlo, la esperaría'),(2,'Si pudiera repetir aquella tarde, no me marcharía'),(3,'si él fuera el contable de entonces, tal vez actuaría'),
   (4,'Si fuera más joven, saldría'),(4,'si usted me dejara, yo podría'),(7,'si pudiera hablar con él hoy')],status='recycled',
   note='Recycled from b1-08. This is the only B2 headline for the structure (it used to be 3).'),
)
t('b2-02','consolidates',
 tp('Concession: aunque, por mucho que','Subjunctive',False,[
   (0,'aunque se negaba a admitirlo'),(3,'por brillante que fuese'),(6,'por mucho que me guste imitarla'),(9,'aunque no lo diga')],
   note='The focus is por mucho que / por + adjective + que. aunque revisits b2-01.'),
 tp('Verb phrases: seguir, acabar + gerund; soler','Verb phrases & near future',True,[
   (0,'llevaba once años dirigiendo'),(2,'si siguiéramos haciendo siempre lo mismo'),(2,'el negocio acabaría cerrando'),(4,'solía decir'),(9,'suele salir sorprendido')]),
 tp('Subjunctive after no es que, temer que, a que','Subjunctive',True,[
   (1,'como si temieran que la hija pródiga volviera'),(2,'no viene a que le expliquen la comida'),(2,'Viene a que se la den'),(3,'No era que don Leandro fuera terco')]),
)
t('b2-03','introduces',
 tp('Como si + imperfect subjunctive','Subjunctive',False,[
   (1,'como si fueran a escalar el Everest'),(3,'como si la mano que escribía envejeciera'),(4,'como si fuera un expediente'),(7,'como si llevara piedras')],
   note='The only B2 headline for como si (it used to be 3).'),
 tp('Passive: ser + participle and se','Passive voice',True,[
   (3,'Dentro se encontraron unos calcetines'),(3,'En la primera página se leía'),(4,'se celebra el Año Santo Jacobeo'),(4,'el sepulcro del apóstol fue descubierto'),
   (5,'en Santiago se vendían'),(9,'que fue esculpido por el Maestro Mateo'),(9,'impulsado por ocho hombres'),(9,'gastada por millones de manos')],
   edits=[(4,'el sepulcro del apóstol se descubrió en el siglo IX','el sepulcro del apóstol fue descubierto en el siglo IX','"the apostle\'s tomb was discovered in the 9th century"'),
          (9,'el Pórtico de la Gloria, obra del Maestro Mateo en el siglo XII,','el Pórtico de la Gloria, que fue esculpido por el Maestro Mateo en el siglo XII,','"the Pórtico de la Gloria, which was carved by Master Mateo in the 12th century,"')],
   note='Covers the ser and se parts of the essentials-b2 passive topic. estar + participle is in b2-06. Without the edits the story has passive se and participle + por, but no ser passive.'),
 tp('Imperfect subjunctive in subordinate clauses','Past tenses',False,[
   (0,'le había exigido que caminara'),(1,'para que le pusieran otro sello'),(9,'insistió en que vieran el Pórtico'),(10,'le pidió que escribiera ella la entrada')]),
)
t('b2-04','introduces',
 tp('Indicative vs subjunctive: opinion, doubt and emotion','Subjunctive',True,[
   (3,'es posible que les mintiera'),(6,'me temo que la frase significa'),(7,'No esperaba que una traductora desconocida le hiciera'),(7,'mucho menos que le produjera alivio'),(9,'es posible que no fuera del todo franco')],
   note='Essentials-b2 string. me temo que + indicative contrasts with no esperaba que + subjunctive.'),
 tp('Discourse markers: sin embargo, en cambio, en cuanto a','Relative clauses & connectors',True,[
   (2,'Aquel libro, sin embargo'),(3,'el español, en cambio'),(9,'Precisamente'),(10,'La embajada, por su parte'),(10,'En cuanto a ella')]),
 tp('Ojalá and como si with pluperfect','Subjunctive',False,[
   (6,'ojalá yo hubiera tenido esa libertad'),(7,'como si la hubiera escrito otra persona'),(8,'como si le hubieran confiado una carga')],
   edits=[(7,'le parecía casi cómica su propia cautela.','le parecía casi cómica su propia cautela, como si la hubiera escrito otra persona.','"…his own caution seemed almost comic, as if someone else had written it."')],
   note='Introduces the pluperfect subjunctive form in simple frames before si + pluperfect in b2-05.'),
)
t('b2-05','introduces',
 tp('Si + pluperfect subjunctive, conditional perfect','Conditionals & si-clauses',False,[
   (2,'Si alguien hubiera entrado, la habría escuchado'),(6,'si yo hubiera querido robarlo, no habría ofrecido'),(7,'Si el hombre del paraguas hubiera entrado, la campanita habría sonado'),
   (7,'Si a las seis y cuarto hubiera llovido, Bernardo habría vuelto'),(8,'Si me hubieras preguntado, te habría dicho')],
   note='The first of only 2 B2 headlines (it used to be 7). The deduction plot depends on it.'),
 tp('Reported speech with tense shifts','Reported speech',False,[
   (1,'les preguntaría a todos qué habían visto'),(2,'tu abuelo me dijo que bajara al sótano'),(3,'Me dijo que volvería otro día'),(4,'Olivia le contó que'),
   (5,'El pronóstico decía que llovería'),(6,'Dijo que estaba allí desde el viernes y que el lunes estaría'),(9,'le dijo que el libro ya no estaba a la venta'),(9,'el coleccionista contaría')]),
 tp('Ojalá and aunque + pluperfect subjunctive','Subjunctive',False,[
   (2,'Ojalá hubiera cerrado la vitrina'),(6,'aunque me lo hubieran regalado'),(8,'ojalá me hubieras preguntado'),(8,'Aunque me hubieran ofrecido el triple')]),
)
t('b2-06','consolidates',
 tp('Estar + participle: resulting state','Ser vs. estar',True,[
   (2,'Estaba parado a las cuatro y diez'),(3,'ni está roto'),(8,'Pensé que estaba descompuesto'),(8,'mientras ese reloj estuviera parado')],
   note='The estar part of the essentials-b2 passive topic: a resulting state, as opposed to the action in b2-03.'),
 tp('Reported speech with tense shifts','Reported speech',False,[
   (0,'advirtió que no me enseñaría a reparar relojes'),(3,'prometió que volvería a buscarlo'),(5,'Me dije que solo lo miraría'),
   (11,'Dijo que su abuela, Salomé, había fallecido'),(12,'Me pidió que no viniera'),(12,'Me rogó que no lo pusiera en marcha')],status='recycled',
   note='The second and last B2 headline (it used to be 5). Adds reported thought and reported requests.'),
 tp('Subjunctive in time clauses: cuando, hasta que, mientras','Subjunctive',True,[
   (3,'cuando estuviera listo'),(8,'mientras ese reloj estuviera parado'),(12,'hasta que ella ya no pudiera venir'),(12,'hasta que pudiera soportar oírlo')]),
)
t('b2-07','recycles',
 tp('Cleft sentences','Relative clauses & connectors',False,[
   (1,'Fue una monja de Santa Rosa quien inventó el mole'),(1,'es de esa cocina de donde viene'),(2,'fue el viento el que tiró'),(3,'fue mi familia la que lo hizo bien'),(10,'fue doña Fidela la que habló')]),
 tp('Si + pluperfect subjunctive, conditional perfect','Conditionals & si-clauses',False,[
   (3,'Si mi bisabuela no les hubiera dado de comer, no habrían ganado'),(9,'si les hubiera dicho la verdad, me habrían dejado'),(10,'Si no me hubiera cambiado la receta sin pedirme permiso, me habría casado')],
   status='recycled'),
 tp('Verb phrases: llevar + gerund, llevar sin, ir + gerund','Verb phrases & near future',True,[
   (0,'llevaba diez años escribiendo'),(1,'llevaba cuarenta años sirviendo'),(4,'llevaban más de cuarenta años sin dirigirse la palabra'),
   (9,'le fui poniendo'),(11,'llevaban décadas cocinando'),(11,'sigue moliendo')]),
)
t('b2-08','introduces',
 tp('Verbs of change: volverse, hacerse, convertirse','Reflexives & se',True,[
   (2,'convertido en un hombre ancho y calvo'),(2,'se había hecho veterinario'),(3,'se había vuelto «medio español»')],
   note='Essentials-b2 topic. It builds on ponerse and quedarse from b1-09.'),
 tp('Relative clauses with prepositions; cuyo','Relative clauses & connectors',True,[
   (0,'al que sus mejores amigos habían dado la espalda'),(1,'con quien yo había compartido banda'),(3,'en el que nadie mencionó'),
   (6,'cuya goma elástica estaba ya reseca'),(10,'Brindamos por los que no habían podido venir')],
   edits=[(6,'sacó un sobre amarillento, atado con una goma elástica ya reseca.','sacó un sobre amarillento, cuya goma elástica estaba ya reseca.','"…took out a yellowed envelope whose rubber band had long since dried out."')],
   note='Essentials-b2 string. The only natural cuyo at B2 is in b2-09 line 12 (cuyo plato fuerte), so this story gets one cuyo by edit.'),
 tp('Lo + adjective and lo + adjective + que','Relative clauses & connectors',True,[
   (7,'Lo primero que noté fue alivio'),(7,'lo segundo, una vergüenza lenta'),(10,'Lo curioso es que era menos épica')],
   edits=[(10,'Era menos épica, pero más cierta','Lo curioso es que era menos épica, pero más cierta','"The odd thing is that it was less heroic, but truer"')]),
)
t('b2-09','introduces',
 tp('Subjunctive in relative clauses','Subjunctive',False,[
   (9,'Busco a alguien que me diga'),(11,'quien lo corrija tendrá que reconocer'),(12,'para todo el que quisiera oírla')],
   note='There is also a bonus token: No creo que le moleste que alguien quiera tanto (11) recycles b2-04.'),
 tp('Discourse markers: ahora bien, de modo que, por cierto','Relative clauses & connectors',True,[
   (0,'él, en cambio'),(3,'de modo que no había imágenes'),(3,'o, peor aún'),(4,'sin embargo'),(11,'Ahora bien'),(13,'por cierto')],status='recycled'),
 tp('Conditional of conjecture','Conditionals & si-clauses',False,[
   (1,'Serían las tres de la madrugada'),(1,'pensó que sería la radio'),(4,'¿qué le importaría a un guardia una caja rota?')],
   edits=[(4,'Luego, extrañada, quiso saber','Luego, extrañada —¿qué le importaría a un guardia una caja rota?—, quiso saber','"Then, puzzled (what could a broken box matter to a guard?), she wanted to know…"')]),
)
t('b2-10','recycles',
 tp('Subjunctive: whatever, whoever','Subjunctive',False,[
   (3,'dijera yo lo que dijera'),(8,'fuera quien fuera aquella pareja'),(9,'costara lo que costara'),(11,'Diga lo que diga la gente')]),
 tp('Cleft sentences','Relative clauses & connectors',False,[
   (2,'Fue esa máquina, y no la pareja ni la cúpula, la que'),(6,'Fue el nieto de uno de ellos quien'),(7,'Fue de vuelta en el archivo cuando'),(10,'fue la historia de los Quintana la que')],status='recycled'),
 tp('Conditional perfect of conjecture','Conditionals & si-clauses',True,[
   (0,'La foto tendría más de ochenta años'),(4,'¿Quién habría escrito aquella fecha?'),(4,'la habría catalogado deprisa'),(4,'la propia pareja la habría escrito'),(4,'se habría equivocado de década')],
   status='recycled',note='Extends b2-09 (serían, sería) to guesses about the past. Si + pluperfect (lines 2, 7, 10) appears again for recognition only.'),
)
