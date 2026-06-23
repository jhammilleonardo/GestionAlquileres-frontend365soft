function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

export function toDateOnly(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (value instanceof Date) {
    return toLocalDateOnly(value);
  }

  if (typeof value === 'string') {
    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}/.exec(value);

    if (dateOnlyMatch) {
      return dateOnlyMatch[0];
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toLocalDateOnly(date);
}

function toLocalDateOnly(date: Date): string {
  return [date.getFullYear(), padDatePart(date.getMonth() + 1), padDatePart(date.getDate())].join(
    '-',
  );
}
