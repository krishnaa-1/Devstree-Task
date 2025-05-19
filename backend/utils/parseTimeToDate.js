function parseTimeToDate(date, timeStr) {
  // date: JS Date object with correct date (year, month, day)
  // timeStr: "hh:mm AM" or "hh:mm PM"

  const [time, modifier] = timeStr.split(' '); // ["02:30", "PM"]
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
module.exports = parseTimeToDate;