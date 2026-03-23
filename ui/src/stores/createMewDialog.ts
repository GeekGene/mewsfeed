import { defineStore } from "pinia";
import { ref } from "vue";
import { FeedMew, MewType, MewTypeName } from "@/types/types";

export const useCreateMewDialogStore = defineStore("createMewDialog", () => {
  const defaultCallback = () => {
    console.log("completed createMew callback");
  };

  const createMewDialogType = ref<MewType>(MewTypeName.Original);
  const createMewDialogProps = ref<{
    originalMew?: FeedMew;
  }>();
  const createMewCompleteCallback = ref<() => void>(defaultCallback);
  const showCreateMewDialog = ref(false);

  const openCreateMewDialog = (
    type: MewType,
    original?: FeedMew,
    callback?: () => void
  ) => {
    createMewDialogType.value = type;
    createMewDialogProps.value = {
      originalMew: original,
    };
    createMewCompleteCallback.value = callback || defaultCallback;

    showCreateMewDialog.value = true;
  };

  const closeCreateMewDialog = () => {
    showCreateMewDialog.value = false;
  };

  return {
    createMewDialogType,
    createMewDialogProps,
    showCreateMewDialog,
    createMewCompleteCallback,
    openCreateMewDialog,
    closeCreateMewDialog,
  };
});
