<template>
  <BaseDialog
    :model-value="modelValue"
    dialog-panel-class="md:w-auto bg-base-100"
    :initial-focus-ref="baseEditAgentProfileFormRef?.$refs.usernameInputRef"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div>
      <profiles-context :store="profilesStore">
        <h2
          class="text-3xl text-left font-title font-bold tracking-tighter mb-4"
        >
          edit profile
        </h2>
        <BaseEditAgentProfileForm
          ref="baseEditAgentProfileFormRef"
          :model-value="profile"
          :profile="profile"
          @update:model-value="update"
        ></BaseEditAgentProfileForm>
      </profiles-context>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { ComputedRef, inject, ref } from "vue";
import BaseEditAgentProfileForm from "@/components/BaseEditAgentProfileForm.vue";
import { useToasts } from "@/stores/toasts";

defineProps<{
  profile: Profile;
  modelValue: boolean;
}>();
const emit = defineEmits(["update:model-value", "profile-updated"]);
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const { showError } = useToasts();
const baseEditAgentProfileFormRef = ref();

const update = async (newProfile: Profile) => {
  try {
    await profilesStore.client.updateProfile(newProfile);
    await profilesStore.myProfile.reload();

    emit("update:model-value", false);
    emit("profile-updated", newProfile);
  } catch (e) {
    showError(e);
  }
};
</script>
