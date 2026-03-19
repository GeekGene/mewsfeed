<template>
  <BaseDialog
    :model-value="modelValue"
    dialog-panel-class="md:w-auto bg-base-100"
    :initial-focus-ref="baseEditAgentProfileFormRef?.$refs.usernameInputRef"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div :data-theme="themeStore.active">
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
          :saving="isSaving"
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
import { useThemeStore } from "@/stores/theme";

defineProps<{
  profile: Profile;
  modelValue: boolean;
}>();
const emit = defineEmits(["update:model-value", "profile-updated"]);
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const { showError } = useToasts();
const themeStore = useThemeStore();
const baseEditAgentProfileFormRef = ref();
const isSaving = ref(false);

const update = async (newProfile: Profile) => {
  isSaving.value = true;
  try {
    await profilesStore.client.updateProfile(newProfile);

    emit("update:model-value", false);
    emit("profile-updated", newProfile);
  } catch (e) {
    showError(e);
  } finally {
    isSaving.value = false;
  }
};
</script>
