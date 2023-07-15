<template>
  <a
    v-if="contentPart.href && contentPart.tagType === MewTagType.RawUrl"
    target="_blank"
    :href="contentPart.href"
    class="text-primary pr-1 hover:underline"
    @click.stop="(e) => openLink(e, contentPart.href as string)"
  >
    {{ contentPart.text }}
  </a>

  <a
    v-else-if="contentPart.href && contentPart.tagType === MewTagType.Link"
    v-tooltip.bottom="{
      content: contentPart.href,
      popperClass: 'text-xs',
      triggers: ['hover'],
    }"
    :href="contentPart.href"
    target="_blank"
    class="text-primary pr-1 hover:underline"
    @click.stop="(e) => openLink(e, contentPart.href as string)"
  >
    {{ contentPart.text }}
  </a>
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
import { open } from "@tauri-apps/api/shell";

defineProps<{
  contentPart: MewContentPart;
}>();

const openLink = (e: Event, url: string) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (window.__TAURI_IPC__) {
    e.preventDefault();
    open(url);
  }
};
</script>
