const options: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "2-digit",
  hour: "numeric",
  minute: "numeric",
  hour12: true
};

// todo: format the date to the user's timezone
export const formatDate = (date: string) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString("en-US", options);
};
