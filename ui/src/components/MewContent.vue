<template>
  <div class="column">
    <div class="text-body1" style="overflow-wrap: anywhere">
      <span v-for="(contentPart, index) of contentParts" :key="index">
        <router-link
          v-if="contentPart[1]"
          :to="contentPart[1]"
          class="text-secondary text-bold"
        >
          {{ contentPart[0] }}
        </router-link>

        <template v-else>{{ contentPart[0] }}</template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FeedMew, LinkTargetName, TAG_SYMBOLS } from "@/types/types";
import { TAG_REGEX } from "@/utils/tags";
import { PATH, ROUTES } from "@/router";
import { PropType } from "vue";
import { RouteLocationRaw } from "vue-router";
import { serializeHash } from "@holochain-open-dev/utils";
const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
});

const startsWithTag = (contentPart: string) =>
  Object.values(TAG_SYMBOLS).some((symbol) => contentPart.startsWith(symbol));

const mentions = props.feedMew.mew.content?.links?.slice().reverse();
const content = props.feedMew.mew.content?.text || "";
const parts = content.split(TAG_REGEX).filter((part) => Boolean(part));

const contentParts: Array<[string] | [string, RouteLocationRaw]> = parts.map(
  (part) => {
    if (startsWithTag(part)) {
      let agentPubKey = "";
      if (part[0] === TAG_SYMBOLS.MENTION) {
        const mention = mentions?.pop()?.[LinkTargetName.Mention];
        // formality, mention must exist
        agentPubKey = mention ? serializeHash(mention) : "";
      }
      const to: RouteLocationRaw = {
        name: ROUTES[PATH[part[0]]],
        params: { tag: part.substring(1) },
        query: { agentPubKey: agentPubKey || undefined },
      };
      return [part, to];
    }
    return [part];
  }
);
</script>
