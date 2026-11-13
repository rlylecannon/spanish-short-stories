import json, copy, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..') + '/'
allst = json.load(open(B + 'stories/all-stories.json'))
orig = {s['id']: s for s in allst if s['id'].startswith('a1-')}
S = {k: copy.deepcopy(v) for k, v in orig.items()}
CH = []

def line(i, idx, es=None, en=None, why=''):
    old = list(S[i]['lines'][idx]); new = [es if es is not None else old[0], en if en is not None else old[1]]
    assert new != old, (i, idx)
    S[i]['lines'][idx] = new; CH.append(dict(id=i, field='lines', index=idx, old=old, new=new, reason=why))
def bold(i, idx, word, why='Bold glossed vocab word (markup only; plain text unchanged)'):
    es = S[i]['lines'][idx][0]; assert word in es, (i, idx, word)
    line(i, idx, es.replace(word, '<b>' + word + '</b>', 1), why=why)
def field(i, f, new, why):
    old = S[i][f]; S[i][f] = new; CH.append(dict(id=i, field=f, old=old, new=new, reason=why))
def vfix(i, es_old, new, why):
    v = S[i]['vocab']; k = [x[0] for x in v].index(es_old); old = v[k]; v[k] = new
    CH.append(dict(id=i, field='vocab', index=k, old=old, new=new, reason=why))
def vadd(i, new, why):
    S[i]['vocab'].append(new); CH.append(dict(id=i, field='vocab', index=len(S[i]['vocab']) - 1, old=None, new=new, reason=why))
def quiz(i, k, new, why):
    old = S[i]['quiz'][k]; S[i]['quiz'][k] = new; CH.append(dict(id=i, field='quiz', index=k, old=old, new=new, reason=why))
def conc(i, key, new, why):
    old = S[i]['concepts'][key]; S[i]['concepts'][key] = new; CH.append(dict(id=i, field='concepts.' + key, old=old, new=new, reason=why))

PRIOR = 'Apply gloss fix from grammar-quiz/review/a1-vocab-fixes.json (never applied to the story file)'
for p in json.load(open(B + 'grammar-quiz/review/a1-vocab-fixes.json')):
    vfix(p['id'], p['old'][0], p['new'], PRIOR)

# ---------- a1-01
i = 'a1-01'
field(i, 'teaser', 'It is a noisy morning and Tomás is missing. Where is he?', 'Old teaser ("Everyone is hungry") is not in the text; nobody says they are hungry.')
line(i, 1, 'En la casa de Lucía hay mucho <b>ruido</b>.', why='Bold "ruido": new, non-transparent word, added to vocab.')
bold(i, 4, 'sala')
line(i, 6, 'Lucía busca en el <b>baño</b>. No está.', "Lucía looks in the bathroom. He isn't there.", '"Pero hay un olor..." (line 7) had nothing to contrast with; "No está" closes the search and adds a 5th natural estar-for-location token. "baño" was in vocab but not bolded.')
line(i, 9, 'Tiene el <b>desayuno</b> en la <b>mesa</b>.', 'He has breakfast ready on the table.', 'English "He has breakfast on the table" reads as "he is eating"; the Spanish means he has it laid out. Bold "desayuno" (vocab item, never bolded).')
line(i, 10, en='"Today I\'m making breakfast!" he says.', why='Present tense for an action in progress = English present continuous.')
bold(i, 12, 'sonríe')
vadd(i, ['el ruido', 'noise'], 'Unglossed, non-cognate word in line 1.')
vadd(i, ['la sala', 'living room'], 'Used in line 4 (and a1-04) but never glossed at first use.')
vadd(i, ['buscar', 'to look for'], 'Key verb of the plot (line 6); recurs in a1-10.')
vadd(i, ['sonreír', 'to smile (sonríe)'], 'High-frequency; recurs in a1-02, a1-08, a1-09. Irregular form sonríe worth glossing.')
quiz(i, 1, {'q': '¿Cómo está mamá?', 'options': ['Contenta', 'Cansada', 'Enferma', 'Triste'], 'answer': 1}, '"Contenta y fuerte" was an odd two-part distractor that stood out; now four parallel one-word states.')
field(i, 'prompt', 'Describe your kitchen in the morning. Write 2-3 sentences in Spanish with hay and está (for example: Son las siete. Hay café y pan en la mesa. Mi papá está en la cocina.).', 'Old prompt ("What do you have for breakfast? Desayuno pan...") did not elicit the target grammar (hay, estar, telling time).')
conc(i, 'grammar', 'Telling time (Son las siete de la mañana); hay for what exists (hay mucho ruido, hay café); estar for location and states (está en la cocina, está cansada, no está); present tense and tener.', 'Added telling time and tener (both taught in grammar/a1.json); "basic greetings" was a single token.')

# ---------- a1-02
i = 'a1-02'
line(i, 2, '<b>Vende</b> <b>fruta</b>: manzanas, naranjas y <b>plátanos</b>.', why='Bold "vende" (vender in vocab) and "plátanos" (added to vocab).')
line(i, 4, '— ¿Cuánto es el kilo de <b>naranjas</b>? —pregunta una señora.', '"How much is a kilo of oranges?" asks a lady.', 'Question asked for one orange but the answer gave a price per kilo. Now question and answer match, and it still models ser for prices (¿Cuánto es...?).')
line(i, 5, '— Son tres soles, señora.', '"Three soles, ma\'am."', 'Matches the new question (kilo moved to line 4); "Son tres soles" is the clean model for the grammar point. Story word count unchanged.')
bold(i, 6, 'niño')
bold(i, 7, 'mira')
line(i, 9, '— Sí, me gustan mucho, pero no tengo <b>dinero</b>.', '"Yes, I really like them, but I don\'t have any money."', 'Gustar was the target but appeared once; the answer now recycles it (te gustan -> me gustan). "dice el niño" dropped to stay within the A1 word budget; the speaker is clear.')
line(i, 11, 'Doña Elena sonríe y le <b>da</b> las uvas.', 'Doña Elena smiles and gives him the grapes.', '"da las uvas al niño" without "le" sounds bookish; natives say "le da". The quiz key already uses "le da".')
line(i, 14, en='Tomorrow he is coming back with his mom.', why='Present for a planned future = English "is coming back".')
vadd(i, ['el plátano', 'banana'], 'Unglossed fruit in line 2.')
vadd(i, ['el sol', 'sun; sol (Peruvian currency)'], '"hay sol" and "tres soles" use the same word in two senses; learners need this.')
vadd(i, ['gustar', 'to like (me gusta / me gustan)'], 'Target structure of the story had no vocab entry.')
field(i, 'prompt', "What fruit do you like, and what fruit don't you like? Write 2-3 sentences in Spanish. Use gusta for one thing and gustan for more than one (for example: Me gusta la naranja. Me gustan las uvas. No me gustan los plátanos.).", 'Old model only showed "me gustan"; the new one contrasts gusta/gustan and the negative.')
conc(i, 'grammar', 'ser for days and prices (Es sábado; ¿Cuánto es? Son tres soles); gustar (¿Te gustan las uvas? Me gustan mucho); tener (no tengo dinero); personal a (ve a un niño, mira a su abuela).', 'Personal a is taught in grammar/a1.json but was missing; examples updated to the edited lines.')

# ---------- a1-03
i = 'a1-03'
line(i, 1, 'Hay una <b>niña</b> <b>nueva</b> en la <b>clase</b>.', why='Bold "niña" (in vocab, never bolded).')
bold(i, 3, 'largo')
bold(i, 6, 'mano')
bold(i, 10, 'juntas')
line(i, 15, 'Ahora Camila tiene una <b>amiga</b> y está contenta.', 'Now Camila has a friend, and she is happy.', 'Closes the emotional arc (nerviosa -> contenta) and gives a second estar + feeling token for the ser/estar contrast.')
vadd(i, ['largo', 'long (not "large" = grande)'], 'Classic false friend for English speakers; unglossed.')
vadd(i, ['juntos / juntas', 'together'], 'Unglossed in line 10.')
field(i, 'prompt', 'Describe a friend or classmate in Spanish. Write 3-4 sentences with ser, estar and tener (for example: Mi amiga se llama Ana. Es de México. Tiene el pelo largo. Hoy está contenta.).', "Now elicits the story's ser vs. estar contrast as well as tener.")
conc(i, 'skills', 'Understanding a description of a person; telling time with "son las / a las".', '"Introducing yourself" does not happen in the story (the teacher introduces Camila).')

# ---------- a1-04
i = 'a1-04'
line(i, 0, 'Hoy <b>llueve</b> mucho en la <b>ciudad</b>.', "It's raining hard in the city today.", '"Today it rains a lot" is unnatural English for an ongoing event. Bold "ciudad" (in vocab).')
line(i, 6, 'Julia va a la <b>tienda</b> de su <b>tío</b>.', why='Bold "tío" (in vocab, never bolded).')
line(i, 12, en="There's the red umbrella!", why='More natural English for "¡Allí está...!".')
line(i, 14, 'Su amiga Sara no tiene paraguas y no puede ir a casa.', "Her friend Sara has no umbrella and can't go home.", 'poder + infinitive was taught but appeared once; this adds a second token plus ir a + place and another negative, and motivates the gift in line 15.')
line(i, 15, 'Julia le da el paraguas azul a Sara.', 'Julia gives the blue umbrella to Sara.', 'Natural Spanish doubles the indirect object: "le da ... a Sara".')
vadd(i, ['tomar', 'to take'], 'Unglossed in line 8.')
quiz(i, 4, {'q': '¿Quién tiene el paraguas azul al final?', 'options': ['Sara', 'Julia', 'El tío', 'Papá'], 'answer': 0}, 'Keyed answer "Lo da a Sara" was ungrammatical (needs "Se lo da"); the new question avoids clitics and requires following the whole plot.')
field(i, 'prompt', 'What do you do when it rains? Write 2-3 sentences in Spanish with quiero and puedo / no puedo (for example: Cuando llueve, quiero estar en casa. No puedo ir al parque porque no tengo paraguas.).', 'Now explicitly elicits querer/poder + infinitive and porque.')

# ---------- a1-05
i = 'a1-05'
line(i, 2, '— <b>Necesitamos</b> huevos, leche y <b>azúcar</b> —dice Sofía.', why='Bold "necesitamos" (necesitar added to vocab; it is a taught topic).')
line(i, 8, '— Quiero <b>comprar</b> los huevos, pero no puedo —dice triste.', '"I want to buy the eggs, but I can\'t," he says sadly.', 'querer appeared once; this gives querer + infinitive and no puedo in one natural, emotional line.')
vadd(i, ['necesitar', 'to need'], 'Taught grammar topic (necesitar) had no gloss.')
vadd(i, ['triste', 'sad'], 'Unglossed; recurs in a1-08 and a1-09.')
vadd(i, ['¡Toma!', 'Here, take it!'], 'Common chunk in line 10 that learners will not decode from "tomar".')
field(i, 'prompt', 'What do you want to do on your birthday? Write 2-3 sentences in Spanish with quiero, necesito or puedo (for example: En mi cumpleaños quiero hacer un pastel. Necesito huevos y azúcar.).', '"What do you do" did not match the model "quiero"; now elicits all three target verbs.')

# ---------- a1-06
i = 'a1-06'
line(i, 4, 'Por eso tomo el <b>autobús</b> de las siete.', "That is why I take the seven o'clock bus.", 'The title "El autobús de las siete" was never explained in the text; recycles "tomo" (yo form, a taught topic).')
line(i, 6, en='Today the bus is late because there is a lot of traffic.', why='"arrives late" is stiff; "llegar tarde" = to be late.')
line(i, 8, 'Se llama don Julio y <b>lleva</b> un <b>libro</b> grande.', why='"don" is lowercase mid-sentence (as in a1-05 "don Luis"); bold "lleva" (llevar added to vocab).')
line(i, 15, 'Mañana le llevo un café a don Julio.', "Tomorrow I'm bringing Don Julio a coffee.", '"Mañana yo llevo café para Don Julio" is stiff (emphatic yo, no article, capital Don); this is how a native says it.')
vadd(i, ['levantarse', 'to get up (me levanto)'], 'Bolded target reflexive verb had no vocab entry.')
vadd(i, ['ducharse', 'to take a shower (me ducho)'], 'Bolded target reflexive verb had no vocab entry.')
vadd(i, ['sentarse', 'to sit down (se sienta)'], 'Bolded target reflexive verb had no vocab entry.')
vadd(i, ['llevar', 'to carry; to bring'], 'Used twice (lines 8, 15) with two senses; unglossed.')
quiz(i, 0, {'q': '¿A qué hora se levanta Lucía?', 'options': ['A las seis', 'A las siete', 'A las cinco', 'A las ocho'], 'answer': 0}, 'Two questions tested reasons (lejos, tráfico); none tested the reflexive routine or times. "A las siete" (from the title) is a strong distractor.')
quiz(i, 4, {'q': '¿Qué va a llevar Lucía mañana?', 'options': ['Pan para su esposa', 'Un café para don Julio', 'Un libro grande', 'Leche para el autobús'], 'answer': 1}, 'Option text updated to match edited line 15.')
field(i, 'prompt', 'Describe your own morning routine in Spanish. What time do you get up, and how do you go to work or school? Write 4-5 simple sentences (for example: Me levanto a las siete. Me ducho y tomo un café. Voy a la escuela en autobús.).', 'Added a model with the target reflexive verbs.')

# ---------- a1-07
i = 'a1-07'
field(i, 'teaser', 'Ana is soaking wet in a small café, and a stranger asks to share her table. Then she sees his book.', 'Old teaser ("no free tables", "wet coat") contradicts line 3 (there is a free table); no coat is mentioned.')
line(i, 2, 'No tiene <b>paraguas</b> y su <b>ropa</b> está <b>mojada</b>.', why='Bold "ropa" (added to vocab).')
line(i, 3, 'Hay una mesa <b>libre</b> cerca de la <b>ventana</b>.', why='Bold "libre" (false friend, added to vocab).')
line(i, 13, 'Afuera llueve mucho, pero ellos están <b>contentos</b>.', "Outside it's raining hard, but they are happy.", '"la lluvia es fuerte" is stiff; "llueve mucho" is the natural phrase and recycles line 0.')
vadd(i, ['libre', 'free (available; "free of charge" = gratis)'], 'False friend; key to lines 3 and 7.')
vadd(i, ['la ropa', 'clothes (singular in Spanish: la ropa está mojada)'], 'Unglossed; the grammar topic notes the singular agreement.')
vadd(i, ['la historia', 'story (also history)'], 'Unglossed in line 12.')
field(i, 'prompt', 'What do you like to do on a rainy day? Where are you, and who is with you? Write 4-5 simple sentences in Spanish with estoy / está and hay (for example: Cuando llueve, estoy en casa. Hay chocolate caliente. Mi hermano está conmigo.).', 'Added target-grammar instruction and a model.')
conc(i, 'grammar', 'estar + location and state (está en un café, está mojada, están contentos); hay; reflexive se sienta, se llama; present of vivir and leer; pero and también.', '"porque" does not occur in this story; added the taught present-tense topic.')

# ---------- a1-08
i = 'a1-08'
line(i, 1, 'Su <b>vecina</b>, la señora Elena, tiene un <b>jardín</b>.', why='Bold "vecina" (vocab item).')
line(i, 9, '—Quiero flores para mi mamá, pero no tengo mucho <b>dinero</b>.', '"I want flowers for my mom, but I don\'t have much money."', 'Nico has twenty pesos (line 6), so "no tengo dinero" contradicted the text.')
line(i, 10, '—Mis flores son más <b>bonitas</b> que las del mercado —dice ella.', why='Bold "bonitas" (added to vocab).')
line(i, 14, 'La señora Elena <b>corta</b> diez <b>rosas</b> para él.', why='Bold "corta" (added to vocab).')
line(i, 15, '—Y tienes que venir otra vez mañana —dice ella.', '"And you have to come again tomorrow," she says.', '"De nada" answered a "gracias" nobody said; "sonríe ella" as a speech tag is not a model to give A1 learners.')
line(i, 17, 'La mamá de Nico recibe las flores y llora de <b>alegría</b>.', why='Bold "alegría" (added to vocab).')
vadd(i, ['bonito', 'pretty'], 'Unglossed; needed for the más ... que comparison in line 10.')
vadd(i, ['cortar', 'to cut'], 'Unglossed in line 14.')
vadd(i, ['conmigo', 'with me'], 'Unglossed, irregular form in line 11.')
vadd(i, ['la alegría', 'joy'], 'Unglossed in line 17.')
quiz(i, 4, {'q': '¿Qué le gusta a la señora Elena?', 'options': ['Tener mucho dinero', 'Vender rosas', 'Tener un amigo en el jardín', 'Ir al mercado'], 'answer': 2}, 'Old question used the subjunctive ("quiere que Nico venga"), well above A1.')
field(i, 'prompt', 'Do you have a garden, or do you know a place with many plants? Describe it in Spanish in 3-4 sentences and say what you have to do to take care of it (for example: En mi casa hay un jardín. Es más grande que mi cocina. Tengo que regar las plantas los sábados.).', 'Added a model with tener que and más ... que.')

# ---------- a1-09
i = 'a1-09'
line(i, 1, 'Marta mira la <b>pantalla</b> y sonríe.', why='Bold "pantalla" (added to vocab).')
line(i, 10, '—Voy a <b>cocinar</b> una <b>tortilla</b> y ver una <b>película</b>.', why='Bold "película" (added to vocab).')
line(i, 11, '—Suena <b>aburrido</b> —dice Javier con una sonrisa.', '"That sounds boring," says Javier with a smile.', '"con una risa" is a calque of "with a laugh"; "con una sonrisa" is natural and hints at his secret.')
line(i, 17, '—Sí, pero ahora estoy en Sevilla, <b>delante de</b> tu <b>edificio</b>.', why='Bold "delante de" (key to the twist, added to vocab).')
line(i, 21, 'Ella se ríe y baja a abrir la puerta.', why='"ríe" alone is literary; everyday Spanish is "se ríe" (as in a1-10 line 14).')
vadd(i, ['la pantalla', 'screen'], 'Unglossed in line 1.')
vadd(i, ['la película', 'movie'], 'Unglossed in line 10.')
vadd(i, ['aburrido', 'boring'], 'Unglossed in line 11.')
vadd(i, ['delante de', 'in front of'], 'Unglossed; the twist depends on it.')
field(i, 'prompt', 'Imagine you call a friend. Write a short dialogue in Spanish: ask what your friend is going to do on Saturday and answer with ir a + infinitive (for example: —¿Qué vas a hacer el sábado? —Voy a ver una película. ¿Y tú?).', 'Added a model dialogue.')

# ---------- a1-10
i = 'a1-10'
line(i, 12, 'Raúl busca los <b>billetes</b>, pero no los <b>encuentra</b>.', why='Bold "encuentra" (stem-changing, added to vocab).')
line(i, 16, 'El sábado, los tres llegan a la <b>estación</b> <b>temprano</b>.', why='Bold "temprano" (added to vocab).')
line(i, 19, '—Es más grande que en mis <b>recuerdos</b> —dice.', '"It\'s bigger than I remember," he says.', '"bigger than in my memories" is unnatural English; bold "recuerdos" (abstract noun, added to vocab).')
vadd(i, ['encontrar', 'to find (encuentra)'], 'Unglossed stem-changing verb.')
vadd(i, ['temprano', 'early'], 'Unglossed.')
vadd(i, ['el recuerdo', 'memory'], 'Unglossed abstract noun in the climax line.')
field(i, 'prompt', 'Where are you going to go on your next weekend trip, and who is going with you? Write 4-6 sentences in Spanish using voy a... and vamos a... (for example: El sábado voy a ir a la playa con mi hermana. Vamos a comer pescado.).', 'Added a model.')

out = [S['a1-%02d' % k] for k in range(1, 11)]
for s in out:
    assert len(s['lines']) == len(orig[s['id']]['lines'])
    assert 12 <= len(s['vocab']) <= 20, (s['id'], len(s['vocab']))
json.dump(out, open(B + 'stories/review/a1-stories-fixed.json', 'w'), ensure_ascii=False, indent=1)
json.dump(CH, open(B + 'stories/review/a1-story-changes.json', 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(len(CH)); print(Counter(c['id'] for c in CH)); print(Counter(c['field'] for c in CH))
