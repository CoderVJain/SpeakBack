from enum import Enum


class ExerciseBlock(str, Enum):
    oral_motor = "oral_motor"
    coordination_ddk = "coordination_ddk"
    loudness = "loudness"
    articulation = "articulation"
    speech_rate = "speech_rate"
    functional_phrases = "functional_phrases"
    read_aloud = "read_aloud"


EXERCISE_LIBRARY = {
    ExerciseBlock.oral_motor: [
        {
            "name": "Lip Pucker Hold",
            "instruction": "Pucker your lips tightly and hold for 5 seconds. Repeat 5 times.",
            "target_text": None,
            "duration_seconds": 35,
            "metric_name": "Range of Motion %",
        },
        {
            "name": "Lip Spread Hold",
            "instruction": "Smile as wide as you can and hold for 5 seconds. Repeat 5 times.",
            "target_text": None,
            "duration_seconds": 35,
            "metric_name": "Symmetry %",
        },
        {
            "name": "Alternating Lip Movement",
            "instruction": "Alternate between pucker and wide smile. Repeat 10 times slowly.",
            "target_text": None,
            "duration_seconds": 30,
            "metric_name": "Range of Motion %",
        },
        {
            "name": "Tongue Protrusion Hold",
            "instruction": "Stick your tongue straight out and hold for 5 seconds. Repeat 5 times.",
            "target_text": None,
            "duration_seconds": 35,
            "metric_name": "Range of Motion %",
        },
        {
            "name": "Tongue Lateral Movement",
            "instruction": "Move your tongue from the left corner to the right corner of your mouth. Repeat 10 times.",
            "target_text": None,
            "duration_seconds": 30,
            "metric_name": "Symmetry %",
        },
        {
            "name": "Jaw Open Close",
            "instruction": "Open your jaw slowly as wide as you can, then close slowly. Repeat 10 times.",
            "target_text": None,
            "duration_seconds": 35,
            "metric_name": "Range of Motion %",
        },
        {
            "name": "Cheek Puff Hold",
            "instruction": "Puff both cheeks with air and hold for 5 seconds. Repeat 5 times.",
            "target_text": None,
            "duration_seconds": 35,
            "metric_name": "Symmetry %",
        },
        {
            "name": "Tongue to Roof",
            "instruction": "Press your tongue firmly to the roof of your mouth and hold for 3 seconds. Repeat 5 times.",
            "target_text": None,
            "duration_seconds": 25,
            "metric_name": "Range of Motion %",
        },
    ],

    ExerciseBlock.coordination_ddk: [
        {
            "name": "PA Repetition",
            "instruction": "Say 'pa' as fast and clearly as you can for 10 seconds.",
            "target_text": "pa",
            "duration_seconds": 10,
            "metric_name": "DDK Score (%)",
        },
        {
            "name": "TA Repetition",
            "instruction": "Say 'ta' as fast and clearly as you can for 10 seconds.",
            "target_text": "ta",
            "duration_seconds": 10,
            "metric_name": "DDK Score (%)",
        },
        {
            "name": "KA Repetition",
            "instruction": "Say 'ka' as fast and clearly as you can for 10 seconds.",
            "target_text": "ka",
            "duration_seconds": 10,
            "metric_name": "DDK Score (%)",
        },
        {
            "name": "PA-TA-KA Sequence",
            "instruction": "Say 'pa-ta-ka' as fast and clearly as you can for 10 seconds.",
            "target_text": "pataka",
            "duration_seconds": 10,
            "metric_name": "DDK Score (%)",
        },
    ],

    ExerciseBlock.loudness: [
        {
            "name": "Sustained Vowel",
            "instruction": "Take a breath and say 'ahhh' for 5 seconds at a strong, clear volume.",
            "target_text": "ahhh",
            "duration_seconds": 7,
            "metric_name": "Time in Target Volume Zone %",
        },
        {
            "name": "Count 1 to 5",
            "instruction": "Count from 1 to 5 aloud at a strong, clear volume.",
            "target_text": "one two three four five",
            "duration_seconds": 8,
            "metric_name": "Time in Target Volume Zone %",
        },
        {
            "name": "Functional Phrase Loud",
            "instruction": "Say 'I need help' at a strong, clear volume — loud enough for someone across the room.",
            "target_text": "I need help",
            "duration_seconds": 6,
            "metric_name": "Time in Target Volume Zone %",
        },
        {
            "name": "Loud Without Pitch Rise",
            "instruction": "Say 'good morning' loudly without raising your pitch. Keep your voice steady and strong.",
            "target_text": "good morning",
            "duration_seconds": 6,
            "metric_name": "Time in Target Volume Zone %",
        },
    ],

    ExerciseBlock.articulation: [
        {
            "name": "Functional Words",
            "instruction": "Say the word clearly and precisely.",
            "target_text": "water",
            "duration_seconds": 5,
            "metric_name": "Pronunciation Score",
        },
        {
            "name": "Functional Words",
            "instruction": "Say the word clearly and precisely.",
            "target_text": "help",
            "duration_seconds": 5,
            "metric_name": "Pronunciation Score",
        },
        {
            "name": "Functional Words",
            "instruction": "Say the word clearly and precisely.",
            "target_text": "phone",
            "duration_seconds": 5,
            "metric_name": "Pronunciation Score",
        },
        {
            "name": "CVC Words",
            "instruction": "Say the word clearly and precisely.",
            "target_text": "pop",
            "duration_seconds": 5,
            "metric_name": "Pronunciation Score",
        },
        {
            "name": "CVC Words",
            "instruction": "Say the word clearly and precisely.",
            "target_text": "kick",
            "duration_seconds": 5,
            "metric_name": "Pronunciation Score",
        },
        {
            "name": "CVC Words",
            "instruction": "Say the word clearly and precisely.",
            "target_text": "tap",
            "duration_seconds": 5,
            "metric_name": "Pronunciation Score",
        },
    ],

    ExerciseBlock.speech_rate: [
        {
            "name": "Self Paced Reading",
            "instruction": "Read the sentence aloud at a slow, deliberate pace. Take your time with each word.",
            "target_text": "I would like a glass of water please",
            "duration_seconds": 12,
            "metric_name": "Speech Rate (WPM vs target)",
        },
        {
            "name": "Self Paced Reading",
            "instruction": "Read the sentence aloud at a slow, deliberate pace. Take your time with each word.",
            "target_text": "Good morning how are you today",
            "duration_seconds": 12,
            "metric_name": "Speech Rate (WPM vs target)",
        },
        {
            "name": "Syllable Tapping",
            "instruction": "Tap your finger on the table for each syllable as you say the phrase slowly.",
            "target_text": "good morning doctor",
            "duration_seconds": 10,
            "metric_name": "Speech Rate (WPM vs target)",
        },
        {
            "name": "Self Paced Reading",
            "instruction": "Read the sentence aloud at a slow, deliberate pace. Take your time with each word.",
            "target_text": "Please call my family",
            "duration_seconds": 10,
            "metric_name": "Speech Rate (WPM vs target)",
        },
    ],

    ExerciseBlock.functional_phrases: [
        {
            "name": "Emergency Phrase",
            "instruction": "Say this phrase clearly as if you need immediate help.",
            "target_text": "I need help",
            "duration_seconds": 6,
            "metric_name": "Words Understood %",
        },
        {
            "name": "Emergency Phrase",
            "instruction": "Say this phrase clearly as if speaking to a doctor.",
            "target_text": "Call the doctor",
            "duration_seconds": 6,
            "metric_name": "Words Understood %",
        },
        {
            "name": "Daily Need",
            "instruction": "Say this phrase clearly.",
            "target_text": "I need water",
            "duration_seconds": 6,
            "metric_name": "Words Understood %",
        },
        {
            "name": "Daily Need",
            "instruction": "Say this phrase clearly.",
            "target_text": "I want to go home",
            "duration_seconds": 8,
            "metric_name": "Words Understood %",
        },
        {
            "name": "Social Phrase",
            "instruction": "Say this greeting clearly.",
            "target_text": "Good morning",
            "duration_seconds": 6,
            "metric_name": "Words Understood %",
        },
        {
            "name": "Social Phrase",
            "instruction": "Say this phrase clearly.",
            "target_text": "How are you",
            "duration_seconds": 6,
            "metric_name": "Words Understood %",
        },
    ],

    ExerciseBlock.read_aloud: [
        {
            "name": "Short Sentence",
            "instruction": "Read this sentence aloud clearly.",
            "target_text": "I am fine",
            "duration_seconds": 8,
            "metric_name": "Words Correct %",
        },
        {
            "name": "Medium Sentence",
            "instruction": "Read this sentence aloud clearly.",
            "target_text": "I need a glass of water",
            "duration_seconds": 10,
            "metric_name": "Words Correct %",
        },
        {
            "name": "Medium Sentence",
            "instruction": "Read this sentence aloud clearly.",
            "target_text": "Good morning how are you today",
            "duration_seconds": 10,
            "metric_name": "Words Correct %",
        },
        {
            "name": "Hard Sentence",
            "instruction": "Read this sentence aloud clearly.",
            "target_text": "The doctor will see you in the morning",
            "duration_seconds": 12,
            "metric_name": "Words Correct %",
        },
    ],
}
