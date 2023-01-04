import type { JsonResult } from "./shared";

export const submitForm = async <V = {}>(
  element: HTMLFormElement,
  handleRedirect: (location: string) => void = (location) =>
    (window.location.href = location)
) => {
  const formData = new FormData(element);
  const response = await fetch(element.action, {
    method: element.method,
    body: formData,
    headers: {
      accept: "application/json",
    },
  });
  const result = (await response.json()) as JsonResult<V>;
  console.log(result);
  if (result.type === "redirect") {
    handleRedirect(result.redirect_location);
  }
  return result;
};
