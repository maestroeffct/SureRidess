export function getFlagEmoji(countryCode?: string) {
  if (!countryCode) return '🌍'; // fallback icon

  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
