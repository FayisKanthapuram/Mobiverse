// Convert input date to IST Date object
export const toISTDate = (dateString) => {
  if (!dateString) return null;

  // IST offset = +5 hours 30 minutes
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;

  const date = new Date(dateString);
  return new Date(date.getTime() + IST_OFFSET);
};
