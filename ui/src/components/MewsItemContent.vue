<template>
  <div class="column">
    <div
      class="text-body1"
      style="overflow-wrap: anywhere;"
    >
      <span
        v-for="(contentPart, index) of contentParts"
        :key="index"
      >
        <router-link
          v-if="contentPart.startsWith('#')"
          :to="`/feed/hashtag/${contentPart.substring(1)}`"
          class="text-secondary"
        >
          {{ contentPart }}
        </router-link>

        <template v-else>
          {{ contentPart }}
        </template>
      </span> 
    </div>
  </div>
</template>

<script setup lang="ts">
import { FeedMew } from "@/types/types";
import { PropType, ref } from "vue";
const props = defineProps({ mewContent: { type: Object as PropType<FeedMew>, required: true } });

const content = ref(props.mewContent.mew.mew?.mew || '');
const hashtagRegex = /\B(#\w+)/g;
const contentParts = content.value.split(hashtagRegex);
</script>
