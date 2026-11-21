// "dd/mm/yyyy" -> "yyyy-mm-dd". Returns '' when the text is not a real calendar date.
export function parseDisplayDate(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(text || '').trim());
  if (!match) return '';
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

// "yyyy-mm-dd" -> "dd/mm/yyyy"
export function isoToDisplayDate(iso) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : '';
}

// Today's date as "yyyy-mm-dd" in local time (used for date input max values).
export function todayIso() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');
}

// While typing digits, insert the slashes: "01092026" -> "01/09/2026".
export function autoSlashDate(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  let formatted = digits.slice(0, 2);
  if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
  if (digits.length > 4) formatted += '/' + digits.slice(4);
  return formatted;
}

// "2 hours ago", "just now", ...
export function timeAgo(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// "1 September 2026" (unambiguous in every country).
export function longDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Date not provided';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
