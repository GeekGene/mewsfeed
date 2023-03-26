<template>
  <div class="column">
    <div
      class="text-body1"
      style="overflow-wrap: anywhere; white-space: pre-line"
    >
      <span v-for="(contentPart, index) of contentParts" :key="index">
        <MewContentPart
          v-if="Array.isArray(contentPart)"
          :content-part="contentPart"
        />
        <template v-else>{{ contentPart }}</template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PATH, ROUTES } from "@/router";
import { FeedMew, LinkTargetName } from "@/types/types";
import {
  isRawUrl,
  isTag,
  splitMewTextIntoParts,
  TAG_SYMBOLS,
} from "@/utils/tags";
import { encodeHashToBase64 } from "@holochain/client";
import { computed, PropType } from "vue";
import { RouteLocationRaw } from "vue-router";
import MewContentPart from "./MewContentPart.vue";

type ContentPart = string | [string, RouteLocationRaw] | [string, string];

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
});

const links = computed(() =>
  props.feedMew.mew.content?.links?.slice().reverse()
);
const content = computed(() => props.feedMew.mew.content?.text || "");
const parts = computed(() => splitMewTextIntoParts(content.value));

const contentParts = computed<ContentPart[]>(() =>
  parts.value.map((part) => {
    if (isTag(part)) {
      let agentPubKey: string | undefined = undefined;
      if (part[0] === TAG_SYMBOLS.MENTION || part[0] === TAG_SYMBOLS.URL) {
        const link = links.value?.pop();
        if (!link) {
          return part;
        }
        if (LinkTargetName.Mention in link) {
          const mention = link[LinkTargetName.Mention];
          agentPubKey = encodeHashToBase64(mention);
        } else if (LinkTargetName.URL in link) {
          const url = link[LinkTargetName.URL];
          return [part, url];
        }
      }
      const to: RouteLocationRaw = {
        name: ROUTES[PATH[part[0]]],
        params: { tag: part.substring(1) },
        query: { agentPubKey },
      };
      return [part, to];
    } else if (isRawUrl(part)) {
      return [part, part];
    }

    return part;
  })
);
</script>

<style lang="sass">
a
    color: $secondary
    font-weight: 600
</style>
