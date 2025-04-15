export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ca-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
