<template>
  <BaseDialog
    :model-value="modelValue"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <update-profile
      :profile="profile"
      :store="profilesStore"
      @profile-updated="
        () => {
          emit('update:model-value', false);
          emit('profile-updated');
        }
      "
      @cancel-edit-profile="emit('update:model-value', false)"
    ></update-profile>
  </BaseDialog>
</template>

<script setup lang="ts">
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { ComputedRef, inject } from "vue";

defineProps<{
  profile?: Profile | null;
  modelValue: boolean;
}>();
const emit = defineEmits(["update:model-value", "profile-updated"]);

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
</script>

<style scoped></style>
