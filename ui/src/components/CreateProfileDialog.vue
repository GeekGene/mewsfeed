<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <create-profile
        :store="profilesStore"
        class="q-pa-sm"
        @profile-created="(data: any) => onDialogOK(data.detail.profile)"
      ></create-profile>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useProfilesStore } from "@/services/profiles-store";
import { useDialogPluginComponent } from "quasar";
const profilesStore = useProfilesStore();
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent();

defineEmits([...useDialogPluginComponent.emits]);
</script>
