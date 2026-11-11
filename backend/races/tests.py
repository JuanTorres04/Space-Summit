from django.test import SimpleTestCase

from .scoring import (
    SuspiciousSubmission,
    calculate_accuracy,
    calculate_wpm,
    score_submission,
)

TARGET = "a" * 50  # 50 characters = 10 "words"


class ScoringTests(SimpleTestCase):
    def test_perfect_typing_has_full_accuracy(self):
        self.assertEqual(calculate_accuracy(TARGET, TARGET), 100)

    def test_half_wrong_is_fifty_percent(self):
        typed = "a" * 25 + "b" * 25
        self.assertAlmostEqual(calculate_accuracy(typed, TARGET), 50)

    def test_extra_characters_lower_accuracy(self):
        typed = "a" * 60
        self.assertAlmostEqual(calculate_accuracy(typed, TARGET), 83.33, places=1)

    def test_wpm_for_one_minute(self):
        # 10 words in 60 seconds = 10 WPM
        self.assertAlmostEqual(calculate_wpm(TARGET, TARGET, 60), 10)

    def test_empty_input_scores_zero(self):
        self.assertEqual(calculate_accuracy("", TARGET), 0)
        self.assertEqual(calculate_wpm("", TARGET, 60), 0)

    def test_zero_time_is_rejected(self):
        with self.assertRaises(SuspiciousSubmission):
            calculate_wpm(TARGET, TARGET, 0)

    def test_impossible_speed_is_rejected(self):
        # 10 words in 1 second = 600 WPM
        with self.assertRaises(SuspiciousSubmission):
            score_submission(TARGET, TARGET, 1)

    def test_valid_submission_returns_rounded_scores(self):
        result = score_submission(TARGET, TARGET, 60)
        self.assertEqual(result, {"wpm": 10.0, "accuracy": 100.0})