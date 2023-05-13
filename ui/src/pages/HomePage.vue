<template>
  <QPage class="text-center" :style-fn="pageHeightCorrection">
    <h6>Meeow, you're in!</h6>
    <h2>Welcome to MewsFeed</h2>
    <QImg width="40%" src="@/assets/img/cat-eating-bird-circle.png" />
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QImg } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
</script>
