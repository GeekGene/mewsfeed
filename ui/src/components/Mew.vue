<template>
  <div>
    {{ mewContent.mew.mewType.original.mew }}
  </div>
</template>

<script setup lang="ts">
import { FeedMew } from '../types/types';
import { PropType } from 'vue';
defineProps({ mewContent: { type: Object as PropType<FeedMew>, required: true } });
</script>
