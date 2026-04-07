const DATE_LOCALE = "es-MX";

const parseValidDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value: string | null | undefined) => {
  const date = parseValidDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatDate = (value: string | null | undefined) => {
  const date = parseValidDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    dateStyle: "medium",
  }).format(date);
};
