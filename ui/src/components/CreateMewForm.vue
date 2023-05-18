<template>
  <QCard>
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
              (MewTypeName.Reply in mewType || MewTypeName.Quote in mewType) &&
              originalAuthor
            "
          >
            <span class="q-mr-xs text-primary text-bold">{{
              originalAuthor.fields[PROFILE_FIELDS.DISPLAY_NAME]
            }}</span>
            <span>@{{ originalAuthor.nickname }}</span>
          </template>
        </div>
      </div>
    </QCardSection>

    <QCardSection
      v-if="
        (MewTypeName.Reply in mewType || MewTypeName.Quote in mewType) &&
        originalMew
      "
    >
      <div class="q-mb-md text-subtitle1 text-grey-7">
        <MewContent :mew="originalMew.mew" />
      </div>
    </QCardSection>

    <QCardSection>
      <CreateMewField
        :mew-type="mewType"
        @mew-created="(val) => emit('mew-created', val)"
      />
    </QCardSection>
  </QCard>
</template>

<script setup lang="ts">
import { QCard, QCardSection } from "quasar";
import CreateMewField from "@/components/CreateMewField.vue";
import { FeedMew, MewType, MewTypeName, PROFILE_FIELDS } from "@/types/types";
import { Profile } from "@holochain-open-dev/profiles";
import MewContent from "./MewContent.vue";

defineProps<{
  mewType: MewType;
  originalMew?: FeedMew;
  originalAuthor?: Profile | null;
}>();
const emit = defineEmits(["mew-created"]);
</script>

<style lang="sass" scoped>
.dialog
  min-width: 400px
  max-width: 600px
  max-height: calc(100vh - 100px)
  overflow: visible
</style>
