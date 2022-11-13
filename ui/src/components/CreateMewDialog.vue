<template>
  <base-dialog class="mew-dialog" style="min-width: 400px" @close="onClose">
    <template #title>
      <div class="text-subtitle1 text-medium">
        <slot name="title" />
      </div>
    </template>

    <template #content>
      <div class="q-mb-md text-subtitle1">
        <slot name="content" />
      </div>

      <profiles-context :store="profilesStore">
        <CreateMewField :mew-type="mewType" @publish-mew="onPublishMew" />
      </profiles-context>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from "@/components/BaseDialog.vue";
import CreateMewField from "@/components/CreateMewField.vue";
import { ROUTES } from "@/router";
import { useProfilesStore } from "@/services/profiles-store";
import { useClutterStore } from "@/stores";
import { MewType } from "@/types/types";
import { PropType } from "vue";
import { useRouter } from "vue-router";

defineProps({ mewType: { type: Object as PropType<MewType>, required: true } });
const emit = defineEmits<{ (e: "close"): void }>();
const onClose = () => emit("close");

const clutterStore = useClutterStore();
const profilesStore = useProfilesStore();
const router = useRouter();

const onPublishMew = () => {
  if (router.currentRoute.value.name === ROUTES.feed) {
    clutterStore.fetchMewsFeed();
  } else {
    router.push({ name: ROUTES.feed });
  }
  onClose();
};
</script>

<style lang="sass">
.mew-dialog
  .q-card.dialog
    overflow: visible
</style>
