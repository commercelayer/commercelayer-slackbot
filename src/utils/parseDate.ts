const formatOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "2-digit",
  hour: "numeric",
  minute: "numeric",
  hour12: true
};

const generateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
};

// todo: format the date to the user's timezone
export const formatDate = (date: string) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString("en-US", formatOptions);
};

export const generateDate = () => {
  const dateObj = new Date();
  const date = dateObj.toLocaleString("en-US", generateOptions);
  return `${dateObj.getFullYear()}-${date.slice(0, 2)}-${date.slice(3, 5)}`;
};
