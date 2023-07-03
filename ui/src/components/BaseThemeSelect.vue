<template>
  <div class="dropdown dropdown-hover dropdown-bottom dropdown-end">
    <label tabindex="0">
      <IconSwatchesFill class="text-2xl" />
    </label>
    <ul
      tabindex="0"
      class="dropdown-content menu z-40 px-0 shadow-md bg-base-100 text-base-content rounded-box max-h-64 overflow-scroll flex-nowrap"
    >
      <li
        v-for="theme in store.themesDisplay"
        :key="theme.name"
        class="text-xs w-full"
        :value="theme.name"
      >
        <a
          class="w-full py-2 px-8 capitalize"
          :class="{ 'bg-base-300': theme.active }"
          @click="(e: any) => store.set(theme.name)"
        >
          {{ theme.name }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { useThemeStore } from "../stores/theme";
import IconSwatchesFill from "~icons/ph/swatches-fill";

const store = useThemeStore();
</script>
