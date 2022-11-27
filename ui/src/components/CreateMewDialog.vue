<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin dialog">
      <q-card-section class="q-pb-sm">
        <div class="row justify-between items-center">
          <div class="text-subtitle1 text-medium">
            <template v-if="MewTypeName.Original in mewType">
              Create a mew:
            </template>
            <template v-if="MewTypeName.Reply in mewType">Reply to </template>
            <template v-if="MewTypeName.Quote in mewType">Quote </template>

            <template
              v-if="
                MewTypeName.Reply in mewType || MewTypeName.Quote in mewType
              "
            >
              <span class="q-mr-xs text-primary text-bold">{{
                originalAuthor.fields[PROFILE_FIELDS.DISPLAY_NAME]
              }}</span>
              <span>@{{ originalAuthor.nickname }}</span>
            </template>
          </div>
          <q-btn icon="close" flat round dense @click="onDialogCancel" />
        </div>
      </q-card-section>

      <q-card-section
        v-if="MewTypeName.Reply in mewType || MewTypeName.Quote in mewType"
      >
        <div class="q-mb-md text-subtitle1 text-grey-7">
          <mew-content :feed-mew="originalMew" />
        </div>
      </q-card-section>

      <q-card-section>
        <profiles-context :store="profilesStore">
          <CreateMewField :mew-type="mewType" @publish-mew="onPublishMew" />
        </profiles-context>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import CreateMewField from "@/components/CreateMewField.vue";
import MewContent from "./MewContent.vue";
import { ROUTES } from "@/router";
import { useProfilesStore } from "@/services/profiles-store";
import { useClutterStore } from "@/stores";
import { FeedMew, MewType, MewTypeName, PROFILE_FIELDS } from "@/types/types";
import { useDialogPluginComponent } from "quasar";
import { PropType } from "vue";
import { useRouter } from "vue-router";
import { Profile } from "@holochain-open-dev/profiles";

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

defineProps({
  mewType: { type: Object as PropType<MewType>, required: true },
  originalMew: { type: Object as PropType<FeedMew>, default: () => ({}) },
  originalAuthor: { type: Object as PropType<Profile>, default: () => ({}) },
});
defineEmits([...useDialogPluginComponent.emits]);

const store = useClutterStore();
const profilesStore = useProfilesStore();
const router = useRouter();

const onPublishMew = () => {
  if (router.currentRoute.value.name === ROUTES.feed) {
    store.fetchMewsFeed();
  } else {
    router.push({ name: ROUTES.feed });
  }
  onDialogOK();
};
</script>

<style lang="sass" scoped>
.dialog
  min-width: 400px
  max-width: 600px
  max-height: calc(100vh - 100px)
  overflow: visible
</style>
