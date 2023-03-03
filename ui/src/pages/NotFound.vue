<template>
  <q-page class="text-center" :style-fn="pageHeightCorrection">
    <h4>You've lost the thread</h4>
    <q-btn
      icon="explore"
      color="accent"
      label="Come back home, Kitty"
      size="md"
      :to="{ name: ROUTES.home }"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
import { pageHeightCorrection } from "@/utils/page-layout";
</script>
