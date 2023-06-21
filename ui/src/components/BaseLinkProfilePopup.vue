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
    @mouseenter="setPopupVisible(true)"
    @mouseleave="setPopupVisible(false)"
  >
    <div>
      <div><slot></slot></div>
    </div>
  </RouterLink>
  <div v-show="isPopupVisible" class="absolute right-0 w-full z-20 mt-12">
    <div class="flex justify-center">
      <div class="w-full max-w-screen-lg flex items-center sm:space-x-10 px-8">
        <div class="block w-0 sm:w-14 h-14"></div>
        <div
          class="bg-neutral/5 backdrop-blur-md rounded-3xl shadow-xl flex-1 w-full"
        >
          <RouterLink
            :to="{
              name: ROUTES.profile,
              params: { agentPubKey: encodeHashToBase64(agentPubKey) },
            }"
            @click.stop
          >
            <BaseAgentProfileDetail
              :agentPubKey="agentPubKey"
              hide-edit-button
              @mouseenter="setPopupVisible(true)"
              @mouseleave="setPopupVisible(false)"
            />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { encodeHashToBase64 } from "@holochain/client";
import { ROUTES } from "@/router";
import { RouteLocationRaw, RouterLink } from "vue-router";
import BaseAgentProfileDetail from "@/components/BaseAgentProfileDetail.vue";
import { debounce } from "lodash";

defineProps<{
  to?: RouteLocationRaw;
  agentPubKey: Uint8Array;
}>();

const isPopupVisible = ref<boolean>(false);

const setPopupVisible = debounce((val: boolean) => {
  isPopupVisible.value = val;
}, 10);
</script>
