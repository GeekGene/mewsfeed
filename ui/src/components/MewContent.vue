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
import { FeedMew, LinkTargetName, MentionLinkTarget } from "@/types/types";
import {
  isRawUrl,
  isTag,
  splitMewTextIntoParts,
  TAG_SYMBOLS,
} from "@/utils/tags";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
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
    const partIsTag = isTag(part);

    if (partIsTag && part[0] === TAG_SYMBOLS.MENTION) {
      const link = links.value?.pop();
      if (!link) return part;

      const agentPubKey = (link as MentionLinkTarget)[
        LinkTargetName.Mention
      ] as AgentPubKey;
      const agentPubKeyB64 = encodeHashToBase64(agentPubKey);
      const to: RouteLocationRaw = {
        name: ROUTES[PATH[part[0]]],
        params: { tag: part.substring(1), agentPubKey: agentPubKeyB64 },
      };

      return [part, to];
    } else if (partIsTag && part[0] === TAG_SYMBOLS.LINK) {
      const link = links.value?.pop();
      if (!link) return part;

      const to: RouteLocationRaw = {
        name: ROUTES[PATH[part[0]]],
        params: { tag: part.substring(1) },
      };

      return [part, to];
    } else if (
      partIsTag &&
      (part[0] === TAG_SYMBOLS.CASHTAG || part[0] === TAG_SYMBOLS.HASHTAG)
    ) {
      const to: RouteLocationRaw = {
        name: ROUTES[PATH[part[0]]],
        params: { tag: part.substring(1) },
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
