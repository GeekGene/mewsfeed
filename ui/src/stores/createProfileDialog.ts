import { defineStore } from "pinia";
import { ref } from "vue";

export const useCreateProfileDialogStore = defineStore(
  "createProfileDialog",
  () => {
    const defaultCallback = () => {
      console.log("completed createProfile callback");
    };

    const showCreateProfileDialog = ref(false);
    const createProfileCompleteCallback = ref<() => void>(defaultCallback);

    const openCreateProfileDialog = (callback?: () => void) => {
      createProfileCompleteCallback.value = callback || defaultCallback;
      showCreateProfileDialog.value = true;
    };

    return {
      createProfileCompleteCallback,
      showCreateProfileDialog,
      openCreateProfileDialog,
    };
  }
);
