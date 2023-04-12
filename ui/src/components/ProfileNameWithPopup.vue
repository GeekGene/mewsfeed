<template>
  <RouterLink
    :to="
      to || {
        name: ROUTES.profiles,
        params: { agent: encodeHashToBase64(agentPubKey) },
      }
    "
    class="text-secondary text-bold"
    style="position: relative; display: inline-block; overflow: visible"
    @click.stop
    @mouseenter="showProfile"
    @mouseleave="hideProfile"
  >
    {{ nickname }}

    <ProfilePopup
      v-show="isPopupVisible"
      :agentPubKey="agentPubKey"
      style="left: -15px; top: 15px"
    />
  </RouterLink>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { encodeHashToBase64 } from "@holochain/client";
import { ROUTES } from "@/router";
import { RouteLocationRaw, RouterLink } from "vue-router";
import ProfilePopup from "./ProfilePopup.vue";

defineProps<{
  to?: RouteLocationRaw;
  nickname: string;
  agentPubKey: Uint8Array;
}>();

const PROFILE_SHOW_HIDE_DELAY = 400; // in ms

const isPopupVisible = ref<boolean>(false);
const popupHideTimeout = ref<number>(0);
const popupShowTimeout = ref<number>(0);

const showProfile = () => {
  window.clearTimeout(popupHideTimeout.value);

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
