import random
from datetime import datetime, timedelta, timezone


async def select_content_for_session(db, patient_id: str, profile: dict) -> dict:
    focus_sounds = profile.get("focus_sounds", ["P", "B"])
    level = profile.get("level", 1)
    words_per_session = profile.get("words_per_session", 5)
    phrases_per_session = profile.get("phrases_per_session", 3)

    now = datetime.now(timezone.utc)
    cutoff_7d = now - timedelta(days=7)
    cutoff_3d = now - timedelta(days=3)
    cutoff_2d = now - timedelta(days=2)

    # ── helpers ────────────────────────────────────────────────────────────────

    def _parse_ts(ts_str):
        try:
            dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return None

    async def _get_block_sessions(block_type: str):
        cursor = db.sessions.find({"patient_id": patient_id, "block_type": block_type})
        return await cursor.to_list(length=2000)

    def _select_items(pool, struggling_pool, target_count):
        n_struggling = max(1, round(target_count * 0.3))
        n_fresh = target_count - n_struggling

        chosen_struggling = random.sample(struggling_pool, min(n_struggling, len(struggling_pool)))
        chosen_fresh = [i for i in pool if i not in chosen_struggling]
        chosen_fresh = random.sample(chosen_fresh, min(n_fresh, len(chosen_fresh)))

        selected = chosen_fresh + chosen_struggling
        if len(selected) < target_count:
            fill = [i for i in pool if i not in selected]
            selected += random.sample(fill, min(target_count - len(selected), len(fill)))

        return selected[:target_count]

    # ── Block 4: Articulation words ────────────────────────────────────────────

    word_pool = await db.word_bank.find(
        {"target_sound": {"$in": focus_sounds}, "level": level}
    ).to_list(length=500)

    art_sessions = await _get_block_sessions("articulation")

    recent_3d_words = {
        s["expected_text"] for s in art_sessions
        if s.get("expected_text") and _parse_ts(s["timestamp"]) and _parse_ts(s["timestamp"]) >= cutoff_3d
    }

    mastered_words = _find_mastered({s["expected_text"]: s["metric_value"] for s in art_sessions}, art_sessions, threshold=80, min_sessions=3)

    fresh_words = [w for w in word_pool if w["word"] not in recent_3d_words and w["word"] not in mastered_words]

    struggling_word_texts = {
        s["expected_text"] for s in art_sessions
        if s.get("expected_text")
        and s.get("metric_value", 0) < 50
        and _parse_ts(s["timestamp"])
        and cutoff_3d <= _parse_ts(s["timestamp"]) <= cutoff_2d
    }
    struggling_words = [w for w in word_pool if w["word"] in struggling_word_texts and w["word"] not in mastered_words]

    selected_words = _select_items(fresh_words or word_pool, struggling_words, words_per_session)

    # mastery promotion check
    all_level_words = [w["word"] for w in word_pool]
    mastered_count = len([w for w in all_level_words if w in mastered_words])
    if all_level_words and mastered_count / len(all_level_words) >= 0.7:
        await db.patient_profiles.update_one(
            {"patient_id": patient_id},
            {"$set": {"promotion_flag": True}}
        )

    # ── Block 5: Speech Rate phrases ───────────────────────────────────────────

    rate_pool = await db.phrase_bank.find(
        {"use_in": "speech_rate", "level": {"$lte": level}}
    ).to_list(length=200)

    rate_sessions = await _get_block_sessions("speech_rate")
    recent_3d_rate = {
        s["expected_text"] for s in rate_sessions
        if s.get("expected_text") and _parse_ts(s["timestamp"]) and _parse_ts(s["timestamp"]) >= cutoff_3d
    }
    mastered_rate = _find_mastered({}, rate_sessions, threshold=80, min_sessions=3)

    fresh_rate = [p for p in rate_pool if p["text"] not in recent_3d_rate and p["text"] not in mastered_rate]
    struggling_rate_texts = {
        s["expected_text"] for s in rate_sessions
        if s.get("expected_text") and s.get("metric_value", 0) < 50
        and _parse_ts(s["timestamp"]) and cutoff_3d <= _parse_ts(s["timestamp"]) <= cutoff_2d
    }
    struggling_rate = [p for p in rate_pool if p["text"] in struggling_rate_texts and p["text"] not in mastered_rate]

    selected_rate = _select_items(fresh_rate or rate_pool, struggling_rate, 2)

    # ── Block 6: Functional Phrases ───────────────────────────────────────────

    phrase_pool = await db.phrase_bank.find(
        {"use_in": "functional_phrases", "level": {"$lte": level}}
    ).to_list(length=200)

    phrase_sessions = await _get_block_sessions("functional_phrases")
    recent_3d_phrases = {
        s["expected_text"] for s in phrase_sessions
        if s.get("expected_text") and _parse_ts(s["timestamp"]) and _parse_ts(s["timestamp"]) >= cutoff_3d
    }
    mastered_phrases = _find_mastered({}, phrase_sessions, threshold=80, min_sessions=3)

    fresh_phrases = [p for p in phrase_pool if p["text"] not in recent_3d_phrases and p["text"] not in mastered_phrases]
    struggling_phrase_texts = {
        s["expected_text"] for s in phrase_sessions
        if s.get("expected_text") and s.get("metric_value", 0) < 50
        and _parse_ts(s["timestamp"]) and cutoff_3d <= _parse_ts(s["timestamp"]) <= cutoff_2d
    }
    struggling_phrases = [p for p in phrase_pool if p["text"] in struggling_phrase_texts and p["text"] not in mastered_phrases]

    selected_phrases = _select_items(fresh_phrases or phrase_pool, struggling_phrases, phrases_per_session)

    # ── Block 7: Read Aloud sentences ─────────────────────────────────────────

    sentence_pool = await db.sentence_bank.find(
        {"level": {"$lte": level}}
    ).to_list(length=200)

    sent_sessions = await _get_block_sessions("read_aloud")
    recent_3d_sents = {
        s["expected_text"] for s in sent_sessions
        if s.get("expected_text") and _parse_ts(s["timestamp"]) and _parse_ts(s["timestamp"]) >= cutoff_3d
    }
    mastered_sents = _find_mastered({}, sent_sessions, threshold=80, min_sessions=3)

    fresh_sents = [s for s in sentence_pool if s["text"] not in recent_3d_sents and s["text"] not in mastered_sents]
    struggling_sent_texts = {
        s["expected_text"] for s in sent_sessions
        if s.get("expected_text") and s.get("metric_value", 0) < 50
        and _parse_ts(s["timestamp"]) and cutoff_3d <= _parse_ts(s["timestamp"]) <= cutoff_2d
    }
    struggling_sents = [s for s in sentence_pool if s["text"] in struggling_sent_texts and s["text"] not in mastered_sents]

    selected_sents = _select_items(fresh_sents or sentence_pool, struggling_sents, 2)

    # ── Rule 5: 7-day uniqueness swap ─────────────────────────────────────────

    last_selection = await db.session_selections.find_one(
        {"patient_id": patient_id, "timestamp": {"$gte": cutoff_7d.isoformat()}},
        sort=[("timestamp", -1)]
    )

    if last_selection:
        selected_words = _uniqueness_swap(selected_words, last_selection.get("word_set", []), fresh_words or word_pool, key="word")
        selected_phrases = _uniqueness_swap(selected_phrases, last_selection.get("phrase_set", []), fresh_phrases or phrase_pool, key="text")
        selected_sents = _uniqueness_swap(selected_sents, last_selection.get("sentence_set", []), fresh_sents or sentence_pool, key="text")

    return {
        "words": selected_words,
        "rate_phrases": selected_rate,
        "phrases": selected_phrases,
        "sentences": selected_sents,
    }


def _find_mastered(score_map: dict, sessions: list, threshold: int, min_sessions: int) -> set:
    from collections import defaultdict
    counts = defaultdict(list)
    for s in sessions:
        txt = s.get("expected_text")
        val = s.get("metric_value", 0)
        if txt:
            counts[txt].append(val)
    return {txt for txt, vals in counts.items() if len([v for v in vals if v >= threshold]) >= min_sessions}


def _uniqueness_swap(selected: list, previous_set: list, pool: list, key: str) -> list:
    selected_keys = {item[key] for item in selected}
    prev_keys = set(previous_set)
    if selected_keys == prev_keys:
        alternates = [item for item in pool if item[key] not in selected_keys]
        if alternates:
            swap_out = random.choice(selected)
            swap_in = random.choice(alternates)
            selected = [item for item in selected if item[key] != swap_out[key]] + [swap_in]
    return selected
