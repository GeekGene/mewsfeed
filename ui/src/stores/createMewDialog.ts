import { defineStore } from "pinia";
import { ref } from "vue";
import { FeedMew, MewType, MewTypeName } from "@/types/types";
import { Profile } from "@holochain-open-dev/profiles";

export const useCreateMewDialogStore = defineStore("createMewDialog", () => {
  const defaultCallback = () => {
    console.log("completed createMew callback");
  };

  const createMewDialogType = ref<MewType>({ type: MewTypeName.Original });
  const createMewDialogProps = ref<{
    originalMew?: FeedMew;
    originalAuthor?: Profile;
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
      originalAuthor: original?.original_mew?.author_profile || undefined,
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
