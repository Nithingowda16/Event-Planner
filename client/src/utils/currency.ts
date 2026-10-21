export interface FormatCurrencyOptions {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  forceDecimals?: boolean;
}

/**
 * Universal localized currency formatter defaulting to Indian Rupees (INR).
 *
 * Formats numbers in the official Indian numbering system (e.g. ₹500, ₹12,500, ₹1,25,000)
 * using the browser's Intl.NumberFormat API with locale 'en-IN'.
 */
export function formatCurrency(
  amount: number,
  currency = 'INR',
  options?: FormatCurrencyOptions
): string {
  const normalized = (currency || 'INR').toUpperCase().trim();
  const isINR = normalized === 'INR';
  const locale = isINR ? 'en-IN' : 'en-US';

  let maxDecimals: number;
  let minDecimals: number;

  if (isINR) {
    const hasFractions = amount % 1 !== 0;
    maxDecimals = options?.maximumFractionDigits !== undefined
      ? options.maximumFractionDigits
      : (options?.forceDecimals || hasFractions ? 2 : 0);
    minDecimals = options?.minimumFractionDigits !== undefined
      ? options.minimumFractionDigits
      : (options?.forceDecimals || hasFractions ? maxDecimals : 0);
  } else {
    maxDecimals = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2;
    minDecimals = options?.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 2;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalized,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(amount);
  } catch {
    const symbol = isINR ? '₹' : `${normalized} `;
    return `${symbol}${amount.toLocaleString(locale)}`;
  }
}

/**
 * Convenience helper explicitly bound to Indian Rupees (₹, INR).
 */
export function formatINR(
  amount: number,
  options?: FormatCurrencyOptions
): string {
  return formatCurrency(amount, 'INR', options);
}
