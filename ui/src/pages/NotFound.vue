<template>
  <QPage class="text-center" :style-fn="pageHeightCorrection">
    <h4>You've lost the thread</h4>
    <QBtn
      icon="explore"
      color="accent"
      label="Come back home, Kitty"
      size="md"
      :to="{ name: ROUTES.feed }"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QBtn } from "quasar";
import { ROUTES } from "@/router";
import { pageHeightCorrection } from "@/utils/page-layout";
</script>
