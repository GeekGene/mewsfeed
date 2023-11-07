import { ToastMessage, ToastMessageType } from "@/types/types";
import { uniqueId } from "lodash";
import { defineStore } from "pinia";
import { ref } from "vue";

const DEFAULT_TIMEOUT = 3000; // Time to display toasts by default (ms)

export const useToasts = defineStore("toasts", () => {
  const messages = ref<ToastMessage[]>([]);

  const showError = (error: any) => {
    console.error(error);

    let text;
    if (error instanceof Error) {
      text = error.message;
    } else {
      text = JSON.stringify(error, null, 4);
    }

    showMessage(text, "error");
  };

  const showMessage = (
    text: string,
    type: ToastMessageType = "success",
    timeout = DEFAULT_TIMEOUT
  ) => {
    const uuid = uniqueId();
    messages.value.push({ id: uuid, text, type });

    setTimeout(() => removeMessage(uuid), timeout);
  };

  const removeMessage = (id: string) => {
    messages.value = messages.value.filter((m) => m.id !== id);
  };

  return { messages, showError, showMessage };
});
