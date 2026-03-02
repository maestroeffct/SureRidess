export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const formatTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

export const generateTimes = (start: number, end: number) => {
  const times = [];
  for (let h = start; h <= end; h++) {
    const hour = String(h).padStart(2, '0');
    times.push(`${hour}:00`);
    times.push(`${hour}:30`);
  }
  return times;
};
