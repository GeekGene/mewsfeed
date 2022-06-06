<template>
  <base-dialog @close="onClose">
    <template #title>
      <div class="text-subtitle1 text-medium">
        <slot name="title" />
      </div>
    </template>

    <template #content>
      <div class="q-mt-sm q-mb-md text-subtitle1">
        <slot name="content" />
      </div>

      <CreateMewField
        class="text-center"
        :mew-type="mewType"
        :saving="saving"
        @publish-mew="onPublishMew"
      />
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { CreateMewInput, MewType } from "@/types/types";
import { PropType, ref } from "vue";
import { showError } from "@/utils/notification";
import { createMew } from "@/services/clutter-dna";
import { useStore } from "@/store";
import { ROUTES } from "@/router";
import { useRouter } from "vue-router";
import BaseDialog from "@/components/BaseDialog.vue";
import CreateMewField from "@/components/CreateMewField.vue";

defineProps({ mewType: { type: Object as PropType<MewType>, required: true } });
const emit = defineEmits<{ (e: "mew-created"): void; (e: "close"): void }>();
const onClose = () => emit("close");

const store = useStore();
const router = useRouter();
const saving = ref(false);

const onPublishMew = async (mew: CreateMewInput) => {
  try {
    saving.value = true;
    await createMew(mew);
    emit("mew-created");
    if (router.currentRoute.value.name === ROUTES.feed) {
      store.fetchMewsFeed();
    } else {
      router.push({ name: ROUTES.feed });
    }
    onClose();
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }
};
</script>
