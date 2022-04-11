<template>
  <div class="column">
    <div class="text-body1" style="overflow-wrap: anywhere">
      <span v-for="(contentPart, index) of contentParts" :key="index">
        <router-link
          v-if="startsWithTag(contentPart)"
          :to="`/${PATH[contentPart[0]]}/${contentPart.substring(1)}`"
          class="text-secondary"
        >
          {{ contentPart }}
        </router-link>

        <template v-else>{{ contentPart }}</template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FeedMew, TAG_SYMBOLS } from "@/types/types";
import { PATH } from "@/router";
import { PropType, ref } from "vue";
const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
});

const content = ref(props.feedMew.mew.content?.text || "");
const regexpString = Object.values(TAG_SYMBOLS).map(
  (symbol) => `\\${symbol}\\w+`
);
const tagRegex = new RegExp(`\\B(${regexpString.join("|")})`, "gi");
const contentParts = content.value.split(tagRegex);

const startsWithTag = (contentPart: string) =>
  Object.values(TAG_SYMBOLS).some((symbol) => contentPart.startsWith(symbol));
</script>
