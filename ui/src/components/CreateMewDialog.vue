<template>
  <QDialog ref="dialogRef" @hide="onDialogHide">
    <QCard class="QDialog-plugin dialog">
      <QCardSection class="q-pb-sm">
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
          <QBtn icon="close" flat round dense @click="onDialogCancel" />
        </div>
      </QCardSection>

      <QCardSection
        v-if="MewTypeName.Reply in mewType || MewTypeName.Quote in mewType"
      >
        <div class="q-mb-md text-subtitle1 text-grey-7">
          <MewContent :feed-mew="originalMew" />
        </div>
      </QCardSection>

      <QCardSection>
        <profiles-context :store="profilesStore">
          <CreateMewField :mew-type="mewType" @publish-mew="_onMewPublish" />
        </profiles-context>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup lang="ts">
import { QDialog, QCard, QCardSection, QBtn } from "quasar";
import CreateMewField from "@/components/CreateMewField.vue";
import { useProfilesStore } from "@/stores/profiles";
import { FeedMew, MewType, MewTypeName, PROFILE_FIELDS } from "@/types/types";
import { Profile } from "@holochain-open-dev/profiles";
import { useDialogPluginComponent } from "quasar";
import { PropType } from "vue";
import MewContent from "./MewContent.vue";

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps({
  mewType: { type: Object as PropType<MewType>, required: true },
  onPublishMew: {
    type: Function as PropType<(mewType: MewType) => void>,
    required: true,
  },
  originalMew: { type: Object as PropType<FeedMew>, default: () => ({}) },
  originalAuthor: { type: Object as PropType<Profile>, default: () => ({}) },
});
defineEmits([...useDialogPluginComponent.emits]);

const { profilesStore } = useProfilesStore();

const _onMewPublish = () => {
  props.onPublishMew(props.mewType);
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
