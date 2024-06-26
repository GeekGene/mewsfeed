<template>
  <div class="w-full h-full flex flex-col justify-center items-center">
    <h1 class="text-2xl font-title font-bold tracking-tighter mb-8">
      you've lost the thread
    </h1>

    <RouterLink class="btn btn-primary btn-xl" :to="{ name: ROUTES.feed }">
      Come back home, Kitty
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
</script>
