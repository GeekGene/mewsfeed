<template>
  <BaseDialog
    :model-value="modelValue"
    dialog-panel-class="md:w-auto"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div class="w-96">
      <profiles-context :store="profilesStore">
        <h2
          class="text-3xl text-left font-title font-bold tracking-tighter mb-4"
        >
          edit profile
        </h2>
        <update-profile
          class="font-content text-left prose"
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
