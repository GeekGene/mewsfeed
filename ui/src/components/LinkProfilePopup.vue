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
    @mouseenter="isPopupVisible = true"
    @mouseleave="isPopupVisible = false"
  >
    <div>
      <div><slot></slot></div>
      <Transition name="slide-fade">
        <ProfilePopup
          v-show="isPopupVisible"
          :agentPubKey="agentPubKey"
          style="left: -15px; margin-top: 5px"
        />
      </Transition>
    </div>
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
  agentPubKey: Uint8Array;
}>();

const isPopupVisible = ref<boolean>(false);
</script>
<style scoped>
.slide-fade-enter-active {
  transition: all 0.2s linear;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
