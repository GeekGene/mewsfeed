<template>
  <q-page
    class="flex justify-center"
    style="width: 50%"
    :style-fn="pageHeightCorrection"
  >
    <my-profile />
  </q-page>
</template>

<script setup lang="ts">
import { pageHeightCorrection } from "@/utils/page-layout";
</script>
