<template>
  <RouterLink
    :to="
      to || {
        name: ROUTES.profile,
        params: { agentPubKey: encodeHashToBase64(agentPubKey) },
      }
    "
    class="text-secondary text-bold relative inline-block overflow-visible"
    @click.stop
    @mouseenter="isPopupVisible = true"
    @mouseleave="isPopupVisible = false"
  >
    <div>
      <div><slot></slot></div>
    </div>
  </RouterLink>
  <Transition name="slide-fade">
    <div v-show="isPopupVisible" class="absolute right-0 mt-12 w-full z-20">
      <div class="flex justify-center">
        <div
          class="w-full max-w-screen-lg flex items-center sm:space-x-10 px-8"
        >
          <div class="block w-0 sm:w-14 h-14"></div>
          <div
            class="bg-neutral/5 backdrop-blur-md rounded-3xl shadow-xl flex-1 w-full"
          >
            <ProfilePopupContent :agentPubKey="agentPubKey" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { encodeHashToBase64 } from "@holochain/client";
import { ROUTES } from "@/router";
import { RouteLocationRaw, RouterLink } from "vue-router";
import ProfilePopupContent from "@/components/ProfilePopupContent.vue";

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
