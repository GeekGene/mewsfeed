<template>
  <RouterLink
    :to="to"
    class="text-secondary text-bold"
    style="position: relative; display: inline-block; overflow: visible"
    @click.stop
    @mouseenter="showProfile"
    @mouseleave="hideProfile"
  >
    {{ nickname }}

    <q-menu
      v-model="isPopupVisible"
      anchor="bottom middle"
      self="top middle"
      no-focus
    >
      <ProfilePopup :agentPubKey="agentPubKey" />
    </q-menu>
  </RouterLink>
</template>

<script setup lang="ts">
import { AgentPubKey } from "@holochain/client";
import { PropType, ref } from "vue";
import { RouteLocationRaw, RouterLink } from "vue-router";
import ProfilePopup from "./ProfilePopup.vue";

defineProps({
  to: {
    type: Object as PropType<RouteLocationRaw>,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
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
</script>
