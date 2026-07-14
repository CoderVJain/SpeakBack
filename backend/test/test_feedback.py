"""Quick checks for the Feedback Agent (plan.md feature 1)."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.feedback_agent import generate_feedback, _sound_hint, _template_feedback


def test_sound_hint_catches_wrong_sound():
    # said "pat" instead of "bat" -> B should come out as P
    hint = _sound_hint("bat", "pat")
    print("sound_hint(bat, pat):", hint)
    assert "B" in hint and "P" in hint


def test_template_tiers():
    print("high:", _template_feedback(90))
    print("mid :", _template_feedback(60))
    print("low :", _template_feedback(20))
    assert _template_feedback(90) != _template_feedback(20)


def test_generate_feedback_runs():
    text = generate_feedback(
        block_type="articulation",
        expected_text="bat",
        transcript="pat",
        metric_value=55.0,
    )
    print("\nFEEDBACK:\n", text)
    assert isinstance(text, str) and text.strip()


if __name__ == "__main__":
    test_sound_hint_catches_wrong_sound()
    test_template_tiers()
    test_generate_feedback_runs()
    print("\nAll checks passed.")
