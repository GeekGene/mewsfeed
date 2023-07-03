<template>
  <a
    v-if="contentPart.href && contentPart.tagType === MewTagType.RawUrl"
    :href="contentPart.href"
    target="_blank"
    class="text-primary pr-1"
    @click.stop
  >
    {{ contentPart.text }}
  </a>
  <div
    v-else-if="contentPart.href && contentPart.tagType === MewTagType.Link"
    class="tooltip tooltip-bottom"
    :data-tip="contentPart.href"
  >
    <a
      :href="contentPart.href"
      target="_blank"
      class="text-primary pr-1"
      @click.stop
    >
      {{ contentPart.text }}
    </a>
  </div>
  <BaseLinkProfilePopup
    v-else-if="contentPart.route && contentPart.tagType === MewTagType.Mention"
    :agentPubKey="decodeHashFromBase64((contentPart.route as RouteLocationNamedRaw).params?.agentPubKey as LocationQueryValueRaw as string)"
    :to="contentPart.route"
    class="pr-1"
    popup-class="mt-0"
  >
    {{ contentPart.text }}
  </BaseLinkProfilePopup>
  <RouterLink
    v-else-if="
      contentPart.route &&
      (contentPart.tagType === MewTagType.Cashtag ||
        contentPart.tagType === MewTagType.Hashtag)
    "
    :to="contentPart.route"
    class="text-primary text-bold pr-1"
    @click.stop
  >
    {{ contentPart.text }}
  </RouterLink>
</template>
<script setup lang="ts">
import { MewContentPart, MewTagType } from "@/types/types";
import { decodeHashFromBase64 } from "@holochain/client";
import { LocationQueryValueRaw, RouteLocationNamedRaw } from "vue-router";
import BaseLinkProfilePopup from "./BaseLinkProfilePopup.vue";

defineProps<{
  contentPart: MewContentPart;
}>();
</script>
