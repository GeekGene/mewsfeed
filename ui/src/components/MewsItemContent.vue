<template>
  <div class="column">
    <div
      class="text-body1"
      style="overflow-wrap: anywhere;"
    >
      <div v-html="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { FeedMew } from "@/types/types";
import { PropType, ref } from "vue";
const props = defineProps({ mewContent: { type: Object as PropType<FeedMew>, required: true } });

const content = ref(props.mewContent.mew.mew?.mew || '');
const hashtagRegex = /#(\w+)/g;
const matches = [...content.value.matchAll(hashtagRegex)];
matches.forEach((captureGroup) => {
  const [hashtag, match] = captureGroup;
  content.value = content.value.replaceAll(hashtag, `<a href="/feed/hashtag/${match}">#${match}</a>`);
});
</script>
