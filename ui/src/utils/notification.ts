import { NotificationOptions } from "../types/types";
import { Notify } from "quasar";

const DEFAULT_MESSAGE = "Done!";

export const showMessage = (options: NotificationOptions) => {
    Notify.create({ message: options.message || DEFAULT_MESSAGE, color: "green", position: "bottom-right" });
};

export const showError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    Notify.create({ message, color: "red", position: "bottom-right" });
};