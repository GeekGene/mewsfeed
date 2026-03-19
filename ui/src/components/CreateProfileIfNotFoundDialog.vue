<template>
  <BaseDialog
    :model-value="modelValue"
    dialog-panel-class="md:w-auto bg-base-100"
    :initial-focus-ref="baseEditAgentProfileFormRef?.$refs.usernameInputRef"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div :data-theme="themeStore.active">
      <profiles-context :store="profilesStore">
        <div v-if="profilesStore && !myProfile">
          <h2
            class="text-3xl text-left font-title font-bold tracking-tighter mb-4"
          >
            create profile
          </h2>
          <BaseEditAgentProfileForm
            ref="baseEditAgentProfileFormRef"
            :saving="isSaving"
            @update:model-value="createProfile"
          />
        </div>
        <slot v-else></slot>
      </profiles-context>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ComputedRef, inject, ref } from "vue";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import BaseEditAgentProfileForm from "@/components/BaseEditAgentProfileForm.vue";
import { useThemeStore } from "@/stores/theme";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const themeStore = useThemeStore();
const emit = defineEmits(["update:model-value", "profile-created"]);
defineProps<{
  modelValue: boolean;
}>();

const baseEditAgentProfileFormRef = ref();
const isSaving = ref(false);

const createProfile = async (profile: Profile) => {
  isSaving.value = true;
  try {
    await profilesStore.client.createProfile(profile);
    emit("profile-created", profile);
    emit("update:model-value", false);
  } finally {
    isSaving.value = false;
  }
};
</script>
