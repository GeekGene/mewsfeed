<template>
  <QDialog>
    <QCard>
      <create-profile
        v-if="profilesStore"
        :store="profilesStore"
        @profile-created="$emit('profile-created')"
      ></create-profile>
    </QCard>
  </QDialog>
</template>

<script setup lang="ts">
import { QDialog, QCard } from "quasar";
import { ProfilesStore } from "@holochain-open-dev/profiles";
defineEmits(["profile-created"]);
defineProps<{
  profilesStore: ProfilesStore;
}>();
</script>
