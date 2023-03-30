<template>
  <a
    v-if="typeof props.contentPart[1] === 'string'"
    :href="props.contentPart[1]"
    target="_blank"
    @click.stop
  >
    {{ props.contentPart[0] }}
    <q-tooltip
      v-if="contentPart[0] !== contentPart[1]"
      :delay="TOOLTIP_DELAY"
      >{{ props.contentPart[1] }}</q-tooltip
    >
  </a>

  <RouterLink
    v-else-if="(props.contentPart[1] as RouteLocationNamedRaw).name === 'handle'"
    :to="props.contentPart[1]"
    class="text-secondary text-bold"
    style="position: relative; display: inline-block; overflow: visible"
    @click.stop
    @mouseenter="showProfilePopup"
    @mouseleave="hideProfilePopup"
  >
    {{ props.contentPart[0] }}
    <ProfilePopup
      v-show="isProfilePopupVisible"
      style="z-index: 20; position: absolute; left: -65px; width: 200px"
      class="text-black text-body1 shadow-3"
      :agentPubKey="decodeHashFromBase64(((props.contentPart[1] as RouteLocationNamedRaw).query as LocationQueryRaw)?.agentPubKey as LocationQueryValueRaw as string)"
    />
  </RouterLink>
  <RouterLink
    v-else
    :to="props.contentPart[1]"
    class="text-secondary text-bold"
    @click.stop
  >
    {{ props.contentPart[0] }}
  </RouterLink>
</template>
<script setup lang="ts">
import { TOOLTIP_DELAY } from "@/types/types";
import { decodeHashFromBase64 } from "@holochain/client";
import { PropType, ref } from "vue";
import {
  LocationQueryRaw,
  LocationQueryValueRaw,
  RouteLocationNamedRaw,
  RouteLocationRaw,
} from "vue-router";
import ProfilePopup from "./ProfilePopup.vue";

type ContentPart = string | [string, RouteLocationRaw] | [string, string];

const props = defineProps({
  contentPart: { type: Object as PropType<ContentPart>, required: true },
});

const isProfilePopupVisible = ref(false);

const showProfilePopup = () => {
  setTimeout(() => {
    if (!isProfilePopupVisible.value) {
      isProfilePopupVisible.value = true;
    }
  }, TOOLTIP_DELAY);
};
const hideProfilePopup = () => {
  isProfilePopupVisible.value = false;
};
</script>

<style lang="sass">
a
    color: $secondary
    font-weight: 600
</style>
