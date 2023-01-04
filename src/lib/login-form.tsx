import { Show, createSignal } from "solid-js";
import { submitForm } from "../actions/client";

export default (props: {
  errorMessage?: string;
  values?: Record<string, any>;
}) => {
  const [errorMessage, setErrorMessage] = createSignal(
    props.errorMessage ?? null
  );
  return (
    <form
      class="w-full"
      onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await submitForm(e.currentTarget);
        if (error) {
          setErrorMessage(error.message);
        }
      }}
      action="/"
      method="post"
      enctype="multipart/form-data"
    >
      <label for="label">Username</label>
      <input
        name="username"
        value={props.values?.username ?? ""}
        id="username"
        class="border w-full"
      />
      <label for="label">Password</label>
      <input
        type="password"
        name="password"
        value={props.values?.password ?? ""}
        id="password"
        class="border w-full "
      />
      <input type="submit" class="border w-full mt-4 bg-black text-white" />
      <Show when={errorMessage()}>
        <p class="text-red-400">{errorMessage()}</p>
      </Show>
    </form>
  );
};
