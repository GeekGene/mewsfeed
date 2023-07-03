<template>
  <template v-if="!client.agent.isAnonymous && client.agent.isAvailable">
    <slot />
  </template>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
import WebSdkApi from "@holo-host/web-sdk";
import { ComputedRef, inject, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

const client = (inject("client") as ComputedRef<WebSdkApi>).value;
const router = useRouter();

onMounted(() => {
  if (client.agent.isAnonymous) {
    client.signUp({});
  }
});

watch(
  () => client.agent.isAvailable,
  (isLoggedIn) => {
    if (isLoggedIn) {
      router.replace({ name: ROUTES.feed, force: true });
    }
  }
);

watch(
  () => client.agent.isAnonymous,
  () => {
    if (client?.agent.isAnonymous) {
      client.signUp({});
    }
  }
);
</script>
