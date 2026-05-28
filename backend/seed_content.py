"""
Seed script for StrokeRehab AI content banks.
Run once: python seed_content.py
Run with --force to drop and reseed existing data.

Words sourced from standard SLP articulation therapy lists for adult
dysarthria and apraxia of speech rehabilitation after stroke.
Progression: CVC/CV (Level 1) → 2-syllable (Level 2) → 3+ syllable (Level 3)
"""

import sys
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/speakback")
DB_NAME = MONGO_URL.rsplit("/", 1)[-1].split("?")[0]
FORCE = "--force" in sys.argv

# ---------------------------------------------------------------------------
# WORD BANK — Block 4 (Articulation)
# 14 phonemes × 15 words (5 per level) = 210 words
#
# Clinical basis:
#   Level 1 — single-syllable CVC/CV words: everyday objects, actions, feelings
#   Level 2 — two-syllable words: common daily-life vocabulary
#   Level 3 — three+ syllable words: familiar functional words
#
# Categories: body parts, family, home, food/drink, actions, feelings, daily objects
# Source conventions: ASHA dysarthria practice hierarchy, Adult Speech Therapy
#   Workbook word lists, SLP apraxia/articulation drill materials
# ---------------------------------------------------------------------------

WORD_BANK = [

    # ── P (bilabial, voiceless) ──
    {"word": "pie",       "target_sound": "P", "target_phonemes": "P AY",          "level": 1},
    {"word": "pan",       "target_sound": "P", "target_phonemes": "P AE N",        "level": 1},
    {"word": "pet",       "target_sound": "P", "target_phonemes": "P EH T",        "level": 1},
    {"word": "pull",      "target_sound": "P", "target_phonemes": "P UH L",        "level": 1},
    {"word": "park",      "target_sound": "P", "target_phonemes": "P AA R K",      "level": 1},
    {"word": "paper",     "target_sound": "P", "target_phonemes": "P EY P ER",     "level": 2},
    {"word": "happy",     "target_sound": "P", "target_phonemes": "HH AE P IY",    "level": 2},
    {"word": "pepper",    "target_sound": "P", "target_phonemes": "P EH P ER",     "level": 2},
    {"word": "supper",    "target_sound": "P", "target_phonemes": "S AH P ER",     "level": 2},
    {"word": "sleeping",  "target_sound": "P", "target_phonemes": "S L IY P IH NG","level": 2},
    {"word": "pineapple", "target_sound": "P", "target_phonemes": "P AY N AE P AH L","level": 3},
    {"word": "important", "target_sound": "P", "target_phonemes": "IH M P AO R T AH N T","level": 3},
    {"word": "apartment", "target_sound": "P", "target_phonemes": "AH P AA R T M AH N T","level": 3},
    {"word": "peppermint","target_sound": "P", "target_phonemes": "P EH P ER M IH N T","level": 3},
    {"word": "telephone", "target_sound": "P", "target_phonemes": "T EH L AH F OW N","level": 3},

    # ── B (bilabial, voiced) ──
    {"word": "bed",       "target_sound": "B", "target_phonemes": "B EH D",        "level": 1},
    {"word": "bag",       "target_sound": "B", "target_phonemes": "B AE G",        "level": 1},
    {"word": "bus",       "target_sound": "B", "target_phonemes": "B AH S",        "level": 1},
    {"word": "bite",      "target_sound": "B", "target_phonemes": "B AY T",        "level": 1},
    {"word": "back",      "target_sound": "B", "target_phonemes": "B AE K",        "level": 1},
    {"word": "baby",      "target_sound": "B", "target_phonemes": "B EY B IY",     "level": 2},
    {"word": "better",    "target_sound": "B", "target_phonemes": "B EH T ER",     "level": 2},
    {"word": "number",    "target_sound": "B", "target_phonemes": "N AH M B ER",   "level": 2},
    {"word": "elbow",     "target_sound": "B", "target_phonemes": "EH L B OW",     "level": 2},
    {"word": "before",    "target_sound": "B", "target_phonemes": "B IH F AO R",   "level": 2},
    {"word": "birthday",  "target_sound": "B", "target_phonemes": "B ER TH D EY",  "level": 3},
    {"word": "beautiful", "target_sound": "B", "target_phonemes": "B Y UW T AH F AH L","level": 3},
    {"word": "umbrella",  "target_sound": "B", "target_phonemes": "AH M B R EH L AH","level": 3},
    {"word": "remember",  "target_sound": "B", "target_phonemes": "R IH M EH M B ER","level": 3},
    {"word": "blueberry", "target_sound": "B", "target_phonemes": "B L UW B EH R IY","level": 3},

    # ── T (alveolar, voiceless) ──
    {"word": "top",       "target_sound": "T", "target_phonemes": "T AA P",        "level": 1},
    {"word": "tie",       "target_sound": "T", "target_phonemes": "T AY",          "level": 1},
    {"word": "tall",      "target_sound": "T", "target_phonemes": "T AO L",        "level": 1},
    {"word": "tub",       "target_sound": "T", "target_phonemes": "T AH B",        "level": 1},
    {"word": "toe",       "target_sound": "T", "target_phonemes": "T OW",          "level": 1},
    {"word": "table",     "target_sound": "T", "target_phonemes": "T EY B AH L",   "level": 2},
    {"word": "turtle",    "target_sound": "T", "target_phonemes": "T ER T AH L",   "level": 2},
    {"word": "butter",    "target_sound": "T", "target_phonemes": "B AH T ER",     "level": 2},
    {"word": "kitten",    "target_sound": "T", "target_phonemes": "K IH T AH N",   "level": 2},
    {"word": "mittens",   "target_sound": "T", "target_phonemes": "M IH T AH N Z", "level": 2},
    {"word": "tomato",    "target_sound": "T", "target_phonemes": "T AH M EY T OW","level": 3},
    {"word": "tomorrow",  "target_sound": "T", "target_phonemes": "T AH M AO R OW","level": 3},
    {"word": "together",  "target_sound": "T", "target_phonemes": "T AH G EH DH ER","level": 3},
    {"word": "attention", "target_sound": "T", "target_phonemes": "AH T EH N SH AH N","level": 3},
    {"word": "waterfall", "target_sound": "T", "target_phonemes": "W AO T ER F AO L","level": 3},

    # ── D (alveolar, voiced) ──
    {"word": "dad",       "target_sound": "D", "target_phonemes": "D AE D",        "level": 1},
    {"word": "day",       "target_sound": "D", "target_phonemes": "D EY",          "level": 1},
    {"word": "door",      "target_sound": "D", "target_phonemes": "D AO R",        "level": 1},
    {"word": "dish",      "target_sound": "D", "target_phonemes": "D IH SH",       "level": 1},
    {"word": "deep",      "target_sound": "D", "target_phonemes": "D IY P",        "level": 1},
    {"word": "dinner",    "target_sound": "D", "target_phonemes": "D IH N ER",     "level": 2},
    {"word": "ready",     "target_sound": "D", "target_phonemes": "R EH D IY",     "level": 2},
    {"word": "body",      "target_sound": "D", "target_phonemes": "B AA D IY",     "level": 2},
    {"word": "muddy",     "target_sound": "D", "target_phonemes": "M AH D IY",     "level": 2},
    {"word": "nodding",   "target_sound": "D", "target_phonemes": "N AA D IH NG",  "level": 2},
    {"word": "bedroom",   "target_sound": "D", "target_phonemes": "B EH D R UW M", "level": 3},
    {"word": "holiday",   "target_sound": "D", "target_phonemes": "HH AA L AH D EY","level": 3},
    {"word": "wonderful", "target_sound": "D", "target_phonemes": "W AH N D ER F AH L","level": 3},
    {"word": "understand","target_sound": "D", "target_phonemes": "AH N D ER S T AE N D","level": 3},
    {"word": "everyday",  "target_sound": "D", "target_phonemes": "EH V R IY D EY","level": 3},

    # ── K (velar, voiceless) ──
    {"word": "cup",       "target_sound": "K", "target_phonemes": "K AH P",        "level": 1},
    {"word": "car",       "target_sound": "K", "target_phonemes": "K AA R",        "level": 1},
    {"word": "key",       "target_sound": "K", "target_phonemes": "K IY",          "level": 1},
    {"word": "cook",      "target_sound": "K", "target_phonemes": "K UH K",        "level": 1},
    {"word": "cake",      "target_sound": "K", "target_phonemes": "K EY K",        "level": 1},
    {"word": "cookie",    "target_sound": "K", "target_phonemes": "K UH K IY",     "level": 2},
    {"word": "chicken",   "target_sound": "K", "target_phonemes": "CH IH K AH N",  "level": 2},
    {"word": "blanket",   "target_sound": "K", "target_phonemes": "B L AE NG K AH T","level": 2},
    {"word": "jacket",    "target_sound": "K", "target_phonemes": "JH AE K AH T",  "level": 2},
    {"word": "walking",   "target_sound": "K", "target_phonemes": "W AO K IH NG",  "level": 2},
    {"word": "chocolate", "target_sound": "K", "target_phonemes": "CH AO K L AH T","level": 3},
    {"word": "calendar",  "target_sound": "K", "target_phonemes": "K AE L AH N D ER","level": 3},
    {"word": "cooking",   "target_sound": "K", "target_phonemes": "K UH K IH NG",  "level": 3},
    {"word": "backyard",  "target_sound": "K", "target_phonemes": "B AE K Y AA R D","level": 3},
    {"word": "October",   "target_sound": "K", "target_phonemes": "AH K T OW B ER","level": 3},

    # ── G (velar, voiced) ──
    {"word": "go",        "target_sound": "G", "target_phonemes": "G OW",          "level": 1},
    {"word": "get",       "target_sound": "G", "target_phonemes": "G EH T",        "level": 1},
    {"word": "good",      "target_sound": "G", "target_phonemes": "G UH D",        "level": 1},
    {"word": "give",      "target_sound": "G", "target_phonemes": "G IH V",        "level": 1},
    {"word": "grass",     "target_sound": "G", "target_phonemes": "G R AE S",      "level": 1},
    {"word": "garden",    "target_sound": "G", "target_phonemes": "G AA R D AH N", "level": 2},
    {"word": "bigger",    "target_sound": "G", "target_phonemes": "B IH G ER",     "level": 2},
    {"word": "going",     "target_sound": "G", "target_phonemes": "G OW IH NG",    "level": 2},
    {"word": "tiger",     "target_sound": "G", "target_phonemes": "T AY G ER",     "level": 2},
    {"word": "finger",    "target_sound": "G", "target_phonemes": "F IH NG G ER",  "level": 2},
    {"word": "magazine",  "target_sound": "G", "target_phonemes": "M AE G AH Z IY N","level": 3},
    {"word": "beginning", "target_sound": "G", "target_phonemes": "B IH G IH N IH NG","level": 3},
    {"word": "together",  "target_sound": "G", "target_phonemes": "T AH G EH DH ER","level": 3},
    {"word": "afternoon", "target_sound": "G", "target_phonemes": "AE F T ER N UW N","level": 3},
    {"word": "spaghetti", "target_sound": "G", "target_phonemes": "S P AH G EH T IY","level": 3},

    # ── M (bilabial, nasal) ──
    {"word": "mom",       "target_sound": "M", "target_phonemes": "M AA M",        "level": 1},
    {"word": "milk",      "target_sound": "M", "target_phonemes": "M IH L K",      "level": 1},
    {"word": "mouth",     "target_sound": "M", "target_phonemes": "M AW TH",       "level": 1},
    {"word": "more",      "target_sound": "M", "target_phonemes": "M AO R",        "level": 1},
    {"word": "meal",      "target_sound": "M", "target_phonemes": "M IY L",        "level": 1},
    {"word": "morning",   "target_sound": "M", "target_phonemes": "M AO R N IH NG","level": 2},
    {"word": "hammer",    "target_sound": "M", "target_phonemes": "HH AE M ER",    "level": 2},
    {"word": "summer",    "target_sound": "M", "target_phonemes": "S AH M ER",     "level": 2},
    {"word": "family",    "target_sound": "M", "target_phonemes": "F AE M AH L IY","level": 2},
    {"word": "mountain",  "target_sound": "M", "target_phonemes": "M AW N T AH N", "level": 2},
    {"word": "lemonade",  "target_sound": "M", "target_phonemes": "L EH M AH N EY D","level": 3},
    {"word": "remember",  "target_sound": "M", "target_phonemes": "R IH M EH M B ER","level": 3},
    {"word": "strawberry","target_sound": "M", "target_phonemes": "S T R AO B EH R IY","level": 3},
    {"word": "watermelon","target_sound": "M", "target_phonemes": "W AO T ER M EH L AH N","level": 3},
    {"word": "swimming",  "target_sound": "M", "target_phonemes": "S W IH M IH NG","level": 3},

    # ── N (alveolar, nasal) ──
    {"word": "nose",      "target_sound": "N", "target_phonemes": "N OW Z",        "level": 1},
    {"word": "night",     "target_sound": "N", "target_phonemes": "N AY T",        "level": 1},
    {"word": "neck",      "target_sound": "N", "target_phonemes": "N EH K",        "level": 1},
    {"word": "nap",       "target_sound": "N", "target_phonemes": "N AE P",        "level": 1},
    {"word": "nail",      "target_sound": "N", "target_phonemes": "N EY L",        "level": 1},
    {"word": "window",    "target_sound": "N", "target_phonemes": "W IH N D OW",   "level": 2},
    {"word": "dinner",    "target_sound": "N", "target_phonemes": "D IH N ER",     "level": 2},
    {"word": "morning",   "target_sound": "N", "target_phonemes": "M AO R N IH NG","level": 2},
    {"word": "funny",     "target_sound": "N", "target_phonemes": "F AH N IY",     "level": 2},
    {"word": "honey",     "target_sound": "N", "target_phonemes": "HH AH N IY",    "level": 2},
    {"word": "banana",    "target_sound": "N", "target_phonemes": "B AH N AE N AH","level": 3},
    {"word": "afternoon", "target_sound": "N", "target_phonemes": "AE F T ER N UW N","level": 3},
    {"word": "sunflower", "target_sound": "N", "target_phonemes": "S AH N F L AW ER","level": 3},
    {"word": "yesterday", "target_sound": "N", "target_phonemes": "Y EH S T ER D EY","level": 3},
    {"word": "pennant",   "target_sound": "N", "target_phonemes": "P EH N AH N T", "level": 3},

    # ── S (alveolar, fricative) ──
    {"word": "sun",       "target_sound": "S", "target_phonemes": "S AH N",        "level": 1},
    {"word": "sit",       "target_sound": "S", "target_phonemes": "S IH T",        "level": 1},
    {"word": "soup",      "target_sound": "S", "target_phonemes": "S UW P",        "level": 1},
    {"word": "safe",      "target_sound": "S", "target_phonemes": "S EY F",        "level": 1},
    {"word": "sock",      "target_sound": "S", "target_phonemes": "S AA K",        "level": 1},
    {"word": "sister",    "target_sound": "S", "target_phonemes": "S IH S T ER",   "level": 2},
    {"word": "lesson",    "target_sound": "S", "target_phonemes": "L EH S AH N",   "level": 2},
    {"word": "missing",   "target_sound": "S", "target_phonemes": "M IH S IH NG",  "level": 2},
    {"word": "sentence",  "target_sound": "S", "target_phonemes": "S EH N T AH N S","level": 2},
    {"word": "passing",   "target_sound": "S", "target_phonemes": "P AE S IH NG",  "level": 2},
    {"word": "spaghetti", "target_sound": "S", "target_phonemes": "S P AH G EH T IY","level": 3},
    {"word": "Saturday",  "target_sound": "S", "target_phonemes": "S AE T ER D EY","level": 3},
    {"word": "strawberry","target_sound": "S", "target_phonemes": "S T R AO B EH R IY","level": 3},
    {"word": "sunflower", "target_sound": "S", "target_phonemes": "S AH N F L AW ER","level": 3},
    {"word": "yesterday", "target_sound": "S", "target_phonemes": "Y EH S T ER D EY","level": 3},

    # ── F (labiodental, fricative) ──
    {"word": "fan",       "target_sound": "F", "target_phonemes": "F AE N",        "level": 1},
    {"word": "foot",      "target_sound": "F", "target_phonemes": "F UH T",        "level": 1},
    {"word": "food",      "target_sound": "F", "target_phonemes": "F UW D",        "level": 1},
    {"word": "face",      "target_sound": "F", "target_phonemes": "F EY S",        "level": 1},
    {"word": "fall",      "target_sound": "F", "target_phonemes": "F AO L",        "level": 1},
    {"word": "coffee",    "target_sound": "F", "target_phonemes": "K AO F IY",     "level": 2},
    {"word": "after",     "target_sound": "F", "target_phonemes": "AE F T ER",     "level": 2},
    {"word": "before",    "target_sound": "F", "target_phonemes": "B IH F AO R",   "level": 2},
    {"word": "often",     "target_sound": "F", "target_phonemes": "AO F AH N",     "level": 2},
    {"word": "sofa",      "target_sound": "F", "target_phonemes": "S OW F AH",     "level": 2},
    {"word": "family",    "target_sound": "F", "target_phonemes": "F AE M AH L IY","level": 3},
    {"word": "sunflower", "target_sound": "F", "target_phonemes": "S AH N F L AW ER","level": 3},
    {"word": "breakfast", "target_sound": "F", "target_phonemes": "B R EH K F AH S T","level": 3},
    {"word": "afternoon", "target_sound": "F", "target_phonemes": "AE F T ER N UW N","level": 3},
    {"word": "butterfly", "target_sound": "F", "target_phonemes": "B AH T ER F L AY","level": 3},

    # ── L (alveolar, lateral) ──
    {"word": "lip",       "target_sound": "L", "target_phonemes": "L IH P",        "level": 1},
    {"word": "leg",       "target_sound": "L", "target_phonemes": "L EH G",        "level": 1},
    {"word": "love",      "target_sound": "L", "target_phonemes": "L AH V",        "level": 1},
    {"word": "lunch",     "target_sound": "L", "target_phonemes": "L AH N CH",     "level": 1},
    {"word": "light",     "target_sound": "L", "target_phonemes": "L AY T",        "level": 1},
    {"word": "yellow",    "target_sound": "L", "target_phonemes": "Y EH L OW",     "level": 2},
    {"word": "follow",    "target_sound": "L", "target_phonemes": "F AA L OW",     "level": 2},
    {"word": "belly",     "target_sound": "L", "target_phonemes": "B EH L IY",     "level": 2},
    {"word": "elbow",     "target_sound": "L", "target_phonemes": "EH L B OW",     "level": 2},
    {"word": "pillow",    "target_sound": "L", "target_phonemes": "P IH L OW",     "level": 2},
    {"word": "lemonade",  "target_sound": "L", "target_phonemes": "L EH M AH N EY D","level": 3},
    {"word": "umbrella",  "target_sound": "L", "target_phonemes": "AH M B R EH L AH","level": 3},
    {"word": "telephone", "target_sound": "L", "target_phonemes": "T EH L AH F OW N","level": 3},
    {"word": "blueberry", "target_sound": "L", "target_phonemes": "B L UW B EH R IY","level": 3},
    {"word": "butterfly", "target_sound": "L", "target_phonemes": "B AH T ER F L AY","level": 3},

    # ── R (retroflex) ──
    {"word": "run",       "target_sound": "R", "target_phonemes": "R AH N",        "level": 1},
    {"word": "red",       "target_sound": "R", "target_phonemes": "R EH D",        "level": 1},
    {"word": "rice",      "target_sound": "R", "target_phonemes": "R AY S",        "level": 1},
    {"word": "rest",      "target_sound": "R", "target_phonemes": "R EH S T",      "level": 1},
    {"word": "rain",      "target_sound": "R", "target_phonemes": "R EY N",        "level": 1},
    {"word": "river",     "target_sound": "R", "target_phonemes": "R IH V ER",     "level": 2},
    {"word": "ready",     "target_sound": "R", "target_phonemes": "R EH D IY",     "level": 2},
    {"word": "mirror",    "target_sound": "R", "target_phonemes": "M IH R ER",     "level": 2},
    {"word": "orange",    "target_sound": "R", "target_phonemes": "AO R AH N JH",  "level": 2},
    {"word": "morning",   "target_sound": "R", "target_phonemes": "M AO R N IH NG","level": 2},
    {"word": "strawberry","target_sound": "R", "target_phonemes": "S T R AO B EH R IY","level": 3},
    {"word": "restaurant","target_sound": "R", "target_phonemes": "R EH S T ER AH N T","level": 3},
    {"word": "remember",  "target_sound": "R", "target_phonemes": "R IH M EH M B ER","level": 3},
    {"word": "refrigerator","target_sound":"R","target_phonemes": "R IH F R IH JH ER EY T ER","level": 3},
    {"word": "waterfall", "target_sound": "R", "target_phonemes": "W AO T ER F AO L","level": 3},

    # ── SH (palato-alveolar, fricative) ──
    {"word": "shoe",      "target_sound": "SH", "target_phonemes": "SH UW",        "level": 1},
    {"word": "shop",      "target_sound": "SH", "target_phonemes": "SH AA P",      "level": 1},
    {"word": "ship",      "target_sound": "SH", "target_phonemes": "SH IH P",      "level": 1},
    {"word": "show",      "target_sound": "SH", "target_phonemes": "SH OW",        "level": 1},
    {"word": "shake",     "target_sound": "SH", "target_phonemes": "SH EY K",      "level": 1},
    {"word": "shoulder",  "target_sound": "SH", "target_phonemes": "SH OW L D ER", "level": 2},
    {"word": "shower",    "target_sound": "SH", "target_phonemes": "SH AW ER",     "level": 2},
    {"word": "washing",   "target_sound": "SH", "target_phonemes": "W AO SH IH NG","level": 2},
    {"word": "station",   "target_sound": "SH", "target_phonemes": "S T EY SH AH N","level": 2},
    {"word": "fishing",   "target_sound": "SH", "target_phonemes": "F IH SH IH NG","level": 2},
    {"word": "sunshine",  "target_sound": "SH", "target_phonemes": "S AH N SH AY N","level": 3},
    {"word": "seashell",  "target_sound": "SH", "target_phonemes": "S IY SH EH L", "level": 3},
    {"word": "dishwasher","target_sound": "SH", "target_phonemes": "D IH SH W AO SH ER","level": 3},
    {"word": "bookshelf", "target_sound": "SH", "target_phonemes": "B UH K SH EH L F","level": 3},
    {"word": "fingernail","target_sound": "SH", "target_phonemes": "F IH NG G ER N EY L","level": 3},

    # ── CH (palato-alveolar, affricate) ──
    {"word": "chin",      "target_sound": "CH", "target_phonemes": "CH IH N",      "level": 1},
    {"word": "chair",     "target_sound": "CH", "target_phonemes": "CH EH R",      "level": 1},
    {"word": "child",     "target_sound": "CH", "target_phonemes": "CH AY L D",    "level": 1},
    {"word": "chest",     "target_sound": "CH", "target_phonemes": "CH EH S T",    "level": 1},
    {"word": "chop",      "target_sound": "CH", "target_phonemes": "CH AA P",      "level": 1},
    {"word": "kitchen",   "target_sound": "CH", "target_phonemes": "K IH CH AH N", "level": 2},
    {"word": "chicken",   "target_sound": "CH", "target_phonemes": "CH IH K AH N", "level": 2},
    {"word": "teacher",   "target_sound": "CH", "target_phonemes": "T IY CH ER",   "level": 2},
    {"word": "catcher",   "target_sound": "CH", "target_phonemes": "K AE CH ER",   "level": 2},
    {"word": "reaching",  "target_sound": "CH", "target_phonemes": "R IY CH IH NG","level": 2},
    {"word": "chocolate", "target_sound": "CH", "target_phonemes": "CH AO K L AH T","level": 3},
    {"word": "lunchtime", "target_sound": "CH", "target_phonemes": "L AH N CH T AY M","level": 3},
    {"word": "armchair",  "target_sound": "CH", "target_phonemes": "AA R M CH EH R","level": 3},
    {"word": "cheerful",  "target_sound": "CH", "target_phonemes": "CH IH R F AH L","level": 3},
    {"word": "peaches",   "target_sound": "CH", "target_phonemes": "P IY CH AH Z", "level": 3},
]

# ---------------------------------------------------------------------------
# PHRASE BANK — Blocks 5 (speech_rate) & 6 (functional_phrases)
#
# Functional phrases are the most-used phrases in stroke rehabilitation.
# Based on ASHA functional communication guidelines, aphasia therapy, and
# common AAC (Augmentative and Alternative Communication) core vocabulary.
# Categories: emergency, basic needs, daily routine, social, feelings
# ---------------------------------------------------------------------------

PHRASE_BANK = [

    # ── Emergency / Safety ──
    {"text": "I need help",                         "category": "emergency",    "use_in": ["functional_phrases"], "level": 1},
    {"text": "Call the doctor",                     "category": "emergency",    "use_in": ["functional_phrases"], "level": 1},
    {"text": "I am in pain",                        "category": "emergency",    "use_in": ["functional_phrases"], "level": 1},
    {"text": "I need my medicine",                  "category": "emergency",    "use_in": ["functional_phrases"], "level": 1},
    {"text": "Call my family",                      "category": "emergency",    "use_in": ["functional_phrases"], "level": 1},
    {"text": "I fell down",                         "category": "emergency",    "use_in": ["functional_phrases"], "level": 1},
    {"text": "Please help me stand up",             "category": "emergency",    "use_in": ["functional_phrases"], "level": 2},
    {"text": "I cannot breathe well",               "category": "emergency",    "use_in": ["functional_phrases"], "level": 2},
    {"text": "I need to go to the hospital",        "category": "emergency",    "use_in": ["functional_phrases"], "level": 2},
    {"text": "Please call nine one one",            "category": "emergency",    "use_in": ["functional_phrases"], "level": 2},

    # ── Basic Needs ──
    {"text": "I need water",                        "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 1},
    {"text": "I am hungry",                         "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 1},
    {"text": "I need the bathroom",                 "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 1},
    {"text": "I am cold",                           "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 1},
    {"text": "I am tired",                          "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 1},
    {"text": "I need a blanket",                    "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 1},
    {"text": "Turn on the light please",            "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 2},
    {"text": "I want to go home",                   "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 2},
    {"text": "Please bring me my glasses",          "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 2},
    {"text": "I need to lie down and rest",         "category": "basic_needs",  "use_in": ["functional_phrases"], "level": 2},

    # ── Social and Daily Communication ──
    {"text": "Good morning",                        "category": "social",       "use_in": ["functional_phrases"], "level": 1},
    {"text": "Good night",                          "category": "social",       "use_in": ["functional_phrases"], "level": 1},
    {"text": "Thank you",                           "category": "social",       "use_in": ["functional_phrases"], "level": 1},
    {"text": "Yes please",                          "category": "social",       "use_in": ["functional_phrases"], "level": 1},
    {"text": "No thank you",                        "category": "social",       "use_in": ["functional_phrases"], "level": 1},
    {"text": "How are you today",                   "category": "social",       "use_in": ["functional_phrases"], "level": 2},
    {"text": "I feel much better today",            "category": "social",       "use_in": ["functional_phrases"], "level": 2},
    {"text": "Nice to see you",                     "category": "social",       "use_in": ["functional_phrases"], "level": 2},
    {"text": "Can you say that again please",       "category": "social",       "use_in": ["functional_phrases"], "level": 2},
    {"text": "I am doing my best",                  "category": "social",       "use_in": ["functional_phrases"], "level": 2},

    # ── Pacing phrases (speech_rate) — measured reading, 6–12 words ──
    {"text": "I would like a glass of water please",                "category": "pacing", "use_in": ["speech_rate"], "level": 1},
    {"text": "Good morning how are you feeling today",              "category": "pacing", "use_in": ["speech_rate"], "level": 1},
    {"text": "Please call my family right away",                    "category": "pacing", "use_in": ["speech_rate"], "level": 1},
    {"text": "The sun is bright and warm this morning",             "category": "pacing", "use_in": ["speech_rate"], "level": 1},
    {"text": "I need to take my medicine before dinner",            "category": "pacing", "use_in": ["speech_rate"], "level": 1},
    {"text": "I would like to go outside for a short walk",         "category": "pacing", "use_in": ["speech_rate"], "level": 2},
    {"text": "Can you please pass me the glass of water",           "category": "pacing", "use_in": ["speech_rate"], "level": 2},
    {"text": "The nurse checks on me every few hours",              "category": "pacing", "use_in": ["speech_rate"], "level": 2},
    {"text": "I feel a little stronger than I did yesterday",       "category": "pacing", "use_in": ["speech_rate"], "level": 2},
    {"text": "My family comes to visit me every day",               "category": "pacing", "use_in": ["speech_rate"], "level": 2},
    {"text": "I practice my speech exercises every single morning", "category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "The weather outside looks sunny and beautiful today", "category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "I enjoy listening to music in the evening before bed","category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "My therapist says I am making very good progress",    "category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "I had a warm bowl of soup and some bread for lunch",  "category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "I like to look out the window and watch the birds",   "category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "Every day I work hard to speak more clearly",         "category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "My daughter brings me flowers every Sunday morning",  "category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "I take a short walk around the room after breakfast", "category": "pacing", "use_in": ["speech_rate"], "level": 3},
    {"text": "The physical therapist helped me stand up yesterday", "category": "pacing", "use_in": ["speech_rate"], "level": 3},
]

# ---------------------------------------------------------------------------
# SENTENCE BANK — Block 7 (Read Aloud)
#
# Sentences are graded by length and complexity. Based on standard
# oral reading passages used in adult speech-language pathology.
# All sentences are natural, everyday language — no jargon.
# ---------------------------------------------------------------------------

SENTENCE_BANK = [

    # ── Level 1 — short and simple (3–6 words) ──
    {"text": "I feel good today",                   "level": 1},
    {"text": "I need some water",                   "level": 1},
    {"text": "The sun is bright",                   "level": 1},
    {"text": "Come sit with me",                    "level": 1},
    {"text": "I love my family",                    "level": 1},
    {"text": "Please help me up",                   "level": 1},
    {"text": "I am getting better",                 "level": 1},
    {"text": "Take a deep breath",                  "level": 1},
    {"text": "I hear the birds",                    "level": 1},
    {"text": "Open the window please",              "level": 1},

    # ── Level 2 — medium (7–12 words) ──
    {"text": "I would like a warm cup of tea",              "level": 2},
    {"text": "The morning sky is clear and blue today",     "level": 2},
    {"text": "My family visits me every day after lunch",   "level": 2},
    {"text": "Please pass me the glass of water on the table","level": 2},
    {"text": "I take my medicine every morning with breakfast","level": 2},
    {"text": "The nurse comes in to check on me at night",  "level": 2},
    {"text": "I feel stronger when I rest and eat well",    "level": 2},
    {"text": "The dog sat on the mat near the front door",  "level": 2},
    {"text": "I like to read the newspaper in the morning", "level": 2},
    {"text": "My daughter made me a warm bowl of soup",     "level": 2},
    {"text": "I walked slowly down the hallway with help",  "level": 2},
    {"text": "The rain taps softly on the window at night", "level": 2},
    {"text": "I smiled when my grandchildren came to visit","level": 2},
    {"text": "He sat in the big chair by the window all day","level": 2},
    {"text": "I brushed my teeth and washed my face this morning","level": 2},

    # ── Level 3 — longer natural sentences (13+ words) ──
    {"text": "Every morning I do my breathing and speech exercises before I eat breakfast",        "level": 3},
    {"text": "The sun was shining and the birds were singing when I woke up this morning",         "level": 3},
    {"text": "My wife brings me a hot cup of coffee and the newspaper every single morning",       "level": 3},
    {"text": "I slowly walked to the window and looked outside at the green trees and blue sky",   "level": 3},
    {"text": "The children ran through the garden laughing and playing on the warm sunny afternoon","level": 3},
    {"text": "I try to speak slowly and clearly so that everyone around me can understand me well","level": 3},
    {"text": "After dinner I like to sit in my chair and listen to soft music on the radio",       "level": 3},
    {"text": "My son drove me to the park and we sat together on the bench by the fountain",       "level": 3},
    {"text": "I am working very hard every day and I can feel myself getting stronger and better", "level": 3},
    {"text": "The therapist told me that practice every day is the best way to improve my speech", "level": 3},
    {"text": "I enjoy the warm smell of bread baking in the kitchen on cold winter mornings",       "level": 3},
    {"text": "My family took me home for the weekend and we had a big dinner together on Sunday",   "level": 3},
    {"text": "I held the cup carefully with both hands and took a slow sip of warm tea",           "level": 3},
    {"text": "The doctor said I am making great progress and may be able to go home very soon",    "level": 3},
    {"text": "I looked at the old photographs and remembered all the happy times with my family",  "level": 3},
]


def seed():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]

    collections = {
        "word_bank":     WORD_BANK,
        "phrase_bank":   PHRASE_BANK,
        "sentence_bank": SENTENCE_BANK,
    }

    for name, data in collections.items():
        existing = db[name].count_documents({})
        if existing > 0 and not FORCE:
            print(f"{name}: already seeded ({existing} docs) — run with --force to reseed")
            continue
        if existing > 0 and FORCE:
            db[name].drop()
            print(f"{name}: dropped existing {existing} docs")
        db[name].insert_many(data)
        print(f"{name}: inserted {len(data)} documents")

    db.word_bank.create_index([("target_sound", 1), ("level", 1)])
    db.phrase_bank.create_index([("use_in", 1), ("level", 1)])
    db.sentence_bank.create_index("level")
    db.session_selections.create_index([("patient_id", 1), ("timestamp", -1)])
    print("Indexes ensured.")

    client.close()
    print("Done.")


if __name__ == "__main__":
    seed()
