<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="q-pb-none">
        <div class="q-mb-sm row items-center text-subtitle2">
          <slot name="title" />
          <q-space />
          <q-btn icon="close" flat round dense @click="onDialogCancel" />
        </div>
        <slot name="subtitle" />
      </q-card-section>

      <q-card-section>
        <AddMewField
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
import { useDialogPluginComponent } from "quasar";
import { showError } from "@/utils/notification";
import { createMew } from "@/services/clutter-dna";
import AddMewField from "./AddMewField.vue";
import { useStore } from "@/store";
import { Routes } from "@/router";
import { useRouter } from "vue-router";

defineProps({ mewType: { type: Object as PropType<MewType>, required: true } });
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const store = useStore();
const router = useRouter();
const saving = ref(false);

const onPublishMew = async (mew: CreateMewInput) => {
  try {
    saving.value = true;
    await createMew(mew);
    if (router.currentRoute.value.name === Routes.Feed) {
      store.fetchMewsFeed();
    } else {
      router.push(Routes.Feed);
    }
    onDialogOK();
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }
};
</script>
