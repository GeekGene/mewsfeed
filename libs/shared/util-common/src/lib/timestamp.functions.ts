const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
};
const timeFormatOptions: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
};

export const generateReadableTimestamp = (rawTimestamp: any) => {
  const dateTimestamp = new Date(Number(rawTimestamp) / 1000);

  const formattedDate = new Intl.DateTimeFormat(
    'default',
    dateFormatOptions
  ).format(dateTimestamp);
  const formattedTime = new Intl.DateTimeFormat(
    'default',
    timeFormatOptions
  ).format(dateTimestamp);
  const formattedTimestamp = `${formattedTime} on ${formattedDate}`;

  return formattedTimestamp;
};
