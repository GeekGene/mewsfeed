import { NotificationOptions } from "@/types/types";
import { Notify } from "quasar";

const DEFAULT_MESSAGE = "Done!";

export const showMessage = (messageOrOptions?: string | NotificationOptions) => {
    const options: NotificationOptions = { color: "green", position: "bottom" };
    options.message = typeof messageOrOptions === "string" ? messageOrOptions : DEFAULT_MESSAGE;
    if (typeof messageOrOptions === "object") {
        Object.assign(options, messageOrOptions);
    }
    Notify.create(options);
};

export const showError = (error: unknown) => {
    const message = error instanceof Error ? error.message : JSON.stringify(error, null, 4);
    Notify.create({ message, color: "red", position: "bottom" });
};