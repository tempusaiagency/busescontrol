/**
 * Format amount in Paraguayan Guaraníes (PYG)
 * Symbol: ₲
 * Format: ₲ 1.234.567
 */
export const formatGuarani = (amount: number): string => {
  const formatted = Math.round(amount).toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `₲ ${formatted}`;
};

/**
 * Parse Guaraní string to number
 */
export const parseGuarani = (value: string): number => {
  const cleaned = value.replace(/[₲\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};
