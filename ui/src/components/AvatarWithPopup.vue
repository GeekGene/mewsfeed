<template>
  <agent-avatar
    :agentPubKey="agentPubKey"
    size="50"
    :class="[
      'self-start',
      { 'cursor-pointer': !isCurrentProfile(agentPubKey) },
    ]"
    @click="onAgentClick(agentPubKey)"
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
        :agent-pub-key="agentPubKey"
        @mouseenter="keepShowingProfile"
        @mouseleave="hideProfile"
      />
    </q-menu>
  </agent-avatar>
</template>

<script setup lang="ts">
import { useProfileUtils } from "@/utils/profile";
import { AgentPubKey } from "@holochain/client";
import { PropType, ref } from "vue";
import ProfilePopup from "./ProfilePopup.vue";

defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});

const PROFILE_SHOW_HIDE_DELAY = 400; // in ms

const { isCurrentProfile, onAgentClick } = useProfileUtils();

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
