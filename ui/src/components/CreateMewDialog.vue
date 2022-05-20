<template>
  <q-dialog v-model="isVisible" @hide="onClose">
    <q-card class="q-dialog-plugin">
      <q-card-section class="q-pb-none">
        <div class="q-mb-sm row items-center text-subtitle2">
          <slot name="title" />
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </div>
        <slot name="subtitle" />
      </q-card-section>

      <q-card-section>
        <CreateMewField
          class="text-center"
          :mew-type="mewType"
          :saving="saving"
          @publish-mew="onPublishMew"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { CreateMewInput, MewType } from "@/types/types";
import { PropType, ref } from "vue";
import { showError } from "@/utils/notification";
import { createMew } from "@/services/clutter-dna";
import { useStore } from "@/store";
import { ROUTES } from "@/router";
import { useRouter } from "vue-router";
import CreateMewField from "@/components/CreateMewField.vue";

defineProps({ mewType: { type: Object as PropType<MewType>, required: true } });
const emit = defineEmits<{ (e: "mew-created"): void; (e: "close"): void }>();
const onClose = () => emit("close");

const store = useStore();
const router = useRouter();
const isVisible = ref(true);
const saving = ref(false);

const onPublishMew = async (mew: CreateMewInput) => {
  try {
    saving.value = true;
    await createMew(mew);
    emit("mew-created");
    if (router.currentRoute.value.name === ROUTES.feed) {
      store.fetchMewsFeed();
    } else {
      router.push(ROUTES.feed);
    }
    onClose();
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }
};
</script>
