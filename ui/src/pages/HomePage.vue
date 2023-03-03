<template>
  <q-page
    class="text-center"
    :style-fn="pageHeightCorrection"
    style="color: var(--q-content)"
  >
    <h6>Meeow, you're in!</h6>
    <h2>Welcome to the Clutter</h2>
    <q-img width="40%" src="@/assets/img/cat-eating-bird-circle.png" />
  </q-page>
</template>

<script setup lang="ts">
import { pageHeightCorrection } from "@/utils/page-layout";
</script>
