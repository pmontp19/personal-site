/** Strip file extension from legacy content collection entry.id to get URL slug */
export const getSlug = (id: string) => id.replace(/\.[^.]+$/, '');

export const formatDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
  locale: string = 'ca-ES'
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString(locale, options);
};