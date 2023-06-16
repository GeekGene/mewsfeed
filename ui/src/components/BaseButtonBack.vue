<template>
  <QBtn flat @click="router.back()">
    <QIcon
      name="arrow_right_alt"
      size="lg"
      style="transform: rotate(180deg); font-weight: 100"
    />
    Back
  </QBtn>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { QBtn, QIcon } from "quasar";

const router = useRouter();
</script>
