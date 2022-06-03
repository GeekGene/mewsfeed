<template>
  <agent-avatar
    :agent-pub-key="urlSafeAgentPubKey"
    size="50"
    :class="[
      'self-start',
      { 'cursor-pointer': !isCurrentProfile(urlSafeAgentPubKey) },
    ]"
    @click="onAgentClick(urlSafeAgentPubKey)"
    @mouseenter="showProfile"
    @mouseleave="hideProfile"
  >
    <q-menu
      v-model="isPopupVisible"
      anchor="bottom middle"
      self="top middle"
      :offset="[-10, 5]"
      no-focus
    >
      <ProfilePopup
        :agent-pub-key="urlSafeAgentPubKey"
        @mouseenter="keepShowingProfile"
        @mouseleave="hideProfile"
      />
    </q-menu>
  </agent-avatar>
</template>

<script setup lang="ts">
import { getUrlSafeAgentPubKey } from "@/utils/hash";
import { useProfileUtils } from "@/utils/profile";
import { AgentPubKey, HoloHashB64 } from "@holochain/client";
import { PropType, ref } from "vue";
import ProfilePopup from "./ProfilePopup.vue";

const props = defineProps({
  agentPubKey: {
    type: Object as PropType<HoloHashB64 | AgentPubKey>,
    required: true,
  },
});

const PROFILE_SHOW_HIDE_DELAY = 400; // in ms

const { isCurrentProfile, onAgentClick } = useProfileUtils();

const urlSafeAgentPubKey =
  typeof props.agentPubKey === "string"
    ? props.agentPubKey
    : getUrlSafeAgentPubKey(props.agentPubKey);

const isPopupVisible = ref<boolean>(false);
const popupHideTimeout = ref<number>(0);
const popupShowTimeout = ref<number>(0);

const showProfile = () => {
  isPopupVisible.value = false;
  popupShowTimeout.value = window.setTimeout(
    () => (isPopupVisible.value = true),
    PROFILE_SHOW_HIDE_DELAY
  );
};

const hideProfile = () => {
  window.clearTimeout(popupShowTimeout.value);
  popupHideTimeout.value = window.setTimeout(
    () => (isPopupVisible.value = false),
    PROFILE_SHOW_HIDE_DELAY
  );
};

const keepShowingProfile = () => window.clearTimeout(popupHideTimeout.value);
</script>
