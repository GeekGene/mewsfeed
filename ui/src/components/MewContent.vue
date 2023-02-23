<template>
  <div class="column">
    <div class="text-body1" style="overflow-wrap: anywhere">
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
import { TAG_REGEX, TAG_SYMBOLS } from "@/utils/tags";
import { serializeHash } from "@holochain-open-dev/utils";
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
const parts = computed(() =>
  content.value.split(TAG_REGEX).filter((part) => Boolean(part))
);

const contentParts = computed<ContentPart[]>(() =>
  parts.value.map((part) => {
    if (part.match(TAG_REGEX)) {
      let agentPubKey: string | undefined = undefined;
      if (part[0] === TAG_SYMBOLS.MENTION || part[0] === TAG_SYMBOLS.URL) {
        const link = links.value?.pop();
        if (!link) {
          return part;
        }
        if (LinkTargetName.Mention in link) {
          const mention = link[LinkTargetName.Mention];
          agentPubKey = serializeHash(mention);
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
