export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
};

export const addDays = (dateString: string, days: number): string => {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);

  return formatLocalDate(date);
};

export const formatDateString = (
  dateString: string,
  options: Intl.DateTimeFormatOptions,
  fallback: string
): string => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, options).format(date);
};

export const formatShortDate = (dateString: string, fallback = 'Unknown date'): string => {
  return formatDateString(dateString, { day: 'numeric', month: 'short' }, fallback);
};

export const formatShortDateTime = (dateString: string, fallback = 'Unknown time'): string => {
  return formatDateString(
    dateString,
    { day: 'numeric', hour: '2-digit', minute: '2-digit', month: 'short' },
    fallback
  );
};
