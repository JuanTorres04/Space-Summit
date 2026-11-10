MAX_HUMAN_WPM = 250  # faster than this is treated as cheating
CHARS_PER_WORD = 5


class SuspiciousSubmission(ValueError):
    """Raised when a submitted result can't be legitimate."""


def calculate_accuracy(typed: str, target: str) -> float:
    """Percent of positions where the typed text matches the passage.

    Extra characters beyond the passage length count against the player.
    """
    if not typed or not target:
        return 0.0
    correct = sum(1 for a, b in zip(typed, target) if a == b)
    return correct / max(len(typed), len(target)) * 100


def calculate_wpm(typed: str, target: str, elapsed_seconds: float) -> float:
    """Net WPM: correct characters, five per word, per minute."""
    if elapsed_seconds <= 0:
        raise SuspiciousSubmission("Elapsed time must be positive.")
    correct = sum(1 for a, b in zip(typed, target) if a == b)
    minutes = elapsed_seconds / 60
    return (correct / CHARS_PER_WORD) / minutes


def score_submission(typed: str, target: str, elapsed_seconds: float) -> dict:
    """Score a finished race, rejecting results that are humanly impossible."""
    wpm = calculate_wpm(typed, target, elapsed_seconds)
    if wpm > MAX_HUMAN_WPM:
        raise SuspiciousSubmission(f"{wpm:.0f} WPM is above the allowed limit.")
    return {
        "wpm": round(wpm, 1),
        "accuracy": round(calculate_accuracy(typed, target), 1),
    }
