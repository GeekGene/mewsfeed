<template>
  <a
    v-if="contentPart.href && contentPart.tagType === MewTagType.RawUrl"
    :href="contentPart.href"
    target="_blank"
    @click.stop
  >
    {{ contentPart.text }}
  </a>
  <a
    v-else-if="contentPart.href && contentPart.tagType === MewTagType.Link"
    :href="contentPart.href"
    target="_blank"
    @click.stop
  >
    {{ contentPart.text }}
    <QTooltip :delay="TOOLTIP_DELAY">{{ contentPart.href }}</QTooltip>
  </a>
  <LinkProfilePopup
    v-else-if="contentPart.route && contentPart.tagType === MewTagType.Mention"
    :agentPubKey="decodeHashFromBase64((contentPart.route as RouteLocationNamedRaw).params?.agentPubKey as LocationQueryValueRaw as string)"
    :to="contentPart.route"
  >
    {{ contentPart.text }}
  </LinkProfilePopup>
  <RouterLink
    v-else-if="
      contentPart.route &&
      (contentPart.tagType === MewTagType.Cashtag ||
        contentPart.tagType === MewTagType.Hashtag)
    "
    :to="contentPart.route"
    class="text-secondary text-bold"
    @click.stop
  >
    {{ contentPart.text }}
  </RouterLink>
</template>
<script setup lang="ts">
import { QTooltip } from "quasar";
import { TOOLTIP_DELAY, MewContentPart, MewTagType } from "@/types/types";
import { decodeHashFromBase64 } from "@holochain/client";
import { PropType } from "vue";
import { LocationQueryValueRaw, RouteLocationNamedRaw } from "vue-router";
import LinkProfilePopup from "./LinkProfilePopup.vue";

defineProps({
  contentPart: { type: Object as PropType<MewContentPart>, required: true },
});
</script>

<style lang="sass">
a
    color: $secondary
    font-weight: 600
</style>
