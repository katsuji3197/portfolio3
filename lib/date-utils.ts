export function formatYearMonth(dateStr?: string | null): string {
  if (!dateStr) return '開発中';

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '開発中';

  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  return `${year}年${month}月`;
}
