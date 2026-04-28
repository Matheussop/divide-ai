const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function getCurrentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function isValidMonthKey(value: string) {
  return MONTH_KEY_REGEX.test(value);
}

export function resolveMonthKey(value?: string | null) {
  if (value && isValidMonthKey(value)) {
    return value;
  }

  return getCurrentMonthKey();
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}
