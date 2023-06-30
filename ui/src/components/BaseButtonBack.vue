<template>
  <button
    class="btn btn-ghost btn-md flex items-center px-2 py-0"
    @click="router.back()"
  >
    <IconArrowBack class="text-xl font-title" />
  </button>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import IconArrowBack from "~icons/ion/arrow-back";

const router = useRouter();
</script>
