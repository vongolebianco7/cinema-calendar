'use strict';

function tokyoClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return { date: values.year + '-' + values.month + '-' + values.day, time: values.hour + ':' + values.minute };
}

function upcomingTelevisionRows(rows, now = new Date()) {
  if (!Array.isArray(rows)) return [];
  const clock = tokyoClock(now);
  return rows.filter(row => {
    if (!row || typeof row !== 'object') return false;
    if (typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return false;
    if (typeof row.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.time)) return false;
    return row.date > clock.date || (row.date === clock.date && row.time > clock.time);
  });
}

module.exports = { tokyoClock, upcomingTelevisionRows };
