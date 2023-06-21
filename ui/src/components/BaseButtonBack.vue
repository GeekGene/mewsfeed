<template>
  <button class="btn btn-ghost btn-xs flex items-center" @click="router.back()">
    <IconArrowBack />
    <div>Back</div>
  </button>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import IconArrowBack from "~icons/ion/arrow-back";

const router = useRouter();
</script>
