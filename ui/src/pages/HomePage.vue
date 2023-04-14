<template>
  <q-page class="text-center" :style-fn="pageHeightCorrection">
    <h6>Meeow, you're in!</h6>
    <h2>Welcome to MewsFeed</h2>
    <q-img width="40%" src="@/assets/img/cat-eating-bird-circle.png" />
  </q-page>
</template>

<script setup lang="ts">
import { pageHeightCorrection } from "@/utils/page-layout";
</script>
