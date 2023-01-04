import type { AstroGlobal } from "astro";
import { parse } from "parse-multipart-data";
import type { JsonResult, Result } from "./shared";

class RejectResponse {
  public status: number;
  public data: Record<string, any>;
  constructor(status: number, data?: Record<string, any>) {
    this.status = status;
    this.data = data ?? {};
  }
}

class RedirectResponse {
  public status: number;
  public location: string;
  constructor(status: number, location: string) {
    this.status = status;
    this.location = location;
  }
}

export const handleFormSubmission = async <
  R extends { request: Request; response: AstroGlobal["response"] },
  Handle extends (formData: FormData) => Promise<Record<string, any>>
>(
  { request, response }: R,
  handle: Handle
): Promise<Result<Awaited<ReturnType<Handle>>>> => {
  type FullJsonResult = JsonResult<Awaited<ReturnType<Handle>>>;
  const clonedRequest = request.clone();
  const contentType = clonedRequest.headers.get("content-type") ?? "";
  const isMultipartForm = contentType.includes("multipart/form-data");
  const isUrlEncodedForm = contentType.includes(
    "application/x-www-form-urlencoded"
  );
  const isValidContentType = isMultipartForm || isUrlEncodedForm;
  if (clonedRequest.method !== "POST" || !isValidContentType)
    return {
      type: "ignore",
      response: null,
      body: null,
      inputValues: {},
      error: null,
      redirected: false,
    };
  const formData = new FormData();
  const acceptHeader = clonedRequest.headers.get("accept");
  if (isMultipartForm) {
    const boundary = contentType.replace("multipart/form-data; boundary=", "");
    const parts = parse(
      Buffer.from(await clonedRequest.arrayBuffer()),
      boundary
    );
    parts.forEach((value) => {
      const isFile = !!value.type;
      if (isFile) {
        formData.append(value.name!, new Blob([value.data]), value.filename!);
      } else {
        formData.append(value.name!, value.data.toString());
      }
    });
  } else if (isUrlEncodedForm) {
    const requestBodyFormData = await clonedRequest.formData();
    requestBodyFormData.forEach((value, key) => {
      formData.append(key, value);
    });
  } else {
    throw new Error("Unexpected value");
  }
  const inputValues = Object.fromEntries(formData.entries());
  try {
    const body = (await handle(formData)) as Awaited<ReturnType<Handle>>;
    if (acceptHeader === "application/json") {
      return {
        type: "success",
        body,
        response: new Response(
          JSON.stringify({
            type: "success",
            body,
            error: null,
            redirect_location: null,
          } satisfies FullJsonResult)
        ),
        inputValues,
        error: null,
        redirected: false,
      };
    }
    return {
      type: "success",
      body,
      response: null,
      inputValues,
      error: null,
      redirected: false,
    };
  } catch (e) {
    if (e instanceof RejectResponse) {
      if (acceptHeader === "application/json") {
        return {
          type: "reject",
          body: null,
          response: new Response(
            JSON.stringify({
              type: "reject",
              body: null,
              error: e.data,
              redirect_location: null,
            } satisfies FullJsonResult),
            {
              status: e.status,
            }
          ),
          inputValues,
          error: e.data,
          redirected: false,
        };
      }
      response.status = e.status;
      return {
        type: "reject",
        body: null,
        response: null,
        inputValues,
        error: e.data,
        redirected: false,
      };
    }
    if (e instanceof RedirectResponse) {
      if (acceptHeader === "application/json") {
        return {
          type: "redirect",
          body: null,
          response: new Response(
            JSON.stringify({
              type: "redirect",
              body: null,
              error: null,
              redirect_location: e.location,
            } satisfies FullJsonResult),
            {
              status: e.status,
            }
          ),
          inputValues,
          error: null,
          redirected: true,
        };
      }
      response.status = e.status;
      response.headers.set("location", e.location);
      return {
        type: "redirect",
        body: null,
        response: null,
        inputValues,
        error: null,
        redirected: true,
      };
    }
    throw e;
  }
};

export const reject = (status: number, data?: Record<string, any>) =>
  new RejectResponse(status, data);
export const redirect = (status: number, location: string) =>
  new RedirectResponse(status, location);
