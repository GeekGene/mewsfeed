<template>
  <div class="column">
    <div class="text-body1" style="overflow-wrap: anywhere">
      <span v-for="(contentPart, index) of contentParts" :key="index">
        <router-link
          v-if="contentPart[1]"
          :to="contentPart[1]"
          class="text-secondary text-bold"
          @click.stop
        >
          {{ contentPart[0] }}
        </router-link>

        <template v-else>{{ contentPart[0] }}</template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PATH, ROUTES } from "@/router";
import { FeedMew, LinkTargetName } from "@/types/types";
import { TAG_REGEX, TAG_SYMBOLS } from "@/utils/tags";
import { serializeHash } from "@holochain-open-dev/utils";
import { computed, PropType } from "vue";
import { RouteLocationRaw } from "vue-router";

type ContentPart = [string] | [string, RouteLocationRaw];

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
});

const startsWithTag = (contentPart: string) =>
  Object.values(TAG_SYMBOLS).some((symbol) => contentPart.startsWith(symbol));

const mentions = computed(() =>
  props.feedMew.mew.content?.links?.slice().reverse()
);
const content = computed(() => props.feedMew.mew.content?.text || "");
const parts = computed(() =>
  content.value.split(TAG_REGEX).filter((part) => Boolean(part))
);

const contentParts = computed<ContentPart[]>(() =>
  parts.value.map((part) => {
    if (startsWithTag(part)) {
      let agentPubKey = "";
      if (part[0] === TAG_SYMBOLS.MENTION) {
        const mention = mentions.value?.pop()?.[LinkTargetName.Mention];
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
  })
);
</script>
