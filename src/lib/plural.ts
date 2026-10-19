export function plural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 > 20)) return few;
  return many;
}

export function countLabel(count: number, one: string, few: string, many: string): string {
  return `${count} ${plural(count, one, few, many)}`;
}
