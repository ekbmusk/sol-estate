// Locale-aware number/currency formatting.
// kk-KZ uses the same group separator as ru-RU (narrow no-break space),
// so they share the same output. en-US uses comma.

export function localeToBcp47(locale: string): string {
  switch (locale) {
    case "kk":
      return "kk-KZ";
    case "en":
      return "en-US";
    case "ru":
    default:
      return "ru-RU";
  }
}

export function formatNumber(
  n: number,
  locale: string,
  opts?: Intl.NumberFormatOptions
): string {
  return n.toLocaleString(localeToBcp47(locale), opts);
}
