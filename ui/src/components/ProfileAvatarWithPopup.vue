<template>
  <RouterLink
    class="text-secondary text-bold"
    style="position: relative; display: inline-block; overflow: visible"
    :to="{
      name: ROUTES.profiles,
      params: { agent: encodeHashToBase64(agentPubKey) },
    }"
    @click.stop
    @mouseenter="showProfile"
    @mouseleave="hideProfile"
  >
    <agent-avatar
      :agentPubKey="agentPubKey"
      disable-tooltip
      size="50"
      class="self-start"
    >
    </agent-avatar>

    <ProfilePopup
      v-show="isPopupVisible"
      :agentPubKey="agentPubKey"
      style="left: -15px; top: 30px"
    />
  </RouterLink>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { PropType, ref } from "vue";
import ProfilePopup from "./ProfilePopup.vue";

defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});

const PROFILE_SHOW_HIDE_DELAY = 400; // in ms

const isPopupVisible = ref<boolean>(false);
const popupHideTimeout = ref<number>(0);
const popupShowTimeout = ref<number>(0);

const showProfile = () => {
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
</script>
