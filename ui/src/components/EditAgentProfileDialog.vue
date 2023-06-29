<template>
  <BaseDialog
    :model-value="modelValue"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div class="w-80 m-4">
      <profiles-context :store="profilesStore">
        <h2 class="text-2xl font-title font-bold tracking-tighter text-left">
          edit profile
        </h2>
        <update-profile
          class="font-content text-left prose update-profile-element"
          :profile="profile"
          :store="profilesStore"
          @profile-updated="
            (profile: Profile) => {
              emit('update:model-value', false);
              emit('profile-updated', profile);
            }
          "
          @cancel-edit-profile="emit('update:model-value', false)"
        ></update-profile>
      </profiles-context>
    </div>
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
