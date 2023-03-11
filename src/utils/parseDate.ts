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

export const generateDate = (type: string) => {
  const dateObj = new Date();
  if (type === "today") {
    const date = dateObj.toLocaleString("en-US", generateOptions);
    const todaysDate = `${dateObj.getFullYear()}-${date.slice(0, 2)}-${date.slice(3, 5)}`;
    return todaysDate;
  } else if (type === "next") {
    dateObj.setDate(dateObj.getDate() + 1);
    const date = dateObj.toLocaleDateString("en-US", generateOptions);
    const nextDate = `${dateObj.getFullYear()}-${date.slice(0, 2)}-${date.slice(3, 5)}`;
    return nextDate;
  }
  return null;
};
