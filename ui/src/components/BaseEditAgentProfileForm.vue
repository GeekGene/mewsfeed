<template>
  <div class="flex-col space-y-4">
    <div class="flex justify-start items-center space-x-8">
      <div class="flex flex-col justify-center items-center">
        <label class="label">
          <span class="label-text">Avatar</span>
        </label>
        <BaseAvatarInput v-model="avatar" />
      </div>

      <div class="form-control flex-1">
        <label class="label">
          <span class="label-text">Nickname *</span>
        </label>
        <input
          ref="usernameInputRef"
          v-model="nickname"
          type="text"
          class="input input-bordered w-full input-lg"
        />
      </div>
    </div>

    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">Display Name</span>
      </label>
      <input
        v-model="displayName"
        type="text"
        class="input input-bordered w-full"
      />
    </div>
    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">Bio</span>
      </label>
      <textarea
        v-model="bio"
        class="textarea textarea-bordered h-24"
      ></textarea>
    </div>

    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">Location</span>
      </label>
      <input
        v-model="location"
        type="text"
        class="input input-bordered w-full"
      />
    </div>

    <button class="btn btn-primary btn-md w-full" @click="save">Save</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Profile } from "@holochain-open-dev/profiles";
import { PROFILE_FIELDS } from "@/types/types";
import BaseAvatarInput from "@/components/BaseAvatarInput.vue";
import { useToasts } from "@/stores/toasts";

const emit = defineEmits(["update:model-value"]);
const props = defineProps<{
  modelValue?: Profile;
}>();
const { showMessage } = useToasts();

const usernameInputRef = ref();
const avatar = ref(props.modelValue?.fields.avatar || "");
const nickname = ref(props.modelValue?.nickname || "");
const displayName = ref(
  props.modelValue?.fields[PROFILE_FIELDS.DISPLAY_NAME] || ""
);
const bio = ref(props.modelValue?.fields[PROFILE_FIELDS.BIO] || "");
const location = ref(props.modelValue?.fields[PROFILE_FIELDS.LOCATION] || "");

const save = async () => {
  const newProfile = {
    nickname: nickname.value,
    fields: {
      [PROFILE_FIELDS.DISPLAY_NAME]: displayName.value,
      [PROFILE_FIELDS.BIO]: bio.value,
      [PROFILE_FIELDS.LOCATION]: location.value,
      avatar: avatar.value,
    },
  } as Profile;

  if (!newProfile.nickname) {
    showMessage("Profile must include a nickname", "error");
    return;
  }

  emit("update:model-value", newProfile);
};
</script>
