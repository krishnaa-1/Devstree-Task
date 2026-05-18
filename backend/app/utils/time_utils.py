import re

TIME_PATTERN = re.compile(r"^(0?[1-9]|1[0-2]):([0-5]\d) (AM|PM)$", re.IGNORECASE)


def normalize_time(time_str):
    normalized = " ".join(time_str.upper().strip().split())
    return normalized


def convert_to_minutes(time_str):
    time_part, modifier = time_str.split(" ")
    hours, minutes = map(int, time_part.split(":"))
    modifier = modifier.upper()
    if modifier == "PM" and hours != 12:
        hours += 12
    if modifier == "AM" and hours == 12:
        hours = 0
    return hours * 60 + minutes


def convert_to_12_hour(minutes):
    hours24 = minutes // 60
    minutes_part = minutes % 60
    modifier = "PM" if hours24 >= 12 else "AM"
    hours12 = hours24 % 12 or 12
    return f"{hours12}:{minutes_part:02d} {modifier}"


def validate_availability_times(start_time, end_time):
    start_time = normalize_time(start_time)
    end_time = normalize_time(end_time)
    if not TIME_PATTERN.match(start_time) or not TIME_PATTERN.match(end_time):
        raise ValueError("Invalid time format.")
    if convert_to_minutes(start_time) >= convert_to_minutes(end_time):
        raise ValueError("Start time must be earlier than end time.")
    return start_time, end_time
