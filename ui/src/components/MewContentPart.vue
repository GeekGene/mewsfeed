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

  <LinkProfilePopup
    v-else-if="(props.contentPart[1] as RouteLocationNamedRaw).name === 'handle'"
    :agentPubKey="decodeHashFromBase64(((props.contentPart[1] as RouteLocationNamedRaw).params as RouteParams)?.agentPubKey as LocationQueryValueRaw as string)"
    :to="props.contentPart[1]"
  >
    {{ props.contentPart[0] }}
  </LinkProfilePopup>
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
import { PropType } from "vue";
import {
  LocationQueryValueRaw,
  RouteLocationNamedRaw,
  RouteLocationRaw,
  RouteParams,
} from "vue-router";
import LinkProfilePopup from "./LinkProfilePopup.vue";

type ContentPart = string | [string, RouteLocationRaw] | [string, string];

const props = defineProps({
  contentPart: { type: Object as PropType<ContentPart>, required: true },
});
</script>

<style lang="sass">
a
    color: $secondary
    font-weight: 600
</style>
