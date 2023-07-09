<template>
  <RouterLink
    :to="
      to || {
        name: ROUTES.profile,
        params: { agentPubKey: encodeHashToBase64(agentPubKey) },
      }
    "
    class="text-primary text-bold inline-block"
    v-bind="$attrs"
    @click.stop
    @mouseenter="setPopupVisible(true)"
    @mouseleave="setPopupVisible(false)"
  >
    <slot></slot>
  </RouterLink>
  <div
    v-show="isPopupVisible"
    class="absolute right-0 w-full z-20"
    :class="popupClass"
  >
    <div class="flex justify-center">
      <div
        class="w-full max-w-screen-md flex justify-start items-center sm:space-x-10 px-2 sm:px-8"
      >
        <div class="block w-0 sm:w-14 h-14 flex-none"></div>
        <div
          class="bg-neutral/5 backdrop-blur-md rounded-3xl flex-initial"
          style="-webkit-backdrop-filter: blur(10px)"
        >
          <RouterLink
            :to="{
              name: ROUTES.profile,
              params: { agentPubKey: encodeHashToBase64(agentPubKey) },
            }"
            @click.stop
          >
            <AgentProfileDetail
              :agentPubKey="agentPubKey"
              hide-edit-button
              :big-follow-button="false"
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
import AgentProfileDetail from "@/components/AgentProfileDetail.vue";
import { debounce } from "lodash";

const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw;
    agentPubKey: Uint8Array;
    enabled?: boolean;
    popupClass?: string;
  }>(),
  {
    to: undefined,
    enabled: true,
    popupClass: "",
  }
);

const isPopupVisible = ref<boolean>(false);

const setPopupVisible = debounce((val: boolean) => {
  if (props.enabled) {
    isPopupVisible.value = val;
  }
}, 50);
</script>
