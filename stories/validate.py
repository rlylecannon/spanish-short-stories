#!/usr/bin/env python3
"""Validate and measure a story file.
usage: validate.py FILE.json LEVEL START_INDEX     e.g.  validate.py a1-part1.json A1 1
Exit code 1 if hard errors. Prints a metrics table you should review."""
import json, re, sys, statistics

TARGETS = {  # per story index 1..10 (words in Spanish text)
 "A1": [70, 80, 90, 100, 110, 120, 130, 140, 150, 160],
 "A2": [230, 245, 260, 275, 290, 305, 320, 335, 350, 365],
 "B1": [450, 480, 510, 540, 570, 600, 630, 660, 690, 720],
 "B2": [750, 780, 810, 840, 870, 900, 930, 960, 990, 1020],
}
TOL = 0.15
PRET = re.compile(r"\b\w{3,}(aron|ieron|ió|ó)\b", re.I)
IMPF = re.compile(r"\b\w{2,}(aba|abas|ábamos|aban)\b", re.I)
PRET_OK = {"adiós", "avión", "camión", "habitación", "nación", "canción", "estación", "dirección", "información", "lección", "región", "razón", "melón", "balcón", "salón", "corazón", "botón", "limón", "montón", "jamón", "cajón", "perdón", "pasión", "decisión", "misión", "visión", "emoción", "profesión", "reunión", "sección", "acción", "atención", "invitación", "conversación", "celebración", "situación", "tradición", "condición", "posición", "estación", "televisión", "opinión", "población", "relación", "educación", "organización", "operación", "producción", "reacción", "exposición", "expresión", "impresión", "inversión", "dimisión", "discusión", "ocasión", "adicción", "presión", "protección", "reflexión", "solución", "ilusión", "tensión", "fundación", "colección", "obligación", "preparación", "elección", "función", "investigación", "inspiración", "constitución", "cooperación", "demostración", "sensación", "comunicación", "imaginación", "generación", "construcción", "manifestación", "evolución"}
SUBJ = re.compile(r"\b(\w+(ase|ases|asen|iese|ieses|iesen)|\w*(ara|aras|áramos|aran|iera|ieras|iéramos|ieran))\b", re.I)

def strip(s): return re.sub(r"<[^>]+>", "", s)
def words(s): return re.findall(r"[\wáéíóúüñÁÉÍÓÚÜÑ]+", strip(s))

def main():
    f, level, start = sys.argv[1], sys.argv[2].upper(), int(sys.argv[3])
    data = json.load(open(f, encoding="utf-8"))
    errs, warns = [], []
    if not isinstance(data, list): sys.exit("top level must be a JSON list of stories")
    print(f"{'id':8} {'words':>5} {'target':>6} {'avgSent':>7} {'maxSent':>7} {'lines':>5} {'vocab':>5} {'pret?':>5} {'impf?':>5} {'subj?':>5}")
    for k, s in enumerate(data):
        idx = start + k
        sid = s.get("id", "?")
        for key in ("id","level","title","titleEn","teaser","emoji","lines","vocab","quiz","prompt","concepts"):
            if key not in s: errs.append(f"{sid}: missing '{key}'")
        if errs and any(e.startswith(sid) for e in errs): continue
        if s["level"] != level: errs.append(f"{sid}: level should be {level}")
        if not re.fullmatch(rf"{level.lower()}-\d\d", s["id"]) or int(s["id"][-2:]) != idx:
            errs.append(f"{sid}: id should be {level.lower()}-{idx:02d}")
        lines = s["lines"]
        if not all(isinstance(l, list) and len(l) == 2 and all(isinstance(x, str) and x.strip() for x in l) for l in lines):
            errs.append(f"{sid}: every line must be [spanish, english] non-empty strings"); continue
        text = " ".join(l[0] for l in lines)
        n = len(words(text)); tgt = TARGETS[level][idx - 1]
        if abs(n - tgt) > tgt * TOL: errs.append(f"{sid}: {n} words, target {tgt} ±{int(TOL*100)}%")
        sents = [x for x in re.split(r"(?<=[.!?…])\s+", strip(text)) if words(x)]
        lens = [len(words(x)) for x in sents]
        avg, mx = statistics.mean(lens), max(lens)
        pret = [w for w in PRET.findall(strip(text))]
        pret_words = [m.group(0) for m in PRET.finditer(strip(text)) if m.group(0).lower() not in PRET_OK]
        impf_words = [m.group(0) for m in IMPF.finditer(strip(text))]
        subj_words = [m.group(0) for m in SUBJ.finditer(strip(text))]
        if level == "A1":
            if pret_words: warns.append(f"{sid}: A1 should be present tense; possible preterite: {pret_words[:5]}")
            if impf_words: warns.append(f"{sid}: A1 possible imperfect: {impf_words[:5]}")
            if mx > 14: errs.append(f"{sid}: A1 sentence of {mx} words (max 14)")
            if avg > 9: warns.append(f"{sid}: A1 avg sentence {avg:.1f} > 9")
        if level == "A2" and avg > 13: warns.append(f"{sid}: A2 avg sentence {avg:.1f} > 13")
        # vocab
        v = s["vocab"]
        if not (12 <= len(v) <= 20) or not all(isinstance(x, list) and len(x) == 2 for x in v):
            errs.append(f"{sid}: vocab must be 12-20 [spanish, english] pairs")
        else:
            low = strip(text).lower()
            toks = set(words(low))
            miss = []
            for es, en in v:
                core = [w for w in words(es.lower()) if w not in {"el","la","los","las","un","una","unos","unas","se","me","te","lo","le"}]
                if not core: continue
                ok = any(any(t.startswith(w[:max(3, len(w) - 3)]) for t in toks) for w in core)
                if not ok: miss.append(es)
            if len(miss) > 2: warns.append(f"{sid}: vocab not found in text: {miss}")
        nb = len(re.findall(r"<b>", text))
        if nb < 8: warns.append(f"{sid}: only {nb} <b> bolded vocab words in text")
        # quiz
        q = s["quiz"]
        if len(q) != 5: errs.append(f"{sid}: need exactly 5 quiz questions")
        else:
            for j, qq in enumerate(q):
                if not (isinstance(qq.get("q"), str) and isinstance(qq.get("options"), list) and len(qq["options"]) == 4
                        and isinstance(qq.get("answer"), int) and 0 <= qq["answer"] <= 3 and len(set(qq["options"])) == 4):
                    errs.append(f"{sid}: quiz[{j}] must have q, 4 distinct options, answer 0-3")
            ans = [qq.get("answer") for qq in q]
            if len(set(ans)) < 3: warns.append(f"{sid}: quiz answers not spread: {ans}")
        c = s["concepts"]
        if not all(k in c for k in ("grammar", "vocabulary", "skills")): errs.append(f"{sid}: concepts needs grammar, vocabulary, skills")
        print(f"{sid:8} {n:5d} {tgt:6d} {avg:7.1f} {mx:7d} {len(lines):5d} {len(v):5d} {len(pret_words):5d} {len(impf_words):5d} {len(subj_words):5d}")
    for w in warns: print("WARN:", w)
    for e in errs: print("ERROR:", e)
    print("RESULT:", "FAIL" if errs else "OK", f"({len(data)} stories)")
    sys.exit(1 if errs else 0)

main()
