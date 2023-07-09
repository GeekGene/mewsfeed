<template>
  <BaseDialog
    :model-value="modelValue"
    dialog-panel-class="md:w-auto bg-base-100"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div class="w-96">
      <profiles-context :store="profilesStore">
        <h2
          class="text-3xl text-left font-title font-bold tracking-tighter mb-4"
        >
          edit profile
        </h2>
        <BaseEditAgentProfileForm
          :profile="profile ? profile : {nickname: '', fields: { avatar: '', bio: '', location: ''} } as Profile"
          @profile-updated="
            (profile: Profile) => {
              emit('update:model-value', false);
              emit('profile-updated', profile);
            }
          "
        ></BaseEditAgentProfileForm>
      </profiles-context>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { ComputedRef, inject } from "vue";
import BaseEditAgentProfileForm from "@/components/BaseEditAgentProfileForm.vue";

defineProps<{
  profile?: Profile | null;
  modelValue: boolean;
}>();
const emit = defineEmits(["update:model-value", "profile-updated"]);

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
</script>
