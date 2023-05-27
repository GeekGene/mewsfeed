import { Notify, QNotifyCreateOptions } from "quasar";

const DEFAULT_MESSAGE = "Done!";

export const showMessage = (
  messageOrOptions?: string | QNotifyCreateOptions
) => {
  const options: QNotifyCreateOptions = {
    color: "green",
    position: "bottom",
    timeout: 250,
  };
  options.message =
    typeof messageOrOptions === "string" ? messageOrOptions : DEFAULT_MESSAGE;
  if (typeof messageOrOptions === "object") {
    Object.assign(options, messageOrOptions);
  }
  Notify.create(options);
};

export const showError = (error: unknown) => {
  if (!error) return;

  console.error(error);
  const message =
    error instanceof Error ? error.message : JSON.stringify(error, null, 4);
  Notify.create({ message, color: "red", position: "bottom" });
};
