export const customError = (title: string) => {
  return {
    name: "ApiError",
    type: "response",
    errors: [
      {
        title: `${title} resource not found`,
        detail: `The requested resource was not found. Please double-check that one or more ${title.toLowerCase()}'s with the requested status type exists.`,
        code: "RECORD_NOT_FOUND",
        status: "404"
      }
    ],
    status: 404,
    code: "404"
  };
};
