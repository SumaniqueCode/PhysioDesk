import datetime as dt

from app.models.therapist import Therapist, TherapistScheduleOverride


def working_window(
    therapist: Therapist,
    target_date: dt.date,
    override: TherapistScheduleOverride | None,
) -> tuple[dt.time, dt.time] | None:
    """Resolve a therapist's hours for one date, or None when they don't work it.

    A per-date override wins over the weekly pattern: a day off closes the date,
    custom hours replace the window.
    """
    if override is not None:
        if override.is_day_off:
            return None
        return override.start_time, override.end_time
    if target_date.weekday() in therapist.working_days:
        return therapist.start_time, therapist.end_time
    return None


def generate_slots(
    start: dt.time, end: dt.time, duration_minutes: int
) -> list[tuple[dt.time, dt.time]]:
    """Split a [start, end) window into back-to-back slots of the given length.

    A trailing gap shorter than one slot is dropped rather than truncated.
    """
    slots: list[tuple[dt.time, dt.time]] = []
    step = dt.timedelta(minutes=duration_minutes)
    cursor = dt.datetime.combine(dt.date.min, start)
    limit = dt.datetime.combine(dt.date.min, end)
    while cursor + step <= limit:
        slots.append((cursor.time(), (cursor + step).time()))
        cursor += step
    return slots
