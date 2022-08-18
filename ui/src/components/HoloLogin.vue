<template>
  <template v-if="!holoStore.isAnonymous && holoStore.isAvailable">
    <slot />
  </template>
</template>

<script setup lang="ts">
import { useHoloStore } from "@/stores";
import { onMounted, watch } from "vue";
import { useRouter } from "vue-router";

const holoStore = useHoloStore();
const router = useRouter();

onMounted(() => {
  if (holoStore.isAnonymous) {
    holoStore.signUp();
  }
});

watch(
  () => holoStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      holoStore.isAuthFormOpen = false;
      setTimeout(
        () =>
          router.push(
            typeof router.currentRoute.value.params.nextUrl === "string"
              ? router.currentRoute.value.params.nextUrl
              : "/feed"
          ),
        10
      );
    }
  }
);
watch(
  () => holoStore.isAnonymous,
  (isAnonymous) => {
    console.log("isAnonymous changed", isAnonymous);
    if (isAnonymous && !holoStore.isAuthFormOpen) {
      holoStore.signUp();
    }
  }
);
</script>

<style>
html {
  overflow-y: scroll;
}
body,
html {
  height: 100%;
}
#app {
  font-family: "Nunito Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #fafcfe;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
