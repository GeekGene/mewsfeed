<template>
  <BaseDialog
    :model-value="modelValue"
    dialog-panel-class="md:w-auto bg-base-100"
    :initial-focus-ref="baseEditAgentProfileFormRef?.$refs.usernameInputRef"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <profiles-context :store="profilesStore">
      <div v-if="profilesStore && !myProfile">
        <h2
          class="text-3xl text-left font-title font-bold tracking-tighter mb-4"
        >
          create profile
        </h2>
        <BaseEditAgentProfileForm
          ref="baseEditAgentProfileFormRef"
          @update:model-value="createProfile"
        />
      </div>
      <slot v-else></slot>
    </profiles-context>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ComputedRef, inject, ref } from "vue";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import BaseEditAgentProfileForm from "@/components/BaseEditAgentProfileForm.vue";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const emit = defineEmits(["update:model-value", "profile-created"]);
defineProps<{
  modelValue: boolean;
}>();

const baseEditAgentProfileFormRef = ref();

const createProfile = async (profile: Profile) => {
  await profilesStore.client.createProfile(profile);

  emit("profile-created", profile);
  emit("update:model-value", false);
};
</script>
