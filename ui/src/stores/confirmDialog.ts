import { defineStore } from "pinia";
import { ref } from "vue";

export const useConfirmDialogStore = defineStore("confirmDialog", () => {
  const confirmDialogHtml = ref();
  const confirmDialogProps = ref<{
    title?: string;
    confirmText?: string;
  }>();
  const showConfirmDialog = ref(false);
  const confirmCallback = ref<() => void>();

  const openConfirmDialog = (
    html: string,
    title?: string,
    confirmText?: string,
    callback?: () => void
  ) => {
    confirmDialogHtml.value = html;
    confirmDialogProps.value = {
      title,
      confirmText,
    };
    confirmCallback.value = callback;
    showConfirmDialog.value = true;
  };

  return {
    confirmDialogHtml,
    confirmDialogProps,
    showConfirmDialog,
    confirmCallback,
    openConfirmDialog,
  };
});
