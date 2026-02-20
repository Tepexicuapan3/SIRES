from dataclasses import dataclass


@dataclass(frozen=True)
class SequenceProgression:
    is_monotonic: bool
    has_gap: bool
    expected_sequence: int | None


def evaluate_sequence_progression(*, last_sequence, incoming_sequence):
    if not isinstance(incoming_sequence, int) or incoming_sequence <= 0:
        raise ValueError("incoming_sequence must be a positive integer.")

    if last_sequence is None:
        return SequenceProgression(
            is_monotonic=True,
            has_gap=False,
            expected_sequence=None,
        )

    if not isinstance(last_sequence, int) or last_sequence <= 0:
        raise ValueError("last_sequence must be a positive integer or None.")

    if incoming_sequence <= last_sequence:
        return SequenceProgression(
            is_monotonic=False,
            has_gap=False,
            expected_sequence=None,
        )

    expected_sequence = last_sequence + 1
    has_gap = incoming_sequence != expected_sequence
    return SequenceProgression(
        is_monotonic=True,
        has_gap=has_gap,
        expected_sequence=expected_sequence if has_gap else None,
    )
