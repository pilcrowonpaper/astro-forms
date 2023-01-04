export type Result<V extends {}> =
  | {
      type: "success";
      response: Response | null;
      body: V;
      inputValues: Record<string, any>;
      error: null;
      redirected: false;
    }
  | {
      type: "reject";
      response: Response | null;
      body: null;
      inputValues: Record<string, any>;
      error: Record<string, any>;
      redirected: false;
    }
  | {
      type: "redirect";
      response: Response | null;
      body: null;
      inputValues: Record<string, any>;
      error: null;
      redirected: true;
    }
  | {
      type: "ignore";
      response: null;
      body: null;
      inputValues: Record<string, any>;
      error: null;
      redirected: false;
    };

export type JsonResult<V> =
  | {
      type: "success";
      body: V;
      error: null;
      redirect_location: null;
    }
  | {
      type: "reject";
      body: null;
      error: Record<string, any>;
      redirect_location: null;
    }
  | {
      type: "redirect";
      body: null;
      error: null;
      redirect_location: string;
    };
