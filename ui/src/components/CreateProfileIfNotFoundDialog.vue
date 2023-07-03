<template>
  <BaseDialog
    :model-value="modelValue"
    dialog-panel-class="md:w-auto"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <profiles-context :store="profilesStore">
      <div class="w-96">
        <h2
          class="text-3xl text-left font-title font-bold tracking-tighter mb-4"
        >
          create profile
        </h2>
        <edit-profile
          v-if="profilesStore && !myProfile"
          class="font-content text-left prose"
          :store="profilesStore"
          @save-profile="createProfile"
        ></edit-profile>
        <slot v-else></slot>
      </div>
    </profiles-context>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ComputedRef, inject } from "vue";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const emit = defineEmits(["update:model-value", "profile-created"]);
defineProps<{
  modelValue: boolean;
}>();

const createProfile = async (e: any) => {
  await profilesStore.client.createProfile(e.detail.profile);
  emit("profile-created", e.detail.profile);
  emit("update:model-value", false);
};
</script>

