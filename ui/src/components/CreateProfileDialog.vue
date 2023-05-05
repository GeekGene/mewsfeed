<template>
  <QDialog ref="dialogRef" @hide="onDialogHide">
    <QCard>
      <create-profile
        :store="profilesStore"
        class="q-pa-sm"
        @profile-created="(data: any) => onDialogOK(data.detail.profile)"
      ></create-profile>
    </QCard>
  </QDialog>
</template>

<script setup lang="ts">
import { useProfilesStore } from "@/services/profiles-store";
import { useDialogPluginComponent } from "quasar";
const profilesStore = useProfilesStore();
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent();

defineEmits([...useDialogPluginComponent.emits]);
</script>
