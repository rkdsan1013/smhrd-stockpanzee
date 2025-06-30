// /frontend/src/utils/formats.ts
/**
 * 숫자를 한글 단위(만·억·조)로 포맷팅
 */
export function formatCurrency(value: number): string {
  if (value >= 1e12) return (value / 1e12).toFixed(1) + "조";
  if (value >= 1e8) return (value / 1e8).toFixed(1) + "억";
  if (value >= 1e4) return (value / 1e4).toFixed(1) + "만";
  return value.toLocaleString() + "원";
}

/**
 * 퍼센트 수치를 소수점까지 포맷 (기본 2자리)
 */
export function formatPercentage(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}
