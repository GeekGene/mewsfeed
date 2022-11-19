const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
};
const timeFormatOptions: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
};

export const generateReadableTimestamp = (holoTimestamp) => {
  const timestamp = new Date(Number(holoTimestamp) / 1000);

  const formattedDate = new Intl.DateTimeFormat(
    'default',
    dateFormatOptions
  ).format(timestamp);
  const formattedTime = new Intl.DateTimeFormat(
    'default',
    timeFormatOptions
  ).format(timestamp);
  const formattedTimestamp = `${formattedTime} on ${formattedDate}`;

  return formattedTimestamp;
};
